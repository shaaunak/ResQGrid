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
  FileCheck2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

  // Role-Based Navigation Filtering:
  // - CITIZEN: Citizen Portal, Track Incident, Overview
  // - RESPONDER: Field Responder, Track Incident, Overview
  // - COORDINATOR: Relief Inventory, Overview, Command Center, Situation Brief / Analytics
  // - OPERATOR & ADMIN: All navigation items
  const allNavItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, roles: ['CITIZEN', 'RESPONDER', 'COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/command', label: 'Command Center', icon: MapPin, roles: ['COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/citizen', label: 'Citizen Portal', icon: Shield, roles: ['CITIZEN', 'OPERATOR', 'ADMIN'] },
    { to: '/track', label: 'Track Incident', icon: Search, roles: ['CITIZEN', 'RESPONDER', 'COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/responder', label: 'Field Responder', icon: Truck, roles: ['RESPONDER', 'OPERATOR', 'ADMIN'] },
    { to: '/inventory', label: 'Relief Inventory', icon: Box, roles: ['COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/scenarios', label: 'Scenario Commander', icon: Sparkles, roles: ['OPERATOR', 'ADMIN'] },
    { to: '/analytics', label: 'Operational KPIs', icon: Activity, roles: ['COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/evidence', label: 'Project Evidence', icon: FileCheck2, roles: ['OPERATOR', 'ADMIN', 'COORDINATOR'] },
    { to: '/audit', label: 'Audit Trail', icon: ScrollText, roles: ['OPERATOR', 'ADMIN'] },
    { to: '/health', label: 'Cloud & Health', icon: FileText, roles: ['OPERATOR', 'ADMIN'] },
  ];

  const currentRole = role || 'OPERATOR';
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] sticky top-14 bg-rq-surface border-r border-rq-border flex flex-col justify-between transition-all duration-200 z-20 font-sans select-none flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Navigation list */}
      <div className="p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-xs font-semibold text-rq-muted tracking-wider uppercase font-mono">
              {currentRole} WORKSPACE
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live WS Connected" />
          </div>
        )}

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md transition text-xs ${
                  isActive
                    ? 'bg-rq-surface-2 text-[#14284B] font-semibold shadow-subtle border border-rq-border'
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
          <div className="text-xs text-rq-muted font-mono leading-tight">
            <span>Role: <strong>{currentRole}</strong></span>
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
