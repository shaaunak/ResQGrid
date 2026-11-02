import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map,
  AlertTriangle,
  Truck,
  Boxes,
  Cpu,
  BarChart3,
  Server,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const navItems = [
    { to: '/command', label: 'Command Center', icon: Map, roles: ['OPERATOR', 'ADMIN', 'COORDINATOR'] },
    { to: '/citizen', label: 'Citizen Portal', icon: AlertTriangle, roles: ['CITIZEN', 'OPERATOR', 'ADMIN'] },
    { to: '/track', label: 'Track Incident', icon: Search, roles: ['CITIZEN', 'OPERATOR', 'RESPONDER', 'COORDINATOR', 'ADMIN'] },
    { to: '/responder', label: 'Field Responder', icon: Truck, roles: ['RESPONDER', 'OPERATOR', 'ADMIN'] },
    { to: '/inventory', label: 'Relief Inventory', icon: Boxes, roles: ['COORDINATOR', 'OPERATOR', 'ADMIN'] },
    { to: '/scenario', label: 'Scenario Commander', icon: Cpu, roles: ['OPERATOR', 'COORDINATOR', 'ADMIN'] },
    { to: '/analytics', label: 'Operational KPIs', icon: BarChart3, roles: ['OPERATOR', 'COORDINATOR', 'ADMIN'] },
    { to: '/health', label: 'Cloud & Health', icon: Server, roles: ['ADMIN', 'OPERATOR'] },
  ];

  return (
    <aside className="w-16 md:w-56 bg-command-darkest border-r border-command-border flex flex-col justify-between select-none">
      <div className="py-3">
        <div className="px-3 mb-2 hidden md:block text-[10px] font-mono uppercase text-command-muted tracking-wider">
          Operations Rail
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-medium transition ${
                    isActive
                      ? 'bg-command-teal/20 text-white border-l-2 border-command-teal font-semibold'
                      : 'text-command-muted hover:text-white hover:bg-command-surface/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-command-border hidden md:block text-xs font-mono text-command-muted">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-400">AWS Region</span>
          <span className="text-emerald-400">ap-south-1</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Compute</span>
          <span className="text-cyan-400">EC2 VPC</span>
        </div>
      </div>
    </aside>
  );
};

