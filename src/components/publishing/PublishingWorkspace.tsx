import React, { useState, useEffect, useCallback } from 'react';
import { PublishingSubView } from '../../types/navigation';
import { InstagramAccount, CalendarPost, ScriptItem, ContentPipelineItem, TeamMember, PublicationSnapshot, PublishJobRecord } from '../../types/instagram';
import { PublishingCalendarView } from './PublishingCalendarView';
import { PublishingQueueView } from './PublishingQueueView';
import { PublicationRecordModal } from './PublicationRecordModal';
import { InstagramSwimlaneView } from '../instagram/InstagramSwimlaneView';
import { instagramApi } from '../../services/instagramApi';
import {
  Calendar as CalendarIcon,
  Kanban,
  Flag,
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ListFilter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ─── Empty Calendar Grid (no account connected) ─── */
const PublishingCalendarEmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().split('T')[0];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build the grid cells
  const cells: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    cells.push({ dayNum: d, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    cells.push({ dayNum: d, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className={`neo-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge neo-badge-lavender flex items-center gap-1.5 font-black">
              <CalendarIcon className="w-3.5 h-3.5" /> EDITORIAL DISPATCH CALENDAR
            </span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight font-display ${
            isDark ? 'text-[#F5F3EC]' : 'text-[#111111]'
          }`}>
            PUBLISHING CALENDAR
          </h1>
          <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
            isDark ? 'text-[#A1A1AA]' : 'text-[#4B5563]'
          }`}>
            Plan publishing dates, optimize for algorithm drop-off windows, and inspect frozen publication snapshots.
          </p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                : 'border-slate-300 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {monthYearStr}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                : 'border-slate-300 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                : 'border-slate-300 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Day Headers */}
        <div className="grid grid-cols-7">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className={`px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border-b ${
                isDark
                  ? 'bg-[#14141c] text-zinc-400 border-[#2b2b3c]'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            return (
              <div
                key={idx}
                className={`min-h-[90px] px-2 py-1.5 border-b border-r transition-colors ${
                  isDark ? 'border-[#2b2b3c]' : 'border-slate-100'
                } ${
                  !cell.isCurrentMonth
                    ? (isDark ? 'bg-[#111118] opacity-40' : 'bg-slate-50/50 opacity-40')
                    : (isDark ? 'bg-[#181824]' : 'bg-white')
                }`}
              >
                <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday
                    ? 'bg-[#EA580C] text-white'
                    : (isDark ? 'text-zinc-300' : 'text-slate-700')
                }`}>
                  {cell.dayNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State Overlay */}
      <div className={`-mt-2 rounded-2xl border p-8 text-center ${
        isDark ? 'bg-[#14141c] border-[#2b2b3c]' : 'bg-slate-50 border-slate-200'
      }`}>
        <CalendarIcon className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
        <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          No Scheduled Content
        </h3>
        <p className={`text-xs mb-4 max-w-sm mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Connect an Instagram account from the top bar to start scheduling and publishing content from your production pipeline.
        </p>
        <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 ${
          isDark
            ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
            : 'border-orange-300 text-orange-700 bg-orange-50'
        }`}>
          <Plus className="w-3.5 h-3.5" />
          Schedule Content
        </div>
      </div>
    </div>
  );
};

interface PublishingWorkspaceProps {
  activeSubView: PublishingSubView;
  onSubViewChange: (sub: PublishingSubView) => void;
  account: InstagramAccount | null;
  calendar: CalendarPost[];
  scripts: ScriptItem[];
  pipeline: ContentPipelineItem[];
  onOpenScript: (scriptId: string) => void;
  onNavigateToScripts: () => void;
  onPostUpdated?: () => void;
  onSaveScript?: (scriptId: string, updates: Partial<ScriptItem>) => Promise<void>;
}

export const PublishingWorkspace: React.FC<PublishingWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  account,
  calendar,
  scripts,
  pipeline,
  onOpenScript,
  onNavigateToScripts,
  onPostUpdated,
  onSaveScript
}) => {
  const { isDark } = useTheme();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [snapshots, setSnapshots] = useState<PublicationSnapshot[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJobRecord[]>([]);

  // Publication Record Detail Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecordPost, setSelectedRecordPost] = useState<CalendarPost | null>(null);
  const [selectedRecordSnapshot, setSelectedRecordSnapshot] = useState<PublicationSnapshot | null>(null);
  const [selectedRecordJob, setSelectedRecordJob] = useState<PublishJobRecord | null>(null);

  // Load publication snapshots
  const loadSnapshots = useCallback(async () => {
    try {
      const res = await instagramApi.getPublicationSnapshots(account?.id);
      if (Array.isArray(res)) {
        setSnapshots(res);
      }
    } catch (e) {
      console.warn('Could not load publication snapshots:', e);
    }
  }, [account?.id]);

  // Load publish jobs (Phase 5C)
  const loadPublishJobs = useCallback(async () => {
    try {
      const jobs = await instagramApi.getPublishJobs(account?.id);
      if (Array.isArray(jobs)) {
        setPublishJobs(jobs);
      }
    } catch (e) {
      console.warn('Could not load publish jobs:', e);
    }
  }, [account?.id]);

  useEffect(() => {
    loadSnapshots();
    loadPublishJobs();
    instagramApi.getTeamMembers().then((members) => {
      if (Array.isArray(members)) setTeamMembers(members);
    }).catch((err) => console.warn('Could not load team members:', err));
  }, [loadSnapshots, loadPublishJobs]);

  const handleOpenRecord = (post: CalendarPost, snapshot: PublicationSnapshot | null) => {
    const snap = snapshot || snapshots.find(s => s.id === post.publicationSnapshotId) || post.snapshot || null;
    setSelectedRecordPost(post);
    setSelectedRecordSnapshot(snap);
    const job = publishJobs.find(j => j.calendarPostId === post.id || (snap && j.publicationSnapshotId === snap.id)) || null;
    setSelectedRecordJob(job);
    setIsRecordModalOpen(true);
  };

  const handleCloseRecord = () => {
    setIsRecordModalOpen(false);
    setSelectedRecordPost(null);
    setSelectedRecordSnapshot(null);
    setSelectedRecordJob(null);
  };

  // Phase 5C Action Handlers
  const handlePublishNow = async (jobId: string) => {
    await instagramApi.publishNowJob(jobId);
    await Promise.all([loadSnapshots(), loadPublishJobs()]);
    if (onPostUpdated) onPostUpdated();
  };

  const handleCancelJob = async (jobId: string) => {
    await instagramApi.cancelPublishJob(jobId);
    await Promise.all([loadSnapshots(), loadPublishJobs()]);
    if (onPostUpdated) onPostUpdated();
  };

  const handleRetryJob = async (jobId: string) => {
    await instagramApi.retryPublishJob(jobId);
    await Promise.all([loadSnapshots(), loadPublishJobs()]);
    if (onPostUpdated) onPostUpdated();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Publishing Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Publishing Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30">
          <button
            id="subnav-publishing-calendar"
            type="button"
            onClick={() => onSubViewChange('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'calendar'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            id="subnav-publishing-queue"
            type="button"
            onClick={() => onSubViewChange('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'queue'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Queue &amp; Monitor</span>
          </button>

          <button
            id="subnav-publishing-swimlane"
            type="button"
            onClick={() => onSubViewChange('swimlane')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'swimlane'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Swimlane</span>
          </button>

          <button
            id="subnav-publishing-campaigns"
            type="button"
            onClick={() => onSubViewChange('campaigns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'campaigns'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Campaigns</span>
          </button>

          <button
            id="subnav-publishing-scheduler"
            type="button"
            onClick={() => onSubViewChange('scheduler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'scheduler'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduler</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubView === 'calendar' && account && (
          <PublishingCalendarView
            account={account}
            calendar={calendar}
            snapshots={snapshots}
            onOpenRecord={handleOpenRecord}
            onPostUpdated={() => {
              loadSnapshots();
              if (onPostUpdated) onPostUpdated();
            }}
          />
        )}

        {activeSubView === 'calendar' && !account && (
          <PublishingCalendarEmptyState isDark={isDark} />
        )}

        {activeSubView === 'queue' && (
          <PublishingQueueView
            account={account}
            calendar={calendar}
            snapshots={snapshots}
            publishJobs={publishJobs}
            onOpenRecord={handleOpenRecord}
            onOpenReschedule={(post) => {
              handleOpenRecord(post, null);
            }}
            onPublishNow={handlePublishNow}
            onCancelJob={handleCancelJob}
            onRetryJob={handleRetryJob}
            onRefresh={() => {
              loadSnapshots();
              loadPublishJobs();
              if (onPostUpdated) onPostUpdated();
            }}
          />
        )}

        {activeSubView === 'swimlane' && (
          <InstagramSwimlaneView
            scripts={scripts || []}
            teamMembers={teamMembers}
            onSaveScript={onSaveScript || (async (scriptId, updates) => {
              await instagramApi.updateScript(scriptId, updates);
              if (onPostUpdated) onPostUpdated();
            })}
            onOpenScriptEditor={onOpenScript || (() => {})}
          />
        )}

        {activeSubView === 'campaigns' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Multi-Post Growth Campaigns</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Group reels, carousels, and stories into unified strategic themes and product launch sprints.
                </p>
              </div>

              <button
                id="btn-new-campaign"
                type="button"
                onClick={() => alert('New Campaign sprint created! Add targeted reels & carousels.')}
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Campaign</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { title: 'RBI Compliance & Transparency Sprint', posts: '4 Posts', progress: 75, status: 'In Flight', dates: 'Oct 1 - Oct 15' },
                { title: 'AI Wealth Tech Adoption Drive', posts: '6 Posts', progress: 33, status: 'Planning', dates: 'Oct 16 - Oct 31' }
              ].map((c, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{c.dates}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">{c.posts} planned across reels &amp; carousels</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Progress</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'scheduler' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Publishing Cadence &amp; Peak Time Queue</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Configure algorithmic delivery windows to publish content when your followers are most active.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Default Peak Engagement Window</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Posts approved in 4-Act Script Studio automatically book into this slot.</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                  18:30 IST (Optimal)
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-bold">Weekday Prime</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">18:30 – 19:15</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">98% Active Audience</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-bold">Weekend Morning</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">11:00 – 12:00</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">92% Active Audience</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase font-bold">Lunch Break Slot</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">13:15 – 14:00</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">84% Active Audience</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Publication Record Detail Modal */}
      <PublicationRecordModal
        isOpen={isRecordModalOpen}
        onClose={handleCloseRecord}
        post={selectedRecordPost}
        snapshot={selectedRecordSnapshot}
        account={account}
        publishJob={selectedRecordJob}
        onPublishNow={handlePublishNow}
        onCancelJob={handleCancelJob}
        onRetryJob={handleRetryJob}
        onRescheduleClick={(post) => {
          // Open calendar view and trigger reschedule
          onSubViewChange('calendar');
        }}
      />
    </div>
  );
};

