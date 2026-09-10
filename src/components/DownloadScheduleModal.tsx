import React, { useState, useEffect } from 'react';
import { DownloadScheduleConfig, TelemetryLog } from '../types';
import {
  X,
  CalendarClock,
  Play,
  Pause,
  Clock,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DownloadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DownloadScheduleConfig;
  onUpdateConfig: (newConfig: DownloadScheduleConfig) => void;
  onTriggerExportNow: () => void;
  logsCount: number;
  filteredLogsCount: number;
  timeRemainingSeconds: number | null;
}

const PRESET_INTERVALS = [
  { label: '30s (Test)', value: 0.5 },
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
];

export const DownloadScheduleModal: React.FC<DownloadScheduleModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTriggerExportNow,
  logsCount,
  filteredLogsCount,
  timeRemainingSeconds,
}) => {
  const [localConfig, setLocalConfig] = useState<DownloadScheduleConfig>(config);
  const [justTriggered, setJustTriggered] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    const updated = {
      ...localConfig,
      enabled: !localConfig.enabled,
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
  };

  const handleSelectInterval = (val: number) => {
    const updated = {
      ...localConfig,
      intervalMinutes: val,
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
  };

  const handleScopeChange = (scope: 'all' | 'filtered' | 'warnings_only') => {
    const updated = {
      ...localConfig,
      filterScope: scope,
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
  };

  const handlePrefixChange = (prefix: string) => {
    const updated = {
      ...localConfig,
      prefix: prefix.trim() || 'growthengine_telemetry',
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
  };

  const handleToggleNotify = () => {
    const updated = {
      ...localConfig,
      notifyInLogs: !localConfig.notifyInLogs,
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
  };

  const handleResetDefaults = () => {
    const def: DownloadScheduleConfig = {
      enabled: false,
      intervalMinutes: 5,
      filterScope: 'all',
      prefix: 'growthengine_telemetry',
      lastRunAt: null,
      nextRunAt: null,
      totalExportsCount: 0,
      notifyInLogs: true,
    };
    setLocalConfig(def);
    onUpdateConfig(def);
  };

  const handleManualTrigger = () => {
    onTriggerExportNow();
    setJustTriggered(true);
    setTimeout(() => setJustTriggered(false), 2500);
  };

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      id="download-schedule-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="download-schedule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-schedule-title"
        className="relative w-full max-w-lg rounded-xl border border-[#E7E5E4] bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E7E5E4] bg-[#FBFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="download-schedule-title"
                  className="text-base font-bold text-[#18181B] font-mono tracking-tight"
                >
                  Automated CSV Download Schedule
                </h2>
                {localConfig.enabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    RUNNING
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EAE8E3] text-[#71717A]">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#71717A] mt-0.5">
                Periodically export operational telemetry directly to your browser downloads.
              </p>
            </div>
          </div>
          <button
            id="download-schedule-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#71717A] hover:text-[#18181B] p-1.5 rounded-md hover:bg-[#F5F5F2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Status Toggle Card */}
          <div className="p-4 rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-mono font-bold uppercase text-[#18181B]">
                {localConfig.enabled ? 'Automated Export: Active' : 'Automated Export: Inactive'}
              </div>
              <div className="text-xs text-[#71717A]">
                {localConfig.enabled ? (
                  <span>
                    Downloads trigger every{' '}
                    <span className="font-semibold text-[#059669]">
                      {localConfig.intervalMinutes < 1
                        ? `${localConfig.intervalMinutes * 60} seconds`
                        : `${localConfig.intervalMinutes} min`}
                    </span>{' '}
                    while the app is open.
                  </span>
                ) : (
                  <span>Enable to begin automated recurring telemetry file downloads.</span>
                )}
              </div>
            </div>

            <button
              id="schedule-toggle-active-btn"
              onClick={handleToggleEnabled}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono font-bold tracking-wide transition-all shadow-xs cursor-pointer ${
                localConfig.enabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#059669] hover:bg-[#047857] text-white'
              }`}
            >
              {localConfig.enabled ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Schedule</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Activate Schedule</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Telemetry Monitor Card */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-[#E7E5E4] bg-white divide-x divide-[#F0EFEA]">
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[#71717A] block">
                NEXT RUN IN
              </span>
              <span
                id="schedule-countdown-timer"
                className="text-sm font-mono font-bold text-[#18181B] block mt-0.5"
              >
                {localConfig.enabled ? formatCountdown(timeRemainingSeconds) : 'Paused'}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[#71717A] block">
                COMPLETED
              </span>
              <span
                id="schedule-total-exports"
                className="text-sm font-mono font-bold text-[#059669] block mt-0.5"
              >
                {localConfig.totalExportsCount} files
              </span>
            </div>
            <div className="px-2">
              <span className="text-[10px] font-mono uppercase text-[#71717A] block">
                LAST DISPATCH
              </span>
              <span
                id="schedule-last-run-at"
                className="text-[11px] font-mono text-[#52525B] block mt-0.5 truncate"
                title={localConfig.lastRunAt || 'None yet'}
              >
                {localConfig.lastRunAt ? localConfig.lastRunAt.substring(11, 19) : 'None'}
              </span>
            </div>
          </div>

          {/* Export Interval Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-semibold text-[#18181B] block">
              Execution Interval
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_INTERVALS.map((item) => (
                <button
                  key={item.value}
                  id={`schedule-interval-${item.value}`}
                  onClick={() => handleSelectInterval(item.value)}
                  className={`py-1.5 px-2 rounded-md text-xs font-mono text-center transition-all cursor-pointer border ${
                    localConfig.intervalMinutes === item.value
                      ? 'bg-[#18181B] text-white border-[#18181B] font-semibold'
                      : 'bg-white text-[#52525B] border-[#E7E5E4] hover:bg-[#F5F5F2]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#71717A]">
              <span>Or custom minutes:</span>
              <input
                id="schedule-custom-minutes-input"
                type="number"
                min="0.5"
                max="1440"
                step="0.5"
                value={localConfig.intervalMinutes}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) handleSelectInterval(val);
                }}
                className="w-20 px-2 py-0.5 rounded border border-[#E7E5E4] text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
              <span>min</span>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-semibold text-[#18181B] block">
              Telemetry Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="schedule-scope-all"
                onClick={() => handleScopeChange('all')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  localConfig.filterScope === 'all'
                    ? 'border-[#059669] bg-emerald-50/50'
                    : 'border-[#E7E5E4] bg-white hover:bg-[#FBFBF9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#18181B]">All Logs</span>
                  <span className="text-[10px] font-mono text-[#71717A]">({logsCount})</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-0.5">Full memory log buffer</p>
              </button>

              <button
                id="schedule-scope-filtered"
                onClick={() => handleScopeChange('filtered')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  localConfig.filterScope === 'filtered'
                    ? 'border-[#059669] bg-emerald-50/50'
                    : 'border-[#E7E5E4] bg-white hover:bg-[#FBFBF9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#18181B]">Filtered</span>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    ({filteredLogsCount})
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-0.5">Matches active search/filter</p>
              </button>

              <button
                id="schedule-scope-warnings"
                onClick={() => handleScopeChange('warnings_only')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  localConfig.filterScope === 'warnings_only'
                    ? 'border-[#059669] bg-emerald-50/50'
                    : 'border-[#E7E5E4] bg-white hover:bg-[#FBFBF9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#18181B]">Warnings</span>
                  <span className="text-[10px] font-mono text-amber-700 font-semibold">Alerts</span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-0.5">Only warnings and errors</p>
              </button>
            </div>
          </div>

          {/* Filename & Preferences */}
          <div className="space-y-3 pt-1 border-t border-[#F0EFEA]">
            <div>
              <label
                htmlFor="schedule-filename-prefix"
                className="text-xs font-mono uppercase font-semibold text-[#18181B] block mb-1"
              >
                CSV File Prefix
              </label>
              <input
                id="schedule-filename-prefix"
                type="text"
                value={localConfig.prefix}
                onChange={(e) => handlePrefixChange(e.target.value)}
                placeholder="growthengine_telemetry"
                className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-white text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
              <span className="text-[10px] font-mono text-[#71717A] mt-1 block">
                Pattern: {localConfig.prefix}_YYYY-MM-DD-HH-MM-SS.csv
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                id="schedule-notify-checkbox"
                type="checkbox"
                checked={localConfig.notifyInLogs}
                onChange={handleToggleNotify}
                className="w-4 h-4 rounded border-[#E7E5E4] text-[#059669] focus:ring-[#059669]"
              />
              <span className="text-xs text-[#52525B]">
                Record a system event in telemetry each time an automated download fires
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E7E5E4] bg-[#FBFBF9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="schedule-trigger-now-btn"
              onClick={handleManualTrigger}
              disabled={logsCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-mono text-[#18181B] font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {justTriggered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-[#059669]">Downloaded Now!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#52525B]" />
                  <span>Run Now</span>
                </>
              )}
            </button>

            <button
              id="schedule-reset-defaults-btn"
              onClick={handleResetDefaults}
              title="Reset schedule configuration to defaults"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <button
            id="schedule-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
