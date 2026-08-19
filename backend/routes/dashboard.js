import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
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

    const [todaySales, prevTodaySales, totalProducts, lowStockItems, weekSales] =
      await Promise.all([
        prisma.sale.findMany({
          where: {
            createdAt: { gte: todayStart, lt: tomorrowStart },
          },
          include: {
            items: {
              include: {
                product: { include: { category: true } },
              },
            },
          },
        }),

        prisma.sale.findMany({
          where: {
            createdAt: { gte: yesterdayStart, lt: todayStart },
          },
        }),

        prisma.product.count(),

        prisma.product.findMany({
          where: { stock: { lte: 5 } }, // palitan kung ibang threshold mo
          orderBy: { stock: 'asc' },
        }),

        prisma.sale.findMany({
          where: { createdAt: { gte: weekStart } },
          include: {
            items: {
              include: {
                product: { include: { category: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const peso = (value) => Number(value || 0);

    // Weekly sales: gamit ang actual sale total
    const days = [];
    const amounts = [];
    const salesByDay = new Map();

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const key = date.toISOString().slice(0, 10);
      days.push(date.toLocaleDateString('en-PH', { weekday: 'short' }));
      salesByDay.set(key, 0);
    }

    weekSales.forEach((sale) => {
      const key = new Date(sale.createdAt).toISOString().slice(0, 10);
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
      todaySales: todaySales.reduce(
        (sum, sale) => sum + peso(sale.totalAmount),
        0
      ),
      prevTodaySales: prevTodaySales.reduce(
        (sum, sale) => sum + peso(sale.totalAmount),
        0
      ),
      totalProducts,
      lowStockCount: lowStockItems.length,

      // Magiging 0 muna kung wala pang utang/customer model sa schema
      totalUtang: 0,
      totalUtangCustomers: 0,

      weeklySales: {
        days,
        amounts,
      },

      categories: {
        labels: categoryLabels,
        series: categorySeries,
      },

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
        itemsSummary: sale.items
          .map((item) => `${item.product.name} × ${item.quantity}`)
          .join(', '),
        timeAgo: new Date(sale.createdAt).toLocaleString('en-PH'),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;