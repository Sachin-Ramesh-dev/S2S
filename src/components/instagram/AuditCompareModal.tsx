import React from 'react';
import { X, ArrowRight, TrendingUp, TrendingDown, Minus, Download, Sparkles, Bot, ShieldCheck, AlertTriangle } from 'lucide-react';
import { InstagramAuditRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface AuditCompareModalProps {
  auditA: InstagramAuditRecord;
  auditB: InstagramAuditRecord;
  onClose: () => void;
}

export const AuditCompareModal: React.FC<AuditCompareModalProps> = ({ auditA, auditB, onClose }) => {
  const { isDark } = useTheme();

  // Metrics to compare
  const metricKeys = [
    { key: 'overall_score', label: 'Overall Audit Score' },
    { key: 'profile_score', label: 'Profile & Bio Optimization' },
    { key: 'content_score', label: 'Content Strategy & Formats' },
    { key: 'consistency_score', label: 'Publishing Cadence & Timing' },
    { key: 'engagement_score', label: 'Audience Interaction & Retention' },
    { key: 'positioning_score', label: 'Brand Positioning & Niche Authority' }
  ] as const;

  const getDelta = (key: keyof typeof auditA.scores) => {
    const valA = auditA.scores?.[key] || 0;
    const valB = auditB.scores?.[key] || 0;
    return valB - valA;
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# Audit Comparison Report: @${auditA.accountId}`,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `## Audit A (Base)`,
      `- Date: ${new Date(auditA.timestamp).toLocaleString()}`,
      `- Mode: ${auditA.auditMode.toUpperCase()}`,
      `- Provider: ${auditA.provider} (${auditA.model})`,
      `- Fallback Triggered: ${auditA.fallbackUsed ? 'Yes (Manus AI)' : 'No (Primary)'}`,
      `- Overall Score: ${auditA.scores?.overall_score || 0}/100`,
      ``,
      `## Audit B (Comparison)`,
      `- Date: ${new Date(auditB.timestamp).toLocaleString()}`,
      `- Mode: ${auditB.auditMode.toUpperCase()}`,
      `- Provider: ${auditB.provider} (${auditB.model})`,
      `- Fallback Triggered: ${auditB.fallbackUsed ? 'Yes (Manus AI)' : 'No (Primary)'}`,
      `- Overall Score: ${auditB.scores?.overall_score || 0}/100`,
      ``,
      `## Score Deltas`,
      `| Metric | Audit A | Audit B | Delta |`,
      `| :--- | :---: | :---: | :---: |`,
      ...metricKeys.map(m => {
        const valA = auditA.scores?.[m.key as keyof typeof auditA.scores] || 0;
        const valB = auditB.scores?.[m.key as keyof typeof auditB.scores] || 0;
        const delta = valB - valA;
        const sign = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '0%';
        return `| ${m.label} | ${valA}% | ${valB}% | ${sign} |`;
      }),
      ``,
      `## Audit A - What Was Working`,
      ...(auditA.whatsWorking || []).map(w => `- **${w.title}**: ${w.detail}`),
      ``,
      `## Audit B - What Is Working Now`,
      ...(auditB.whatsWorking || []).map(w => `- **${w.title}**: ${w.detail}`),
      ``,
      `## Critical Gaps Shift`,
      `### Audit A Gaps`,
      ...(auditA.critical_issues || auditA.content_gaps || []).map(g => `- ${g}`),
      ``,
      `### Audit B Gaps`,
      ...(auditB.critical_issues || auditB.content_gaps || []).map(g => `- ${g}`)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_comparison_${auditA.id}_vs_${auditB.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      comparisonGeneratedAt: new Date().toISOString(),
      auditA: {
        id: auditA.id,
        date: auditA.timestamp,
        mode: auditA.auditMode,
        provider: auditA.provider,
        model: auditA.model,
        fallbackUsed: auditA.fallbackUsed,
        scores: auditA.scores,
        whatsWorking: auditA.whatsWorking,
        critical_issues: auditA.critical_issues
      },
      auditB: {
        id: auditB.id,
        date: auditB.timestamp,
        mode: auditB.auditMode,
        provider: auditB.provider,
        model: auditB.model,
        fallbackUsed: auditB.fallbackUsed,
        scores: auditB.scores,
        whatsWorking: auditB.whatsWorking,
        critical_issues: auditB.critical_issues
      },
      deltas: metricKeys.reduce((acc, m) => {
        const valA = auditA.scores?.[m.key as keyof typeof auditA.scores] || 0;
        const valB = auditB.scores?.[m.key as keyof typeof auditB.scores] || 0;
        return { ...acc, [m.key]: valB - valA };
      }, {})
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_comparison_${auditA.id}_vs_${auditB.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="modal-audit-compare"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-[#252534]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
              VS
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Side-by-Side Audit Comparison</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Compare score shifts, provider audit trails, and strategic evolution between two audit snapshots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'bg-[#1b1b26] border-[#2e2e42] text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'bg-[#1b1b26] border-[#2e2e42] text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit A */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#191924] border-[#272738]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30">
                  BASE AUDIT (A)
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                  {new Date(auditA.timestamp).toLocaleDateString()} {new Date(auditA.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                @{auditA.accountId.replace('ig-', '')} • {auditA.auditMode.toUpperCase()}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {auditA.provider} ({auditA.model})
                </span>
                {auditA.fallbackUsed ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Fallback (Manus AI)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Primary (Gemini MCP)
                  </span>
                )}
              </div>
            </div>

            {/* Audit B */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#191924] border-[#272738]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/30">
                  COMPARISON AUDIT (B)
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                  {new Date(auditB.timestamp).toLocaleDateString()} {new Date(auditB.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                @{auditB.accountId.replace('ig-', '')} • {auditB.auditMode.toUpperCase()}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {auditB.provider} ({auditB.model})
                </span>
                {auditB.fallbackUsed ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Fallback (Manus AI)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Primary (Gemini MCP)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score Deltas Table */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#252534]' : 'border-slate-200'}`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-[#181824] border-[#252534]' : 'bg-slate-100 border-slate-200'}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Scorecard Metrics Delta</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">B minus A calculation</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className={`border-b text-[10px] uppercase font-mono ${isDark ? 'bg-[#14141c] border-[#252534] text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <tr>
                  <th className="py-2.5 px-4">Performance Metric</th>
                  <th className="py-2.5 px-4 text-center">Audit A</th>
                  <th className="py-2.5 px-4 text-center">Audit B</th>
                  <th className="py-2.5 px-4 text-right">Net Shift (Delta)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60 font-mono">
                {metricKeys.map((m) => {
                  const valA = auditA.scores?.[m.key as keyof typeof auditA.scores] || 0;
                  const valB = auditB.scores?.[m.key as keyof typeof auditB.scores] || 0;
                  const delta = getDelta(m.key as keyof typeof auditA.scores);

                  return (
                    <tr key={m.key} className={`transition-colors ${isDark ? 'hover:bg-[#181824]' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                        {m.label}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-zinc-300">
                        {valA}%
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-zinc-300">
                        {valB}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        {delta > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <TrendingUp className="w-3 h-3" />
                            +{delta}%
                          </span>
                        ) : delta < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <TrendingDown className="w-3 h-3" />
                            {delta}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                            <Minus className="w-3 h-3" />
                            0%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Strategic Shift Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit A Working */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#191924] border-[#272738]' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Audit A: Key Drivers Working
              </h4>
              <div className="space-y-2 text-xs">
                {(auditA.whatsWorking || []).slice(0, 3).map((w, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#13131c] border-[#222230]' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-slate-800 dark:text-zinc-200">{w.title}</div>
                    <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{w.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit B Working */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#191924] border-[#272738]' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Audit B: Key Drivers Working
              </h4>
              <div className="space-y-2 text-xs">
                {(auditB.whatsWorking || []).slice(0, 3).map((w, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#13131c] border-[#222230]' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-slate-800 dark:text-zinc-200">{w.title}</div>
                    <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{w.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
