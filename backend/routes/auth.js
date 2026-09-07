import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Local Sign-Up Route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, notificationPref } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Gamit na ang email na ito.' });
    }

    const prefEnum = notificationPref === 'phone' ? 'PHONE' : 'EMAIL';
    const passwordHash = await bcrypt.hash(password, 10); // ← hash na, hindi plain text

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

    req.session.userId = newUser.id; // ← auto sign-in pagkatapos mag-signup

    const { passwordHash: _, ...safeUser } = newUser; // ← tanggalin ang hash bago i-send
    res.status(201).json({ message: 'Account created successfully', user: safeUser });
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

    if (!user) {
      return res.status(401).json({ error: 'Mali ang email o password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash); // ← hash comparison
    if (!validPassword) {
      return res.status(401).json({ error: 'Mali ang email o password.' });
    }

    req.session.userId = user.id; // ← itakda ang session

    const { passwordHash: _, ...safeUser } = user; // ← tanggalin ang hash bago i-send
    res.status(200).json({ message: 'Login successful', user: safeUser });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ error: 'Server error sa pag-login.' });
  }
});

export default router;