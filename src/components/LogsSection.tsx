import React, { useState, useEffect, useRef } from 'react';
import { TelemetryLog, DownloadScheduleConfig } from '../types';
import { DashboardWidget } from './DashboardWidget';
import { DownloadScheduleModal } from './DownloadScheduleModal';
import { ExportPreviewModal } from './ExportPreviewModal';
import { exportLogsToCSV } from '../utils/csvExport';
import {
  Activity,
  Terminal,
  Search,
  Trash2,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Download,
  Check,
  X,
  CalendarClock,
} from 'lucide-react';

interface LogsSectionProps {
  logs: TelemetryLog[];
  onClearLogs: () => void;
  onAddLog: (log: TelemetryLog) => void;
}

const DEFAULT_SCHEDULE_CONFIG: DownloadScheduleConfig = {
  enabled: false,
  intervalMinutes: 5,
  filterScope: 'all',
  prefix: 'growthengine_telemetry',
  lastRunAt: null,
  nextRunAt: null,
  totalExportsCount: 0,
  notifyInLogs: true,
};

export const LogsSection: React.FC<LogsSectionProps> = ({
  logs,
  onClearLogs,
  onAddLog,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [hasExported, setHasExported] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Download schedule state
  const [scheduleConfig, setScheduleConfig] = useState<DownloadScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem('growthengine_download_schedule');
      if (saved) {
        return { ...DEFAULT_SCHEDULE_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SCHEDULE_CONFIG;
  });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  // Sync with backend SQLite download schedule on mount
  useEffect(() => {
    fetch('/api/logs/schedule')
      .then((res) => res.json())
      .then((data) => {
        if (data.schedule) {
          setScheduleConfig(data.schedule);
        }
      })
      .catch((err) => console.error('Failed to fetch server schedule:', err));
  }, []);

  // References to prevent stale closure inside the interval timer
  const logsRef = useRef(logs);
  logsRef.current = logs;
  const filteredLogsRef = useRef<TelemetryLog[]>([]);
  const scheduleConfigRef = useRef(scheduleConfig);
  scheduleConfigRef.current = scheduleConfig;
  const onAddLogRef = useRef(onAddLog);
  onAddLogRef.current = onAddLog;
  const nextRunTargetMsRef = useRef<number | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterLevel === 'ALL' || log.level.toUpperCase() === filterLevel;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesFilter;

    const matchesSearch =
      log.message.toLowerCase().includes(query) ||
      log.timestamp.toLowerCase().includes(query) ||
      log.traceId.toLowerCase().includes(query) ||
      (log.pathway ? log.pathway.toLowerCase().includes(query) : false);

    return matchesFilter && matchesSearch;
  });
  filteredLogsRef.current = filteredLogs;

  const handleExportCSV = () => {
    const targetLogs = filteredLogs.length > 0 ? filteredLogs : logs;
    if (targetLogs.length === 0) return;
    setIsPreviewModalOpen(true);
  };

  const handleConfirmExport = () => {
    const targetLogs = filteredLogs.length > 0 ? filteredLogs : logs;
    if (targetLogs.length === 0) return;

    try {
      exportLogsToCSV(targetLogs, scheduleConfig.prefix);
      setHasExported(true);
      setTimeout(() => setHasExported(false), 2000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getFilterSummary = () => {
    const parts: string[] = [];
    if (filterLevel !== 'ALL') parts.push(`Level: ${filterLevel}`);
    if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
    return parts.length > 0 ? parts.join(' • ') : 'All Log Levels';
  };

  // Automated scheduled export execution
  const executeScheduledExport = () => {
    const currentConfig = scheduleConfigRef.current;
    let targetLogs = logsRef.current;

    if (currentConfig.filterScope === 'filtered') {
      targetLogs = filteredLogsRef.current.length > 0 ? filteredLogsRef.current : logsRef.current;
    } else if (currentConfig.filterScope === 'warnings_only') {
      targetLogs = logsRef.current.filter((l) => l.level === 'warn');
    }

    if (targetLogs.length === 0) return;

    try {
      const res = exportLogsToCSV(targetLogs, currentConfig.prefix);
      const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (currentConfig.notifyInLogs) {
        onAddLogRef.current({
          id: `log-sched-${Date.now()}`,
          timestamp: nowIso,
          level: 'system',
          message: `Automated scheduled CSV export dispatched (${res.recordCount} records, ${(res.byteSize / 1024).toFixed(1)} KB) - ${res.filename}`,
          traceId: `SYS-SCHED-${Math.floor(1000 + Math.random() * 9000)}`,
          pathway: 'System Automation',
        });
      }

      setScheduleConfig((prev) => {
        const updated: DownloadScheduleConfig = {
          ...prev,
          lastRunAt: nowIso,
          totalExportsCount: prev.totalExportsCount + 1,
        };
        try {
          localStorage.setItem('growthengine_download_schedule', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (err) {
      console.error('Scheduled export error:', err);
    }
  };

  // Timer effect for recurring automated exports
  useEffect(() => {
    if (!scheduleConfig.enabled) {
      setTimeRemainingSeconds(null);
      nextRunTargetMsRef.current = null;
      return;
    }

    const intervalMs = scheduleConfig.intervalMinutes * 60 * 1000;
    nextRunTargetMsRef.current = Date.now() + intervalMs;
    setTimeRemainingSeconds(Math.round(intervalMs / 1000));

    const timer = setInterval(() => {
      if (!nextRunTargetMsRef.current) return;
      const now = Date.now();
      const diffSeconds = Math.round((nextRunTargetMsRef.current - now) / 1000);

      if (diffSeconds <= 0) {
        executeScheduledExport();
        nextRunTargetMsRef.current = Date.now() + intervalMs;
        setTimeRemainingSeconds(Math.round(intervalMs / 1000));
      } else {
        setTimeRemainingSeconds(diffSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduleConfig.enabled, scheduleConfig.intervalMinutes]);

  const handleUpdateScheduleConfig = async (newConfig: DownloadScheduleConfig) => {
    setScheduleConfig(newConfig);
    try {
      localStorage.setItem('growthengine_download_schedule', JSON.stringify(newConfig));
      const res = await fetch('/api/logs/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          setScheduleConfig(data.schedule);
        }
      }
    } catch (err) {
      console.error('Failed to sync schedule config to server:', err);
    }
  };

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSimulateHeartbeat = async () => {
    try {
      const res = await fetch('/api/logs/heartbeat', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          onAddLog(data.log);
        }
      }
    } catch (err) {
      console.error('Heartbeat request failed:', err);
    }
  };

  return (
    <div className="space-y-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#EAE8E3] text-[#52525B]">
          SYSTEM LOGS
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
          Operational Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
          Real-time dispatch and infrastructure event stream.
        </p>
      </div>

      {/* 24h Telemetry Frequency Widget */}
      <DashboardWidget logs={logs} />

      {/* Main Console Box */}
      <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden">
        {/* Console Top Toolbar */}
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FBFBF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase font-bold text-[#18181B] tracking-wider">
              EVENT STREAM
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isStreaming ? 'animate-pulse' : ''}`} />
              <span>{isStreaming ? 'ACTIVE' : 'PAUSED'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="logs-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages or timestamps..."
                aria-label="Filter logs by message or timestamp"
                className="w-full pl-8 pr-7 py-1 rounded-md border border-[#E7E5E4] bg-white text-xs font-mono text-[#18181B] placeholder:text-[#A1A1AA] placeholder:font-sans focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
              />
              {searchQuery && (
                <button
                  id="logs-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Export CSV button */}
            <button
              id="logs-export-csv-btn"
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              title="Download current telemetry log history as CSV"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-mono text-[#18181B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasExported ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-[#059669] font-medium">Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#52525B]" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            {/* Download Schedule button */}
            <button
              id="logs-download-schedule-btn"
              onClick={() => setIsScheduleModalOpen(true)}
              title="Set up recurring automated CSV exports of telemetry logs"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
                scheduleConfig.enabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                  : 'border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-[#18181B]'
              }`}
            >
              <CalendarClock
                className={`w-3.5 h-3.5 ${
                  scheduleConfig.enabled ? 'text-[#059669]' : 'text-[#52525B]'
                }`}
              />
              {scheduleConfig.enabled ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Schedule: {formatCountdown(timeRemainingSeconds)}</span>
                </span>
              ) : (
                <span>Download Schedule</span>
              )}
            </button>

            {/* Simulate button */}
            <button
              id="logs-simulate-event-btn"
              onClick={handleSimulateHeartbeat}
              className="px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-mono text-[#18181B] transition-colors cursor-pointer"
            >
              + Event
            </button>

            {/* Clear button */}
            <button
              id="logs-clear-btn"
              onClick={onClearLogs}
              className="px-2.5 py-1 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-mono text-[#71717A] hover:text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Schedule Persistent Banner */}
        {scheduleConfig.enabled && (
          <div
            id="logs-schedule-active-banner"
            className="px-4 py-2 bg-emerald-50/80 border-b border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
          >
            <div className="flex items-center gap-2 text-emerald-900 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold">Automated Schedule:</span>
              <span>
                Next export in{' '}
                <span className="font-bold underline">{formatCountdown(timeRemainingSeconds)}</span>
              </span>
              <span className="text-[#52525B] text-[11px]">
                (Every{' '}
                {scheduleConfig.intervalMinutes < 1
                  ? `${scheduleConfig.intervalMinutes * 60}s`
                  : `${scheduleConfig.intervalMinutes}m`}{' '}
                &bull; Scope: {scheduleConfig.filterScope} &bull; {scheduleConfig.totalExportsCount}{' '}
                files delivered)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="schedule-banner-run-now-btn"
                onClick={executeScheduledExport}
                className="px-2 py-0.5 rounded bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-900 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Export Now
              </button>
              <button
                id="schedule-banner-configure-btn"
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-2 py-0.5 rounded bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-900 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Configure
              </button>
              <button
                id="schedule-banner-pause-btn"
                onClick={() =>
                  handleUpdateScheduleConfig({ ...scheduleConfig, enabled: false })
                }
                className="px-2 py-0.5 rounded bg-amber-100/80 border border-amber-300 hover:bg-amber-200 text-amber-900 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Pause
              </button>
            </div>
          </div>
        )}

        {/* Filter Chips Bar */}
        <div className="px-4 py-2 border-b border-[#F0EFEA] bg-white flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#A1A1AA] text-[10px] mr-1">LEVEL:</span>
            {['ALL', 'INFO', 'WARN', 'SUCCESS', 'SYSTEM'].map((lvl) => (
              <button
                key={lvl}
                id={`logs-filter-${lvl.toLowerCase()}-btn`}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-[#18181B] text-white font-medium'
                    : 'text-[#71717A] hover:bg-[#F4F4F0]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {(searchQuery.trim() !== '' || filterLevel !== 'ALL') && (
            <span className="text-[11px] text-[#71717A]">
              Showing {filteredLogs.length} of {logs.length} events
            </span>
          )}
        </div>

        {/* Log Entries List */}
        <div className="divide-y divide-[#F0EFEA] max-h-[520px] overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-[#71717A] flex flex-col items-center justify-center gap-2">
              <p>
                {searchQuery.trim()
                  ? `No events matching "${searchQuery}"`
                  : 'No events match the selected criteria.'}
              </p>
              {searchQuery.trim() && (
                <button
                  id="logs-reset-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#059669] hover:underline font-mono cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => {
              let dotColor = 'bg-blue-500';
              let badgeBg = 'text-blue-700 bg-blue-50';
              if (log.level === 'warn') {
                dotColor = 'bg-amber-500';
                badgeBg = 'text-amber-700 bg-amber-50';
              } else if (log.level === 'success') {
                dotColor = 'bg-[#059669]';
                badgeBg = 'text-emerald-700 bg-emerald-50';
              } else if (log.level === 'system') {
                dotColor = 'bg-neutral-600';
                badgeBg = 'text-neutral-700 bg-neutral-100';
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FBFBF9] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 mt-1 sm:mt-0`} />
                    <span className="text-[#71717A] text-[11px] shrink-0 font-mono">
                      {log.timestamp}
                    </span>
                    <span className="text-[#18181B] text-xs font-normal">
                      {log.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {log.pathway && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EAE8E3] text-[#18181B]">
                        {log.pathway}
                      </span>
                    )}
                    <span className="text-[#A1A1AA] text-[11px]">
                      {log.traceId}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Download Schedule Modal */}
      <DownloadScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        config={scheduleConfig}
        onUpdateConfig={handleUpdateScheduleConfig}
        onTriggerExportNow={executeScheduledExport}
        logsCount={logs.length}
        filteredLogsCount={filteredLogs.length}
        timeRemainingSeconds={timeRemainingSeconds}
      />

      {/* CSV Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onConfirmExport={handleConfirmExport}
        logs={filteredLogs.length > 0 ? filteredLogs : logs}
        filterSummary={getFilterSummary()}
        filenamePrefix={scheduleConfig.prefix}
      />
    </div>
  );
};
