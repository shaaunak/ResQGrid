import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Radio, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, loginAsPersona } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'CITIZEN') navigate('/citizen');
      else if (user.role === 'OPERATOR') navigate('/command');
      else if (user.role === 'RESPONDER') navigate('/responder');
      else if (user.role === 'COORDINATOR') navigate('/inventory');
      else navigate('/command');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (role: UserRole) => {
    setLoading(true);
    try {
      await loginAsPersona(role);
      if (role === 'CITIZEN') navigate('/citizen');
      else if (role === 'OPERATOR') navigate('/command');
      else if (role === 'RESPONDER') navigate('/responder');
      else if (role === 'COORDINATOR') navigate('/inventory');
      else navigate('/command');
    } catch (err: any) {
      setErrorMsg(err.message || 'Persona switch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-command-darkest">
      <div className="max-w-md w-full bg-command-surface border border-command-border rounded-xl p-6 shadow-2xl space-y-6 text-xs font-mono">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-lg bg-command-teal/20 border border-command-teal flex items-center justify-center mx-auto text-command-teal mb-2">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Sign In to ResQGrid
          </h2>
          <p className="text-[11px] text-command-muted">
            Emergency Operations & Multi-Role Authorization
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-command-red/10 border border-command-red/40 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-command-muted mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-command-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@resqgrid.org"
                className="w-full pl-9 pr-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none focus:border-command-teal font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-command-muted mb-1 font-semibold">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-command-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none focus:border-command-teal font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-command-teal hover:bg-command-teal-bright text-white font-bold rounded shadow transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-command-border/60 space-y-2">
          <span className="text-[10px] text-command-muted uppercase tracking-wider block font-semibold text-center">
            Evaluator 1-Click Fast Login
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => handleQuickPersona('OPERATOR')}
              className="p-2 rounded bg-command-card hover:bg-command-border text-slate-300 hover:text-white border border-command-border transition text-left"
            >
              <div className="font-semibold text-white">Operator</div>
              <div className="text-[9px] text-command-teal">Command Center</div>
            </button>
            <button
              onClick={() => handleQuickPersona('RESPONDER')}
              className="p-2 rounded bg-command-card hover:bg-command-border text-slate-300 hover:text-white border border-command-border transition text-left"
            >
              <div className="font-semibold text-white">Responder</div>
              <div className="text-[9px] text-blue-400">Field Missions</div>
            </button>
            <button
              onClick={() => handleQuickPersona('COORDINATOR')}
              className="p-2 rounded bg-command-card hover:bg-command-border text-slate-300 hover:text-white border border-command-border transition text-left"
            >
              <div className="font-semibold text-white">Coordinator</div>
              <div className="text-[9px] text-emerald-400">Relief Depots</div>
            </button>
            <button
              onClick={() => handleQuickPersona('CITIZEN')}
              className="p-2 rounded bg-command-card hover:bg-command-border text-slate-300 hover:text-white border border-command-border transition text-left"
            >
              <div className="font-semibold text-white">Citizen</div>
              <div className="text-[9px] text-amber-400">Emergency Report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

