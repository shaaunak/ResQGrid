import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination if bounced by ProtectedRoute
  const from = (location.state as any)?.from?.pathname || '/';

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
      if (from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'CITIZEN') navigate('/citizen', { replace: true });
        else if (user.role === 'OPERATOR') navigate('/command', { replace: true });
        else if (user.role === 'RESPONDER') navigate('/responder', { replace: true });
        else if (user.role === 'COORDINATOR') navigate('/inventory', { replace: true });
        else navigate('/command', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed: Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Preset filler for evaluation convenience (fills fields, requires genuine authentication button click)
  const handlePrefillCredentials = (role: UserRole) => {
    const creds = PERSONA_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-rq-bg font-sans">
      <div className="max-w-md w-full bg-white border border-rq-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6 text-xs font-sans">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rq-surface2 border border-rq-border flex items-center justify-center mx-auto text-[#14284B] mb-2 shadow-subtle">
            <Shield className="w-6 h-6 text-[#14284B]" />
          </div>
          <h1 className="text-lg font-bold text-rq-ink font-mono uppercase tracking-wider">
            Sign In to ResQGrid
          </h1>
          <p className="text-xs text-rq-muted">
            Emergency Management & Role-Based Authorization
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#C8201B] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-rq-ink mb-1.5 font-semibold">Operational Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-rq-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@resqgrid.org"
                className="w-full pl-9 pr-3 py-2 bg-rq-surface2 border border-rq-border rounded-lg text-rq-ink text-xs focus:bg-white focus:outline-none focus:border-[#14284B] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-rq-ink mb-1.5 font-semibold">Account Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-rq-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-rq-surface2 border border-rq-border rounded-lg text-rq-ink text-xs focus:bg-white focus:outline-none focus:border-[#14284B] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#14284B] hover:bg-[#1E3A8A] disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 font-mono"
          >
            <span>{loading ? 'Authenticating with Backend...' : 'Authenticate & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Evaluation Pre-fill Selector */}
        <div className="pt-4 border-t border-rq-border space-y-2.5">
          <div className="flex items-center justify-between text-xs text-rq-muted">
            <span className="font-mono uppercase font-semibold">Academic Evaluation Accounts</span>
            <span className="text-[10px] text-rq-muted font-mono">Click to prefill</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handlePrefillCredentials('OPERATOR')}
              className={`p-2.5 rounded-lg border text-left transition ${
                email === PERSONA_CREDENTIALS.OPERATOR.email
                  ? 'bg-rq-surface2 border-[#14284B] font-semibold'
                  : 'bg-white hover:bg-slate-50 border-rq-border'
              }`}
            >
              <div className="font-bold text-rq-ink">Operator</div>
              <div className="text-[11px] text-rq-muted font-mono">Command Center</div>
            </button>

            <button
              type="button"
              onClick={() => handlePrefillCredentials('RESPONDER')}
              className={`p-2.5 rounded-lg border text-left transition ${
                email === PERSONA_CREDENTIALS.RESPONDER.email
                  ? 'bg-rq-surface2 border-[#14284B] font-semibold'
                  : 'bg-white hover:bg-slate-50 border-rq-border'
              }`}
            >
              <div className="font-bold text-rq-ink">Responder</div>
              <div className="text-[11px] text-rq-muted font-mono">Field Squads</div>
            </button>

            <button
              type="button"
              onClick={() => handlePrefillCredentials('COORDINATOR')}
              className={`p-2.5 rounded-lg border text-left transition ${
                email === PERSONA_CREDENTIALS.COORDINATOR.email
                  ? 'bg-rq-surface2 border-[#14284B] font-semibold'
                  : 'bg-white hover:bg-slate-50 border-rq-border'
              }`}
            >
              <div className="font-bold text-rq-ink">Coordinator</div>
              <div className="text-[11px] text-rq-muted font-mono">Relief Depots</div>
            </button>

            <button
              type="button"
              onClick={() => handlePrefillCredentials('ADMIN')}
              className={`p-2.5 rounded-lg border text-left transition ${
                email === PERSONA_CREDENTIALS.ADMIN.email
                  ? 'bg-rq-surface2 border-[#14284B] font-semibold'
                  : 'bg-white hover:bg-slate-50 border-rq-border'
              }`}
            >
              <div className="font-bold text-rq-ink">Administrator</div>
              <div className="text-[11px] text-rq-muted font-mono">Health & Telemetry</div>
            </button>
          </div>
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => handlePrefillCredentials('CITIZEN')}
              className="text-xs text-rq-muted hover:text-rq-ink font-mono underline"
            >
              Or prefill Citizen Requester account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
