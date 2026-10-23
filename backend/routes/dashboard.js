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

function percentChange(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
}

router.get('/stats', async (req, res) => {
  try {

    const userId = req.session.userId;

    res.set('Cache-Control', 'no-store');

    const now = new Date();

    // Start ng araw ngayon
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Huling 7 araw, kasama ngayon
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const [todaySales, prevTodaySales, totalProducts, lowStockItems, weekSales, totalProductsYesterday, allProducts, todaySaleItems, todayAdjustments, utangCustomers] =

    await Promise.all([
      prisma.sale.findMany({
        where: { userId, createdAt: { gte: todayStart, lt: tomorrowStart } },
        include: {
          items: { include: { product: { include: { category: true } } } },
        },
      }),
  
      prisma.sale.findMany({
        where: { userId, createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
  
      prisma.product.count({ where: { userId } }),
  
      prisma.product.findMany({
        where: { userId, stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
      }),
  
      prisma.sale.findMany({
        where: { userId, createdAt: { gte: weekStart } },
        include: {
          items: { include: { product: { include: { category: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
  
      // BAGO: bilang ng products na existed na bago mag-umaga ngayon
      prisma.product.count({
        where: { userId, createdAt: { lt: todayStart } },
      }),
  
      // BAGO: kailangan natin ng kasalukuyang stock ng LAHAT ng products
      // para ma-reconstruct ang "kahapong stock" nila
      prisma.product.findMany({
        where: { userId },
        select: { id: true, stock: true },
      }),
  
      // BAGO: mga binenta NGAYONG ARAW LANG (para i-reverse)
      prisma.saleItem.findMany({
        where: { sale: { userId, createdAt: { gte: todayStart, lt: tomorrowStart } } },
        select: { productId: true, quantity: true },
      }),
  
      // BAGO: mga adjustment NGAYONG ARAW LANG (para i-reverse)
      prisma.stockAdjustment.findMany({
        where: { product: { userId }, createdAt: { gte: todayStart, lt: tomorrowStart } },
        select: { productId: true, amount: true },
      }),

       // ← MOVED TO LAST, matching where `utangCustomers` sits in the destructuring
      prisma.customer.findMany({
        where: { userId },
        include: {transactions: true, payments: true}, 
      }),
    ]);

    const peso = (value) => Number(value || 0);
    
    const yesterdayStockMap = new Map();
allProducts.forEach((p) => {
  yesterdayStockMap.set(p.id, p.stock);
});

todaySaleItems.forEach((item) => {
  const current = yesterdayStockMap.get(item.productId) || 0;
  yesterdayStockMap.set(item.productId, current + item.quantity);
});

todayAdjustments.forEach((adj) => {
  const current = yesterdayStockMap.get(adj.productId) || 0;   // adj.productId, hindi item.productId
  yesterdayStockMap.set(adj.productId, current - adj.amount);
});

const lowStockCountYesterday = [...yesterdayStockMap.values()].filter(
  (stock) => stock <= 5
).length;


// ADD THIS BLOCK ↓
let totalUtang = 0;
let totalUtangCustomers = 0;
let totalUtangYesterday = 0;


utangCustomers.forEach((c) => {
  const totalDebt = c.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaid = c.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
  const balance = Math.max(0, totalDebt - totalPaid);

  totalUtang += balance;
  if (balance > 0) totalUtangCustomers++;

  const todayDebtAdded = c.transactions
    .filter((t) => {
      const d = new Date(t.createdAt);
      return d >= todayStart && d < tomorrowStart;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const todayPaymentsMade = c.payments
    .filter((p) => {
      const d = new Date(p.paidAt);
      return d >= todayStart && d < tomorrowStart;
    })
    .reduce((sum, p) => sum + Number(p.amountPaid), 0);

  const balanceYesterday = Math.max(0, balance - todayDebtAdded + todayPaymentsMade);
  totalUtangYesterday += balanceYesterday;
});


const PRODUCT_CAP = 150; // target/cap para sa "progress" gauge

const totalProductsChange = Math.min(100, (totalProducts / PRODUCT_CAP) * 100);
const lowStockChange = Math.min(100, (lowStockItems.length / PRODUCT_CAP) * 100);

//for utang
const totalUtangChange = percentChange(totalUtang, totalUtangYesterday); 

const todaySalesChangeVsYesterday = percentChange(
  todaySales.reduce((sum, s) => sum + peso(s.totalAmount), 0),
  prevTodaySales.reduce((sum, s) => sum + peso(s.totalAmount), 0)
);

    // Weekly sales: gamit ang actual sale total
    const days = [];
    const amounts = [];
    const salesByDay = new Map();

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
    
      const key = toLocalDateKey(date);   // ← dating: date.toISOString().slice(0, 10)
      days.push(date.toLocaleDateString('en-PH', { weekday: 'short' }));
      salesByDay.set(key, 0);
    }
    
    weekSales.forEach((sale) => {
      const key = toLocalDateKey(sale.createdAt);   // ← dating: new Date(sale.createdAt).toISOString().slice(0, 10)
      salesByDay.set(key, (salesByDay.get(key) || 0) + peso(sale.totalAmount));
    });

    salesByDay.forEach((amount) => amounts.push(amount));

    // Sales per category:
    // priceAtSale ang ginagamit para hindi maapektuhan kapag binago ang product price.
    const categoryTotals = {};

    weekSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const categoryName = item.product?.category?.name || 'Others';
        const amount = peso(item.priceAtSale) * Number(item.quantity);

        categoryTotals[categoryName] =
          (categoryTotals[categoryName] || 0) + amount;
      });
    });

 
    const orderedCategories = [
      'Beverages',
      'Food',
      'NonFood',
      'Frozen',
      'Snacks',
    ];
    
    const categoryLabels = orderedCategories;
    const categorySeries = orderedCategories.map(
      (category) => categoryTotals[category] || 0
    );


    const totalCategorySales = categorySeries.reduce((sum, value) => sum + value, 0);

    const percentageOf = (category) => {
      const value = categoryTotals[category] || 0;
      return totalCategorySales
        ? Math.round((value / totalCategorySales) * 100)
        : 0;
    };

    const recentSales = await prisma.sale.findMany({
      where: { userId }, 
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      todaySales: todaySales.reduce((sum, sale) => sum + peso(sale.totalAmount), 0),
      prevTodaySales: prevTodaySales.reduce((sum, sale) => sum + peso(sale.totalAmount), 0),
      todaySalesChange: todaySalesChangeVsYesterday,   // BAGO
    
      totalProducts,
      totalProductsChange,   // BAGO
      totalUtangChange,
    
      lowStockCount: lowStockItems.length,
      lowStockChange,   // BAGO
    
      totalUtang,
      totalUtangCustomers,
    
      weeklySales: { days, amounts },
      categories: { labels: categoryLabels, series: categorySeries },
      categoryPercentages: {
        beverages: percentageOf('Beverages'),
        food: percentageOf('Food'),
        nonFood: percentageOf('NonFood'),
        frozen: percentageOf('Frozen'),
        snacks: percentageOf('Snacks'),
      },
      lowStockItems: {
        names: lowStockItems.map((item) => item.name),
        quantities: lowStockItems.map((item) => item.stock),
      },
      lowStockTableDetails: lowStockItems.map((item) => ({
        name: item.name,
        stock: item.stock,
        minThreshold: 5,
      })),
      recentTransactions: recentSales.map((sale) => ({
        customerName: 'Walk-in Customer',
        txnCode: `SALE-${sale.id}`,
        amount: peso(sale.totalAmount),
        status: 'Paid',
        itemsSummary: sale.items.map((item) => `${item.product.name} × ${item.quantity}`).join(', '),
        timeAgo: new Date(sale.createdAt).toLocaleString('en-PH'),
      })),
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;