import { PathwayItem, IntegrationNode, TelemetryLog, ProspectIntake, TriageResult } from '../types';

export const HARD_FLOOR_DOLLARS = 1200;

export const PATHWAY_LIST: PathwayItem[] = [
  {
    id: 'P1',
    title: 'Social & Video Acquisition Engine',
    tag: 'mime-your-influence',
    category: 'Acquisition',
    description: 'High-converting short-form creative, video hook scripting, automated video generation.',
    inputPayloads: [
      'Brand personality profile',
      'Hook test matrix',
      'Ayrshare scheduling params',
    ],
    endpoint: '/api/v2/satellites/p1-social-video/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P1-Social-Video',
      executionTarget: 'ShortFormVideoGenerator',
      hooks: ['Problem-Agitate-Solve', 'Curiosity Gap', 'Social Proof Proofpoint'],
      distributionChannels: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
      cadence: '14 clips / 30-day cohort',
      aiEngine: 'Gemini 3 Pro + Minimax Text-to-Video',
    },
  },
  {
    id: 'P2',
    title: 'Physical, Collateral & Print Vector Engine',
    tag: 'print-for-you',
    category: 'Physical & Collateral',
    description: 'Print-ready PDF visual layout engine, bounding box calculation, vector/raster POS bridge/print export.',
    inputPayloads: [
      'Table tent templates',
      'Billfold insert specs',
      'Print-line menu dimensions',
    ],
    endpoint: '/api/v2/satellites/p2-print-vector/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P2-Print-Vector',
      executionTarget: 'VectorLayoutRenderer',
      colorProfile: 'CMYK FOGRA39',
      cutBleedMm: 3.0,
      exportTargets: ['table_tent_double_sided.pdf', 'checkout_counter_qr.pdf'],
    },
  },
  {
    id: 'P3',
    title: 'Local Foot Traffic & Merchant Attribution',
    tag: 'local-guest-hub',
    category: 'Foot Traffic',
    description: 'Merchant marketing hub, physical attribution, prize board mechanics, local brand trier.',
    inputPayloads: [
      'Store location metadata',
      'Point of interest telemetry',
      'Foot traffic redemption triggers',
    ],
    endpoint: '/api/v2/satellites/p3-foot-traffic/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P3-Merchant-Attribution',
      executionTarget: 'ProximityEngagementHub',
      radiusMiles: 3.5,
      redemptionOffer: 'First-Visit Welcome Privilege',
      trackerBeacon: 'dynamic_qr_session',
    },
  },
  {
    id: 'P4',
    title: 'Retention & Cadence Email Outreach',
    tag: 'cold-cadence-outbound',
    category: 'Retention',
    description: 'Cold/warm outbound sequence engine, email validation & deliverability, smart drip sequences.',
    inputPayloads: [
      'Verified client leads',
      'Custom offer placeholders',
      'Automated drip templates',
    ],
    endpoint: '/api/v2/satellites/p4-retention-cadence/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P4-Retention-Cadence',
      executionTarget: 'DripCadenceConductor',
      dripCadenceDays: [0, 3, 7, 14, 21],
      warmupSafetyLimits: '25 emails/day ramp',
      conversionGoal: 'Calendar Booking / Store Visit',
    },
  },
  {
    id: 'P5',
    title: 'Commercial On-Site POS & Floor Ops',
    tag: 'restaurant-local-pos',
    category: 'Operations',
    description: 'Offline-first POS, point of sale table ordering, table QR ordering, dynamic local tax enforcement.',
    inputPayloads: [
      'Menu taxonomy',
      'Local tax tables',
      'Offline sync queues',
      'Kitchen routing rules',
    ],
    endpoint: '/api/v2/satellites/p5-floor-ops/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P5-Floor-Ops',
      executionTarget: 'LocalEdgePOSSync',
      orderRouting: 'Bar/Kitchen Split',
      taxEngine: 'Municipal + State Automatic Bracket',
      offlineBufferCapacity: '1,000 pending transactions',
    },
  },
  {
    id: 'P6',
    title: 'Local Review Shield & Interception',
    tag: 'review-interceptor',
    category: 'Defense',
    description: '2-stage Google Business Profile defense, private sentiment interception, automated positive review routing.',
    inputPayloads: [
      'GBP location ID',
      'SMS/email sentiment webhook heads',
      'Feedback routing triggers',
    ],
    endpoint: '/api/v2/satellites/p6-review-shield/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P6-Review-Shield',
      executionTarget: 'SentimentClassifierInterception',
      lowRatingThreshold: 3.5,
      divertLowRatingsTo: 'Private Internal Executive Escalation Form',
      promoteHighRatingsTo: 'Google Maps One-Click Review DeepLink',
    },
  },
  {
    id: 'P7',
    title: 'Regulated Datasets, Intake & Ledgers',
    tag: 'settlement-ledger',
    category: 'Compliance',
    description: 'Statutory form auto-validation (W9/W4/1099), ledger audit trail, strict balance validation, parseable audits.',
    inputPayloads: [
      'Financial statements',
      'Fee payload contractions',
      'Balance audit schedule',
      'Debit/credit audit memos',
    ],
    endpoint: '/api/v2/satellites/p7-regulated-ledgers/dispatch',
    dispatchPayloadSchema: {
      satellite: 'P7-Regulated-Ledgers',
      executionTarget: 'DoubleEntryAuditTrail',
      strictLedgerCheck: true,
      retentionPolicyYears: 7,
      exportFormat: 'GAAP_Accrual_JSON_v2',
    },
  },
];

