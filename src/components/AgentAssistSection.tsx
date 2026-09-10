import React, { useState, useEffect, useRef } from 'react';
import { AgentSkillRole, ChatMessage, TelemetryLog } from '../types';
import Markdown from 'react-markdown';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  HelpCircle,
  Copy,
  Check,
  User,
} from 'lucide-react';

interface AgentAssistSectionProps {
  onAddLog: (log: TelemetryLog) => void;
  initialRole?: AgentSkillRole;
}

const ROLE_DEFINITIONS: Array<{
  id: AgentSkillRole;
  title: string;
  badge: string;
  description: string;
  suggestedQuestions: string[];
}> = [
  {
    id: 'conductor',
    title: 'Lead Conductor & Commercial Strategist',
    badge: 'KERNEL',
    description: 'Master gatekeeper for prospect qualification, $1,200 hard floor rules, and multi-agent dispatch.',
    suggestedQuestions: [
      'Calculate the operator margin and weekly ad spend for a $4,500/mo inbound.',
      'Explain why an $850 budget gets disqualified by the commercial gatekeeper.',
      'Recommend optimal satellite pathways for a regional dental clinic.',
    ],
  },
  {
    id: 'P1_social_video',
    title: 'P1: Social & Video Acquisition Engine',
    badge: 'P1-VIDEO',
    description: 'Specializes in short-form algorithmic hook generation, Minimax video prompts, and 14-clip cohorts.',
    suggestedQuestions: [
      'Draft 3 high-converting video hooks for a local fitness brand on TikTok/Reels.',
      'How does the 14-clip / 30-day cohort scheduling prevent audience fatigue?',
      'Format a Minimax / Veo prompt for a high-energy restaurant hero montage.',
    ],
  },
  {
    id: 'P2_print_collateral',
    title: 'P2: Physical, Collateral & Print Vector Engine',
    badge: 'P2-PRINT',
    description: 'High-resolution print vectors, localized QR codes, counter cards, and merchant POS collateral.',
    suggestedQuestions: [
      'What are the DPI and bleed tolerances for merchant counter talkers?',
      'How do we structure UTM parameters inside the dynamic QR vector codes?',
      'What call-to-action on printed table tents yields highest mobile scans?',
    ],
  },
  {
    id: 'P3_foot_traffic',
    title: 'P3: Local Foot Traffic & Merchant Attribution',
    badge: 'P3-TRAFFIC',
    description: 'Geofenced polygons, in-store dwell-time beacons, and storefront walk-in attribution analytics.',
    suggestedQuestions: [
      'What radius should be set for a dense downtown retail storefront polygon?',
      'How does dwell-time filtering separate actual shoppers from drive-by passersby?',
      'What dayparting strategy works best for lunch vs. dinner restaurant spikes?',
    ],
  },
  {
    id: 'P4_retention_email',
    title: 'P4: Retention & Cadence Email Outreach',
    badge: 'P4-OUTBOUND',
    description: 'Drip cadences (Days 0, 3, 7, 14, 21), inbox warmup limits, and re-activation sequence optimization.',
    suggestedQuestions: [
      'Draft Day 0, Day 3, and Day 7 subject lines for high-open B2B cold outreach.',
      'What are the safe daily sending limits during initial 14-day domain warmup?',
      'How do we handle re-activation of dormant leads after 90 days of silence?',
    ],
  },
  {
    id: 'P5_pos_floor',
    title: 'P5: Commercial On-Site POS & Floor Ops',
    badge: 'P5-POS',
    description: 'Square, Toast, and Clover webhooks, table turnover velocity, and floor staff incentive tracking.',
    suggestedQuestions: [
      'How can server staff incentives be tracked and linked to POS receipt promotions?',
      'What webhook payload should trigger a VIP customer profile in the CRM?',
      'How can table turnover velocity be improved during peak 7-9 PM dinner rush?',
    ],
  },
  {
    id: 'P6_review_shield',
    title: 'P6: Local Review Shield & Interception',
    badge: 'P6-DEFENSE',
    description: 'Automated post-service SMS sentiment checks, negative review quarantine, and GBP rating defense.',
    suggestedQuestions: [
      'Explain the sentiment threshold that triggers immediate manager escalation.',
      'Draft a compliant SMS message asking customers for post-service feedback.',
      'What is the standard response protocol for an unresolved 2-star Google review?',
    ],
  },
  {
    id: 'P7_compliance_ledger',
    title: 'P7: Regulated Datasets, Intake & Compliance Ledgers',
    badge: 'P7-AUDIT',
    description: 'Strict PII isolation, double-entry audit records, statutory disclosures, and regulatory boundaries.',
    suggestedQuestions: [
      'What PII scrubbing rules are applied before intake payloads touch satellite agents?',
      'How does double-entry verification ensure zero discrepancies in the ad ledger?',
      'What consent documentation is mandatory for SMS outreach in healthcare or finance?',
    ],
  },
];

