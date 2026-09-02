import { useEffect, useState } from 'react';
import { salesApi, productsApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, rm, profitClass } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const empty = { date: today(), productId: '', buyerPlatform: '', sellPrice: '' };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(empty);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanHint, setScanHint] = useState('');

  const load = () => salesApi.list().then((data) => setSales([...data].sort((a, b) => (a.date < b.date ? 1 : -1))));

  useEffect(() => {
    load();
    productsApi.list().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);
  const preview =
    selectedProduct && form.sellPrice !== ''
      ? (() => {
          const cost = selectedProduct.cost.totalCost;
          const sell = Number(form.sellPrice) || 0;
          const profit = sell - cost;
          const margin = sell > 0 ? (profit / sell) * 100 : 0;
          return { cost, profit, margin };
        })()
      : null;

  const submit = async (e) => {
    e.preventDefault();
    await salesApi.create(form);
    setForm({ ...empty, date: today() });
    setShowAdd(false);
    load();
  };

  const syncSummary = async () => {
    setSyncing(true);
    await salesApi.syncSummary();
    setSyncing(false);
  };

  const onScanFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanning(true);
    setScanError('');
    setScanHint('');
    try {
      const data = await salesApi.extract(file);
      setForm((f) => ({
        ...f,
        date: data.date || f.date,
        sellPrice: data.itemPrice ?? f.sellPrice,
        buyerPlatform: data.platform || f.buyerPlatform,
        productId: data.matchedProductId || f.productId,
      }));
      setShowAdd(true);
      const hints = [];
      if (!data.matchedProductId && data.productName) {
        hints.push(`Detected "${data.productName}" — no matching product found, please select one manually.`);
      } else if (data.matchedProductId) {
        hints.push(`Matched product from screenshot: "${data.productName}". Review before saving.`);
      }
      if (!data.productName && data.netAmount != null) {
        hints.push('This looks like a settlement/payout screen — no product name shown, please select the product manually.');
      }
      if (data.netAmount != null) {
        hints.push(`Sell price filled from revenue before platform fees (RM${data.itemPrice}). Net after TikTok fees would be RM${data.netAmount}.`);
      }
      setScanHint(hints.join(' '));
    } catch (err) {
      setScanError(err.response?.data?.error || 'Could not read that screenshot. Enter the sale manually.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[24px]">Sales Log</h2>
        <div className="flex items-center gap-3">
          <button onClick={syncSummary} disabled={syncing} className="btn-ghost text-[11px]">
            {syncing ? 'Syncing…' : 'Sync summary'}
          </button>
          <Button onClick={() => setShowAdd(true)}>+ Sale</Button>
        </div>
      </div>

      <Blueprint className="p-3.5">
        <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-divider py-2.5 text-[13px] text-accent-700">
          {scanning ? 'Reading screenshot…' : '📷 Scan order screenshot (auto-fill)'}
          <input type="file" accept="image/*" className="hidden" onChange={onScanFile} disabled={scanning} />
        </label>
        {scanError && <p className="mt-2 text-[11px] text-danger-700">{scanError}</p>}
        {scanHint && <p className="mt-2 text-[11px] text-warn-700">{scanHint}</p>}
      </Blueprint>

      {showAdd && (
        <Blueprint className="p-3.5">
        <form onSubmit={submit} className="flex flex-col gap-2.5">
          <h6 className="m-0 text-accent-700">New sale</h6>
          <Field label="Product">
            <select
              className={inputCls}
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2.5">
            <Field label="Platform" className="flex-1">
              <input
                className={inputCls}
                value={form.buyerPlatform}
                onChange={(e) => setForm({ ...form, buyerPlatform: e.target.value })}
                placeholder="Shopee / Direct"
              />
            </Field>
            <Field label="Date" className="flex-1">
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Sell price (RM)">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              required
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
            />
          </Field>
          {preview && (
            <div className="flex gap-4 border-t border-divider pt-2">
              <div>
                <div className="text-[10px] uppercase text-muted">Cost</div>
                <div className="pp-num text-[15px]">{rm(preview.cost)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Profit</div>
                <div className={`pp-num text-[15px] ${profitClass(preview.profit)}`}>{rm(preview.profit)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Margin</div>
                <div className="pp-num text-[15px]">{preview.margin.toFixed(1)}%</div>
              </div>
            </div>
          )}
          <div className="mt-1 flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Save sale</Button>
          </div>
        </form>
        </Blueprint>
      )}

      <div className="flex flex-col gap-2">
        {sales.map((s) => (
          <Blueprint key={s.id} corners={['tl', 'br']} className="flex items-center gap-3 px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium">{s.productName}</div>
              <div className="mt-0.5 text-[11px] text-muted">{s.date} · {s.buyerPlatform} · sold {rm(s.sellPrice)}</div>
            </div>
            <div className="flex-none text-right">
              <div className={`pp-num text-[17px] ${profitClass(s.profit)}`}>{rm(s.profit)}</div>
              <div className="text-[11px] text-muted">{s.margin.toFixed(1)}% margin</div>
            </div>
          </Blueprint>
        ))}
        {sales.length === 0 && <p className="text-sm text-muted">No sales logged yet.</p>}
      </div>
    </div>
  );
}
