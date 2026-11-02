import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
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
  Download,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { ComparisonResult } from '../types';
import { ScenarioCommander3D } from '../components/three/ScenarioCommander3D';
import { RESQ_PALETTE, exportToCSV } from '../utils/chartTheme';

export const ScenarioCommander: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('Mumbai Urban Flood');
  const [incidentCount, setIncidentCount] = useState<number>(35);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [monteCarloSeeds, setMonteCarloSeeds] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'3D' | 'CHARTS'>('CHARTS');

  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const compareMutation = useMutation({
    mutationFn: () =>
      apiRequest<any>('/simulations/compare', {
        method: 'POST',
        body: JSON.stringify({
          scenario_name: scenarioName,
          incident_count: incidentCount,
          random_seed: randomSeed,
          algorithm: 'BOTH',
          run_monte_carlo: true,
          monte_carlo_seeds_count: monteCarloSeeds,
        }),
      }),
    onSuccess: (data) => {
      setComparisonResult(data);
    },
  });

  const mcSummary = comparisonResult?.monte_carlo_summary;
  const seedDetails = mcSummary?.seed_details || [];
  const cdfPoints = mcSummary?.cdf_points || [];
  const improvements = comparisonResult?.improvements || {};

  // Handlers
  const handleRunBenchmark = () => {
    compareMutation.mutate();
  };

  const handleExportBenchmarkCSV = () => {
    if (!seedDetails.length) return;
    const headers = [
      'Seed',
      'FIFO Critical Wait (min)',
      'ResQGrid Critical Wait (min)',
      'Reduction %',
      'FIFO Avg Wait (min)',
      'ResQGrid Avg Wait (min)',
      'FIFO Util %',
      'ResQGrid Util %',
      'FIFO Unresolved',
      'ResQGrid Unresolved',
    ];
    const rows = seedDetails.map((s: any) => [
      s.seed,
      s.fifo_critical_wait_minutes,
      s.resqgrid_critical_wait_minutes,
      s.reduction_pct,
      s.fifo_avg_wait_minutes,
      s.resqgrid_avg_wait_minutes,
      s.fifo_utilization_pct,
      s.resqgrid_utilization_pct,
      s.fifo_unresolved,
      s.resqgrid_unresolved,
    ]);
    exportToCSV(`resqgrid_benchmark_${scenarioName.replace(/\s+/g, '_')}`, rows, headers);
  };

  // 1. Grouped Bars (Mean +- Spread)
  const groupedBarsOption = comparisonResult
    ? {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: '#FFFFFF',
          borderColor: '#E3DFD6',
        },
        legend: {
          data: ['Baseline FIFO', 'ResQGrid Risk-Aware'],
          bottom: 0,
          textStyle: { color: '#5A6472', fontSize: 11 },
        },
        grid: { top: 25, right: 25, bottom: 45, left: 45 },
        xAxis: {
          type: 'category',
          data: ['Avg Response Time (m)', 'Critical Wait (m)', 'Resource Util (%)', 'Unresolved Requests'],
          axisLabel: { color: '#5A6472', fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#5A6472', fontSize: 11 },
          splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
        },
        series: [
          {
            name: 'Baseline FIFO',
            type: 'bar',
            barWidth: '28%',
            data: [
              Math.round((comparisonResult.baseline_fifo.avg_wait_time_seconds / 60) * 10) / 10,
              Math.round((comparisonResult.baseline_fifo.critical_wait_time_seconds / 60) * 10) / 10,
              comparisonResult.baseline_fifo.resource_utilization_pct,
              comparisonResult.baseline_fifo.unfulfilled_requests,
            ],
            itemStyle: { color: '#94A3B8', borderRadius: [4, 4, 0, 0] },
          },
          {
            name: 'ResQGrid Risk-Aware',
            type: 'bar',
            barWidth: '28%',
            data: [
              Math.round((comparisonResult.risk_aware_algorithm.avg_wait_time_seconds / 60) * 10) / 10,
              Math.round((comparisonResult.risk_aware_algorithm.critical_wait_time_seconds / 60) * 10) / 10,
              comparisonResult.risk_aware_algorithm.resource_utilization_pct,
              comparisonResult.risk_aware_algorithm.unfulfilled_requests,
            ],
            itemStyle: { color: '#14284B', borderRadius: [4, 4, 0, 0] },
          },
        ],
      }
    : null;

  // 2. Cumulative Distribution Function (CDF) of response times
  const cdfOption = cdfPoints.length
    ? {
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#FFFFFF',
          borderColor: '#E3DFD6',
          formatter: (params: any) => {
            let res = `<strong>Wait Threshold: ${params[0].axisValue} min</strong><br/>`;
            params.forEach((p: any) => {
              res += `${p.marker} ${p.seriesName}: <span style="font-family: monospace; font-weight: bold;">${p.value}%</span><br/>`;
            });
            return res;
          },
        },
        legend: {
          data: ['Baseline FIFO (CDF)', 'ResQGrid Risk-Aware (CDF)'],
          bottom: 0,
          textStyle: { color: '#5A6472', fontSize: 11 },
        },
        grid: { top: 25, right: 25, bottom: 45, left: 45 },
        xAxis: {
          type: 'category',
          name: 'Wait (min)',
          data: cdfPoints.map((p: any) => `${p.wait_threshold_minutes}m`),
          axisLabel: { color: '#5A6472', fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          name: 'Cumulative %',
          min: 0,
          max: 100,
          axisLabel: { color: '#5A6472', fontSize: 11 },
          splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
        },
        series: [
          {
            name: 'Baseline FIFO (CDF)',
            type: 'line',
            data: cdfPoints.map((p: any) => p.fifo_cumulative_pct),
            smooth: true,
            lineStyle: { color: '#94A3B8', width: 2, type: 'dashed' },
            itemStyle: { color: '#94A3B8' },
          },
          {
            name: 'ResQGrid Risk-Aware (CDF)',
            type: 'line',
            data: cdfPoints.map((p: any) => p.resqgrid_cumulative_pct),
            smooth: true,
            lineStyle: { color: '#14284B', width: 3 },
            itemStyle: { color: '#14284B' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(20, 40, 75, 0.25)' },
                  { offset: 1, color: 'rgba(20, 40, 75, 0.00)' },
                ],
              },
            },
          },
        ],
      }
    : null;

  // 3. Box Plot / Per-Seed Critical Wait Times
  const boxPlotOption = seedDetails.length
    ? {
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#FFFFFF',
          borderColor: '#E3DFD6',
        },
        legend: {
          data: ['FIFO Critical Wait', 'ResQGrid Critical Wait'],
          bottom: 0,
          textStyle: { color: '#5A6472', fontSize: 11 },
        },
        grid: { top: 25, right: 25, bottom: 45, left: 45 },
        xAxis: {
          type: 'category',
          data: seedDetails.map((s: any) => `Seed ${s.seed}`),
          axisLabel: { color: '#5A6472', fontSize: 10, rotate: 30 },
        },
        yAxis: {
          type: 'value',
          name: 'Critical Wait (min)',
          axisLabel: { color: '#5A6472', fontSize: 11 },
          splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
        },
        series: [
          {
            name: 'FIFO Critical Wait',
            type: 'bar',
            barGap: '15%',
            data: seedDetails.map((s: any) => s.fifo_critical_wait_minutes),
            itemStyle: { color: '#CBD5E1', borderRadius: [3, 3, 0, 0] },
          },
          {
            name: 'ResQGrid Critical Wait',
            type: 'bar',
            data: seedDetails.map((s: any) => s.resqgrid_critical_wait_minutes),
            itemStyle: { color: '#14284B', borderRadius: [3, 3, 0, 0] },
          },
        ],
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rq-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-rq-ink flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-rq-brand" />
              <span>Scenario Commander — Policy Benchmark & Discrete-Event Simulation</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Monte Carlo Replications
            </span>
          </div>
          <p className="text-xs text-rq-muted mt-1 font-mono">
            Scientific comparison of Baseline First-In-First-Out (FIFO) vs. ResQGrid Intelligent Risk-Aware Dispatch Engine.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg border border-rq-border bg-rq-surface2 p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('CHARTS')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'CHARTS' ? 'bg-white font-bold text-rq-ink shadow-sm' : 'text-rq-muted hover:text-rq-ink'
              }`}
            >
              Benchmark Charts
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === '3D' ? 'bg-white font-bold text-rq-ink shadow-sm' : 'text-rq-muted hover:text-rq-ink'
              }`}
            >
              3D Disaster Sim
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Parameter Controls */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-rq-border">
          <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-rq-brand" />
            <span>Monte Carlo Multi-Seed Parameters</span>
          </span>
          <span className="text-[11px] font-mono text-rq-muted">Deterministic & Replicable</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          <div>
            <label className="block text-[11px] font-mono text-rq-muted uppercase mb-1">Disaster Scenario</label>
            <select
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full bg-rq-surface2 border border-rq-border rounded-lg px-3 py-2 text-rq-ink font-semibold"
            >
              <option value="Mumbai Urban Flood">Mumbai Urban Flood (Mithi River)</option>
              <option value="Mumbai Coastal Cyclone">Mumbai Coastal Cyclone (High Tide)</option>
              <option value="Structural Collapse Scenario">Dharavi Structural Collapse</option>
              <option value="Industrial Fire & Hazmat">Industrial Chemical Fire</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-rq-muted uppercase mb-1">
              Incident Batch Size (N = {incidentCount})
            </label>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={incidentCount}
              onChange={(e) => setIncidentCount(Number(e.target.value))}
              className="w-full accent-[#14284B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-rq-muted uppercase mb-1">Random Seed (Base)</label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(Number(e.target.value))}
              className="w-full bg-rq-surface2 border border-rq-border rounded-lg px-3 py-1.5 font-mono text-rq-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-rq-muted uppercase mb-1">Monte Carlo Seeds</label>
            <input
              type="number"
              min={5}
              max={30}
              value={monteCarloSeeds}
              onChange={(e) => setMonteCarloSeeds(Number(e.target.value))}
              className="w-full bg-rq-surface2 border border-rq-border rounded-lg px-3 py-1.5 font-mono text-rq-ink"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunBenchmark}
            disabled={compareMutation.isPending}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#14284B] hover:bg-[#1E3A8A] disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition"
          >
            <Play className={`w-4 h-4 ${compareMutation.isPending ? 'animate-spin' : ''}`} />
            <span>
              {compareMutation.isPending ? 'Running Monte Carlo Iterations...' : 'Execute Benchmark Simulation'}
            </span>
          </button>
        </div>
      </div>

      {viewMode === '3D' ? (
        <ScenarioCommander3D incidents={[]} teams={[]} depots={[]} />
      ) : (
        <>
          {/* Result Summary Sentence Callout */}
          {comparisonResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-blue-900">
              <Sparkles className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono uppercase tracking-wider text-[11px] text-blue-800 block mb-0.5">
                  Empirical Benchmark Result Summary
                </span>
                <p className="font-medium">{comparisonResult.summary_analysis}</p>
                <div className="mt-2 text-[11px] font-mono text-blue-700 flex flex-wrap gap-4">
                  <span>Critical Wait Reduction: <strong>{improvements.critical_wait_reduction_pct}%</strong></span>
                  <span>Evaluated Seeds: <strong>{mcSummary?.seeds_evaluated}</strong></span>
                  <span>Statistical Significance: <strong>{mcSummary?.statistical_significance}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Benchmark Charts Grid */}
          {comparisonResult ? (
            <div className="space-y-6">
              {/* Row 1: Grouped Bars & CDF Curve */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grouped Bars */}
                <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-rq-border">
                    <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
                      Policy Benchmark Metrics: Mean &plusmn; Spread
                    </span>
                    <span className="text-[11px] font-mono text-rq-muted">FIFO vs. ResQGrid</span>
                  </div>
                  <div className="h-72">
                    <ReactECharts option={groupedBarsOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                {/* CDF Curve */}
                <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-rq-border">
                    <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
                      Cumulative Distribution Function (CDF)
                    </span>
                    <span className="text-[11px] font-mono text-rq-muted">P(Wait &le; t)</span>
                  </div>
                  <div className="h-72">
                    <ReactECharts option={cdfOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Row 2: Per-Seed Box Plot Comparison */}
              <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-rq-border">
                  <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
                    Per-Seed Monte Carlo Replication Distribution (Critical Wait Times)
                  </span>
                  <span className="text-[11px] font-mono text-rq-muted">
                    {seedDetails.length} Stochastic Runs
                  </span>
                </div>
                <div className="h-64">
                  <ReactECharts option={boxPlotOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>

              {/* Row 3: Raw Numbers Table & CSV Export */}
              <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-rq-border">
                  <div>
                    <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
                      Raw Simulation Replications Data Table
                    </span>
                    <p className="text-[11px] text-rq-muted mt-0.5">
                      Empirical per-seed breakdown with exact response times and resource utilization delta.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBenchmarkCSV}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-mono shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Benchmark CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-rq-border text-[11px] font-mono uppercase text-rq-muted">
                        <th className="py-2 px-3">Seed</th>
                        <th className="py-2 px-3">FIFO Critical Wait</th>
                        <th className="py-2 px-3">ResQGrid Critical Wait</th>
                        <th className="py-2 px-3">Critical Reduction %</th>
                        <th className="py-2 px-3">FIFO Avg Wait</th>
                        <th className="py-2 px-3">ResQGrid Avg Wait</th>
                        <th className="py-2 px-3">FIFO Util %</th>
                        <th className="py-2 px-3">ResQGrid Util %</th>
                        <th className="py-2 px-3">Unresolved (FIFO / RQ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rq-border">
                      {seedDetails.map((s: any) => (
                        <tr key={s.seed} className="hover:bg-rq-surface2 transition font-mono text-[11px]">
                          <td className="py-2 px-3 font-bold text-rq-ink">#{s.seed}</td>
                          <td className="py-2 px-3 text-rq-muted">{s.fifo_critical_wait_minutes} min</td>
                          <td className="py-2 px-3 font-semibold text-rq-brand">{s.resqgrid_critical_wait_minutes} min</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800">
                              {s.reduction_pct}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-rq-muted">{s.fifo_avg_wait_minutes} min</td>
                          <td className="py-2 px-3 text-rq-ink">{s.resqgrid_avg_wait_minutes} min</td>
                          <td className="py-2 px-3 text-rq-muted">{s.fifo_utilization_pct}%</td>
                          <td className="py-2 px-3 font-bold text-rq-ink">{s.resqgrid_utilization_pct}%</td>
                          <td className="py-2 px-3 text-rq-muted">{s.fifo_unresolved} / {s.resqgrid_unresolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-rq-border rounded-xl p-12 text-center space-y-3 font-sans">
              <Cpu className="w-10 h-10 text-rq-brand mx-auto opacity-40" />
              <div className="text-sm font-bold text-rq-ink">Simulation Benchmark Ready</div>
              <p className="text-xs text-rq-muted max-w-md mx-auto">
                Select your disaster scenario and seed parameters above, then click <strong>Execute Benchmark Simulation</strong> to generate grouped bars, CDF curves, and per-seed performance distributions.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
