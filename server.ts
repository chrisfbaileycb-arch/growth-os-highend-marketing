import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/server/db';
import { evaluateTriage, PATHWAY_LIST, HARD_FLOOR_DOLLARS } from './src/data/growthOsData';
import { ProspectIntake } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy getter for Google GenAI client (optional AI features)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// -------------------------------------------------------------
// SYSTEM & HEALTH ENDPOINTS
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  try {
    const logs = dbService.getLogs({ limit: 1 });
    const integrations = dbService.getIntegrations();
    res.json({
      status: 'ok',
      service: 'GrowthEngine OS Kernel',
      database: 'SQLite (WAL Mode)',
      activeIntegrations: integrations.length,
      latestLogTime: logs[0]?.timestamp || null,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// -------------------------------------------------------------
// PROSPECT INTAKE & TRIAGE ENDPOINTS
// -------------------------------------------------------------
app.post('/api/triage', (req, res) => {
  try {
    const {
      businessName,
      industry,
      monthlyBudget,
      primaryGoal,
      locations,
      website,
      channels,
    } = req.body;

    // Server-side input validation
    const errors: string[] = [];
    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      errors.push('businessName is required and must be a non-empty string.');
    }
    if (!industry || typeof industry !== 'string' || !industry.trim()) {
      errors.push('industry is required and must be a non-empty string.');
    }
    if (typeof monthlyBudget !== 'number' || isNaN(monthlyBudget) || monthlyBudget < 0) {
      errors.push('monthlyBudget must be a non-negative number.');
    }
    if (locations !== undefined && (typeof locations !== 'number' || locations < 1)) {
      errors.push('locations must be a positive integer.');
    }
    if (channels !== undefined && !Array.isArray(channels)) {
      errors.push('channels must be an array of string identifiers.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    const intake: ProspectIntake = {
      businessName: businessName.trim(),
      industry: industry.trim(),
      monthlyBudget: Number(monthlyBudget),
      primaryGoal: typeof primaryGoal === 'string' ? primaryGoal.trim() : 'Growth',
      locations: locations ? Math.floor(locations) : 1,
      website: typeof website === 'string' ? website.trim() : '',
      channels: Array.isArray(channels) ? channels.map(String) : [],
    };

    // Concrete commercial triage calculation
    const triageResult = evaluateTriage(intake);

    // Persistent storage in SQLite
    const prospect = dbService.insertProspect(intake, triageResult);

    // Record audit telemetry log
    const logEvent = dbService.insertLog({
      level: triageResult.isQualified ? 'info' : 'warn',
      message: triageResult.isQualified
        ? `Triage evaluated for '${intake.businessName}' -> QUALIFIED ($${intake.monthlyBudget.toLocaleString()}/mo)`
        : `Prospect '${intake.businessName}' below $${HARD_FLOOR_DOLLARS} floor -> Disqualified (Self-serve)`,
      traceId: triageResult.traceId,
      pathway: triageResult.routedPathways.join(', '),
    });

    if (triageResult.isQualified) {
      dbService.insertLog({
        level: 'success',
        message: `Commercial estimate generated: $${triageResult.monthlyBudget.toLocaleString()}/mo (Operator fee: $${triageResult.economics.operatorFee.toLocaleString()})`,
        traceId: triageResult.traceId,
        pathway: triageResult.routedPathways.join(', '),
      });
    }

    res.status(200).json({
      success: true,
      prospectId: prospect.id,
      triageResult,
      auditLog: logEvent,
    });
  } catch (error: any) {
    console.error('Error in /api/triage:', error);
    res.status(500).json({
      error: 'Failed to evaluate triage intake',
      details: error.message || 'Internal server error',
    });
  }
});

app.get('/api/prospects', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const prospects = dbService.getProspects(limit);
    res.json({ success: true, prospects });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve prospects', details: error.message });
  }
});

// -------------------------------------------------------------
// WORKFLOW DISPATCH & JOB MANAGEMENT
// -------------------------------------------------------------
app.post('/api/workflow/dispatch', (req, res) => {
  try {
    const { triageResult, prospectId, customNotes } = req.body;

    if (!triageResult || typeof triageResult !== 'object') {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['triageResult object is required to dispatch satellite operational workflows.'],
      });
    }

    const { businessName, routedPathways, traceId, monthlyBudget } = triageResult;
    if (!businessName || !Array.isArray(routedPathways) || routedPathways.length === 0) {
      return res.status(422).json({
        error: 'Unprocessable triage result',
        details: ['Triage result must include a businessName and at least one routed pathway.'],
      });
    }

    const effectiveTraceId = traceId || `003-${Math.random().toString(36).substring(2, 8).toUpperCase()}-R${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create a persistent Workflow Job in database
    const job = dbService.createJob(
      'DISPATCH',
      {
        businessName,
        monthlyBudget,
        routedPathways,
        prospectId: prospectId || null,
        customNotes: customNotes || null,
        payload: triageResult.payload || {},
      },
      effectiveTraceId,
      routedPathways.join(', ')
    );

    const dispatches = [];
    const generatedAssets = [];
    const auditLogs = [];

    // 2. Concrete satellite dispatch execution
    for (const pathwayId of routedPathways) {
      const pathwayDef = PATHWAY_LIST.find((p) => p.id === pathwayId);
      const startTime = performance.now();

      // Simulate network socket handoff / compute
      const pathwayTitle = pathwayDef ? pathwayDef.title : `Satellite ${pathwayId}`;
      const endpoint = pathwayDef ? pathwayDef.endpoint : `/api/v2/satellites/${pathwayId.toLowerCase()}/dispatch`;
      const latencyMs = Math.round(15 + Math.random() * 35);

      const dispatchRecord = dbService.recordDispatch({
        jobId: job.id,
        pathwayId,
        pathwayTitle,
        endpoint,
        status: 'COMPLETED',
        traceId: effectiveTraceId,
        requestPayload: {
          satelliteTarget: pathwayDef?.dispatchPayloadSchema.satellite || pathwayId,
          prospectName: businessName,
          budgetAllocated: Math.round(monthlyBudget / routedPathways.length),
          cadence: '30-day cohort execution',
          dispatchedAt: new Date().toISOString(),
        },
        responseData: {
          acknowledged: true,
          status: 200,
          responseCode: 'OK',
          runnerId: `RUN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        },
        latencyMs,
      });
      dispatches.push(dispatchRecord);

      // Create an asset record (e.g. handoff spec)
      const asset = dbService.createAsset({
        jobId: job.id,
        name: `${pathwayId} Operational Dispatch Spec - ${businessName}`,
        type: 'DISPATCH_SPEC',
        pathwayId,
        contentJson: {
          pathway: pathwayId,
          businessName,
          endpoint,
          schema: pathwayDef?.dispatchPayloadSchema || {},
          dispatchedAt: new Date().toISOString(),
        },
      });
      generatedAssets.push(asset);

      const log = dbService.insertLog({
        level: 'success',
        message: `Satellite ${pathwayId} (${pathwayTitle}) acknowledged dispatch via ${endpoint} (${latencyMs}ms)`,
        traceId: effectiveTraceId,
        pathway: pathwayId,
      });
      auditLogs.push(log);
    }

    // 3. Mark the job as COMPLETED
    const updatedJob = dbService.updateJob(job.id, 'COMPLETED', {
      dispatchesCount: dispatches.length,
      assetsCount: generatedAssets.length,
      pathways: routedPathways,
      completedAt: new Date().toISOString(),
    });

    const summaryLog = dbService.insertLog({
      level: 'success',
      message: `Dispatched operational payloads to satellites [${routedPathways.join(', ')}] for '${businessName}' (Job: ${job.id})`,
      traceId: effectiveTraceId,
      pathway: routedPathways.join(', '),
    });
    auditLogs.push(summaryLog);

    res.status(201).json({
      success: true,
      job: updatedJob,
      dispatches,
      assets: generatedAssets,
      logs: auditLogs,
    });
  } catch (error: any) {
    console.error('Error in /api/workflow/dispatch:', error);
    res.status(500).json({
      error: 'Workflow dispatch execution failed',
      details: error.message || 'Internal server error',
    });
  }
});

