import { Router } from 'express';
import { getAuthUrl, exchangeCodeForTokens, ensureSpreadsheet, getOAuthClient } from '../services/sheets.js';
import { store } from '../utils/store.js';
import { google } from 'googleapis';
import { config } from '../config.js';

const router = Router();

router.get('/google', (req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');
    const tokens = await exchangeCodeForTokens(code);
    store.saveAuth(tokens);

    const client = getOAuthClient();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    req.session.user = { email: userInfo.email, name: userInfo.name, picture: userInfo.picture };

    await ensureSpreadsheet();

    res.redirect(`${config.clientOrigin}/`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${config.clientOrigin}/?error=auth_failed`);
  }
});

router.get('/me', (req, res) => {
  const { tokens, spreadsheetId } = store.getAuth();
  if (!tokens || !req.session.user) {
    return res.json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.session.user, spreadsheetId });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
