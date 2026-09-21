import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Hash,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Globe,
  Info
} from 'lucide-react';
import { CalendarPost, PublicationSnapshot, InstagramAccount, PublishJobRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface PublicationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: CalendarPost | null;
  snapshot: PublicationSnapshot | null;
  account?: InstagramAccount | null;
  onRescheduleClick?: (post: CalendarPost) => void;
  publishJob?: PublishJobRecord | null;
  onPublishNow?: (jobId: string) => Promise<void>;
  onCancelJob?: (jobId: string) => Promise<void>;
  onRetryJob?: (jobId: string) => Promise<void>;
}

export const PublicationRecordModal: React.FC<PublicationRecordModalProps> = ({
  isOpen,
  onClose,
  post,
  snapshot,
  account,
  onRescheduleClick,
  publishJob,
  onPublishNow,
  onCancelJob,
  onRetryJob
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen || (!post && !snapshot)) return null;

  // Derive consolidated fields, prioritizing the immutable PublicationSnapshot
  const activeSnapshot = snapshot || post?.snapshot;
  const title = activeSnapshot?.title || post?.title || 'Scheduled Publication';
  const format = activeSnapshot?.format || post?.format || 'Reel';
  const scheduledDate = post?.scheduledDate || activeSnapshot?.scheduledDate || '';
  const scheduledTime = post?.scheduledTime || activeSnapshot?.scheduledTime || '18:30';
  const timezone = post?.timezone || activeSnapshot?.timezone || 'Asia/Kolkata';
  const pillar = activeSnapshot?.pillar || post?.pillar || 'Educational Content';

  const caption = activeSnapshot?.caption || '';
  const hashtags = activeSnapshot?.hashtags || [];
  const callToAction = activeSnapshot?.callToAction || '';

  // Lifecycle Dimensions (Decoupled Schedule & Execution)
  const contentStatus = activeSnapshot?.contentStatus || 'PRODUCTION_COMPLETE';
  const assetStatus = activeSnapshot?.assetStatus || 'ready';
  const scheduleStatus = publishJob?.scheduleStatus || (post?.status === 'published' ? 'PUBLISHED' : post?.status === 'cancelled' ? 'CANCELLED' : 'SCHEDULED');
  const executionStatus = publishJob?.executionStatus || (post?.status === 'published' ? 'PUBLISHED' : 'IDLE');

  const snapshotId = activeSnapshot?.id || post?.publicationSnapshotId || 'N/A';
  const idempotencyKey = publishJob?.idempotencyKey || activeSnapshot?.idempotencyKey || `idem-${post?.id || 'manual'}`;
  const permalink = publishJob?.permalink || post?.publishedUrl;
  const metaMediaId = publishJob?.metaMediaId || post?.instagramMediaId;

  const handleCopyId = () => {
    navigator.clipboard.writeText(snapshotId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePublishNow = async () => {
    if (!publishJob && !post?.id) return;
    const jobId = publishJob?.id || `job-from-post-${post?.id}`;
    if (!onPublishNow) return;
    setIsActionLoading(true);
    try {
      await onPublishNow(jobId);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!publishJob || !onCancelJob) return;
    setIsActionLoading(true);
    try {
      await onCancelJob(publishJob.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetryJob = async () => {
    if (!publishJob || !onRetryJob) return;
    setIsActionLoading(true);
    try {
      await onRetryJob(publishJob.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="modal-publication-record-detail"
        className="w-full max-w-3xl my-8 neo-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="neo-modal-header flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Format Badge */}
              <span
                className={`neo-badge ${
                  format === 'Reel'
                    ? 'neo-badge-coral'
                    : format === 'Carousel'
                    ? 'neo-badge-lavender'
                    : 'neo-badge-mint'
                }`}
              >
                {format === 'Reel' && <Video className="w-3.5 h-3.5" />}
                {format === 'Carousel' && <Layers className="w-3.5 h-3.5" />}
                {format === 'Image' && <ImageIcon className="w-3.5 h-3.5" />}
                <span>{format}</span>
                {activeSnapshot?.aspectRatio && (
                  <span className="opacity-80 font-mono">({activeSnapshot.aspectRatio})</span>
                )}
              </span>

              {/* Immutable Snapshot Pill */}
              <span className="neo-badge neo-badge-yellow flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
                <span>Immutable Snapshot v{activeSnapshot?.snapshotVersion || 1}</span>
              </span>

              {/* Account Pill */}
              {account && (
                <span className="text-xs font-mono font-bold text-[#4B5563] dark:text-[#A1A1AA]">
                  @{account.username}
                </span>
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight leading-snug text-[#111111] dark:text-[#F5F3EC] font-display">{title}</h2>
            <p className="text-xs font-bold text-[#4B5563] dark:text-[#A1A1AA]">Pillar: {pillar}</p>
          </div>

          <button
            id="btn-close-publication-modal"
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-secondary p-2 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. LINEAGE BREADCRUMB */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span>Publishing Lineage</span>
            </h3>
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs overflow-x-auto ${
              isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 shrink-0 font-medium">
                <span className="text-zinc-500">Audit</span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-medium">
                <span className="text-zinc-500">Topic</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {activeSnapshot?.sourceTopicId || 'approved'}
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-medium">
                <span className="text-zinc-500">Format:</span>
                <span className="text-orange-400 font-bold">{format}</span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-medium">
                <span className="text-zinc-500">Production</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {activeSnapshot?.sourceScriptId || 'script'}
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-bold text-orange-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publication Record</span>
              </div>
            </div>
          </div>

          {/* 2. FOUR DECOUPLED LIFECYCLE DIMENSIONS */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Lifecycle Status Dimensions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Content Status */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Content</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                  {contentStatus}
                </span>
              </div>

              {/* Asset Status */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Asset Status</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-block capitalize">
                  {assetStatus}
                </span>
              </div>

              {/* Schedule Status */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Schedule Status</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 inline-block capitalize">
                  {scheduleStatus}
                </span>
              </div>

              {/* Execution Status */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Execution Status</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-700/50 text-zinc-300 border border-zinc-600/40 inline-block capitalize">
                  {executionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SCHEDULE & TIMEZONE BOX */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#121218] border-zinc-800' : 'bg-orange-50/50 border-orange-200/60'
          }`}>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Reserved Delivery Slot</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold font-mono">
                <span>{scheduledDate}</span>
                <span>•</span>
                <span>{scheduledTime}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-orange-400 font-sans font-semibold">
                  {timezone}
                </span>
              </div>
            </div>

            {post && onRescheduleClick && (
              <button
                id="btn-reschedule-from-detail"
                type="button"
                onClick={() => {
                  onClose();
                  onRescheduleClick(post);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Change Delivery Slot</span>
              </button>
            )}
          </div>

          {/* 4. APPROVED CREATIVE COPY */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Approved Copy &amp; Metadata
            </h3>
            <div className={`p-4 rounded-xl border space-y-3 text-xs leading-relaxed ${
              isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Caption:</span>
                <p className="whitespace-pre-line text-zinc-200 font-normal">{caption || 'No caption provided.'}</p>
              </div>

              {hashtags.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Hashtags:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hashtags.map((h, i) => (
                      <span key={i} className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20 font-mono">
                        #{h.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {callToAction && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Call To Action (CTA):</span>
                  <span className="font-semibold text-white">{callToAction}</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. FINAL RENDERED ASSETS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Frozen Creative Assets ({format})
              </h3>
              {format === 'Carousel' && (
                <span className="text-xs text-zinc-400 font-mono">
                  {activeSnapshot?.carouselSlides?.length || activeSnapshot?.slideCount || 5} Slides • 1080 × 1080
                </span>
              )}
            </div>

            {/* Reel Assets */}
            {format === 'Reel' && (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {activeSnapshot?.coverImageUrl && (
                  <div className="relative w-28 h-48 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 shadow-md">
                    <img
                      src={activeSnapshot.coverImageUrl}
                      alt="Reel Cover"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold text-center">
                      Reel Cover (9:16)
                    </span>
                  </div>
                )}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Rendered Video Asset:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      Ready
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Media URL: <span className="font-mono text-[10px] break-all text-zinc-300">{activeSnapshot?.mediaUrls?.[0] || 'Default video preview asset'}</span>
                  </p>
                  {activeSnapshot?.reelScenes && (
                    <p className="text-zinc-400 text-[11px]">
                      Scenes Count: <strong className="text-white">{activeSnapshot.reelScenes.length} scenes</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Carousel Assets */}
            {format === 'Carousel' && activeSnapshot?.carouselSlides && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {activeSnapshot.carouselSlides.map((slide, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs space-y-2 relative ${
                        isDark ? 'bg-[#121218] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">
                          Slide {slide.slideNumber}
                        </span>
                        {idx === (activeSnapshot.coverSlideIndex || 0) && (
                          <span className="text-[9px] font-bold px-1 rounded bg-amber-500/30 text-amber-300">
                            Cover
                          </span>
                        )}
                      </div>

                      <div className={`aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        {slide.finalImageUrl || slide.mockImageUrl ? (
                          <img
                            src={slide.finalImageUrl || slide.mockImageUrl}
                            alt={`Slide ${slide.slideNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`text-[10px] text-center p-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                            {slide.headline || 'Slide Graphic'}
                          </span>
                        )}
                      </div>

                      <div className={`text-[10px] line-clamp-2 font-semibold leading-tight ${
                        isDark ? 'text-zinc-200' : 'text-slate-900'
                      }`}>
                        {slide.headline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Assets */}
            {format === 'Image' && (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
                isDark ? 'bg-[#121218] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {activeSnapshot?.coverImageUrl && (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 shadow-md">
                    <img
                      src={activeSnapshot.coverImageUrl}
                      alt="Image Asset"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold text-center">
                      Final Asset ({activeSnapshot.aspectRatio || '1:1'})
                    </span>
                  </div>
                )}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Headline:</span>
                    <span className="text-zinc-200">{activeSnapshot?.imageConcept?.headline || title}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Visual Prompt: <span className="italic text-zinc-300">"{activeSnapshot?.imageConcept?.visualPrompt || 'Editorial graphic poster'}"</span>
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    Style Preset: <strong className="text-white">{activeSnapshot?.imageConcept?.stylePreset || 'Modern Minimalist'}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 6. ADVANCED DELIVERY METADATA (PROGRESSIVE DISCLOSURE) */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              id="btn-toggle-advanced-metadata"
              type="button"
              onClick={() => setShowAdvancedMetadata(!showAdvancedMetadata)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500" />
                <span>Advanced Delivery &amp; Idempotency Metadata</span>
              </div>
              {showAdvancedMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedMetadata && (
              <div className={`p-4 mt-2 rounded-xl border space-y-2.5 font-mono text-[11px] ${
                isDark ? 'bg-black/40 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Publication Snapshot ID:</span>
                  <div className="flex items-center gap-1 text-zinc-300">
                    <span>{snapshotId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Idempotency Key:</span>
                  <span className="text-zinc-300">{idempotencyKey}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Instagram Container ID:</span>
                  <span className={publishJob?.metaContainerId ? 'text-zinc-300 font-bold' : 'text-zinc-500 italic'}>
                    {publishJob?.metaContainerId || 'Not created'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Instagram Media ID:</span>
                  <span className={metaMediaId ? 'text-zinc-300 font-bold' : 'text-zinc-500 italic'}>
                    {metaMediaId || 'Not published'}
                  </span>
                </div>

                {permalink && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Live Post Permalink:</span>
                    <a
                      id="link-published-instagram-media"
                      href={permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 underline flex items-center gap-1"
                    >
                      <span>View on Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Published Timestamp:</span>
                  <span className={publishJob?.publishedAt || post?.publishedAt ? 'text-zinc-300 font-bold' : 'text-zinc-500 italic'}>
                    {publishJob?.publishedAt || post?.publishedAt || 'Not Published'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Attempt Count:</span>
                  <span className="text-zinc-300">
                    {publishJob ? `${publishJob.attemptCount} / ${publishJob.maxAttempts}` : '0 / 3'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Last Engine Error:</span>
                  <span className={publishJob?.lastErrorMessage ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {publishJob?.lastErrorMessage ? `[${publishJob.lastErrorCode || 'ERR'}] ${publishJob.lastErrorMessage}` : 'None'}
                  </span>
                </div>

                {publishJob?.executionLogs && publishJob.executionLogs.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Execution Audit Trail:</span>
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-black/40 p-2 rounded-lg text-[10px]">
                      {publishJob.executionLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-zinc-500 shrink-0">{log.timestamp.split('T')[1].slice(0, 8)}</span>
                          <span className={`uppercase font-bold shrink-0 ${
                            log.level === 'error' ? 'text-rose-400' : log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'
                          }`}>[{log.stage}]</span>
                          <span className="text-zinc-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-sans">
                  * Managed by Phase 5C Instagram Publishing Engine. Safe, idempotent container flow with concurrency locks.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between flex-wrap gap-2 ${
          isDark ? 'border-[#262638] bg-[#14141c]' : 'border-slate-100 bg-slate-50'
        }`}>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>Timezone: {timezone}</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Cancel Button */}
            {onCancelJob && (executionStatus === 'IDLE' || executionStatus === 'QUEUED') && scheduleStatus === 'SCHEDULED' && (
              <button
                id="btn-cancel-job-modal"
                type="button"
                onClick={handleCancelJob}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel Schedule
              </button>
            )}

            {/* Retry Button */}
            {onRetryJob && (executionStatus === 'FAILED' || executionStatus === 'RETRY_PENDING') && (
              <button
                id="btn-retry-job-modal"
                type="button"
                onClick={handleRetryJob}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Retry Publication</span>
              </button>
            )}

            {/* Publish Now Button */}
            {onPublishNow && executionStatus !== 'PUBLISHED' && executionStatus !== 'PUBLISHING' && executionStatus !== 'VERIFYING' && scheduleStatus !== 'CANCELLED' && (
              <button
                id="btn-publish-now-modal"
                type="button"
                onClick={handlePublishNow}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isActionLoading ? 'Dispatching...' : 'Publish Now'}</span>
              </button>
            )}

            <button
              id="btn-close-publication-modal-bottom"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
            >
              Close Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
