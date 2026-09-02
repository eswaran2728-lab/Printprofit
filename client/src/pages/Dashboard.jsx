import { useEffect, useState } from 'react';
import { dashboardApi, salesApi } from '../api/client';
import { Blueprint, Tag, rm, profitPlateClass, profitClass } from '../components/ui';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(ym) {
  if (!ym) return '';
  const [, m] = ym.split('-');
  return MONTH_NAMES[Number(m) - 1] || ym;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.get().then(setData).catch((e) => setError(e.message));
    salesApi.list().then((sales) => {
      const sorted = [...sales].sort((a, b) => (a.date < b.date ? 1 : -1));
      setRecentSales(sorted.slice(0, 4));
    });
  }, []);

  if (error) return <p className="text-sm text-danger-700">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading…</p>;

  const lowStockItems = [
    ...data.lowStockMaterials.map((m) => ({ id: m.id, name: `${m.material} ${m.color || ''}`.trim(), remain: `${m.stockGrams}g` })),
    ...data.lowStockHardware.map((h) => ({ id: h.id, name: h.item, remain: `${h.stock}` })),
  ];
  const topProducts = data.mostProfitable.slice(0, 3);
  const maxTop = Math.max(1, ...topProducts.map((t) => t.profit));

  return (
    <div className="flex flex-col gap-4">
      <Blueprint className="bg-accent-900 border-accent-900 p-4" cornerColor="var(--color-accent-300)">
        <div className="text-[10px] tracking-[0.1em] uppercase text-accent-300">{monthLabel(data.month)} profit</div>
        <div className={`pp-num text-[40px] ${profitPlateClass(data.profit)}`}>{rm(data.profit)}</div>
        <div className="mt-2.5 flex gap-4">
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-accent-300">Margin</div>
            <div className="pp-num text-[20px] text-white">{data.margin.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-accent-300">Revenue</div>
            <div className="pp-num text-[20px] text-white">{rm(data.revenue)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-accent-300">Sales</div>
            <div className="pp-num text-[20px] text-white">{data.salesCount}</div>
          </div>
        </div>
      </Blueprint>

      {lowStockItems.length > 0 && (
        <Blueprint className="bg-warn-100 border-warn-700 p-3 px-3.5" cornerColor="var(--color-warn-700)">
          <div className="mb-1.5 flex items-center justify-between">
            <h6 className="m-0 text-warn-900">Reorder soon</h6>
            <Tag tone="warn">{lowStockItems.length}</Tag>
          </div>
          {lowStockItems.map((ls) => (
            <div key={ls.id} className="flex justify-between py-1 text-[13px] text-warn-900">
              <span>{ls.name}</span>
              <span className="pp-num">{ls.remain}</span>
            </div>
          ))}
        </Blueprint>
      )}

      <section>
        <h6 className="mb-2 text-accent-700">Recent sales</h6>
        <div className="flex flex-col gap-2">
          {recentSales.map((s) => (
            <Blueprint key={s.id} corners={['tl', 'br']} className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-[14px] font-medium">{s.productName}</div>
                <div className="text-[11px] text-muted">{s.date} · {s.buyerPlatform}</div>
              </div>
              <div className={`pp-num ${profitClass(s.profit)}`}>{rm(s.profit)}</div>
            </Blueprint>
          ))}
          {recentSales.length === 0 && <p className="text-sm text-muted">No sales logged yet.</p>}
        </div>
      </section>

      <section>
        <h6 className="mb-2 text-accent-700">Most profitable</h6>
        <div className="flex flex-col gap-1.5">
          {topProducts.map((p) => (
            <div key={p.name} className="flex items-center gap-2.5">
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">{p.name}</div>
              <div className="relative h-1.5 flex-1 bg-accent-200">
                <div className="absolute inset-0 bg-accent-600" style={{ width: `${Math.max(6, (p.profit / maxTop) * 100)}%` }} />
              </div>
              <div className="pp-num w-16 text-right text-[13px] text-success-700">{rm(p.profit)}</div>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-sm text-muted">No sales logged yet.</p>}
        </div>
      </section>
    </div>
  );
}
