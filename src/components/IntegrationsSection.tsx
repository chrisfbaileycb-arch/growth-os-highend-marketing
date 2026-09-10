import React, { useState, useEffect } from 'react';
import { IntegrationNode, TelemetryLog } from '../types';
import { INTEGRATIONS_LIST } from '../data/growthOsData';
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Zap,
  DollarSign
} from 'lucide-react';

interface IntegrationsSectionProps {
  onAddLog: (log: TelemetryLog) => void;
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({ onAddLog }) => {
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INTEGRATIONS_LIST);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Fetch real persistent topology from SQLite server
  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const res = await fetch('/api/integrations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.integrations) && data.integrations.length > 0) {
            setIntegrations(data.integrations);
          }
        }
      } catch (err) {
        console.error('Failed to load integrations from API:', err);
      }
    };
    fetchTopology();
  }, []);

  const filteredNodes = integrations.filter((item) => {
    const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Real asynchronous HTTP ping to server endpoint
  const handlePing = async (node: IntegrationNode) => {
    setPingingId(node.id);

    try {
      const res = await fetch(`/api/integrations/${node.id}/ping`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.integration) {
          setIntegrations((prev) =>
            prev.map((n) => (n.id === node.id ? data.integration : n))
          );
        }
        if (data.auditLog) {
          onAddLog(data.auditLog);
        }
      }
    } catch (err) {
      console.error('Ping request failed:', err);
    } finally {
      setPingingId(null);
    }
  };

  return (
    <div className="space-y-8 py-8 px-4 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="pb-4 border-b border-[#E7E5E4] space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
          INTEGRATIONS
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
          API & Infrastructure Topology
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] max-w-2xl leading-relaxed">
          Third-party compute and delivery costs are calculated dynamically and billed as explicit pass-through line items.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {['ALL', 'HEALTHY', 'ACTIVE', 'PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#18181B] text-white font-medium'
                  : 'bg-white border border-[#E7E5E4] text-[#52525B] hover:bg-[#F4F4F0]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search API or domain..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[#E7E5E4] bg-white text-xs text-[#18181B] focus:outline-none focus:border-[#059669]"
          />
        </div>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map((item) => {
          const isHealthy = item.status === 'HEALTHY' || item.status === 'ACTIVE';
          return (
            <div
              key={item.id}
              className="p-5 rounded-lg border border-[#E7E5E4] bg-white shadow-2xs flex flex-col justify-between hover:border-[#D6D3D1] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#18181B]">
                      {item.name}
                    </h3>
                    <span className="text-xs text-[#71717A] font-mono">
                      {item.role}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                      isHealthy
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{item.status}</span>
                  </span>
                </div>

                <div className="p-2 rounded bg-[#F8F8F5] border border-[#E7E5E4] font-mono text-[11px] text-[#52525B] truncate flex items-center justify-between">
                  <span>{item.domain}</span>
                  <ExternalLink className="w-3 h-3 text-[#A1A1AA] shrink-0 ml-1" />
                </div>

                <p className="text-xs text-[#71717A] leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-2 border-t border-[#F0EFEA] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold block">
                    COST MODEL
                  </span>
                  <p className="text-[11px] font-mono text-[#059669]">
                    {item.costModel}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs font-mono text-[#71717A]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#A1A1AA]" />
                  <span>{item.latencyMs}ms</span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePing(item)}
                  disabled={pingingId === item.id}
                  className="flex items-center gap-1 text-[11px] text-[#18181B] hover:text-[#059669] font-medium cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${pingingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{pingingId === item.id ? 'Pinging' : 'Ping'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
