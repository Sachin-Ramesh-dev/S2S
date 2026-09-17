import React from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Wand2,
  PenTool,
  Play
} from 'lucide-react';
import {
  InstagramAccount,
  InstagramAuditRecord,
  TopicIdea,
  ContentPipelineItem,
  ScriptItem,
  CalendarPost,
  AIConfiguration,
  AISkillRecord
} from '../../types/instagram';

interface InstagramDashboardProps {
  account: InstagramAccount;
  latestAudit?: InstagramAuditRecord;
  topics: TopicIdea[];
  pipeline: ContentPipelineItem[];
  scripts: ScriptItem[];
  calendar: CalendarPost[];
  config: AIConfiguration;
  activeSkill: AISkillRecord;
  onNavigateTab: (tab: string) => void;
  onRunAudit: () => void;
  onGenerateTopics: () => void;
  onOpenSetupAssistant?: () => void;
}

export const InstagramDashboard: React.FC<InstagramDashboardProps> = ({
  account,
  latestAudit,
  topics,
  pipeline,
  scripts,
  calendar,
  onNavigateTab,
  onRunAudit,
  onGenerateTopics
}) => {
  const approvedTopics = topics.filter((t) => t.status === 'approved' || t.status === 'selected');
  const scriptsReady = scripts.filter((s) => s.status === 'ready' || s.status === 'sent_to_agency' || (s.score && s.score >= 80));
  const scheduledPosts = calendar.filter((c) => c.status === 'scheduled');
  const draftScripts = scripts.filter((s) => s.status === 'draft' || s.status === 'in_review');

  // Next obvious action determination
  let nextAction = {
    title: 'Run New Page Audit',
    subtitle: 'Scan your profile to discover viral hooks and content gaps.',
    cta: 'Run Audit',
    action: onRunAudit
  };

  if (!latestAudit) {
    nextAction = {
      title: 'Run Initial Page Audit',
      subtitle: 'Analyze @' + account.username + ' to understand what content performs best.',
      cta: 'Start Audit',
      action: onRunAudit
    };
  } else if (topics.length === 0) {
    nextAction = {
      title: 'Generate Fresh Topic Ideas',
      subtitle: 'Derive high-converting content topics from your latest audit.',
      cta: 'Generate Topics',
      action: onGenerateTopics
    };
  } else if (approvedTopics.length > 0 && draftScripts.length === 0) {
    nextAction = {
      title: 'Write Scripts from Approved Topics',
      subtitle: `${approvedTopics.length} topics are selected and waiting for scriptwriting.`,
      cta: 'Open Scripts Studio',
      action: () => onNavigateTab('scripts')
    };
  } else if (draftScripts.length > 0) {
    nextAction = {
      title: 'Polish & Score Draft Scripts',
      subtitle: `${draftScripts.length} script draft is ready for scoring and optimization.`,
      cta: 'Review Scripts',
      action: () => onNavigateTab('scripts')
    };
  } else if (scriptsReady.length > 0 && scheduledPosts.length === 0) {
    nextAction = {
      title: 'Schedule Your Ready Content',
      subtitle: `${scriptsReady.length} production scripts are ready to be scheduled on the calendar.`,
      cta: 'Open Calendar',
      action: () => onNavigateTab('calendar')
    };
  }

  return (
    <div className="space-y-6">
      {/* 1. Next Obvious Step Primary Banner */}
      <div className="bg-gradient-to-r from-[#EA580C] via-[#ea580c]/90 to-[#c2410c] rounded-2xl p-6 text-white shadow-lg border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              Next Recommended Action
            </span>
            <span className="text-xs text-orange-100 font-medium">
              Step in Content Workflow
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{nextAction.title}</h2>
          <p className="text-xs text-orange-100 mt-1 max-w-xl leading-relaxed">
            {nextAction.subtitle}
          </p>
        </div>

        <button
          id="btn-primary-next-action"
          type="button"
          onClick={nextAction.action}
          className="px-5 py-3 bg-white hover:bg-orange-50 text-[#EA580C] font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95"
        >
          <span>{nextAction.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Overview: Recent Audits & Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audits Card */}
        <div className="bg-[#181820] border border-[#282834] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#282834] mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-white">Recent Audits</h3>
              </div>
              <button
                type="button"
                onClick={onRunAudit}
                className="text-xs text-[#EA580C] hover:text-orange-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Run Audit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {latestAudit ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#9c9cb0]">Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9c9cb0]">Last Audit Date</span>
                  <span className="font-semibold text-white">{latestAudit.audit_date}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#9c9cb0]">Health Score</span>
                  <span className="font-bold text-white text-sm">
                    {latestAudit.scores?.overall_score || 84} / 100
                  </span>
                </div>

                <div className="p-3 bg-[#121218] rounded-xl border border-[#252533] mt-2">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Top Identified Gap
                  </div>
                  <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                    {latestAudit.recommendations?.[0]?.text || 'Short-form Reels show 3.2x higher viral retention than static single images.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#9c9cb0]">
                <p>No audits conducted yet for @{account.username}</p>
                <button
                  type="button"
                  onClick={onRunAudit}
                  className="mt-3 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94e07] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Run First Audit
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#282834] flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Powered by Manus AI</span>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-zinc-300 hover:text-[#EA580C] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Pipeline Summary Card */}
        <div className="bg-[#181820] border border-[#282834] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#282834] mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-white">Content Pipeline Summary</h3>
              </div>
              <span className="text-xs text-[#9c9cb0] font-medium">Unified Content Stream</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Approved Topics */}
              <div
                onClick={() => onNavigateTab('topics')}
                className="bg-[#121218] hover:bg-[#1a1a24] border border-[#262634] hover:border-[#EA580C]/50 rounded-xl p-3.5 text-center cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold text-white">{approvedTopics.length}</div>
                <div className="text-[11px] font-semibold text-zinc-300 mt-1">Approved Topics</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Ready to script</div>
              </div>

              {/* Scripts Ready */}
              <div
                onClick={() => onNavigateTab('scripts')}
                className="bg-[#121218] hover:bg-[#1a1a24] border border-[#262634] hover:border-[#EA580C]/50 rounded-xl p-3.5 text-center cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold text-white">{scriptsReady.length}</div>
                <div className="text-[11px] font-semibold text-zinc-300 mt-1">Scripts Ready</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Score ≥ 80</div>
              </div>

              {/* Scheduled Posts */}
              <div
                onClick={() => onNavigateTab('calendar')}
                className="bg-[#121218] hover:bg-[#1a1a24] border border-[#262634] hover:border-[#EA580C]/50 rounded-xl p-3.5 text-center cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold text-white">{scheduledPosts.length}</div>
                <div className="text-[11px] font-semibold text-zinc-300 mt-1">Scheduled Posts</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Queued on calendar</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#121218] rounded-xl border border-[#252533] flex items-center justify-between text-xs">
              <span className="text-[#9c9cb0]">Total Pipeline Assets</span>
              <span className="font-bold text-white">
                {topics.length} topics • {scripts.length} scripts • {calendar.length} scheduled
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#282834] flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Next publish: {scheduledPosts[0]?.scheduledDate || 'None queued'}</span>
            <button
              type="button"
              onClick={() => onNavigateTab('scripts')}
              className="text-xs text-zinc-300 hover:text-[#EA580C] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage Scripts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-[#181820] border border-[#282834] rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            id="btn-quick-audit-page"
            type="button"
            onClick={onRunAudit}
            className="p-3.5 rounded-xl border border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a] flex items-center gap-3 text-left transition-all group bg-[#13131a] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#EA580C] transition-colors">Audit Page</div>
              <div className="text-[11px] text-[#9c9cb0]">Run in-depth Manus intelligence</div>
            </div>
          </button>

          <button
            id="btn-quick-generate-topics"
            type="button"
            onClick={onGenerateTopics}
            className="p-3.5 rounded-xl border border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a] flex items-center gap-3 text-left transition-all group bg-[#13131a] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#EA580C] transition-colors">Generate Topics</div>
              <div className="text-[11px] text-[#9c9cb0]">Generate fresh viral hooks</div>
            </div>
          </button>

          <button
            id="btn-quick-write-script"
            type="button"
            onClick={() => onNavigateTab('scripts')}
            className="p-3.5 rounded-xl border border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a] flex items-center gap-3 text-left transition-all group bg-[#13131a] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#EA580C] transition-colors">Write Script</div>
              <div className="text-[11px] text-[#9c9cb0]">Draft Reel or Carousel script</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Performance Snapshot */}
      <div className="bg-[#181820] border border-[#282834] rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-3">Performance Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#121218] border border-[#262634]">
            <div className="flex items-center justify-between text-xs text-[#9c9cb0] mb-1">
              <span>Engagement Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{account.engagementRate}%</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">+1.6% above category benchmark</div>
          </div>

          <div className="p-4 rounded-xl bg-[#121218] border border-[#262634]">
            <div className="flex items-center justify-between text-xs text-[#9c9cb0] mb-1">
              <span>Follower Growth</span>
              <CheckCircle2 className="w-4 h-4 text-[#EA580C]" />
            </div>
            <div className="text-2xl font-bold text-white">+3.4%</div>
            <div className="text-[11px] text-[#9c9cb0] mt-1">{(account.followersCount).toLocaleString()} total followers</div>
          </div>

          <div className="p-4 rounded-xl bg-[#121218] border border-[#262634]">
            <div className="flex items-center justify-between text-xs text-[#9c9cb0] mb-1">
              <span>Top Performing Post Type</span>
              <Play className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">Reels (30-45s)</div>
            <div className="text-[11px] text-[#9c9cb0] mt-1">4.2x higher shares than carousels</div>
          </div>
        </div>
      </div>
    </div>
  );
};
