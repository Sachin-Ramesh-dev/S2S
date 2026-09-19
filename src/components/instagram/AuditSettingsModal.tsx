import React from 'react';
import {
  X,
  Shield,
  Bot,
  Zap,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  Cpu
} from 'lucide-react';
import { InstagramAccount, AISkillRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface AuditSettingsModalProps {
  account: InstagramAccount | null;
  activeSkill?: AISkillRecord;
  onClose: () => void;
}

export const AuditSettingsModal: React.FC<AuditSettingsModalProps> = ({
  account,
  activeSkill,
  onClose,
}) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#14141c] border-[#2c2c3c] text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#262636] bg-[#181824]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Audit Settings &amp; Data Source</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live Instagram MCP telemetry, AI pipeline configuration, and skill guardrail sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Section 1: Live Account & Data Source Connection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-orange-500">
              <Radio className="w-4 h-4" />
              <span>Live Instagram Data Source (MCP)</span>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-bold text-sm">@{account?.username || 'account'}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                    LIVE CONNECTED
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  Meta Graph API v20.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  isDark ? 'bg-[#12121a] border-[#222232]' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-zinc-400 block font-mono text-[10px]">ACCOUNT ID</span>
                  <span className="font-mono font-semibold">{account?.id || 'ig-account-default'}</span>
                </div>
                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  isDark ? 'bg-[#12121a] border-[#222232]' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-zinc-400 block font-mono text-[10px]">MCP PROTOCOL</span>
                  <span className="font-mono font-semibold">stdio / JSON-RPC 2.0</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                <span className="font-semibold block text-zinc-700 dark:text-zinc-300">Active Endpoints Monitored:</span>
                <p className="font-mono text-[10px] bg-black/5 dark:bg-black/30 p-2 rounded-lg border border-black/5 dark:border-white/5 space-y-0.5">
                  • GET /me?fields=id,username,biography,followers_count,media_count<br />
                  • GET /me/media?fields=id,caption,media_type,media_url,like_count,comments_count<br />
                  • GET /&#123;media-id&#125;/insights?metric=reach,impressions,saved,video_views
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: AI Execution Pipeline & Fallback */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-indigo-500">
              <Cpu className="w-4 h-4" />
              <span>AI Provider &amp; Fallback Architecture</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Bot className="w-4 h-4 text-emerald-500" />
                    <span>Primary: Google Gemini</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Uses Gemini 2.5 Pro with function calling directly to Instagram MCP tools. Fast, structured, and outputs standardized diagnostic metrics.
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Fallback: Manus AI</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Standby
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Autonomous browser agent fallback. Triggers automatically if Gemini MCP encounters rate limits, auth resets, or tool timeouts.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Self-Learning Guardrail Engine */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-purple-500">
              <Shield className="w-4 h-4" />
              <span>Self-Learning Guardrail Engine</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="font-bold text-xs flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-500" />
                  <span>Active Skill: {activeSkill?.name || 'Instagram Growth Strategy Skill'}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Negative audit patterns and root causes are automatically converted into engine rules to prevent repeating underperforming content formats.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-end gap-2 ${
          isDark ? 'border-[#262636] bg-[#181824]' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
