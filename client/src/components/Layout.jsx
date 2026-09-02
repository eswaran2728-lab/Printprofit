import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/materials', label: 'Materials', icon: '🧵' },
  { to: '/hardware', label: 'Hardware', icon: '🔩' },
  { to: '/printers', label: 'Printers', icon: '🖨️' },
  { to: '/labor', label: 'Labor', icon: '👷' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/pricing', label: 'Pricing', icon: '💰' },
  { to: '/sales', label: 'Sales', icon: '🧾' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">PrintProfit</h1>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
            <button onClick={logout} className="text-xs text-gray-500 underline">
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-3 pb-20 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex overflow-x-auto z-10">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-[70px] flex flex-col items-center py-2 text-[11px] ${
                isActive ? 'text-purple-600 font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
