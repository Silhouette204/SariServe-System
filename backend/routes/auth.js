import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; //hindi na kailangan mag-install ng dagdag na package para gumawa ng random token.
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';


const router = express.Router();

//verify email account route
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code, purpose } = req.body; // ← dagdag: purpose

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

    if (purpose === 'login') {
      req.session.userId = user.id; // ← dito ginagawa ang session
      return res.status(200).json({ message: 'Matagumpay na naka-login!', loggedIn: true });
    }

    res.status(200).json({ message: 'Na-verify na ang email! Pwede ka nang mag-login.' });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Server error sa email verification.' });
  }
});

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

// Forgot Password — humingi ng reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Kailangan ng email.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Hindi natin sasabihing "walang account" — para hindi malaman ng iba kung aling emails ang registered
      return res.status(200).json({ message: 'Kung may account na naka-rehistro sa email na ito, ipapadala ang reset code.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minuto

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetCode,
        resetPasswordTokenExpiry: resetCodeExpiry,
      },
    });

    await sendPasswordResetEmail(user.email, resetCode, 10);

    res.status(200).json({ message: 'Kung may account na naka-rehistro sa email na ito, ipapadala ang reset code.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Server error sa forgot password.' });
  }
});

// Reset Password — kumpirmahin ang code, ipalit ang password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Kumpletuhin ang lahat ng fields.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Walang account na nakita sa email na ito.' });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ error: 'Maling reset code.' });
    }

    if (user.resetPasswordTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Na-expire na ang reset code. Humingi ng bago.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    res.status(200).json({ message: 'Matagumpay na naipalit ang password. Pwede ka nang mag-login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Server error sa reset password.' });
  }
});

// Verify Reset Code — i-check lang ang code, hindi pa palitan ang password
router.post('/verify-reset-code', async (req, res) => {  // ← ibalik dito
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Kailangan ng email at code.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Walang account na nakita sa email na ito.' });
    }

    if (user.resetPasswordToken !== code) {  // ← ibalik: resetPasswordToken, hindi verificationToken
      return res.status(400).json({ error: 'Maling reset code.' });
    }

    if (user.resetPasswordTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Na-expire na ang reset code. Humingi ng bago.' });
    }

    res.status(200).json({ message: 'Tama ang code! Ilagay mo na ang bagong password.' });
  } catch (error) {
    console.error('Verify Reset Code Error:', error);
    res.status(500).json({ error: 'Server error sa pag-verify ng code.' });
  }
});

// Resend Code — gumagana para sa signup, login, at reset password
router.post('/resend-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Kailangan ng email.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Walang account na nakita sa email na ito.' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (purpose === 'reset') {
      // Para sa forgot password — gamitin ang resetPasswordToken fields
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minuto

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: newCode,
          resetPasswordTokenExpiry: expiry,
        },
      });

      await sendPasswordResetEmail(user.email, newCode, 10);
    } else {
      // Para sa signup o login — gamitin ang verificationToken fields
      const expiryMinutes = purpose === 'login' ? 1 : 3;
      const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: newCode,
          verificationTokenExpiry: expiry,
        },
      });

      await sendVerificationEmail(user.email, newCode, expiryMinutes);
    }

    res.status(200).json({ message: 'Naipadala ulit ang code sa email mo.' });
  } catch (error) {
    console.error('Resend Code Error:', error);
    res.status(500).json({ error: 'Server error sa pag-resend ng code.' });
  }
});

// GET /session getting first and last name
router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ loggedIn: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { firstName: true, lastName: true },
  });

  if (!user) return res.status(401).json({ loggedIn: false });

  res.json({ loggedIn: true, firstName: user.firstName, lastName: user.lastName });
});

export default router;