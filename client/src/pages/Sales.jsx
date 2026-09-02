import { useEffect, useState } from 'react';
import { salesApi, productsApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const empty = { date: today(), productId: '', buyerPlatform: '', sellPrice: '' };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanHint, setScanHint] = useState('');

  const load = () => salesApi.list().then((data) => setSales([...data].reverse()));

  useEffect(() => {
    load();
    productsApi.list().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);
  const estCost = selectedProduct?.cost.totalCost || 0;
  const estProfit = (Number(form.sellPrice) || 0) - estCost;

  const submit = async (e) => {
    e.preventDefault();
    await salesApi.create(form);
    setForm({ ...empty, date: today() });
    load();
  };

  const remove = async (id) => {
    await salesApi.remove(id);
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
      if (!data.matchedProductId && data.productName) {
        setScanHint(`Detected "${data.productName}" — no matching product found, please select one manually.`);
      } else if (data.matchedProductId) {
        setScanHint(`Matched product from screenshot: "${data.productName}". Review before saving.`);
      }
    } catch (err) {
      setScanError(err.response?.data?.error || 'Could not read that screenshot. Enter the sale manually.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Sales Log</h2>
        <button onClick={syncSummary} className="text-xs text-purple-600 underline" disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync Summary Now'}
        </button>
      </div>

      <Card>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-3 text-sm text-purple-600 cursor-pointer">
          {scanning ? 'Reading screenshot…' : '📷 Scan order screenshot (auto-fill)'}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onScanFile} disabled={scanning} />
        </label>
        {scanError && <p className="text-xs text-red-500 mt-2">{scanError}</p>}
        {scanHint && <p className="text-xs text-amber-600 mt-2">{scanHint}</p>}
      </Card>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Product">
            <select className={inputCls} required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Buyer / Platform">
            <input className={inputCls} placeholder="e.g. TikTok Shop" value={form.buyerPlatform} onChange={(e) => setForm({ ...form, buyerPlatform: e.target.value })} />
          </Field>
          <Field label="Sell Price (RM)">
            <input type="number" step="0.01" className={inputCls} required value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
          </Field>
          {selectedProduct && (
            <div className="col-span-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Cost: {rm(estCost)} · Est. Profit: <span className={estProfit >= 0 ? 'text-green-600' : 'text-red-500'}>{rm(estProfit)}</span>
            </div>
          )}
          <div className="col-span-2">
            <Button type="submit">Log Sale</Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {sales.map((s) => (
          <Card key={s.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{s.productName}</p>
                <p className="text-xs text-gray-500">{s.date} · {s.buyerPlatform}</p>
                <p className="text-xs mt-1">
                  Sell {rm(s.sellPrice)} · Cost {rm(s.totalCost)} ·{' '}
                  <span className={s.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    Profit {rm(s.profit)} ({s.margin.toFixed(1)}%)
                  </span>
                </p>
              </div>
              <button className="text-red-500 text-xs" onClick={() => remove(s.id)}>Delete</button>
            </div>
          </Card>
        ))}
        {sales.length === 0 && <p className="text-sm text-gray-400">No sales logged yet.</p>}
      </div>
    </div>
  );
}
