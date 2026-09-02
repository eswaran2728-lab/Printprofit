import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/more/printers', label: 'Printers' },
  { to: '/more/labor', label: 'Labor & Painter Rates' },
  { to: '/more/products', label: 'Products' },
];

export default function More() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="m-0 text-[24px]">More</h2>
      {LINKS.map((l) => (
        <button
          key={l.to}
          onClick={() => navigate(l.to)}
          className="blueprint flex cursor-pointer items-center justify-between border bg-transparent px-3.5 py-3.5 text-left font-body text-text"
        >
          <i className="corner tl" /><i className="corner br" />
          <span className="text-[15px] font-medium">{l.label}</span>
          <span className="text-accent-600">→</span>
        </button>
      ))}

      {user && (
        <div className="mt-4 flex items-center justify-between px-1 text-[12px] text-muted">
          <span>{user.email}</span>
          <button onClick={logout} className="btn-ghost text-[12px]">Sign out</button>
        </div>
      )}
    </div>
  );
}
