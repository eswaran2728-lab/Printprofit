import { Router } from 'express';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueWrite } from '../services/syncQueue.js';
import { computeProductCost, priceFromMargin, marginFromPrice } from '../utils/calc.js';

const router = Router();
const TAB = 'Products';

function getRefs() {
  return { materials: store.get('materials'), printers: store.get('printers'), labor: store.get('labor') };
}

function toRow(p) {
  const cost = computeProductCost(p, getRefs());
  const materialsStr = (p.materialsUsed || [])
    .map((m) => {
      const mat = store.get('materials').find((x) => x.id === m.materialId);
      return mat ? `${mat.material} ${mat.color || ''} (${m.grams}g)`.trim() : '';
    })
    .filter(Boolean)
    .join('; ');
  const printer = store.get('printers').find((x) => x.id === p.printerId);
  const laborStr = (p.laborTasksUsed || [])
    .map((t) => {
      const task = store.get('labor').find((x) => x.id === t.taskId);
      return task ? `${task.task} (${t.hours}h)` : '';
    })
    .filter(Boolean)
    .join('; ');

  return [
    p.name,
    materialsStr,
    p.printTimeHours,
    printer?.name || '',
    p.failureRatePct,
    p.packagingUsed || '',
    laborStr,
    Number(cost.totalCost.toFixed(2)),
  ];
}

function sync() {
  enqueueWrite(TAB, store.get('products').map(toRow));
}

router.get('/', (req, res) => {
  const products = store.get('products').map((p) => ({ ...p, cost: computeProductCost(p, getRefs()) }));
  res.json(products);
});

router.get('/:id', (req, res) => {
  const p = store.get('products').find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ...p, cost: computeProductCost(p, getRefs()) });
});

router.post('/', (req, res) => {
  const { name, materialsUsed, printTimeHours, printerId, failureRatePct, packagingUsed, packagingCost, laborTasksUsed } = req.body;
  const entry = {
    id: nanoid(),
    name,
    materialsUsed: materialsUsed || [],
    printTimeHours: Number(printTimeHours) || 0,
    printerId: printerId || null,
    failureRatePct: Number(failureRatePct) || 0,
    packagingUsed: packagingUsed || '',
    packagingCost: Number(packagingCost) || 0,
    laborTasksUsed: laborTasksUsed || [],
  };
  store.set('products', [...store.get('products'), entry]);
  sync();
  res.status(201).json({ ...entry, cost: computeProductCost(entry, getRefs()) });
});

router.put('/:id', (req, res) => {
  const items = store.get('products');
  const idx = items.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  store.set('products', items);
  sync();
  res.json({ ...items[idx], cost: computeProductCost(items[idx], getRefs()) });
});

router.delete('/:id', (req, res) => {
  store.set('products', store.get('products').filter((p) => p.id !== req.params.id));
  sync();
  res.json({ ok: true });
});

// Pricing simulator
router.post('/:id/price', (req, res) => {
  const p = store.get('products').find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const cost = computeProductCost(p, getRefs());
  const { targetMarginPct, desiredSellPrice } = req.body;

  let result = {};
  if (targetMarginPct !== undefined && targetMarginPct !== null && targetMarginPct !== '') {
    result.byMargin = priceFromMargin(cost.totalCost, targetMarginPct);
  }
  if (desiredSellPrice !== undefined && desiredSellPrice !== null && desiredSellPrice !== '') {
    result.byPrice = marginFromPrice(cost.totalCost, Number(desiredSellPrice));
  }
  res.json({ cost, ...result });
});

export default router;
