import { useEffect, useMemo, useState } from 'react';
import { productsApi, laborApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, Seg, rm, profitPlateClass } from '../components/ui';

function priceFromMargin(totalCost, marginPct) {
  const margin = Number(marginPct) / 100;
  if (margin >= 1) return { sellPrice: totalCost, profit: 0, margin: 0 };
  const sellPrice = totalCost / (1 - margin);
  return { sellPrice, profit: sellPrice - totalCost, margin: margin * 100 };
}
function marginFromPrice(totalCost, sellPrice) {
  const profit = sellPrice - totalCost;
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  return { sellPrice, profit, margin };
}
function computeCostWithLabor(product, laborTasksUsed, laborList) {
  const laborCost = laborTasksUsed.reduce((sum, t) => {
    const task = laborList.find((x) => x.id === t.taskId);
    return task ? sum + Number(task.rate) * Number(t.hours || 0) : sum;
  }, 0);
  const base = product.cost.materialCost + product.cost.printerCost + laborCost + product.cost.packagingCost;
  return base * (1 + product.cost.failureRate);
}

export default function Calculator() {
  const [products, setProducts] = useState([]);
  const [labor, setLabor] = useState([]);
  const [step, setStep] = useState('cost');
  const [productId, setProductId] = useState('');
  const [priceMode, setPriceMode] = useState('margin');
  const [targetMargin, setTargetMargin] = useState(40);
  const [desiredPrice, setDesiredPrice] = useState('');

  useEffect(() => {
    productsApi.list().then((data) => {
      setProducts(data);
      if (data.length && !productId) setProductId(data[0].id);
    });
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
    return { selfCost: computeCostWithLabor(product, selfTasks, labor), hiredCost: computeCostWithLabor(product, hiredTasks, labor) };
  }, [product, labor]);

  if (!products.length) {
    return (
      <div className="flex flex-col gap-3.5">
        <h2 className="m-0 text-[24px]">Cost &amp; Pricing</h2>
        <p className="text-sm text-muted">Add a product under More → Products first.</p>
      </div>
    );
  }

  const cost = product?.cost;
  const priceResult =
    priceMode === 'margin' ? priceFromMargin(cost?.totalCost || 0, targetMargin) : marginFromPrice(cost?.totalCost || 0, Number(desiredPrice) || 0);

  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="m-0 text-[24px]">Cost &amp; Pricing</h2>
      <Seg
        name="calcStep"
        value={step}
        onChange={setStep}
        className="self-start"
        options={[
          { value: 'cost', label: '1 · Cost' },
          { value: 'price', label: '2 · Pricing' },
        ]}
      />

      {step === 'cost' && cost && (
        <div className="flex flex-col gap-2.5">
          <Field label="Product">
            <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div className="card border border-divider">
            <div className="flex justify-between text-[13px]"><span className="text-muted">Material</span><span className="pp-num">{rm(cost.materialCost)}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Printer time</span><span className="pp-num">{rm(cost.printerCost)}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Labor</span><span className="pp-num">{rm(cost.laborCost)}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Packaging</span><span className="pp-num">{rm(cost.packagingCost)}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Failure rate</span><span className="pp-num">{(cost.failureRate * 100).toFixed(0)}%</span></div>
            <div className="hr my-1.5" />
            <div className="flex justify-between">
              <span className="font-heading font-semibold">Total cost</span>
              <span className="pp-num text-[22px]">{rm(cost.totalCost)}</span>
            </div>
          </div>
          <Button block onClick={() => setStep('price')}>Price this product →</Button>
        </div>
      )}

      {step === 'price' && cost && (
        <div className="flex flex-col gap-2.5">
          <Blueprint corners={['tl', 'tr']} className="px-3.5 py-3">
            <div className="text-[11px] uppercase text-accent-700">Total cost — {product.name}</div>
            <div className="pp-num text-[22px]">{rm(cost.totalCost)}</div>
          </Blueprint>

          <Seg
            name="priceMode"
            value={priceMode}
            onChange={setPriceMode}
            className="self-start"
            options={[
              { value: 'margin', label: 'By margin' },
              { value: 'price', label: 'By price' },
              { value: 'compare', label: 'Self vs hired' },
            ]}
          />

          {priceMode === 'margin' && (
            <Field label="Target margin %">
              <input type="range" min="0" max="80" className={inputCls} value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} />
              <div className="pp-num text-right text-[13px]">{targetMargin}%</div>
            </Field>
          )}
          {priceMode === 'price' && (
            <Field label="Sell price (RM)">
              <input type="number" className={inputCls} value={desiredPrice} onChange={(e) => setDesiredPrice(e.target.value)} />
            </Field>
          )}

          {priceMode !== 'compare' && (
            <Blueprint className="bg-accent-900 border-accent-900 p-4" cornerColor="var(--color-accent-300)">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase text-accent-300">Sell price</div>
                  <div className="pp-num text-[22px] text-white">{rm(priceResult.sellPrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-accent-300">Profit</div>
                  <div className={`pp-num text-[22px] ${profitPlateClass(priceResult.profit)}`}>{rm(priceResult.profit)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-accent-300">Margin</div>
                  <div className="pp-num text-[22px] text-white">{priceResult.margin.toFixed(1)}%</div>
                </div>
              </div>
            </Blueprint>
          )}

          {priceMode === 'compare' && (
            <div className="card border border-divider">
              <div className="flex justify-between text-[13px]"><span className="text-muted">Self-painted cost</span><span className="pp-num">{selfCost !== undefined ? rm(selfCost) : '—'}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-muted">Painter-hired cost</span><span className="pp-num">{hiredCost !== undefined ? rm(hiredCost) : '—'}</span></div>
              <p className="m-0 text-[11px] text-muted">Based on the "Painting (Self)" / "Painter (Hired)" labor rates, using the hours configured on this product.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
