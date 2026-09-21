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
import { useEnvironment } from '../context/EnvironmentContext';

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
  const { isLiveMode } = useEnvironment();

  // 1. Derive actionable queues from live state
  const pendingTopics = topics.filter(
    (t) => t.status === 'pending' || !t.status || (t.status as string) === 'suggested'
  );

  const inProductionScripts = scripts.filter(
    (s) => s.status === 'draft' || s.status === 'generating'
  );

  const approvedNotScheduled = scripts.filter(
    (s) => (s.status === 'approved' || s.status === 'completed') && !calendar.some((c) => c.scriptId === s.id)
  );

  const scheduledPosts = calendar.filter((c) => c.status === 'scheduled');

  const latestAudit = audits.length > 0 ? audits[0] : null;

  // Formatted followers
  const followersFormatted = account
    ? account.followersCount >= 1000000
      ? (account.followersCount / 1000000).toFixed(2) + 'M'
      : (account.followersCount / 1000).toFixed(1) + 'k'
    : '0';

  return (
    <div
      id="s2s-home-action-center"
      className={`flex-1 overflow-y-auto p-6 md:p-10 space-y-8 ${
        isDark ? 'bg-[#131316] text-[#F5F3EC]' : 'bg-[#F8F5EE] text-[#111111]'
      }`}
    >
      {/* 1. HERO HEADER: Creative Command Center */}
      <div
        className={`relative p-8 sm:p-10 rounded-2xl border-[2.5px] border-[#171717] dark:border-[#383844] shadow-[6px_6px_0_#111111] dark:shadow-[6px_6px_0_#0A0A0D] overflow-hidden transition-all ${
          isDark ? 'bg-[#1E1E24]' : 'bg-white'
        }`}
      >
        {/* Playful Neo-Brutalist decorative stamp */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-[#171717] dark:border-[#383844] bg-[#FFD66B] text-[#111111] text-[10px] font-black uppercase font-heading shadow-[2px_2px_0_#111111] rotate-2 select-none">
          <Star className="w-3 h-3 fill-current" />
          <span>AUTONOMOUS CREATOR OS</span>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="neo-badge neo-badge-coral">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ACTION CENTER</span>
              </span>

              <span
                id="home-env-badge"
                className={`neo-badge ${isLiveMode ? 'neo-badge-mint' : 'neo-badge-yellow'}`}
              >
                <span className={`w-2 h-2 rounded-full border border-[#171717] ${isLiveMode ? 'bg-[#111111]' : 'bg-[#111111]'}`} />
                <span>{isLiveMode ? 'LIVE PRODUCTION' : 'DEMO SANDBOX'}</span>
              </span>
            </div>

            {/* Editorial Hero Title with Hand-Drawn Underline Motif */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-heading leading-[1.05] uppercase">
              GOOD MORNING.<br />
              YOUR CONTENT ENGINE<br />
              <span className="relative inline-block text-[#FF4D5A]">
                IS READY.
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#FFD66B]" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
              Clear strategic decisions, active multi-format drafts, and verified publication slots waiting in your pipeline.
            </p>

            {/* Quick-Action Command Bar (Immediate Next Actions) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('production')}
                className="neo-btn neo-btn-lavender"
              >
                <Film className="w-4 h-4" />
                <span>Continue Production</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('topics')}
                className="neo-btn neo-btn-yellow"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Review {pendingTopics.length > 0 ? `${pendingTopics.length} ` : ''}Topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="neo-btn neo-btn-mint"
              >
                <Compass className="w-4 h-4" />
                <span>Review Page Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Account Profile Card: Physical Credential Panel */}
          <div
            className={`w-full lg:w-80 shrink-0 p-5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[4px_4px_0_#111111] dark:shadow-[4px_4px_0_#0A0A0D] ${
              isDark ? 'bg-[#25252E]' : 'bg-[#FBF9F4]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF] mb-3 flex items-center justify-between font-heading">
              <span>CONNECTED TARGET</span>
              <span className="neo-badge neo-badge-mint text-[9px] py-0.5">ACTIVE</span>
            </div>

            {account ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-lg border-2 border-[#171717] bg-[#B9A7FF] flex items-center justify-center font-black text-lg text-[#111111] shrink-0 shadow-[2px_2px_0_#111111]">
                    {account.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="truncate">
                    <div className="font-black text-base tracking-tight font-heading truncate">
                      @{account.username}
                    </div>
                    <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF] truncate font-medium">
                      {account.displayName || 'Instagram Creator'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-[#171717] dark:border-[#383844] text-xs">
                  <div className="p-2 rounded-lg border border-[#171717] dark:border-[#383844] bg-white dark:bg-[#1E1E24]">
                    <div className="text-[10px] text-[#4B5563] dark:text-[#9CA3AF] font-bold uppercase">Followers</div>
                    <div className="font-black text-sm font-heading">{followersFormatted}</div>
                  </div>
                  <div className="p-2 rounded-lg border border-[#171717] dark:border-[#383844] bg-white dark:bg-[#1E1E24]">
                    <div className="text-[10px] text-[#4B5563] dark:text-[#9CA3AF] font-bold uppercase">Engagement</div>
                    <div className="font-black text-sm font-heading text-[#45D9A6]">{account.engagementRate || 3.8}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF]">No Account Connected</div>
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

        {/* 2. PRIMARY JOURNEY PIPELINE BAR */}
        <div className="mt-8 pt-6 border-t-2 border-[#171717] dark:border-[#383844]">
          <div className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-[#F5F3EC] mb-3 flex items-center justify-between font-heading">
            <span className="flex items-center gap-2">
              <span>PRIMARY JOURNEY PIPELINE</span>
              <span className="text-xs font-normal text-zinc-400">|</span>
              <span className="text-[10px] text-[#FF4D5A]">SCROLL → THINK → CREATE → PUBLISH → LEARN</span>
            </span>
            <span className="neo-badge neo-badge-yellow text-[9px] py-0.5">6 STAGES</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Step 1: Home */}
            <div
              onClick={() => onNavigate('home')}
              className="p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] bg-[#FFD66B] text-[#111111] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] cursor-pointer"
            >
              <div className="text-[10px] font-black uppercase opacity-75 font-heading">01 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>🏠</span> Home
              </div>
              <div className="text-[10px] font-bold mt-1">Action Center</div>
            </div>

            {/* Step 2: Page Audit */}
            <div
              onClick={() => onNavigate('audit')}
              className={`p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer ${
                isDark ? 'bg-[#1E1E24]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-[#4B5563] dark:text-[#9CA3AF] font-heading">02 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>🔍</span> Audit
              </div>
              <div className="text-[10px] font-bold text-[#FF4D5A] mt-1">
                {latestAudit ? `${latestAudit.scores?.overall_score || 88}/100 Health` : 'Run Diagnostic'}
              </div>
            </div>

            {/* Step 3: Topics */}
            <div
              onClick={() => onNavigate('topics')}
              className={`p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer ${
                isDark ? 'bg-[#1E1E24]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-[#4B5563] dark:text-[#9CA3AF] font-heading">03 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>💡</span> Topics
              </div>
              <div className="text-[10px] font-bold mt-1">
                {pendingTopics.length > 0 ? (
                  <span className="text-[#FF4D5A] font-black">{pendingTopics.length} Pending</span>
                ) : (
                  <span className="text-[#45D9A6] font-bold">All Approved</span>
                )}
              </div>
            </div>

            {/* Step 4: Content Production */}
            <div
              onClick={() => onNavigate('production', 'scripts')}
              className={`p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer ${
                isDark ? 'bg-[#1E1E24]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-[#4B5563] dark:text-[#9CA3AF] font-heading">04 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>🎬</span> Studio
              </div>
              <div className="text-[10px] font-bold mt-1 text-[#B9A7FF]">
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
              className={`p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer ${
                isDark ? 'bg-[#1E1E24]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-[#4B5563] dark:text-[#9CA3AF] font-heading">05 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>📅</span> Dispatch
              </div>
              <div className="text-[10px] font-bold mt-1 text-[#45D9A6]">
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
              className={`p-3.5 rounded-xl border-2 border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111111] transition-all cursor-pointer ${
                isDark ? 'bg-[#1E1E24]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-[#4B5563] dark:text-[#9CA3AF] font-heading">06 STAGE</div>
              <div className="font-black text-sm flex items-center gap-1 font-heading">
                <span>📊</span> Analytics
              </div>
              <div className="text-[10px] font-bold text-[#7CC7FF] mt-1">Hook Retention</div>
            </div>
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
            className={`p-6 rounded-2xl border-2 border-[#171717] dark:border-[#383844] shadow-[4px_4px_0_#111111] dark:shadow-[4px_4px_0_#0A0A0D] flex flex-col justify-between ${
              pendingTopics.length > 0
                ? isDark ? 'bg-[#25252E]' : 'bg-[#FBF9F4]'
                : isDark ? 'bg-[#1E1E24]' : 'bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="neo-badge neo-badge-yellow">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>TOPIC APPROVAL QUEUE</span>
                </span>
                <span className="neo-badge neo-badge-dark text-[10px]">
                  {pendingTopics.length > 0 ? `${pendingTopics.length} PENDING` : 'UP TO DATE'}
                </span>
              </div>

              {pendingTopics.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    {pendingTopics.length} Topic Ideas Waiting for Decision
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    Up next: <span className="font-bold text-[#111111] dark:text-white underline decoration-2 decoration-[#FFD66B]">"{pendingTopics[0].title}"</span>
                    {pendingTopics[0].pillar && ` (${pendingTopics[0].pillar})`}. Review strategic alignment before sending to studio production.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    All Topic Ideas Reviewed
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    No topics currently waiting for approval. Generate new AI topic angles from your latest audit or content gaps.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-[#171717] dark:border-[#383844] flex items-center justify-between">
              {pendingTopics.length > 0 ? (
                <button
                  id="cta-review-topics"
                  type="button"
                  onClick={() => onNavigate('topics')}
                  className="neo-btn neo-btn-yellow"
                >
                  <span>Review Topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="cta-generate-topics"
                  type="button"
                  onClick={() => onNavigate('topics')}
                  className="neo-btn neo-btn-secondary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Topics</span>
                </button>
              )}
              <span className="text-xs font-black uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF] font-heading">
                STAGE 03
              </span>
            </div>
          </div>

          {/* ACTION 2: Content Currently in Production */}
          <div
            className={`p-6 rounded-2xl border-2 border-[#171717] dark:border-[#383844] shadow-[4px_4px_0_#111111] dark:shadow-[4px_4px_0_#0A0A0D] flex flex-col justify-between ${
              inProductionScripts.length > 0
                ? isDark ? 'bg-[#25252E]' : 'bg-[#FBF9F4]'
                : isDark ? 'bg-[#1E1E24]' : 'bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="neo-badge neo-badge-lavender">
                  <Film className="w-3.5 h-3.5" />
                  <span>STUDIO PRODUCTION</span>
                </span>
                <span className="neo-badge neo-badge-dark text-[10px]">
                  {inProductionScripts.length > 0 ? `${inProductionScripts.length} DRAFTS` : 'CLEAR'}
                </span>
              </div>

              {inProductionScripts.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    {inProductionScripts.length} Item{inProductionScripts.length > 1 ? 's' : ''} in Active Studio Work
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    Active draft: <span className="font-bold text-[#111111] dark:text-white underline decoration-2 decoration-[#B9A7FF]">"{inProductionScripts[0].title}"</span>
                    {inProductionScripts[0].format && ` (${inProductionScripts[0].format})`}.{' '}
                    {inProductionScripts[0].format === 'Carousel'
                      ? 'Review 5-slide breakdown and generate slide mockups.'
                      : inProductionScripts[0].format === 'Image' || inProductionScripts[0].format === 'Static'
                      ? 'Refine concept prompt and generate mock image.'
                      : 'Complete the 4-act viral retention script and hook.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    No Active Drafts in Progress
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    Ready to start production on an approved topic across Reel, Carousel, or Image formats.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-[#171717] dark:border-[#383844] flex items-center justify-between">
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
                className="neo-btn neo-btn-lavender"
              >
                <span>Continue Studio Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF] font-heading">
                STAGE 04
              </span>
            </div>
          </div>

          {/* ACTION 3: Posts Ready to Schedule / Peak Window */}
          <div
            className={`p-6 rounded-2xl border-2 border-[#171717] dark:border-[#383844] shadow-[4px_4px_0_#111111] dark:shadow-[4px_4px_0_#0A0A0D] flex flex-col justify-between ${
              scheduledPosts.length === 0
                ? isDark ? 'bg-[#25252E]' : 'bg-[#FBF9F4]'
                : isDark ? 'bg-[#1E1E24]' : 'bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="neo-badge neo-badge-mint">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>DISPATCH &amp; PEAK WINDOW</span>
                </span>
                <span className="neo-badge neo-badge-dark text-[10px]">
                  {scheduledPosts.length > 0 ? `${scheduledPosts.length} SCHEDULED` : 'SLOT OPEN'}
                </span>
              </div>

              {scheduledPosts.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    Next Post: {scheduledPosts[0].title}
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    Scheduled for <span className="font-bold text-[#111111] dark:text-white underline decoration-2 decoration-[#45D9A6]">{scheduledPosts[0].scheduledDate} at {scheduledPosts[0].scheduledTime || '18:30'}</span>. Peak engagement window secured.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  <h3 className="font-black text-lg tracking-tight font-heading">
                    No Posts Scheduled for Peak Window
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                    Your upcoming 18:30 peak engagement slot is empty. Schedule an approved draft to maintain publishing consistency.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-[#171717] dark:border-[#383844] flex items-center justify-between">
              <button
                id="cta-schedule-post"
                type="button"
                onClick={() => onNavigate('publishing', 'calendar')}
                className="neo-btn neo-btn-mint"
              >
                <span>{scheduledPosts.length > 0 ? 'View Calendar' : 'Schedule Post'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF] font-heading">
                STAGE 05
              </span>
            </div>
          </div>

          {/* ACTION 4: Diagnostic Page Audit Banner */}
          <div
            className={`p-6 rounded-2xl border-2 border-[#171717] dark:border-[#383844] shadow-[4px_4px_0_#111111] dark:shadow-[4px_4px_0_#0A0A0D] flex flex-col justify-between ${
              !latestAudit
                ? isDark ? 'bg-[#25252E]' : 'bg-[#FBF9F4]'
                : isDark ? 'bg-[#1E1E24]' : 'bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="neo-badge neo-badge-coral">
                  <Compass className="w-3.5 h-3.5" />
                  <span>DIAGNOSTIC AUDIT</span>
                </span>
                {latestAudit && (
                  <span className="neo-badge neo-badge-dark text-[10px]">
                    SCORE: {latestAudit.scores?.overall_score || 88}/100
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-black text-lg tracking-tight font-heading">
                  {!latestAudit
                    ? 'Initial Diagnostic Page Audit Required'
                    : latestAudit.content_gaps && latestAudit.content_gaps.length > 0
                    ? `${latestAudit.content_gaps.length} Content Gaps Detected in Latest Audit`
                    : `Account Diagnostic Health Score: ${latestAudit.scores?.overall_score || 88}/100`}
                </h3>
                <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                  {!latestAudit
                    ? 'Run a profile audit to diagnose your content pillar distribution, competitor hooks, and viral gaps.'
                    : latestAudit.content_gaps && latestAudit.content_gaps.length > 0
                    ? `Critical gap: "${latestAudit.content_gaps[0]}". Generate targeted topic ideas to close this deficit.`
                    : 'Your content pillar distribution is healthy and aligned with audience demand.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#171717] dark:border-[#383844] flex items-center justify-between">
              <button
                id="cta-review-audit"
                type="button"
                onClick={() => {
                  if (!latestAudit && onQuickRunAudit) {
                    onQuickRunAudit();
                  }
                  onNavigate('audit');
                }}
                className="neo-btn neo-btn-coral"
              >
                <span>{!latestAudit ? 'Run Diagnostic Audit' : 'Review Audit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF] font-heading">
                STAGE 02
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
