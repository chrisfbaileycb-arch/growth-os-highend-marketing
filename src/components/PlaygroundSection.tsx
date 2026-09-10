import React, { useState } from 'react';
import { ProspectIntake, TriageResult, TelemetryLog } from '../types';
import { HARD_FLOOR_DOLLARS, SANDBOX_PRESETS, evaluateTriage } from '../data/growthOsData';
import {
  Play,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  DollarSign,
  Radio,
  SlidersHorizontal,
  Code
} from 'lucide-react';

interface PlaygroundSectionProps {
  onAddLog: (log: TelemetryLog) => void;
}

export const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({ onAddLog }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [intake, setIntake] = useState<ProspectIntake>(SANDBOX_PRESETS[0].data);
  const [result, setResult] = useState<TriageResult | null>(() => evaluateTriage(SANDBOX_PRESETS[0].data));
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const chosen = SANDBOX_PRESETS[idx].data;
    setIntake(chosen);
    setResult(evaluateTriage(chosen));
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intake),
      });
      const data = await response.json();
      if (response.ok && data.triageResult) {
        setResult(data.triageResult);
        if (data.auditLog) {
          onAddLog(data.auditLog);
        }
      }
    } catch (err) {
      console.error('Sandbox triage failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyPayload = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#EAE8E3] text-[#52525B]">
          PLAYGROUND
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
          Triage Sandbox
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
          Test the intake conductor with sample prospect data. Run triage, inspect commercial economics, and view raw dispatch payloads.
        </p>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold block text-center">
          SELECT SAMPLE TEST SCENARIO
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SANDBOX_PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                selectedPresetIndex === idx
                  ? 'bg-[#18181B] text-white font-semibold shadow-xs'
                  : 'bg-white border border-[#E7E5E4] text-[#52525B] hover:bg-[#F4F4F0]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sandbox Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-[#E7E5E4] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <span className="text-xs font-mono uppercase text-[#18181B] font-bold">
              Adjust Intake Variables
            </span>
            <span className="text-[11px] font-mono text-[#71717A]">
              Hard Floor: ${HARD_FLOOR_DOLLARS}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#18181B] block mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={intake.businessName}
                onChange={(e) => setIntake({ ...intake, businessName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#18181B] block mb-1">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  value={intake.monthlyBudget}
                  onChange={(e) => setIntake({ ...intake, monthlyBudget: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#18181B] block mb-1">
                  Locations
                </label>
                <input
                  type="number"
                  value={intake.locations}
                  onChange={(e) => setIntake({ ...intake, locations: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#059669]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#18181B] block mb-1">
                Industry
              </label>
              <input
                type="text"
                value={intake.industry}
                onChange={(e) => setIntake({ ...intake, industry: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#18181B] block mb-1">
                Primary Goal
              </label>
              <input
                type="text"
                value={intake.primaryGoal}
                onChange={(e) => setIntake({ ...intake, primaryGoal: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-[#FBFBF9] text-xs text-[#18181B] focus:outline-none focus:border-[#059669]"
              />
            </div>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? 'Recalculating...' : 'Evaluate Commercial Gate'}
          </button>
        </div>

        {/* Sandbox Output */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-[#E7E5E4] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <span className="text-xs font-mono uppercase text-[#71717A] font-semibold">
              Sandbox Telemetry
            </span>
            <span className="text-[11px] font-mono text-[#A1A1AA]">
              {result?.traceId}
            </span>
          </div>

          {result ? (
            <div className="space-y-4">
              {/* Status */}
              <div
                className={`p-3 rounded-lg flex items-center gap-3 border ${
                  result.isQualified
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {result.isQualified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div className="text-xs">
                  <span className="font-bold font-mono uppercase">
                    {result.isQualified ? 'QUALIFIED FOR ORCHESTRATION' : 'DISQUALIFIED (BELOW FLOOR)'}
                  </span>
                  <p className="text-[11px] text-[#52525B]">
                    {result.isQualified
                      ? `Budget $${result.monthlyBudget.toLocaleString()} passes $${HARD_FLOOR_DOLLARS.toLocaleString()} floor.`
                      : `Budget $${result.monthlyBudget.toLocaleString()} fails $${HARD_FLOOR_DOLLARS.toLocaleString()} threshold.`}
                  </p>
                </div>
              </div>

              {/* Economic Summary */}
              {result.isQualified && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#F8F8F5] border border-[#E7E5E4]">
                    <span className="text-[#71717A] text-[10px] block">Operator Fee</span>
                    <span className="font-bold text-[#18181B]">${result.economics.operatorFee.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-[#F8F8F5] border border-[#E7E5E4]">
                    <span className="text-[#71717A] text-[10px] block">Weekly Ad Spend</span>
                    <span className="font-bold text-[#18181B]">${result.economics.weeklyAdSpend.toLocaleString()}/wk</span>
                  </div>
                </div>
              )}

              {/* Routed Pathways */}
              {result.isQualified && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold block">
                    ROUTED SATELLITES
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {result.routedPathways.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-[#EAE8E3] text-xs font-mono font-bold text-[#18181B]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
                    DISPATCH CONTRACT
                  </span>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#059669] hover:underline cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded bg-[#18181B] text-[#10B981] font-mono text-[11px] overflow-x-auto max-h-44 border border-neutral-800 leading-snug">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#71717A]">
              Click "Evaluate Commercial Gate" to run sandbox.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
