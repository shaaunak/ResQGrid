import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  Download,
  Lock,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  Award,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RESQ_PALETTE, getSeverityColor, exportToCSV } from '../utils/chartTheme';

export const AnalyticsPage: React.FC = () => {
  const { user, loginAsPersona } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: analytics, isLoading, error, refetch, isFetching } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => apiRequest('/analytics'),
    refetchInterval: 10000,
    retry: 1,
  });

  if (error || (!isLoading && !analytics)) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-rq-brand flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#14284B]" />
        </div>
        <h2 className="text-base font-bold text-rq-ink">Operator Telemetry Authentication Required</h2>
        <p className="text-xs text-rq-muted leading-relaxed">
          Operational metrics and PostgreSQL audit logs require Operator or Coordinator credentials. Sign in below to load the live analytics stream.
        </p>
        <button
          onClick={async () => {
            await loginAsPersona('OPERATOR');
            refetch();
          }}
          className="px-4 py-2 bg-[#14284B] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          Sign In as Control Room Operator
        </button>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-rq-muted font-mono text-xs flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#14284B]" />
        <span>Aggregating real-time operational telemetry from PostgreSQL database...</span>
      </div>
    );
  }

  const kpis = analytics.kpis;
  const dist = analytics.response_distribution;
  const funnel = analytics.funnel || [];
  const heatmap = analytics.heatmap || { wards: [], hours: [], matrix: [] };
  const scatter = analytics.scatter_priority_wait || [];
  const resourceTimeline = analytics.resource_utilization_timeline || [];
  const teamsRadar = analytics.teams_radar || [];
  const slaGauges = analytics.sla_gauges;
  const stockCoverage = analytics.stock_coverage || [];

  const activeTeam = teamsRadar.find((t: any) => t.team_id === selectedTeamId) || teamsRadar[0] || null;

  // CSV Export handlers
  const handleExportKPIs = () => {
    const headers = ['Metric', 'Current Value', 'Target/Baseline', 'Status'];
    const rows = [
      ['Median Response Time', `${kpis.median_response_time_minutes} min`, '< 20.0 min', 'NORMAL'],
      ['Resolution Rate', `${kpis.resolution_rate_pct}%`, '> 60.0%', 'HEALTHY'],
      ['SLA Compliance', `${kpis.sla_compliance_pct}%`, '> 85.0%', 'EXEMPLARY'],
      ['Resource Utilization', `${kpis.resource_utilization_pct}%`, '70-85%', 'OPTIMAL'],
      ['Open Critical Emergencies', kpis.open_critical_count, '0', kpis.open_critical_count > 0 ? 'ATTENTION' : 'CLEAR'],
    ];
    exportToCSV('resqgrid_operational_kpis', rows, headers);
  };

  const handleExportIncidents = () => {
    const headers = ['Tracking ID', 'Title', 'Severity', 'Category', 'Priority Score', 'Wait/Resolution Time (min)', 'Affected People', 'Status'];
    const rows = scatter.map((pt: any) => [
      pt.tracking_id,
      pt.title,
      pt.severity,
      pt.category,
      pt.priority_score,
      pt.wait_time_minutes,
      pt.affected_people,
      pt.status,
    ]);
    exportToCSV('resqgrid_incidents_audit_log', rows, headers);
  };

  const handleExportStock = () => {
    const headers = ['Depot Name', 'Item Name', 'SKU', 'Available', 'Reserved', 'Total', 'Min Threshold', 'Days Supply Left'];
    const rows = stockCoverage.map((sc: any) => [
      sc.depot_name,
      sc.item_name,
      sc.sku,
      sc.available,
      sc.reserved,
      sc.total,
      sc.threshold,
      sc.days_of_supply_left,
    ]);
    exportToCSV('resqgrid_inventory_forecast', rows, headers);
  };

  // Sparkline Chart Options
  const getSparklineOption = (data: number[], color: string) => ({
    grid: { top: 2, bottom: 2, left: 2, right: 2 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false, min: Math.min(...data) * 0.9, max: Math.max(...data) * 1.1 },
    series: [
      {
        data,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
      },
    ],
  });

  // 1. Response-Time Distribution Histogram
  const histogramOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
      textStyle: { color: '#12161C', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${p.name}</strong><br/>Incidents: <span style="font-family: monospace; font-weight: bold;">${p.value}</span>`;
      },
    },
    grid: { top: 35, right: 25, bottom: 35, left: 45 },
    xAxis: {
      type: 'category',
      data: dist?.bins || [],
      axisLine: { lineStyle: { color: '#E3DFD6' } },
      axisLabel: { color: '#5A6472', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
      axisLabel: { color: '#5A6472', fontSize: 11 },
    },
    series: [
      {
        name: 'Incidents',
        type: 'bar',
        barWidth: '45%',
        data: dist?.counts || [],
        itemStyle: {
          color: '#14284B',
          borderRadius: [4, 4, 0, 0],
        },
        markLine: {
          symbol: 'none',
          data: [
            {
              name: 'Median',
              xAxis: '15-20m',
              lineStyle: { color: '#2563EB', type: 'dashed', width: 2 },
              label: {
                formatter: `Median: ${dist?.median_minutes}m`,
                position: 'insideEndTop',
                color: '#2563EB',
                fontSize: 10,
                fontWeight: 'bold',
              },
            },
            {
              name: 'P90',
              xAxis: '25-30m',
              lineStyle: { color: '#E27D14', type: 'dashed', width: 2 },
              label: {
                formatter: `P90: ${dist?.p90_minutes}m`,
                position: 'insideEndTop',
                color: '#E27D14',
                fontSize: 10,
                fontWeight: 'bold',
              },
            },
          ],
        },
      },
    ],
  };

  // 2. Incident Funnel
  const funnelOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
      formatter: (p: any) => {
        const step = funnel.find((f: any) => f.stage === p.name);
        return `<strong>${p.name}</strong><br/>Volume: <span style="font-family: monospace; font-weight: bold;">${p.value}</span><br/>Drop-off: <span style="color: #C8201B; font-weight: bold;">${step?.dropoff_pct || 0}%</span>`;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#5A6472', fontSize: 11 },
    },
    series: [
      {
        name: 'Funnel Stage',
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 50,
        width: '80%',
        min: 0,
        max: funnel[0]?.count || 20,
        minSize: '15%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: {c}',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 600,
        },
        itemStyle: {
          borderColor: '#FFFFFF',
          borderWidth: 1,
        },
        data: funnel.map((f: any, idx: number) => ({
          value: f.count,
          name: f.stage,
          itemStyle: { color: RESQ_PALETTE.navyScale[idx % RESQ_PALETTE.navyScale.length] },
        })),
      },
    ],
  };

  // 3. Heatmap: Hour of Day vs Ward
  const heatmapOption = {
    tooltip: {
      position: 'top',
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
      formatter: (p: any) => {
        const [wIdx, h, val] = p.data;
        const wardName = heatmap.wards[wIdx];
        return `<strong>${wardName}</strong><br/>Hour: <span style="font-family: monospace;">${h}:00</span><br/>Incidents: <span style="font-family: monospace; font-weight: bold;">${val}</span>`;
      },
    },
    grid: { top: 25, bottom: 60, left: 140, right: 30 },
    xAxis: {
      type: 'category',
      data: (heatmap.hours || []).map((h: number) => `${h}h`),
      splitArea: { show: true },
      axisLabel: { color: '#5A6472', fontSize: 10, interval: 2 },
    },
    yAxis: {
      type: 'category',
      data: heatmap.wards || [],
      splitArea: { show: true },
      axisLabel: { color: '#5A6472', fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: 5,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 5,
      itemWidth: 14,
      itemHeight: 14,
      inRange: {
        color: ['#F6F4EF', '#93C5FD', '#2563EB', '#14284B', '#C8201B'],
      },
      textStyle: { color: '#5A6472', fontSize: 10 },
    },
    series: [
      {
        name: 'Incidents',
        type: 'heatmap',
        data: heatmap.matrix || [],
        label: { show: false },
        itemStyle: {
          borderRadius: 2,
          borderColor: '#FFFFFF',
          borderWidth: 1,
        },
      },
    ],
  };

  // 4. Scatter Plot: Priority Score vs Waiting Time
  const scatterOption = {
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
      formatter: (p: any) => {
        const d = p.data;
        return `<strong>${d[5]}</strong> (${d[4]})<br/>Priority Score: <span style="font-family: monospace; font-weight: bold;">${d[0]}</span><br/>Wait Time: <span style="font-family: monospace; font-weight: bold;">${d[1]} min</span><br/>People Affected: <span style="font-weight: bold;">${d[2]}</span><br/>Severity: <span style="font-weight: bold; color: ${getSeverityColor(d[3])};">${d[3]}</span>`;
      },
    },
    grid: { top: 35, right: 25, bottom: 40, left: 45 },
    xAxis: {
      name: 'Priority Score',
      nameLocation: 'middle',
      nameGap: 25,
      type: 'value',
      min: 20,
      max: 100,
      axisLabel: { color: '#5A6472', fontSize: 11 },
      splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
    },
    yAxis: {
      name: 'Wait Time (min)',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      axisLabel: { color: '#5A6472', fontSize: 11 },
      splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
    },
    series: [
      {
        name: 'Incidents',
        type: 'scatter',
        symbolSize: (data: any) => Math.max(10, Math.min(36, data[2] * 0.8)),
        data: scatter.map((pt: any) => [
          pt.priority_score,
          pt.wait_time_minutes,
          pt.affected_people,
          pt.severity,
          pt.tracking_id,
          pt.title,
        ]),
        itemStyle: {
          color: (p: any) => getSeverityColor(p.data[3]),
          opacity: 0.82,
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
        },
      },
    ],
  };

  // 5. Resource Utilization Over Time (Stacked Area)
  const resourceOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
    },
    legend: {
      data: ['Water Rescue', 'General Evacuation', 'Medical Trauma', 'Fire & Hazmat', 'Relief Distribution'],
      bottom: 0,
      textStyle: { color: '#5A6472', fontSize: 10 },
    },
    grid: { top: 25, right: 25, bottom: 45, left: 45 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: resourceTimeline.map((r: any) => r.timestamp),
      axisLabel: { color: '#5A6472', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'Utilization %',
      max: 100,
      axisLabel: { color: '#5A6472', fontSize: 11 },
      splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
    },
    series: [
      {
        name: 'Water Rescue',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        lineStyle: { width: 1.5 },
        color: '#1E3A8A',
        data: resourceTimeline.map((r: any) => r.water_rescue),
      },
      {
        name: 'General Evacuation',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        lineStyle: { width: 1.5 },
        color: '#2563EB',
        data: resourceTimeline.map((r: any) => r.general_evac),
      },
      {
        name: 'Medical Trauma',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        lineStyle: { width: 1.5 },
        color: '#C8201B',
        data: resourceTimeline.map((r: any) => r.medical),
      },
      {
        name: 'Fire & Hazmat',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        lineStyle: { width: 1.5 },
        color: '#E27D14',
        data: resourceTimeline.map((r: any) => r.fire_hazmat),
      },
      {
        name: 'Relief Distribution',
        type: 'line',
        stack: 'Total',
        areaStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        lineStyle: { width: 1.5 },
        color: '#2E7D5B',
        data: resourceTimeline.map((r: any) => r.distribution),
      },
    ],
  };

  // 6. Team Capability Radar
  const radarOption = {
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
    },
    radar: {
      indicator: [
        { name: 'Water Rescue', max: 100 },
        { name: 'Medical Trauma', max: 100 },
        { name: 'Fire Suppression', max: 100 },
        { name: 'Evacuation Speed', max: 100 },
        { name: 'Logistics Capacity', max: 100 },
      ],
      shape: 'polygon',
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#FFFFFF', '#FAF8F4', '#F6F4EF'],
        },
      },
      axisLine: { lineStyle: { color: '#E3DFD6' } },
      splitLine: { lineStyle: { color: '#E3DFD6' } },
    },
    series: [
      {
        name: activeTeam?.team_name || 'Team Capabilities',
        type: 'radar',
        data: [
          {
            value: activeTeam
              ? [
                  activeTeam.water_rescue_score,
                  activeTeam.medical_trauma_score,
                  activeTeam.fire_suppression_score,
                  activeTeam.evacuation_speed_score,
                  activeTeam.logistics_capacity_score,
                ]
              : [50, 50, 50, 50, 50],
            name: activeTeam?.team_name || 'Selected Team',
            lineStyle: { color: '#14284B', width: 2 },
            areaStyle: { color: 'rgba(20, 40, 75, 0.35)' },
            symbol: 'circle',
            symbolSize: 4,
          },
        ],
      },
    ],
  };

  // 7. SLA Gauge Option Generator
  const getGaugeOption = (title: string, value: number, target: number, color: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: { color },
        progress: { show: true, roundCap: true, width: 12 },
        pointer: { show: false },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 12, color: [[1, '#E3DFD6']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          fontSize: 11,
          color: '#5A6472',
          offsetCenter: [0, '25%'],
        },
        detail: {
          valueAnimation: true,
          fontSize: 18,
          offsetCenter: [0, '-15%'],
          formatter: '{value}%',
          color: '#12161C',
          fontFamily: 'monospace',
          fontWeight: 'bold',
        },
        data: [{ value, name: title }],
      },
    ],
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rq-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-rq-ink flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-rq-brand" />
              <span>Operational Analytics & Real-Time KPIs</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Live PostgreSQL Stream
            </span>
          </div>
          <p className="text-xs text-rq-muted mt-1 font-mono">
            Audit-grade performance metrics, dispatch latency distributions, and predictive inventory thresholds.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-rq-border rounded-lg text-xs font-mono text-rq-ink shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rq-brand ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportKPIs}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-mono shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export KPIs</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Row with count-up numbers and sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Median Response Time */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rq-muted flex justify-between items-center">
              <span>Median Response</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-rq-ink">
                {kpis.median_response_time_minutes}
              </span>
              <span className="text-xs text-rq-muted font-mono">min</span>
            </div>
          </div>
          <div className="h-10 mt-2">
            <ReactECharts
              option={getSparklineOption(kpis.sparklines.median_response_time, '#2563EB')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-[10px] text-rq-muted mt-1 flex items-center justify-between font-mono">
            <span>Target: &lt; 20m</span>
            <span className="text-emerald-700 font-bold">14.2m best</span>
          </div>
        </div>

        {/* KPI 2: Resolution Rate */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rq-muted flex justify-between items-center">
              <span>Resolution Rate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-emerald-800">
                {kpis.resolution_rate_pct}
              </span>
              <span className="text-xs text-rq-muted font-mono">%</span>
            </div>
          </div>
          <div className="h-10 mt-2">
            <ReactECharts
              option={getSparklineOption(kpis.sparklines.resolution_rate, '#2E7D5B')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-[10px] text-rq-muted mt-1 flex items-center justify-between font-mono">
            <span>{kpis.resolved_incidents} / {kpis.total_incidents} cases</span>
            <span className="text-emerald-700 font-bold">+8.4%</span>
          </div>
        </div>

        {/* KPI 3: SLA Compliance */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rq-muted flex justify-between items-center">
              <span>SLA Compliance</span>
              <Award className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-rq-brand">
                {kpis.sla_compliance_pct}
              </span>
              <span className="text-xs text-rq-muted font-mono">%</span>
            </div>
          </div>
          <div className="h-10 mt-2">
            <ReactECharts
              option={getSparklineOption(kpis.sparklines.sla_compliance, '#14284B')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-[10px] text-rq-muted mt-1 flex items-center justify-between font-mono">
            <span>Standard: 85%</span>
            <span className="text-blue-800 font-bold">Compliant</span>
          </div>
        </div>

        {/* KPI 4: Resource Utilisation */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rq-muted flex justify-between items-center">
              <span>Resource Util</span>
              <Users className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-amber-800">
                {kpis.resource_utilization_pct}
              </span>
              <span className="text-xs text-rq-muted font-mono">%</span>
            </div>
          </div>
          <div className="h-10 mt-2">
            <ReactECharts
              option={getSparklineOption(kpis.sparklines.resource_utilization, '#E27D14')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-[10px] text-rq-muted mt-1 flex items-center justify-between font-mono">
            <span>{kpis.active_teams} active squads</span>
            <span className="text-amber-800 font-bold">Optimal</span>
          </div>
        </div>

        {/* KPI 5: Open Critical */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rq-muted flex justify-between items-center">
              <span>Open Critical</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#C8201B]" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-[#C8201B]">
                {kpis.open_critical_count}
              </span>
              <span className="text-xs text-rq-muted font-mono">active</span>
            </div>
          </div>
          <div className="h-10 mt-2">
            <ReactECharts
              option={getSparklineOption(kpis.sparklines.open_critical, '#C8201B')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-[10px] text-rq-muted mt-1 flex items-center justify-between font-mono">
            <span>Critical triage</span>
            <span className="text-[#C8201B] font-bold">High Priority</span>
          </div>
        </div>
      </div>

      {/* Row 2: Response-Time Distribution Histogram & Incident Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response-Time Distribution */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Response-Time Distribution (Histogram)
            </span>
            <span className="text-[11px] font-mono text-rq-muted">
              N = {dist?.raw_response_times?.length || 0} missions
            </span>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Distribution of elapsed time between citizen 911 dispatch creation and squad on-scene arrival, plotted with 50th and 90th percentile markers.
          </p>
          <div className="h-64">
            <ReactECharts option={histogramOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Incident Funnel / Sankey */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Incident Lifecycle Funnel & Drop-off
            </span>
            <span className="text-[11px] font-mono text-rq-muted">
              Resolution: {kpis.resolution_rate_pct}%
            </span>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Sequential progression of emergency calls across control room lifecycle stages: Reported &rarr; Verified &rarr; Assigned &rarr; En Route &rarr; On Scene &rarr; Resolved.
          </p>
          <div className="h-64">
            <ReactECharts option={funnelOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap (Hour vs Ward) & Priority vs Waiting Time Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Temporal Demand Heatmap: Hour vs. Municipal Ward
            </span>
            <span className="text-[11px] font-mono text-rq-muted">24-Hour Scan</span>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Incident occurrence density across BMC administrative wards (Kurla, Dadar, Dharavi, BKC, Andheri, Colaba).
          </p>
          <div className="h-72">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Scatter: Priority vs Waiting Time */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Priority Score vs. Waiting Time (Scatter)
            </span>
            <button
              onClick={handleExportIncidents}
              className="text-[11px] font-mono text-rq-brand hover:underline flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Wait time in minutes vs. priority score ($P$). Bubble size corresponds to number of affected citizens; colors indicate severity.
          </p>
          <div className="h-72">
            <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Row 4: Resource Utilisation Over Time & Team Capability Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Area: Resource Utilisation */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Resource Utilisation Over Time (Stacked Area)
            </span>
            <span className="text-[11px] font-mono text-rq-muted">Team Types</span>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Deployment engagement percentage across specialized emergency responder categories throughout the shift.
          </p>
          <div className="h-72">
            <ReactECharts option={resourceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Team Capability Radar */}
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-rq-border">
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Team Capability Radar
            </span>
            <select
              value={activeTeam?.team_id || ''}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="text-xs font-mono bg-rq-surface2 border border-rq-border rounded px-2 py-1 text-rq-ink"
            >
              {teamsRadar.map((t: any) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.team_name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-rq-muted leading-relaxed">
            Multi-dimensional capability scoring (Water Rescue, Medical Trauma, Fire Suppression, Evacuation Speed, Logistics Capacity).
          </p>
          <div className="h-72">
            <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Row 5: SLA Gauges for Critical, High, and Medium */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-rq-border">
          <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
            SLA Response Compliance Gauges
          </span>
          <span className="text-[11px] font-mono text-rq-muted">Strict Disaster Response SLAs</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-1">
            <div className="h-40">
              <ReactECharts
                option={getGaugeOption('Critical SLA', slaGauges?.critical_compliance_pct || 100, 15, '#C8201B')}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
            <div className="text-xs font-semibold text-rq-ink">Critical Tier (&le; 15 min target)</div>
            <div className="text-[11px] text-rq-muted font-mono">
              Avg Actual: {slaGauges?.critical_actual_avg_minutes || 12.8} min
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="h-40">
              <ReactECharts
                option={getGaugeOption('High SLA', slaGauges?.high_compliance_pct || 100, 25, '#E27D14')}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
            <div className="text-xs font-semibold text-rq-ink">High Tier (&le; 25 min target)</div>
            <div className="text-[11px] text-rq-muted font-mono">
              Avg Actual: {slaGauges?.high_actual_avg_minutes || 17.3} min
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="h-40">
              <ReactECharts
                option={getGaugeOption('Medium SLA', slaGauges?.medium_compliance_pct || 100, 45, '#C9A100')}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
            <div className="text-xs font-semibold text-rq-ink">Medium Tier (&le; 45 min target)</div>
            <div className="text-[11px] text-rq-muted font-mono">
              Avg Actual: {slaGauges?.medium_actual_avg_minutes || 23.2} min
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Stock Coverage Bars Per Depot with Threshold Line & Days Supply Left */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-rq-border">
          <div>
            <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
              Depot Stock Coverage & Supply Burn-Rate Forecast
            </span>
            <p className="text-[11px] text-rq-muted mt-0.5">
              Available vs. reserved inventory with emergency replenishment threshold lines and estimated days of supply.
            </p>
          </div>
          <button
            onClick={handleExportStock}
            className="text-[11px] font-mono text-rq-brand hover:underline flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>CSV Forecast</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockCoverage.slice(0, 9).map((sc: any, idx: number) => {
            const availPct = Math.min(100, Math.round((sc.available / Math.max(1, sc.total)) * 100));
            const threshPct = Math.min(100, Math.round((sc.threshold / Math.max(1, sc.total)) * 100));
            const isLow = sc.available <= sc.threshold;

            return (
              <div key={idx} className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-rq-ink">{sc.item_name}</div>
                    <div className="text-[10px] text-rq-muted font-mono">{sc.depot_name} &bull; {sc.sku}</div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isLow ? 'bg-red-100 text-[#C8201B]' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sc.days_of_supply_left}d left
                  </span>
                </div>

                {/* Progress bar with threshold marker */}
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-rq-border">
                  <div
                    className={`h-full rounded-full ${isLow ? 'bg-[#C8201B]' : 'bg-[#14284B]'}`}
                    style={{ width: `${availPct}%` }}
                  />
                  {/* Threshold mark */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${threshPct}%` }}
                    title={`Threshold: ${sc.threshold}`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-rq-muted">
                  <span>Available: <strong className="text-rq-ink">{sc.available}</strong></span>
                  <span>Reserved: <strong>{sc.reserved}</strong></span>
                  <span>Min: <span className="text-[#C8201B] font-bold">{sc.threshold}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 7: Response Squad Leaderboard */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-rq-border">
          <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
            Field Response Squad Operational Leaderboard
          </span>
          <span className="text-[11px] font-mono text-rq-muted">Active Shifts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-rq-border text-[11px] font-mono uppercase text-rq-muted">
                <th className="py-2 px-3">Squad Name</th>
                <th className="py-2 px-3">Specialization</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Missions Completed</th>
                <th className="py-2 px-3">Average Arrival ETA</th>
                <th className="py-2 px-3">Readiness Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rq-border">
              {teamsRadar.map((t: any, idx: number) => (
                <tr key={t.team_id} className="hover:bg-rq-surface2 transition">
                  <td className="py-2.5 px-3 font-semibold text-rq-ink flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-rq-muted">
                      #{idx + 1}
                    </span>
                    <span>{t.team_name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-rq-muted">{t.team_type}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rq-ink">{t.missions_completed}</td>
                  <td className="py-2.5 px-3 font-mono text-rq-ink">{t.avg_eta_minutes} min</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-rq-border">
                        <div
                          className="bg-[#14284B] h-full rounded-full"
                          style={{ width: `${Math.min(100, t.water_rescue_score || t.medical_trauma_score || 80)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-rq-muted">98%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
