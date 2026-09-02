import { Router } from 'express';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueWrite } from '../services/syncQueue.js';

const router = Router();
const TAB = 'Labor & Painter Rates';

function toRow(l) {
  return [l.task, l.rate, l.notes || ''];
}

function sync() {
  enqueueWrite(TAB, store.get('labor').map(toRow));
}

router.get('/', (req, res) => res.json(store.get('labor')));

router.post('/', (req, res) => {
  const { task, rate, notes } = req.body;
  const entry = { id: nanoid(), task, rate: Number(rate) || 0, notes: notes || '' };
  store.set('labor', [...store.get('labor'), entry]);
  sync();
  res.status(201).json(entry);
});

router.put('/:id', (req, res) => {
  const items = store.get('labor');
  const idx = items.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  store.set('labor', items);
  sync();
  res.json(items[idx]);
});

router.delete('/:id', (req, res) => {
  store.set('labor', store.get('labor').filter((l) => l.id !== req.params.id));
  sync();
  res.json({ ok: true });
});

export default router;
