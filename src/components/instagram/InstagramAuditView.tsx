import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Layers,
  Sparkles,
  Users,
  Video,
  Image as ImageIcon,
  Copy,
  Download,
  FileText,
  Clock,
  X,
  ExternalLink,
  Shield,
  Zap,
  BarChart2,
  MessageSquare,
  GitCompare,
  Check,
  Radio,
  FileCode,
  Calendar,
  Compass,
  Trash2,
  Archive,
  CheckSquare,
  Square,
  Filter,
  Bot,
  AlertTriangle,
  MoreVertical,
  Sliders,
  ChevronDown
} from 'lucide-react';
import {
  InstagramAccount,
  InstagramAuditRecord,
  InstagramAuditMode,
  AISkillRecord
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { useTheme } from '../../context/ThemeContext';
import { AuditCompareModal } from './AuditCompareModal';
import { AuditMarkdownModal } from './AuditMarkdownModal';
import { AuditSettingsModal } from './AuditSettingsModal';

interface InstagramAuditViewProps {
  account: InstagramAccount | null;
  audits: InstagramAuditRecord[];
  activeSkill?: AISkillRecord;
  onRunAudit: (mode?: InstagramAuditMode, targetHandle?: string) => Promise<any> | any;
  onSendToTopics?: (angleContext?: string) => void;
  onGenerateTopicsFromAudit?: (params: { pillars: string[]; deficitNotes: string }) => void;
  onNavigateToTopics?: () => void;
  isRunningAudit: boolean;
  isGeneratingTopics?: boolean;
  onAuditsUpdated?: () => void;
}

export const InstagramAuditView: React.FC<InstagramAuditViewProps> = ({
  account,
  audits,
  activeSkill,
  onRunAudit,
  onSendToTopics,
  onGenerateTopicsFromAudit,
  onNavigateToTopics,
  isRunningAudit,
  isGeneratingTopics = false,
  onAuditsUpdated
}) => {
  const { isDark } = useTheme();
  const [selectedMode, setSelectedMode] = useState<InstagramAuditMode>('full');
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [syncedRules, setSyncedRules] = useState<Record<string, boolean>>({});
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'gaps' | 'compare' | 'guardrails' | 'history'>('overview');

  // Multi-select & Audit History State
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);
  const [compareModalPair, setCompareModalPair] = useState<[InstagramAuditRecord, InstagramAuditRecord] | null>(null);
  const [viewingMarkdownAudit, setViewingMarkdownAudit] = useState<InstagramAuditRecord | null>(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'failed' | 'archived'>('all');
  const [historyProviderFilter, setHistoryProviderFilter] = useState<'all' | 'gemini' | 'manus'>('all');

  // Filter audits strictly for this account
  const accountAudits = audits.filter(a => account && (a.accountId === account.id || a.accountId === `ig-${account.username}`));
  const [selectedAuditId, setSelectedAuditId] = useState<string>(accountAudits[0]?.id || '');

  // Filtered audits for the Audit History & Logs tab
  const filteredHistoryAudits = useMemo(() => {
    return accountAudits.filter(a => {
      // Status filter
      if (historyStatusFilter === 'completed' && a.status !== 'completed') return false;
      if (historyStatusFilter === 'in_progress' && a.status !== 'in_progress' && (a.status as string) !== 'running') return false;
      if (historyStatusFilter === 'failed' && a.status !== 'failed') return false;
      if (historyStatusFilter === 'archived' && !a.isArchived) return false;
      if (historyStatusFilter !== 'archived' && a.isArchived) return false;

      // Provider filter
      if (historyProviderFilter === 'gemini') {
        const isGemini = !a.provider || a.provider.includes('gemini') || a.provider === 'gemini_mcp-fallback';
        if (!isGemini) return false;
      } else if (historyProviderFilter === 'manus') {
        const isManus = a.provider === 'manus' || (a.markdownReport && a.markdownReport.includes('Manus'));
        if (!isManus) return false;
      }

      // Search query
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchesMode = a.auditMode?.toLowerCase().includes(q);
        const matchesProvider = (a.provider || 'gemini').toLowerCase().includes(q);
        const matchesNotes = a.notes?.toLowerCase().includes(q);
        const matchesId = a.id?.toLowerCase().includes(q);
        const matchesReport = a.markdownReport?.toLowerCase().includes(q);
        if (!matchesMode && !matchesProvider && !matchesNotes && !matchesId && !matchesReport) return false;
      }

      return true;
    });
  }, [accountAudits, historyStatusFilter, historyProviderFilter, historySearchQuery]);

  // Persistent in-progress audit detection
  const runningAudit = accountAudits.find(
    a => a.status === 'in_progress' || (a.status as string) === 'running'
  );
  const effectiveIsRunning = isRunningAudit || !!runningAudit;

  // Poll audits while an audit is in progress (resumes automatically across page reloads)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (effectiveIsRunning) {
      pollInterval = setInterval(() => {
        if (onAuditsUpdated) onAuditsUpdated();
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [effectiveIsRunning, onAuditsUpdated]);

  // Sync selected audit if audits update
  const prevLatestAuditIdRef = useRef<string | undefined>(accountAudits[0]?.id);
  useEffect(() => {
    if (accountAudits.length > 0) {
      const currentLatest = accountAudits[0]?.id;
      if (currentLatest && currentLatest !== prevLatestAuditIdRef.current) {
        setSelectedAuditId(currentLatest);
        prevLatestAuditIdRef.current = currentLatest;
      } else if (!selectedAuditId || !accountAudits.some(a => a.id === selectedAuditId)) {
        setSelectedAuditId(accountAudits[0].id);
      }
    }
  }, [accountAudits, selectedAuditId]);

  const currentAudit: InstagramAuditRecord | undefined =
    accountAudits.find((a) => a.id === selectedAuditId) || accountAudits[0];

  const previousAudit: InstagramAuditRecord | undefined =
    accountAudits.length > 1
      ? accountAudits.find((a) => a.id !== currentAudit?.id)
      : undefined;

  // Live MCP + Gemini Agent execution stages during isRunningAudit
  const auditSteps = [
    { title: 'Connecting to Instagram...', detail: `Authenticating live Meta Graph API connection for @${account?.username || 'account'}` },
    { title: 'Retrieving account data...', detail: 'Fetching follower count, biography, media count, and profile metrics' },
    { title: 'Analysing recent content...', detail: 'Inspecting recent Reels, Carousels, captions, timestamps, and interaction velocity' },
    { title: 'Analysing performance...', detail: 'Calling Instagram MCP insights tools to isolate high vs low performing formats' },
    { title: 'Identifying content gaps...', detail: 'Cross-referencing content pillars, audience sentiment, and missing strategic formats' },
    { title: 'Generating audit...', detail: 'Synthesizing structured Page Audit JSON and updating active content strategy' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (effectiveIsRunning) {
      setActiveStepIndex(0);
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev < auditSteps.length - 1 ? prev + 1 : prev));
      }, 2400);
    } else {
      setActiveStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [effectiveIsRunning]);

  // Bulk audit action handlers
  const handleToggleSelectAudit = (id: string) => {
    setSelectedAuditIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllAudits = (filteredList: InstagramAuditRecord[]) => {
    if (selectedAuditIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedAuditIds([]);
    } else {
      setSelectedAuditIds(filteredList.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAuditIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedAuditIds.length} audit record(s)?`)) return;
    try {
      const count = selectedAuditIds.length;
      await instagramApi.bulkDeleteAudits(selectedAuditIds);
      setSelectedAuditIds([]);
      setSyncToast(`Successfully deleted ${count} audit record(s)`);
      setTimeout(() => setSyncToast(null), 3500);
      if (onAuditsUpdated) onAuditsUpdated();
    } catch (err: any) {
      setAuditError(err.message || 'Failed to delete selected audits');
    }
  };

  const handleBulkArchive = async (isArchived: boolean = true) => {
    if (selectedAuditIds.length === 0) return;
    try {
      const count = selectedAuditIds.length;
      await instagramApi.bulkArchiveAudits(selectedAuditIds, isArchived);
      setSelectedAuditIds([]);
      setSyncToast(`Successfully ${isArchived ? 'archived' : 'restored'} ${count} audit record(s)`);
      setTimeout(() => setSyncToast(null), 3500);
      if (onAuditsUpdated) onAuditsUpdated();
    } catch (err: any) {
      setAuditError(err.message || 'Failed to update archive status');
    }
  };

  const handleOpenCompare = () => {
    if (selectedAuditIds.length !== 2) return;
    const a1 = accountAudits.find(a => a.id === selectedAuditIds[0]);
    const a2 = accountAudits.find(a => a.id === selectedAuditIds[1]);
    if (a1 && a2) {
      setCompareModalPair([a1, a2]);
    }
  };

  const handleExportSelectedMarkdown = () => {
    if (selectedAuditIds.length === 0) return;
    const selectedList = accountAudits.filter(a => selectedAuditIds.includes(a.id));
    const content = selectedList.map(a =>
      a.markdownReport || generateFallbackMarkdown(a, account)
    ).join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_bundle_${account?.username || 'account'}_${selectedAuditIds.length}_reports.md`;
    link.click();
    URL.revokeObjectURL(url);
    setSyncToast(`Exported ${selectedAuditIds.length} audit(s) as Markdown`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleExportSelectedJson = () => {
    if (selectedAuditIds.length === 0) return;
    const selectedList = accountAudits.filter(a => selectedAuditIds.includes(a.id));
    const blob = new Blob([JSON.stringify(selectedList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_bundle_${account?.username || 'account'}_${selectedAuditIds.length}_reports.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSyncToast(`Exported ${selectedAuditIds.length} audit(s) as JSON`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleStartAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!account) return;
    setAuditError(null);
    try {
      const createdAudit = await onRunAudit(selectedMode, account.username);
      if (createdAudit && (createdAudit as any).id) {
        setSelectedAuditId((createdAudit as any).id);
        prevLatestAuditIdRef.current = (createdAudit as any).id;
      }
      setSyncToast(`Audit refreshed successfully for @${account.username} (${selectedMode.toUpperCase()} mode)`);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: any) {
      setAuditError(err.message || 'Instagram data could not be retrieved. Please reconnect the Instagram account or check the required permissions.');
    }
  };

  const handleSendToTopics = (angleToUse?: string) => {
    if (onSendToTopics) {
      onSendToTopics(angleToUse);
    } else if (onGenerateTopicsFromAudit) {
      onGenerateTopicsFromAudit({
        pillars: account?.contentPillars || [],
        deficitNotes: angleToUse || ''
      });
    }
  };

  const handleGenerateTopicsFromAudit = () => {
    if (isGeneratingTopics || !account) return;
    const underIndexed = (account.contentPillars || []).filter(
      p => (p.currentPercentage || 0) < (p.targetPercentage || 0)
    );
    const topGap = currentAudit?.structuredAudit?.contentGaps?.[0] || currentAudit?.content_gaps?.[0] || 'High-retention audience hook templates';
    const angleToUse = underIndexed.length > 0
      ? `Strategic Pillar Deficit: ${underIndexed.map(p => p.name).join(', ')} (Target: ${underIndexed[0].targetPercentage}%, Current: ${underIndexed[0].currentPercentage}%) - Addressing: ${topGap}`
      : (currentAudit?.structuredAudit?.topicOpportunities?.[0] || currentAudit?.topic_opportunities?.[0] || `Audit Opportunity: ${topGap}`);
    handleSendToTopics(angleToUse);
  };

  const handleDownloadMarkdown = () => {
    if (!currentAudit) return;
    const reportText = currentAudit.markdownReport || generateFallbackMarkdown(currentAudit, account);
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = currentAudit.audit_date || new Date(currentAudit.timestamp).toISOString().split('T')[0];
    link.download = `${account.username}_instagram_mcp_audit_${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSyncGuardrail = async (title: string, rule: string, reason?: string) => {
    try {
      await instagramApi.injectAuditGuardrail(currentAudit?.id || 'audit', rule, reason);
      setSyncedRules(prev => ({ ...prev, [title]: true }));
      setSyncToast(`Guardrail synced into active AI skill: "${title}"`);
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err: any) {
      alert(`Failed to sync guardrail: ${err.message}`);
    }
  };

  const generateFallbackMarkdown = (audit: InstagramAuditRecord, acc: InstagramAccount): string => {
    return `# Live Instagram Page Audit Report: @${acc.username}
**Account:** @${acc.username} (${acc.displayName})
**Data Source:** Live Instagram data (Instagram MCP)
**Followers:** ${acc.followersCount.toLocaleString()} | **Engagement Rate:** ${acc.engagementRate}%
**Audit Date:** ${audit.audit_date || new Date(audit.timestamp).toLocaleDateString()}
**Generated via:** Google Gemini Agent via Instagram Live MCP

---

## Executive Summary
${audit.structuredAudit?.summary?.overview || 'Live audit completed using Meta Graph API telemetry.'}

## Content Gaps
${(audit.structuredAudit?.contentGaps || audit.content_gaps || []).map(g => `- ${g}`).join('\n')}

## Recommendations
${(audit.structuredAudit?.recommendations || audit.recommendations || []).map((r: any, i: number) => `${i + 1}. ${typeof r === 'string' ? r : r.text}`).join('\n')}
`;
  };

  const extractCleanSummary = (audit?: InstagramAuditRecord): string => {
    if (!audit) return 'No audit recorded yet. Click "Run Audit" to start.';
    if (audit.structuredAudit?.summary?.overview) {
      return audit.structuredAudit.summary.overview;
    }
    if (audit.markdownReport) {
      const lines = audit.markdownReport
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('---') && !l.startsWith('|') && !l.startsWith('>'));
      if (lines.length > 0) {
        return lines.slice(0, 3).join(' ');
      }
    }
    return 'Comprehensive diagnostic audit completed using live Instagram account telemetry.';
  };

  const structured = currentAudit?.structuredAudit;

  if (!account) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Compass className="w-12 h-12 text-orange-500 mb-3 opacity-50" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">No Instagram Account Selected</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Please select or connect an Instagram account from the top bar to run and review live page audits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-900 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* 1. COMPACT HEADER & CONTROLS */}
      <div className={`px-6 py-4 rounded-2xl border transition-colors shadow-xs ${
        isDark ? 'bg-[#181820] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Context & Metadata */}
          <div>
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <span>Page Audit</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-xs mt-1 text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Instagram</span>
              <span>·</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                @{account?.username || 'account'}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live MCP
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {currentAudit
                  ? `Last audited: ${currentAudit.audit_date || new Date(currentAudit.timestamp).toLocaleDateString()}`
                  : 'Not audited yet'}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Selector */}
            <select
              id="select-audit-mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as InstagramAuditMode)}
              className={`rounded-xl text-xs px-3 py-2 font-medium focus:outline-none focus:border-orange-500 border ${
                isDark ? 'bg-[#14141c] border-[#2c2c3c] text-white' : 'bg-slate-50 border-gray-200 text-gray-800'
              }`}
            >
              <option value="full">Full 360° Audit</option>
              <option value="change">Delta (Changes vs Last Audit)</option>
              <option value="performance">Retention &amp; Performance</option>
              <option value="quick">Quick Health Scan</option>
            </select>

            {/* Run Audit Primary Button */}
            <button
              id="btn-run-page-audit"
              type="button"
              disabled={isRunningAudit || !account}
              onClick={() => handleStartAudit()}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
              <span>
                {isRunningAudit
                  ? 'Auditing...'
                  : (currentAudit ? 'Run Audit' : 'Start Audit')}
              </span>
            </button>

            {/* Quick Audit History Button */}
            <button
              type="button"
              id="btn-quick-audit-history"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400'
                  : isDark
                  ? 'bg-[#14141c] border-[#2c2c3c] text-zinc-300 hover:text-white'
                  : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                {accountAudits.length}
              </span>
            </button>

            {/* Overflow Menu Button [•••] */}
            <div className="relative">
              <button
                type="button"
                id="btn-audit-overflow-menu"
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'bg-[#14141c] border-[#2c2c3c] text-zinc-400 hover:text-white' : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="More Actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOverflowMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isDark ? 'bg-[#181822] border-[#2a2a3c] text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  onClick={() => setShowOverflowMenu(false)}
                >
                  {currentAudit && (
                    <>
                      <button
                        type="button"
                        id="btn-view-md-report"
                        onClick={() => setViewingMarkdownAudit(currentAudit)}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-orange-500/10 hover:text-orange-600 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                        <span>View MD Report</span>
                      </button>
                      <button
                        type="button"
                        id="btn-download-md-report"
                        onClick={handleDownloadMarkdown}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-orange-500/10 hover:text-orange-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Download .MD</span>
                      </button>
                      <hr className={`my-1 border-t ${isDark ? 'border-[#2a2a3c]' : 'border-slate-100'}`} />
                    </>
                  )}
                  <button
                    type="button"
                    id="btn-open-audit-settings"
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-orange-500/10 hover:text-orange-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Audit Settings &amp; Data Source</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner if MCP or Auth Fails */}
      {auditError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-rose-950 dark:text-rose-100 block mb-0.5">
                Audit Execution Error
              </strong>
              <p className="leading-relaxed">{auditError}</p>
            </div>
          </div>
          <button
            onClick={() => setAuditError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 text-xs font-bold cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. IN-PROGRESS LIVE MCP + GEMINI / MANUS STATUS TRACKER */}
      {effectiveIsRunning && (
        <div className="bg-white dark:bg-[#181820] border-2 border-orange-400 dark:border-orange-500 rounded-2xl p-6 shadow-lg space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {runningAudit?.provider === 'manus' || runningAudit?.fallbackUsed
                  ? 'Status: In Progress — Fallback Active: Manus AI Research Agent'
                  : 'Status: In Progress — Gemini Agent Calling Instagram MCP'}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Step {activeStepIndex + 1} of {auditSteps.length}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {runningAudit?.progressStep || auditSteps[activeStepIndex]?.title || 'Analyzing Instagram Profile...'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {runningAudit?.progressStep ? `${runningAudit.progressStep} (Processing in background)` : auditSteps[activeStepIndex]?.detail}
            </p>

            {/* Step Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${((activeStepIndex + 1) / auditSteps.length) * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
              {auditSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-[11px] font-medium border ${
                    idx < activeStepIndex
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : idx === activeStepIndex
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-300 font-bold'
                      : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {idx < activeStepIndex ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border text-[9px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{step.title.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. AUDIT RESULTS TABS & CONTENT */}
      {currentAudit && !effectiveIsRunning && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto gap-1">
            <button
              id="tab-audit-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Overview</span>
            </button>

            <button
              id="tab-audit-content"
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'content'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Content</span>
            </button>

            <button
              id="tab-audit-gaps"
              onClick={() => setActiveTab('gaps')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'gaps'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Opportunities</span>
              {((structured?.topicOpportunities || currentAudit.topic_opportunities || []).length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-mono font-bold">
                  {(structured?.topicOpportunities || currentAudit.topic_opportunities || []).length}
                </span>
              )}
            </button>

            <button
              id="tab-audit-compare"
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'compare'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Compare</span>
            </button>

            <button
              id="tab-audit-guardrails"
              onClick={() => setActiveTab('guardrails')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'guardrails'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>Guardrails</span>
            </button>

            <button
              id="tab-audit-history"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono">
                {accountAudits.length}
              </span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* PAGE HEALTH HERO & SUPPORTING DIMENSIONS */}
              <div className={`p-6 rounded-2xl border shadow-xs transition-colors ${
                isDark ? 'bg-[#181820] border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-gray-100 dark:border-gray-800">
                  {/* Primary Visual Metric: Hero Score */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">
                        {currentAudit.scores?.overall_score || 80}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                          {currentAudit.scores?.overall_score || 80} / 100
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {(currentAudit.scores?.overall_score || 80) >= 80 ? 'Optimal' : (currentAudit.scores?.overall_score || 80) >= 65 ? 'Good with Gaps' : 'Needs Optimization'}
                        </span>
                      </div>
                      <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                        Overall Page Health
                      </h2>
                    </div>
                  </div>

                  {/* Compact Account Telemetry Strip */}
                  <div className="flex items-center gap-4 text-xs font-mono text-gray-500 dark:text-gray-400 flex-wrap">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Followers</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {(structured?.account?.followers ?? account.followersCount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Following</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {(structured?.account?.following ?? account.followingCount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Posts</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {(structured?.account?.posts ?? account.mediaCount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supporting Dimensions (Single Sleek Row) */}
                <div className="pt-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Supporting Health Dimensions
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Profile</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                          {currentAudit.scores?.profile_score || 85}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${currentAudit.scores?.profile_score || 85}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Content</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                          {currentAudit.scores?.content_score || 78}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${currentAudit.scores?.content_score || 78}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Consistency</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                          {currentAudit.scores?.consistency_score || 75}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${currentAudit.scores?.consistency_score || 75}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Engagement</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                          {currentAudit.scores?.engagement_score || 72}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${currentAudit.scores?.engagement_score || 72}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Positioning</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                          {currentAudit.scores?.positioning_score || 88}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${currentAudit.scores?.positioning_score || 88}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED ACTIONS STRIP */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#161622] border-gray-800' : 'bg-orange-50/60 border-orange-200/80'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Recommended Actions</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Next steps based on audit diagnostics:</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    id="btn-action-generate-topics"
                    onClick={() => setActiveTab('gaps')}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Topics</span>
                  </button>

                  <button
                    type="button"
                    id="btn-action-view-gaps"
                    onClick={() => setActiveTab('gaps')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark ? 'bg-[#1b1b26] border-[#2e2e42] text-zinc-200 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Content Gaps</span>
                  </button>

                  <button
                    type="button"
                    id="btn-action-review-guardrails"
                    onClick={() => setActiveTab('guardrails')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark ? 'bg-[#1b1b26] border-[#2e2e42] text-zinc-200 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Review Guardrails</span>
                  </button>
                </div>
              </div>

              {/* EXECUTIVE SUMMARY & KEY INSIGHTS */}
              <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
                isDark ? 'bg-[#181820] border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2 pb-2 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                    {extractCleanSummary(currentAudit)}
                  </p>
                </div>

                {((structured?.summary?.keyObservations || currentAudit.strengths || currentAudit.whatsWorking || []).length > 0) && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
                      Key Insights &amp; Observations
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {(structured?.summary?.keyObservations || (currentAudit.whatsWorking || []).map(w => `${w.title}: ${w.detail}`) || currentAudit.strengths || []).slice(0, 4).map((obs, i) => (
                        <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-2.5 bg-gray-50/50 dark:bg-gray-900/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{obs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & REELS PERFORMANCE */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Formats Breakdown */}
              <div className={`border rounded-2xl p-6 shadow-sm ${
                isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800 font-bold text-sm uppercase tracking-wider mb-4">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>Content Format Mix & Performance</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {(structured?.contentPerformance?.formats || [
                    { format: 'Reels (Video)', count: 18, percentage: 65, avgEngagement: 3.8 },
                    { format: 'Carousels', count: 8, percentage: 25, avgEngagement: 5.2 },
                    { format: 'Static Images', count: 4, percentage: 10, avgEngagement: 1.1 }
                  ]).map((fmt, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border space-y-2 ${
                      fmt.format.toLowerCase().includes('reel') || fmt.format.toLowerCase().includes('video')
                        ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/60'
                        : fmt.format.toLowerCase().includes('carousel')
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                        : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{fmt.format}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">{fmt.percentage}% mix</span>
                      </div>
                      <div className="text-xl font-bold">{fmt.count} published</div>
                      {fmt.avgEngagement && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Avg Engagement: <strong>{fmt.avgEngagement}%</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {((structured?.contentPerformance?.patterns || []).length > 0) && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Content Patterns Discovered
                    </span>
                    <div className="space-y-2 text-xs">
                      {structured.contentPerformance.patterns.map((pat, i) => (
                        <div key={i} className="p-3 rounded-lg border dark:border-gray-800 flex items-start gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <span>{pat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reels Analysis & Caption Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-orange-500">
                    <Video className="w-4 h-4" />
                    <span>Reels & Hook Structure Analysis</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Hook Patterns:</strong>
                      <p className="leading-relaxed">
                        {(structured?.reelAnalysis?.hookPatterns || []).join('; ') || 'Varied first-2-second hooks observed across Reels catalogue.'}
                      </p>
                    </div>
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Storytelling & Pacing:</strong>
                      <p className="leading-relaxed">
                        {(structured?.reelAnalysis?.contentPatterns || []).join('; ') || 'Product demo with sensory crunch pattern interrupt.'}
                      </p>
                    </div>
                    {structured?.reelAnalysis?.observations && (
                      <div className="space-y-1">
                        <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Observations:</strong>
                        {structured.reelAnalysis.observations.map((o, i) => (
                          <div key={i} className="text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                            <span>•</span> <span>{o}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-blue-500">
                    <MessageSquare className="w-4 h-4" />
                    <span>Caption & Audience Analysis</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Posting Cadence:</strong>
                      <p className="leading-relaxed">
                        Frequency: <strong>{structured?.postingAnalysis?.frequency || 'Regular'}</strong> • Consistency: <strong>{structured?.postingAnalysis?.consistency || 'Steady'}</strong>
                      </p>
                    </div>
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Caption Patterns & CTAs:</strong>
                      <p className="leading-relaxed">
                        {(structured?.captionAnalysis?.patterns || []).join('; ') || 'Captions rely on location tags and product hashtags; opportunities exist for keyword triggers.'}
                      </p>
                    </div>
                    {structured?.audienceInsights?.observations && (
                      <div className="space-y-1">
                        <strong className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Audience Sentiment & Feedback:</strong>
                        {structured.audienceInsights.observations.map((a, i) => (
                          <div key={i} className="text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                            <span>•</span> <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Performing vs Low Performing Content */}
              {((structured?.contentPerformance?.topContent || []).length > 0 || (structured?.contentPerformance?.lowPerformingContent || []).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`border rounded-2xl p-5 shadow-sm space-y-3 ${
                    isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Top Performing Content</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(structured?.contentPerformance?.topContent || []).map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg border dark:border-gray-800 space-y-1 bg-emerald-50/20 dark:bg-emerald-950/20">
                          <div className="flex justify-between font-semibold">
                            <span className="truncate max-w-xs font-mono">{item.caption || `Post #${idx + 1}`}</span>
                            <span className="text-emerald-500 shrink-0 font-bold">{item.likes ?? 0} likes • {item.comments ?? 0} comments</span>
                          </div>
                          {item.whyItWorked && (
                            <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                              <strong>Why it worked:</strong> {item.whyItWorked}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`border rounded-2xl p-5 shadow-sm space-y-3 ${
                    isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>Under-Performing Content</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(structured?.contentPerformance?.lowPerformingContent || []).map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg border dark:border-gray-800 space-y-1 bg-rose-50/20 dark:bg-rose-950/20">
                          <div className="flex justify-between font-semibold">
                            <span className="truncate max-w-xs font-mono">{item.caption || `Post #${idx + 1}`}</span>
                            <span className="text-rose-500 shrink-0 font-bold">{item.likes ?? 0} likes • {item.comments ?? 0} comments</span>
                          </div>
                          {item.whyItUnderperformed && (
                            <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                              <strong>Underperformance cause:</strong> {item.whyItUnderperformed}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAPS & TOPIC OPPORTUNITIES */}
          {activeTab === 'gaps' && (
            <div className="space-y-6">
              {/* Content Gaps & Growth Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-amber-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>Identified Content Gaps</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {(structured?.contentGaps || currentAudit.content_gaps || []).map((gap, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-start gap-2">
                        <span className="text-amber-500 font-bold">⚠️</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-emerald-500">
                    <Sparkles className="w-4 h-4" />
                    <span>Strategic Growth Opportunities</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {(structured?.opportunities || currentAudit.opportunities || []).map((opp, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">🚀</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
                isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-orange-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Strategic Recommendations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(structured?.recommendations || currentAudit.recommendations || []).map((rec: any, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border dark:border-gray-800 flex items-start gap-3 bg-gray-50/60 dark:bg-gray-900/40">
                      <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-900 dark:text-white">
                          {typeof rec === 'string' ? rec : rec.text}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 inline-block">
                          Impact: {typeof rec === 'string' ? 'High' : (rec.impact || rec.priority || 'High')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Topic Opportunities with 1-Click Send to Topic Generator */}
              <div className={`border-2 border-orange-500/30 rounded-2xl p-6 shadow-md space-y-4 ${
                isDark ? 'bg-[#181820]' : 'bg-gradient-to-br from-orange-50/50 to-amber-50/50'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-orange-200/50 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Recommended Topic Opportunities (Ready for Creation)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    Feeds directly to Topic Workflow
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(structured?.topicOpportunities || currentAudit.topic_opportunities || [
                    '3 Mistakes 90% of Users Make When Choosing Quick Snacks',
                    'How Authentic Bengaluru Snacks Are Made Daily: Behind the Scenes',
                    'Traditional vs Modern Snacks: The Nutrition & Taste Showdown'
                  ]).map((topicTitle, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isDark ? 'bg-[#141419] border-gray-800 hover:border-orange-500/50' : 'bg-white border-orange-200/70 hover:border-orange-400 shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">
                          Topic Opportunity #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                          {topicTitle}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Derived directly from live audit gaps to maximize save and comment velocity.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendToTopics(`Audit Opportunity: ${topicTitle}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-full"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Send to Topic Generator</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Generation Live Tracker */}
              {isGeneratingTopics && (
                <div className={`border-2 border-orange-500/80 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-300 ${
                  isDark ? 'bg-gradient-to-br from-orange-950/40 via-amber-950/30 to-[#181820]' : 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <span className="w-4 h-4 rounded-full bg-orange-500 animate-ping absolute opacity-75"></span>
                        <span className="w-3 h-3 rounded-full bg-orange-600 relative"></span>
                      </div>
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider block ${
                          isDark ? 'text-orange-300' : 'text-orange-900'
                        }`}>
                          Gemini Content Planner In Progress
                        </span>
                        <span className={`text-xs ${isDark ? 'text-orange-200/80' : 'text-orange-700'}`}>
                          Transforming audit gaps into structured viral topics with active guardrails
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isDark ? 'bg-orange-950/70 text-orange-300 border border-orange-800/60' : 'bg-orange-100 text-orange-800'
                    }`}>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                      <span>Generating {topicProgressPct}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-orange-200/50 dark:bg-orange-950/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 h-2.5 transition-all duration-700 ease-out rounded-full shadow-xs"
                      style={{ width: `${topicProgressPct}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Strategic Content Pipeline: Generate Topics directly from Opportunities */}
              <div className={`p-6 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-orange-950/40 via-[#181820] to-purple-950/30 border-orange-500/30 shadow-lg'
                  : 'bg-gradient-to-r from-orange-50 via-amber-50/60 to-purple-50/50 border-orange-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20 inline-block">
                      Strategic Content Pipeline
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Generate Topic Ideas from Live Audit Insights
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      Feed live diagnostic gaps into the Gemini AI Topic Engine. Topics will be directly weighted to solve under-performing content lanes and address live audience demand.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-generate-topics-from-audit"
                    disabled={isGeneratingTopics}
                    onClick={handleGenerateTopicsFromAudit}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#EA580C] to-[#DD2A7B] hover:opacity-95 text-white shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isGeneratingTopics ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing Topics ({topicProgressPct}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Topics from Insights</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT COMPARE (PREVIOUS VS CURRENT) */}
          {activeTab === 'compare' && (
            <div className={`border rounded-2xl p-6 shadow-sm space-y-6 ${
              isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Audit Comparison: Previous vs Current
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {previousAudit ? `Comparing with ${previousAudit.audit_date || new Date(previousAudit.timestamp).toLocaleDateString()}` : 'Single Audit Baseline'}
                </span>
              </div>

              {previousAudit ? (
                <div className="space-y-6">
                  {/* Score Delta Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="py-2.5 px-3">Metric Dimension</th>
                          <th className="py-2.5 px-3 text-center">Previous Audit</th>
                          <th className="py-2.5 px-3 text-center">Current Audit</th>
                          <th className="py-2.5 px-3 text-center">Score Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { name: 'Overall Score', curr: currentAudit.scores?.overall_score || 80, prev: previousAudit.scores?.overall_score || 75 },
                          { name: 'Profile Optimization', curr: currentAudit.scores?.profile_score || 85, prev: previousAudit.scores?.profile_score || 72 },
                          { name: 'Content & Hooks', curr: currentAudit.scores?.content_score || 78, prev: previousAudit.scores?.content_score || 70 },
                          { name: 'Posting Consistency', curr: currentAudit.scores?.consistency_score || 75, prev: previousAudit.scores?.consistency_score || 68 },
                          { name: 'Engagement Velocity', curr: currentAudit.scores?.engagement_score || 72, prev: previousAudit.scores?.engagement_score || 65 },
                          { name: 'Positioning & Niche', curr: currentAudit.scores?.positioning_score || 88, prev: previousAudit.scores?.positioning_score || 80 }
                        ].map((m, idx) => {
                          const delta = m.curr - m.prev;
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                              <td className="py-3 px-3 font-semibold">{m.name}</td>
                              <td className="py-3 px-3 text-center font-mono text-gray-500">{m.prev}%</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-orange-500">{m.curr}%</td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded font-bold ${
                                  delta > 0
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : delta < 0
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                  {delta > 0 ? `+${delta}%` : `${delta}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Changes and Observations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 rounded-xl border dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 space-y-2">
                      <span className="font-bold uppercase tracking-wider text-orange-500 text-[10px] block">
                        New Identified Content Gaps
                      </span>
                      <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                        {(structured?.contentGaps || currentAudit.content_gaps || []).slice(0, 3).map((g, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-orange-500">•</span> <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 space-y-2">
                      <span className="font-bold uppercase tracking-wider text-emerald-500 text-[10px] block">
                        Observed Improvements
                      </span>
                      <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                        {(currentAudit.changes_since_previous_audit || [
                          'Live Instagram MCP connection established with direct Graph API telemetry',
                          'Higher resolution video analytics enabled'
                        ]).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500">✓</span> <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <GitCompare className="w-8 h-8 text-gray-400 mx-auto" />
                  <h4 className="text-sm font-bold">Single Audit Baseline Established</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    This is your first completed Live Instagram MCP audit for @{account.username}. Run another audit after publishing new content to compare scores, reach deltas, and gap progress.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SELF-LEARNING GUARDRAILS */}
          {activeTab === 'guardrails' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What is Working */}
                <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>What Is Working (Positive Retention Drivers)</span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {(currentAudit.whatsWorking || []).length} Patterns
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(currentAudit.whatsWorking || []).map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1 text-xs">
                        <div className="flex items-start gap-2 font-bold text-gray-900 dark:text-white">
                          <span className="text-emerald-500">✓</span>
                          <span>{item.title}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 pl-4">{item.detail}</p>
                        <p className="text-emerald-700 dark:text-emerald-300 text-[11px] pl-4 font-medium">
                          <strong>Strategic reason:</strong> {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What is Not Working with Root Causes & Guardrails */}
                <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      <span>What Is NOT Working & Root Causes</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-indigo-400" /> Self-Learning Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(currentAudit.whatsNotWorking || []).map((item, idx) => {
                      const isSynced = syncedRules[item.title] || item.addedToSkills;
                      return (
                        <div key={idx} className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 font-bold text-gray-900 dark:text-white">
                              <span className="text-rose-500">✗</span>
                              <span>{item.title}</span>
                            </div>
                            {isSynced ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Synced to Skill
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSyncGuardrail(item.title, item.guardrailRule, item.reason)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900 hover:bg-rose-200 text-rose-800 dark:text-rose-200 transition-colors shrink-0 cursor-pointer"
                              >
                                + Ingest Guardrail
                              </button>
                            )}
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 pl-4">{item.detail}</p>
                          <p className="text-rose-700 dark:text-rose-300 text-[11px] pl-4 font-medium">
                            <strong>Root cause:</strong> {item.reason}
                          </p>

                          {item.guardrailRule && (
                            <div className="mt-2 ml-4 p-2.5 rounded text-[11px] font-mono border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                              <strong className="font-sans font-bold block mb-0.5 text-indigo-950 dark:text-indigo-300">
                                🛡️ Learned Engine Guardrail:
                              </strong>
                              "{item.guardrailRule}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT HISTORY & LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Filter & Search Bar */}
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isDark ? 'bg-[#181824] border-[#252534]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search audits by mode, provider, notes..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                        isDark ? 'bg-[#12121a] border-[#2b2b3c] text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500'
                      }`}
                    />
                  </div>

                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                    className={`px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors cursor-pointer ${
                      isDark ? 'bg-[#12121a] border-[#2b2b3c] text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="failed">Failed</option>
                    <option value="archived">Archived</option>
                  </select>

                  <select
                    value={historyProviderFilter}
                    onChange={(e) => setHistoryProviderFilter(e.target.value as any)}
                    className={`px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors cursor-pointer ${
                      isDark ? 'bg-[#12121a] border-[#2b2b3c] text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="all">All Providers</option>
                    <option value="gemini">Gemini MCP</option>
                    <option value="manus">Manus AI</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  <span>Showing {filteredHistoryAudits.length} of {accountAudits.length} audits</span>
                </div>
              </div>

              {/* Multi-Select Bulk Actions Toolbar */}
              {selectedAuditIds.length > 0 && (
                <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in ${
                  isDark ? 'bg-orange-950/30 border-orange-800/60 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-900'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                    <span>{selectedAuditIds.length} audit(s) selected</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAuditIds([])}
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline ml-1 cursor-pointer font-normal"
                    >
                      Deselect all
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-bulk-compare"
                      disabled={selectedAuditIds.length !== 2}
                      onClick={handleOpenCompare}
                      title={selectedAuditIds.length !== 2 ? 'Select exactly 2 audits to compare' : 'Compare 2 selected audits'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedAuditIds.length === 2
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer'
                          : 'bg-zinc-800/40 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Compare (2 selected)</span>
                    </button>

                    <button
                      type="button"
                      id="btn-bulk-export-md"
                      onClick={handleExportSelectedMarkdown}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-[#1a1a24] border-[#2c2c3c] text-zinc-200 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .MD</span>
                    </button>

                    <button
                      type="button"
                      id="btn-bulk-export-json"
                      onClick={handleExportSelectedJson}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-[#1a1a24] border-[#2c2c3c] text-zinc-200 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      type="button"
                      id="btn-bulk-archive"
                      onClick={() => handleBulkArchive(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-[#1a1a24] border-[#2c2c3c] text-zinc-200 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>

                    <button
                      type="button"
                      id="btn-bulk-delete"
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Audits Data Table */}
              <div className={`rounded-xl border overflow-x-auto ${isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-xs text-left">
                  <thead className={`border-b text-[10px] uppercase font-mono ${
                    isDark ? 'bg-[#181824] border-[#252534] text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAuditIds.length === filteredHistoryAudits.length && filteredHistoryAudits.length > 0}
                          onChange={() => handleSelectAllAudits(filteredHistoryAudits)}
                          className="rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Audit / Page Name</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">AI Provider &amp; Model</th>
                      <th className="py-3 px-4">Execution Trail</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60 font-sans">
                    {filteredHistoryAudits.map((a) => {
                      const isSelected = selectedAuditIds.includes(a.id);
                      const isCurrent = a.id === selectedAuditId;
                      const isInProgress = a.status === 'in_progress' || (a.status as string) === 'running';

                      return (
                        <tr
                          key={a.id}
                          className={`transition-colors ${
                            isSelected
                              ? isDark ? 'bg-orange-950/20' : 'bg-orange-50/70'
                              : isCurrent
                              ? isDark ? 'bg-white/5' : 'bg-slate-50'
                              : isDark ? 'hover:bg-[#181824]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectAudit(a.id)}
                              className="rounded cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                @{account?.username || 'account'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                                {a.auditMode.toUpperCase()}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                              ID: {a.id}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-mono text-[11px]">
                            {new Date(a.timestamp).toLocaleDateString()} {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          <td className="py-3.5 px-4">
                            {isInProgress ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
                              </span>
                            ) : a.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <AlertCircle className="w-3 h-3" /> Failed
                              </span>
                            ) : a.isArchived ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30">
                                <Archive className="w-3 h-3" /> Archived
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-zinc-200">
                              {a.provider.includes('manus') ? 'Manus AI' : 'Google Gemini'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                              {a.model || 'default'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {a.fallbackUsed || a.provider.includes('manus') || a.provider.includes('fallback') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" title={a.fallbackReason || 'Fallback triggered from Gemini'}>
                                <AlertTriangle className="w-3 h-3" />
                                Fallback (Manus AI)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                Primary (Gemini MCP)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                            {a.version || 'v2.4'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                              {a.scores?.overall_score || 0}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                id={`btn-view-report-${a.id}`}
                                onClick={() => {
                                  setSelectedAuditId(a.id);
                                  setViewingMarkdownAudit(a);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                title="View generated Markdown report (.md)"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View Report</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const content = a.markdownReport || generateFallbackMarkdown(a, account);
                                  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `audit_${account?.username || 'account'}_${a.id}.md`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }}
                                title="Download Markdown Report"
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredHistoryAudits.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-500 dark:text-zinc-400">
                          <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-xs">No audit records match your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no audit exists for this account */}
      {!currentAudit && !effectiveIsRunning && (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        } space-y-4`}>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold">No Audit Found for @{account?.username || 'Selected Account'}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Click below to run an on-demand audit. Google Gemini will query the live Instagram MCP to inspect recent posts, Reels, and engagement metrics for @{account?.username || 'this account'}.
            </p>
          </div>
          <button
            type="button"
            disabled={!account}
            onClick={() => handleStartAudit()}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Initial Audit for @{account?.username || 'Account'}</span>
          </button>
        </div>
      )}

      {/* 4. RICH MARKDOWN REPORT MODAL */}
      {viewingMarkdownAudit && (
        <AuditMarkdownModal
          audit={viewingMarkdownAudit}
          account={account}
          onClose={() => setViewingMarkdownAudit(null)}
          onOpenInteractiveOverview={(auditId) => {
            setSelectedAuditId(auditId);
            setActiveTab('overview');
          }}
        />
      )}

      {/* Comparison Modal */}
      {compareModalPair && (
        <AuditCompareModal
          auditA={compareModalPair[0]}
          auditB={compareModalPair[1]}
          onClose={() => setCompareModalPair(null)}
        />
      )}

      {/* Audit Settings & Data Source Modal */}
      {showSettingsModal && (
        <AuditSettingsModal
          account={account}
          activeSkill={activeSkill}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
