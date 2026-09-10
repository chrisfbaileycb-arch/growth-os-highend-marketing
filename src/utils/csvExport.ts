import { TelemetryLog } from '../types';

export interface ExportResult {
  filename: string;
  recordCount: number;
  byteSize: number;
  exportedAt: string;
}

/**
 * Generates raw CSV formatted string from an array of TelemetryLogs.
 */
export function generateCSVString(logs: TelemetryLog[]): string {
  if (!logs || logs.length === 0) return '';

  const headers = ['Timestamp', 'Level', 'Trace ID', 'Pathway', 'Message'];
  const csvRows = logs.map((log) => {
    const row = [
      log.timestamp,
      log.level.toUpperCase(),
      log.traceId,
      log.pathway || 'N/A',
      log.message,
    ];

    return row
      .map((cell) => {
        const str = String(cell ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headers.join(','), ...csvRows].join('\r\n');
}

/**
 * Exports an array of TelemetryLogs to a downloadable CSV file.
 */
export function exportLogsToCSV(
  logs: TelemetryLog[],
  filenamePrefix: string = 'growthengine_telemetry'
): ExportResult {
  if (!logs || logs.length === 0) {
    throw new Error('No logs available to export.');
  }

  const csvContent = generateCSVString(logs);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `${filenamePrefix}_${dateStr}.csv`;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    filename,
    recordCount: logs.length,
    byteSize: blob.size,
    exportedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}
