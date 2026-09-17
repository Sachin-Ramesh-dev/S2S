import React from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  Power
} from 'lucide-react';
import { AIConfiguration } from '../../types/instagram';

interface InstagramSchedulerViewProps {
  config: AIConfiguration;
  onRunAuditNow: () => void;
  onGenerateTopicsNow: () => void;
}

export const InstagramSchedulerView: React.FC<InstagramSchedulerViewProps> = ({
  config,
  onRunAuditNow,
  onGenerateTopicsNow
}) => {
  const jobs = [
    {
      id: 'sched-manus-audit',
      name: 'Manus AI Weekly Page Audit',
      description: 'Executes comprehensive 360° Instagram page audit, calculating health score, gaps, and competitor observations.',
      engine: 'Manus AI v2',
      schedule: config.schedulerSettings.auditFrequency === 'weekly' ? 'Every Monday at 04:00 AM UTC' : 'Configured interval',
      lastRun: '2 days ago (Completed in 4,200ms)',
      nextRun: 'In 5 days (Monday 04:00 AM UTC)',
      status: 'Active',
      action: onRunAuditNow
    },
    {
      id: 'sched-gemini-topics',
      name: 'Gemini Bi-Weekly Topic Generation',
      description: 'Reads latest audit gaps and active skill rules, drafting 6 viral topic concepts for editorial review.',
      engine: 'Google Gemini 2.5 Flash',
      schedule: 'Every Tuesday & Friday at 09:00 AM UTC',
      lastRun: 'Yesterday at 09:00 AM UTC (6 Topics generated)',
      nextRun: 'Tomorrow at 09:00 AM UTC',
      status: 'Active',
      action: onGenerateTopicsNow
    },
    {
      id: 'sched-daily-sync',
      name: 'Daily Post Performance & Metrics Sync',
      description: 'Synchronizes view velocity, like-to-save ratios, and reel retention curves for published content.',
      engine: 'Instagram Graph / Sync',
      schedule: 'Daily at 11:30 PM UTC',
      lastRun: 'Today at 11:30 PM UTC (Synced 14 posts)',
      nextRun: 'Today at 11:30 PM UTC',
      status: 'Active',
      action: () => alert('Daily metrics sync initiated.')
    },
    {
      id: 'sched-monthly-benchmark',
      name: 'Monthly Competitor & Niche Gap Audit',
      description: 'Deep multi-account competitor scrape discovering shifts in competitor content pillars and hooks.',
      engine: 'Manus AI Deep Research',
      schedule: '1st of every month at 02:00 AM UTC',
      lastRun: '12 days ago (Benchmarked 4 accounts)',
      nextRun: '1st of next month',
      status: 'Active',
      action: onRunAuditNow
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Power className="w-3.5 h-3.5 text-emerald-600" /> Scheduler Engine Active
            </span>
            <span className="text-xs text-gray-500">
              Background Automation: <strong className="text-gray-900">4 Workflows</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">Automated AI Task Scheduler</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Manages background execution for audits, automated topic research, and ongoing performance synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 font-mono">
            System Time: UTC
          </span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="p-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">{job.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                  {job.engine}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {job.status}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed max-w-2xl">{job.description}</p>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-600" /> Schedule: <strong className="text-gray-900">{job.schedule}</strong>
                </span>
                <span>Last Run: {job.lastRun}</span>
                <span className="text-emerald-700 font-semibold">Next: {job.nextRun}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={job.action}
                className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Play className="w-3 h-3 text-emerald-600" />
                Run Immediately
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
