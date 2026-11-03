import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  Shield,
  Layers,
  Users,
  Box,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Activity,
  Check,
  Radio,
  FileCheck2,
  Server,
  Cloud,
  ExternalLink,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#142638] flex flex-col font-sans selection:bg-[#E8F4F1] selection:text-[#087F7A]">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-[#E2E9E7]/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
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

          <nav className="hidden md:flex items-center space-x-8 text-[14px] font-medium text-[#62727E]">
            <Link to="/landing" className="hover:text-[#142638] transition-colors">
              Home
            </Link>
            <Link to="/features" className="text-[#087F7A] font-semibold border-b-2 border-[#087F7A] pb-0.5">
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

          <div className="flex items-center space-x-3.5">
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
          </div>
        </div>
      </header>

      {/* 2. Editorial Top Banner: Built for Real-Time Disaster Coordination */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-pill bg-[#E8F4F1] border border-[#087F7A]/20 text-[#087F7A] text-[12px] font-semibold tracking-tight">
                <Layers className="w-3.5 h-3.5" />
                <span>Platform Overview</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#142638] tracking-tight leading-[1.12]">
                Built for Real-Time <br />
                <span className="text-[#087F7A]">Disaster Coordination</span>
              </h1>

              <p className="text-[16px] text-[#62727E] leading-relaxed">
                A unified command platform that turns live incident reports into coordinated, auditable action—from intake and transparent priority scoring to intelligent team dispatch and mission completion.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => navigate('/command')}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#087F7A] hover:bg-[#08615E] text-white text-[14px] font-semibold shadow-sm transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  <span>Watch Platform Tour (3 min)</span>
                </button>

                <Link
                  to="/command"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white hover:bg-[#F3F6F5] text-[#142638] text-[14px] font-semibold border border-[#E2E9E7] shadow-subtle transition-all group"
                >
                  <span>Request a Demo</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-[#62727E] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Right Product Preview Mockup (Framed Like Reference 2) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-[#E2E9E7] shadow-elevated p-3 relative overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#E2E9E7]/60 text-[12px] text-[#62727E]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087F7A]" />
                    <span className="font-semibold text-[#142638]">Command Center Interface</span>
                  </div>
                  <span className="font-mono text-[11px]">Real-Time Geospatial Map</span>
                </div>
                <img
                  src="/images/command_center_preview.png"
                  alt="ResQGrid Command Center Preview"
                  className="w-full h-auto rounded-lg object-contain mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section B: Explainable Decision-Making (3 Cards Grid matching Ref 2) */}
      <section className="py-14 bg-white border-y border-[#E2E9E7]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142638] tracking-tight">
              Explainable Decision-Making
            </h2>
            <p className="text-[15px] text-[#62727E] mt-2">
              Multi-criteria recommendations you can understand, review, and trust—designed for high-stakes, real-world municipal operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Priority Scoring */}
            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3 text-[#087F7A]">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold text-[15px] text-[#142638]">Priority Scoring</span>
                </div>
                <p className="text-[13px] text-[#62727E] leading-relaxed mb-5">
                  Assesses severity, casualty exposure, area vulnerability, and starvation prevention to generate an explainable score.
                </p>

                {/* Score Breakdown visualization */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E2E9E7]/80">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#142638]">Severity</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-[#E2E9E7] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#087F7A] h-full w-[40%]" />
                      </div>
                      <span className="font-mono text-[11px] text-[#62727E]">40%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#142638]">People Affected</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-[#E2E9E7] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#087F7A] h-full w-[25%]" />
                      </div>
                      <span className="font-mono text-[11px] text-[#62727E]">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#142638]">Area Impact</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-[#E2E9E7] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#087F7A] h-full w-[20%]" />
                      </div>
                      <span className="font-mono text-[11px] text-[#62727E]">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#142638]">Waiting Starvation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-[#E2E9E7] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#087F7A] h-full w-[15%]" />
                      </div>
                      <span className="font-mono text-[11px] text-[#62727E]">15%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E2E9E7]/60 flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#142638]">Total Urgency Score</span>
                <span className="text-xl font-bold font-mono text-[#C84646]">92 / 100</span>
              </div>
            </div>

            {/* Card 2: Intelligent Team-Matching */}
            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3 text-[#087F7A]">
                  <Users className="w-5 h-5" />
                  <span className="font-bold text-[15px] text-[#142638]">Intelligent Team-Matching</span>
                </div>
                <p className="text-[13px] text-[#62727E] leading-relaxed mb-5">
                  Recommends the best response squads based on capability match, required rescue gear, live distance, and active workload.
                </p>

                {/* Criteria Checklist */}
                <div className="space-y-2.5 bg-white p-4 rounded-xl border border-[#E2E9E7]/80">
                  <div className="flex items-center space-x-2 text-[12px] text-[#142638]">
                    <CheckCircle2 className="w-4 h-4 text-[#087F7A] flex-shrink-0" />
                    <span>Capability fit (Water rescue, dewatering pumps)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[12px] text-[#142638]">
                    <CheckCircle2 className="w-4 h-4 text-[#087F7A] flex-shrink-0" />
                    <span>Shortest ETA (12 min haversine travel)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[12px] text-[#142638]">
                    <CheckCircle2 className="w-4 h-4 text-[#087F7A] flex-shrink-0" />
                    <span>Available and equipped with boat gear</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[12px] text-[#142638]">
                    <CheckCircle2 className="w-4 h-4 text-[#087F7A] flex-shrink-0" />
                    <span>Balanced workload across Mumbai divisions</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E2E9E7]/60 flex items-center justify-between text-[12px]">
                <span className="text-[#62727E]">Top Match:</span>
                <span className="font-semibold text-[#087F7A]">Bandra Rescue Alpha</span>
              </div>
            </div>

            {/* Card 3: Operator-Approved Dispatch */}
            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3 text-[#087F7A]">
                  <Shield className="w-5 h-5" />
                  <span className="font-bold text-[15px] text-[#142638]">Operator Approval</span>
                </div>
                <p className="text-[13px] text-[#62727E] leading-relaxed mb-5">
                  Mandatory human-in-the-loop control. Operators review algorithmically ranked choices and one-click approve atomic dispatch.
                </p>

                {/* Mock Dispatch Control Box */}
                <div className="bg-white p-4 rounded-xl border border-[#E2E9E7]/80 space-y-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#142638]">Recommended: Team BR-03</span>
                    <span className="text-[11px] font-semibold text-[#087F7A] bg-[#E8F4F1] px-2 py-0.5 rounded">
                      High Match
                    </span>
                  </div>
                  <div className="text-[11px] text-[#62727E]">
                    Specialized swiftwater rescue squad. ETA 12 min.
                  </div>
                  <button
                    onClick={() => navigate('/command')}
                    className="w-full py-2 bg-[#087F7A] hover:bg-[#08615E] text-white text-[12px] font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch Squad</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E2E9E7]/60 flex items-center justify-between text-[12px]">
                <span className="text-[#62727E]">Audit:</span>
                <span className="font-mono text-[11px] text-[#142638]">PostgreSQL Logged</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section C: Mission Trace & Resource Flow (Timeline + Depot Ledger) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142638] tracking-tight">
              Mission Trace & Resource Flow
            </h2>
            <p className="text-[15px] text-[#62727E] mt-2">
              Track the full operational lifecycle of every response—from initial intake to field completion—with real-time resource visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Mission Trace Timeline Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E9E7]/60 mb-5">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-[#087F7A]" />
                    <span className="font-bold text-[14px] text-[#142638]">Mission Trace: MIS-4827</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F4F1] text-[#087F7A]">
                      In Progress
                    </span>
                  </div>
                  <Link
                    to="/mission-trace"
                    className="text-[12px] font-semibold text-[#087F7A] hover:text-[#08615E] inline-flex items-center"
                  >
                    <span>View Full Trace</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>

                {/* Horizontal Step Progression */}
                <div className="py-4">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#E2E9E7] -z-0" />
                    
                    {/* Step 1 */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-[#087F7A] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#142638] mt-2">Reported</span>
                      <span className="text-[10px] text-[#62727E]">10:12</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-[#087F7A] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#142638] mt-2">Assigned</span>
                      <span className="text-[10px] text-[#62727E]">10:15</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-[#087F7A] text-white flex items-center justify-center text-xs ring-4 ring-[#E8F4F1]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#087F7A] mt-2">En Route</span>
                      <span className="text-[10px] text-[#087F7A]">10:18</span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-[#E2E9E7] text-[#8FA2B2] flex items-center justify-center text-xs">
                        4
                      </div>
                      <span className="text-[11px] font-medium text-[#8FA2B2] mt-2">On Scene</span>
                      <span className="text-[10px] text-[#8FA2B2]">—</span>
                    </div>

                    {/* Step 5 */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-[#E2E9E7] text-[#8FA2B2] flex items-center justify-center text-xs">
                        5
                      </div>
                      <span className="text-[11px] font-medium text-[#8FA2B2] mt-2">Resolved</span>
                      <span className="text-[10px] text-[#8FA2B2]">—</span>
                    </div>
                  </div>
                </div>

                {/* Squad Meta Row */}
                <div className="mt-6 p-4 rounded-xl bg-[#FAFAF7] border border-[#E2E9E7] grid grid-cols-4 gap-4 text-[12px]">
                  <div>
                    <span className="text-[#62727E]">Assigned Squad:</span>
                    <div className="font-semibold text-[#142638] mt-0.5">Team BR-03</div>
                  </div>
                  <div>
                    <span className="text-[#62727E]">Vehicles:</span>
                    <div className="font-semibold text-[#142638] mt-0.5">2 Boats, 1 Van</div>
                  </div>
                  <div>
                    <span className="text-[#62727E]">Personnel:</span>
                    <div className="font-semibold text-[#142638] mt-0.5">6 Responders</div>
                  </div>
                  <div>
                    <span className="text-[#62727E]">ETA Target:</span>
                    <div className="font-semibold text-[#087F7A] mt-0.5">12 min (9.4 km)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Resource Reservation Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E2E9E7] shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E9E7]/60 mb-4">
                  <div className="flex items-center space-x-2">
                    <Box className="w-4 h-4 text-[#087F7A]" />
                    <span className="font-bold text-[14px] text-[#142638]">Depot Supply Locks</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#087F7A] bg-[#E8F4F1] px-2 py-0.5 rounded">
                    Atomic Locking (FOR UPDATE)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E2E9E7]/80 text-[12px]">
                    <div>
                      <div className="font-semibold text-[#142638]">Water Pump (High-Capacity)</div>
                      <div className="text-[11px] text-[#62727E]">Kurla West Rapid Supply Depot</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#142638]">8 / 24</div>
                      <div className="text-[10px] text-[#087F7A] font-medium">Reserved: 4</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E2E9E7]/80 text-[12px]">
                    <div>
                      <div className="font-semibold text-[#142638]">Swiftwater Rescue Inflatable</div>
                      <div className="text-[11px] text-[#62727E]">Bandra West Coastal Post</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#142638]">6 / 10</div>
                      <div className="text-[10px] text-[#087F7A] font-medium">Reserved: 2</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E2E9E7]/80 text-[12px]">
                    <div>
                      <div className="font-semibold text-[#142638]">Portable Gas Power Generator (5kW)</div>
                      <div className="text-[11px] text-[#62727E]">Dadar Central Relief Hub</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#142638]">12 / 30</div>
                      <div className="text-[10px] text-[#087F7A] font-medium">Reserved: 4</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E9E7]/60 flex items-center justify-between text-[12px]">
                <span className="text-[#62727E]">Depot Inventory Engine</span>
                <Link to="/inventory" className="font-semibold text-[#087F7A] hover:text-[#08615E] inline-flex items-center">
                  <span>Open Depot Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Four Feature Quick-Access Cards at the Bottom */}
      <section className="py-12 bg-[#F3F6F5] border-t border-[#E2E9E7]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Link
              to="/command"
              className="bg-white rounded-2xl p-5 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[15px] text-[#142638] mb-1">Command Center</h4>
              <p className="text-[12px] text-[#62727E]">
                A real-time operational hub to monitor incidents, dispatch teams, and take action.
              </p>
            </Link>

            <Link
              to="/mission-trace"
              className="bg-white rounded-2xl p-5 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[15px] text-[#142638] mb-1">Mission Trace</h4>
              <p className="text-[12px] text-[#62727E]">
                End-to-end visibility of every response with an auditable state-machine log.
              </p>
            </Link>

            <Link
              to="/inventory"
              className="bg-white rounded-2xl p-5 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[15px] text-[#142638] mb-1">Inventory Control</h4>
              <p className="text-[12px] text-[#62727E]">
                Track, reserve, and deploy critical relief supplies with zero double-allocation.
              </p>
            </Link>

            <Link
              to="/scenarios"
              className="bg-white rounded-2xl p-5 border border-[#E2E9E7] shadow-subtle hover:shadow-card transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F4F1] text-[#087F7A] flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[15px] text-[#142638] mb-1">Scenario Benchmarks</h4>
              <p className="text-[12px] text-[#62727E]">
                Evaluate response plans across historical and synthetic Mumbai scenarios.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#E2E9E7] bg-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6 text-[13px] font-medium text-[#62727E]">
            <span className="text-[#142638] font-semibold">ResQGrid Platform</span>
            <span>AWS ap-south-1</span>
            <span>React 18</span>
            <span>FastAPI</span>
            <span>PostgreSQL 16</span>
          </div>

          <div className="flex items-center space-x-4 text-[13px] text-[#62727E]">
            <Link to="/command" className="hover:text-[#087F7A] transition-colors">
              Launch Console
            </Link>
            <span>•</span>
            <Link to="/docs" className="hover:text-[#087F7A] transition-colors">
              Architecture Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
