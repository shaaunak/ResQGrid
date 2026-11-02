import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, User, LogOut, CheckCircle2, ChevronDown, Radio } from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, loginAsPersona } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handlePersonaSwitch = async (targetRole: UserRole) => {
    setDropdownOpen(false);
    await loginAsPersona(targetRole);
    if (targetRole === 'CITIZEN') navigate('/citizen');
    else if (targetRole === 'OPERATOR') navigate('/command');
    else if (targetRole === 'RESPONDER') navigate('/responder');
    else if (targetRole === 'COORDINATOR') navigate('/inventory');
    else navigate('/command');
  };

  return (
    <header className="h-14 bg-command-surface border-b border-command-border px-4 flex items-center justify-between z-30 sticky top-0 shadow-md">
      {/* Brand & Simulation Pill */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-command-teal to-command-card flex items-center justify-center border border-command-teal/50 shadow-inner">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-mono font-bold tracking-wider text-base text-white">RESQGRID</span>
            <span className="text-[10px] text-command-muted font-mono block -mt-1 tracking-widest">ECC-v1.0</span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-command-darkest border border-command-border text-[11px] font-mono text-command-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-semibold">LIVE</span>
          <span className="text-slate-500">|</span>
          <span>MUMBAI CLOUD SIMULATION</span>
        </div>
      </div>

      {/* Role Switcher & Controls */}
      <div className="flex items-center space-x-3">
        {/* Rapid Persona Switcher for Academic Demo */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded bg-command-card hover:bg-command-border border border-command-border text-xs font-mono transition"
          >
            <User className="w-3.5 h-3.5 text-command-teal" />
            <span className="text-white font-medium">{user ? user.full_name.split(' ')[0] : 'Sign In'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-command-darkest text-command-teal border border-command-teal/30">
              {role || 'GUEST'}
            </span>
            <ChevronDown className="w-3 h-3 text-command-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-command-surface border border-command-border rounded shadow-xl py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-command-border/50 text-[10px] font-mono text-command-muted uppercase tracking-wider">
                1-Click Persona Switcher (Demo)
              </div>
              {(Object.keys(PERSONA_CREDENTIALS) as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handlePersonaSwitch(r)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-command-card transition ${
                    role === r ? 'bg-command-teal/15 text-command-teal font-medium' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{PERSONA_CREDENTIALS[r].title}</div>
                    <div className="text-[10px] text-command-muted font-mono">{PERSONA_CREDENTIALS[r].email}</div>
                  </div>
                  {role === r && <CheckCircle2 className="w-3.5 h-3.5 text-command-teal" />}
                </button>
              ))}
              {user && (
                <div className="pt-1 mt-1 border-t border-command-border/50">
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-command-red/10 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          to="/health"
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-command-darkest hover:bg-command-card border border-command-border text-xs text-command-muted hover:text-white transition"
          title="System & Cloud Health"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px]">CloudWatch OK</span>
        </Link>
      </div>
    </header>
  );
};

