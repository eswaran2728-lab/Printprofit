import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { syncApi } from '../api/client';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◧', end: true },
  { to: '/sales', label: 'Sales', icon: '৲' },
  { to: '/cost', label: 'Cost', icon: '⚙' },
  { to: '/stock', label: 'Stock', icon: '▦' },
  { to: '/more', label: 'More', icon: '⋯' },
];

const MORE_PATHS = ['/more', '/more/printers', '/more/labor', '/more/products'];

export default function Layout() {
  const location = useLocation();
  const [sync, setSync] = useState({ pending: 0, processing: false });

  useEffect(() => {
    let cancelled = false;
    const poll = () => syncApi.status().then((s) => !cancelled && setSync(s)).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const pending = sync.pending > 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-bg text-text font-body">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-bg px-4 pt-3.5 pb-2.5">
        <div className="flex items-baseline gap-2">
          <h1 className="m-0 text-[20px]">PrintProfit</h1>
          <span className="text-[10px] tracking-[0.08em] uppercase text-accent-700">Eshan Creations</span>
        </div>
        <div className="flex items-center gap-1.5 py-1">
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{ background: pending ? 'var(--color-warn-700)' : 'var(--color-success-700)' }}
          />
          <span className="text-[11px] text-accent-700">
            {pending ? `Sync pending${sync.pending > 1 ? ` (${sync.pending})` : ''}` : 'Synced'}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-divider bg-bg">
        {NAV.map((n) => {
          const isMore = n.to === '/more' && MORE_PATHS.includes(location.pathname);
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-[3px] py-[9px] pb-2.5 ${
                  isActive || isMore ? 'font-semibold text-accent-700' : 'text-text opacity-60'
                }`
              }
            >
              <span className="text-[17px] leading-none">{n.icon}</span>
              <span className="text-[10px]">{n.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
