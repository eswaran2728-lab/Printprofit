import { Router } from 'express';
import { nanoid } from 'nanoid';
import { store } from '../utils/store.js';
import { enqueueWrite } from '../services/syncQueue.js';
import { printerCostPerHour } from '../utils/calc.js';

const router = Router();
const TAB = 'Printers';

function toRow(p) {
  return [
    p.name,
    p.purchasePrice,
    p.powerW,
    p.lifetimeHours,
    p.annualMaintenance,
    Number(printerCostPerHour(p).toFixed(3)),
  ];
}

function sync() {
  enqueueWrite(TAB, store.get('printers').map(toRow));
}

router.get('/', (req, res) => {
  const printers = store.get('printers').map((p) => ({ ...p, costPerHour: Number(printerCostPerHour(p).toFixed(3)) }));
  res.json(printers);
});

router.post('/', (req, res) => {
  const { name, purchasePrice, powerW, lifetimeHours, annualMaintenance, annualHours } = req.body;
  const entry = {
    id: nanoid(),
    name,
    purchasePrice: Number(purchasePrice) || 0,
    powerW: Number(powerW) || 0,
    lifetimeHours: Number(lifetimeHours) || 1,
    annualMaintenance: Number(annualMaintenance) || 0,
    annualHours: Number(annualHours) || 1000,
  };
  store.set('printers', [...store.get('printers'), entry]);
  sync();
  res.status(201).json(entry);
});

router.put('/:id', (req, res) => {
  const items = store.get('printers');
  const idx = items.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  store.set('printers', items);
  sync();
  res.json(items[idx]);
});

router.delete('/:id', (req, res) => {
  store.set('printers', store.get('printers').filter((p) => p.id !== req.params.id));
  sync();
  res.json({ ok: true });
});

export default router;
