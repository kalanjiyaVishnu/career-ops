import { getStatusConfig } from '../utils/index.js';

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const c = getStatusConfig(status);
  const sizes = { xs: 'px-1.5 py-0.5 text-xs', sm: 'px-2.5 py-0.5 text-xs', md: 'px-3 py-1 text-sm' };
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${c.bg} ${c.text} ${c.border} ${sizes[size] || sizes.sm} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {status}
    </span>
  );
}
