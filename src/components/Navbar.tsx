import React from 'react';
import { TabType } from '../types';
import { Github, CheckCircle2, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isGitHubConnected: boolean;
  onToggleGitHubModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isGitHubConnected,
  onToggleGitHubModal,
}) => {
  const tabs: { id: TabType; label: string; highlight?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'command-center', label: 'Command Center' },
    { id: 'operator-matrix', label: 'Operator Matrix' },
    { id: 'agent-assist', label: 'Agent Assist', highlight: true },
    { id: 'integrations', label: 'Integrations' },
    { id: 'playground', label: 'Playground' },
    { id: 'logs', label: 'Logs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E5E4] bg-[#FBFBF9]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand Identity */}
        <button
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-[#18181B] text-[#10B981] flex items-center justify-center shadow-xs group-hover:bg-[#059669] transition-colors">
            {/* Custom Technical Sprout Emblem */}
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V8" />
              <path d="M5 12H2a10 10 0 0 1 10-10 10 10 0 0 1 10 10h-3" />
              <circle cx="12" cy="8" r="2" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-[#18181B] font-mono">
              GrowthEngine
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#059669] font-mono">
              OS
            </span>
          </div>
        </button>

        {/* Center Tabs Navigation */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#18181B] font-semibold bg-[#EFEFEA] shadow-2xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F0]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right GitHub Action */}
        <div className="flex items-center gap-2">
          <button
            id="nav-connect-github-btn"
            onClick={onToggleGitHubModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#E7E5E4] bg-white hover:bg-[#F5F5F2] text-[#18181B] text-xs font-medium tracking-tight transition-all shadow-2xs cursor-pointer"
          >
            {isGitHubConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span className="font-mono text-[#059669]">Synced to GitHub</span>
              </>
            ) : (
              <>
                <Github className="w-3.5 h-3.5 text-[#18181B]" />
                <span>Connect GitHub</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile sub-bar for tabs */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-[#E7E5E4] bg-[#FBFBF9] no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#18181B] font-semibold bg-[#EFEFEA]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
