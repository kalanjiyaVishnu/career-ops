export const STATUSES = ['Evaluated','Applied','Responded','Interview','Offer','Rejected','Discarded','Expired','Not Available','SKIP'];

export const STATUS_CONFIG = {
  Evaluated:  { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/25',   dot: '#60a5fa', hex: '#3b82f6' },
  Applied:    { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/25',  dot: '#fbbf24', hex: '#f59e0b' },
  Responded:  { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25', dot: '#fb923c', hex: '#f97316' },
  Interview:  { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25', dot: '#a78bfa', hex: '#8b5cf6' },
  Offer:      { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/25',  dot: '#4ade80', hex: '#22c55e' },
  Rejected:   { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/25',    dot: '#f87171', hex: '#ef4444' },
  Discarded:  { bg: 'bg-slate-500/15',  text: 'text-slate-400',  border: 'border-slate-500/25',  dot: '#94a3b8', hex: '#64748b' },
  Expired:         { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   border: 'border-zinc-500/25',   dot: '#a1a1aa', hex: '#71717a' },
  'Not Available': { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/25',   dot: '#fb7185', hex: '#f43f5e' },
  SKIP:       { bg: 'bg-slate-600/15',  text: 'text-slate-500',  border: 'border-slate-600/25',  dot: '#64748b', hex: '#475569' },
};

export const INTERVIEW_TYPES = ['phone','video','onsite','technical','hr','panel','case','take-home'];
export const INTERVIEW_OUTCOMES = ['pending','passed','failed','cancelled'];
export const EMAIL_STATUSES = ['sent','opened','replied','bounced','no-response'];

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Evaluated;
}

export function scoreColor(score) {
  const n = parseFloat(score);
  if (isNaN(n)) return 'text-slate-400';
  if (n >= 4.5) return 'text-green-400';
  if (n >= 4.0) return 'text-emerald-400';
  if (n >= 3.5) return 'text-yellow-400';
  if (n >= 3.0) return 'text-orange-400';
  return 'text-red-400';
}

export function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

export function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

export function timeAgo(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
