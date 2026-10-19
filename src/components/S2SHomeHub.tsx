import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Clock,
  Instagram,
  Plus,
  Compass,
  ListFilter,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  ChevronRight,
  ShieldCheck,
  Film,
  Zap,
  Star
} from 'lucide-react';
import { DomainId, SubViewId } from '../types/navigation';
import {
  InstagramAccount,
  ScriptItem,
  CalendarPost,
  TopicIdea,
  ContentPipelineItem,
  InstagramAuditRecord
} from '../types/instagram';
import { useTheme } from '../context/ThemeContext';

interface S2SHomeHubProps {
  account: InstagramAccount | null;
  topics?: TopicIdea[];
  scripts: ScriptItem[];
  pipeline?: ContentPipelineItem[];
  calendar: CalendarPost[];
  audits?: InstagramAuditRecord[];
  onNavigate: (domain: DomainId, subView?: SubViewId) => void;
  onOpenConnectModal: () => void;
  onQuickRunAudit?: () => void;
}

export const S2SHomeHub: React.FC<S2SHomeHubProps> = ({
  account,
  topics = [],
  scripts = [],
  pipeline = [],
  calendar = [],
  audits = [],
  onNavigate,
  onOpenConnectModal,
  onQuickRunAudit
}) => {
  const { isDark } = useTheme();

  // Defensive account-scoping helper
  const matchesAccount = (itemAccountId?: string) => {
    if (!account) return true;
    if (!itemAccountId) return false;
    if (itemAccountId === account.id) return true;
    const clean = account.username.toLowerCase();
    return itemAccountId.toLowerCase().includes(clean) || itemAccountId.toLowerCase().startsWith(`ig-${clean}`);
  };

  const scopedTopics = topics.filter((t) => matchesAccount(t.accountId));
  const scopedScripts = scripts.filter((s) => matchesAccount(s.accountId));
  const scopedCalendar = calendar.filter((c) => matchesAccount(c.accountId));
  const scopedAudits = audits.filter((a) => matchesAccount(a.accountId));

  // 1. Derive actionable queues from live state
  const pendingTopics = scopedTopics.filter(
    (t) => t.status === 'pending' || !t.status || (t.status as string) === 'suggested'
  );

  const inProductionScripts = scopedScripts.filter(
    (s) => s.status === 'draft' || s.status === 'generating'
  );

  const approvedNotScheduled = scopedScripts.filter(
    (s) => (s.status === 'approved' || s.status === 'completed') && !scopedCalendar.some((c) => c.scriptId === s.id)
  );

  const scheduledPosts = scopedCalendar.filter((c) => c.status === 'scheduled');

  const latestAudit = scopedAudits.length > 0 ? scopedAudits[0] : null;

  // Formatted followers
  const followersFormatted = account
    ? account.followersCount >= 1000000
      ? (account.followersCount / 1000000).toFixed(2) + 'M'
      : (account.followersCount / 1000).toFixed(1) + 'k'
    : '0';

  // Dynamic time-of-day greeting
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div
      id="s2s-home-action-center"
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 ${
        isDark ? 'bg-[#0F0F12] text-zinc-100' : 'bg-[#F9FAFB] text-neutral-900'
      }`}
    >
      {/* 1. HERO HEADER: Creative Command Center */}
      <div
        className={`relative p-6 sm:p-8 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs transition-all ${
          isDark ? 'bg-[#18181B]' : 'bg-white'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            {/* Editorial Hero Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight font-heading leading-tight text-neutral-900 dark:text-white">
              {greeting}. Your content engine <span className="text-[#F43F5E]">is ready.</span>
            </h1>

            <p className={`text-sm leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
              Clear strategic decisions, active multi-format drafts, and verified publication slots waiting in your pipeline.
            </p>

            {/* Quick-Action Command Bar (Immediate Next Actions) */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('production')}
                className="neo-btn neo-btn-primary"
              >
                <Film className="w-4 h-4" />
                <span>Continue Production</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('topics')}
                className="neo-btn neo-btn-secondary"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Review {pendingTopics.length > 0 ? `${pendingTopics.length} ` : ''}Topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="neo-btn neo-btn-secondary"
              >
                <Compass className="w-4 h-4" />
                <span>Review Page Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Account Profile Card: Physical Credential Panel */}
          <div
            className={`w-full lg:w-80 shrink-0 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs ${
              isDark ? 'bg-zinc-900/40' : 'bg-neutral-50/70'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2.5 flex items-center justify-between font-heading">
              <span>Connected Target</span>
              <span className="neo-badge neo-badge-mint text-[9px] py-0.5">ACTIVE</span>
            </div>

            {account ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-base shrink-0">
                    {account.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="truncate">
                    <div className="font-semibold text-sm tracking-tight font-heading truncate text-neutral-900 dark:text-white">
                      @{account.username}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-zinc-400 truncate font-normal">
                      {account.displayName || 'Instagram Creator'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 dark:border-zinc-800 text-xs">
                  <div className="p-2 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                    <div className="text-[10px] text-neutral-400 dark:text-zinc-500 font-medium uppercase">Followers</div>
                    <div className="font-semibold text-sm text-neutral-900 dark:text-white">{followersFormatted}</div>
                  </div>
                  <div className="p-2 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                    <div className="text-[10px] text-neutral-400 dark:text-zinc-500 font-medium uppercase">Engagement</div>
                    <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">{account.engagementRate || 3.8}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="text-xs font-medium text-neutral-500 dark:text-zinc-400">No Account Connected</div>
                <button
                  type="button"
                  onClick={onOpenConnectModal}
                  className="neo-btn neo-btn-coral neo-btn-sm w-full"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Connect Instagram Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PRIMARY JOURNEY PIPELINE BAR (Un-nested Standalone Progress Component) */}
      <div
        className={`p-4 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs space-y-3 ${
          isDark ? 'bg-[#18181B]' : 'bg-white'
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center justify-between font-heading">
          <span className="flex items-center gap-2">
            <span>Primary Journey Pipeline</span>
          </span>
          <span className="neo-badge neo-badge-neutral text-[9px] py-0.5">6 Stages</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Step 1: Home */}
          <div
            onClick={() => onNavigate('home')}
            className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-neutral-900 dark:text-white cursor-pointer shadow-2xs"
          >
            <div className="text-[9px] font-semibold uppercase text-amber-700 dark:text-amber-400">01 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5">
              <span>🏠</span> Home
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-zinc-400 mt-1">Action Center</div>
          </div>

          {/* Step 2: Page Audit */}
          <div
            onClick={() => onNavigate('audit')}
            className={`p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${
              isDark ? 'bg-zinc-900/30' : 'bg-neutral-50/50'
            }`}
          >
            <div className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-zinc-500">02 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5 text-neutral-900 dark:text-white">
              <span>🔍</span> Audit
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {latestAudit ? `${latestAudit.scores?.overall_score || 88}/100 Health` : 'Run Diagnostic'}
            </div>
          </div>

          {/* Step 3: Topics */}
          <div
            onClick={() => onNavigate('topics')}
            className={`p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${
              isDark ? 'bg-zinc-900/30' : 'bg-neutral-50/50'
            }`}
          >
            <div className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-zinc-500">03 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5 text-neutral-900 dark:text-white">
              <span>💡</span> Topics
            </div>
            <div className="text-[10px] mt-1 font-medium">
              {pendingTopics.length > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{pendingTopics.length} Pending</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">All Approved</span>
              )}
            </div>
          </div>

          {/* Step 4: Content Production */}
          <div
            onClick={() => onNavigate('production', 'scripts')}
            className={`p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${
              isDark ? 'bg-zinc-900/30' : 'bg-neutral-50/50'
            }`}
          >
            <div className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-zinc-500">04 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5 text-neutral-900 dark:text-white">
              <span>🎬</span> Studio
            </div>
            <div className="text-[10px] mt-1 font-medium text-purple-600 dark:text-purple-400">
              {inProductionScripts.length > 0 ? (
                <span>{inProductionScripts.length} Active Drafts</span>
              ) : (
                <span>{scripts.length} Total</span>
              )}
            </div>
          </div>

          {/* Step 5: Publishing */}
          <div
            onClick={() => onNavigate('publishing', 'calendar')}
            className={`p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${
              isDark ? 'bg-zinc-900/30' : 'bg-neutral-50/50'
            }`}
          >
            <div className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-zinc-500">05 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5 text-neutral-900 dark:text-white">
              <span>📅</span> Dispatch
            </div>
            <div className="text-[10px] mt-1 font-medium text-emerald-600 dark:text-emerald-400">
              {scheduledPosts.length > 0 ? (
                <span>{scheduledPosts.length} Scheduled</span>
              ) : (
                <span>Open Slots</span>
              )}
            </div>
          </div>

          {/* Step 6: Performance */}
          <div
            onClick={() => onNavigate('performance')}
            className={`p-3 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${
              isDark ? 'bg-zinc-900/30' : 'bg-neutral-50/50'
            }`}
          >
            <div className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-zinc-500">06 Stage</div>
            <div className="font-semibold text-xs flex items-center gap-1 mt-0.5 text-neutral-900 dark:text-white">
              <span>📊</span> Analytics
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-medium">Hook Retention</div>
          </div>
        </div>
      </div>

      {/* 3. ACTION CARDS: Priority Work Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight font-heading">Priority Work Queue</h2>
            <p className={`text-xs font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
              High-impact decisions and active production tasks waiting for your review.
            </p>
          </div>
          <span className="neo-badge neo-badge-mint">LIVE STATE DRIVEN</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ACTION 1: Topics Waiting for Approval */}
          <div
            className={`p-5 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors ${
              pendingTopics.length > 0
                ? isDark ? 'bg-[#18181B]' : 'bg-white'
                : isDark ? 'bg-zinc-900/40' : 'bg-neutral-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="neo-badge neo-badge-yellow">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Topic Approval Queue</span>
                </span>
                <span className="neo-badge neo-badge-neutral text-[10px]">
                  {pendingTopics.length > 0 ? `${pendingTopics.length} Pending` : 'Up to Date'}
                </span>
              </div>

              {pendingTopics.length > 0 ? (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    {pendingTopics.length} Topic Ideas Waiting for Decision
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Up next: <span className="font-medium text-neutral-900 dark:text-white underline decoration-amber-400">"{pendingTopics[0].title}"</span>
                    {pendingTopics[0].pillar && ` (${pendingTopics[0].pillar})`}. Review strategic alignment before studio production.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    All Topic Ideas Reviewed
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    No topics currently waiting for approval. Generate new AI topic angles from your latest audit or content gaps.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
              {pendingTopics.length > 0 ? (
                <button
                  id="cta-review-topics"
                  type="button"
                  onClick={() => onNavigate('topics')}
                  className="neo-btn neo-btn-yellow neo-btn-sm"
                >
                  <span>Review Topics</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  id="cta-generate-topics"
                  type="button"
                  onClick={() => onNavigate('topics')}
                  className="neo-btn neo-btn-secondary neo-btn-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>Generate Topics</span>
                </button>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                Stage 03
              </span>
            </div>
          </div>

          {/* ACTION 2: Content Currently in Production */}
          <div
            className={`p-5 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors ${
              inProductionScripts.length > 0
                ? isDark ? 'bg-[#18181B]' : 'bg-white'
                : isDark ? 'bg-zinc-900/40' : 'bg-neutral-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="neo-badge neo-badge-lavender">
                  <Film className="w-3.5 h-3.5" />
                  <span>Studio Production</span>
                </span>
                <span className="neo-badge neo-badge-neutral text-[10px]">
                  {inProductionScripts.length > 0 ? `${inProductionScripts.length} Drafts` : 'Clear'}
                </span>
              </div>

              {inProductionScripts.length > 0 ? (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    {inProductionScripts.length} Item{inProductionScripts.length > 1 ? 's' : ''} in Active Studio Work
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Active draft: <span className="font-medium text-neutral-900 dark:text-white underline decoration-purple-400">"{inProductionScripts[0].title}"</span>
                    {inProductionScripts[0].format && ` (${inProductionScripts[0].format})`}.{' '}
                    {inProductionScripts[0].format === 'Carousel'
                      ? 'Review 5-slide breakdown and generate slide mockups.'
                      : inProductionScripts[0].format === 'Image' || inProductionScripts[0].format === 'Static'
                      ? 'Refine concept prompt and generate mock image.'
                      : 'Complete the 4-act viral retention script and hook.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    No Active Drafts in Progress
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Ready to start production on an approved topic across Reel, Carousel, or Image formats.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                id="cta-continue-production"
                type="button"
                onClick={() => {
                  const active = inProductionScripts[0];
                  if (!active) {
                    onNavigate('production', 'scripts');
                    return;
                  }
                  if (active.format === 'Carousel' || active.format === 'Image' || active.format === 'Static') {
                    onNavigate('production', 'creative');
                  } else {
                    onNavigate('production', active.productionStage === 'storyboard' ? 'creative' : 'scripts');
                  }
                }}
                className="neo-btn neo-btn-lavender neo-btn-sm"
              >
                <span>Continue Studio Work</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                Stage 04
              </span>
            </div>
          </div>

          {/* ACTION 3: Posts Ready to Schedule / Peak Window */}
          <div
            className={`p-5 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors ${
              scheduledPosts.length === 0
                ? isDark ? 'bg-[#18181B]' : 'bg-white'
                : isDark ? 'bg-zinc-900/40' : 'bg-neutral-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="neo-badge neo-badge-mint">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dispatch &amp; Peak Window</span>
                </span>
                <span className="neo-badge neo-badge-neutral text-[10px]">
                  {scheduledPosts.length > 0 ? `${scheduledPosts.length} Scheduled` : 'Slot Open'}
                </span>
              </div>

              {scheduledPosts.length > 0 ? (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    Next Post: {scheduledPosts[0].title}
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Scheduled for <span className="font-medium text-neutral-900 dark:text-white underline decoration-emerald-400">{scheduledPosts[0].scheduledDate} at {scheduledPosts[0].scheduledTime || '18:30'}</span>. Peak window secured.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 mb-5">
                  <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                    No Posts Scheduled for Peak Window
                  </h3>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Your upcoming 18:30 peak engagement slot is empty. Schedule an approved draft to maintain publishing consistency.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                id="cta-schedule-post"
                type="button"
                onClick={() => onNavigate('publishing', 'calendar')}
                className="neo-btn neo-btn-mint neo-btn-sm"
              >
                <span>{scheduledPosts.length > 0 ? 'View Calendar' : 'Schedule Post'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                Stage 05
              </span>
            </div>
          </div>

          {/* ACTION 4: Diagnostic Page Audit Banner */}
          <div
            className={`p-5 rounded-xl border border-neutral-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors ${
              !latestAudit
                ? isDark ? 'bg-[#18181B]' : 'bg-white'
                : isDark ? 'bg-zinc-900/40' : 'bg-neutral-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="neo-badge neo-badge-coral">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Diagnostic Audit</span>
                </span>
                {latestAudit && (
                  <span className="neo-badge neo-badge-neutral text-[10px]">
                    Score: {latestAudit.scores?.overall_score || 88}/100
                  </span>
                )}
              </div>

              <div className="space-y-1.5 mb-5">
                <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                  {!latestAudit
                    ? 'Initial Diagnostic Page Audit Required'
                    : latestAudit.content_gaps && latestAudit.content_gaps.length > 0
                    ? `${latestAudit.content_gaps.length} Content Gaps Detected in Latest Audit`
                    : `Account Diagnostic Health Score: ${latestAudit.scores?.overall_score || 88}/100`}
                </h3>
                <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                  {!latestAudit
                    ? 'Run a profile audit to diagnose your content pillar distribution, competitor hooks, and viral gaps.'
                    : latestAudit.content_gaps && latestAudit.content_gaps.length > 0
                    ? `Critical gap: "${latestAudit.content_gaps[0]}". Generate targeted topic ideas to close this deficit.`
                    : 'Your content pillar distribution is healthy and aligned with audience demand.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                id="cta-review-audit"
                type="button"
                onClick={() => {
                  if (!latestAudit && onQuickRunAudit) {
                    onQuickRunAudit();
                  }
                  onNavigate('audit');
                }}
                className="neo-btn neo-btn-coral neo-btn-sm"
              >
                <span>{!latestAudit ? 'Run Diagnostic Audit' : 'Review Audit'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                Stage 02
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
