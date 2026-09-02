import { Router } from 'express';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueWrite } from '../services/syncQueue.js';
import { isReorderNeeded } from '../utils/calc.js';

const router = Router();
const TAB = 'Hardware Stock';

function toRow(h) {
  return [h.item, h.costPerUnit, h.stock, h.minStock, isReorderNeeded(h.stock, h.minStock) ? 'YES' : 'NO'];
}

function sync() {
  enqueueWrite(TAB, store.get('hardware').map(toRow));
}

router.get('/', (req, res) => res.json(store.get('hardware')));

router.post('/', (req, res) => {
  const { item, costPerUnit, stock, minStock } = req.body;
  const entry = {
    id: nanoid(),
    item,
    costPerUnit: Number(costPerUnit) || 0,
    stock: Number(stock) || 0,
    minStock: Number(minStock) || 0,
  };
  store.set('hardware', [...store.get('hardware'), entry]);
  sync();
  res.status(201).json(entry);
});

router.put('/:id', (req, res) => {
  const items = store.get('hardware');
  const idx = items.findIndex((h) => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  store.set('hardware', items);
  sync();
  res.json(items[idx]);
});

router.delete('/:id', (req, res) => {
  store.set('hardware', store.get('hardware').filter((h) => h.id !== req.params.id));
  sync();
  res.json({ ok: true });
});

export default router;
