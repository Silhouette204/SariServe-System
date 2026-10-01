import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

import { sendOtp, describeOtpTarget  } from '../lib/notify.js';

import rateLimit from 'express-rate-limit';

//for code attempt limiter for email verification, login, forgot password, and reset password
const codeAttemptLimiter  = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuto
  limit: 5,                 // 5 na subok lang kada IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const router = express.Router();

//verify email account route
router.post('/verify-email', codeAttemptLimiter, async (req, res) => {
  try {
    const { email, code, purpose } = req.body; // ← dagdag: purpose

    if (!email || !code) {
      return res.status(400).json({ error: 'Must have email and code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      user.verificationToken !== code ||
      user.verificationTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    req.session.userId = user.id;
    return req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Could not start session.' });
      res.status(200).json({
        message: purpose === 'login'
          ? 'Your account was login successfully!'
          : 'Your account was verified. Welcome to SariServe!',
        loggedIn: true,
      });
    });

  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Server error on email verification.' });
  }
});

// Local Sign-Up Route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, notificationPref } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'This email was already in used' });
    }

    const prefEnum = notificationPref === 'phone' ? 'PHONE' : 'EMAIL';
    if (prefEnum === 'PHONE' && !phone) {
      return res.status(400).json({ error: 'Phone number is required for SMS notifications.' });
    }

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

    await sendOtp(newUser, verificationToken, 3); //3 minutes OTP validation

    const { passwordHash: _, verificationToken: __, ...safeUser } = newUser; // ← tanggalin ang hash bago i-send
    res.status(201).json(
      { 
      message: 'Account created successfully, We sent you a verification code.', 
      user: safeUser,
      ...describeOtpTarget(newUser), 
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This email was already in used' });
    }
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error while creating account.' });
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
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('Tama ba ang password:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
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

    await sendOtp(user, loginCode, 1);

   res.status(200).json({
  message: 'We sent you a login code.',
  requiresOtp: true,
  email: user.email,
  ...describeOtpTarget(user),
});


  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Forgot Password — humingi ng reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Must need email.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Hindi natin sasabihing "walang account"
      return res.status(200).json({
        message: 'If your account was already registered on your email, it proceed to send the reset code',
        channel: 'email',
        sentTo: email,
      });
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

    await sendOtp(user, resetCode, 10, 'reset');

    res.status(200).json({
      message: 'If your account was already registered on your email, it proceed to send the reset code',
      ...describeOtpTarget(user), // channel + masked phone o email
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Server error on forgot password.' });
  }
});

// Reset Password — kumpirmahin ang code, ipalit ang password
router.post('/reset-password', codeAttemptLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Must complete all the required fields' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      user.resetPasswordToken !== code ||
      user.resetPasswordTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
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

    res.status(200).json({ message: 'Your password was successfully changed. You can proceed to login your account' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Server error on reset password.' });
  }
});

// Verify Reset Code — i-check lang ang code, hindi pa palitan ang password
router.post('/verify-reset-code', codeAttemptLimiter, async (req, res) => {  // ← ibalik dito
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'You need email and code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

   if (
      !user ||
      user.resetPasswordToken !== code ||
      user.resetPasswordTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    res.status(200).json({ message: 'Code was right! You can input your new password' });
  } catch (error) {
    console.error('Verify Reset Code Error:', error);
    res.status(500).json({ error: 'Server error on verifying code.' });
  }
});

// Resend Code — gumagana para sa signup, login, at reset password
router.post('/resend-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Need email.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // parehong sagot para hindi malaman kung may account
      return res.status(200).json({ message: 'A new code was sent.' });
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

      await sendOtp(user, newCode, 10, 'reset');
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

      await sendOtp(user, newCode, expiryMinutes);
    }

    res.status(200).json({ message: 'A new code was sent.' });
  } catch (error) {
    console.error('Resend Code Error:', error);
    res.status(500).json({ error: 'Server error while resending code.' });
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

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out.' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out.' });
  });
});

export default router;