export type TabType = 'overview' | 'command-center' | 'operator-matrix' | 'agent-assist' | 'integrations' | 'playground' | 'logs';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  pathwayFocus?: string;
  modelUsed?: string;
}

export type AgentSkillRole =
  | 'conductor'
  | 'P1_social_video'
  | 'P2_print_collateral'
  | 'P3_foot_traffic'
  | 'P4_retention_email'
  | 'P5_pos_floor'
  | 'P6_review_shield'
  | 'P7_compliance_ledger';

export interface CommercialEconomics {
  operatorFee: number;
  operatorFeePct: number;
  weeklyAdSpend: number;
  monthlyAdSpend: number;
  apiPassThrough: number;
  totalEstimatedRetainer: number;
}

export interface PathwayItem {
  id: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7';
  title: string;
  tag: string;
  category: 'Acquisition' | 'Physical & Collateral' | 'Foot Traffic' | 'Retention' | 'Operations' | 'Defense' | 'Compliance';
  description: string;
  inputPayloads: string[];
  endpoint: string;
  dispatchPayloadSchema: Record<string, any>;
}

export interface ProspectIntake {
  businessName: string;
  industry: string;
  monthlyBudget: number;
  primaryGoal: string;
  locations: number;
  website: string;
  channels: string[];
}

export interface TriageResult {
  isQualified: boolean;
  hardFloor: number;
  businessName: string;
  monthlyBudget: number;
  industry: string;
  primaryGoal: string;
  economics: CommercialEconomics;
  routedPathways: Array<'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'>;
  payload: Record<string, any>;
  timestamp: string;
  traceId: string;
  recommendation: string;
}

export interface IntegrationNode {
  id: string;
  name: string;
  role: string;
  domain: string;
  status: 'HEALTHY' | 'ACTIVE' | 'PENDING' | 'MAINTENANCE';
  latencyMs: number;
  category: 'AI' | 'Video' | 'Social' | 'Communication' | 'Billing' | 'Workflow' | 'Database' | 'Reputation' | 'Foot Traffic';
  description: string;
  costModel: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'system';
  message: string;
  traceId: string;
  pathway?: string;
}

export interface DownloadScheduleConfig {
  enabled: boolean;
  intervalMinutes: number;
  filterScope: 'all' | 'filtered' | 'warnings_only';
  prefix: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalExportsCount: number;
  notifyInLogs: boolean;
}

export interface WorkflowJob {
  id: string;
  type: 'TRIAGE' | 'DISPATCH' | 'SYNC' | 'HEARTBEAT';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pathway?: string;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  traceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  jobId?: string;
  name: string;
  type: string;
  pathwayId?: string;
  contentJson?: Record<string, any>;
  createdAt: string;
}

export interface SatelliteDispatchRecord {
  id: string;
  jobId?: string;
  pathwayId: string;
  pathwayTitle: string;
  endpoint: string;
  status: 'COMPLETED' | 'FAILED';
  traceId: string;
  requestPayload: Record<string, any>;
  responseData: Record<string, any>;
  latencyMs: number;
  createdAt: string;
}

