import React, { useState, useRef, useEffect } from 'react';

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'muted' | 'navy';
const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
  ai: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  muted: 'bg-slate-50 text-slate-500 border border-slate-200',
  navy: 'bg-slate-800 text-white',
};
export function Badge({ variant = 'default', children, className = '' }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`}>{children}</span>;
}

// ── Button ────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'success';
type BtnSize = 'sm' | 'md' | 'lg';
const btnStyles: Record<BtnVariant, string> = {
  primary: 'bg-[#1e3a5f] text-white hover:bg-[#162d4a] border border-[#1e3a5f]',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  ai: 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600',
};
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};
export function Button({ variant = 'primary', size = 'md', children, onClick, disabled, className = '', type = 'button' }: { variant?: BtnVariant; size?: BtnSize; children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnStyles[variant]} ${btnSizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, type = 'text', placeholder, value, onChange, error, hint, className = '', icon, rightElement }: {
  label?: string; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void;
  error?: string; hint?: string; className?: string; icon?: React.ReactNode; rightElement?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className={`w-full border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 text-sm transition-all
            focus:outline-none focus:border-[#2563a8] focus:ring-2 focus:ring-[#2563a8]/15
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}
            ${icon ? 'pl-9' : 'pl-3.5'} ${rightElement ? 'pr-10' : 'pr-3.5'} py-2`}
        />
        {rightElement && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, className = '' }: {
  label?: string; value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="border border-slate-300 rounded-lg bg-white text-slate-900 text-sm px-3 py-2 focus:outline-none focus:border-[#2563a8] focus:ring-2 focus:ring-[#2563a8]/15 transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
export function KpiCard({ label, value, change, changeLabel, icon, color = 'navy', sublabel }: {
  label: string; value: string | number; change?: number; changeLabel?: string;
  icon?: React.ReactNode; color?: string; sublabel?: string;
}) {
  const isPositive = change !== undefined && change >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {icon && <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      {change !== undefined && (
        <p className={`text-xs font-medium mt-2 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% {changeLabel}
        </p>
      )}
    </Card>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
const avatarColors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-sky-600', 'bg-rose-600', 'bg-violet-600'];
export function Avatar({ initials, size = 'md', color }: { initials: string; size?: 'xs' | 'sm' | 'md' | 'lg'; color?: string }) {
  const colorIdx = (initials.charCodeAt(0) || 0) % avatarColors.length;
  const bg = color || avatarColors[colorIdx];
  const sz = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size];
  return <div className={`${sz} ${bg} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}>{initials}</div>;
}

// ── Status Dot ────────────────────────────────────────────────────────────
const statusDotStyles: Record<string, string> = {
  new: 'bg-slate-400',
  open: 'bg-sky-500',
  pending: 'bg-amber-500',
  escalated: 'bg-red-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-slate-300',
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
  critical: 'bg-red-600',
};
export function StatusDot({ status }: { status: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${statusDotStyles[status] || 'bg-slate-400'}`} />;
}

// ── Tabs ──────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
            ${active === t ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────
export function Table({ headers, children, className = '' }: { headers: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer hover:bg-slate-50' : ''} transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 ${className}`}>{children}</td>;
}

// ── Progress Bar ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#6366f1', className = '' }: { value: number; max?: number; color?: string; className?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`h-1.5 rounded-full bg-slate-100 overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Confidence Badge ──────────────────────────────────────────────────────
export function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : value >= 65 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>⬥ {value}% confidence</span>;
}

// ── AI Card ───────────────────────────────────────────────────────────────
export function AiBanner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-indigo-200 bg-indigo-50 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Insight</span>
      </div>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// ── Dropdown ──────────────────────────────────────────────────────────────
export function Dropdown({ trigger, children, align = 'right' }: { trigger: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-1 z-50 min-w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }) {
  const styles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-[#1e3a5f] text-white',
  }[type];
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${styles}`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ── Risk Badge ────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    high: 'bg-red-50 text-red-700 border border-red-200',
    critical: 'bg-red-100 text-red-800 border border-red-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[level] || styles.medium}`}>{level.charAt(0).toUpperCase() + level.slice(1)} Risk</span>;
}

// ── Priority Badge ────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: 'bg-slate-50 text-slate-500 border border-slate-200',
    medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    critical: 'bg-red-50 text-red-700 border border-red-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[priority] || styles.medium}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

// ── Ticket Status Badge ───────────────────────────────────────────────────
export function TicketStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-slate-100 text-slate-600',
    open: 'bg-sky-50 text-sky-700 border border-sky-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    escalated: 'bg-red-50 text-red-700 border border-red-200',
    resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    closed: 'bg-slate-50 text-slate-500',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.new}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