export const INTEGRATIONS_LIST: IntegrationNode[] = [
  {
    id: 'gemini',
    name: 'Gemini API',
    role: 'AI Compute',
    domain: 'gemini.google.com',
    status: 'HEALTHY',
    latencyMs: 180,
    category: 'AI',
    description: 'Powering multi-modal prospect intent triage, hook scripting, and semantic categorization.',
    costModel: '$0.075 / 1M Input Tokens (Billed at direct cost pass-through)',
  },
  {
    id: 'minimax',
    name: 'Minimax',
    role: 'Video Generation',
    domain: 'api.minimax.chat',
    status: 'HEALTHY',
    latencyMs: 340,
    category: 'Video',
    description: 'Photorealistic AI video generation for short-form social hooks and localized ads.',
    costModel: '$0.08 / generation (Client pass-through)',
  },
  {
    id: 'ayrshare',
    name: 'Ayrshare',
    role: 'Social Automation',
    domain: 'app.ayrshare.com',
    status: 'HEALTHY',
    latencyMs: 112,
    category: 'Social',
    description: 'Multi-platform social API distributing scheduled video reels to Instagram, TikTok, and YouTube.',
    costModel: 'Fixed API seat pass-through ($49/client/mo)',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    role: 'SMS / Voice',
    domain: 'twilio.com',
    status: 'HEALTHY',
    latencyMs: 95,
    category: 'Communication',
    description: 'Two-way SMS review interceptor notifications, reservation confirmations, and cadence drips.',
    costModel: '$0.0079 / outbound SMS message',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    role: 'Payments',
    domain: 'stripe.com',
    status: 'HEALTHY',
    latencyMs: 84,
    category: 'Billing',
    description: 'Automated weekly ad tranche billing, retainer recurring debit, and invoice reconciliation.',
    costModel: '2.9% + 30¢ merchant processing pass-through',
  },
  {
    id: 'n8n',
    name: 'n8n',
    role: 'Workflow Automation',
    domain: 'n8n.internal',
    status: 'ACTIVE',
    latencyMs: 45,
    category: 'Workflow',
    description: 'Event broker dispatching intake payloads to respective satellite operational pipelines.',
    costModel: 'Self-hosted internal cluster ($0 pass-through)',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    role: 'Database / Auth',
    domain: 'supabase.com',
    status: 'HEALTHY',
    latencyMs: 62,
    category: 'Database',
    description: 'PostgreSQL storage for audit trails, qualified leads, and commercial agreement telemetry.',
    costModel: 'Pooled compute allocated by tenant volume',
  },
  {
    id: 'gbp',
    name: 'Google Business Profile',
    role: 'Reputation',
    domain: 'business.google.com',
    status: 'PENDING',
    latencyMs: 210,
    category: 'Reputation',
    description: 'Direct OAuth sync for review monitoring, location verification, and 5-star review amplification.',
    costModel: 'Official Google Cloud Maps API quota',
  },
];

