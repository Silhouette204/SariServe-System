import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();


function toLocalDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function percentChange(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
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

    const userId = req.session.userId;

    res.set('Cache-Control', 'no-store');

    const timeframe = req.query.timeframe || 'this-week';
    const now = new Date();

    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const monthStart = startOfMonth(now);

    const { start, end, groupBy } = getTimeframeRange(timeframe, now);

    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(monthStart);
    
    const [todaySales, yesterdaySales, monthSales, prevMonthSales, chartSales, recentSales] =
      await Promise.all([
        prisma.sale.findMany({
          where: {userId, createdAt: { gte: todayStart, lt: tomorrowStart } },
          include: { items: true },
        }),
    
        prisma.sale.findMany({
          where: {userId, createdAt: { gte: yesterdayStart, lt: todayStart } },
        }),
    
        prisma.sale.findMany({
          where: {userId, createdAt: { gte: monthStart, lt: tomorrowStart } },
        }),
    
        // BAGO: sales mula nakaraang buwan — para sa Monthly Revenue % change
        prisma.sale.findMany({
          where: {userId, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
        }),
    
        prisma.sale.findMany({
          where: { userId, createdAt: { gte: start, lt: end } },
          orderBy: { createdAt: 'asc' },
        }),
    
        prisma.sale.findMany({
          where: {userId},
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

// BAGO: "kahapon" at "nakaraang buwan" na values, para sa comparison
const prevTodayRevenue = yesterdaySales.reduce((sum, s) => sum + peso(s.totalAmount), 0);
const prevTotalTransactions = yesterdaySales.length;
const prevAvgSale = prevTotalTransactions ? prevTodayRevenue / prevTotalTransactions : 0;
const prevMonthlyRevenue = prevMonthSales.reduce((sum, s) => sum + peso(s.totalAmount), 0);

// BAGO: percentage changes
const todayRevenueChange = percentChange(todayRevenue, prevTodayRevenue);
const totalTransactionsChange = percentChange(totalTransactions, prevTotalTransactions);
const avgSaleChange = percentChange(avgSale, prevAvgSale);
const monthlyRevenueChange = percentChange(monthlyRevenue, prevMonthlyRevenue);

// BAGO: ilang araw na ang lumipas sa kasalukuyang buwan
const completedDays = now.getDate();

    // ===== 2. Chart (base sa timeframe) =====
    const labels = [];
    const values = [];

    if (groupBy === 'day') {
      const buckets = new Map();
      const dayCount = Math.round((end - start) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const key = toLocalDateKey(date); 
        labels.push(date.toLocaleDateString('en-PH', { weekday: 'short' }));
        buckets.set(key, 0);
      }

 chartSales.forEach((sale) => {
  const key = toLocalDateKey(sale.createdAt);   // ← dapat pareho sa buckets
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
    
      // BAGO: buod ng mga binili, hal. "2x Coca-Cola, 1x Pancit Canton"
      const itemsSummary = sale.items
        .map((item) => `${item.quantity}x ${item.product.name}`)
        .join(', ');
    
      return {
        invoiceId: `INV-${String(sale.id).padStart(4, '0')}`,
        customerName: 'Walk-in Customer',
        itemCount,
        itemsSummary,   // BAGO
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
      where: { id: { in: topProductIds }, userId },
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
        prevTodayRevenue,
        prevTotalTransactions,
        todayRevenueChange,
        totalTransactionsChange,
        avgSaleChange,
        monthlyRevenueChange,
        completedDays,
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