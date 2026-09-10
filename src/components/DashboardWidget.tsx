import React, { useMemo, useState } from 'react';
import { TelemetryLog } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart2,
  LineChart,
} from 'lucide-react';

export interface DashboardWidgetProps {
  logs: TelemetryLog[];
  className?: string;
  onNavigateToLogs?: () => void;
}

interface HourlyBucket {
  hourKey: string;
  label: string;
  fullTime: string;
  total: number;
  info: number;
  warn: number;
  success: number;
  system: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: HourlyBucket = payload[0].payload;
    return (
      <div className="rounded-lg border border-[#E7E5E4] bg-white p-3 shadow-md text-xs font-mono">
        <div className="text-[11px] text-[#71717A] border-b border-[#F4F4F0] pb-1 mb-2 font-medium flex items-center justify-between gap-3">
          <span>{data.hourKey}:00</span>
          <span className="text-[#18181B] font-semibold">{data.label}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#18181B] font-medium">Total Events</span>
            <span className="font-bold text-[#059669]">{data.total}</span>
          </div>
          {data.warn > 0 && (
            <div className="flex items-center justify-between gap-4 text-amber-700">
              <span>Warnings</span>
              <span className="font-semibold">{data.warn}</span>
            </div>
          )}
          {data.info > 0 && (
            <div className="flex items-center justify-between gap-4 text-blue-700">
              <span>Info</span>
              <span>{data.info}</span>
            </div>
          )}
          {data.success > 0 && (
            <div className="flex items-center justify-between gap-4 text-emerald-700">
              <span>Success</span>
              <span>{data.success}</span>
            </div>
          )}
          {data.system > 0 && (
            <div className="flex items-center justify-between gap-4 text-neutral-600">
              <span>System</span>
              <span>{data.system}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  logs,
  className = '',
  onNavigateToLogs,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Compute 24-hour histogram from existing logs array
  const { chartData, total24h, peakHourly, warnCount, latestTimestamp } = useMemo(() => {
    // Determine the reference time
    const latestLogTime = logs.reduce((max, log) => {
      const timeMs = new Date(
        log.timestamp.includes('T') ? log.timestamp : log.timestamp.replace(' ', 'T')
      ).getTime();
      return !isNaN(timeMs) && timeMs > max ? timeMs : max;
    }, Date.now());

    // Anchor to current hour of reference
    const referenceEnd = new Date(Math.max(Date.now(), latestLogTime));
    const buckets: HourlyBucket[] = [];

    for (let i = 23; i >= 0; i--) {
      const bucketDate = new Date(referenceEnd.getTime() - i * 60 * 60 * 1000);
      const hour = bucketDate.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const label = `${displayHour}${ampm}`;
      const hourKey = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}-${String(bucketDate.getDate()).padStart(2, '0')} ${String(hour).padStart(2, '0')}`;

      buckets.push({
        hourKey,
        label,
        fullTime: `${label}`,
        total: 0,
        info: 0,
        warn: 0,
        success: 0,
        system: 0,
      });
    }

    let totalEventsInWindow = 0;
    let warningsInWindow = 0;

    // Distribute logs into matching hour bucket
    logs.forEach((log) => {
      const parsed = new Date(
        log.timestamp.includes('T') ? log.timestamp : log.timestamp.replace(' ', 'T')
      );
      if (isNaN(parsed.getTime())) return;

      const logHourKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')} ${String(parsed.getHours()).padStart(2, '0')}`;

      const target = buckets.find((b) => b.hourKey === logHourKey);
      if (target) {
        target.total += 1;
        totalEventsInWindow += 1;
        if (log.level === 'warn') {
          target.warn += 1;
          warningsInWindow += 1;
        } else if (log.level === 'info') {
          target.info += 1;
        } else if (log.level === 'success') {
          target.success += 1;
        } else if (log.level === 'system') {
          target.system += 1;
        }
      }
    });

    const peak = Math.max(...buckets.map((b) => b.total), 1);
    const lastLog = logs[0]?.timestamp || new Date().toISOString().substring(11, 19);

    return {
      chartData: buckets,
      total24h: totalEventsInWindow,
      peakHourly: peak,
      warnCount: warningsInWindow,
      latestTimestamp: lastLog,
    };
  }, [logs]);

  return (
    <div
      id="dashboard-telemetry-widget"
      className={`rounded-xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden ${className}`}
    >
      {/* Widget Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#E7E5E4] bg-[#FBFBF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#18181B] font-mono tracking-tight">
                24H TELEMETRY FREQUENCY
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Event frequency distribution across 24 hourly buckets
            </p>
          </div>
        </div>

        {/* Action Controls & Chart View Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-md border border-[#E7E5E4] bg-white p-0.5 text-xs font-mono">
            <button
              id="widget-chart-toggle-area"
              onClick={() => setChartType('area')}
              title="Area View"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#18181B] text-white font-medium'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <LineChart className="w-3 h-3" />
              <span>Area</span>
            </button>
            <button
              id="widget-chart-toggle-bar"
              onClick={() => setChartType('bar')}
              title="Bar View"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#18181B] text-white font-medium'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Bar</span>
            </button>
          </div>

          {onNavigateToLogs && (
            <button
              id="widget-view-all-logs-btn"
              onClick={onNavigateToLogs}
              className="px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-mono text-[#18181B] transition-colors cursor-pointer"
            >
              Console &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#F0EFEA] bg-white divide-x divide-y sm:divide-y-0 divide-[#F0EFEA]">
        <div className="p-3 sm:px-4 sm:py-3">
          <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
            24H VOLUME
          </span>
          <div className="mt-1 text-lg sm:text-xl font-extrabold text-[#18181B] font-mono">
            {total24h} <span className="text-xs font-normal text-[#71717A]">events</span>
          </div>
        </div>

        <div className="p-3 sm:px-4 sm:py-3">
          <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#059669]" />
            PEAK RATE
          </span>
          <div className="mt-1 text-lg sm:text-xl font-extrabold text-[#059669] font-mono">
            {peakHourly} <span className="text-xs font-normal text-[#71717A]">/hr</span>
          </div>
        </div>

        <div className="p-3 sm:px-4 sm:py-3">
          <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#D97706]" />
            WARNINGS
          </span>
          <div className="mt-1 text-lg sm:text-xl font-extrabold text-[#D97706] font-mono">
            {warnCount}
          </div>
        </div>

        <div className="p-3 sm:px-4 sm:py-3">
          <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#71717A]" />
            LATEST SYNC
          </span>
          <div className="mt-1 text-xs sm:text-sm font-semibold text-[#18181B] font-mono truncate">
            {latestTimestamp}
          </div>
        </div>
      </div>

      {/* Recharts Visualization Container */}
      <div className="p-4 sm:p-5 bg-white">
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F0EFEA"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#A1A1AA"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#A1A1AA"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontFamily="monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Events"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#telemetryGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F0EFEA"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#A1A1AA"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#A1A1AA"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontFamily="monospace"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total"
                  name="Events"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
