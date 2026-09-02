import { Router } from 'express';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueWrite } from '../services/syncQueue.js';
import { materialCostPerGram, isReorderNeeded } from '../utils/calc.js';

const router = Router();
const TAB = 'Materials Stock';

function toRow(m) {
  const costPerGram = materialCostPerGram(m.costPerKg);
  return [
    m.material,
    m.color,
    m.costPerKg,
    Number(costPerGram.toFixed(4)),
    m.stockGrams,
    m.minStockGrams,
    isReorderNeeded(m.stockGrams, m.minStockGrams) ? 'YES' : 'NO',
  ];
}

function sync() {
  const rows = store.get('materials').map(toRow);
  enqueueWrite(TAB, rows);
}

router.get('/', (req, res) => {
  res.json(store.get('materials'));
});

router.post('/', (req, res) => {
  const { material, color, costPerKg, stockGrams, minStockGrams } = req.body;
  const item = {
    id: nanoid(),
    material,
    color: color || '',
    costPerKg: Number(costPerKg) || 0,
    stockGrams: Number(stockGrams) || 0,
    minStockGrams: Number(minStockGrams) || 0,
  };
  const items = [...store.get('materials'), item];
  store.set('materials', items);
  sync();
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const items = store.get('materials');
  const idx = items.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  store.set('materials', items);
  sync();
  res.json(items[idx]);
});

router.delete('/:id', (req, res) => {
  const items = store.get('materials').filter((m) => m.id !== req.params.id);
  store.set('materials', items);
  sync();
  res.json({ ok: true });
});

export default router;
