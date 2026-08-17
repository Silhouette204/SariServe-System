import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/inventory — kunin lahat ng products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

export default router;