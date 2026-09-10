import React, { useState } from 'react';
import { PathwayItem, TelemetryLog } from '../types';
import { PATHWAY_LIST } from '../data/growthOsData';
import {
  Send,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Terminal,
  Activity,
  Code2,
  X,
  Bot
} from 'lucide-react';

interface OperatorMatrixSectionProps {
  selectedPathway?: PathwayItem | null;
  onAddLog: (log: TelemetryLog) => void;
  onNavigateToChat?: (pathwayId: string) => void;
}

export const OperatorMatrixSection: React.FC<OperatorMatrixSectionProps> = ({
  selectedPathway: initialSelected,
  onAddLog,
  onNavigateToChat,
}) => {
  const [activePathway, setActivePathway] = useState<PathwayItem>(
    initialSelected || PATHWAY_LIST[0]
  );
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const categories = ['All', 'Acquisition', 'Physical & Collateral', 'Foot Traffic', 'Retention', 'Operations', 'Defense', 'Compliance'];

  const filteredPathways = filterCategory === 'All'
    ? PATHWAY_LIST
    : PATHWAY_LIST.filter(p => p.category === filterCategory);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(activePathway.dispatchPayloadSchema, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleTestDispatch = async (pathway: PathwayItem) => {
    setDispatchedId(pathway.id);
    const traceId = `003-${Math.random().toString(36).substring(2, 8).toUpperCase()}-R${Math.floor(1000 + Math.random() * 9000)}`;

    onAddLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      level: 'info',
      message: `Test ping dispatched to ${pathway.id} (${pathway.title}) -> [${pathway.tag}]`,
      traceId,
      pathway: pathway.id,
    });

    try {
      const res = await fetch(`/api/satellites/${pathway.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: pathway.dispatchPayloadSchema,
          traceId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.auditLog) {
          onAddLog(data.auditLog);
        }
      }
    } catch (err) {
      console.error('Satellite dispatch failed:', err);
    } finally {
      setDispatchedId(null);
    }
  };

  return (
    <div className="space-y-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E7E5E4] space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
          OPERATOR MATRIX
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
          7 Operational Satellite Pathways
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] max-w-2xl leading-relaxed">
          Each pathway targets a specialized execution domain with structured handoff payloads for machine-to-machine dispatch.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
              filterCategory === cat
                ? 'bg-[#18181B] text-white font-medium'
                : 'bg-white border border-[#E7E5E4] text-[#52525B] hover:bg-[#F4F4F0]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Split view: Grid of 7 on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pathway List Cards */}
        <div className="lg:col-span-7 space-y-3">
          {filteredPathways.map((pathway) => {
            const isSelected = activePathway.id === pathway.id;
            return (
              <div
                key={pathway.id}
                onClick={() => setActivePathway(pathway)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#059669] bg-white shadow-xs ring-1 ring-[#059669]'
                    : 'border-[#E7E5E4] bg-white hover:border-[#D6D3D1] hover:bg-[#FDFDFB]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EAE8E3] text-[#18181B]">
                        {pathway.id}
                      </span>
                      <h3 className="text-sm font-bold text-[#18181B]">
                        {pathway.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                      {pathway.description}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0 font-medium">
                    {pathway.tag}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#52525B]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#A1A1AA]">PAYLOAD:</span>
                    <span>{pathway.inputPayloads.join(' • ')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestDispatch(pathway);
                    }}
                    disabled={dispatchedId === pathway.id}
                    className="flex items-center gap-1 text-[11px] text-[#059669] hover:underline font-semibold cursor-pointer"
                  >
                    {dispatchedId === pathway.id ? 'Pinging...' : 'Dispatch Test →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pathway Detail Inspector */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-[#E7E5E4] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#18181B] text-white">
                {activePathway.id}
              </span>
              <span className="text-xs font-mono uppercase text-[#71717A] font-semibold">
                Satellite Inspector
              </span>
            </div>
            <span className="text-xs font-mono text-[#059669] font-medium">
              {activePathway.tag}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#18181B]">
              {activePathway.title}
            </h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              {activePathway.description}
            </p>
          </div>

          {/* Endpoint */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold block">
              DISPATCH WEBHOOK ENDPOINT
            </span>
            <div className="p-2 rounded bg-[#F8F8F5] border border-[#E7E5E4] font-mono text-xs text-[#18181B] flex items-center justify-between">
              <span className="truncate">{activePathway.endpoint}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">POST</span>
            </div>
          </div>

          {/* Required Payloads */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold block">
              EXPECTED INPUT CONTRACT
            </span>
            <div className="space-y-1">
              {activePathway.inputPayloads.map((input, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[#FBFBF9] border border-[#E7E5E4] text-xs font-mono text-[#52525B] flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>{input}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schema JSON */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                SAMPLE DISPATCH SCHEMA
              </span>
              <button
                onClick={handleCopySchema}
                className="flex items-center gap-1 text-[11px] font-mono text-[#059669] hover:underline cursor-pointer"
              >
                {copiedSchema ? (
                  <>
                    <Check className="w-3 h-3 text-[#059669]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Schema</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-md bg-[#18181B] text-[#10B981] font-mono text-[11px] overflow-x-auto max-h-48 border border-neutral-800 leading-snug">
              {JSON.stringify(activePathway.dispatchPayloadSchema, null, 2)}
            </pre>
          </div>

          {/* Test Dispatch Button */}
          <button
            onClick={() => handleTestDispatch(activePathway)}
            disabled={dispatchedId === activePathway.id}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-[#10B981]" />
            <span>
              {dispatchedId === activePathway.id
                ? 'Emitting Machine Telemetry...'
                : `Dispatch Ping to ${activePathway.id}`}
            </span>
          </button>

          {/* Quick Co-Pilot Chat Button */}
          {onNavigateToChat && (
            <button
              onClick={() => onNavigateToChat(activePathway.id)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F4F4F0] text-[#18181B] text-xs font-semibold font-mono tracking-wide transition-all shadow-2xs cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#059669]" />
              <span>Consult Agent Assist for {activePathway.id}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