export const AgentAssistSection: React.FC<AgentAssistSectionProps> = ({
  onAddLog,
  initialRole = 'conductor',
}) => {
  const [selectedRole, setSelectedRole] = useState<AgentSkillRole>(initialRole);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [inputQuery, setInputQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Initialize chat messages with role-specific greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      role: 'model',
      text: `Hello Operator. I am the **GrowthEngine OS Co-Pilot**.

I am currently initialized in the **${ROLE_DEFINITIONS[0].title}** role.

I can assist you in:
- Evaluating prospects against the strict **$1,200/mo hard floor**.
- Calculating exact operator margins, weekly ad tranches, and 12% pass-through costs.
- Formulating creative and operational specs for any of the 7 satellite pathways (**P1 through P7**).
- Troubleshooting telemetry anomalies, webhook delays, or database sync events.

Select a specialized skill module above or enter a prompt below to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pathwayFocus: 'Conductor',
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const activeRoleDef = ROLE_DEFINITIONS.find((r) => r.id === selectedRole) || ROLE_DEFINITIONS[0];

  const handleRoleChange = (newRole: AgentSkillRole) => {
    setSelectedRole(newRole);
    const def = ROLE_DEFINITIONS.find((r) => r.id === newRole) || ROLE_DEFINITIONS[0];
    setMessages((prev) => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        role: 'model',
        text: `Switched operational context to **${def.title}** (${def.badge}).\n\n*${def.description}*\n\nAsk me anything regarding this pathway's execution specs or click one of the quick starters below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pathwayFocus: def.badge,
        modelUsed: selectedModel,
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isSubmitting) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pathwayFocus: activeRoleDef.badge,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsSubmitting(true);

    // Build multi-turn history
    const historyPayload = messages.slice(-8).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          role: selectedRole,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        const assistantMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pathwayFocus: activeRoleDef.badge,
          modelUsed: data.model || selectedModel,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Add telemetry audit log
        onAddLog({
          id: `log-chat-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          level: 'info',
          message: `Agent Assist: ${activeRoleDef.badge} response generated (${data.reply.length} chars)`,
          traceId: `CHAT-${activeRoleDef.badge.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
          pathway: activeRoleDef.badge,
        });
      } else {
        throw new Error(data.error || 'Server returned an error');
      }
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Agent Dispatch Warning:** Unable to complete request via ${selectedModel}. ${err.message || 'Check server logs.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pathwayFocus: activeRoleDef.badge,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-cleared',
        role: 'model',
        text: `Conversation history cleared. Ready for new operational queries under **${activeRoleDef.title}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pathwayFocus: activeRoleDef.badge,
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="space-y-6 py-6 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              AI CO-PILOT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-Turn Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-mono flex items-center gap-2">
            <Bot className="w-7 h-7 text-[#059669]" />
            Agent Skills & Co-Pilot Assist
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] max-w-2xl">
            Multi-turn assistant equipped with Signal P Holdings commercial rules, $1,200 hard floor gating, and specialized knowledge across all 7 operational satellite pathways.
          </p>
        </div>

        {/* Model & Reset Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-white border border-[#E7E5E4] rounded-md px-2 py-1 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-[#71717A]" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs font-mono bg-transparent border-none text-[#18181B] focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep)</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-md border border-[#E7E5E4] bg-white text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F0] transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role / Pathway Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
          <span>Select Operational Agent Skill:</span>
          <span className="text-[#059669] font-semibold">{activeRoleDef.badge}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {ROLE_DEFINITIONS.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id)}
                className={`px-3 py-2 rounded-lg text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                    : 'bg-white hover:bg-[#F4F4F0] text-[#52525B] border-[#E7E5E4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase">{r.badge}</span>
                  {isSelected && <Sparkles className="w-3 h-3 text-[#059669]" />}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{r.title.split(':')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden flex flex-col h-[560px]">
        {/* Chat Thread Header */}
        <div className="px-5 py-3 border-b border-[#F0EFEA] bg-[#FAFAF8] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#059669]" />
            <span className="font-bold text-[#18181B]">{activeRoleDef.title}</span>
          </div>
          <span className="text-[#71717A] text-[11px] hidden sm:inline">
            Model: <code className="text-[#18181B]">{selectedModel}</code>
          </span>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFCFA]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4 text-[#059669]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-white border border-[#E7E5E4] text-[#27272A] shadow-2xs'
                  }`}
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-4 pb-1.5 mb-1.5 border-b border-white/10 dark:border-black/5 text-[10px] font-mono opacity-80">
                    <span className="font-semibold">
                      {isUser ? 'OPERATOR' : msg.pathwayFocus || 'AGENT'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyMessage(msg.text, index)}
                          className="hover:opacity-100 transition-opacity cursor-pointer"
                          title="Copy text"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#71717A]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="prose prose-sm max-w-none break-words font-sans text-xs sm:text-sm">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSubmitting && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-[#059669] animate-spin" />
              </div>
              <div className="bg-white border border-[#E7E5E4] rounded-xl px-4 py-2.5 text-xs font-mono text-[#71717A] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span>Evaluating operational parameters...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-[#FAFAF8] border-t border-[#F0EFEA] flex items-center gap-2 overflow-x-auto text-[11px] font-mono no-scrollbar">
          <span className="text-[#71717A] shrink-0 font-semibold">Suggested:</span>
          {activeRoleDef.suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="shrink-0 px-2.5 py-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E7E5E4] text-[#52525B] transition-colors truncate max-w-xs cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E7E5E4]">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeRoleDef.title} (e.g., margins, P1-P7 specs, prompt hooks)... [Press Enter to send]`}
              className="flex-1 resize-none rounded-lg border border-[#E7E5E4] p-2.5 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] bg-[#FAFAF8]"
            />

            <button
              id="agent-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isSubmitting}
              className="h-10 px-4 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:bg-[#D6D3D1] text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
