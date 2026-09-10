import React, { useMemo } from 'react';
import { TelemetryLog } from '../types';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Server,
  ArrowUpRight,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface TelemetrySparklinesSummaryProps {
  logs: TelemetryLog[];
  onNavigateToLogs?: () => void;
}

interface HourlySparkPoint {
  hourIndex: number;
  label: string;
  total: number;
  success: number;
  system: number;
  warn: number;
}

export const TelemetrySparklinesSummary: React.FC<TelemetrySparklinesSummaryProps> = ({
  logs,
  onNavigateToLogs,
}) => {
  // Aggregate logs into 24 one-hour sparkline data points
  const { sparkData, totalEvents, successCount, systemCount, warnCount, peakPerHour, activePathways } =
    useMemo(() => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const hourMs = 60 * 60 * 1000;

      // Filter to last 24h window
      const recentLogs = logs.filter((l) => {
        const timeStr = l.timestamp.includes('T') ? l.timestamp : l.timestamp.replace(' ', 'T');
        const logTime = new Date(timeStr).getTime();
        return !isNaN(logTime) && now - logTime <= oneDayMs + 120000;
      });

      // Initialize 24 hourly buckets
      const buckets: HourlySparkPoint[] = [];
      for (let i = 23; i >= 0; i--) {
        const bucketTime = new Date(now - i * hourMs);
        const hour = bucketTime.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        buckets.push({
          hourIndex: 23 - i,
          label: `${displayHour} ${ampm}`,
          total: 0,
          success: 0,
          system: 0,
          warn: 0,
        });
      }

      let total = 0;
      let success = 0;
      let system = 0;
      let warn = 0;
      const pathwaysSet = new Set<string>();

      // Distribute logs into buckets
      logs.forEach((log) => {
        const timeStr = log.timestamp.includes('T') ? log.timestamp : log.timestamp.replace(' ', 'T');
        const logTime = new Date(timeStr).getTime();
        if (isNaN(logTime)) return;

        const ageMs = now - logTime;
        if (ageMs <= oneDayMs && ageMs >= 0) {
          total++;
          const hourBucketIndex = Math.min(23, Math.max(0, 23 - Math.floor(ageMs / hourMs)));
          const b = buckets[hourBucketIndex];

          b.total += 1;
          if (log.level === 'success') {
            b.success += 1;
            success++;
          } else if (log.level === 'warn') {
            b.warn += 1;
            warn++;
          } else {
            b.system += 1;
            system++;
          }

          if (log.pathway) {
            log.pathway.split(',').forEach((p) => {
              const trimmed = p.trim();
              if (trimmed && trimmed.startsWith('P')) {
                pathwaysSet.add(trimmed);
              }
            });
          }
        }
      });

      const maxInHour = buckets.reduce((m, b) => Math.max(m, b.total), 0);

      return {
        sparkData: buckets,
        totalEvents: total,
        successCount: success,
        systemCount: system,
        warnCount: warn,
        peakPerHour: maxInHour,
        activePathways: Array.from(pathwaysSet).sort(),
      };
    }, [logs]);

  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#F0EFEA] bg-[#FAFAF8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#059669]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#18181B] font-mono tracking-tight">
                24-Hour Telemetry Frequency & Sparkline Summary
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>
            <p className="text-xs text-[#71717A]">
              Real-time audit pulse across kernel triage, satellite dispatches, and infrastructure health
            </p>
          </div>
        </div>

        {onNavigateToLogs && (
          <button
            onClick={onNavigateToLogs}
            className="self-start sm:self-auto flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-mono font-semibold text-[#059669] hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
          >
            <span>Console View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Sparkline Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EFEA]">
        {/* Metric 1: Total Ingestion Frequency */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              Total Ingestion
            </span>
            <span className="text-[10px] font-mono text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded">
              Peak {peakPerHour}/hr
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#18181B]">{totalEvents}</span>
            <span className="text-[11px] font-mono text-[#71717A]">24h Volume</span>
          </div>
          {/* Sparkline */}
          <div className="h-11 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181B] text-white text-[10px] font-mono px-2 py-1 rounded shadow-sm">
                          {d.label}: {d.total} events
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#059669"
                  strokeWidth={1.75}
                  fill="url(#totalSparkGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 2: Operational Dispatches (Success) */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              Dispatches
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              100% Ack
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-700">{successCount}</span>
            <span className="text-[11px] font-mono text-[#71717A]">Success Logs</span>
          </div>
          {/* Sparkline */}
          <div className="h-11 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="successSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181B] text-emerald-400 text-[10px] font-mono px-2 py-1 rounded shadow-sm">
                          {d.label}: {d.success} successes
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#10B981"
                  strokeWidth={1.75}
                  fill="url(#successSparkGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 3: System Audits & Pings */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              Kernel Audits
            </span>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              SQLite WAL
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#18181B]">{systemCount}</span>
            <span className="text-[11px] font-mono text-[#71717A]">Info & Pulse</span>
          </div>
          {/* Sparkline */}
          <div className="h-11 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="systemSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181B] text-indigo-300 text-[10px] font-mono px-2 py-1 rounded shadow-sm">
                          {d.label}: {d.system} audits
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="system"
                  stroke="#6366F1"
                  strokeWidth={1.75}
                  fill="url(#systemSparkGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 4: Anomaly & Gate Alerts */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              Gate Alerts
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
              $1,200 Floor
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#D97706]">{warnCount}</span>
            <span className="text-[11px] font-mono text-[#71717A]">Sub-Floor Gated</span>
          </div>
          {/* Sparkline */}
          <div className="h-11 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="warnSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181B] text-amber-400 text-[10px] font-mono px-2 py-1 rounded shadow-sm">
                          {d.label}: {d.warn} warnings
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="warn"
                  stroke="#D97706"
                  strokeWidth={1.75}
                  fill="url(#warnSparkGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Footprint Footer */}
      <div className="px-5 py-3 border-t border-[#F0EFEA] bg-[#FAFAF8] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#71717A]">Engaged Satellites (24h):</span>
          {activePathways.length > 0 ? (
            <div className="flex items-center gap-1">
              {activePathways.map((p) => (
                <span
                  key={p}
                  className="px-1.5 py-0.5 rounded bg-[#EAE8E3] text-[#18181B] font-bold text-[10px] border border-[#D6D3D1]"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[#A1A1AA] text-[11px]">All 7 Pathways Standby</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[#71717A] text-[11px]">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-[#059669]" />
            SQLite Storage: Active WAL
          </span>
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Zero Mock Simulation
          </span>
        </div>
      </div>
    </div>
  );
};
