import React from 'react';
import clsx from 'clsx';

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon: Icon, trend, color = 'brand' }) => {
  const colors = {
    brand:   'text-brand-400 bg-brand-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
    amber:   'text-amber-400 bg-amber-900/30',
    red:     'text-red-400 bg-red-900/30',
    orange:  'text-orange-400 bg-orange-900/30',
  };
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
            <Icon size={16} className={colors[color].split(' ')[0]} />
          </div>
        )}
      </div>
      <div className="text-2xl font-display font-semibold text-slate-100 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
      {trend !== undefined && (
        <div className={clsx('text-xs font-medium mt-1', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
};

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, className, showLabel = false }) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const color =
    pct >= 75 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-brand-500' :
    pct >= 25 ? 'bg-amber-500' :
    'bg-red-500';

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="progress-bar flex-1">
        <div className={clsx('progress-fill', color)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-400 w-8 text-right">{pct}%</span>
      )}
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    'Completed':   'badge-green',
    'In Progress': 'badge-blue',
    'Planned':     'badge-gray',
    'Delayed':     'badge-red',
    'Cancelled':   'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
};

export const SeverityBadge = ({ severity }) => {
  const map = { info: 'badge-blue', warning: 'badge-amber', critical: 'badge-red' };
  return <span className={map[severity] || 'badge-gray'}>{severity}</span>;
};

export const RegionBadge = ({ region }) => {
  const map = {
    'North':     'badge-blue',
    'South':     'badge-green',
    'East':      'badge-amber',
    'West':      'badge-saffron',
    'Northeast': 'badge-gray',
    'Central':   'badge-blue',
  };
  return <span className={map[region] || 'badge-gray'}>{region}</span>;
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className="flex items-center justify-center p-8">
      <div className={clsx(s, 'border-2 border-brand-500 border-t-transparent rounded-full animate-spin')} />
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && <Icon size={40} className="text-slate-600 mb-4" />}
    <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
    {desc && <p className="text-slate-500 text-sm mb-4">{desc}</p>}
    {action}
  </div>
);

// ── Page header ───────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6 gap-4">
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-100">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full animate-fade-up', maxWidth)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="font-display font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-100 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ── Table wrapper ─────────────────────────────────────────────────────────────
export const Table = ({ headers, children, className }) => (
  <div className={clsx('overflow-x-auto', className)}>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-800">
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left label">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

// ── Select input ──────────────────────────────────────────────────────────────
export const Select = ({ value, onChange, options, placeholder, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={clsx('input text-sm appearance-none', className)}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);