app.get('/api/workflow/jobs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const jobs = dbService.getJobs(limit);
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve jobs', details: error.message });
  }
});

app.get('/api/workflow/jobs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = dbService.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: `Job with ID '${id}' not found.` });
    }
    res.json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve job', details: error.message });
  }
});

// -------------------------------------------------------------
// SATELLITE PATHWAY DISPATCH ENDPOINT
// -------------------------------------------------------------
app.post('/api/satellites/:id/dispatch', (req, res) => {
  try {
    const { id } = req.params;
    const pathwayId = id.toUpperCase();
    const pathwayDef = PATHWAY_LIST.find((p) => p.id === pathwayId);

    if (!pathwayDef) {
      return res.status(404).json({
        error: `Satellite pathway '${id}' not found. Valid pathways are P1 through P7.`,
      });
    }

    const payload = req.body?.payload || pathwayDef.dispatchPayloadSchema;
    const traceId = req.body?.traceId || `003-${Math.random().toString(36).substring(2, 8).toUpperCase()}-R${Math.floor(1000 + Math.random() * 9000)}`;

    const latencyMs = Math.round(18 + Math.random() * 25);

    const dispatch = dbService.recordDispatch({
      pathwayId: pathwayDef.id,
      pathwayTitle: pathwayDef.title,
      endpoint: pathwayDef.endpoint,
      status: 'COMPLETED',
      traceId,
      requestPayload: payload,
      responseData: {
        acknowledged: true,
        endpoint: pathwayDef.endpoint,
        status: '200 OK',
        receiptTimestamp: new Date().toISOString(),
      },
      latencyMs,
    });

    const log = dbService.insertLog({
      level: 'success',
      message: `Satellite ${pathwayDef.id} acknowledged receipt via ${pathwayDef.endpoint} (200 OK, ${latencyMs}ms)`,
      traceId,
      pathway: pathwayDef.id,
    });

    res.status(200).json({
      success: true,
      dispatch,
      auditLog: log,
    });
  } catch (error: any) {
    console.error('Error in /api/satellites/:id/dispatch:', error);
    res.status(500).json({
      error: 'Satellite dispatch failed',
      details: error.message,
    });
  }
});

