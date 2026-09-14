import React, { useState } from 'react';
import { ProspectIntake, TriageResult, TelemetryLog } from '../types';
import { HARD_FLOOR_DOLLARS, evaluateTriage, SANDBOX_PRESETS } from '../data/growthOsData';
import {
  Play,
  Copy,
  Check,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Target,
  Globe,
  MapPin,
  Radio,
  Sparkles,
  Plus,
  X,
  Code2
} from 'lucide-react';

interface CommandCenterSectionProps {
  onAddLog: (log: TelemetryLog) => void;
}

export const CommandCenterSection: React.FC<CommandCenterSectionProps> = ({
  onAddLog,
}) => {
  const [intake, setIntake] = useState<ProspectIntake>({
    businessName: 'Acme Growth Co.',
    industry: 'Restaurant, Hospitality & Food',
    monthlyBudget: 4625,
    primaryGoal: 'Brand awareness, foot traffic, retention',
    locations: 2,
    website: 'https://acmegrowth.example.com',
    channels: ['social', 'email', 'video'],
  });

  const [newChannelInput, setNewChannelInput] = useState('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastDispatchedJobId, setLastDispatchedJobId] = useState<string | null>(null);

  const handleAddChannel = () => {
    if (newChannelInput.trim() && !intake.channels.includes(newChannelInput.trim().toLowerCase())) {
      setIntake((prev) => ({
        ...prev,
        channels: [...prev.channels, newChannelInput.trim().toLowerCase()],
      }));
      setNewChannelInput('');
    }
  };

  const handleRemoveChannel = (ch: string) => {
    setIntake((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c !== ch),
    }));
  };

  // Real asynchronous HTTP request to server route /api/triage
  const handleRunTriage = async () => {
    setIsEvaluating(true);
    setDispatchedSuccess(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: intake.businessName,
          industry: intake.industry,
          monthlyBudget: Number(intake.monthlyBudget),
          primaryGoal: intake.primaryGoal,
          locations: intake.locations,
          website: intake.website,
          channels: intake.channels,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.details?.join('; ') || data.error || 'Triage validation failed on server';
        setErrorMessage(msg);
        setIsEvaluating(false);
        return;
      }

      setTriageResult(data.triageResult);
      if (data.auditLog) {
        onAddLog(data.auditLog);
      }
    } catch (err: any) {
      console.error('Triage HTTP request failed:', err);
      setErrorMessage(err.message || 'Network error connecting to backend API.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyPayload = () => {
    if (!triageResult) return;
    navigator.clipboard.writeText(JSON.stringify(triageResult.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Real asynchronous HTTP request to server route /api/workflow/dispatch
  const handleDispatch = async () => {
    if (!triageResult) return;
    setIsDispatching(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/workflow/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          triageResult,
          customNotes: `Operational dispatch initiated via Command Center for ${triageResult.businessName}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.details?.join('; ') || data.error || 'Dispatch execution failed on server';
        setErrorMessage(msg);
        setIsDispatching(false);
        return;
      }

      setDispatchedSuccess(true);
      if (data.job?.id) {
        setLastDispatchedJobId(data.job.id);
      }

      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: TelemetryLog) => onAddLog(l));
      }
    } catch (err: any) {
      console.error('Dispatch HTTP request failed:', err);
      setErrorMessage(err.message || 'Network error executing dispatch workflow.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            COMMAND CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] mt-0.5">
            Prospect Intake & Triage
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1 max-w-2xl leading-relaxed">
            Enter prospect data to calculate budget fit, determine primary and secondary pathways, and generate a structured commercial estimate with dispatch payload.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#E7E5E4] bg-white text-xs font-mono text-[#059669]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
            <span>Engine Ready</span>
          </div>
        </div>
      </div>

      {/* 4 Mini Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            HARD FLOOR
          </span>
          <div className="mt-1 text-lg font-bold text-[#D97706] font-mono">
            ${HARD_FLOOR_DOLLARS.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            PATHWAYS
          </span>
          <div className="mt-1 text-lg font-bold text-[#18181B] font-mono">
            7
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            RUNTIME
          </span>
          <div className="mt-1 text-lg font-bold text-[#059669] font-mono">
            Demo
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            INTERFACE
          </span>
          <div className="mt-1 text-lg font-bold text-[#18181B] font-mono">
            CLI
          </div>
        </div>
      </div>

      {/* Main Split: Form on Left, Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-6 p-6 rounded-xl border border-[#E7E5E4] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <span className="text-xs font-mono uppercase tracking-wider text-[#18181B] font-bold">
              Prospect Intake Form
            </span>
            <span className="text-[11px] font-mono text-[#71717A]">
              Gatekeeper: ${HARD_FLOOR_DOLLARS}/mo
            </span>
          </div>

          {/* Business Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Business Name</span>
            </label>
            <input
              type="text"
              value={intake.businessName}
              onChange={(e) => setIntake({ ...intake, businessName: e.target.value })}
              placeholder="Acme Growth Co."
              className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#059669] transition-colors"
            />
          </div>

          {/* Industry & Monthly Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18181B]">
                Industry
              </label>
              <select
                value={intake.industry}
                onChange={(e) => setIntake({ ...intake, industry: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#059669] cursor-pointer"
              >
                <option value="Restaurant, Hospitality & Food">Restaurant & Hospitality</option>
                <option value="Legal, Financial & Regulated">Legal Services & Advisory</option>
                <option value="Medical & Aesthetics">Medical & Aesthetics</option>
                <option value="Home Services & Contractors">Home Services & Construction</option>
                <option value="Luxury Retail & High-End Goods">Luxury Retail & Apparel</option>
                <option value="B2B SaaS & Tech">B2B SaaS & Infrastructure</option>
                <option value="Fitness & Wellness">Fitness & Wellness</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18181B] flex items-center justify-between">
                <span>Monthly Budget ($)</span>
                {intake.monthlyBudget < HARD_FLOOR_DOLLARS ? (
                  <span className="text-[10px] font-mono text-amber-600 font-medium">Below Floor</span>
                ) : (
                  <span className="text-[10px] font-mono text-[#059669] font-medium">Eligible</span>
                )}
              </label>
              <input
                type="number"
                value={intake.monthlyBudget}
                onChange={(e) => setIntake({ ...intake, monthlyBudget: Number(e.target.value) || 0 })}
                placeholder="2500"
                min="0"
                className={`w-full px-3 py-2 rounded-md border text-xs sm:text-sm text-[#18181B] focus:outline-none transition-colors font-mono ${
                  intake.monthlyBudget < HARD_FLOOR_DOLLARS
                    ? 'border-amber-400 bg-amber-50/40 focus:border-amber-500'
                    : 'border-[#E7E5E4] bg-[#FBFBF9] focus:border-[#059669]'
                }`}
              />
            </div>
          </div>

          {/* Primary Goal */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Primary Goal</span>
            </label>
            <input
              type="text"
              value={intake.primaryGoal}
              onChange={(e) => setIntake({ ...intake, primaryGoal: e.target.value })}
              placeholder="Brand awareness, foot traffic, customer retention..."
              className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#059669] transition-colors"
            />
          </div>

          {/* Locations & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Locations</span>
              </label>
              <input
                type="number"
                min="1"
                value={intake.locations}
                onChange={(e) => setIntake({ ...intake, locations: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#059669] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Website</span>
              </label>
              <input
                type="text"
                value={intake.website}
                onChange={(e) => setIntake({ ...intake, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs sm:text-sm text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
            </div>
          </div>

          {/* Channels Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#18181B]">
              Channels & Execution Formats
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {intake.channels.map((ch) => (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#F0EFEA] text-[#18181B] border border-[#E7E5E4]"
                >
                  <span>{ch}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(ch)}
                    className="text-[#A1A1AA] hover:text-[#18181B]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChannelInput}
                onChange={(e) => setNewChannelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChannel();
                  }
                }}
                placeholder="social, email, video, pos, print..."
                className="flex-1 px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-xs font-medium text-[#18181B] transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Run Triage Button */}
          <div className="pt-2">
            <button
              id="command-run-triage-btn"
              type="button"
              onClick={handleRunTriage}
              disabled={isEvaluating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Commercial Fit...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Triage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 p-6 rounded-xl border border-[#E7E5E4] bg-white shadow-2xs flex flex-col justify-between">
          {!triageResult ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F4F0] border border-[#E7E5E4] flex items-center justify-center text-[#A1A1AA]">
                <Radio className="w-5 h-5 text-[#A1A1AA]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#71717A]">
                  Awaiting prospect intake...
                </p>
                <p className="text-xs font-mono text-[#A1A1AA]">
                  Hard Floor: ${HARD_FLOOR_DOLLARS.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Qualification Pill Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
                <span className="text-xs font-mono uppercase tracking-wider text-[#71717A] font-semibold">
                  Triage Analysis
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  ID: {triageResult.traceId}
                </span>
              </div>

              {/* Qualification Status Alert */}
              {triageResult.isQualified ? (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-emerald-900 uppercase font-mono tracking-wider">
                      QUALIFIED • MET HARD FLOOR (${triageResult.monthlyBudget.toLocaleString()})
                    </span>
                    <p className="text-emerald-700 leading-relaxed">
                      Exceeds the ${HARD_FLOOR_DOLLARS.toLocaleString()} commercial baseline. Eligible for custom multi-agent routing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-amber-900 uppercase font-mono tracking-wider">
                      DISQUALIFIED • REDIRECTED TO SELF-SERVE
                    </span>
                    <p className="text-amber-700 leading-relaxed">
                      Budget of ${triageResult.monthlyBudget.toLocaleString()} is below the ${HARD_FLOOR_DOLLARS.toLocaleString()} minimum. Custom satellite orchestration reserved for full engagements.
                    </p>
                  </div>
                </div>
              )}

              {/* Commercial Breakdown */}
              {triageResult.isQualified && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold block">
                    COMMERCIAL RUN-RATE ECONOMICS
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded border border-[#E7E5E4] bg-[#FBFBF9]">
                      <span className="text-[#71717A] block text-[10px]">Operator Fee</span>
                      <span className="font-bold text-[#18181B] text-sm">
                        ${triageResult.economics.operatorFee.toLocaleString()}
                      </span>
                      <span className="text-[#A1A1AA] text-[10px] block">
                        ({Math.round(triageResult.economics.operatorFeePct * 100)}% Retained)
                      </span>
                    </div>

                    <div className="p-2.5 rounded border border-[#E7E5E4] bg-[#FBFBF9]">
                      <span className="text-[#71717A] block text-[10px]">Weekly Ad Tranche</span>
                      <span className="font-bold text-[#18181B] text-sm">
                        ${triageResult.economics.weeklyAdSpend.toLocaleString()}
                      </span>
                      <span className="text-[#A1A1AA] text-[10px] block">
                        (${triageResult.economics.monthlyAdSpend.toLocaleString()}/mo)
                      </span>
                    </div>

                    <div className="p-2.5 rounded border border-[#E7E5E4] bg-[#FBFBF9]">
                      <span className="text-[#71717A] block text-[10px]">API Pass-Through</span>
                      <span className="font-bold text-[#18181B] text-sm">
                        ${triageResult.economics.apiPassThrough.toLocaleString()}
                      </span>
                      <span className="text-[#A1A1AA] text-[10px] block">Direct Cost</span>
                    </div>

                    <div className="p-2.5 rounded border border-[#E7E5E4] bg-[#FBFBF9]">
                      <span className="text-[#71717A] block text-[10px]">Total Retainer</span>
                      <span className="font-bold text-[#059669] text-sm">
                        ${triageResult.economics.totalEstimatedRetainer.toLocaleString()}
                      </span>
                      <span className="text-[#A1A1AA] text-[10px] block">Monthly Gross</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Routed Execution Satellites */}
              {triageResult.isQualified && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold block">
                    ASSIGNED SATELLITE PATHWAYS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {triageResult.routedPathways.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-1 rounded bg-[#EAE8E3] text-[#18181B] font-mono font-bold text-xs border border-[#D6D3D1]"
                      >
                        {p} Active
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Machine-to-Machine Payload Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
                    DISPATCH JSON PAYLOAD
                  </span>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#059669] hover:underline cursor-pointer"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-3 h-3 text-[#059669]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-md bg-[#18181B] text-[#10B981] font-mono text-[11px] overflow-x-auto max-h-48 border border-neutral-800 leading-snug">
                  {JSON.stringify(triageResult.payload, null, 2)}
                </pre>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {triageResult.isQualified && (
                  <button
                    onClick={handleDispatch}
                    disabled={isDispatching || dispatchedSuccess}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isDispatching ? (
                      <>
                        <Radio className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Satellite Dispatch Job...</span>
                      </>
                    ) : dispatchedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Dispatched to Satellites! {lastDispatchedJobId && `(Job: ${lastDispatchedJobId})`}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch to Operational Satellites</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
