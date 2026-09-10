import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { generateCSVString } from '../utils/csvExport';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Table,
  Code2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: () => void;
  logs: TelemetryLog[];
  filterSummary?: string;
  filenamePrefix?: string;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  logs,
  filterSummary,
  filenamePrefix = 'growthengine_telemetry',
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState(false);

  // Close on Escape
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

  const csvString = generateCSVString(logs);
  const byteSize = new Blob([csvString]).size;
  const formattedSize =
    byteSize < 1024
      ? `${byteSize} bytes`
      : `${(byteSize / 1024).toFixed(1)} KB`;

  const datePreview = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const targetFilename = `${filenamePrefix}_${datePreview}.csv`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleConfirm = () => {
    onConfirmExport();
    onClose();
  };

  // Preview up to 50 rows in the previewer to keep rendering instant
  const previewLogs = logs.slice(0, 50);
  const rawLines = csvString.split('\r\n').slice(0, 60);

  return (
    <div
      id="export-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="export-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-preview-title"
        className="relative w-full max-w-2xl rounded-xl border border-[#E7E5E4] bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E7E5E4] bg-[#FBFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="export-preview-title"
                className="text-base font-bold text-[#18181B] font-mono tracking-tight"
              >
                CSV Export Preview
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Review export rows, formatting, and metadata before downloading.
              </p>
            </div>
          </div>
          <button
            id="export-preview-close-btn"
            onClick={onClose}
            aria-label="Close export preview"
            className="text-[#71717A] hover:text-[#18181B] p-1.5 rounded-md hover:bg-[#F5F5F2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Summary Pill Strip */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#FAFAF8] border-b border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-white border border-[#E7E5E4] text-[#18181B] font-semibold">
              {logs.length} {logs.length === 1 ? 'record' : 'records'}
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E7E5E4] text-[#71717A]">
              Size: {formattedSize}
            </span>
            {filterSummary && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                {filterSummary}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-md border border-[#E7E5E4] bg-white p-0.5">
              <button
                id="export-preview-tab-table"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#18181B] text-white'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Table</span>
              </button>
              <button
                id="export-preview-tab-raw"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-[#18181B] text-white'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Raw CSV</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              id="export-preview-copy-btn"
              onClick={handleCopy}
              title="Copy CSV to clipboard"
              className="flex items-center gap-1 px-2 py-1 rounded border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-[11px] text-[#52525B] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#059669]" />
                  <span className="text-[#059669]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Content Area */}
        <div className="p-4 sm:p-5 max-h-[360px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#71717A] space-y-1">
              <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-[#18181B]">No log records selected</p>
              <p>Adjust your search query or filter level to select telemetry records.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="rounded-lg border border-[#E7E5E4] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FBFBF9] border-b border-[#E7E5E4] text-[11px] text-[#71717A] uppercase">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Timestamp</th>
                    <th className="px-3 py-2 font-semibold">Level</th>
                    <th className="px-3 py-2 font-semibold">Trace ID</th>
                    <th className="px-3 py-2 font-semibold">Pathway</th>
                    <th className="px-3 py-2 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] bg-white">
                  {previewLogs.map((log, idx) => {
                    const levelBg =
                      log.level === 'warn'
                        ? 'text-amber-700 bg-amber-50'
                        : log.level === 'success'
                        ? 'text-emerald-700 bg-emerald-50'
                        : log.level === 'system'
                        ? 'text-zinc-700 bg-zinc-100'
                        : 'text-blue-700 bg-blue-50';

                    return (
                      <tr key={log.id || idx} className="hover:bg-[#FBFBF9] transition-colors">
                        <td className="px-3 py-2 text-[#71717A] whitespace-nowrap text-[11px]">
                          {log.timestamp}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${levelBg}`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#52525B] whitespace-nowrap text-[11px]">
                          {log.traceId}
                        </td>
                        <td className="px-3 py-2 text-[#52525B] whitespace-nowrap text-[11px]">
                          {log.pathway || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-[#18181B] max-w-xs truncate font-sans text-xs">
                          {log.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {logs.length > 50 && (
                <div className="px-3 py-2 bg-[#FBFBF9] border-t border-[#E7E5E4] text-[11px] text-center text-[#71717A] font-mono">
                  Showing first 50 of {logs.length} records. All records will be included in download.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[#E7E5E4] bg-[#18181B] text-zinc-200 p-3 text-xs font-mono overflow-x-auto max-h-[320px]">
              <pre className="leading-relaxed">
                {rawLines.map((line, i) => (
                  <div key={i} className="flex gap-3 hover:bg-zinc-800/60 px-1 rounded">
                    <span className="text-zinc-600 select-none w-6 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-zinc-200 break-all">{line}</span>
                  </div>
                ))}
              </pre>
              {csvString.split('\r\n').length > 60 && (
                <div className="pt-2 text-zinc-500 text-[10px] border-t border-zinc-800 text-center">
                  Showing first 60 lines...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filename Preview Info */}
        <div className="px-4 sm:px-5 py-2 bg-[#FBFBF9] border-t border-[#E7E5E4] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
          <div className="flex items-center gap-1.5 truncate">
            <FileText className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
            <span className="text-[#52525B] font-medium">Download file:</span>
            <span className="truncate">{targetFilename}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E7E5E4] bg-white flex items-center justify-between gap-3">
          <button
            id="export-preview-cancel-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-[#E7E5E4] hover:bg-[#F5F5F2] text-xs font-mono text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="export-preview-confirm-btn"
            onClick={handleConfirm}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-mono font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({logs.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
