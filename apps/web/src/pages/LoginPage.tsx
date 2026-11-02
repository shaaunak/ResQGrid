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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-app-bg font-sans">
      <div className="max-w-md w-full bg-white border border-app-border rounded-xl p-6 shadow-sm space-y-6 text-xs font-sans">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-app-primary mb-2">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-app-text uppercase tracking-wider font-mono">
            Sign In to ResQGrid
          </h2>
          <p className="text-xs text-app-text-secondary">
            Emergency Operations & Multi-Role Authorization
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-app-critical text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-app-text-secondary mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-app-text-secondary absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@resqgrid.org"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-app-border rounded-lg text-app-text text-xs focus:bg-white focus:outline-none focus:border-app-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-text-secondary mb-1 font-semibold">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-app-text-secondary absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-app-border rounded-lg text-app-text text-xs focus:bg-white focus:outline-none focus:border-app-primary font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-app-primary hover:bg-[#0E555A] text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-app-border space-y-2">
          <span className="text-xs text-app-text-secondary uppercase tracking-wider block font-semibold text-center font-mono">
            Evaluator 1-Click Fast Login
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-sans">
            <button
              onClick={() => handleQuickPersona('OPERATOR')}
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-app-text border border-app-border transition text-left shadow-sm"
            >
              <div className="font-semibold text-app-text">Operator</div>
              <div className="text-xs text-app-primary font-mono font-medium">Command Center</div>
            </button>
            <button
              onClick={() => handleQuickPersona('RESPONDER')}
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-app-text border border-app-border transition text-left shadow-sm"
            >
              <div className="font-semibold text-app-text">Responder</div>
              <div className="text-xs text-sky-700 font-mono font-medium">Field Missions</div>
            </button>
            <button
              onClick={() => handleQuickPersona('COORDINATOR')}
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-app-text border border-app-border transition text-left shadow-sm"
            >
              <div className="font-semibold text-app-text">Coordinator</div>
              <div className="text-xs text-emerald-700 font-mono font-medium">Relief Depots</div>
            </button>
            <button
              onClick={() => handleQuickPersona('CITIZEN')}
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-app-text border border-app-border transition text-left shadow-sm"
            >
              <div className="font-semibold text-app-text">Citizen</div>
              <div className="text-xs text-app-high font-mono font-medium">Emergency Report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

