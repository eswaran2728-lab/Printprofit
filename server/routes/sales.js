import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueAppend, enqueueWrite } from '../services/syncQueue.js';
import { computeProductCost } from '../utils/calc.js';
import { extractSaleFromImage } from '../services/gemini.js';

const router = Router();
const SALES_TAB = 'Sales';
const SUMMARY_TAB = 'Monthly Summary';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

function getRefs() {
  return { materials: store.get('materials'), printers: store.get('printers'), labor: store.get('labor') };
}

function recomputeMonthlySummary() {
  const sales = store.get('sales');
  const byMonth = {};
  for (const s of sales) {
    const month = s.date?.slice(0, 7); // YYYY-MM
    if (!month) continue;
    if (!byMonth[month]) byMonth[month] = { revenue: 0, cost: 0 };
    byMonth[month].revenue += Number(s.sellPrice) || 0;
    byMonth[month].cost += Number(s.totalCost) || 0;
  }
  const rows = Object.keys(byMonth)
    .sort()
    .map((month) => {
      const { revenue, cost } = byMonth[month];
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return [month, Number(revenue.toFixed(2)), Number(cost.toFixed(2)), Number(profit.toFixed(2)), Number(margin.toFixed(2))];
    });
  enqueueWrite(SUMMARY_TAB, rows);
  return rows;
}

router.get('/', (req, res) => res.json(store.get('sales')));

router.post('/', (req, res) => {
  const { date, productId, buyerPlatform, sellPrice } = req.body;
  const product = store.get('products').find((p) => p.id === productId);
  const totalCost = product ? computeProductCost(product, getRefs()).totalCost : Number(req.body.totalCost) || 0;
  const sell = Number(sellPrice) || 0;
  const profit = sell - totalCost;
  const margin = sell > 0 ? (profit / sell) * 100 : 0;

  const entry = {
    id: nanoid(),
    date: date || new Date().toISOString().slice(0, 10),
    productId: productId || null,
    productName: product?.name || req.body.productName || '',
    buyerPlatform: buyerPlatform || '',
    sellPrice: sell,
    totalCost: Number(totalCost.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    margin: Number(margin.toFixed(2)),
  };
  store.set('sales', [...store.get('sales'), entry]);
  enqueueAppend(SALES_TAB, [entry.date, entry.productName, entry.buyerPlatform, entry.sellPrice, entry.totalCost, entry.profit, entry.margin]);
  recomputeMonthlySummary();
  res.status(201).json(entry);
});

router.delete('/:id', (req, res) => {
  store.set('sales', store.get('sales').filter((s) => s.id !== req.params.id));
  recomputeMonthlySummary();
  res.json({ ok: true });
});

router.post('/sync-summary', (req, res) => {
  const rows = recomputeMonthlySummary();
  res.json({ ok: true, rows });
});

router.post('/extract', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  try {
    const extracted = await extractSaleFromImage(req.file.buffer.toString('base64'), req.file.mimetype);

    const products = store.get('products');
    let matchedProductId = null;
    if (extracted.productName) {
      const needle = extracted.productName.toLowerCase();
      const match = products.find(
        (p) => needle.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(needle)
      );
      matchedProductId = match?.id || null;
    }

    res.json({ ...extracted, matchedProductId });
  } catch (err) {
    console.error('Sale extraction failed:', err.message);
    res.status(500).json({ error: err.message || 'Extraction failed' });
  }
});

export default router;
