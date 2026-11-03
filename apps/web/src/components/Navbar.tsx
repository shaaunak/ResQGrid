import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  Search,
  Moon,
  Sun,
  User as UserIcon,
  ChevronDown,
  Check,
  Radio,
  HelpCircle,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useWebSocket } from '../context/WebSocketContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, loginAsPersona, logout } = useAuth();
  const { theme, toggleTheme, setCommandPaletteOpen, setShortcutsOpen } = useUI();
  const { status: wsStatus } = useWebSocket();
  const location = useLocation();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: UserRole[] = ['CITIZEN', 'OPERATOR', 'RESPONDER', 'COORDINATOR', 'ADMIN'];

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path === '/command') return 'Emergency Command Center';
    if (path === '/citizen') return 'Citizen Portal';
    if (path === '/track') return 'Incident Tracking';
    if (path === '/responder') return 'Field Responder Dispatch';
    if (path === '/inventory') return 'Relief Inventory';
    if (path === '/scenarios') return 'Scenario Commander';
    if (path === '/analytics') return 'Operational Analytics';
    if (path === '/health') return 'Cloud Infrastructure';
    return path.replace('/', '');
  };

  return (
    <header className="h-14 bg-rq-surface border-b border-rq-border px-4 flex items-center justify-between z-30 sticky top-0 font-sans select-none">
      {/* Left: Brand Identity & Breadcrumbs */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-md bg-rq-navy flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-rq-ink">ResQGrid</span>
              <span className="px-1.5 py-0.2 rounded-pill bg-rq-surface-2 text-xs font-mono text-rq-muted border border-rq-border">
                MUMBAI
              </span>
            </div>
            <p className="text-xs text-rq-muted tracking-tight hidden sm:block">
              Disaster Response & Coordination
            </p>
          </div>
        </Link>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-rq-muted">
          <span>/</span>
          <span className="text-rq-ink font-medium">{getBreadcrumbs()}</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-rq-surface-2 hover:bg-rq-border/40 text-rq-muted hover:text-rq-ink border border-rq-border rounded-input text-xs transition"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search incidents, squads, depots, or actions...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-rq-surface border border-rq-border rounded shadow-subtle">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: WebSocket status, Theme, Notifications, Role Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs" ref={dropdownRef}>
        {/* Real Live WebSocket Indicator */}
        <div
          className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded bg-rq-surface-2 border border-rq-border text-xs font-mono"
          title={`Real-time WebSocket telemetry: ${wsStatus}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : wsStatus === 'connecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-red-500'
            }`}
          />
          <span className="text-rq-muted">LIVE WS</span>
        </div>

        {/* Shortcuts Help (?) */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-1.5 rounded-md hover:bg-rq-surface-2 text-rq-muted hover:text-rq-ink transition border border-transparent hover:border-rq-border"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-rq-surface-2 text-rq-muted hover:text-rq-ink transition border border-transparent hover:border-rq-border"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Command Room Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 rounded-md hover:bg-rq-surface-2 text-rq-muted hover:text-rq-ink transition relative border border-transparent hover:border-rq-border"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#E4572E] rounded-full ring-2 ring-rq-surface" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-rq-surface border border-rq-border rounded-card shadow-floating p-3 z-50 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-rq-border">
                <span className="font-semibold text-rq-ink">Notifications</span>
                <button
                  onClick={() => setUnreadNotifications(0)}
                  className="text-xs text-rq-navy hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              <div className="divide-y divide-rq-border max-h-60 overflow-y-auto">
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rq-ink">Flash Flood Warning</span>
                    <span className="text-xs font-mono text-rq-muted">2m ago</span>
                  </div>
                  <p className="text-rq-muted text-xs">
                    Mithi River water levels nearing threshold near Kurla transit camp.
                  </p>
                </div>
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rq-ink">Low Stock Alert</span>
                    <span className="text-xs font-mono text-rq-muted">14m ago</span>
                  </div>
                  <p className="text-rq-muted text-xs">
                    Kurla West depot low on thermal emergency blankets.
                  </p>
                </div>
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rq-ink">Squad Dispatched</span>
                    <span className="text-xs font-mono text-rq-muted">28m ago</span>
                  </div>
                  <p className="text-rq-muted text-xs">
                    Bandra Water Rescue Alpha en route to incident INC-1042.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile & Logout */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-rq-surface-2 border border-rq-border transition text-left"
            >
              <div className="w-6 h-6 rounded-full bg-[#14284B] text-white flex items-center justify-center text-xs font-bold font-mono">
                {user.full_name[0]}
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-xs leading-none text-rq-ink">
                  {user.full_name}
                </div>
                <div className="text-[11px] font-mono text-rq-brand font-semibold leading-tight mt-0.5">
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-rq-muted" />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] text-white rounded-md text-xs font-mono font-bold shadow-subtle transition"
            >
              <span>Sign In</span>
            </Link>
          )}

          {profileDropdownOpen && user && (
            <div className="absolute right-0 mt-2 w-64 bg-rq-surface border border-rq-border rounded-card shadow-floating py-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-rq-border mb-1">
                <p className="text-xs font-bold text-rq-ink">
                  {user.full_name}
                </p>
                <p className="text-[11px] font-mono text-rq-muted">{user.email}</p>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    ROLE: {user.role}
                  </span>
                </div>
              </div>

              <div className="px-1 py-1">
                <Link
                  to="/docs"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-xs text-rq-ink hover:bg-rq-surface-2 transition"
                >
                  <span>System Architecture Specs</span>
                </Link>
                <Link
                  to="/evidence"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-xs text-rq-ink hover:bg-rq-surface-2 transition"
                >
                  <span>Faculty Compliance Dossier</span>
                </Link>
              </div>

              <div className="mt-1 pt-1 border-t border-rq-border px-1">
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-mono font-bold text-[#C8201B] hover:bg-red-50 rounded transition"
                >
                  Sign Out of Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
