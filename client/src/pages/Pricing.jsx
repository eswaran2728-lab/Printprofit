import { useEffect, useMemo, useState } from 'react';
import { productsApi, laborApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

function computeCostWithLabor(product, laborTasksUsed, laborList) {
  const laborCost = laborTasksUsed.reduce((sum, t) => {
    const task = laborList.find((x) => x.id === t.taskId);
    if (!task) return sum;
    return sum + Number(task.rate) * Number(t.hours || 0);
  }, 0);
  const base = product.cost.materialCost + product.cost.printerCost + laborCost + product.cost.packagingCost;
  return base * (1 + product.cost.failureRate);
}

export default function Pricing() {
  const [products, setProducts] = useState([]);
  const [labor, setLabor] = useState([]);
  const [productId, setProductId] = useState('');
  const [mode, setMode] = useState('margin'); // margin | price
  const [marginPct, setMarginPct] = useState('30');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    productsApi.list().then(setProducts);
    laborApi.list().then(setLabor);
  }, []);

  const product = products.find((p) => p.id === productId);

  const selfTask = labor.find((l) => l.task.toLowerCase().includes('painting (self)'));
  const hiredTask = labor.find((l) => l.task.toLowerCase().includes('painter (hired)'));

  const { selfCost, hiredCost } = useMemo(() => {
    if (!product) return {};
    const originalTasks = product.laborTasksUsed || [];
    const selfHours = originalTasks.find((t) => t.taskId === selfTask?.id)?.hours || 0;
    const hiredHours = originalTasks.find((t) => t.taskId === hiredTask?.id)?.hours || selfHours;

    const withoutPaint = originalTasks.filter((t) => t.taskId !== selfTask?.id && t.taskId !== hiredTask?.id);

    const selfTasks = selfTask ? [...withoutPaint, { taskId: selfTask.id, hours: selfHours || hiredHours }] : originalTasks;
    const hiredTasks = hiredTask ? [...withoutPaint, { taskId: hiredTask.id, hours: hiredHours || selfHours }] : originalTasks;

    return {
      selfCost: computeCostWithLabor(product, selfTasks, labor),
      hiredCost: computeCostWithLabor(product, hiredTasks, labor),
    };
  }, [product, labor]);

  const activeCost = mode === 'compare' ? null : product?.cost.totalCost;

  const runCalc = async () => {
    if (!productId) return;
    const payload = {};
    if (mode === 'margin') payload.targetMarginPct = marginPct;
    if (mode === 'price') payload.desiredSellPrice = desiredPrice;
    const data = await productsApi.price(productId, payload);
    setResult(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Pricing Simulator</h2>

      <Card>
        <Field label="Product">
          <select className={inputCls} value={productId} onChange={(e) => { setProductId(e.target.value); setResult(null); }}>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      </Card>

      {product && (
        <Card>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setMode('margin')} className={`text-xs px-3 py-1 rounded-full ${mode === 'margin' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Target Margin</button>
            <button onClick={() => setMode('price')} className={`text-xs px-3 py-1 rounded-full ${mode === 'price' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Desired Price</button>
            <button onClick={() => setMode('compare')} className={`text-xs px-3 py-1 rounded-full ${mode === 'compare' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Self vs Hired</button>
          </div>

          {mode === 'margin' && (
            <div className="flex gap-2 items-end">
              <Field label="Target Margin %">
                <input type="number" className={inputCls} value={marginPct} onChange={(e) => setMarginPct(e.target.value)} />
              </Field>
              <Button onClick={runCalc}>Calculate</Button>
            </div>
          )}
          {mode === 'price' && (
            <div className="flex gap-2 items-end">
              <Field label="Desired Sell Price (RM)">
                <input type="number" className={inputCls} value={desiredPrice} onChange={(e) => setDesiredPrice(e.target.value)} />
              </Field>
              <Button onClick={runCalc}>Calculate</Button>
            </div>
          )}

          {mode !== 'compare' && result && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total Cost</p>
                <p className="font-semibold">{rm(result.cost.totalCost)}</p>
              </div>
              {result.byMargin && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Suggested Sell Price</p>
                    <p className="font-semibold text-purple-600">{rm(result.byMargin.sellPrice)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Profit</p>
                    <p className="font-semibold text-green-600">{rm(result.byMargin.profit)}</p>
                  </div>
                </>
              )}
              {result.byPrice && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Profit</p>
                    <p className="font-semibold text-green-600">{rm(result.byPrice.profit)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Margin</p>
                    <p className="font-semibold">{result.byPrice.margin.toFixed(1)}%</p>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'compare' && (
            <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Self-painted Cost</p>
                <p className="font-semibold">{selfCost !== undefined ? rm(selfCost) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Painter-hired Cost</p>
                <p className="font-semibold">{hiredCost !== undefined ? rm(hiredCost) : '—'}</p>
              </div>
              <p className="col-span-2 text-xs text-gray-400">
                Based on the "Painting (Self)" / "Painter (Hired)" labor rates, using the hours configured on this product.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
