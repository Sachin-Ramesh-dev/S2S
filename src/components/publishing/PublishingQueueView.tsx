import React, { useState } from 'react';
import {
  Clock,
  Video,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Eye,
  Edit2
} from 'lucide-react';
import { CalendarPost, PublicationSnapshot, InstagramAccount, PublishJobRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';
import { Play, X as XIcon } from 'lucide-react';

interface PublishingQueueViewProps {
  account: InstagramAccount | null;
  calendar: CalendarPost[];
  snapshots: PublicationSnapshot[];
  publishJobs?: PublishJobRecord[];
  onOpenRecord: (post: CalendarPost, snapshot: PublicationSnapshot | null) => void;
  onOpenReschedule: (post: CalendarPost) => void;
  onPublishNow?: (jobId: string) => Promise<void>;
  onCancelJob?: (jobId: string) => Promise<void>;
  onRetryJob?: (jobId: string) => Promise<void>;
  onRefresh?: () => void;
}

export type QueueFilterCategory =
  | 'all'
  | 'upcoming'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'retry_pending';

export const PublishingQueueView: React.FC<PublishingQueueViewProps> = ({
  account,
  calendar,
  snapshots,
  publishJobs,
  onOpenRecord,
  onOpenReschedule,
  onPublishNow,
  onCancelJob,
  onRetryJob,
  onRefresh
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [filterCategory, setFilterCategory] = useState<QueueFilterCategory>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Reel' | 'Carousel' | 'Image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Map each calendar post to its corresponding snapshot and publishJob
  const queueItems = calendar.map((post) => {
    const snapshot = snapshots.find(s => s.id === post.publicationSnapshotId) || post.snapshot || null;
    const job = publishJobs?.find(j => j.calendarPostId === post.id || (snapshot && j.publicationSnapshotId === snapshot.id));

    const executionStatus = (job?.executionStatus ? job.executionStatus.toLowerCase() : (snapshot?.executionStatus ? snapshot.executionStatus.toLowerCase() : (post.status === 'published' ? 'published' : post.status === 'cancelled' ? 'cancelled' : 'idle')));
    const assetStatus = snapshot?.assetStatus || 'ready';
    const scheduleStatus = (job?.scheduleStatus ? job.scheduleStatus.toLowerCase() : (snapshot?.scheduleStatus ? snapshot.scheduleStatus.toLowerCase() : (post.status === 'published' ? 'published' : post.status === 'cancelled' ? 'cancelled' : 'scheduled')));
    const timezone = post.timezone || snapshot?.timezone || 'Asia/Kolkata';

    // Compute category for filtering
    let category: QueueFilterCategory = 'upcoming';
    if (executionStatus === 'published' || post.status === 'published') {
      category = 'published';
    } else if (executionStatus === 'publishing' || executionStatus === 'validating' || executionStatus === 'verifying') {
      category = 'publishing';
    } else if (executionStatus === 'queued') {
      category = 'queued';
    } else if (executionStatus === 'failed') {
      category = 'failed';
    } else if (executionStatus === 'retry_pending' || executionStatus === 'retrying') {
      category = 'retry_pending';
    } else {
      category = 'upcoming';
    }

    return {
      post,
      snapshot,
      job,
      executionStatus,
      assetStatus,
      scheduleStatus,
      timezone,
      category
    };
  });

  // Calculate counts for each filter category
  const counts = {
    all: queueItems.length,
    upcoming: queueItems.filter(i => i.category === 'upcoming').length,
    queued: queueItems.filter(i => i.category === 'queued').length,
    publishing: queueItems.filter(i => i.category === 'publishing').length,
    published: queueItems.filter(i => i.category === 'published').length,
    failed: queueItems.filter(i => i.category === 'failed').length,
    retry_pending: queueItems.filter(i => i.category === 'retry_pending').length
  };

  const filteredItems = queueItems.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (formatFilter !== 'all' && item.post.format !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.post.title.toLowerCase().includes(q);
      const matchFormat = item.post.format.toLowerCase().includes(q);
      const matchAccount = account?.username.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchFormat && !matchAccount) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="neo-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge neo-badge-yellow flex items-center gap-1.5 font-black">
              <Clock className="w-3.5 h-3.5" /> LIVE DISPATCH MONITOR
            </span>
            <span className="text-xs font-mono font-bold text-[#4B5563] dark:text-[#A1A1AA]">
              Phase 5C Engine
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
            PUBLISHING QUEUE
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
            Monitor verified publication snapshots, scheduled delivery slots, container creation, and execution readiness.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="neo-btn neo-btn-secondary py-2.5 px-4 text-xs font-black flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {(
          [
            { id: 'all', label: 'All Records', count: counts.all },
            { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { id: 'queued', label: 'Queued', count: counts.queued },
            { id: 'publishing', label: 'Publishing', count: counts.publishing },
            { id: 'published', label: 'Published', count: counts.published },
            { id: 'failed', label: 'Failed', count: counts.failed },
            { id: 'retry_pending', label: 'Retry Pending', count: counts.retry_pending }
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            id={`filter-queue-${tab.id}`}
            type="button"
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border-2 border-[#171717] ${
              filterCategory === tab.id
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#383844]'
                : 'bg-white dark:bg-[#1A1A22] text-[#111111] dark:text-[#E4E4E7] shadow-[2px_2px_0_#111111] hover:bg-[#F8F5EE]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                filterCategory === tab.id
                  ? 'bg-[#FFD66B] text-[#111111]'
                  : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Format Bar */}
      <div className="neo-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
          <input
            id="input-search-queue"
            type="text"
            placeholder="Search by title, format, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-input w-full pl-9 pr-3 py-2 text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            id="select-format-queue"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className="neo-input px-3 py-2 text-xs font-bold"
          >
            <option value="all">All Formats</option>
            <option value="Reel">Reels</option>
            <option value="Carousel">Carousels</option>
            <option value="Image">Images</option>
          </select>
        </div>
      </div>

      {/* Queue Items Table / List */}
      {filteredItems.length === 0 ? (
        <div className="neo-card p-12 text-center space-y-3">
          <Clock className="w-10 h-10 mx-auto text-[#4B5563] dark:text-[#A1A1AA]" />
          <h3 className="font-black text-base text-[#111111] dark:text-white font-display">No Publication Records Found</h3>
          <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] max-w-sm mx-auto">
            {filterCategory === 'all'
              ? 'No items currently in the publishing queue. Schedule approved content from Production to populate.'
              : `No publications matching status "${filterCategory}".`}
          </p>
        </div>
      ) : (
        <div className="neo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#171717] dark:border-[#383844] text-[10px] uppercase font-black tracking-wider bg-[#F8F5EE] dark:bg-[#1A1A22] text-[#111111] dark:text-[#F5F3EC]">
                  <th className="py-3 px-4">Content &amp; Format</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Scheduled Slot</th>
                  <th className="py-3 px-4">Asset Status</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Execution Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#171717] dark:divide-[#383844]">
                {filteredItems.map(({ post, snapshot, job, executionStatus, assetStatus, scheduleStatus, timezone }, index) => {
                  return (
                    <tr
                      key={post.id || index}
                      id={`queue-row-${post.id}`}
                      onClick={() => onOpenRecord(post, snapshot)}
                      className="group transition-colors cursor-pointer hover:bg-[#FFD66B]/15 dark:hover:bg-white/[0.02]"
                    >
                      {/* Content & Format */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="p-1.5 rounded-lg shrink-0 mt-0.5 border-2 border-[#171717] bg-[#F8F5EE] dark:bg-[#1A1A22] shadow-[2px_2px_0_#111111]"
                          >
                            {post.format === 'Reel' && <Video className="w-3.5 h-3.5 text-orange-500" />}
                            {post.format === 'Carousel' && <Layers className="w-3.5 h-3.5 text-blue-500" />}
                            {post.format === 'Image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />}
                          </span>
                          <div className="space-y-0.5">
                            <span className="font-black text-sm text-[#111111] dark:text-white line-clamp-1 group-hover:text-orange-600 transition-colors">
                              {post.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#4B5563] dark:text-[#A1A1AA]">
                              <span className="font-bold">{post.format}</span>
                              {snapshot?.aspectRatio && (
                                <span className="font-mono">({snapshot.aspectRatio})</span>
                              )}
                              <span>•</span>
                              <span className="truncate">{post.pillar}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111111] dark:text-zinc-200">
                        @{account?.username || 'instagram_creator'}
                      </td>

                      {/* Scheduled Slot */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#111111] dark:text-white">
                            <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{post.scheduledDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#4B5563] dark:text-[#A1A1AA]">
                            <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="font-mono font-bold">{post.scheduledTime || '18:30'}</span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">
                              {timezone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Asset Status */}
                      <td className="py-3.5 px-4">
                        <span className="neo-badge neo-badge-sky text-[10px] inline-flex items-center gap-1 font-black">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{assetStatus.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Schedule Status */}
                      <td className="py-3.5 px-4">
                        <span className="neo-badge neo-badge-yellow text-[10px] inline-flex items-center gap-1 font-black">
                          <Clock className="w-3 h-3" />
                          <span>{scheduleStatus.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Execution Status: Visual Status Blocks */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          let displayStage: string = executionStatus.toUpperCase();
                          const isExecuting = executionStatus === 'publishing' || executionStatus === 'validating' || executionStatus === 'verifying';
                          
                          if (job && isExecuting) {
                            const latestLog = job.executionLogs && job.executionLogs.length > 0
                              ? job.executionLogs[job.executionLogs.length - 1]
                              : null;
                            const stage = latestLog?.stage || '';

                            if (job.executionStatus === 'VALIDATING' || stage === 'VALIDATING') {
                              displayStage = 'VALIDATING';
                            } else if (
                              stage === 'CAROUSEL_CHILDREN_CREATION' ||
                              stage === 'CHILD_CONTAINER_CREATED' ||
                              stage === 'PARENT_CONTAINER_CREATING' ||
                              stage === 'CONTAINER_CREATED' ||
                              stage === 'PUBLISHING'
                            ) {
                              displayStage = 'CONTAINER CREATING';
                            } else if (
                              stage === 'CAROUSEL_CHILDREN_POLLING' ||
                              stage === 'POLLING_STATUS' ||
                              stage === 'CHILD_CONTAINER_READY'
                            ) {
                              displayStage = 'PROCESSING MEDIA';
                            } else if (stage === 'MEDIA_PUBLISH' || stage === 'MEDIA_PUBLISHED') {
                              displayStage = 'PUBLISHING';
                            } else if (job.executionStatus === 'VERIFYING' || stage === 'VERIFYING') {
                              displayStage = 'VERIFYING';
                            } else {
                              displayStage = 'PUBLISHING';
                            }
                          }

                          if (executionStatus === 'published') {
                            return <span className="neo-badge neo-badge-mint">✓ PUBLISHED</span>;
                          } else if (isExecuting) {
                            return <span className="neo-badge neo-badge-yellow animate-pulse">⚡ {displayStage}</span>;
                          } else if (executionStatus === 'queued') {
                            return <span className="neo-badge neo-badge-lavender">QUEUED</span>;
                          } else if (executionStatus === 'failed') {
                            return <span className="neo-badge neo-badge-coral">✗ FAILED</span>;
                          } else if (executionStatus === 'retrying' || executionStatus === 'retry_pending') {
                            return <span className="neo-badge neo-badge-sky">RETRYING</span>;
                          } else if (scheduleStatus === 'cancelled' || executionStatus === 'cancelled') {
                            return <span className="neo-badge text-[10px] font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">CANCELLED</span>;
                          } else {
                            return <span className="neo-badge neo-badge-sky">SCHEDULED</span>;
                          }
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Publish Now */}
                          {onPublishNow && job && executionStatus !== 'published' && executionStatus !== 'publishing' && executionStatus !== 'validating' && executionStatus !== 'verifying' && scheduleStatus !== 'cancelled' && (
                            <button
                              id={`btn-queue-publish-${post.id}`}
                              type="button"
                              disabled={actionInProgress === post.id}
                              onClick={async () => {
                                setActionInProgress(post.id);
                                try {
                                  await onPublishNow(job.id);
                                } finally {
                                  setActionInProgress(null);
                                }
                              }}
                              title="Publish Now to Instagram"
                              className="p-1.5 rounded-lg bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          {/* Retry */}
                          {onRetryJob && job && (executionStatus === 'failed' || executionStatus === 'retry_pending') && (
                            <button
                              id={`btn-queue-retry-${post.id}`}
                              type="button"
                              disabled={actionInProgress === post.id}
                              onClick={async () => {
                                setActionInProgress(post.id);
                                try {
                                  await onRetryJob(job.id);
                                } finally {
                                  setActionInProgress(null);
                                }
                              }}
                              title="Retry Publishing"
                              className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel */}
                          {onCancelJob && job && (executionStatus === 'idle' || executionStatus === 'queued') && scheduleStatus === 'scheduled' && (
                            <button
                              id={`btn-queue-cancel-${post.id}`}
                              type="button"
                              disabled={actionInProgress === post.id}
                              onClick={async () => {
                                setActionInProgress(post.id);
                                try {
                                  await onCancelJob(job.id);
                                } finally {
                                  setActionInProgress(null);
                                }
                              }}
                              title="Cancel Scheduled Publication"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* External Permalink */}
                          {(job?.permalink || post.publishedUrl) && (
                            <a
                              id={`btn-queue-link-${post.id}`}
                              href={job?.permalink || post.publishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View on Instagram"
                              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            id={`btn-queue-detail-${post.id}`}
                            type="button"
                            onClick={() => onOpenRecord(post, snapshot)}
                            title="Inspect Publication Snapshot"
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-queue-reschedule-${post.id}`}
                            type="button"
                            onClick={() => onOpenReschedule(post)}
                            title="Change Delivery Slot"
                            className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
