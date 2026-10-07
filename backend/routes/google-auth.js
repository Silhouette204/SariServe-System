import express from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

const router = express.Router();

const FRONTEND = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_PROD_URL
  : '';

// Hakbang A: papunta sa Google
router.get('/', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.googleState = state;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  req.session.save((err) => {
    if (err) return res.status(500).send('Could not start Google sign-in.');
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });
});

// Hakbang B: pagbalik galing Google
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND}/sign-in.html?error=google_cancelled`);
  }

  const expectedState = req.session.googleState;
  delete req.session.googleState;

  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect(`${FRONTEND}/sign-in.html?error=google_failed`);
  }

  try {
    // ipalit ang code sa token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    // kunin ang profile
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email_verified) {
      return res.redirect(`${FRONTEND}/sign-in.html?error=google_failed`);
    }

    // hanapin, i-link, o gumawa ng user
    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email: profile.email } });

      if (existing) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: profile.sub,
            isVerified: true,
            ...(existing.isVerified ? {} : { passwordHash: null }),
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            googleId: profile.sub,
            email: profile.email,
            firstName: profile.given_name || profile.name || 'User',
            lastName: profile.family_name || '',
            isVerified: true,
          },
        });
      }
    }

    // gumawa ng session
    req.session.regenerate((err) => {
      if (err) return res.redirect(`${FRONTEND}/sign-in.html?error=google_failed`);
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) return res.redirect(`${FRONTEND}/sign-in.html?error=google_failed`);
        res.redirect(`${FRONTEND}/dashboard.html`);
      });
    });
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect(`${FRONTEND}/sign-in.html?error=google_failed`);
  }
});

export default router;