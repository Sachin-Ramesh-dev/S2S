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
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();

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

  // Next queued publish date
  const nextPublishDate = scheduledPosts[0]?.scheduledDate 
    ? new Date(scheduledPosts[0].scheduledDate).toLocaleDateString()
    : 'None queued';

  const lastAuditDateFormatted = latestAudit?.audit_date || 
    (latestAudit?.timestamp ? new Date(latestAudit.timestamp).toLocaleDateString() : 'Recent');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Next Recommended Action Hero Banner */}
      <div className="bg-gradient-to-r from-[#EA580C] to-[#c2410c] rounded-2xl p-6 text-white shadow-xl shadow-orange-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider text-orange-50">
            <span>Next Recommended Action</span>
            <span className="w-1 h-1 rounded-full bg-white"></span>
            <span>Step in Content Workflow</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">{nextAction.title}</h2>
          <p className="text-xs text-orange-100 font-normal leading-relaxed">
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
        <div className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDark ? 'border-[#282834]' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#EA580C]" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Audits</h3>
              </div>
              <button
                type="button"
                onClick={onRunAudit}
                className="text-xs text-[#EA580C] hover:text-orange-500 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Run Audit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {latestAudit ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}>Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}>Last Audit Date</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {lastAuditDateFormatted}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}>Health Score</span>
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {latestAudit.scores?.overall_score || 84} / 100
                  </span>
                </div>

                <div className={`p-3 rounded-xl border mt-2 ${
                  isDark ? 'bg-[#121218] border-[#252533]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Top Identified Gap
                  </div>
                  <p className={`line-clamp-2 leading-relaxed ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    {latestAudit.recommendations?.[0]?.text || 'Short-form Reels show 3.2x higher viral retention than static single images.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`text-center py-6 text-xs ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>
                <p>No audits conducted yet for @{account.username}</p>
                <button
                  type="button"
                  onClick={onRunAudit}
                  className="mt-3 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94e07] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Run First Audit
                </button>
              </div>
            )}
          </div>

          <div className={`pt-4 mt-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#282834]' : 'border-slate-100'
          }`}>
            <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Powered by Manus AI</span>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className={`text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-[#EA580C]' : 'text-slate-600 hover:text-[#EA580C]'
              }`}
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Pipeline Summary Card */}
        <div className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDark ? 'border-[#282834]' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#EA580C]" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Content Pipeline Summary</h3>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-[#9c9cb0]' : 'text-slate-400'}`}>Unified Content Stream</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Approved Topics */}
              <div
                onClick={() => onNavigateTab('topics')}
                className={`border rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-[#121218] hover:bg-[#1a1a24] border-[#262634] hover:border-[#EA580C]/50' 
                    : 'bg-slate-50 hover:bg-orange-50/40 border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{approvedTopics.length}</div>
                <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Approved Topics</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Ready to script</div>
              </div>

              {/* Scripts Ready */}
              <div
                onClick={() => onNavigateTab('scripts')}
                className={`border rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-[#121218] hover:bg-[#1a1a24] border-[#262634] hover:border-[#EA580C]/50' 
                    : 'bg-slate-50 hover:bg-orange-50/40 border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scriptsReady.length}</div>
                <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Scripts Ready</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Score ≥ 80</div>
              </div>

              {/* Scheduled Posts */}
              <div
                onClick={() => onNavigateTab('calendar')}
                className={`border rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-[#121218] hover:bg-[#1a1a24] border-[#262634] hover:border-[#EA580C]/50' 
                    : 'bg-slate-50 hover:bg-orange-50/40 border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scheduledPosts.length}</div>
                <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Scheduled Posts</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Queued on calendar</div>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#121218] border-[#252533]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}>Total Pipeline Assets</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {topics.length} topics • {scripts.length} scripts • {calendar.length} scheduled
              </span>
            </div>
          </div>

          <div className={`pt-4 mt-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#282834]' : 'border-slate-100'
          }`}>
            <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Next publish: {nextPublishDate}</span>
            <button
              type="button"
              onClick={() => onNavigateTab('scripts')}
              className={`text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-[#EA580C]' : 'text-slate-600 hover:text-[#EA580C]'
              }`}
            >
              <span>Manage Scripts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isDark ? 'text-[#a1a1aa]' : 'text-slate-400'
        }`}>Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            id="btn-quick-audit-page"
            type="button"
            onClick={onRunAudit}
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all group cursor-pointer ${
              isDark 
                ? 'bg-[#13131a] border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a]' 
                : 'bg-slate-50/70 border-slate-200 hover:border-orange-400 hover:bg-orange-50/30'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-bold transition-colors group-hover:text-[#EA580C] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Audit Page</div>
              <div className={`text-[11px] ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>Run in-depth Manus intelligence</div>
            </div>
          </button>

          <button
            id="btn-quick-generate-topics"
            type="button"
            onClick={onGenerateTopics}
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all group cursor-pointer ${
              isDark 
                ? 'bg-[#13131a] border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a]' 
                : 'bg-slate-50/70 border-slate-200 hover:border-orange-400 hover:bg-orange-50/30'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-bold transition-colors group-hover:text-[#EA580C] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Generate Topics</div>
              <div className={`text-[11px] ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>Generate fresh viral hooks</div>
            </div>
          </button>

          <button
            id="btn-quick-write-script"
            type="button"
            onClick={() => onNavigateTab('scripts')}
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all group cursor-pointer ${
              isDark 
                ? 'bg-[#13131a] border-[#282838] hover:border-[#EA580C]/50 hover:bg-[#1f1f2a]' 
                : 'bg-slate-50/70 border-slate-200 hover:border-orange-400 hover:bg-orange-50/30'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/25 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-bold transition-colors group-hover:text-[#EA580C] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Write Script</div>
              <div className={`text-[11px] ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>Draft Reel or Carousel script</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Performance Snapshot */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isDark ? 'text-[#a1a1aa]' : 'text-slate-400'
        }`}>Performance Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-[#121218] border-[#262634]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex items-center justify-between text-xs mb-1 ${
              isDark ? 'text-[#9c9cb0]' : 'text-slate-500'
            }`}>
              <span>Engagement Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{account.engagementRate}%</div>
            <div className="text-[11px] text-emerald-500 font-medium mt-1">+1.6% above category benchmark</div>
          </div>

          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-[#121218] border-[#262634]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex items-center justify-between text-xs mb-1 ${
              isDark ? 'text-[#9c9cb0]' : 'text-slate-500'
            }`}>
              <span>Follower Growth</span>
              <CheckCircle2 className="w-4 h-4 text-[#EA580C]" />
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>+3.4%</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>{(account.followersCount).toLocaleString()} total followers</div>
          </div>

          <div className={`p-4 rounded-xl border transition-colors ${
            isDark ? 'bg-[#121218] border-[#262634]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex items-center justify-between text-xs mb-1 ${
              isDark ? 'text-[#9c9cb0]' : 'text-slate-500'
            }`}>
              <span>Top Performing Post Type</span>
              <Play className="w-4 h-4 text-blue-500" />
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reels (30-45s)</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-[#9c9cb0]' : 'text-slate-500'}`}>4.2x higher shares than carousels</div>
          </div>
        </div>
      </div>
    </div>
  );
};
