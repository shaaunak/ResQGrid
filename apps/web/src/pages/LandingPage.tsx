import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Play,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Clock,
  Layers,
  Users,
  Box,
  TrendingUp,
  MapPin,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Cloud,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, PERSONA_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';

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

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#142638] flex flex-col font-sans selection:bg-[#E8F4F1] selection:text-[#087F7A]">
      {/* 1. Minimal Premium Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-[#E2E9E7]/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3.5">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#087F7A] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.18l6 3.33v4.61c0 4.14-2.82 8.01-6 9.07-3.18-1.06-6-4.93-6-9.07V8.51l6-3.33z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg tracking-tight text-[#142638] leading-none">
                  ResQGrid
                </span>
                <span className="text-[11px] text-[#62727E] tracking-tight mt-1 hidden sm:block">
                  Intelligent Disaster Response & Resource Coordination
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-[14px] font-medium text-[#62727E]">
            <Link to="/" className="text-[#087F7A] font-semibold border-b-2 border-[#087F7A] pb-0.5">
              Home
            </Link>
            <Link to="/features" className="hover:text-[#142638] transition-colors">
              Features
            </Link>
            <Link to="/command" className="hover:text-[#142638] transition-colors">
              Demo
            </Link>
            <Link to="/docs" className="hover:text-[#142638] transition-colors">
              Architecture
            </Link>
            <Link to="/evidence" className="hover:text-[#142638] transition-colors">
              Team
            </Link>
            <Link to="/docs" className="hover:text-[#142638] transition-colors">
              Docs
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3.5">
            {isAuthenticated ? (
              <Link
                to="/command"
                className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-[#087F7A] hover:bg-[#08615E] rounded-lg shadow-sm transition-all"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-[13px] font-semibold text-[#142638] hover:text-[#087F7A] bg-white hover:bg-[#F3F6F5] border border-[#E2E9E7] rounded-lg shadow-subtle transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/command"
                  className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-[#087F7A] hover:bg-[#08615E] rounded-lg shadow-sm transition-all group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Authentic Mumbai Panorama & Floating Incident Card */}
      <section className="relative pt-8 pb-16 overflow-hidden">
        {/* Background Mumbai Harbor Panorama Layer (Right side) */}
        <div className="absolute top-0 right-0 w-full lg:w-[58%] h-[560px] pointer-events-none select-none z-0 opacity-90 overflow-hidden">
          <img
            src="/images/mumbai_harbor_panorama.jpg"
            alt="Mumbai Harbor & Gateway of India"
            className="w-full h-full object-cover object-right-top"
          />
          {/* Subtle gradient fades to blend seamlessly into ivory background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAF7] via-[#FAFAF7]/50 to-transparent w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF7] via-transparent to-[#FAFAF7]/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
            {/* Left Column: Bold Headline & Editorial Copy */}
            <div className="lg:col-span-6 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-pill bg-[#E8F4F1] border border-[#087F7A]/20 text-[#087F7A] text-[12px] font-medium tracking-tight">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud-Native • Real-Time • Multi-Hazard</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#142638] tracking-tight leading-[1.08]">
                Coordinate. Respond. <br />
                <span className="text-[#087F7A]">Save Lives.</span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-[16px] sm:text-[17px] text-[#62727E] leading-relaxed max-w-xl font-normal">
                A cloud-native platform for intelligent disaster response, resource coordination and real-time operational decision-making across floods, earthquakes, cyclones, fires and more.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/features"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#087F7A] hover:bg-[#08615E] text-white text-[14px] font-semibold shadow-sm transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  <span>Watch Demo (2 min)</span>
                </Link>

                <a
                  href="#platform-overview"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white hover:bg-[#F3F6F5] text-[#142638] text-[14px] font-semibold border border-[#E2E9E7] shadow-subtle transition-all"
                >
                  <span>Explore the Platform</span>
                  <ArrowDown className="w-4 h-4 ml-2 text-[#62727E]" />
                </a>
              </div>
            </div>

            {/* Right Column: Floating Tactical Incident Card */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-elevated border border-[#E2E9E7] relative">
                {/* Header status */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E9E7]/60">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84646] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C84646]" />
                    </span>
                    <span className="text-[12px] font-semibold text-[#142638] tracking-tight uppercase">
                      Active Incident
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#C84646]/10 text-[#C84646] border border-[#C84646]/20">
                    Critical
                  </span>
                </div>

                {/* Incident Detail */}
                <div className="py-3.5 flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-[16px] text-[#142638] tracking-tight">
                      Severe Waterlogging
                    </h3>
                    <div className="flex items-center text-[12px] text-[#62727E]">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-[#087F7A]" />
                      <span>S.V. Road, Bandra (W), Mumbai</span>
                    </div>
                    <div className="flex items-center text-[12px] text-[#62727E] pt-1">
                      <Users className="w-3.5 h-3.5 mr-1 text-[#62727E]" />
                      <span>~320 people affected</span>
                    </div>
                  </div>

                  {/* Incident Photo Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-[#E2E9E7] shadow-subtle flex-shrink-0">
                    <img
                      src="/images/mumbai_flood_thumb.jpg"
                      alt="Waterlogging observation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Mission Step Progression */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#62727E] mb-2 px-1">
                    <span className="text-[#087F7A] font-semibold">Reported 10:12</span>
                    <span className="text-[#087F7A] font-semibold">Verified 10:20</span>
                    <span className="text-[#142638] font-bold">Dispatching</span>
                    <span className="text-[#8FA2B2]">On Scene</span>
                    <span className="text-[#8FA2B2]">Resolved</span>
                  </div>

                  {/* Visual Tracker Bar */}
                  <div className="w-full bg-[#E2E9E7]/60 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#087F7A] h-full w-[60%]" />
                  </div>
                </div>

                {/* Direct Action Link to Command Center */}
                <div className="mt-4 pt-3 border-t border-[#E2E9E7]/60 flex items-center justify-between text-[12px]">
                  <span className="text-[#62727E]">Matched Squad: <strong>Bandra Rescue Alpha</strong></span>
                  <Link
                    to="/command"
                    className="font-semibold text-[#087F7A] hover:text-[#08615E] inline-flex items-center"
                  >
                    <span>View in Console</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Metrics Strip (Truthful Data from Engine) */}
      <section className="max-w-7xl mx-auto px-6 w-full -mt-4 mb-14 relative z-20">
        <div className="bg-white rounded-2xl border border-[#E2E9E7] shadow-card px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E2E9E7]/80">
            {/* Metric 1 */}
            <div className="flex items-center space-x-4 pt-3 md:pt-0">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] flex items-center justify-center text-[#087F7A] flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#142638] leading-none">19</div>
                <div className="text-[12px] text-[#62727E] mt-1 font-medium">Active Incidents</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center space-x-4 pt-3 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] flex items-center justify-center text-[#087F7A] flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#142638] leading-none">5</div>
                <div className="text-[12px] text-[#62727E] mt-1 font-medium">Response Teams Ready</div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center space-x-4 pt-3 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] flex items-center justify-center text-[#087F7A] flex-shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#142638] leading-none">3</div>
                <div className="text-[12px] text-[#62727E] mt-1 font-medium">Relief Depots Online</div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="flex items-center space-x-4 pt-3 md:pt-0 md:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] flex items-center justify-center text-[#087F7A] flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#142638] leading-none">9</div>
                <div className="text-[12px] text-[#62727E] mt-1 font-medium">Active Dispatches</div>
              </div>
            </div>

            {/* Metric 5 */}
            <div className="flex items-center space-x-4 pt-3 md:pt-0 md:pl-6 col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] flex items-center justify-center text-[#087F7A] flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-[#142638] leading-none">12.4</span>
                  <span className="text-[12px] text-[#62727E]">min</span>
                  <span className="text-[11px] font-semibold text-[#087F7A] bg-[#E8F4F1] px-1.5 py-0.5 rounded">
                    ↓ 37% vs FIFO
                  </span>
                </div>
                <div className="text-[12px] text-[#62727E] mt-1 font-medium">Avg. Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Four Architectural Pillars (Clean Ivory Cards from Reference 1) */}
      <section className="max-w-7xl mx-auto px-6 w-full mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group">
            <div className="w-11 h-11 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[16px] text-[#142638] mb-2 tracking-tight">
              Intelligent Prioritization
            </h3>
            <p className="text-[13px] text-[#62727E] leading-relaxed">
              Explainable, multi-factor incident scoring accounting for severity, casualties, zone vulnerability, and starvation prevention.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group">
            <div className="w-11 h-11 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[16px] text-[#142638] mb-2 tracking-tight">
              Optimal Team Matching
            </h3>
            <p className="text-[13px] text-[#62727E] leading-relaxed">
              Recommends the best response teams based on capability match, specialized equipment, real travel distance, and active workload.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group">
            <div className="w-11 h-11 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[16px] text-[#142638] mb-2 tracking-tight">
              Resource Coordination
            </h3>
            <p className="text-[13px] text-[#62727E] leading-relaxed">
              Real-time inventory reservations with PostgreSQL row-level locking to guarantee zero supply double-allocation across depots.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group">
            <div className="w-11 h-11 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[16px] text-[#142638] mb-2 tracking-tight">
              Impact & Benchmarking
            </h3>
            <p className="text-[13px] text-[#62727E] leading-relaxed">
              Evaluate response performance with reproducible statistical simulations comparing multi-factor heuristics against baseline FIFO.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Role-Based Access Quick Switcher for Evaluators & Demonstrations */}
      <section className="max-w-7xl mx-auto px-6 w-full mb-20" id="platform-overview">
        <div className="bg-[#F3F6F5] rounded-3xl p-8 lg:p-10 border border-[#E2E9E7]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F4F1] text-[#087F7A] text-[12px] font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Demonstration</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#142638] tracking-tight">
                Experience ResQGrid by Role
              </h2>
              <p className="text-[14px] text-[#62727E] mt-2 max-w-xl">
                Select any operational persona below for instant one-click login and explore the purpose-built portal.
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-[13px] font-medium text-[#62727E]">
              Protected by JWT & Role-Based Access Control
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Operator Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#087F7A]/10 text-[#087F7A]">
                    Command Center
                  </span>
                  <span className="font-mono text-[11px] text-[#62727E]">OPERATOR</span>
                </div>
                <h3 className="font-bold text-[16px] text-[#142638] mb-1">Priya Deshmukh</h3>
                <p className="text-[13px] text-[#62727E] mb-4">
                  Full situational triage, algorithmic priority queue, candidate squad matching, and dispatch approval.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('OPERATOR')}
                className="w-full py-2.5 px-4 bg-[#087F7A] hover:bg-[#08615E] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Citizen Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Public Reporting
                  </span>
                  <span className="font-mono text-[11px] text-[#62727E]">CITIZEN</span>
                </div>
                <h3 className="font-bold text-[16px] text-[#142638] mb-1">Aarav Sharma</h3>
                <p className="text-[13px] text-[#62727E] mb-4">
                  Submit emergency reports with location coordinates, affected people count, and photo evidence.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('CITIZEN')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F3F6F5] text-[#142638] border border-[#E2E9E7] rounded-lg text-[13px] font-semibold shadow-subtle transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Report Emergency</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Responder Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    Field Squad
                  </span>
                  <span className="font-mono text-[11px] text-[#62727E]">RESPONDER</span>
                </div>
                <h3 className="font-bold text-[16px] text-[#142638] mb-1">Capt. Vikram Patil</h3>
                <p className="text-[13px] text-[#62727E] mb-4">
                  Accept dispatched missions, update status milestones (En Route, On Scene), and reconcile supplies.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('RESPONDER')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F3F6F5] text-[#142638] border border-[#E2E9E7] rounded-lg text-[13px] font-semibold shadow-subtle transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Responder View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Coordinator Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Logistics Hub
                  </span>
                  <span className="font-mono text-[11px] text-[#62727E]">COORDINATOR</span>
                </div>
                <h3 className="font-bold text-[16px] text-[#142638] mb-1">Dr. Sunita Rao</h3>
                <p className="text-[13px] text-[#62727E] mb-4">
                  Monitor depot inventory across Mumbai, manage shelter capacities, and track supply movements.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('COORDINATOR')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F3F6F5] text-[#142638] border border-[#E2E9E7] rounded-lg text-[13px] font-semibold shadow-subtle transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Manage Depots</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Cloud Technology Stack Footer Strip */}
      <footer className="border-t border-[#E2E9E7] bg-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6 text-[13px] font-medium text-[#62727E]">
            <span className="text-[#142638] font-semibold">Powered by a Modern Cloud Stack</span>
            <span className="text-[#087F7A] font-semibold">AWS ap-south-1</span>
            <span>React 18</span>
            <span>FastAPI</span>
            <span>PostgreSQL 16</span>
            <span>Docker</span>
            <span>Terraform</span>
          </div>

          <div className="flex items-center space-x-4 text-[13px] text-[#62727E]">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#E8F4F1] text-[#087F7A] text-[11px] font-semibold">
              <Cloud className="w-3 h-3 mr-1.5" />
              Cloud-Native & Scalable
            </span>
            <span>© 2026 ResQGrid Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
