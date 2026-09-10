import fs from 'fs';
import path from 'path';
// @ts-ignore - node:sqlite is native to Node.js v22.5+
import { DatabaseSync } from 'node:sqlite';
import {
  WorkflowJob,
  ProspectIntake,
  TriageResult,
  IntegrationNode,
  TelemetryLog,
  SatelliteDispatchRecord,
  AssetRecord,
  DownloadScheduleConfig,
} from '../types';

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'growthengine.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for performance and durability
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    pathway TEXT,
    payload TEXT NOT NULL,
    result TEXT,
    error TEXT,
    trace_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prospects (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    monthly_budget REAL NOT NULL,
    primary_goal TEXT NOT NULL,
    locations INTEGER NOT NULL DEFAULT 1,
    website TEXT,
    channels TEXT NOT NULL,
    is_qualified INTEGER NOT NULL,
    economics TEXT NOT NULL,
    routed_pathways TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS satellite_dispatches (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    pathway_id TEXT NOT NULL,
    pathway_title TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    request_payload TEXT NOT NULL,
    response_data TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS telemetry_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    pathway TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    cost_model TEXT NOT NULL,
    last_checked_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    pathway_id TEXT,
    content_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS download_schedules (
    id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    interval_minutes INTEGER NOT NULL DEFAULT 5,
    filter_scope TEXT NOT NULL DEFAULT 'all',
    prefix TEXT NOT NULL DEFAULT 'growthengine_telemetry',
    last_run_at TEXT,
    next_run_at TEXT,
    total_exports_count INTEGER NOT NULL DEFAULT 0,
    notify_in_logs INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON telemetry_logs (timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
  CREATE INDEX IF NOT EXISTS idx_dispatches_job ON satellite_dispatches (job_id);
`);

// Initial Integrations Seed
const seedIntegrationsStmt = db.prepare('SELECT COUNT(*) as count FROM integrations');
const integrationsCount = (seedIntegrationsStmt.get() as any)?.count || 0;

if (integrationsCount === 0) {
  const defaultIntegrations: IntegrationNode[] = [
    {
      id: 'gemini',
      name: 'Google Gemini 3.5 / Pro',
      role: 'Reasoning & Vision',
      domain: 'api.google.com/genai',
      status: 'HEALTHY',
      latencyMs: 142,
      category: 'AI',
      description: 'Multimodal foundation models for strategic brand reasoning, vision parsing, and triage classification.',
      costModel: '$0.0001 / 1K tokens'
    },
    {
      id: 'ayrshare',
      name: 'Ayrshare Multi-Social',
      role: 'Distribution & Feeds',
      domain: 'api.ayrshare.com',
      status: 'ACTIVE',
      latencyMs: 285,
      category: 'Social',
      description: 'Programmatic multi-platform scheduling across TikTok, IG Reels, LinkedIn, and YouTube Shorts.',
      costModel: '$0.05 / automated dispatch'
    },
    {
      id: 'resend',
      name: 'Resend & SendGrid',
      role: 'Outbound & Transactional',
      domain: 'api.resend.com',
      status: 'HEALTHY',
      latencyMs: 98,
      category: 'Communication',
      description: 'Dedicated IP routing with warmup rate-limiting for client outreach campaigns and reporting alerts.',
      costModel: '$0.001 / transactional send'
    },
    {
      id: 'stripe',
      name: 'Stripe Billing API',
      role: 'Payments & Merchant Invoicing',
      domain: 'api.stripe.com/v1',
      status: 'HEALTHY',
      latencyMs: 110,
      category: 'Billing',
      description: 'Automated tiered retainer invoicing, direct fee deposits, and pass-through ad budget escrow balance.',
      costModel: '2.9% + $0.30 per captured retainer'
    },
    {
      id: 'spanner',
      name: 'Google Cloud Spanner',
      role: 'Distributed Database',
      domain: 'spanner.googleapis.com',
      status: 'HEALTHY',
      latencyMs: 44,
      category: 'Database',
      description: 'Globally distributed relational persistence with zero-downtime replication for transaction safety.',
      costModel: '$0.90 / node-hour + storage'
    },
    {
      id: 'github',
      name: 'GitHub Actions Orchestrator',
      role: 'CI/CD & Dispatch Automation',
      domain: 'api.github.com',
      status: 'HEALTHY',
      latencyMs: 190,
      category: 'Workflow',
      description: 'Repository dispatch hooks and automated release packaging across the 7 satellite pipelines.',
      costModel: '$0.008 / runner min'
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare Radar & Edge',
      role: 'DNS & Traffic Attribution',
      domain: 'api.cloudflare.com',
      status: 'HEALTHY',
      latencyMs: 24,
      category: 'Foot Traffic',
      description: 'Dynamic edge geolocation verification and high-speed bot protection for merchant microsites.',
      costModel: 'Included in enterprise tier'
    },
    {
      id: 'google-maps',
      name: 'Google Maps Places & Geocoding',
      role: 'POI & Radius Attribution',
      domain: 'maps.googleapis.com',
      status: 'HEALTHY',
      latencyMs: 135,
      category: 'Foot Traffic',
      description: 'Physical proximity validation and competitive density scoring for local merchant trade areas.',
      costModel: '$0.017 / Places search'
    }
  ];

  const insertIntegration = db.prepare(`
    INSERT INTO integrations (id, name, role, domain, status, latency_ms, category, description, cost_model, last_checked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const node of defaultIntegrations) {
    insertIntegration.run(
      node.id,
      node.name,
      node.role,
      node.domain,
      node.status,
      node.latencyMs,
      node.category,
      node.description,
      node.costModel,
      new Date().toISOString()
    );
  }
}

// Initial Telemetry Logs Seed
const seedLogsStmt = db.prepare('SELECT COUNT(*) as count FROM telemetry_logs');
const logsCount = (seedLogsStmt.get() as any)?.count || 0;

if (logsCount === 0) {
  const initialLogs: TelemetryLog[] = [
    {
      id: 'log-seed-1',
      timestamp: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').substring(0, 19),
      level: 'system',
      message: 'GrowthEngine OS Kernel initialized. Real SQLite storage mounted at /data/growthengine.db.',
      traceId: 'SYS-INIT-001',
      pathway: 'System Architecture',
    },
    {
      id: 'log-seed-2',
      timestamp: new Date(Date.now() - 3000000).toISOString().replace('T', ' ').substring(0, 19),
      level: 'info',
      message: 'Integration topology verified. 8 external API nodes reachable.',
      traceId: 'NET-TOP-002',
      pathway: 'Integrations',
    },
    {
      id: 'log-seed-3',
      timestamp: new Date(Date.now() - 1800000).toISOString().replace('T', ' ').substring(0, 19),
      level: 'success',
      message: 'Database schema verified. Jobs, prospects, dispatches, and assets ready for execution.',
      traceId: 'DB-SCHEMA-003',
      pathway: 'Persistence',
    }
  ];

  const insertLogStmt = db.prepare(`
    INSERT INTO telemetry_logs (id, timestamp, level, message, trace_id, pathway, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const log of initialLogs) {
    insertLogStmt.run(
      log.id,
      log.timestamp,
      log.level,
      log.message,
      log.traceId,
      log.pathway || 'System',
      new Date().toISOString()
    );
  }
}

// Data Access Service Object
export const dbService = {
  // PROSPECTS
  insertProspect(intake: ProspectIntake, triageResult: TriageResult) {
    const id = `prospect-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO prospects (
        id, business_name, industry, monthly_budget, primary_goal, locations,
        website, channels, is_qualified, economics, routed_pathways, trace_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      intake.businessName,
      intake.industry,
      intake.monthlyBudget,
      intake.primaryGoal,
      intake.locations || 1,
      intake.website || '',
      JSON.stringify(intake.channels || []),
      triageResult.isQualified ? 1 : 0,
      JSON.stringify(triageResult.economics),
      JSON.stringify(triageResult.routedPathways),
      triageResult.traceId,
      now
    );

    return { id, createdAt: now };
  },

  getProspects(limit: number = 50) {
    const stmt = db.prepare(`
      SELECT * FROM prospects ORDER BY created_at DESC LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      businessName: r.business_name,
      industry: r.industry,
      monthlyBudget: r.monthly_budget,
      primaryGoal: r.primary_goal,
      locations: r.locations,
      website: r.website,
      channels: JSON.parse(r.channels || '[]'),
      isQualified: Boolean(r.is_qualified),
      economics: JSON.parse(r.economics || '{}'),
      routedPathways: JSON.parse(r.routed_pathways || '[]'),
      traceId: r.trace_id,
      createdAt: r.created_at,
    }));
  },

  // WORKFLOW JOBS
  createJob(
    type: WorkflowJob['type'],
    payload: Record<string, any>,
    traceId: string,
    pathway?: string
  ): WorkflowJob {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO jobs (id, type, status, pathway, payload, trace_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, type, 'PROCESSING', pathway || null, JSON.stringify(payload), traceId, now, now);

    return {
      id,
      type,
      status: 'PROCESSING',
      pathway,
      payload,
      traceId,
      createdAt: now,
      updatedAt: now,
    };
  },

  updateJob(
    id: string,
    status: WorkflowJob['status'],
    result?: Record<string, any>,
    error?: string
  ): WorkflowJob | null {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE jobs
      SET status = ?, result = ?, error = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(status, result ? JSON.stringify(result) : null, error || null, now, id);

    return this.getJobById(id);
  },

  getJobById(id: string): WorkflowJob | null {
    const stmt = db.prepare(`SELECT * FROM jobs WHERE id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      status: row.status,
      pathway: row.pathway || undefined,
      payload: JSON.parse(row.payload || '{}'),
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error || undefined,
      traceId: row.trace_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  getJobs(limit: number = 50): WorkflowJob[] {
    const stmt = db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?`);
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      pathway: r.pathway || undefined,
      payload: JSON.parse(r.payload || '{}'),
      result: r.result ? JSON.parse(r.result) : undefined,
      error: r.error || undefined,
      traceId: r.trace_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  // SATELLITE DISPATCHES
  recordDispatch(dispatch: Omit<SatelliteDispatchRecord, 'id' | 'createdAt'>): SatelliteDispatchRecord {
    const id = `dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO satellite_dispatches (
        id, job_id, pathway_id, pathway_title, endpoint, status,
        trace_id, request_payload, response_data, latency_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      dispatch.jobId || null,
      dispatch.pathwayId,
      dispatch.pathwayTitle,
      dispatch.endpoint,
      dispatch.status,
      dispatch.traceId,
      JSON.stringify(dispatch.requestPayload),
      JSON.stringify(dispatch.responseData),
      dispatch.latencyMs,
      now
    );

    return {
      id,
      ...dispatch,
      createdAt: now,
    };
  },

  getDispatches(limit: number = 50): SatelliteDispatchRecord[] {
    const stmt = db.prepare(`SELECT * FROM satellite_dispatches ORDER BY created_at DESC LIMIT ?`);
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id || undefined,
      pathwayId: r.pathway_id,
      pathwayTitle: r.pathway_title,
      endpoint: r.endpoint,
      status: r.status,
      traceId: r.trace_id,
      requestPayload: JSON.parse(r.request_payload || '{}'),
      responseData: JSON.parse(r.response_data || '{}'),
      latencyMs: r.latency_ms,
      createdAt: r.created_at,
    }));
  },

  // TELEMETRY LOGS
  insertLog(log: Omit<TelemetryLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): TelemetryLog {
    const id = log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = log.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO telemetry_logs (id, timestamp, level, message, trace_id, pathway, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, timestamp, log.level, log.message, log.traceId, log.pathway || 'System', now);

    return {
      id,
      timestamp,
      level: log.level,
      message: log.message,
      traceId: log.traceId,
      pathway: log.pathway,
    };
  },

  getLogs(options?: { level?: string; query?: string; limit?: number }): TelemetryLog[] {
    const limit = options?.limit || 100;
    let sql = 'SELECT * FROM telemetry_logs';
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.level && options.level !== 'ALL') {
      conditions.push('UPPER(level) = ?');
      params.push(options.level.toUpperCase());
    }

    if (options?.query && options.query.trim()) {
      conditions.push('(message LIKE ? OR trace_id LIKE ? OR pathway LIKE ? OR timestamp LIKE ?)');
      const wild = `%${options.query.trim()}%`;
      params.push(wild, wild, wild, wild);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC, timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      level: r.level,
      message: r.message,
      traceId: r.trace_id,
      pathway: r.pathway || undefined,
    }));
  },

  clearLogs(): number {
    const stmt = db.prepare('DELETE FROM telemetry_logs');
    const result = stmt.run();
    return Number(result.changes || 0);
  },

  // INTEGRATIONS
  getIntegrations(): IntegrationNode[] {
    const stmt = db.prepare('SELECT * FROM integrations ORDER BY name ASC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      domain: r.domain,
      status: r.status,
      latencyMs: r.latency_ms,
      category: r.category,
      description: r.description,
      costModel: r.cost_model,
    }));
  },

  updateIntegrationHealth(id: string, latencyMs: number, status: IntegrationNode['status'] = 'HEALTHY'): IntegrationNode | null {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE integrations
      SET latency_ms = ?, status = ?, last_checked_at = ?
      WHERE id = ?
    `);
    stmt.run(latencyMs, status, now, id);

    const getStmt = db.prepare('SELECT * FROM integrations WHERE id = ?');
    const r = getStmt.get(id) as any;
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      role: r.role,
      domain: r.domain,
      status: r.status,
      latencyMs: r.latency_ms,
      category: r.category,
      description: r.description,
      costModel: r.cost_model,
    };
  },

  // ASSETS
  createAsset(asset: Omit<AssetRecord, 'id' | 'createdAt'>): AssetRecord {
    const id = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO assets (id, job_id, name, type, pathway_id, content_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      asset.jobId || null,
      asset.name,
      asset.type,
      asset.pathwayId || null,
      asset.contentJson ? JSON.stringify(asset.contentJson) : null,
      now
    );

    return {
      id,
      ...asset,
      createdAt: now,
    };
  },

  getAssets(limit: number = 50): AssetRecord[] {
    const stmt = db.prepare('SELECT * FROM assets ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id || undefined,
      name: r.name,
      type: r.type,
      pathwayId: r.pathway_id || undefined,
      contentJson: r.content_json ? JSON.parse(r.content_json) : undefined,
      createdAt: r.created_at,
    }));
  },

  // DOWNLOAD SCHEDULE
  getDownloadSchedule(): DownloadScheduleConfig {
    const stmt = db.prepare('SELECT * FROM download_schedules WHERE id = ?');
    let row = stmt.get('global') as any;

    if (!row) {
      const initStmt = db.prepare(`
        INSERT INTO download_schedules (
          id, enabled, interval_minutes, filter_scope, prefix, last_run_at, next_run_at, total_exports_count, notify_in_logs, updated_at
        ) VALUES (?, 0, 5, 'all', 'growthengine_telemetry', NULL, NULL, 0, 1, ?)
      `);
      initStmt.run('global', new Date().toISOString());
      row = stmt.get('global') as any;
    }

    return {
      enabled: Boolean(row.enabled),
      intervalMinutes: Number(row.interval_minutes),
      filterScope: row.filter_scope as any,
      prefix: row.prefix,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      totalExportsCount: Number(row.total_exports_count),
      notifyInLogs: Boolean(row.notify_in_logs),
    };
  },

  updateDownloadSchedule(updates: Partial<DownloadScheduleConfig>): DownloadScheduleConfig {
    const current = this.getDownloadSchedule();
    const updated: DownloadScheduleConfig = {
      ...current,
      ...updates,
    };

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE download_schedules
      SET enabled = ?,
          interval_minutes = ?,
          filter_scope = ?,
          prefix = ?,
          last_run_at = ?,
          next_run_at = ?,
          total_exports_count = ?,
          notify_in_logs = ?,
          updated_at = ?
      WHERE id = 'global'
    `);

    stmt.run(
      updated.enabled ? 1 : 0,
      updated.intervalMinutes,
      updated.filterScope,
      updated.prefix,
      updated.lastRunAt || null,
      updated.nextRunAt || null,
      updated.totalExportsCount,
      updated.notifyInLogs ? 1 : 0,
      now
    );

    return updated;
  },

  recordScheduleExecution(lastRunAt: string, nextRunAt: string): DownloadScheduleConfig {
    const current = this.getDownloadSchedule();
    const newCount = current.totalExportsCount + 1;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE download_schedules
      SET last_run_at = ?,
          next_run_at = ?,
          total_exports_count = ?,
          updated_at = ?
      WHERE id = 'global'
    `);

    stmt.run(lastRunAt, nextRunAt, newCount, now);

    return {
      ...current,
      lastRunAt,
      nextRunAt,
      totalExportsCount: newCount,
    };
  },
};
