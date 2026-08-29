import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// ===== HELPER: i-compute ang aging start, balance, status ng isang customer =====
function computeCustomerStatus(customer, now) {
  const events = [
    ...customer.transactions.map((t) => ({
      date: new Date(t.createdAt),
      delta: Number(t.amount),
      type: 'utang',
    })),
    ...customer.payments.map((p) => ({
      date: new Date(p.paidAt),
      delta: -Number(p.amountPaid),
      type: 'payment',
    })),
  ].sort((a, b) => a.date - b.date);

  let runningBalance = 0;
  let agingStart = null;

  events.forEach((e) => {
    if (runningBalance === 0 && e.type === 'utang') {
      agingStart = e.date; // bagong "cycle" nagsisimula dito
    }
    runningBalance += e.delta;
    if (runningBalance < 0) runningBalance = 0; // safety, hindi dapat negative
  });

  const totalDebt = customer.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
  const balance = Math.max(0, totalDebt - totalPaid);

  if (balance === 0) {
    return { status: 'paid', daysOverdue: 0, totalDebt, totalPaid, balance, canAddUtang: true };
  }

  const daysOverdue = agingStart
    ? Math.floor((now - agingStart) / (1000 * 60 * 60 * 24))
    : 0;

  let status = 'current';
  if (daysOverdue >= 7) status = 'critical';
  else if (daysOverdue >= 4) status = 'overdue';

  return {
    status,
    daysOverdue,
    totalDebt,
    totalPaid,
    balance,
    canAddUtang: status === 'current',
  };
}

// ===== GET /api/utang — listahan ng lahat ng customers =====
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const now = new Date();

    const customers = await prisma.customer.findMany({
      include: { transactions: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => {
      const computed = computeCustomerStatus(c, now);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        ...computed,
        payments: c.payments
          .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
          .map((p) => ({ amount: Number(p.amountPaid), date: p.paidAt })),
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ===== POST /api/utang — magdagdag ng bagong customer + unang utang =====
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, initialUtang } = req.body;

    if (!name || !phone || initialUtang == null) {
      return res.status(400).json({ error: 'Name, phone, at initial utang ay required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        transactions: {
          create: [{ amount: Number(initialUtang), customerName: name }],
        },
      },
      include: { transactions: true, payments: true },
    });

    const computed = computeCustomerStatus(customer, new Date());

    res.status(201).json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      ...computed,
      payments: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// ===== POST /api/utang/:id/debt — magdagdag ng bagong utang sa existing customer =====
router.post('/:id/debt', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { transactions: true, payments: true },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const computed = computeCustomerStatus(customer, new Date());

    if (!computed.canAddUtang) {
      return res.status(403).json({
        error: `Hindi pwedeng dumagdag ng utang — ${computed.status} na ang status ng customer na ito. Kailangan munang bayaran.`,
      });
    }

    await prisma.utangTransaction.create({
      data: { customerId: id, amount: Number(amount), customerName: customer.name },
    });

    const updated = await prisma.customer.findUnique({
      where: { id },
      include: { transactions: true, payments: true },
    });

    res.json({ id: updated.id, name: updated.name, ...computeCustomerStatus(updated, new Date()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add debt' });
  }
});

// ===== POST /api/utang/:id/payment — mag-record ng bayad =====
router.post('/:id/payment', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { transactions: true, payments: true },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const before = computeCustomerStatus(customer, new Date());

    if (Number(amount) > before.balance) {
      return res.status(400).json({ error: 'Ang bayad ay hindi dapat lumagpas sa balance' });
    }

    await prisma.utangPayment.create({
      data: { customerId: id, amountPaid: Number(amount), customerName: customer.name },
    });

    const updated = await prisma.customer.findUnique({
      where: { id },
      include: { transactions: true, payments: true },
    });

    const computed = computeCustomerStatus(updated, new Date());

    res.json({
      id: updated.id,
      name: updated.name,
      ...computed,
      payments: updated.payments
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
        .map((p) => ({ amount: Number(p.amountPaid), date: p.paidAt })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ===== GET /api/utang/stats — KPI cards =====
router.get('/stats', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const now = new Date();

    const customers = await prisma.customer.findMany({
      include: { transactions: true, payments: true },
    });

    let totalUtang = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    // BAGO: bilangin lang ang customers na may balance pa (hindi pa fully paid)
const activeCustomerCount = customers.filter((c) => {
  const computed = computeCustomerStatus(c, now);
  return computed.balance > 0;
}).length;

res.json({
  totalUtang,
  totalPaid,
  balance: totalUtang - totalPaid,
  totalCustomers: activeCustomerCount,   // ← binago
  overdueCount,
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch utang stats' });
  }
});

// ===== GET /api/utang/payments/recent — lahat ng payments, pinagsama =====
router.get('/payments/recent', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');

    const payments = await prisma.utangPayment.findMany({
      include: { customer: true },
      orderBy: { paidAt: 'desc' },
      take: 20,
    });

    res.json(
      payments.map((p) => ({
        customerName: p.customer.name,
        amount: Number(p.amountPaid),
        date: p.paidAt,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recent payments' });
  }
});

export default router;