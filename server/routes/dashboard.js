import { Router } from 'express';
import { store } from '../utils/store.js';
import { isReorderNeeded } from '../utils/calc.js';
import { getSyncStatus } from '../services/syncQueue.js';

const router = Router();

router.get('/', (req, res) => {
  const sales = store.get('sales');
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const monthSales = sales.filter((s) => s.date?.startsWith(currentMonth));

  const revenue = monthSales.reduce((sum, s) => sum + Number(s.sellPrice || 0), 0);
  const cost = monthSales.reduce((sum, s) => sum + Number(s.totalCost || 0), 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const lowStockMaterials = store.get('materials').filter((m) => isReorderNeeded(m.stockGrams, m.minStockGrams));
  const lowStockHardware = store.get('hardware').filter((h) => isReorderNeeded(h.stock, h.minStock));

  const profitByProduct = {};
  for (const s of sales) {
    const key = s.productName || 'Unknown';
    if (!profitByProduct[key]) profitByProduct[key] = 0;
    profitByProduct[key] += Number(s.profit || 0);
  }
  const mostProfitable = Object.entries(profitByProduct)
    .map(([name, profit]) => ({ name, profit }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  res.json({
    month: currentMonth,
    revenue: Number(revenue.toFixed(2)),
    cost: Number(cost.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    lowStockMaterials,
    lowStockHardware,
    mostProfitable,
    salesCount: monthSales.length,
    sync: getSyncStatus(),
  });
});

export default router;
