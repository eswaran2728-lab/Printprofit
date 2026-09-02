export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-xl shadow-sm border p-4 ${className}`}>{children}</div>;
}

export function Stat({ label, value, tone = 'default' }) {
  const colors = {
    default: 'text-gray-800',
    good: 'text-green-600',
    bad: 'text-red-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xl font-bold ${colors[tone]}`}>{value}</span>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'rounded-lg px-4 py-2 text-sm font-medium transition';
  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function rm(n) {
  const num = Number(n) || 0;
  return `RM ${num.toFixed(2)}`;
}