export const INITIAL_TELEMETRY_LOGS: TelemetryLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-09 21:54:02',
    level: 'info',
    message: "Triage completed for prospect 'Acme Growth Co.' - QUALIFIED",
    traceId: '003-11C8c0-R7381',
    pathway: 'P1, P3, P4',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-09 21:54:02',
    level: 'info',
    message: 'Pathway routing: P1, P3, P4 selected',
    traceId: '003-11C8c0-R7381',
    pathway: 'P1, P3, P4',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-09 21:54:02',
    level: 'success',
    message: 'Commercial estimate generated: $4,625/mo',
    traceId: '003-11C8c0-R7381',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-09 21:53:12',
    level: 'warn',
    message: "Prospect 'Small Biz' below $1,200 floor - redirected to self-serve",
    traceId: '002-L418a9-T6744',
  },
  {
    id: 'log-5',
    timestamp: '2026-09-09 21:51:44',
    level: 'info',
    message: 'Gemini API health check: 180 ms (OK)',
    traceId: 'SYS-CHK-01',
  },
  {
    id: 'log-6',
    timestamp: '2026-09-09 21:49:02',
    level: 'info',
    message: 'Ayrshare webhook sync completed',
    traceId: 'SYS-SYNC-44',
  },
  {
    id: 'log-7',
    timestamp: '2026-09-09 21:44:20',
    level: 'warn',
    message: 'GBP API rate limit 92% - retry queued',
    traceId: 'SYS-RATE-81',
  },
  {
    id: 'log-8',
    timestamp: '2026-09-09 21:40:00',
    level: 'system',
    message: 'System boot: GrowthEngine OS v2.4',
    traceId: 'SYS-BOOT-00',
  },
];

export const SANDBOX_PRESETS: Array<{
  name: string;
  data: ProspectIntake;
  label: string;
}> = [
  {
    name: 'Acme Growth Co.',
    label: 'Acme Growth Co. ($4,625/mo) • Multi-channel Acquisition',
    data: {
      businessName: 'Acme Growth Co.',
      industry: 'Restaurant, Hospitality & Food',
      monthlyBudget: 4625,
      primaryGoal: 'Brand awareness, foot traffic, customer retention',
      locations: 2,
      website: 'https://acmegrowth.example.com',
      channels: ['social', 'email', 'video', 'sms'],
    },
  },
  {
    name: 'Trattoria Bella',
    label: 'Trattoria Bella ($3,200/mo) • Local Merchant & POS',
    data: {
      businessName: 'Trattoria Bella',
      industry: 'Restaurant, Hospitality & Food',
      monthlyBudget: 3200,
      primaryGoal: 'Foot traffic & review defense',
      locations: 1,
      website: 'https://trattoriabella.example.com',
      channels: ['social', 'print', 'pos'],
    },
  },
  {
    name: 'Corner Micro Roasters',
    label: 'Corner Micro Roasters ($750/mo) • Below $1,200 Floor',
    data: {
      businessName: 'Corner Micro Roasters',
      industry: 'Retail & Specialty Goods',
      monthlyBudget: 750,
      primaryGoal: 'Brand awareness',
      locations: 1,
      website: 'https://cornerroaster.example.com',
      channels: ['social'],
    },
  },
  {
    name: 'Vanguard Legal Partners',
    label: 'Vanguard Legal Partners ($8,500/mo) • High-Tier Outbound & Ledgers',
    data: {
      businessName: 'Vanguard Legal Partners',
      industry: 'Legal, Financial & Regulated',
      monthlyBudget: 8500,
      primaryGoal: 'High-ticket client acquisition & compliance ledgers',
      locations: 3,
      website: 'https://vanguardlegal.example.com',
      channels: ['email', 'video', 'sms'],
    },
  },
];

