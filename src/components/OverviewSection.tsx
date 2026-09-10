import React from 'react';
import { TabType, PathwayItem, TelemetryLog } from '../types';
import { PATHWAY_LIST, HARD_FLOOR_DOLLARS } from '../data/growthOsData';
import { ArrowRight, Terminal, Shield, Cpu, Activity, DollarSign, Layers } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { TelemetrySparklinesSummary } from './TelemetrySparklinesSummary';

interface OverviewSectionProps {
  onNavigate: (tab: TabType) => void;
  onSelectPathway?: (pathway: PathwayItem) => void;
  logs?: TelemetryLog[];
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  onNavigate,
  onSelectPathway,
  logs,
}) => {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6 px-4">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>production • fast-api v2.4</span>
        </div>

        {/* Big Display Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#18181B] font-mono">
          GrowthEngine <span className="text-[#059669]">OS</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#52525B] leading-relaxed max-w-2xl mx-auto font-normal">
          Autonomous top-of-funnel intake conductor, qualification gatekeeper, and multi-agent dispatch engine for Signal P Holdings. Triage prospects, enforce commercial barriers, and route execution across 7 specialized operational satellite systems.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="hero-launch-command-btn"
            onClick={() => onNavigate('command-center')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs hover:shadow-sm cursor-pointer"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-view-matrix-btn"
            onClick={() => onNavigate('operator-matrix')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-[#18181B] text-xs sm:text-sm font-medium tracking-wide transition-all shadow-2xs cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#71717A]" />
            <span>View Operator Matrix</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Stats Bar */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1 */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E7E5E4] bg-white/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              HARD FLOOR GATE
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#D97706] font-mono">
              ${HARD_FLOOR_DOLLARS.toLocaleString()}
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E7E5E4] bg-white/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              ACTIVE PATHWAYS
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#18181B] font-mono">
              7
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E7E5E4] bg-white/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              API VERSION
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#18181B] font-mono">
              v2.4
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E7E5E4] bg-white/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              SYSTEM STATUS
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#059669] font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
              <span>HEALTHY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Stats Summary Panel with Sparkline Charts */}
      {logs && logs.length > 0 && (
        <div className="max-w-5xl mx-auto px-4">
          <TelemetrySparklinesSummary
            logs={logs}
            onNavigateToLogs={() => onNavigate('logs')}
          />
        </div>
      )}

      {/* 24h Telemetry Frequency Widget */}
      {logs && logs.length > 0 && (
        <div className="max-w-5xl mx-auto px-4">
          <DashboardWidget
            logs={logs}
            onNavigateToLogs={() => onNavigate('logs')}
          />
        </div>
      )}

      {/* Commercial Barrier: The $1,200 Hard Floor Gatekeeper */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#EAE8E3] text-[#52525B]">
            COMMERCIAL BARRIER
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            The ${HARD_FLOOR_DOLLARS.toLocaleString()} Hard Floor Gatekeeper
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
            Every inbound engagement requires a minimum baseline threshold of ${HARD_FLOOR_DOLLARS.toLocaleString()} to qualify for custom orchestration. Below that, prospects are redirected to self-serve workflows.
          </p>
        </div>

        {/* 3 Layer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Layer 1 */}
          <div className="p-5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs space-y-2 hover:border-[#D6D3D1] transition-colors">
            <span className="text-[11px] font-mono uppercase font-semibold text-[#059669]">
              LAYER 1
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              Operator Management Fee
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Gross margin retained commercial build/management fee for orchestration and oversight.
            </p>
          </div>

          {/* Layer 2 */}
          <div className="p-5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs space-y-2 hover:border-[#D6D3D1] transition-colors">
            <span className="text-[11px] font-mono uppercase font-semibold text-[#059669]">
              LAYER 2
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              Weekly Ad Spend Tranche
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Client-funded advertising capital broken down by weekly run-rates rather than monthly lump-sums.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs space-y-2 hover:border-[#D6D3D1] transition-colors">
            <span className="text-[11px] font-mono uppercase font-semibold text-[#059669]">
              LAYER 3
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              API & Infrastructure Pass-through
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Third-party compute costs (Gemini, Minimax, Ayrshare, Twilio, Stripe) billed at explicit pass-through line-items.
            </p>
          </div>
        </div>
      </div>

      {/* 7 Operational Execution Repositories Section */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#EAE8E3] text-[#52525B]">
            OPERATOR MATRIX
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            7 Operational Execution Repositories
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
            Based on intake talent data, the system evaluates domain fit and generates structured routing payloads to one or more of the 7 designated execution satellites.
          </p>
        </div>

        {/* 7 Pathway Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {PATHWAY_LIST.map((pathway) => (
            <div
              key={pathway.id}
              className="p-5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs flex flex-col justify-between hover:border-[#059669]/50 hover:shadow-xs transition-all cursor-pointer group"
              onClick={() => {
                if (onSelectPathway) onSelectPathway(pathway);
                onNavigate('operator-matrix');
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#18181B] group-hover:text-[#059669] transition-colors leading-snug">
                    {pathway.title}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EAE8E3] text-[#18181B] shrink-0">
                    {pathway.id}
                  </span>
                </div>

                <p className="text-xs text-[#71717A] leading-relaxed">
                  {pathway.description}
                </p>

                <div className="pt-2 border-t border-[#F0EFEA] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold block">
                    INPUT PAYLOAD
                  </span>
                  <ul className="space-y-1 text-[11px] text-[#52525B] font-mono">
                    {pathway.inputPayloads.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-medium">
                  {pathway.tag}
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform text-[#059669]">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready to triage banner */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="p-8 rounded-xl border border-[#E7E5E4] bg-white/90 text-center space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HEALTHY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            Ready to triage your first prospect?
          </h2>

          <p className="text-xs sm:text-sm text-[#71717A] max-w-xl mx-auto leading-relaxed">
            Launch the Command Center to run intake, calculate commercial economics, and generate structured dispatch payloads.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('command-center')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
            >
              <span>Open Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
