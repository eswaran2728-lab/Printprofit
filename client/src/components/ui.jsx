export function rm(n) {
  const v = Number(n) || 0;
  return 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ALL_CORNERS = ['tl', 'tr', 'bl', 'br'];

export function Blueprint({ children, className = '', corners = ALL_CORNERS, cornerColor, ...props }) {
  return (
    <div className={`blueprint ${className}`} {...props}>
      {corners.map((c) => (
        <i key={c} className={`corner ${c}`} style={cornerColor ? { color: cornerColor } : undefined} />
      ))}
      {children}
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`field flex flex-col ${className}`}>
      {label && <label>{label}</label>}
      {children}
    </label>
  );
}

export const inputCls = 'input';

export function Button({ children, variant = 'primary', block = false, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button className={`btn ${variants[variant]} ${block ? 'btn-block' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'neutral', className = '' }) {
  const tones = {
    warn: 'tag-warn',
    accent: 'tag-accent',
    neutral: 'tag-neutral',
  };
  return <span className={`tag ${tones[tone]} ${className}`}>{children}</span>;
}

export function Seg({ options, value, onChange, name, className = '' }) {
  return (
    <div className={`seg ${className}`}>
      {options.map((opt) => (
        <label key={opt.value} className="seg-opt">
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function profitClass(n) {
  return Number(n) >= 0 ? 'text-success-700' : 'text-danger-700';
}

export function profitPlateClass(n) {
  return Number(n) >= 0 ? 'text-[#9fd9ab]' : 'text-[#e79a8f]';
}
