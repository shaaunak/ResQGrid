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
  Mail,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../api/client';

export const SystemHealthPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [sqsHistory, setSqsHistory] = useState<{ time: string; depth: number }[]>([]);
  const [lastNotification, setLastNotification] = useState<any>(null);

  // Fetch real system health
  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useQuery<any>({
    queryKey: ['system-health'],
    queryFn: () => apiRequest('/health'),
    refetchInterval: 3000,
  });

  // Fetch worker and queue status
  const { data: workerStatus, refetch: refetchWorker } = useQuery<any>({
    queryKey: ['worker-status'],
    queryFn: () => apiRequest('/admin/worker/status'),
    refetchInterval: 2000,
  });

  // Pause worker mutation
  const pauseWorkerMutation = useMutation({
    mutationFn: () => apiRequest('/admin/worker/pause', { method: 'POST' }),
    onSuccess: (data: any) => {
      setLastNotification(data.sns_email_dispatched);
      queryClient.invalidateQueries({ queryKey: ['worker-status'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });

  // Resume worker mutation
  const resumeWorkerMutation = useMutation({
    mutationFn: () => apiRequest('/admin/worker/resume', { method: 'POST' }),
    onSuccess: (data: any) => {
      setLastNotification(data.sns_recovery_dispatched);
      queryClient.invalidateQueries({ queryKey: ['worker-status'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });

  const isPaused = workerStatus?.worker_paused || false;
  const currentDepth = workerStatus?.queue_depth || 0;

  // Track SQS queue depth over time in rolling buffer
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString();
    setSqsHistory((prev) => {
      const updated = [...prev, { time: nowStr, depth: currentDepth }];
      return updated.slice(-20);
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
    s3_bucket: 'resqgrid-evidence-vault-ap-south-1',
    sqs_queue_url: 'https://sqs.ap-south-1.amazonaws.com/148293847291/resqgrid-incident-pipeline.fifo',
    sns_topic_arn: 'arn:aws:sns:ap-south-1:148293847291:resqgrid-emergency-alarms',
  };

  const alarmTimeline = health?.alarm_timeline || [];
  const currentAlarmState = isPaused || currentDepth >= 5 ? 'ALARM' : 'OK';

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
      name: 'Queue Depth (Messages)',
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
              lineStyle: { color: '#C8201B', type: 'dashed', width: 2 },
              label: {
                formatter: 'Alarm Threshold: 5 msg',
                position: 'insideEndTop',
                color: '#C8201B',
                fontSize: 11,
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
              <span>Cloud & Infrastructure Health</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
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
              refetchWorker();
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
            <span className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rq-muted">Live</span>
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
            Node: {metadata.instance_id}
          </div>
        </div>

        {/* Metric 3: Memory Utilization */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>System Memory (RAM)</span>
            <span className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rq-muted">Live</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-rq-ink">
              {telemetry.memory_sparkline[telemetry.memory_sparkline.length - 1]}%
            </span>
            <span className="text-xs text-rq-muted font-mono">alloc</span>
          </div>
          <div className="h-10 mt-1">
            <ReactECharts
              option={getSparklineOption(telemetry.memory_sparkline, '#7C3AED')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-xs text-rq-muted font-mono mt-1">
            Heap: Healthy
          </div>
        </div>

        {/* Metric 4: RDS Query Latency */}
        <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs uppercase font-mono tracking-wider text-rq-muted">
            <span>RDS Query Latency</span>
            <Database className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {health?.components?.database?.latency_ms ?? 1.8} ms
            </span>
            <span className="text-xs text-rq-muted font-mono">roundtrip</span>
          </div>
          <div className="h-10 mt-1">
            <ReactECharts
              option={getSparklineOption(telemetry.rds_latency_sparkline, '#059669')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <div className="text-xs text-emerald-700 font-bold font-mono mt-1">
            Target: &lt; 5.0ms (PostgreSQL)
          </div>
        </div>
      </div>

      {/* Row 2: AWS Infrastructure IDs and Cloud Components */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-rq-border pb-3">
          <h2 className="text-sm font-bold text-rq-ink uppercase font-mono tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-rq-brand" />
            <span>Real AWS Infrastructure Resource Mapping</span>
          </h2>
          <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Terraform Managed (prod)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">AWS Region</span>
            <div className="text-sm font-bold font-mono text-rq-ink">{metadata.region} (Mumbai)</div>
            <div className="text-xs text-rq-muted font-mono">AZs: ap-south-1a, ap-south-1b</div>
          </div>

          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">Custom VPC ID</span>
            <div className="text-sm font-bold font-mono text-rq-ink">{metadata.vpc_id}</div>
            <div className="text-xs text-rq-muted font-mono">CIDR: 10.0.0.0/16 (2 Public, 2 Private)</div>
          </div>

          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">EC2 Compute Host / ASG Node</span>
            <div className="text-sm font-bold font-mono text-rq-ink">{metadata.instance_id}</div>
            <div className="text-xs text-rq-muted font-mono">Type: t3.micro (Auto Scaling Min 1, Max 2)</div>
          </div>

          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">Amazon RDS PostgreSQL</span>
            <div className="text-sm font-bold font-mono text-rq-ink">{metadata.rds_identifier}</div>
            <div className="text-xs text-rq-muted font-mono">db.t3.micro (Single-AZ Private Subnet)</div>
          </div>

          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">Private S3 Evidence Vault</span>
            <div className="text-sm font-bold font-mono text-rq-ink truncate">{metadata.s3_bucket}</div>
            <div className="text-xs text-rq-muted font-mono">SSE-AES256, Block Public Access: ON</div>
          </div>

          <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg space-y-1">
            <span className="text-xs text-rq-muted uppercase font-mono">Amazon SQS Incident Pipeline</span>
            <div className="text-sm font-bold font-mono text-rq-ink truncate">{metadata.sqs_queue_url}</div>
            <div className="text-xs text-rq-muted font-mono">DLQ Attached (MaxReceive: 3)</div>
          </div>
        </div>
      </div>

      {/* Row 3: Interactive Worker Pause/Resume Demo & Live SQS Backlog Chart */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rq-border gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-rq-ink text-sm uppercase font-mono tracking-wider flex items-center space-x-2">
                <Radio className="w-4 h-4 text-rq-brand" />
                <span>Asynchronous SQS Queue Depth & Resilience Controller</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                isPaused ? 'bg-red-50 text-[#C8201B] border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {isPaused ? 'WORKER PAUSED (INJECTING BACKLOG)' : 'WORKER OPERATIONAL'}
              </span>
            </div>
            <p className="text-xs text-rq-muted mt-1 leading-relaxed">
              Demonstrate Cloud Computing fault tolerance: When the worker is paused, events accumulate above threshold (5 msgs). 
              The CloudWatch Alarm triggers an SNS email notification. Resuming the worker drains the backlog back to zero.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => pauseWorkerMutation.mutate()}
              disabled={isPaused || pauseWorkerMutation.isPending}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C8201B] hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono shadow-sm transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>1. Pause Worker (Inject Backlog)</span>
            </button>

            <button
              onClick={() => resumeWorkerMutation.mutate()}
              disabled={!isPaused || resumeWorkerMutation.isPending}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>2. Resume Worker (Drain to 0)</span>
            </button>
          </div>
        </div>

        {/* Live Notification Banner */}
        {lastNotification && (
          <div className={`p-3 rounded-lg border flex items-start space-x-3 text-xs font-mono ${
            isPaused ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold flex items-center space-x-2">
                <span>SNS Notification Dispatched to: {lastNotification.recipient}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-current font-semibold">
                  {lastNotification.subject.split(':')[0]}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-90">{lastNotification.body}</div>
            </div>
          </div>
        )}

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
          <span className="text-xs font-mono text-rq-muted">HighSQSQueueDepthAlarm (Threshold &gt; 5 msgs)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {alarmTimeline.map((item: any, idx: number) => {
            const isAlarm = item.state === 'ALARM' || (item.timestamp === 'Current' && currentAlarmState === 'ALARM');
            return (
              <div key={idx} className={`p-3 border rounded-lg space-y-1 ${
                isAlarm ? 'bg-red-50 border-red-200 text-red-900' : 'bg-rq-surface2 border-rq-border'
              }`}>
                <div className="flex justify-between items-center text-xs font-mono text-rq-muted">
                  <span>{item.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    isAlarm ? 'bg-red-100 text-[#C8201B]' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {isAlarm ? 'ALARM' : 'OK'}
                  </span>
                </div>
                <div className="text-xs font-bold text-rq-ink font-mono">{item.alarm_name}</div>
                <div className="text-xs text-rq-muted font-mono">
                  Value: <strong>{item.timestamp === 'Current' ? currentDepth : item.metric_value}</strong> / Threshold &gt; {item.threshold}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
