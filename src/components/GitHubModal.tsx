import React, { useState } from 'react';
import { Github, CheckCircle2, GitBranch, GitCommit, RefreshCw, X, ExternalLink } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onToggleConnection: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onToggleConnection,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Just now');

  if (!isOpen) return null;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E7E5E4] shadow-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-[#18181B]" />
            <h2 className="text-sm font-bold text-[#18181B] font-mono">
              GitHub Repository Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-emerald-900 font-mono">
                  CONNECTED & SYNCED
                </span>
                <p className="text-emerald-700">
                  GrowthEngine OS is synchronized with Signal P Holdings deployment pipeline.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#FBFBF9] border border-[#E7E5E4] flex items-center justify-between">
                <span className="text-[#71717A]">Repository</span>
                <span className="font-bold text-[#18181B]">signal-p-holdings/growthengine-os</span>
              </div>

              <div className="p-2.5 rounded bg-[#FBFBF9] border border-[#E7E5E4] flex items-center justify-between">
                <span className="text-[#71717A] flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Branch</span>
                </span>
                <span className="font-bold text-[#18181B]">main (production)</span>
              </div>

              <div className="p-2.5 rounded bg-[#FBFBF9] border border-[#E7E5E4] flex items-center justify-between">
                <span className="text-[#71717A] flex items-center gap-1">
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Latest Commit</span>
                </span>
                <span className="text-[#059669] font-bold">f83b2a7</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync Repository'}</span>
              </button>

              <button
                onClick={onToggleConnection}
                className="py-2 px-3 rounded-md border border-[#E7E5E4] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-mono text-[#71717A] transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#52525B] leading-relaxed">
              Connect your GitHub repository to link automated webhook triggers, commit handoff artifacts, and keep satellite dispatch schemas versioned in code.
            </p>

            <button
              onClick={() => {
                onToggleConnection();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>Connect signal-p-holdings/growthengine-os</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
