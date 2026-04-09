import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ClipboardList, Target,
  BarChart3, Bell, Settings, LogOut, Menu, X,
  ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useAlertsContext } from '../../context/AlertsContext';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/activities', icon: ClipboardList,   label: 'Activities'              },
  { to: '/aap',        icon: Target,          label: 'AAP Targets'             },
  { to: '/reports',    icon: BarChart3,       label: 'Reports'                 },
  { to: '/alerts',     icon: Bell,            label: 'Alerts',   badge: true   },
  { to: '/admin',      icon: Settings,        label: 'Admin',
    roles: ['superadmin', 'ministry'] },
];

export default function Layout() {
  const { user, logout, canAccess } = useAuth();
  const { connected } = useSocket() || {};
  const { unreadCount } = useAlertsContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-saffron-500 flex items-center justify-center text-white font-display font-bold text-sm">R</div>
          <div>
            <div className="font-display font-semibold text-slate-100 text-sm leading-tight">RealDash</div>
            <div className="text-xs text-slate-500 leading-tight">Ministry of Tourism</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.roles && !canAccess(item.roles)) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight size={12} className="text-brand-400" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-1">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          {connected
            ? <><div className="live-dot" /><span className="text-xs text-emerald-400">Live</span></>
            : <><WifiOff size={12} className="text-slate-500" /><span className="text-xs text-slate-500">Offline</span></>
          }
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-200">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-slate-900 border-r border-slate-800 z-50 animate-slide-in">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-h-screen flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-100">
            <Menu size={20} />
          </button>
          <span className="font-display font-semibold text-slate-100 text-sm">RealDash</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </header>

        <div className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
