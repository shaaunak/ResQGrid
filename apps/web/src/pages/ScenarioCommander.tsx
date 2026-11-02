import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  BarChart,
  CheckCircle,
  Clock,
  Layers,
  TrendingDown,
  Activity,
  Box,
  BarChart2,
} from 'lucide-react';
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { apiRequest } from '../api/client';
import { ComparisonResult } from '../types';
import { ScenarioCommander3D } from '../components/three/ScenarioCommander3D';

export const ScenarioCommander: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('Mumbai Urban Flood');
  const [incidentCount, setIncidentCount] = useState<number>(35);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [viewMode, setViewMode] = useState<'3D' | 'CHARTS'>('3D');

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const compareMutation = useMutation({
    mutationFn: () =>
      apiRequest<ComparisonResult>('/simulations/compare', {
        method: 'POST',
        body: JSON.stringify({
          scenario_name: scenarioName,
          incident_count: incidentCount,
          random_seed: randomSeed,
          algorithm: 'BOTH',
        }),
      }),
    onSuccess: (data) => {
      setComparisonResult(data);
    },
  });

  // Prepare chart comparison data
  const chartData = comparisonResult
    ? [
        {
          metric: 'Critical Wait Time (min)',
          FIFO: Math.round(comparisonResult.baseline_fifo.critical_wait_time_seconds / 60),
          RiskAware: Math.round(comparisonResult.risk_aware_algorithm.critical_wait_time_seconds / 60),
        },
        {
          metric: 'Average Wait Time (min)',
          FIFO: Math.round(comparisonResult.baseline_fifo.avg_wait_time_seconds / 60),
          RiskAware: Math.round(comparisonResult.risk_aware_algorithm.avg_wait_time_seconds / 60),
        },
        {
          metric: 'P95 Wait Time (min)',
          FIFO: Math.round(comparisonResult.baseline_fifo.p95_wait_time_seconds / 60),
          RiskAware: Math.round(comparisonResult.risk_aware_algorithm.p95_wait_time_seconds / 60),
        },
      ]
    : [];

  const rateData = comparisonResult
    ? [
        {
          metric: 'Success Rate (%)',
          FIFO: comparisonResult.baseline_fifo.assignment_success_rate,
          RiskAware: comparisonResult.risk_aware_algorithm.assignment_success_rate,
        },
        {
          metric: 'Resource Utilization (%)',
          FIFO: comparisonResult.baseline_fifo.resource_utilization_pct,
          RiskAware: comparisonResult.risk_aware_algorithm.resource_utilization_pct,
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-command-border gap-2">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-command-teal" />
            <span>Scenario Commander — Simulation & Algorithm Benchmark</span>
          </h1>
          <p className="text-xs text-command-muted font-mono mt-0.5">
            Empirical comparative analysis: Baseline FIFO vs. Risk-Aware Intelligent Priority & Resource Matching.
          </p>
        </div>

        {/* 2D / 3D Mode Toggle */}
        <div className="flex items-center bg-command-surface border border-command-border rounded-lg p-1 font-mono text-xs">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === '3D'
                ? 'bg-command-teal text-white font-semibold shadow'
                : 'text-command-muted hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Interactive Simulation</span>
          </button>
          <button
            onClick={() => setViewMode('CHARTS')}
            className={`px-3 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === 'CHARTS'
                ? 'bg-command-teal text-white font-semibold shadow'
                : 'text-command-muted hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Benchmark Charts</span>
          </button>
        </div>
      </div>

      {/* Simulation Setup Console */}
      <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
          <span className="font-semibold text-white uppercase text-xs tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-command-teal" />
            <span>Disaster Parameters</span>
          </span>
          <span className="text-command-muted text-[11px]">Reproducible Stochastic Models</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-command-muted mb-1 font-semibold">Disaster Scenario</label>
            <select
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
            >
              <option value="Mumbai Urban Flood">Mumbai Urban Flood (Mithi River Basin)</option>
              <option value="Cyclone Disaster Response">Coastal Cyclone Relief (Colaba / Bandra)</option>
              <option value="Severe Earthquake Extrication">Dense Urban Structural Collapse</option>
            </select>
          </div>

          <div>
            <label className="block text-command-muted mb-1 font-semibold">Simulated Incidents Count</label>
            <input
              type="number"
              min="10"
              max="150"
              value={incidentCount}
              onChange={(e) => setIncidentCount(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-command-muted mb-1 font-semibold">Deterministic Random Seed</label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => compareMutation.mutate()}
            disabled={compareMutation.isPending}
            className="w-full py-3 bg-command-teal hover:bg-command-teal-bright disabled:opacity-50 text-white font-bold rounded flex items-center justify-center space-x-2 shadow-lg transition tracking-wider uppercase text-xs"
          >
            <Play className="w-4 h-4" />
            <span>
              {compareMutation.isPending
                ? 'Simulating Multi-Agent Dispatch Cycles...'
                : 'Execute Side-by-Side Algorithmic Benchmark'}
            </span>
          </button>
        </div>
      </div>

      {/* 3D Visualization View */}
      {viewMode === '3D' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-2">
              <Box className="w-4 h-4 text-command-teal" />
              <span>3D Disaster Response & Inundation Simulation</span>
            </h2>
            <span className="text-[11px] font-mono text-command-muted">
              Synchronized with real backend heuristic dispatch model
            </span>
          </div>

          <ScenarioCommander3D
            scenarioName={scenarioName}
            metrics={comparisonResult?.risk_aware_algorithm || null}
            stepHistory={
              comparisonResult?.risk_aware_algorithm?.step_history || [
                { tracking_id: 'SIM-101', assigned_team: 'Bandra Water Rescue Alpha', severity: 'CRITICAL' },
                { tracking_id: 'SIM-102', assigned_team: 'Kurla Rapid Evacuation Beta', severity: 'HIGH' },
                { tracking_id: 'SIM-103', assigned_team: 'Dadar Trauma Medical Unit 1', severity: 'HIGH' },
                { tracking_id: 'SIM-104', assigned_team: 'Andheri Search & Rescue Delta', severity: 'MEDIUM' },
              ]
            }
          />
        </div>
      )}

      {/* Benchmark Results (Charts View) */}
      {(viewMode === 'CHARTS' || comparisonResult) && comparisonResult && (
        <div className="space-y-6">
          {/* Summary Callout Banner */}
          <div className="bg-command-surface border border-command-teal/40 p-5 rounded-lg shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-command-teal font-mono font-semibold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              <span>Evaluator Benchmark Findings</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {comparisonResult.summary_analysis}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
              <div className="bg-command-darkest/70 p-3 rounded border border-command-border">
                <div className="text-command-muted text-[10px]">Critical Wait Time Reduction</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  -{comparisonResult.improvements.critical_wait_time_reduction_pct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Risk-aware priority triage</div>
              </div>
              <div className="bg-command-darkest/70 p-3 rounded border border-command-border">
                <div className="text-command-muted text-[10px]">Mean Wait Time Reduction</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  -{comparisonResult.improvements.overall_wait_time_reduction_pct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Haversine distance matching</div>
              </div>
              <div className="bg-command-darkest/70 p-3 rounded border border-command-border">
                <div className="text-command-muted text-[10px]">Resource Utilization</div>
                <div className="text-2xl font-bold text-purple-400 mt-1">
                  {comparisonResult.risk_aware_algorithm.resource_utilization_pct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  vs {comparisonResult.baseline_fifo.resource_utilization_pct}% baseline
                </div>
              </div>
            </div>
          </div>

          {/* Visual Recharts Comparison */}
          {viewMode === 'CHARTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Wait Times */}
              <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-command-border font-mono text-xs">
                  <span className="font-semibold text-white uppercase tracking-wider">Wait Times Comparison (Minutes)</span>
                  <span className="text-command-teal">Lower is Better</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBar data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e4566" />
                      <XAxis dataKey="metric" stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                      <YAxis stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#142235', borderColor: '#2e4566', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#8e9eb3' }} />
                      <Bar dataKey="FIFO" fill="#526276" name="Baseline FIFO" />
                      <Bar dataKey="RiskAware" fill="#137C82" name="Risk-Aware Matching" />
                    </RechartsBar>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Success & Utilization */}
              <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-command-border font-mono text-xs">
                  <span className="font-semibold text-white uppercase tracking-wider">System Efficiency Metrics</span>
                  <span className="text-command-teal">Higher is Better</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBar data={rateData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e4566" />
                      <XAxis dataKey="metric" stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                      <YAxis stroke="#8e9eb3" domain={[0, 100]} tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#142235', borderColor: '#2e4566', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#8e9eb3' }} />
                      <Bar dataKey="FIFO" fill="#526276" name="Baseline FIFO" />
                      <Bar dataKey="RiskAware" fill="#10b981" name="Risk-Aware Matching" />
                    </RechartsBar>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
