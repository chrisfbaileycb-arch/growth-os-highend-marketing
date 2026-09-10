import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Real SQLite schema definitions via Drizzle ORM
 */
export const jobsTable = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  pathway: text('pathway'),
  payload: text('payload').notNull(),
  result: text('result'),
  error: text('error'),
  traceId: text('trace_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const prospectsTable = sqliteTable('prospects', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  industry: text('industry').notNull(),
  monthlyBudget: real('monthly_budget').notNull(),
  primaryGoal: text('primary_goal').notNull(),
  locations: integer('locations').notNull().default(1),
  website: text('website'),
  channels: text('channels').notNull(),
  isQualified: integer('is_qualified').notNull(),
  economics: text('economics').notNull(),
  routedPathways: text('routed_pathways').notNull(),
  traceId: text('trace_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const satelliteDispatchesTable = sqliteTable('satellite_dispatches', {
  id: text('id').primaryKey(),
  jobId: text('job_id'),
  pathwayId: text('pathway_id').notNull(),
  pathwayTitle: text('pathway_title').notNull(),
  endpoint: text('endpoint').notNull(),
  status: text('status').notNull(),
  traceId: text('trace_id').notNull(),
  requestPayload: text('request_payload').notNull(),
  responseData: text('response_data').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  createdAt: text('created_at').notNull(),
});

export const telemetryLogsTable = sqliteTable('telemetry_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(),
  message: text('message').notNull(),
  traceId: text('trace_id').notNull(),
  pathway: text('pathway'),
  createdAt: text('created_at').notNull(),
});

export const integrationsTable = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  domain: text('domain').notNull(),
  status: text('status').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  costModel: text('cost_model').notNull(),
  lastCheckedAt: text('last_checked_at').notNull(),
});

export const assetsTable = sqliteTable('assets', {
  id: text('id').primaryKey(),
  jobId: text('job_id'),
  name: text('name').notNull(),
  type: text('type').notNull(),
  pathwayId: text('pathway_id'),
  contentJson: text('content_json'),
  createdAt: text('created_at').notNull(),
});
