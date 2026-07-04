import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Inbox, Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import ChatBot from './ChatBot.jsx';

const BOTTOM_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/applications', icon: Briefcase, label: 'Apps' },
  { to: '/interviews', icon: Calendar, label: 'Schedule' },
  { to: '/pipeline', icon: Inbox, label: 'Pipeline' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <Sidebar mobile onClose={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className={`transition-all duration-300 ${collapsed ? 'md:pl-[72px]' : 'md:pl-60'} pb-20 md:pb-6`}>
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-slate-950/95 backdrop-blur border-b border-slate-800/60">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="white" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 9v11" />
              </svg>
            </div>
            <span className="font-semibold text-slate-100 text-sm">Career Ops</span>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex pb-safe">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>

      <ChatBot />
    </div>
  );
}
