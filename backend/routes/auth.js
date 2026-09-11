import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; //hindi na kailangan mag-install ng dagdag na package para gumawa ng random token.
import { sendVerificationEmail } from '../lib/email.js';

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


    //crypto email verification
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 3 * 60 * 1000); //3 minutes

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone || null,
        passwordHash,  // ← ito dapat, walang `: password`
        notificationPreferences: prefEnum,
        agreedTerms: true,

        //for email verification
        verificationToken,
        verificationTokenExpiry,
      },
    });

    //req.session.userId = newUser.id; // ← auto sign-in pagkatapos mag-signup, tatanggalin natin to after mag successfull ang sign up locally without email verification

    const verificationLink = `http://localhost:5173/verify-email.html?token=${verificationToken}`;

    await sendVerificationEmail(newUser.email, verificationToken, 3); //3 minutes OTP validation

    const { passwordHash: _, verificationToken: __, ...safeUser } = newUser; // ← tanggalin ang hash bago i-send
    res.status(201).json(
      { 
      message: 'Account created successfully, Please check your email to verify your account', 
      user: safeUser 
    });
    
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error sa paggawa ng account.' });
  }
});

//verify email account route
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Kailangan ng email at code.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Walang account na nakita sa email na ito.' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: 'Maling verification code.' });
    }

    if (user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Na-expire na ang code. Humingi ng bago.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    res.status(200).json({ message: 'Na-verify na ang email! Pwede ka nang mag-login.' });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Server error sa email verification.' });
  }
});


// Local Sign-In Route
router.post('/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Sinubukang mag-login gamit ang:', identifier); // ← idagdag muna

    const user = await prisma.user.findUnique({ where: { email: identifier } });
    console.log('Nahanap na user:', user ? user.email : 'WALANG NAHANAP'); // ← idagdag muna

    if (!user) {
      return res.status(401).json({ error: 'Mali ang email o password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('Tama ba ang password:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Mali ang email o password.' });
    }

    // gumawa ng bagong OTP kahit tama na ang password — kailangan pa rin ng verification
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const loginCodeExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minuto lang (mas maigsi kaysa sa signup na 1 oras)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: loginCode,
        verificationTokenExpiry: loginCodeExpiry,
      },
    });

    await sendVerificationEmail(user.email, loginCode, 1);

    // WALANG session dito — kailangan munang i-verify ang OTP
    res.status(200).json({
      message: 'Ipinadala ang login code sa email mo.',
      requiresOtp: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ error: 'Server error sa pag-login.' });
  }
});

export default router;