import { Router } from 'express';
import { getAuthUrl, exchangeCodeForTokens, ensureSpreadsheet, getOAuthClient } from '../services/sheets.js';
import { store } from '../utils/store.js';
import { google } from 'googleapis';
import { config } from '../config.js';
import { buildCatalogSeed } from '../seed/catalogSeed.js';
import { enqueueWrite } from '../services/syncQueue.js';
import { materialCostPerGram, isReorderNeeded, printerCostPerHour, computeProductCost } from '../utils/calc.js';

const router = Router();

export function seedCatalogIfNeeded() {
  if (store.isCatalogSeeded()) return;
  if (store.get('materials').length > 0 || store.get('printers').length > 0 || store.get('products').length > 0) {
    // User already has their own data — don't overwrite it, just stop offering the seed.
    store.markCatalogSeeded();
    return;
  }

  const { materials, printers, products } = buildCatalogSeed();
  store.set('materials', materials);
  store.set('printers', printers);
  store.set('products', products);
  store.markCatalogSeeded();

  enqueueWrite(
    'Materials Stock',
    materials.map((m) => [
      m.material,
      m.color,
      m.costPerKg,
      Number(materialCostPerGram(m.costPerKg).toFixed(4)),
      m.stockGrams,
      m.minStockGrams,
      isReorderNeeded(m.stockGrams, m.minStockGrams) ? 'YES' : 'NO',
    ])
  );

  enqueueWrite(
    'Printers',
    printers.map((p) => [p.name, p.purchasePrice, p.powerW, p.lifetimeHours, p.annualMaintenance, Number(printerCostPerHour(p).toFixed(3))])
  );

  const refs = { materials, printers, labor: store.get('labor') };
  enqueueWrite(
    'Products',
    products.map((p) => {
      const cost = computeProductCost(p, refs);
      const mat = materials.find((m) => m.id === p.materialsUsed[0]?.materialId);
      const printer = printers.find((x) => x.id === p.printerId);
      const laborTask = refs.labor.find((l) => l.id === p.laborTasksUsed[0]?.taskId);
      return [
        p.name,
        mat ? `${mat.material} ${mat.color} (${p.materialsUsed[0].grams}g)` : '',
        p.printTimeHours,
        printer?.name || '',
        p.failureRatePct,
        p.packagingUsed,
        laborTask ? `${laborTask.task} (${p.laborTasksUsed[0].hours}h)` : '',
        Number(cost.totalCost.toFixed(2)),
      ];
    })
  );
}

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
    seedCatalogIfNeeded();

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
