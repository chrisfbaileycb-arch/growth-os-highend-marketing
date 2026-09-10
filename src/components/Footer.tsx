import React from 'react';
import { TabType } from '../types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#E7E5E4] bg-[#FBFBF9] py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E7E5E4]">
        {/* Left Brand Summary */}
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#18181B] text-[#10B981] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-emerald-400" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22V8" />
                <path d="M5 12H2a10 10 0 0 1 10-10 10 10 0 0 1 10 10h-3" />
                <circle cx="12" cy="8" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-mono font-bold text-sm tracking-tight text-[#18181B]">
              GrowthEngine <span className="text-[#059669]">OS</span>
            </span>
          </div>

          <p className="text-xs text-[#71717A] max-w-sm leading-relaxed">
            Autonomous top-of-funnel intake conductor, qualification gatekeeper, and multi-agent dispatch engine for Signal P Holdings.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="md:col-span-2 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#18181B] font-bold block">
            SYSTEM
          </span>
          <ul className="space-y-1.5 text-xs text-[#71717A]">
            <li>
              <button onClick={() => onNavigate('overview')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Overview
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('command-center')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Command Center
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('operator-matrix')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Operator Matrix
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('agent-assist')} className="hover:text-[#18181B] transition-colors cursor-pointer font-medium text-[#059669]">
                Agent Assist
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('playground')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Playground
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="md:col-span-2 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#18181B] font-bold block">
            INFRASTRUCTURE
          </span>
          <ul className="space-y-1.5 text-xs text-[#71717A]">
            <li>
              <button onClick={() => onNavigate('integrations')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Integrations
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('logs')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Logs
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('integrations')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                API Status
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('logs')} className="hover:text-[#18181B] transition-colors cursor-pointer">
                Webhooks
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div className="md:col-span-2 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#18181B] font-bold block">
            LEGAL
          </span>
          <ul className="space-y-1.5 text-xs text-[#71717A]">
            <li className="hover:text-[#18181B] cursor-pointer">Terms</li>
            <li className="hover:text-[#18181B] cursor-pointer">Privacy</li>
            <li className="hover:text-[#18181B] cursor-pointer">Security</li>
            <li className="hover:text-[#18181B] cursor-pointer">SLA</li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#A1A1AA]">
        <div>
          © 2026 Signal P Holdings. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Fast-API v2.4</span>
          <span>•</span>
          <span>7 Satellites</span>
          <span>•</span>
          <span>Hard Floor $1,200</span>
        </div>
      </div>
    </footer>
  );
};