// Helper to evaluate commercial triage economics & route satellite pathways
export function evaluateTriage(intake: ProspectIntake): TriageResult {
  const isQualified = intake.monthlyBudget >= HARD_FLOOR_DOLLARS;
  const budget = intake.monthlyBudget;
  const traceId = `003-${Math.random().toString(36).substring(2, 8).toUpperCase()}-R${Math.floor(1000 + Math.random() * 9000)}`;

  let operatorFeePct = 0.40;
  if (budget > 5000) operatorFeePct = 0.35;
  if (budget < 2000) operatorFeePct = 0.45;

  const operatorFee = Math.round(budget * operatorFeePct);
  const apiPassThrough = Math.round(budget * 0.12);
  const monthlyAdSpend = Math.max(0, budget - operatorFee - apiPassThrough);
  const weeklyAdSpend = Math.round(monthlyAdSpend / 4.33);

  // Satellite pathway routing determination based on industry & channels
  const routedPathways: Array<'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'> = [];
  const indLower = intake.industry.toLowerCase();
  const goalLower = intake.primaryGoal.toLowerCase();
  const channels = intake.channels.map(c => c.toLowerCase());

  if (channels.includes('social') || channels.includes('video') || goalLower.includes('awareness')) {
    routedPathways.push('P1');
  }
  if (channels.includes('print') || indLower.includes('restaurant') || indLower.includes('retail')) {
    routedPathways.push('P2');
  }
  if (goalLower.includes('foot') || goalLower.includes('traffic') || indLower.includes('hospitality') || indLower.includes('restaurant')) {
    routedPathways.push('P3');
  }
  if (channels.includes('email') || indLower.includes('legal') || indLower.includes('b2b') || goalLower.includes('retention') || goalLower.includes('outbound')) {
    routedPathways.push('P4');
  }
  if (channels.includes('pos') || (indLower.includes('restaurant') && intake.locations > 0)) {
    routedPathways.push('P5');
  }
  if (channels.includes('sms') || goalLower.includes('review') || indLower.includes('medical') || indLower.includes('restaurant')) {
    routedPathways.push('P6');
  }
  if (indLower.includes('legal') || indLower.includes('financial') || budget >= 7500) {
    routedPathways.push('P7');
  }

  // Ensure at least 2 pathways if qualified
  if (isQualified && routedPathways.length === 0) {
    routedPathways.push('P1', 'P3');
  }

  const payload: Record<string, any> = {
    intakeConductor: 'GrowthEngine OS v2.4',
    traceId,
    timestamp: new Date().toISOString(),
    organization: 'Signal P Holdings',
    prospect: {
      name: intake.businessName || 'Unnamed Prospect',
      industry: intake.industry,
      locations: intake.locations,
      website: intake.website,
      monthlyCommittedBudget: budget,
    },
    qualification: {
      status: isQualified ? 'QUALIFIED' : 'DISQUALIFIED_SELF_SERVE',
      hardFloorEnforced: HARD_FLOOR_DOLLARS,
      metHardFloor: isQualified,
      barrierReason: isQualified
        ? `Budget $${budget.toLocaleString()} exceeds hard floor $${HARD_FLOOR_DOLLARS.toLocaleString()}. Eligible for multi-agent dispatch.`
        : `Budget $${budget.toLocaleString()} is below hard floor $${HARD_FLOOR_DOLLARS.toLocaleString()}. Redirected to automated low-touch portal.`,
    },
    commercialBreakdown: isQualified
      ? {
          tier1_OperatorManagementFee: `$${operatorFee.toLocaleString()}/mo (${Math.round(operatorFeePct * 100)}%)`,
          tier2_WeeklyAdSpendTranche: `$${weeklyAdSpend.toLocaleString()}/week (Monthly Run-Rate: $${monthlyAdSpend.toLocaleString()})`,
          tier3_ApiInfrastructurePassThrough: `$${apiPassThrough.toLocaleString()}/mo (Gemini, Ayrshare, Twilio, Minimax)`,
          grossContractValue: `$${budget.toLocaleString()}/mo`,
        }
      : null,
    dispatchPayloads: isQualified
      ? routedPathways.map(pId => {
          const pInfo = PATHWAY_LIST.find(p => p.id === pId);
          return {
            pathway: pId,
            title: pInfo?.title,
            tag: pInfo?.tag,
            endpoint: pInfo?.endpoint,
            schema: pInfo?.dispatchPayloadSchema,
          };
        })
      : [],
  };

  return {
    isQualified,
    hardFloor: HARD_FLOOR_DOLLARS,
    businessName: intake.businessName || 'Unnamed Prospect',
    monthlyBudget: budget,
    industry: intake.industry,
    primaryGoal: intake.primaryGoal,
    economics: {
      operatorFee,
      operatorFeePct,
      weeklyAdSpend,
      monthlyAdSpend,
      apiPassThrough,
      totalEstimatedRetainer: budget,
    },
    routedPathways,
    payload,
    timestamp: new Date().toLocaleTimeString(),
    traceId,
    recommendation: isQualified
      ? `Allocate ${routedPathways.join(', ')} satellite agents. Deploy initial ad tranche of $${weeklyAdSpend}/wk.`
      : `Prompt user to upgrade to minimum $${HARD_FLOOR_DOLLARS} retainer or route to self-serve knowledge base.`,
  };
}
