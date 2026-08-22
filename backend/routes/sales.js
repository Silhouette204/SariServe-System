import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Helper: simula ng araw (12:00 AM) ng isang date
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: simula ng buwan
function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: kunin ang date range base sa timeframe dropdown
function getTimeframeRange(timeframe, now) {
  const todayStart = startOfDay(now);

  if (timeframe === 'last-week') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 13);
    const end = new Date(todayStart);
    end.setDate(end.getDate() - 6);
    return { start, end, groupBy: 'day', days: 7 };
  }

  if (timeframe === 'last-month') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 29);
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 1);
    return { start, end, groupBy: 'week', days: 30 };
  }

  // default: this-week
  const start = new Date(todayStart);
  start.setDate(start.getDate() - 6);
  const end = new Date(todayStart);
  end.setDate(end.getDate() + 1);
  return { start, end, groupBy: 'day', days: 7 };
}

// GET /api/sales/dashboard?timeframe=this-week
router.get('/dashboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'this-week';
    const now = new Date();

    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const monthStart = startOfMonth(now);

    const { start, end, groupBy } = getTimeframeRange(timeframe, now);

    const [todaySales, yesterdaySales, monthSales, chartSales, recentSales] =
      await Promise.all([
        // Today's sales — para sa Today's Revenue at Total Transaction
        prisma.sale.findMany({
          where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
          include: { items: true },
        }),

        // Yesterday's sales — para sa "vs yesterday" comparison
        prisma.sale.findMany({
          where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
        }),

        // This month's sales — para sa Monthly Revenue
        prisma.sale.findMany({
          where: { createdAt: { gte: monthStart, lt: tomorrowStart } },
        }),

        // Sales sa loob ng napiling timeframe — para sa chart
        prisma.sale.findMany({
          where: { createdAt: { gte: start, lt: end } },
          orderBy: { createdAt: 'asc' },
        }),

        // Pinaka-huling 10 sales — para sa Recent Sales table
        prisma.sale.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        }),
      ]);

    const peso = (val) => Number(val || 0);

    // ===== 1. KPIs =====
    const todayRevenue = todaySales.reduce((sum, s) => sum + peso(s.totalAmount), 0);
    const totalTransactions = todaySales.length;
    const avgSale = totalTransactions ? todayRevenue / totalTransactions : 0;
    const monthlyRevenue = monthSales.reduce((sum, s) => sum + peso(s.totalAmount), 0);

    // ===== 2. Chart (base sa timeframe) =====
    const labels = [];
    const values = [];

    if (groupBy === 'day') {
      const buckets = new Map();
      const dayCount = Math.round((end - start) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const key = date.toISOString().slice(0, 10);
        labels.push(date.toLocaleDateString('en-PH', { weekday: 'short' }));
        buckets.set(key, 0);
      }

      chartSales.forEach((sale) => {
        const key = new Date(sale.createdAt).toISOString().slice(0, 10);
        buckets.set(key, (buckets.get(key) || 0) + peso(sale.totalAmount));
      });

      buckets.forEach((amount) => values.push(amount));
    } else {
      // groupBy === 'week' (para sa last-month) — 4 na weekly buckets
      const weeklyTotals = [0, 0, 0, 0];

      chartSales.forEach((sale) => {
        const daysDiff = Math.floor((sale.createdAt - start) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(daysDiff / 7));
        weeklyTotals[weekIndex] += peso(sale.totalAmount);
      });

      labels.push('Week 1', 'Week 2', 'Week 3', 'Week 4');
      values.push(...weeklyTotals);
    }

    // ===== 3. Recent Sales table =====
    const recentSalesFormatted = recentSales.map((sale) => {
      const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
      const createdAt = new Date(sale.createdAt);

      return {
        invoiceId: `INV-${String(sale.id).padStart(4, '0')}`,
        customerName: 'Walk-in Customer',
        itemCount,
        paymentMethod: 'Cash',
        time: createdAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
        date: createdAt.toDateString() === todayStart.toDateString() ? 'Today' : createdAt.toLocaleDateString('en-PH'),
        totalAmount: peso(sale.totalAmount),
      };
    });

    // ===== 4. Top Products (ngayong araw lang) =====
    const productTotals = new Map();

    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.productId;
        const existing = productTotals.get(key) || { soldCount: 0, totalRevenue: 0 };
        existing.soldCount += item.quantity;
        existing.totalRevenue += peso(item.priceAtSale) * item.quantity;
        productTotals.set(key, existing);
      });
    });

    const topProductIds = [...productTotals.entries()]
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 5)
      .map(([productId]) => productId);

    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });

    const topProducts = topProductIds.map((id) => {
      const product = topProductDetails.find((p) => p.id === id);
      const totals = productTotals.get(id);
      return {
        name: product?.name || 'Unknown',
        soldCount: totals.soldCount,
        totalRevenue: totals.totalRevenue,
      };
    });

    res.json({
      kpis: {
        todayRevenue,
        totalTransactions,
        avgSale,
        monthlyRevenue,
      },
      chart: { labels, values },
      recentSales: recentSalesFormatted,
      topProducts,
    });
  } catch (error) {
    console.error('Sales dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch sales dashboard' });
  }
});

export default router;