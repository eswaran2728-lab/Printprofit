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
  const seed = buildCatalogSeed();

  const existingMaterials = store.get('materials');
  const existingPrinters = store.get('printers');
  const existingProducts = store.get('products');

  const materialNameKey = (m) => `${m.material}|${m.color}`.toLowerCase();
  const existingMaterialKeys = new Set(existingMaterials.map(materialNameKey));
  const existingPrinterNames = new Set(existingPrinters.map((p) => p.name.toLowerCase()));
  const existingProductNames = new Set(existingProducts.map((p) => p.name.toLowerCase()));

  const newMaterials = seed.materials.filter((m) => !existingMaterialKeys.has(materialNameKey(m)));
  const newPrinters = seed.printers.filter((p) => !existingPrinterNames.has(p.name.toLowerCase()));

  // Products reference material/printer ids from the seed — only keep products whose
  // referenced material/printer actually ended up in the store (existing or newly added).
  const materials = [...existingMaterials, ...newMaterials];
  const printers = [...existingPrinters, ...newPrinters];
  const materialIds = new Set(materials.map((m) => m.id));
  const printerIds = new Set(printers.map((p) => p.id));

  const newProducts = seed.products.filter(
    (p) =>
      !existingProductNames.has(p.name.toLowerCase()) &&
      p.materialsUsed.every((m) => materialIds.has(m.materialId)) &&
      printerIds.has(p.printerId)
  );

  if (!newMaterials.length && !newPrinters.length && !newProducts.length) {
    console.log('[seed] catalog already present, nothing to add');
    return;
  }

  console.log(`[seed] adding ${newMaterials.length} materials, ${newPrinters.length} printers, ${newProducts.length} products`);

  if (newMaterials.length) {
    store.set('materials', materials);
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
  }

  if (newPrinters.length) {
    store.set('printers', printers);
    enqueueWrite(
      'Printers',
      printers.map((p) => [p.name, p.purchasePrice, p.powerW, p.lifetimeHours, p.annualMaintenance, Number(printerCostPerHour(p).toFixed(3))])
    );
  }

  if (newProducts.length) {
    const products = [...existingProducts, ...newProducts];
    store.set('products', products);
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
