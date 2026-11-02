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
      color: 'text-app-primary',
      bgHover: 'hover:border-app-primary',
    },
    {
      role: 'CITIZEN' as UserRole,
      title: 'Citizen Requester',
      desc: 'Submit emergency incidents with Mumbai coordinates, affected victims count, and photos uploaded to private Amazon S3 with public tracking codes.',
      icon: ShieldAlert,
      badge: 'Public Ingestion',
      color: 'text-app-high',
      bgHover: 'hover:border-amber-400',
    },
    {
      role: 'RESPONDER' as UserRole,
      title: 'Field Responder Captain',
      desc: 'Accept assignments, track route progress (En Route, On Scene, Completed), reconcile consumed supplies, and submit completion proof.',
      icon: Truck,
      badge: 'Field Operations',
      color: 'text-sky-600',
      bgHover: 'hover:border-sky-500',
    },
    {
      role: 'COORDINATOR' as UserRole,
      title: 'Relief Logistics Coordinator',
      desc: 'Oversee depot inventory levels, shelter occupancies, low-stock threshold deficit alarms, and simulate incoming donation intake.',
      icon: Boxes,
      badge: 'Supply Chain',
      color: 'text-emerald-600',
      bgHover: 'hover:border-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans">
      {/* 1. Cinematic 3D Interactive Hero Experience */}
      <div className="relative">
        <CinematicLandingCanvas />

        {/* Floating Quick Action Overlay on Hero */}
        <div className="absolute top-6 right-6 hidden lg:flex items-center space-x-3 z-30">
          <Link
            to="/command"
            className="px-4 py-2 bg-app-primary hover:bg-[#0E555A] text-white font-mono font-semibold text-xs rounded-lg shadow-md transition flex items-center space-x-2"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Launch Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/scenario"
            className="px-4 py-2 bg-white/95 hover:bg-slate-50 text-app-text border border-app-border font-mono font-semibold text-xs rounded-lg shadow-md transition flex items-center space-x-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-app-primary" />
            <span>3D Simulation Lab</span>
          </Link>
        </div>
      </div>

      {/* 2. Project Vision & Architecture Value Statement */}
      <div className="border-b border-app-border bg-white px-6 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-app-border text-xs font-mono text-app-text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-app-primary" />
            <span className="text-app-text font-bold">CLOUD COMPUTING MINI PROJECT</span>
            <span className="text-slate-400">•</span>
            <span className="text-app-primary font-mono font-semibold">MUMBAI DISASTER DEMO</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-app-text leading-tight">
            Next-Generation Disaster Response &{' '}
            <span className="text-app-primary">
              Intelligent Coordination
            </span>
          </h1>

          <p className="text-xs md:text-sm text-app-text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
            ResQGrid is a cloud-native platform combining explainable urgency prioritization,
            Haversine-based resource matching, atomic PostgreSQL inventory reservations, and event-driven SQS/SNS
            asynchronous processing on Amazon EC2 with a crisp 3D tactical command layer.
          </p>
        </div>
      </div>

      {/* 3. Four Role-Based Portal Experiences Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6 flex-1">
        <div className="text-center space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-app-text uppercase tracking-wider font-mono">
            4 Operational Multi-Role Portals
          </h2>
          <p className="text-xs text-app-text-secondary font-mono">
            Click any portal below for instant 1-click evaluation access with pre-configured credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rolesList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className={`bg-white border border-app-border rounded-xl p-5 shadow-sm transition hover:shadow-md ${item.bgHover} flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-slate-50 border border-app-border">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <h3 className="text-base font-bold text-app-text">{item.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-app-border text-app-text-secondary uppercase font-semibold">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-app-text-secondary leading-relaxed font-normal">{item.desc}</p>
                </div>

                <div className="pt-2 border-t border-app-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-app-text-secondary">
                    {PERSONA_CREDENTIALS[item.role].email}
                  </span>
                  <button
                    onClick={() => handleQuickLogin(item.role)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-app-primary hover:text-white text-xs font-mono font-semibold transition text-app-text border border-app-border shadow-sm"
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
      <footer className="bg-white border-t border-app-border px-6 py-6 text-xs font-mono text-app-text-secondary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-app-text">RESQGRID</span>
            <span>•</span>
            <span>Cloud-Native Disaster Response & Intelligent Resource Coordination</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-app-primary font-semibold">EC2 Compute</span>
            <span>•</span>
            <span className="text-sky-700 font-semibold">Custom VPC (10.20.0.0/16)</span>
            <span>•</span>
            <span className="text-indigo-700 font-semibold">RDS PostgreSQL</span>
            <span>•</span>
            <span className="text-purple-700 font-semibold">S3 Storage</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">SQS + DLQ</span>
            <span>•</span>
            <span className="text-app-critical font-semibold">CloudWatch Alarms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
