import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Local Sign-Up Route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, notificationPref } = req.body;

    // Suriin kung nag-eexist na ang email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Gamit na ang email na ito.' });
    }

    // I-map ang notification preference patungo sa Enum kung kinakailangan
    const prefEnum = notificationPref === 'phone' ? 'PHONE' : 'EMAIL';

    // Gumawa ng user sa database (Pansamantalang plain text password muna para sa testing)
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
    const { identifier, password } = req.body; // identifier pwede maging email

    // Hanapin ang user gamit ang email
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