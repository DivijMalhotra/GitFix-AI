const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// ─── Step 1: Redirect to GitHub OAuth ────────────────────
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'repo user read:org',
    state: Math.random().toString(36).substring(7),
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ─── Step 2: GitHub OAuth Callback ───────────────────────
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=no_code`);

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenRes.data;
    if (!access_token) throw new Error('No access token received');

    // Get GitHub user profile
    const profileRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const profile = profileRes.data;

    // Upsert user in DB
    const user = await User.findOneAndUpdate(
      { githubId: String(profile.id) },
      {
        githubId: String(profile.id),
        username: profile.login,
        displayName: profile.name || profile.login,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        githubAccessToken: access_token,
        lastLogin: new Date(),
      },
      { upsert: true, new: true }
    );

    // Issue JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('OAuth error:', err.message);
    res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=oauth_failed`);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    displayName: req.user.displayName,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl,
  });
});

// ─── POST /api/auth/logout ────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
