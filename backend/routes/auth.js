import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

// I-setup ang PG pool at Prisma adapter para sa Prisma v7+
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Local Sign-Up Route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, notificationPref } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Gamit na ang email na ito.' });
    }

    const prefEnum = notificationPref === 'phone' ? 'PHONE' : 'EMAIL';

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone || null,
        passwordHash: password, 
        notificationPreferences: prefEnum,
        agreedTerms: true,
      },
    });

    res.status(201).json({ message: 'Account created successfully', user: newUser });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error sa paggawa ng account.' });
  }
});

// Local Sign-In Route
router.post('/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email: identifier } 
    });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Mali ang email o password.' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ error: 'Server error sa pag-login.' });
  }
});

export default router;