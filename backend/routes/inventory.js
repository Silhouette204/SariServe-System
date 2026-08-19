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

    // I-flatten ang category object papuntang plain string (pangalan lang)
    const formatted = products.map((p) => ({
      ...p,
      category: p.category?.name || null,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory — gumawa ng bagong product
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ error: 'Name at price ay required' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        stock: stock ? Number(stock) : 0,
        category: category
          ? { connect: { name: category } }
          : undefined,
      },
      include: { category: true },
    });

    res.status(201).json({
      ...newProduct,
      category: newProduct.category?.name || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// POST /api/inventory/:id/sale — mag-record ng benta
router.post('/:id/sale', async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = Number(req.body.quantity);

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantity must be a positive whole number',
      });
    }

    const totalAmount = Number(product.price) * quantity;

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Hindi sapat ang stock' });
    }

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: Number(id) },
        data: { stock: { decrement: quantity } },
      }),
      prisma.sale.create({
        data: {
          totalAmount,
          items: {
            create: [
              {
                productId: Number(id),
                quantity,
                priceAtSale: product.price,
              },
            ],
          },
        },
      }),
    ]);

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// POST /api/inventory/:id/adjustment — mag-record ng stock adjustment
router.post('/:id/adjustment', async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body.amount);
    const { reason } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!Number.isFinite(amount) || amount === 0) {
      return res.status(400).json({
        error: 'Amount must be a valid non-zero number',
      });
    }

    const newStock = Math.max(0, product.stock + amount);

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: Number(id) },
        data: { stock: newStock },
      }),
      prisma.stockAdjustment.create({
        data: {
          productId: Number(id),
          amount,
          reason: reason || 'OTHER',
        },
      }),
    ]);

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record adjustment' });
  }
});

export default router;   // ← DAPAT PALAGING NASA DULO NG FILE