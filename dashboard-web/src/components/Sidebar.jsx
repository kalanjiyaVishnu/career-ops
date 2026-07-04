import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Inbox, X, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase, label: 'Applications' },
  { to: '/interviews', icon: Calendar, label: 'Interviews' },
  { to: '/pipeline', icon: Inbox, label: 'Pipeline' },
];

export default function Sidebar({ collapsed, onToggle, mobile, onClose }) {
  return (
    <aside className={`
      ${mobile ? 'relative w-72' : `fixed left-0 top-0 h-full transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-60'}`}
      bg-slate-900 border-r border-slate-800 flex flex-col z-40
    `}>
      {/* Header */}
      <div className={`flex items-center h-16 border-b border-slate-800 px-4 ${collapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 9v11" />
              </svg>
            </div>
            <span className="font-bold text-slate-100 text-sm">Career Ops</span>
          </div>
        )}
        {mobile ? (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-800 ml-auto">
            <X size={18} />
          </button>
        ) : (
          <button onClick={onToggle} className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-800 transition-colors ${collapsed ? 'mx-auto' : ''}`}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
            title={collapsed && !mobile ? label : undefined}
          >
            <Icon size={19} className="shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {(!collapsed || mobile) && (
        <div className="px-4 py-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-600">Career Ops Dashboard</p>
          <p className="text-[11px] text-slate-700">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
