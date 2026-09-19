import React, { useState } from 'react';
import { PublishingSubView } from '../../types/navigation';
import { InstagramAccount, CalendarPost, ScriptItem, ContentPipelineItem } from '../../types/instagram';
import { InstagramCalendarView } from '../instagram/InstagramCalendarView';
import { InstagramSwimlaneView } from '../instagram/InstagramSwimlaneView';
import {
  Calendar as CalendarIcon,
  Kanban,
  Flag,
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  onPostUpdated
}) => {
  const { isDark } = useTheme();

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
          <span className="font-bold text-sm tracking-tight">Publishing Domain</span>
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
        {activeSubView === 'calendar' && (
          <InstagramCalendarView
            account={account}
            calendar={calendar}
            scripts={scripts}
            onOpenScript={onOpenScript}
            onNavigateToScripts={onNavigateToScripts}
            onPostUpdated={onPostUpdated}
          />
        )}

        {activeSubView === 'swimlane' && (
          <InstagramSwimlaneView
            scripts={scripts || []}
            teamMembers={[]}
            onSaveScript={async () => {}}
            onOpenScriptEditor={onOpenScript || (() => {})}
          />
        )}

        {activeSubView === 'campaigns' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Multi-Post Growth Campaigns</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Group reels, carousels, and stories into unified strategic themes and product launch sprints.
                </p>
              </div>

              <button
                type="button"
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
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {c.status}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{c.dates}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-white">{c.title}</h3>
                  <p className="text-xs text-zinc-400 mb-4">{c.posts} planned across reels &amp; carousels</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Progress</span>
                      <span className="font-bold text-white">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
              <h2 className="text-xl font-bold tracking-tight">Publishing Cadence &amp; Peak Time Queue</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Configure algorithmic delivery windows to publish content when your followers are most active.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Default Peak Engagement Window</h3>
                  <p className="text-xs text-zinc-400">Posts approved in 4-Act Script Studio automatically book into this slot.</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                  18:30 IST (Optimal)
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-[#13131c] border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Weekday Prime</div>
                  <div className="font-mono text-sm font-bold text-white mt-1">18:30 – 19:15</div>
                  <div className="text-[10px] text-emerald-400 mt-1">98% Active Audience</div>
                </div>
                <div className="p-3 rounded-xl bg-[#13131c] border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Weekend Morning</div>
                  <div className="font-mono text-sm font-bold text-white mt-1">11:00 – 12:00</div>
                  <div className="text-[10px] text-emerald-400 mt-1">92% Active Audience</div>
                </div>
                <div className="p-3 rounded-xl bg-[#13131c] border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Lunch Break Slot</div>
                  <div className="font-mono text-sm font-bold text-white mt-1">13:15 – 14:00</div>
                  <div className="text-[10px] text-amber-400 mt-1">84% Active Audience</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