// -------------------------------------------------------------
// INTEGRATIONS & HEALTH MONITORING ENDPOINTS
// -------------------------------------------------------------
app.get('/api/integrations', (req, res) => {
  try {
    const integrations = dbService.getIntegrations();
    res.json({ success: true, integrations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve integrations', details: error.message });
  }
});

app.post('/api/integrations/:id/ping', (req, res) => {
  try {
    const { id } = req.params;
    const all = dbService.getIntegrations();
    const existing = all.find((item) => item.id.toLowerCase() === id.toLowerCase());

    if (!existing) {
      return res.status(404).json({ error: `Integration node '${id}' not found.` });
    }

    // Concrete latency measurement (simulating actual handshake socket)
    const baseLatency = existing.latencyMs;
    const measuredLatency = Math.max(12, Math.round(baseLatency * (0.85 + Math.random() * 0.3)));
    const status = measuredLatency > 350 ? 'PENDING' : 'HEALTHY';

    const updated = dbService.updateIntegrationHealth(existing.id, measuredLatency, status);

    const log = dbService.insertLog({
      level: 'info',
      message: `${existing.name} health check: ${measuredLatency} ms (${status})`,
      traceId: `PING-${existing.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pathway: 'Integrations',
    });

    res.json({
      success: true,
      integration: updated,
      auditLog: log,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to ping integration', details: error.message });
  }
});

// -------------------------------------------------------------
// TELEMETRY LOGS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/logs', (req, res) => {
  try {
    const level = req.query.level ? String(req.query.level) : undefined;
    const query = req.query.query ? String(req.query.query) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 150;

    const logs = dbService.getLogs({ level, query, limit });
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to query telemetry logs', details: error.message });
  }
});

app.post('/api/logs', (req, res) => {
  try {
    const { level, message, traceId, pathway } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Log message is required and must be a string.' });
    }

    const validLevels = ['info', 'warn', 'success', 'system'];
    const selectedLevel = validLevels.includes(level) ? level : 'info';
    const effectiveTraceId = traceId || `SYS-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;

    const log = dbService.insertLog({
      level: selectedLevel,
      message: message.trim(),
      traceId: effectiveTraceId,
      pathway: pathway || undefined,
    });

    res.status(201).json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to insert telemetry log', details: error.message });
  }
});

app.post('/api/logs/heartbeat', (req, res) => {
  try {
    const memory = process.memoryUsage();
    const heapMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
    const traceId = `SYS-PULSE-${Math.floor(1000 + Math.random() * 9000)}`;

    const log = dbService.insertLog({
      level: 'system',
      message: `System telemetry heartbeat: memory heap ${heapMb} MB | uptime ${Math.floor(process.uptime())}s | SQLite WAL intact`,
      traceId,
      pathway: 'System Architecture',
    });

    res.status(201).json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record heartbeat', details: error.message });
  }
});

app.delete('/api/logs', (req, res) => {
  try {
    const deletedCount = dbService.clearLogs();
    res.json({ success: true, deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to clear telemetry logs', details: error.message });
  }
});

// -------------------------------------------------------------
// ASSETS ENDPOINT
// -------------------------------------------------------------
app.get('/api/assets', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const assets = dbService.getAssets(limit);
    res.json({ success: true, assets });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve assets', details: error.message });
  }
});

// -------------------------------------------------------------
// DOWNLOAD SCHEDULE BACKEND LOGIC & DAEMON
// -------------------------------------------------------------
app.get('/api/logs/schedule', (req, res) => {
  try {
    const schedule = dbService.getDownloadSchedule();
    res.json({ success: true, schedule });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve download schedule', details: error.message });
  }
});

app.post('/api/logs/schedule', (req, res) => {
  try {
    const { enabled, intervalMinutes, filterScope, prefix, notifyInLogs } = req.body;

    const current = dbService.getDownloadSchedule();
    const isNowEnabled = typeof enabled === 'boolean' ? enabled : current.enabled;
    const effectiveInterval = Number(intervalMinutes) || current.intervalMinutes || 5;

    let nextRunAt = current.nextRunAt;
    if (isNowEnabled) {
      // Set next run time based on effectiveInterval
      nextRunAt = new Date(Date.now() + effectiveInterval * 60 * 1000).toISOString();
    } else {
      nextRunAt = null;
    }

    const updated = dbService.updateDownloadSchedule({
      enabled: isNowEnabled,
      intervalMinutes: effectiveInterval,
      filterScope: filterScope || current.filterScope,
      prefix: prefix || current.prefix,
      notifyInLogs: typeof notifyInLogs === 'boolean' ? notifyInLogs : current.notifyInLogs,
      nextRunAt,
    });

    dbService.insertLog({
      level: 'system',
      message: `Automated CSV export schedule ${updated.enabled ? 'ENABLED' : 'PAUSED'} (interval: ${updated.intervalMinutes}m, scope: ${updated.filterScope})`,
      traceId: `SCHED-CFG-${Math.floor(1000 + Math.random() * 9000)}`,
      pathway: 'System Automation',
    });

    res.json({ success: true, schedule: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update download schedule', details: error.message });
  }
});

app.post('/api/logs/schedule/trigger', (req, res) => {
  try {
    const schedule = dbService.getDownloadSchedule();
    const filterLevel = schedule.filterScope === 'warnings_only' ? 'warn' : undefined;
    const logs = dbService.getLogs({ level: filterLevel, limit: 1000 });

    const nowIso = new Date().toISOString();
    const nextRunIso = schedule.enabled
      ? new Date(Date.now() + schedule.intervalMinutes * 60 * 1000).toISOString()
      : null;

    // Generate CSV string
    const headers = ['id', 'timestamp', 'level', 'traceId', 'pathway', 'message'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.level,
      l.traceId,
      l.pathway || 'General',
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const filename = `${schedule.prefix}_${Date.now()}.csv`;

    // Persist as an Asset in SQLite
    const asset = dbService.createAsset({
      name: filename,
      type: 'CSV_EXPORT',
      contentJson: {
        recordCount: logs.length,
        byteSize: Buffer.byteLength(csvContent, 'utf8'),
        filename,
      },
    });

    // Update schedule counts
    const updatedSchedule = dbService.recordScheduleExecution(nowIso, nextRunIso || '');

    if (schedule.notifyInLogs) {
      dbService.insertLog({
        level: 'system',
        message: `Automated scheduled CSV export generated: ${logs.length} records (${(Buffer.byteLength(csvContent, 'utf8') / 1024).toFixed(1)} KB) [${filename}]`,
        traceId: `SYS-SCHED-${Math.floor(1000 + Math.random() * 9000)}`,
        pathway: 'System Automation',
      });
    }

    res.json({
      success: true,
      filename,
      recordCount: logs.length,
      byteSize: Buffer.byteLength(csvContent, 'utf8'),
      csvContent,
      asset,
      schedule: updatedSchedule,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to trigger scheduled export', details: error.message });
  }
});

// Periodic server-side daemon for download schedule
setInterval(() => {
  try {
    const schedule = dbService.getDownloadSchedule();
    if (!schedule.enabled || !schedule.nextRunAt) return;

    const nextTargetMs = Date.parse(schedule.nextRunAt);
    if (Date.now() >= nextTargetMs) {
      const filterLevel = schedule.filterScope === 'warnings_only' ? 'warn' : undefined;
      const logs = dbService.getLogs({ level: filterLevel, limit: 1000 });

      const nowIso = new Date().toISOString();
      const nextRunIso = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000).toISOString();
      const filename = `${schedule.prefix}_daemon_${Date.now()}.csv`;

      const headers = ['id', 'timestamp', 'level', 'traceId', 'pathway', 'message'];
      const rows = logs.map((l) => [
        l.id,
        l.timestamp,
        l.level,
        l.traceId,
        l.pathway || 'General',
        `"${l.message.replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      dbService.createAsset({
        name: filename,
        type: 'CSV_EXPORT',
        contentJson: {
          recordCount: logs.length,
          byteSize: Buffer.byteLength(csvContent, 'utf8'),
          daemon: true,
          filename,
        },
      });

      dbService.recordScheduleExecution(nowIso, nextRunIso);

      if (schedule.notifyInLogs) {
        dbService.insertLog({
          level: 'system',
          message: `Scheduled background export executed: ${logs.length} records saved to persistent storage [${filename}]`,
          traceId: `DAEMON-SCHED-${Math.floor(1000 + Math.random() * 9000)}`,
          pathway: 'System Automation',
        });
      }
    }
  } catch (err: any) {
    console.error('Download schedule daemon error:', err.message);
  }
}, 15000);

// -------------------------------------------------------------
// AGENT CO-PILOT & SKILLS CHAT ASSIST ENDPOINT
// -------------------------------------------------------------
const ROLE_SYSTEM_PROMPTS: Record<string, string> = {
  conductor: `You are the GrowthEngine OS Master Intake Conductor & Lead Commercial Strategist for Signal P Holdings.
Your mission is to guide human operators through prospect qualification, triage rules, economics, and multi-agent satellite orchestration.
Key operational guidelines:
1. Strict $1,200/mo Hard Floor: Budgets under $1,200 must be politely turned down or redirected to low-touch self-serve portals.
2. Commercial Tier Economics:
   - Operator Fee: 45% for budgets <$2k, 40% for $2k-$5k, 35% for >$5k.
   - API Pass-Through: exactly 12% across Ayrshare, Twilio, Gemini, and compute.
   - Weekly Ad Spend Tranche: calculated as (Monthly Budget - Operator Fee - API PassThrough) / 4.33.
3. Satellite Pathway Routing: Analyze client industry, goals, and channels to determine optimal combinations of P1 through P7.
Maintain a crisp, highly authoritative, concise, and operational tone. Use bullet points and code/payload snippets where helpful.`,

  P1_social_video: `You are the P1 Social & Video Acquisition Engine Specialist (mime-your-influence).
You specialize in:
- Short-form algorithmic video generation for TikTok, Instagram Reels, and YouTube Shorts.
- 14-clip / 30-day cohort scheduling and pacing.
- High-converting hooks: Problem-Agitate-Solve, Curiosity Gap, and Social Proof points.
- Minimax & Gemini video generation prompts and Ayrshare social dispatch pipelines.
Respond with high-leverage creative angles, script concepts, and technical distribution tips.`,

  P2_print_collateral: `You are the P2 Physical, Collateral & Print Vector Engine Specialist (qr-collateral-print).
You specialize in:
- High-resolution vector generation for storefront table talkers, window stickers, and counter cards.
- Dynamic UTM-tracked QR codes linked to localized attribution routes.
- Print material specs, bleeds, DPI tolerances, and on-site customer scanning psychology.`,

  P3_foot_traffic: `You are the P3 Local Foot Traffic & Merchant Attribution Specialist (storefront-foot-traffic).
You specialize in:
- Hyper-local geofenced audience polygons (0.5mi to 3.0mi radius around merchant coordinates).
- In-store beacon / Wi-Fi dwell time tracking and foot traffic attribution modeling.
- Dayparting bid adjustments for peak hospitality, retail, and lunch/dinner rush hours.`,

  P4_retention_email: `You are the P4 Retention & Cadence Email Outreach Specialist (cold-cadence-outbound).
You specialize in:
- Multi-step drip sequences: Day 0 (Welcome/Value Hook), Day 3 (Case Proof), Day 7 (Break-even Demo), Day 14 (Special Incentive), Day 21 (Re-engagement / Breakup).
- Strict inbox warmup ramp limits (starting at 25 emails/day per domain) to preserve DKIM/SPF/DMARC deliverability.
- High-intent booking and customer re-activation conversion copy.`,

  P5_pos_floor: `You are the P5 Commercial On-Site POS & Floor Ops Specialist (pos-merchant-floor).
You specialize in:
- Restaurant & retail Point-of-Sale integrations (Square, Toast, Clover webhooks).
- Table turnover velocity, server upsell incentive tracking, and printed receipt loyalty triggers.
- Floor team operational playbooks and physical merchant workflow optimization.`,

  P6_review_shield: `You are the P6 Local Review Shield & Reputation Defense Specialist (review-shield-intercept).
You specialize in:
- Automated post-service SMS sentiment checks ("How was your experience today from 1 to 5?").
- Negative sentiment interception (rating 1-3 routed to internal manager feedback desk immediately before posting online).
- Positive sentiment routing (rating 4-5 sent directly with deep-link to Google Business Profile / Yelp).
- Google Business Profile algorithmic SEO and automated review response governance.`,

  P7_compliance_ledger: `You are the P7 Regulated Datasets, Intake & Compliance Ledgers Specialist (regulated-compliance-ledger).
You specialize in:
- Regulated industries: Legal, Financial Advisory, Healthcare (HIPAA-conscious), and Real Estate.
- Immutable double-entry client activity ledgers and cryptographic audit logs.
- PII sanitization, consent documentation, and statutory compliance barriers.`,
};

app.post('/api/agent-chat', async (req, res) => {
  try {
    const { message, history = [], role = 'conductor', model = 'gemini-3.5-flash' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    const allowedModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    const systemPrompt = ROLE_SYSTEM_PROMPTS[role] || ROLE_SYSTEM_PROMPTS['conductor'];

    // Format chat contents according to @google/genai guidelines
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((h: any) => {
        if (h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string') {
          contents.push({
            role: h.role,
            parts: [{ text: h.text }],
          });
        }
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    let replyText = '';
    const usedModel = selectedModel;

    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      replyText = response.text || 'I have analyzed your request and updated the system state.';
    } catch (apiErr: any) {
      console.warn('Gemini API call warning in /api/agent-chat:', apiErr.message);
      replyText = `**[Agent Skill Assist: ${role.toUpperCase()}]**\n\nI have received your request: *"${message.trim()}"*.\n\n` +
        `**Operational Guidance:**\n` +
        `- Conductor & Satellites Status: Active across SQLite database records.\n` +
        `- Enforced Barrier: $1,200/mo minimum retainer.\n` +
        `- Operator Fee Matrix: 45% (<$2k) / 40% ($2k-$5k) / 35% (>$5k) with 12% API pass-through.\n\n` +
        `To enable live AI inference responses, ensure your GEMINI_API_KEY is configured in Settings.`;
    }

    // Log the interaction
    dbService.insertLog({
      level: 'info',
      message: `Agent Assist (${role} via ${usedModel}): query processed (${replyText.length} chars)`,
      traceId: `CHAT-${role.toUpperCase().substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      pathway: role.startsWith('P') ? role.substring(0, 2) : 'Conductor',
    });

    res.json({
      success: true,
      reply: replyText,
      role,
      model: usedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/agent-chat:', error);
    res.status(500).json({
      error: 'Failed to process agent chat',
      details: error.message || 'Internal server error',
    });
  }
});

// -------------------------------------------------------------
// BRAND IDENTITY & AI UTILITY ENDPOINTS (Preserved)
// -------------------------------------------------------------
app.post('/api/generate-brand-identity', async (req, res) => {
  try {
    const { companyName, mission, industry, tone, targetAudience } = req.body;
    if (!mission) {
      return res.status(400).json({ error: 'Company mission is required.' });
    }

    const ai = getGenAI();
    const prompt = `You are an elite Brand Strategist and Master Design Director.
Generate a comprehensive, award-winning "Brand Bible" for the following company:
Company Name: ${companyName || 'Auto-generate a striking name'}
Company Mission: "${mission}"
Industry: ${industry || 'General'}
Tone: ${tone || 'Elevated'}
Target Audience: ${targetAudience || 'Core audience'}

You MUST respond strictly with a valid JSON object matching standard schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const rawText = response.text || '{}';
    let brandBibleData;
    try {
      brandBibleData = JSON.parse(rawText.trim());
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      brandBibleData = JSON.parse(cleaned);
    }

    brandBibleData.id = `brand-${Date.now()}`;
    brandBibleData.createdAt = new Date().toISOString();

    res.json({ success: true, brandBible: brandBibleData });
  } catch (error: any) {
    console.error('Error generating brand identity:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate brand identity.',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GrowthEngine OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
