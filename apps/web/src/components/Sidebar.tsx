import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Shield,
  Search,
  Truck,
  Box,
  Sparkles,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/command', label: 'Command Center', icon: MapPin },
    { to: '/citizen', label: 'Citizen Portal', icon: Shield },
    { to: '/track', label: 'Track Incident', icon: Search },
    { to: '/responder', label: 'Field Responder', icon: Truck },
    { to: '/inventory', label: 'Relief Inventory', icon: Box },
    { to: '/scenarios', label: 'Scenario Commander', icon: Sparkles },
    { to: '/analytics', label: 'Operational KPIs', icon: Activity },
    { to: '/health', label: 'Cloud & Health', icon: FileText },
  ];

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] sticky top-14 bg-rq-surface border-r border-rq-border flex flex-col justify-between transition-all duration-200 z-20 font-sans select-none flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Navigation list */}
      <div className="p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-rq-muted tracking-wider uppercase">
            Operations
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md transition text-xs ${
                  isActive
                    ? 'bg-rq-surface-2 text-rq-navy font-semibold shadow-subtle border border-rq-border'
                    : 'text-rq-muted hover:text-rq-ink hover:bg-rq-surface-2 border border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse / Expand rail toggle */}
      <div className="p-3 border-t border-rq-border bg-rq-surface-2 flex items-center justify-between">
        {!collapsed && (
          <div className="text-[11px] text-rq-muted font-mono leading-tight">
            <span>v1.2.0 • Active</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-md hover:bg-rq-surface text-rq-muted hover:text-rq-ink transition border border-transparent hover:border-rq-border ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
