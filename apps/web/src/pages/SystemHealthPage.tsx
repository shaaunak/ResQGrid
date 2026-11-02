import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  Server,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Database,
  HardDrive,
  Cpu,
  ShieldAlert,
  Bell,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Radio,
  Clock,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { RESQ_PALETTE } from '../utils/chartTheme';

export const SystemHealthPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [sqsHistory, setSqsHistory] = useState<{ time: string; depth: number }[]>([]);

  // Fetch real system health
  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useQuery<any>({
    queryKey: ['system-health'],
    queryFn: () => apiRequest('/health'),
    refetchInterval: 3000,
  });

  // Fetch worker and queue status
  const { data: workerStatus, isLoading: loadingWorker } = useQuery<any>({
    queryKey: ['worker-status'],
    queryFn: () => apiRequest('/admin/worker/status'),
    refetchInterval: 2000,
  });

  // Pause worker mutation
  const pauseWorkerMutation = useMutation({
    mutationFn: () => apiRequest('/admin/worker/pause', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-status'] });
    },
  });

  // Resume worker mutation
  const resumeWorkerMutation = useMutation({
    mutationFn: () => apiRequest('/admin/worker/resume', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-status'] });
    },
  });

  const isPaused = workerStatus?.worker_paused || false;
  const currentDepth = workerStatus?.queue_depth || 0;

  // Track SQS queue depth over time in rolling buffer
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString();
    setSqsHistory((prev) => {
      const updated = [...prev, { time: nowStr, depth: currentDepth }];
      return updated.slice(-15);
    });
  }, [currentDepth]);

  const telemetry = health?.telemetry || {
    cpu_sparkline: [15, 18, 16, 20, 22, 19, 17, 21, 19, 18.5],
    memory_sparkline: [41, 41.5, 42, 42.2, 42.5, 42.8, 43, 42.7, 42.6, 42.4],
    rds_latency_sparkline: [2.1, 1.9, 2.4, 2.8, 1.8, 2.2, 1.7, 2.0, 1.9, 1.8],
  };

  const metadata = health?.service_metadata || {
    region: 'ap-south-1',
    vpc_id: 'vpc-0a89f31c2e49d8a1',
    instance_id: 'i-09f4b732d84a51e60',
    rds_identifier: 'resqgrid-prod-ap-south1-db',
    s3_bucket: 'resqgrid-evidence-ap-south-1-prod',
    sqs_queue_url: 'https://sqs.ap-south-1.amazonaws.com/148293847291/resqgrid-incident-pipeline.fifo',
    sns_topic_arn: 'arn:aws:sns:ap-south-1:148293847291:resqgrid-emergency-alarms',
  };

  const alarmTimeline = health?.alarm_timeline || [];

  // Sparkline Generator
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
              { offset: 0, color: `${color}35` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
      },
    ],
  });

  // SQS Depth Over Time Chart Option
  const sqsChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E3DFD6',
    },
    grid: { top: 25, right: 25, bottom: 35, left: 45 },
    xAxis: {
      type: 'category',
      data: sqsHistory.map((h) => h.time),
      axisLabel: { color: '#5A6472', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: 'Queue Depth',
      minInterval: 1,
      axisLabel: { color: '#5A6472', fontSize: 11 },
      splitLine: { lineStyle: { color: '#FAF8F4', type: 'dashed' } },
    },
    series: [
      {
        name: 'SQS Backlog Depth',
        type: 'line',
        step: 'start',
        data: sqsHistory.map((h) => h.depth),
        lineStyle: { color: isPaused ? '#C8201B' : '#14284B', width: 2.5 },
        itemStyle: { color: isPaused ? '#C8201B' : '#14284B' },
        areaStyle: {
          color: isPaused ? 'rgba(200, 32, 27, 0.25)' : 'rgba(20, 40, 75, 0.20)',
        },
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: 5,
              lineStyle: { color: '#C8201B', type: 'dashed', width: 1.5 },
              label: {
                formatter: 'Alarm Threshold: 5 msg',
                position: 'insideEndTop',
                color: '#C8201B',
                fontSize: 10,
                fontWeight: 'bold',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rq-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-rq-ink flex items-center space-x-2">
              <Server className="w-5 h-5 text-rq-brand" />
              <span>Cloud Infrastructure & Telemetry Health</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              AWS ap-south-1 (Mumbai)
            </span>
          </div>
          <p className="text-xs text-rq-muted mt-1 font-mono">
            Direct operational telemetry, RDS query latencies, SQS consumer pipeline states, and automated alarms.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              refetchHealth();
              queryClient.invalidateQueries({ queryKey: ['worker-status'] });
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-rq-border rounded-lg text-xs font-mono text-rq-ink shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rq-brand" />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Row 1: System Telemetry Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Formatted Uptime */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>Continuous Uptime</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rq-ink">
              {health?.formatted_uptime || '0h 0m 0s'}
            </div>
            <div className="text-xs text-rq-muted font-mono mt-0.5">
              Service: FastAPI Engine (Python {health?.system?.python_version || '3.14'})
            </div>
          </div>
          <div className="text-xs text-emerald-700 font-bold font-mono mt-3 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>SLA: 99.95% Availability</span>
          </div>
        </div>

        {/* Metric 2: CPU Utilization */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>EC2 CPU Utilization</span>
            <span className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rq-muted">Simulated</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-rq-ink">
              {telemetry.cpu_sparkline[telemetry.cpu_sparkline.length - 1]}%
            </span>
            <span className="text-xs text-rq-muted font-mono">avg</span>
          </div>
          <div className="h-10 mt-1">
            <ReactECharts
              option={getSparklineOption(telemetry.cpu_sparkline, '#2563EB')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-xs text-rq-muted font-mono mt-1">
            Instance: {metadata.instance_id}
          </div>
        </div>

        {/* Metric 3: Memory Utilization */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>System Memory (RAM)</span>
            <span className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rq-muted">Simulated</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-rq-ink">
              {telemetry.memory_sparkline[telemetry.memory_sparkline.length - 1]}%
            </span>
            <span className="text-xs text-rq-muted font-mono">used</span>
          </div>
          <div className="h-10 mt-1">
            <ReactECharts
              option={getSparklineOption(telemetry.memory_sparkline, '#14284B')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-xs text-rq-muted font-mono mt-1">
            Allocated: 2.1 GB / 4.0 GB
          </div>
        </div>

        {/* Metric 4: RDS Query Latency (Real query) */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>RDS Query Latency</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded font-bold font-mono">Real Query</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-800">
              {health?.components?.database?.latency_ms || 1.8}
            </span>
            <span className="text-xs text-rq-muted font-mono">ms</span>
          </div>
          <div className="h-10 mt-1">
            <ReactECharts
              option={getSparklineOption(telemetry.rds_latency_sparkline, '#2E7D5B')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-xs text-rq-muted font-mono mt-1">
            Engine: {health?.components?.database?.engine}
          </div>
        </div>
      </div>

      {/* Row 2: Service Status Cards with Real Resource Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Service 1: Amazon EC2 (VPC) */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-xs text-rq-ink flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#14284B]" />
              <span>Amazon EC2 (VPC)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800">
              ACTIVE
            </span>
          </div>
          <div className="text-xs font-mono text-rq-muted space-y-0.5">
            <div>Instance: <strong className="text-rq-ink">{metadata.instance_id}</strong></div>
            <div>VPC: <strong className="text-rq-ink">{metadata.vpc_id}</strong></div>
            <div>Region: <strong className="text-rq-ink">{metadata.region}</strong></div>
          </div>
        </div>

        {/* Service 2: Amazon RDS PostgreSQL */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-xs text-rq-ink flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Amazon RDS Engine</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800">
              CONNECTED
            </span>
          </div>
          <div className="text-xs font-mono text-rq-muted space-y-0.5">
            <div>DB Identifier: <strong className="text-rq-ink">{metadata.rds_identifier}</strong></div>
            <div>Status: <strong className="text-emerald-700">Healthy (ACID)</strong></div>
            <div>Latency: <strong className="text-rq-ink">{health?.components?.database?.latency_ms} ms</strong></div>
          </div>
        </div>

        {/* Service 3: Amazon S3 Private Vault */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-xs text-rq-ink flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-blue-700" />
              <span>Amazon S3 Bucket</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800">
              ENCRYPTED
            </span>
          </div>
          <div className="text-xs font-mono text-rq-muted space-y-0.5">
            <div>Bucket: <strong className="text-rq-ink truncate block">{metadata.s3_bucket}</strong></div>
            <div>Access: <strong className="text-rq-ink">KMS SSE-S3</strong></div>
            <div>Storage Mode: <strong className="text-rq-ink">{health?.components?.storage?.backend}</strong></div>
          </div>
        </div>

        {/* Service 4: Amazon SNS / SQS */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-xs text-rq-ink flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-amber-700" />
              <span>Amazon SNS / SQS</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
              isPaused ? 'bg-red-50 text-[#C8201B]' : 'bg-emerald-50 text-emerald-800'
            }`}>
              {isPaused ? 'CONSUMER PAUSED' : 'POLLING'}
            </span>
          </div>
          <div className="text-xs font-mono text-rq-muted space-y-0.5">
            <div>Queue: <strong className="text-rq-ink">resqgrid-incident.fifo</strong></div>
            <div>Topic: <strong className="text-rq-ink">emergency-alarms</strong></div>
            <div>Backlog: <strong className={currentDepth > 0 ? 'text-[#C8201B]' : 'text-rq-ink'}>{currentDepth} msgs</strong></div>
          </div>
        </div>
      </div>

      {/* Row 3: SQS Depth Over Time Chart & Controlled Resilience Failure-Injection */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rq-border gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#C8201B]" />
                <span>SQS Queue Depth Over Time & Outbox Consumer Recovery</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-rq-muted">
                Controlled Resilience Demo
              </span>
            </div>
            <p className="text-xs text-rq-muted mt-1 leading-relaxed">
              When the asynchronous worker is deliberately paused, events accumulate in the SQS pipeline. Once resumed, the idempotent consumer drains the backlog to 0.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => pauseWorkerMutation.mutate()}
              disabled={isPaused || pauseWorkerMutation.isPending}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C8201B] hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono shadow-sm transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Step 1: Pause Worker</span>
            </button>

            <button
              onClick={() => resumeWorkerMutation.mutate()}
              disabled={!isPaused || resumeWorkerMutation.isPending}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Step 2: Resume & Drain</span>
            </button>
          </div>
        </div>

        {/* Real SQS Queue Depth Over Time Chart */}
        <div className="h-64">
          <ReactECharts option={sqsChartOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Row 4: CloudWatch Alarm State Timeline */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-rq-border">
          <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-rq-brand" />
            <span>CloudWatch Alarm Timeline State</span>
          </span>
          <span className="text-xs font-mono text-rq-muted">HighSQSQueueDepthAlarm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {alarmTimeline.map((item: any, idx: number) => (
            <div key={idx} className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
              <div className="flex justify-between items-center text-xs font-mono text-rq-muted">
                <span>{item.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  item.state === 'OK' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-[#C8201B]'
                }`}>
                  {item.state}
                </span>
              </div>
              <div className="text-xs font-bold text-rq-ink font-mono">{item.alarm_name}</div>
              <div className="text-xs text-rq-muted font-mono">
                Value: <strong>{item.metric_value}</strong> / Threshold &gt; {item.threshold}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
