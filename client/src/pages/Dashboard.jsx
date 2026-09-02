import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/client';
import { Card, Stat, rm } from '../components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.get().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!data) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">This Month ({data.month})</h2>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Revenue" value={rm(data.revenue)} />
        <Stat label="Cost" value={rm(data.cost)} />
        <Stat label="Profit" value={rm(data.profit)} tone={data.profit >= 0 ? 'good' : 'bad'} />
        <Stat label="Margin" value={`${data.margin.toFixed(1)}%`} />
      </div>

      {(data.lowStockMaterials.length > 0 || data.lowStockHardware.length > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <h3 className="font-semibold text-amber-700 mb-2">⚠️ Low Stock Alerts</h3>
          <ul className="text-sm text-amber-800 space-y-1">
            {data.lowStockMaterials.map((m) => (
              <li key={m.id}>
                {m.material} {m.color} — {m.stockGrams}g left (min {m.minStockGrams}g)
              </li>
            ))}
            {data.lowStockHardware.map((h) => (
              <li key={h.id}>
                {h.item} — {h.stock} left (min {h.minStock})
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-gray-700 mb-2">Most Profitable Products</h3>
        {data.mostProfitable.length === 0 && <p className="text-sm text-gray-400">No sales logged yet.</p>}
        <ul className="text-sm divide-y">
          {data.mostProfitable.map((p) => (
            <li key={p.name} className="flex justify-between py-1.5">
              <span>{p.name}</span>
              <span className="font-medium text-green-600">{rm(p.profit)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        {data.sync.pending > 0 ? `Sync pending: ${data.sync.pending} item(s)…` : 'All data synced to Google Sheets'}
      </p>
    </div>
  );
}
