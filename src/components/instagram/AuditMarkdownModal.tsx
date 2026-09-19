import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  Code,
  Eye,
  ExternalLink,
  Bot,
  Sparkles,
  Calendar,
  Layers,
  BarChart2
} from 'lucide-react';
import { InstagramAccount, InstagramAuditRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface AuditMarkdownModalProps {
  audit: InstagramAuditRecord;
  account: InstagramAccount | null;
  onClose: () => void;
  onOpenInteractiveOverview?: (auditId: string) => void;
}

export const AuditMarkdownModal: React.FC<AuditMarkdownModalProps> = ({
  audit,
  account,
  onClose,
  onOpenInteractiveOverview
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [copied, setCopied] = useState(false);

  // Markdown content
  const markdownContent = audit.markdownReport || generateFallbackMarkdown(audit, account);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_${account?.username || 'account'}_${audit.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isManus = audit.provider === 'manus' || (audit.markdownReport && audit.markdownReport.includes('Manus'));
  const providerLabel = isManus ? 'Manus AI Research Engine' : 'Google Gemini Strategy Agent';
  const score = audit.scores?.overall_score ?? 0;

  return (
    <div
      id="modal-audit-markdown"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-[#252534] bg-[#181824]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  @{account?.username || 'account'} Audit Report (.md)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                  {audit.auditMode?.toUpperCase() || 'FULL'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                  isManus
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}>
                  <Bot className="w-3 h-3" />
                  {isManus ? 'Manus AI' : 'Gemini MCP'}
                </span>
                {score > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {score}% SCORE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>Generated {new Date(audit.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">ID: {audit.id}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-black/10 dark:bg-black/30 border border-zinc-700/30 text-xs">
              <button
                type="button"
                id="btn-md-view-rendered"
                onClick={() => setViewMode('rendered')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'rendered'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                id="btn-md-view-raw"
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw .MD</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              id="btn-md-copy"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : isDark
                  ? 'bg-[#1b1b26] border-[#2e2e42] text-zinc-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Copy markdown to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              id="btn-md-download"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-markdown-modal"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 select-text">
          {viewMode === 'rendered' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
              <RenderMarkdownContent content={markdownContent} isDark={isDark} />
            </div>
          ) : (
            <pre className={`p-5 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border select-text ${
              isDark ? 'bg-[#101017] text-zinc-200 border-[#222230]' : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}>
              {markdownContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#141419] border-[#252534] text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Engine: {providerLabel} ({audit.model || 'live-model'})</span>
            {audit.fallbackUsed && (
              <span className="text-amber-500">• Fallback active</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenInteractiveOverview && (
              <button
                type="button"
                id="btn-open-interactive-overview"
                onClick={() => {
                  onOpenInteractiveOverview(audit.id);
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1e1e2c] border-[#303044] text-orange-400 hover:text-orange-300'
                    : 'bg-white border-slate-300 text-orange-600 hover:bg-orange-50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Open in Interactive Overview</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clean Markdown Renderer without external dependencies
const RenderMarkdownContent: React.FC<{ content: string; isDark: boolean }> = ({ content, isDark }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const header = tableRows[0];
    const rows = tableRows.slice(2); // skip separator row
    const res = (
      <div key={`table-${key}`} className={`my-4 overflow-x-auto rounded-xl border ${isDark ? 'border-[#272738]' : 'border-slate-200'}`}>
        <table className="w-full text-xs text-left">
          <thead className={isDark ? 'bg-[#1a1a26] text-zinc-300' : 'bg-slate-100 text-slate-700'}>
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="px-3.5 py-2.5 font-bold">{col.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#222232]' : 'divide-slate-200'}`}>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                {row.map((col, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 font-mono">{col.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return res;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cols = line.split('|').slice(1, -1);
      tableRows.push(cols);
      continue;
    } else if (inTable) {
      elements.push(flushTable(i));
    }

    // Horizontal divider
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <hr key={i} className={`my-4 border-t ${isDark ? 'border-[#262638]' : 'border-slate-200'}`} />
      );
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-black tracking-tight text-orange-500 mt-6 mb-3 pb-2 border-b border-orange-500/20">
          {line.replace('# ', '')}
        </h1>
      );
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className={`text-base font-bold mt-5 mb-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className={`text-sm font-semibold mt-3 mb-1 text-orange-600 dark:text-orange-400`}>
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }

    // List item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2);
      elements.push(
        <li key={i} className="ml-4 list-disc text-xs leading-relaxed text-slate-700 dark:text-zinc-300 my-1">
          {renderFormattedInline(text, isDark)}
        </li>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+\.)\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 my-1 ml-2">
            <span className="font-mono text-orange-500 font-bold shrink-0">{match[1]}</span>
            <span>{renderFormattedInline(match[2], isDark)}</span>
          </div>
        );
        continue;
      }
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
        {renderFormattedInline(line, isDark)}
      </p>
    );
  }

  if (inTable) {
    elements.push(flushTable(lines.length));
  }

  return <div className="space-y-1">{elements}</div>;
};

// Formats **bold**, `code`, and links in a line
function renderFormattedInline(text: string, isDark: boolean): React.ReactNode {
  // Regex to split by bold or inline code
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
            isDark ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function generateFallbackMarkdown(audit: InstagramAuditRecord, account: InstagramAccount | null): string {
  return `# Instagram Page Audit: @${account?.username || 'account'}
**Generated:** ${new Date(audit.timestamp).toLocaleString()}
**Mode:** ${audit.auditMode?.toUpperCase() || 'FULL'}
**Overall Score:** ${audit.scores?.overall_score || 0}/100

---

## 1. Executive Performance Scores
- Overall Score: ${audit.scores?.overall_score || 0}/100
- Profile & Bio Optimization: ${audit.scores?.profile_score || 0}/100
- Content Strategy & Formats: ${audit.scores?.content_score || 0}/100
- Publishing Cadence & Timing: ${audit.scores?.consistency_score || 0}/100
- Audience Interaction & Retention: ${audit.scores?.engagement_score || 0}/100
- Brand Positioning & Niche Authority: ${audit.scores?.positioning_score || 0}/100

---

## 2. What's Working
${(audit.whatsWorking || []).map(w => `- **${w.title}**: ${w.detail} (${w.reason})`).join('\n') || '- No specific drivers recorded.'}

---

## 3. What's NOT Working
${(audit.whatsNotWorking || []).map(w => `- **${w.title}**: ${w.detail} (Guardrail: ${w.guardrailRule})`).join('\n') || '- No critical defects recorded.'}
`;
}
