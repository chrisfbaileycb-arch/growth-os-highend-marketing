import React, { useState, useEffect } from 'react';
import { TabType, PathwayItem, TelemetryLog } from './types';
import { PATHWAY_LIST } from './data/growthOsData';
import { Navbar } from './components/Navbar';
import { OverviewSection } from './components/OverviewSection';
import { CommandCenterSection } from './components/CommandCenterSection';
import { OperatorMatrixSection } from './components/OperatorMatrixSection';
import { AgentAssistSection } from './components/AgentAssistSection';
import { IntegrationsSection } from './components/IntegrationsSection';
import { PlaygroundSection } from './components/PlaygroundSection';
import { LogsSection } from './components/LogsSection';
import { Footer } from './components/Footer';
import { GitHubModal } from './components/GitHubModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPathway, setSelectedPathway] = useState<PathwayItem | null>(PATHWAY_LIST[0]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isGitHubConnected, setIsGitHubConnected] = useState(true);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Fetch real telemetry logs from backend SQLite database
  const refreshLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=150');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs from server:', err);
    }
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleAddLog = async (newLog: TelemetryLog) => {
    // Optimistically update UI
    setLogs((prev) => [newLog, ...prev]);

    // Persist to genuine backend SQLite database
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: newLog.level,
          message: newLog.message,
          traceId: newLog.traceId,
          pathway: newLog.pathway,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setLogs((prev) => [data.log, ...prev.filter((l) => l.id !== newLog.id)]);
        }
      }
    } catch (err) {
      console.error('Failed to persist log to server:', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to clear logs on server:', err);
      setLogs([]);
    }
  };

  const handlePathwaySelect = (pathway: PathwayItem) => {
    setSelectedPathway(pathway);
    setActiveTab('operator-matrix');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#18181B] selection:bg-[#059669]/20 selection:text-[#059669]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isGitHubConnected={isGitHubConnected}
        onToggleGitHubModal={() => setIsGitHubModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewSection
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectPathway={handlePathwaySelect}
            logs={logs}
          />
        )}

        {activeTab === 'command-center' && (
          <CommandCenterSection
            onAddLog={handleAddLog}
            isGitHubConnected={isGitHubConnected}
          />
        )}

        {activeTab === 'operator-matrix' && (
          <OperatorMatrixSection
            selectedPathway={selectedPathway}
            onAddLog={handleAddLog}
            onNavigateToChat={(pathwayId) => {
              const matched = PATHWAY_LIST.find((p) => p.id === pathwayId);
              if (matched) setSelectedPathway(matched);
              setActiveTab('agent-assist');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'agent-assist' && (
          <AgentAssistSection
            onAddLog={handleAddLog}
            initialRole={
              selectedPathway
                ? (selectedPathway.id === 'P1'
                    ? 'P1_social_video'
                    : selectedPathway.id === 'P2'
                    ? 'P2_print_collateral'
                    : selectedPathway.id === 'P3'
                    ? 'P3_foot_traffic'
                    : selectedPathway.id === 'P4'
                    ? 'P4_retention_email'
                    : selectedPathway.id === 'P5'
                    ? 'P5_pos_floor'
                    : selectedPathway.id === 'P6'
                    ? 'P6_review_shield'
                    : 'P7_compliance_ledger')
                : 'conductor'
            }
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsSection onAddLog={handleAddLog} />
        )}

        {activeTab === 'playground' && (
          <PlaygroundSection onAddLog={handleAddLog} />
        )}

        {activeTab === 'logs' && (
          <LogsSection
            logs={logs}
            onClearLogs={handleClearLogs}
            onAddLog={handleAddLog}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* GitHub Sync Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        isConnected={isGitHubConnected}
        onToggleConnection={() => setIsGitHubConnected((prev) => !prev)}
      />
    </div>
  );
}
