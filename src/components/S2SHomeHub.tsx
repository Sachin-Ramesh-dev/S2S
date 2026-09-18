import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Calendar,
  Workflow,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Instagram,
  Plus,
  Compass,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Bot
} from 'lucide-react';
import { DomainId, SubViewId, S2S_DOMAINS } from '../types/navigation';
import { InstagramAccount, ScriptItem, CalendarPost } from '../types/instagram';
import { useTheme } from '../context/ThemeContext';
import { useEnvironment } from '../context/EnvironmentContext';

interface S2SHomeHubProps {
  account: InstagramAccount | null;
  scripts: ScriptItem[];
  calendar: CalendarPost[];
  onNavigate: (domain: DomainId, subView?: SubViewId) => void;
  onOpenConnectModal: () => void;
  onQuickRunAudit?: () => void;
}

export const S2SHomeHub: React.FC<S2SHomeHubProps> = ({
  account,
  scripts,
  calendar,
  onNavigate,
  onOpenConnectModal,
  onQuickRunAudit
}) => {
  const { isDark } = useTheme();
  const { isLiveMode, isDemoMode } = useEnvironment();

  // Metrics
  const followersFormatted = account
    ? (account.followersCount >= 1000000
        ? (account.followersCount / 1000000).toFixed(2) + 'M'
        : (account.followersCount / 1000).toFixed(1) + 'k')
    : '0';

  const scheduledCount = calendar.filter(c => c.status === 'scheduled').length;
  const approvedScripts = scripts.filter(s => s.status === 'approved' || s.status === 'completed').length;
  const draftsCount = scripts.filter(s => s.status === 'draft' || s.status === 'generating').length;

  return (
    <div
      id="s2s-home-hub"
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-8 ${
        isDark ? 'bg-[#0f0f13] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. HERO HEADER: Account Status & Environment Banner */}
      <div
        className={`relative p-6 sm:p-8 rounded-3xl border shadow-xl overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#181824] via-[#14141e] to-[#101016] border-[#2b2b3c]'
            : 'bg-gradient-to-br from-white via-orange-50/40 to-slate-100 border-slate-200'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EA580C]/15 text-[#EA580C] border border-[#EA580C]/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>S2S Platform Hub</span>
              </span>

              <span
                id="home-env-badge"
                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                  isLiveMode
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isLiveMode ? 'Live Production Mode' : 'Demo Sandbox Mode'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Enterprise Social Intelligence &amp; Autonomous Workflows
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Manage your closed-loop content engine: from diagnostic profile audits and competitor benchmarking to 4-act viral retention scripting, visual workflow automations, and peak-hour publishing.
            </p>
          </div>

          {/* Account Profile Card */}
          <div
            className={`w-full md:w-auto shrink-0 p-4 sm:p-5 rounded-2xl border shadow-md flex items-center justify-between md:justify-start gap-4 ${
              isDark ? 'bg-[#1b1b26] border-[#323246]' : 'bg-white border-slate-200'
            }`}
          >
            {account ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shadow-md shrink-0">
                  <div className={`w-full h-full rounded-[14px] flex items-center justify-center font-bold text-base ${
                    isDark ? 'bg-[#121218] text-white' : 'bg-white text-slate-900'
                  }`}>
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight">@{account.username}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30">
                      {followersFormatted}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {account.displayName || 'Instagram Account'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active Profile Synchronized</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-left">
                <div className="text-xs font-semibold text-zinc-400">No Instagram Profile Connected</div>
                <button
                  type="button"
                  onClick={onOpenConnectModal}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect Account</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
          <button
            id="btn-home-quick-audit"
            type="button"
            onClick={() => {
              if (onQuickRunAudit) onQuickRunAudit();
              onNavigate('strategy', 'audit');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Launch Strategy Audit</span>
          </button>

          <button
            id="btn-home-quick-scripts"
            type="button"
            onClick={() => onNavigate('content', 'scripts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-[#222230] hover:bg-[#2a2a3c] text-zinc-200 border-zinc-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span>Open 4-Act Script Studio</span>
          </button>

          <button
            id="btn-home-quick-builder"
            type="button"
            onClick={() => onNavigate('workflows', 'builder')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-[#222230] hover:bg-[#2a2a3c] text-zinc-200 border-zinc-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            <span>Workflow Node Canvas</span>
          </button>

          <button
            id="btn-home-quick-calendar"
            type="button"
            onClick={() => onNavigate('publishing', 'calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-[#222230] hover:bg-[#2a2a3c] text-zinc-200 border-zinc-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Content Calendar (18:30 Slots)</span>
          </button>

          <button
            id="btn-home-connect-meta"
            type="button"
            onClick={onOpenConnectModal}
            className={`ml-auto px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-[#181824] hover:bg-[#202030] text-emerald-300 border-emerald-600/40'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-emerald-500" />
            <span>Connect Instagram (OAuth / Key)</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRICS & KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#161620] border-[#282836]' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Account Health Score
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">
            88 <span className="text-xs font-normal opacity-70">/ 100</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Pillar distribution balanced</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#161620] border-[#282836]' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Audience Reach
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {followersFormatted}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="text-orange-400 font-semibold">+4.2%</span>
            <span>engagement rate benchmark</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#161620] border-[#282836]' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              4-Act Viral Scripts
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {scripts.length}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{approvedScripts} approved</span>
            <span>• {draftsCount} in creation</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#161620] border-[#282836]' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Scheduled at 18:30
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {scheduledCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="text-blue-400 font-semibold">Peak Window</span>
            <span>booked for upcoming days</span>
          </div>
        </div>
      </div>

      {/* 3. 7 DOMAIN EXPLORER CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Platform Core Domains</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Select any workspace to begin deep work in strategy, content creation, automations, or publishing.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">7 Domains Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {S2S_DOMAINS.map((domain) => (
            <div
              key={domain.id}
              id={`card-domain-${domain.id}`}
              onClick={() => onNavigate(domain.id, domain.defaultSubView)}
              className={`group p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between ${
                isDark
                  ? 'bg-[#15151e] hover:bg-[#1c1c28] border-[#262636] hover:border-[#EA580C]/50'
                  : 'bg-white hover:bg-orange-50/30 border-slate-200 hover:border-orange-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{domain.icon}</span>
                    <h3 className="font-bold text-base tracking-tight group-hover:text-[#EA580C] transition-colors">
                      {domain.label}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all" />
                </div>

                <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {domain.description}
                </p>

                {/* Sub-item Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {domain.subItems.map((sub) => (
                    <span
                      key={sub.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(domain.id, sub.id);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#1e1e2c] hover:bg-[#28283c] text-zinc-300 border-zinc-700/60 hover:text-white hover:border-[#EA580C]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-orange-400'
                      }`}
                    >
                      {sub.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                isDark ? 'border-zinc-800/80 text-[#EA580C]' : 'border-slate-100 text-[#EA580C]'
              }`}>
                <span>Open {domain.label}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
