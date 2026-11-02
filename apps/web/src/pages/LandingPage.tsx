import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  Map,
  Truck,
  Boxes,
  Cpu,
  BarChart3,
  Server,
  ChevronRight,
  ExternalLink,
  Users,
  CheckCircle,
  Activity,
  ArrowRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { CinematicLandingCanvas } from '../components/three/CinematicLandingCanvas';

export const LandingPage: React.FC = () => {
  const { loginAsPersona, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role: UserRole) => {
    await loginAsPersona(role);
    if (role === 'CITIZEN') navigate('/citizen');
    else if (role === 'OPERATOR') navigate('/command');
    else if (role === 'RESPONDER') navigate('/responder');
    else if (role === 'COORDINATOR') navigate('/inventory');
    else navigate('/command');
  };

  const rolesList = [
    {
      role: 'OPERATOR' as UserRole,
      title: 'Command Center Operator',
      desc: 'Verify reports, inspect explainable urgency scores, review matching teams, and approve atomic supply dispatches on a live 2D/3D map.',
      icon: Map,
      badge: 'Flagship Experience',
      color: 'border-command-teal text-command-teal',
      bgHover: 'hover:border-command-teal/80',
    },
    {
      role: 'CITIZEN' as UserRole,
      title: 'Citizen Requester',
      desc: 'Submit emergency incidents with Mumbai coordinates, affected victims count, and photos uploaded to private Amazon S3 with public tracking codes.',
      icon: ShieldAlert,
      badge: 'Public Ingestion',
      color: 'border-amber-400 text-amber-400',
      bgHover: 'hover:border-amber-400/80',
    },
    {
      role: 'RESPONDER' as UserRole,
      title: 'Field Responder Captain',
      desc: 'Accept assignments, track route progress (En Route, On Scene, Completed), reconcile consumed supplies, and submit completion proof.',
      icon: Truck,
      badge: 'Field Operations',
      color: 'border-blue-400 text-blue-400',
      bgHover: 'hover:border-blue-400/80',
    },
    {
      role: 'COORDINATOR' as UserRole,
      title: 'Relief Logistics Coordinator',
      desc: 'Oversee depot inventory levels, shelter occupancies, low-stock threshold deficit alarms, and simulate incoming donation intake.',
      icon: Boxes,
      badge: 'Supply Chain',
      color: 'border-emerald-400 text-emerald-400',
      bgHover: 'hover:border-emerald-400/80',
    },
  ];

  return (
    <div className="min-h-screen bg-command-darkest text-command-text flex flex-col font-sans">
      {/* 1. Cinematic 3D Interactive Hero Experience */}
      <div className="relative">
        <CinematicLandingCanvas />

        {/* Floating Quick Action Overlay on Hero */}
        <div className="absolute top-6 right-6 hidden lg:flex items-center space-x-3 z-30">
          <Link
            to="/command"
            className="px-4 py-2 bg-command-teal hover:bg-command-teal-bright text-white font-mono font-semibold text-xs rounded-lg shadow-xl transition flex items-center space-x-2"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Launch Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/scenario"
            className="px-4 py-2 bg-command-card/90 hover:bg-command-border text-slate-200 border border-command-border font-mono font-semibold text-xs rounded-lg shadow-xl transition flex items-center space-x-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-command-teal" />
            <span>3D Simulation Lab</span>
          </Link>
        </div>
      </div>

      {/* 2. Project Vision & Architecture Value Statement */}
      <div className="border-b border-command-border/60 bg-gradient-to-b from-command-surface to-command-darkest px-6 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-command-card border border-command-border text-xs font-mono text-command-muted">
            <Sparkles className="w-3.5 h-3.5 text-command-teal" />
            <span className="text-white font-semibold">CLOUD COMPUTING MINI PROJECT</span>
            <span className="text-slate-500">•</span>
            <span className="text-command-teal font-mono">MUMBAI DISASTER DEMO</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Next-Generation Disaster Response &{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-command-teal-bright via-teal-200 to-amber-300">
              Intelligent Coordination
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            ResQGrid is a cloud-native platform combining explainable urgency prioritization,
            Haversine-based resource matching, atomic PostgreSQL inventory reservations, and event-driven SQS/SNS
            asynchronous processing on Amazon EC2 with a cinematic 3D tactical command layer.
          </p>
        </div>
      </div>

      {/* 3. Four Role-Based Portal Experiences Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6 flex-1">
        <div className="text-center space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider font-mono">
            4 Operational Multi-Role Portals
          </h2>
          <p className="text-xs text-command-muted font-mono">
            Click any portal below for instant 1-click evaluation access with pre-configured credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rolesList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className={`bg-command-surface border border-command-border rounded-lg p-5 shadow-xl transition hover:shadow-2xl ${item.bgHover} flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded bg-command-card border border-command-border">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-command-darkest border border-command-border text-command-muted uppercase">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{item.desc}</p>
                </div>

                <div className="pt-2 border-t border-command-border/50 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-command-muted">
                    {PERSONA_CREDENTIALS[item.role].email}
                  </span>
                  <button
                    onClick={() => handleQuickLogin(item.role)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded bg-command-card hover:bg-command-teal hover:text-white text-xs font-mono font-medium transition text-slate-200 border border-command-border"
                  >
                    <span>Enter as {item.role}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Cloud Architecture Pillars Footer */}
      <footer className="bg-command-surface border-t border-command-border/80 px-6 py-6 text-xs font-mono text-command-muted">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">RESQGRID</span>
            <span>•</span>
            <span>Cloud-Native Disaster Response & Intelligent Resource Coordination</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-emerald-400">EC2 Compute</span>
            <span>•</span>
            <span className="text-cyan-400">Custom VPC (10.20.0.0/16)</span>
            <span>•</span>
            <span className="text-blue-400">RDS PostgreSQL</span>
            <span>•</span>
            <span className="text-purple-400">S3 Storage</span>
            <span>•</span>
            <span className="text-amber-400">SQS + DLQ</span>
            <span>•</span>
            <span className="text-rose-400">CloudWatch Alarms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
