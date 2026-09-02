import { config } from '../config.js';

export function materialCostPerGram(costPerKg) {
  return costPerKg / 1000;
}

export function printerCostPerHour(printer) {
  const { purchasePrice, powerW, lifetimeHours, annualMaintenance, annualHours = 1000 } = printer;
  const machineWear = lifetimeHours > 0 ? purchasePrice / lifetimeHours : 0;
  const electricity = (powerW / 1000) * config.electricityRatePerKwh;
  const maintenance = annualHours > 0 ? annualMaintenance / annualHours : 0;
  return machineWear + electricity + maintenance;
}

export function isReorderNeeded(stock, minStock) {
  return Number(stock) <= Number(minStock);
}

export function computeProductCost(product, { materials, printers, labor }) {
  const materialCost = (product.materialsUsed || []).reduce((sum, m) => {
    const mat = materials.find((x) => x.id === m.materialId);
    if (!mat) return sum;
    return sum + materialCostPerGram(mat.costPerKg) * Number(m.grams || 0);
  }, 0);

  const printer = printers.find((p) => p.id === product.printerId);
  const printerCost = printer ? printerCostPerHour(printer) * Number(product.printTimeHours || 0) : 0;

  const laborCost = (product.laborTasksUsed || []).reduce((sum, t) => {
    const task = labor.find((x) => x.id === t.taskId);
    if (!task) return sum;
    return sum + Number(task.rate) * Number(t.hours || 0);
  }, 0);

  const packagingCost = Number(product.packagingCost || 0);

  const failureRate = Number(product.failureRatePct || 0) / 100;
  const baseCost = materialCost + printerCost + laborCost + packagingCost;
  const totalCost = baseCost * (1 + failureRate);

  return {
    materialCost,
    printerCost,
    laborCost,
    packagingCost,
    failureRate,
    totalCost,
  };
}

export function priceFromMargin(totalCost, marginPct) {
  const margin = Number(marginPct) / 100;
  if (margin >= 1) return null;
  const sellPrice = totalCost / (1 - margin);
  return { sellPrice, profit: sellPrice - totalCost, margin: margin * 100 };
}

export function marginFromPrice(totalCost, sellPrice) {
  const profit = sellPrice - totalCost;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  return { sellPrice, profit, margin };
}
