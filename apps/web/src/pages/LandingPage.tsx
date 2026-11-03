import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Layers,
  Users,
  Box,
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
  ChevronDown,
  TrendingUp,
  Cpu,
  BarChart2,
  Compass,
  Building,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const { loginAsPersona, isAuthenticated } = useAuth();
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
    <div className="min-h-screen bg-[#FAFAF7] text-[#152637] flex flex-col font-sans selection:bg-[#E8F4F1] selection:text-[#087A75]">
      {/* =========================================================================
          NAVBAR: Slim, refined, premium municipal tech navigation
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E3E8E5]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#087A75] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.18l6 3.33v4.61c0 4.14-2.82 8.01-6 9.07-3.18-1.06-6-4.93-6-9.07V8.51l6-3.33z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xl tracking-tight text-[#152637] leading-none">
                ResQGrid
              </span>
              <span className="text-[12px] text-[#64717B] tracking-tight mt-1 hidden sm:block">
                Emergency Coordination Platform
              </span>
            </div>
          </Link>

          {/* Minimal Nav Links */}
          <nav className="hidden md:flex items-center space-x-9 text-[15px] font-medium text-[#64717B]">
            <a href="#how-it-works" className="hover:text-[#152637] transition-colors">
              How It Works
            </a>
            <a href="#decision-engine" className="hover:text-[#152637] transition-colors">
              Decision Engine
            </a>
            <a href="#product-spotlight" className="hover:text-[#152637] transition-colors">
              Command Center
            </a>
            <a href="#cloud-architecture" className="hover:text-[#152637] transition-colors">
              Architecture
            </a>
            <Link to="/docs" className="hover:text-[#152637] transition-colors">
              Documentation
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/command"
                className="inline-flex items-center px-5 py-2.5 text-[14px] font-semibold text-white bg-[#087A75] hover:bg-[#06615D] rounded-lg shadow-sm transition-all"
              >
                <span>Console</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-[14px] font-medium text-[#152637] hover:text-[#087A75] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/command"
                  className="inline-flex items-center px-5 py-2.5 text-[14px] font-semibold text-white bg-[#087A75] hover:bg-[#06615D] rounded-lg shadow-sm transition-all group"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1 — CINEMATIC EDITORIAL HERO
          Asymmetric Composition: 55% Left Editorial Typography / 45% Right Authentic Mumbai
          ========================================================================= */}
      <section className="relative pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden border-b border-[#E3E8E5]/70">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column (55%): Powerful Typography, Statement & Actions */}
            <div className="lg:col-span-7 space-y-8">
              {/* Product Category Label */}
              <div className="inline-flex items-center space-x-2.5 text-[13px] font-medium text-[#64717B]">
                <span className="w-2 h-2 rounded-full bg-[#087A75]" />
                <span className="tracking-wide uppercase text-[12px] font-semibold text-[#087A75]">
                  Municipal Disaster Coordination & Resource Dispatch
                </span>
              </div>

              {/* Dramatic Editorial Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-[#152637] tracking-tight leading-[1.06]">
                When every second matters, <br className="hidden sm:inline" />
                <span className="text-[#087A75]">coordination matters more.</span>
              </h1>

              {/* Calm, Truthful Supporting Paragraph */}
              <p className="text-lg sm:text-xl text-[#64717B] leading-relaxed max-w-2xl font-normal">
                ResQGrid connects incident reporting, intelligent dispatch, response teams and relief resources in one coordinated platform.
              </p>

              {/* Two Refined CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/command"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#087A75] hover:bg-[#06615D] text-white text-[15px] font-semibold shadow-sm transition-all group"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-white hover:bg-[#F3F6F5] text-[#152637] text-[15px] font-medium border border-[#E3E8E5] shadow-subtle transition-all"
                >
                  <span>See How It Works</span>
                  <ChevronDown className="w-4 h-4 ml-2 text-[#64717B]" />
                </a>
              </div>

              {/* Verification Micro-Bar */}
              <div className="pt-6 border-t border-[#E3E8E5]/80 flex flex-wrap items-center gap-y-2 gap-x-8 text-[13px] text-[#64717B]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#087A75]" />
                  <span>Operator-Approved Dispatch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#087A75]" />
                  <span>Explainable Urgency Scoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#087A75]" />
                  <span>Atomic PostgreSQL Stock Locking</span>
                </div>
              </div>
            </div>

            {/* Right Column (45%): Authentic Mumbai Imagery & Integrated Context */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Hero Photographic Composition */}
                <div className="rounded-2xl overflow-hidden border border-[#E3E8E5] shadow-elevated bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src="/images/mumbai_gateway_hero_clean.jpg"
                      alt="Mumbai Coastal Operations & Gateway of India"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#152637]/70 via-transparent to-transparent" />
                    
                    {/* Live Geo Label */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E3E8E5] shadow-sm flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#C84646] animate-pulse" />
                      <span className="text-[12px] font-semibold text-[#152637]">
                        Active Mumbai Operation
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="text-[13px] font-mono tracking-wider text-emerald-300 uppercase font-semibold">
                        Zone: Mumbai Coastline & Mithi River Basin
                      </div>
                      <div className="text-[16px] font-bold mt-0.5">
                        Multi-Hazard Urban Grid Coordination
                      </div>
                    </div>
                  </div>

                  {/* Refined Context Strip below image */}
                  <div className="p-4 bg-white flex items-center justify-between text-[13px] border-t border-[#E3E8E5]/70">
                    <div>
                      <div className="text-[#64717B]">Active Response Squads</div>
                      <div className="font-semibold text-[#152637] mt-0.5">5 Teams Available Across BMC Wards</div>
                    </div>
                    <Link
                      to="/command"
                      className="font-semibold text-[#087A75] hover:text-[#06615D] flex items-center"
                    >
                      <span>Open Console</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Link>
                  </div>
                </div>

                {/* Subtitle Accent Frame behind image */}
                <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl border border-[#E3E8E5] -z-10 bg-[#F3F6F5]" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — PRODUCT INTRODUCTION (Open, Editorial 2-Column)
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-white border-b border-[#E3E8E5]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Storytelling Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[12px] font-bold tracking-widest text-[#087A75] uppercase">
                Purpose-Built Municipal Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#152637] tracking-tight leading-[1.12]">
                An operational hub designed for the worst hour of a disaster.
              </h2>
              <p className="text-[16px] text-[#64717B] leading-relaxed">
                When catastrophic monsoons or sudden emergencies overwhelm urban infrastructure, conventional communication breaks down. ResQGrid provides emergency command centers with instant visibility, algorithmic ranking, and guaranteed supply reservation.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F4F1] text-[#087A75] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#152637] text-[15px]">Zero Phantom Inventory</h4>
                    <p className="text-[14px] text-[#64717B] mt-0.5">
                      Row-level transactional locks prevent boats and pumps from being double-assigned by competing operators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F4F1] text-[#087A75] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#152637] text-[15px]">Transparent Priority Math</h4>
                    <p className="text-[14px] text-[#64717B] mt-0.5">
                      Deterministic multi-criteria scoring ensures critical requests never starve while low-priority calls wait their turn.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F4F1] text-[#087A75] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#152637] text-[15px]">Immutable Audit Trail</h4>
                    <p className="text-[14px] text-[#64717B] mt-0.5">
                      Every status shift, operator override, and supply movement is sealed in PostgreSQL audit logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/command"
                  className="font-semibold text-[#087A75] hover:text-[#06615D] inline-flex items-center text-[15px]"
                >
                  <span>Launch Live Command Center</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Right Genuine Product Preview Frame */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#E3E8E5] bg-[#FAFAF7] p-3 shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#E3E8E5] text-[13px] text-[#64717B] mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087A75]" />
                    <span className="font-semibold text-[#152637]">Live Operational Console</span>
                  </div>
                  <span className="font-mono text-[12px]">2D GIS / 3D Digital Twin</span>
                </div>
                <img
                  src="/images/command_center_actual.png"
                  alt="Actual ResQGrid Command Center Interface"
                  className="w-full h-auto rounded-xl border border-[#E3E8E5] shadow-sm object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — HOW COORDINATION HAPPENS (Single Horizontal Journey)
          Report → Prioritize → Approve → Dispatch → Resolve
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-[#FAFAF7] border-b border-[#E3E8E5]" id="how-it-works">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          
          {/* Header */}
          <div className="max-w-2xl mb-16 space-y-3">
            <span className="text-[12px] font-bold tracking-widest text-[#087A75] uppercase">
              Operational Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#152637] tracking-tight">
              How coordination happens
            </h2>
            <p className="text-[16px] text-[#64717B]">
              From citizen intake to field resolution, every incident traverses a deterministic, operator-supervised state machine.
            </p>
          </div>

          {/* Clean Horizontal Timeline (No 5 identical cards) */}
          <div className="relative">
            {/* Connecting baseline line */}
            <div className="hidden lg:block absolute top-12 left-8 right-8 h-0.5 bg-[#E3E8E5] z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#087A75] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#152637]">Report</h3>
                  <div className="text-[13px] font-mono text-[#087A75] font-semibold mt-0.5">Citizen Ingestion</div>
                  <p className="text-[14px] text-[#64717B] mt-2 leading-relaxed">
                    Citizen reports via mobile wizard with GPS coordinates, affected count, and S3 evidence upload. 150m deduplication merges duplicate callers.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#087A75] text-[#087A75] flex items-center justify-center font-bold text-sm shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#152637]">Prioritize</h3>
                  <div className="text-[13px] font-mono text-[#087A75] font-semibold mt-0.5">Heuristic Engine</div>
                  <p className="text-[14px] text-[#64717B] mt-2 leading-relaxed">
                    Four-factor model computes urgency score (0–100). Starvation prevention boosts waiting incidents dynamically over elapsed time.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#087A75] text-[#087A75] flex items-center justify-center font-bold text-sm shadow-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#152637]">Approve</h3>
                  <div className="text-[13px] font-mono text-[#087A75] font-semibold mt-0.5">Operator Control</div>
                  <p className="text-[14px] text-[#64717B] mt-2 leading-relaxed">
                    Top 3 squads ranked by capability, equipment, and haversine travel time. Human operator reviews plain-language rationale and confirms.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#087A75] text-[#087A75] flex items-center justify-center font-bold text-sm shadow-sm">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#152637]">Dispatch</h3>
                  <div className="text-[13px] font-mono text-[#087A75] font-semibold mt-0.5">Atomic Reservation</div>
                  <p className="text-[14px] text-[#64717B] mt-2 leading-relaxed">
                    Database issues row-level lock on depot supplies. SQS event fires notification to squad captains while stock movement is logged.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#087A75] text-[#087A75] flex items-center justify-center font-bold text-sm shadow-sm">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#152637]">Resolve</h3>
                  <div className="text-[13px] font-mono text-[#087A75] font-semibold mt-0.5">Evidence & Release</div>
                  <p className="text-[14px] text-[#64717B] mt-2 leading-relaxed">
                    Field responders update milestones (En Route → On Scene), reconcile consumed supplies, and submit photographic proof to close the ticket.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — INTELLIGENT DECISION-MAKING (Priority Engine Editorial)
          Severity 35% • Impact 25% • Waiting Time 20% • Vulnerability 20%
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-white border-b border-[#E3E8E5]" id="decision-engine">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[12px] font-bold tracking-widest text-[#087A75] uppercase">
                Deterministic Decision Heuristic
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#152637] tracking-tight leading-[1.12]">
                Explainable priority scoring, not opaque algorithms.
              </h2>
              <p className="text-[16px] text-[#64717B] leading-relaxed">
                Emergency dispatchers must be able to justify why one incident receives squads ahead of another. ResQGrid replaces black-box predictions with an audited, multi-factor scoring formula that factors in vulnerability and prevents triage starvation.
              </p>

              <div className="p-5 bg-[#FAFAF7] rounded-xl border border-[#E3E8E5] font-mono text-sm space-y-2 text-[#152637]">
                <div className="text-[11px] text-[#64717B] uppercase tracking-wider font-sans font-semibold">
                  Mathematical Scoring Formula
                </div>
                <div className="text-[#087A75] font-bold">
                  Score = (0.35 × S) + (0.25 × I) + (0.20 × W) + (0.20 × V)
                </div>
                <div className="text-xs text-[#64717B]">
                  Where S = Severity, I = Casualty Exposure, W = Waiting Starvation, V = Zone Vulnerability
                </div>
              </div>
            </div>

            {/* Right Structured Visualization */}
            <div className="lg:col-span-6">
              <div className="bg-[#FAFAF7] rounded-2xl p-8 border border-[#E3E8E5] shadow-card space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E3E8E5]">
                  <div>
                    <h3 className="font-bold text-lg text-[#152637]">Priority Factor Breakdown</h3>
                    <div className="text-xs text-[#64717B]">Engine Weights & Component Distribution</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4F1] text-[#087A75]">
                    Sum: 100%
                  </span>
                </div>

                {/* Factor 1: Severity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-[#152637]">1. Incident Severity</span>
                    <span className="font-mono font-bold text-[#087A75]">35%</span>
                  </div>
                  <div className="w-full bg-[#E3E8E5] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#087A75] h-full rounded-full" style={{ width: '35%' }} />
                  </div>
                  <div className="text-[12px] text-[#64717B]">
                    Categorical hazard weight (Critical = 1.0, High = 0.7, Medium = 0.4, Low = 0.1)
                  </div>
                </div>

                {/* Factor 2: Impact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-[#152637]">2. Impact & Population Exposure</span>
                    <span className="font-mono font-bold text-[#087A75]">25%</span>
                  </div>
                  <div className="w-full bg-[#E3E8E5] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#087A75] h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                  <div className="text-[12px] text-[#64717B]">
                    Logarithmic casualty scale (bounded between 0 and 1.0 to prevent outlier domination)
                  </div>
                </div>

                {/* Factor 3: Waiting Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-[#152637]">3. Waiting Time Starvation Prevention</span>
                    <span className="font-mono font-bold text-[#087A75]">20%</span>
                  </div>
                  <div className="w-full bg-[#E3E8E5] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#087A75] h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                  <div className="text-[12px] text-[#64717B]">
                    Gradual score increase over elapsed minutes ensuring neglected incidents escalate
                  </div>
                </div>

                {/* Factor 4: Vulnerability */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-[#152637]">4. Zone Vulnerability Multiplier</span>
                    <span className="font-mono font-bold text-[#087A75]">20%</span>
                  </div>
                  <div className="w-full bg-[#E3E8E5] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#087A75] h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                  <div className="text-[12px] text-[#64717B]">
                    Geographic vulnerability lookup (Kurla West lowlands, Dharavi slums, Mithi basin)
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — PRODUCT SPOTLIGHT (Large Framed Command Center)
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-[#FAFAF7] border-b border-[#E3E8E5]" id="product-spotlight">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-[12px] font-bold tracking-widest text-[#087A75] uppercase">
              Operational Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#152637] tracking-tight">
              The Command Center in Action
            </h2>
            <p className="text-[16px] text-[#64717B] max-w-2xl mx-auto">
              A single unified pane combining real-time incident queues, geospatial city intelligence, ranked squads, and one-click dispatch approval.
            </p>
          </div>

          {/* Large Beautifully Framed Actual Product Screenshot */}
          <div className="rounded-3xl border border-[#E3E8E5] bg-white p-4 shadow-elevated overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E8E5]/80 text-[13px] text-[#64717B] mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-[#C84646]" />
                <div className="w-3 h-3 rounded-full bg-[#D17C3D]" />
                <div className="w-3 h-3 rounded-full bg-[#087A75]" />
                <span className="font-semibold text-[#152637] ml-2">ResQGrid Command Center — Production Deployment</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-[12px] text-[#087A75] font-semibold">19 Incidents Active</span>
                <span className="font-mono text-[12px] text-[#64717B]">ap-south-1 Mumbai</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#E3E8E5]">
              <img
                src="/images/command_center_actual.png"
                alt="Command Center Tactical Workspace"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Contextual Link */}
          <div className="mt-8 text-center">
            <Link
              to="/command"
              className="inline-flex items-center text-[15px] font-semibold text-[#087A75] hover:text-[#06615D] group"
            >
              <span>Explore the Live Interactive Console</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — CLOUD ARCHITECTURE (Minimal, Technically Grounded)
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-white border-b border-[#E3E8E5]" id="cloud-architecture">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Architecture Overview */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[12px] font-bold tracking-widest text-[#087A75] uppercase">
                AWS Infrastructure as Code
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#152637] tracking-tight leading-[1.14]">
                Engineered for cost discipline and high availability.
              </h2>
              <p className="text-[16px] text-[#64717B] leading-relaxed">
                Deployed in AWS Mumbai (<code className="text-xs bg-[#F3F6F5] px-1.5 py-0.5 rounded font-mono text-[#152637]">ap-south-1</code>) using modular Terraform. Eliminates expensive NAT Gateways while securing RDS PostgreSQL in private dual-AZ subnets with least-privilege IAM roles.
              </p>

              <div className="space-y-3 pt-2 text-[14px]">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF7] border border-[#E3E8E5]">
                  <span className="font-semibold text-[#152637]">Compute Layer</span>
                  <span className="font-mono text-xs text-[#087A75]">Auto Scaling Group (t3.micro)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF7] border border-[#E3E8E5]">
                  <span className="font-semibold text-[#152637]">Database Engine</span>
                  <span className="font-mono text-xs text-[#087A75]">Amazon RDS PostgreSQL 16</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF7] border border-[#E3E8E5]">
                  <span className="font-semibold text-[#152637]">Evidence & Audit Storage</span>
                  <span className="font-mono text-xs text-[#087A75]">Amazon S3 (SSE-S3 SHA-256)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF7] border border-[#E3E8E5]">
                  <span className="font-semibold text-[#152637]">Event Decoupling</span>
                  <span className="font-mono text-xs text-[#087A75]">Amazon SQS FIFO + DLQ</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/docs"
                  className="font-semibold text-[#087A75] hover:text-[#06615D] inline-flex items-center text-[15px]"
                >
                  <span>View Full Terraform Architecture Dossier</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Architecture Visual Preview Card */}
            <div className="lg:col-span-7">
              <div className="p-6 bg-[#FAFAF7] rounded-2xl border border-[#E3E8E5] shadow-card space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64717B] border-b border-[#E3E8E5] pb-3">
                  <span className="font-bold text-[#152637] text-[14px]">AWS Cloud Topology (ap-south-1)</span>
                  <span className="font-mono text-[#087A75]">Terraform Managed</span>
                </div>
                <img
                  src="/images/mission_trace_actual.png"
                  alt="Architecture and Mission Pipeline Visualization"
                  className="w-full h-auto rounded-xl border border-[#E3E8E5] shadow-sm"
                />
                <div className="text-[12px] text-[#64717B] text-center pt-1">
                  End-to-end event propagation: FastAPI → Transactional Outbox → SQS Consumer → S3 Evidence
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — MINIMAL FINAL CTA & CLEAN FOOTER
          ========================================================================= */}
      <section className="py-24 bg-[#FAFAF7]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-[#152637] tracking-tight leading-tight">
              Ready to explore the disaster coordination platform?
            </h2>
            <p className="text-[17px] text-[#64717B]">
              Experience real-time incident triage, heuristic team matching, and atomic supply reservation across Mumbai.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/command"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-[#087A75] hover:bg-[#06615D] text-white text-[15px] font-semibold shadow-sm transition-all group"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/citizen"
              className="inline-flex items-center justify-center px-7 py-4 rounded-lg bg-white hover:bg-[#F3F6F5] text-[#152637] text-[15px] font-semibold border border-[#E3E8E5] shadow-subtle transition-all"
            >
              <span>Submit Citizen Report</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Municipal Technology Footer */}
      <footer className="border-t border-[#E3E8E5] bg-white py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E3E8E5]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#087A75] flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="font-semibold text-lg text-[#152637]">ResQGrid Platform</span>
            </div>

            <div className="flex flex-wrap items-center gap-8 text-[14px] text-[#64717B]">
              <Link to="/command" className="hover:text-[#087A75] transition-colors">
                Command Center
              </Link>
              <Link to="/citizen" className="hover:text-[#087A75] transition-colors">
                Citizen Portal
              </Link>
              <Link to="/track" className="hover:text-[#087A75] transition-colors">
                Track Incident
              </Link>
              <Link to="/inventory" className="hover:text-[#087A75] transition-colors">
                Relief Inventory
              </Link>
              <Link to="/mission-trace" className="hover:text-[#087A75] transition-colors">
                Mission Trace
              </Link>
              <Link to="/docs" className="hover:text-[#087A75] transition-colors">
                Architecture Docs
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[13px] text-[#64717B] gap-4">
            <div>
              Academic Disaster Response & Resource Coordination Platform (Mumbai Scenario).
            </div>
            <div>
              Built with React 18, FastAPI, PostgreSQL 16 & AWS.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
