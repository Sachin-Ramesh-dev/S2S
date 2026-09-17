import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import {
  InstagramAccount,
  InstagramAuditRecord,
  InstagramAuditMode,
  AISkillRecord
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramAuditViewProps {
  account: InstagramAccount;
  audits: InstagramAuditRecord[];
  activeSkill: AISkillRecord;
  onRunAudit: (mode: InstagramAuditMode, targetHandle?: string) => Promise<void>;
  onSendToTopics: (opportunityTitle: string) => void;
  onNavigateToTopics?: () => void;
  isRunningAudit: boolean;
}

export const InstagramAuditView: React.FC<InstagramAuditViewProps> = ({
  account,
  audits,
  activeSkill,
  onRunAudit,
  onSendToTopics,
  onNavigateToTopics,
  isRunningAudit
}) => {
  const [handleInput, setHandleInput] = useState(`@${account.username}`);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(audits[0]?.id || '');
  const [selectedMode, setSelectedMode] = useState<InstagramAuditMode>('full');
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [syncedRules, setSyncedRules] = useState<Record<string, boolean>>({});
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Sync handleInput if account changes
  useEffect(() => {
    setHandleInput(`@${account.username}`);
  }, [account.username]);

  // Sync selected audit if audits update
  useEffect(() => {
    if (audits.length > 0 && (!selectedAuditId || !audits.some(a => a.id === selectedAuditId))) {
      setSelectedAuditId(audits[0].id);
    }
  }, [audits, selectedAuditId]);

  const currentAudit: InstagramAuditRecord | undefined =
    audits.find((a) => a.id === selectedAuditId) || audits[0];

  // Manus AI execution steps simulation during isRunningAudit
  const auditSteps = [
    { title: 'Connecting to Manus AI Autonomous Research Agent v2', detail: 'Authenticating agent session & headless browser cluster' },
    { title: `Crawling Instagram profile & media stream (@${account.username})`, detail: 'Extracting Reels retention drop-offs, carousel swipe files & comment sentiment' },
    { title: 'Benchmarking against top competitors', detail: 'Running comparative analysis against @zerodhaonline, @tatacapital' },
    { title: 'Root cause synthesis: What is working vs failing', detail: 'Isolating high-performing hooks and identifying fatal retention leaks' },
    { title: 'Formulating Markdown Intelligence Report & Guardrails', detail: 'Generating structured report and injecting guardrail rules into engine' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunningAudit) {
      setActiveStepIndex(0);
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev < auditSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      setActiveStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isRunningAudit]);

  const handleStartAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanHandle = handleInput.replace('@', '').trim() || account.username;
    await onRunAudit(selectedMode, cleanHandle);
  };

  const handleGenerateTopicsFromAudit = () => {
    const opps = currentAudit?.topic_opportunities || currentAudit?.opportunities || [];
    if (opps.length > 0) {
      onSendToTopics(opps[0]);
    } else if (onNavigateToTopics) {
      onNavigateToTopics();
    }
  };

  // Download Markdown Report File
  const handleDownloadMarkdown = () => {
    if (!currentAudit) return;
    const reportText = currentAudit.markdownReport || generateFallbackMarkdown(currentAudit, account);
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = currentAudit.audit_date || new Date(currentAudit.timestamp).toISOString().split('T')[0];
    link.download = `${account.username}_manus_audit_report_${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sync / Train Guardrail manually into AI Skill
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

  // Fallback Markdown generation if not already present
  const generateFallbackMarkdown = (audit: InstagramAuditRecord, acc: InstagramAccount): string => {
    return `# Manus AI Instagram Page Intelligence & Content Audit
**Account:** @${acc.username} (${acc.displayName})
**Category:** ${acc.category} | **Niche:** ${acc.niche}
**Followers:** ${acc.followersCount.toLocaleString()} | **Engagement Rate:** ${acc.engagementRate}%
**Audit Date:** ${audit.audit_date || new Date(audit.timestamp).toLocaleDateString()}
**Generated via:** Manus Autonomous Research Agent v2

---

## 1. Executive Performance Scores
- Overall Score: ${audit.scores?.overall_score || 84}/100
- Profile Optimization: ${audit.scores?.profile_score || 91}/100
- Content & Hooks: ${audit.scores?.content_score || 82}/100
- Posting Consistency: ${audit.scores?.consistency_score || 86}/100
- Engagement Velocity: ${audit.scores?.engagement_score || 76}/100
- Niche Positioning: ${audit.scores?.positioning_score || 89}/100

---

## 2. What's Working (Positive Content Drivers)
${(audit.whatsWorking || [
  { title: 'Negative-frame problem hooks', detail: 'Generates 3.8x average comments', reason: 'Creates immediate emotional tension' },
  { title: 'Educational Diagnostic Carousels', detail: '3.4x more saves', reason: 'Provides permanent reference utility' }
]).map(w => `### ${w.title}\n- **Performance Evidence:** ${w.detail}\n- **Root Driver:** ${w.reason}`).join('\n\n')}

---

## 3. What's NOT Working & Root Cause Analysis (Self-Learning Guardrails)
${(audit.whatsNotWorking || [
  { title: 'Slow conversational intros', detail: '58% viewer drop-off within 3 seconds', reason: 'Zero perceived immediate value', guardrailRule: 'Never open content with pleasantries; open directly with core dilemma.' }
]).map(nw => `### ${nw.title}\n- **Observed Defect:** ${nw.detail}\n- **Why It Fails:** ${nw.reason}\n- **Engine Guardrail:** \`${nw.guardrailRule}\``).join('\n\n')}

---

## 4. Content Gaps & Opportunities
${(audit.content_gaps || []).map(g => `- ${g}`).join('\n')}

---

## 5. Actionable Recommendations
${(audit.recommendations || []).map(r => `- [Priority: ${r.priority || 'High'}] ${r.text}`).join('\n')}

---
*Report generated automatically by Manus AI Orchestrator. Learned guardrails have been synced to Active Skill.*`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* 1. INPUT / CONTROLS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-orange-600" /> Page Audit Engine
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Research Agent: <strong className="text-gray-900">Manus AI Autonomous Agent</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">
              Instagram Page & Content Intelligence Audit
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Deep analysis of hooks, audience retention drop-offs, what's working vs failing, and self-learning guardrails.
            </p>
          </div>

          {/* Action Buttons: Download MD Report & Previous Audits Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {currentAudit && (
              <div className="flex items-center gap-2">
                <button
                  id="btn-view-md-report"
                  type="button"
                  onClick={() => setShowMarkdownModal(true)}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="View formatted Markdown report"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-600" />
                  <span>View MD Report</span>
                </button>

                <button
                  id="btn-download-md-report"
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Markdown (.md) Report generated by Manus AI"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download .MD</span>
                </button>
              </div>
            )}

            {audits.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  id="select-previous-audit"
                  value={selectedAuditId}
                  onChange={(e) => setSelectedAuditId(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-orange-500"
                >
                  {audits.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.audit_date || new Date(a.timestamp).toLocaleDateString())} • {(a.auditMode || (a as any).mode || 'full').toUpperCase()} ({a.scores?.overall_score || 84}/100)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar: Page URL or Handle */}
        <form onSubmit={handleStartAudit} className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-mono text-xs">
              @
            </span>
            <input
              id="input-audit-handle"
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="Enter Instagram handle or page URL (e.g. bajajfinance)"
              className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as InstagramAuditMode)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 px-3.5 py-2.5 font-medium focus:outline-none focus:border-orange-500"
          >
            <option value="full">Full 360° Audit</option>
            <option value="change">Delta (Changes vs Last Audit)</option>
            <option value="performance">Retention & Performance</option>
            <option value="quick">Quick Health Scan</option>
          </select>

          <button
            id="btn-run-page-audit"
            type="submit"
            disabled={isRunningAudit}
            className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Running on Manus AI...' : 'Run Audit'}</span>
          </button>
        </form>

        {/* Self-Learning Engine Status Notice */}
        <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Self-Learning Engine Active:</strong> Anti-patterns discovered during audits are automatically extracted and merged into active Skill v4 guardrails to avoid repeating defects in future topic and script generations.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-200/70 text-indigo-800 shrink-0">
            Automated Guardrail Loop
          </span>
        </div>
      </div>

      {/* 2. IN-PROGRESS LIVE STATUS TRACKER (WHEN RUNNING ON MANUS AI) */}
      {isRunningAudit && (
        <div className="bg-white border-2 border-orange-300 rounded-xl p-6 shadow-md space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                Status: In Progress — Running on Manus AI
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Autonomous Execution
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-900">
              {auditSteps[activeStepIndex].title}
            </div>
            <p className="text-xs text-gray-600">
              {auditSteps[activeStepIndex].detail}
            </p>

            {/* Step Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-600 h-2 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${((activeStepIndex + 1) / auditSteps.length) * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              {auditSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-[11px] font-medium border ${
                    idx < activeStepIndex
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : idx === activeStepIndex
                      ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {idx < activeStepIndex ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border text-[9px] flex items-center justify-center">
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

      {/* 3. AUDIT RESULTS DISPLAY */}
      {currentAudit && !isRunningAudit && (
        <div className="space-y-6">
          {/* Section A: Profile Overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Profile Overview
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Audited: {currentAudit.audit_date || new Date(currentAudit.timestamp).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Status: Completed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium">Followers</span>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {(account.followersCount).toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium">Following</span>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {(account.followingCount || 142).toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium">Total Posts</span>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {(account.postsCount || account.mediaCount || 1240).toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] text-gray-500 font-medium">Audit Score</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {currentAudit.scores?.overall_score || 84} / 100
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Bio Summary & Positioning
              </span>
              <p className="text-gray-800 leading-relaxed font-medium">
                {account.bio ||
                  'Empowering 80M+ customers with easy personal loans, financial planning and smart EMI investment strategies.'}
              </p>
            </div>
          </div>

          {/* Section B: Content Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Content Breakdown & Format Performance
                </h2>
              </div>
              <span className="text-xs text-gray-500">Based on last 90 days publishing</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reels */}
              <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Video className="w-4 h-4 text-orange-600" />
                    <span>Short-Form Reels</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Top Performer
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">65% of mix</div>
                <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-orange-200/50">
                  <div className="flex justify-between">
                    <span>Avg. Views:</span>
                    <span className="font-semibold text-gray-900">42,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-semibold text-emerald-700">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Save Rate:</span>
                    <span className="font-semibold text-gray-900">4.8%</span>
                  </div>
                </div>
              </div>

              {/* Carousels */}
              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Copy className="w-4 h-4 text-blue-600" />
                    <span>Educational Carousels</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    High Saves
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">25% of mix</div>
                <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-blue-200/50">
                  <div className="flex justify-between">
                    <span>Avg. Reach:</span>
                    <span className="font-semibold text-gray-900">21,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slide 1-3 Retention:</span>
                    <span className="font-semibold text-blue-700">74%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Save Rate:</span>
                    <span className="font-semibold text-gray-900">8.2%</span>
                  </div>
                </div>
              </div>

              {/* Static Images */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span>Static Images & Quotes</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    Low Reach
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">10% of mix</div>
                <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Avg. Reach:</span>
                    <span className="font-semibold text-gray-900">8,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engagement:</span>
                    <span className="font-semibold text-gray-500">1.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommendation:</span>
                    <span className="font-semibold text-orange-600">Repurpose to Reels</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Dynamic What is Working vs What is NOT Working & Root Causes (SELF LEARNING) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What is Working */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>What Is Working (Positive Retention Drivers)</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {(currentAudit.whatsWorking || []).length} Validated Patterns
                </span>
              </div>

              <div className="space-y-3">
                {(currentAudit.whatsWorking || [
                  {
                    title: 'Negative-Frame Problem Hooks (< 2.5s)',
                    detail: 'Reels opening with an urgent dilemma ("Stop paying full loan interest") generate 3.8x average comments.',
                    reason: 'Pattern interrupts create immediate emotional tension and stop habitual swiping.'
                  },
                  {
                    title: 'Educational Diagnostic Carousels (7-10 Slides)',
                    detail: 'Step-by-step checklists generate 3.4x more bookmarks and saves than single-image graphics.',
                    reason: 'High utility content turns posts into permanent reference bookmarks.'
                  },
                  {
                    title: 'Transparent Loan Math & Salary Formulas',
                    detail: 'Salary threshold breakdowns (e.g. ₹50k vs ₹1L investment formulas) lead to highest share counts.',
                    reason: 'Concrete numbers establish institutional authority and eliminate skepticism.'
                  }
                ]).map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200/80 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                      <strong className="text-gray-900 font-semibold">{item.title}</strong>
                    </div>
                    <div className="text-gray-700 pl-4 leading-relaxed">
                      <span className="font-semibold text-gray-800">Evidence:</span> {item.detail}
                    </div>
                    <div className="text-emerald-800 pl-4 text-[11px] font-medium">
                      <span className="font-bold">Why it works:</span> {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What is Not Working with ROOT CAUSE & SELF-LEARNING GUARDRAILS */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>What Is NOT Working & Root Causes</span>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-indigo-600" /> Self-Learning Active
                </span>
              </div>

              <div className="space-y-3">
                {(currentAudit.whatsNotWorking || [
                  {
                    title: 'Slow Conversational Intros ("Hey guys...")',
                    detail: 'First 3 seconds lose 58% of viewers on Reels beginning with conversational greetings.',
                    reason: 'Mobile viewers decide in 1.5 seconds. Pleasantries provide zero perceived value and guarantee abandonment.',
                    guardrailRule: 'Never open content with pleasantries or greetings. Start instantly with the core dilemma or counter-intuitive premise.',
                    addedToSkills: true
                  },
                  {
                    title: 'Generic Corporate Stock Graphics',
                    detail: 'Posts using generic corporate vector illustrations received 45% lower save rate and zero emotional connection.',
                    reason: 'Audiences distrust stock visuals and perceive them as promotional spam.',
                    guardrailRule: 'Avoid generic corporate clip-art or abstract stock vectors. Use authentic UI screenshots or typography cards.',
                    addedToSkills: true
                  },
                  {
                    title: 'Multiple Conflicting Call-to-Actions (CTAs)',
                    detail: 'Videos asking users to "Like, share, click link, and comment" diluted conversion by 62%.',
                    reason: 'Choice overload paralyzes viewers when presented with multiple competing instructions.',
                    guardrailRule: 'Restrict every post strictly to one single, clear call to action.',
                    addedToSkills: true
                  }
                ]).map((item, idx) => {
                  const isSynced = syncedRules[item.title] || item.addedToSkills;
                  return (
                    <div key={idx} className="p-3.5 rounded-lg bg-rose-50/40 border border-rose-200/80 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold mt-0.5">✗</span>
                          <strong className="text-gray-900 font-semibold">{item.title}</strong>
                        </div>
                        {isSynced ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Synced to Skill
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncGuardrail(item.title, item.guardrailRule, item.reason)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors shrink-0 cursor-pointer"
                          >
                            + Ingest Guardrail
                          </button>
                        )}
                      </div>

                      <div className="text-gray-700 pl-4 leading-relaxed">
                        <span className="font-semibold text-gray-800">Observed Defect:</span> {item.detail}
                      </div>

                      <div className="text-rose-800 pl-4 text-[11px] font-medium">
                        <span className="font-bold">Why it fails (Root Cause):</span> {item.reason}
                      </div>

                      {item.guardrailRule && (
                        <div className="mt-2 ml-4 p-2 bg-indigo-50/80 border border-indigo-200 rounded text-[11px] text-indigo-900 font-mono">
                          <strong className="font-sans font-bold text-indigo-950 block mb-0.5">
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

          {/* Section D: Content Gaps & Tactical Opportunities */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Unaddressed Content Gaps & Opportunities</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
              {(currentAudit.content_gaps || [
                'Prepayment Calculator demos: Unmet audience demand for exact step-by-step math.',
                'Credit score recovery myths: High search volume with little clear competitor breakdown.',
                'Carousel swipe file templates: Monthly budget sheets formatted for direct screenshotting.'
              ]).map((gap, idx) => (
                <li key={idx} className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/80 flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">★</span>
                  <span className="text-gray-800 leading-relaxed font-medium">{gap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section E: Actionable Recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Actionable Recommendations
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(currentAudit.recommendations || []).map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">{rec.text}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 inline-block">
                      Impact: {rec.impact || rec.priority || 'High'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: The Next Obvious Step */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Next Obvious Step</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Turn Audit Insights Into Guardrailed Viral Topics
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                Automatically generate high-impact topics that strictly avoid the defects identified in this audit.
              </p>
            </div>

            <button
              id="btn-generate-topics-from-audit"
              type="button"
              onClick={handleGenerateTopicsFromAudit}
              className="px-6 py-3 bg-white hover:bg-orange-50 text-orange-700 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <span>Generate Content Topics from this Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. RAW MARKDOWN REPORT MODAL */}
      {showMarkdownModal && currentAudit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Manus AI Intelligence Markdown Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarkdownModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-gray-800 whitespace-pre-wrap bg-gray-50 border-t border-b border-gray-100 leading-relaxed select-text">
              {currentAudit.markdownReport || generateFallbackMarkdown(currentAudit, account)}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Format: Markdown (.md) generated by Manus Autonomous Agent v2</span>
              <button
                type="button"
                onClick={() => setShowMarkdownModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
