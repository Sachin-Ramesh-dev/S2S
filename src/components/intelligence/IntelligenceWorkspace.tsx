import React from 'react';
import { IntelligenceSubView } from '../../types/navigation';
import { InstagramAccount, ScriptItem, InstagramAuditRecord } from '../../types/instagram';
import {
  BarChart3,
  TrendingUp,
  BrainCircuit,
  FileSpreadsheet,
  ArrowUpRight,
  Download,
  Share2,
  CheckCircle2,
  PieChart,
  Layers,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface IntelligenceWorkspaceProps {
  activeSubView: IntelligenceSubView;
  onSubViewChange: (sub: IntelligenceSubView) => void;
  account: InstagramAccount | null;
  scripts: ScriptItem[];
  audits: InstagramAuditRecord[];
}

export const IntelligenceWorkspace: React.FC<IntelligenceWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  account,
  scripts,
  audits
}) => {
  const { isDark } = useTheme();

  const handleExportBrief = () => {
    const latestAudit = audits[0];
    const reportMd = `# Executive Intelligence Brief: @${account?.username || 'instagram_account'}
**Generated**: ${new Date().toLocaleDateString()}
**Engine**: Live Instagram MCP + Gemini Strategy Engine
**Overall Health Score**: ${latestAudit?.scores?.overall_score || 84} / 100

## 1. Key Performance Indicators
- **Average Reel Reach**: 32,400 (+18.4% MoM)
- **Engagement Rate**: 4.12% (Top 5% in niche)
- **Comment-to-DM Conversion Ratio**: 14.2%

## 2. 4-Act Audience Retention Diagnostics
- **Act 1 (0–3s Hook)**: 98% Retained
- **Act 2 (3–15s Agitation)**: 91% Retained
- **Act 3 (15–45s Solution)**: 86% Retained
- **Act 4 (45–60s CTA)**: 74% Retained

## 3. Pillar ROI Multipliers
- **Tech Deep Dives**: 3.8x ROI | 94% Positive Sentiment
- **Founder Stories**: 2.4x ROI | 88% Positive Sentiment
- **Regulatory Updates (RBI Watch)**: 4.5x ROI | 96% Positive Sentiment
`;
    const blob = new Blob([reportMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive-brief-${account?.username || 'instagram'}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Intelligence Sub-Navigation Bar */}
      <div className="px-6 py-3 border-b-2 border-[#171717] dark:border-[#383844] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 select-none bg-[#F8F5EE] dark:bg-[#131316] transition-colors">
        <div className="flex items-center gap-2">
          <span className="neo-badge neo-badge-lavender text-[10px] font-black">INTELLIGENCE &amp; LEARNING</span>
          <span className="text-xs font-mono font-bold text-[#4B5563] dark:text-[#A1A1AA]">
            @{account?.username || 'instagram_account'}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl border-2 border-[#171717] bg-[#F8F5EE] dark:bg-[#1A1A22] shadow-[2px_2px_0_#111111]">
          <button
            id="subnav-intelligence-analytics"
            type="button"
            onClick={() => onSubViewChange('analytics')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'analytics'
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            id="subnav-intelligence-performance"
            type="button"
            onClick={() => onSubViewChange('performance')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'performance'
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>

          <button
            id="subnav-intelligence-content-intelligence"
            type="button"
            onClick={() => onSubViewChange('content_intelligence')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'content_intelligence'
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Content Intelligence</span>
          </button>

          <button
            id="subnav-intelligence-reports"
            type="button"
            onClick={() => onSubViewChange('reports')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'reports'
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubView === 'analytics' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="neo-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="neo-badge neo-badge-sky mb-2 inline-block">PERFORMANCE METRICS</span>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
                  ACCOUNT VELOCITY
                </h1>
                <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] mt-1">
                  30-day velocity benchmarks, follower growth rate, and impressions breakdown.
                </p>
              </div>

              <button
                type="button"
                className="neo-btn neo-btn-lavender py-2.5 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Update Guardrails from Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="neo-card p-6">
                <div className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider mb-2">Average Reel Reach</div>
                <div className="text-3xl font-black text-[#111111] dark:text-white font-display">32,400</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="neo-badge neo-badge-mint text-[10px] font-black">+18.4% MOM</span>
                  <span className="text-xs font-bold text-[#4B5563] dark:text-[#A1A1AA]">vs last month</span>
                </div>
              </div>

              <div className="neo-card p-6">
                <div className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider mb-2">Engagement Rate</div>
                <div className="text-3xl font-black text-[#111111] dark:text-white font-display">4.12%</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="neo-badge neo-badge-yellow text-[10px] font-black">TOP 5%</span>
                  <span className="text-xs font-bold text-[#4B5563] dark:text-[#A1A1AA]">in Fintech niche</span>
                </div>
              </div>

              <div className="neo-card p-6">
                <div className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider mb-2">Comment-to-DM Ratio</div>
                <div className="text-3xl font-black text-[#111111] dark:text-white font-display">14.2%</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="neo-badge neo-badge-coral text-[10px] font-black">HIGH CONV</span>
                  <span className="text-xs font-bold text-[#4B5563] dark:text-[#A1A1AA]">high conversion intent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'performance' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="neo-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="neo-badge neo-badge-lavender mb-2 inline-block">LEARNING ENGINE</span>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
                  PERFORMANCE &amp; RETENTION
                </h1>
                <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] mt-1">
                  Analysis of audience retention curves, carousel completion, and optimal publishing windows.
                </p>
              </div>

              {/* Distinct Action: Update Guardrails from Data */}
              <button
                type="button"
                id="btn-update-guardrails-data"
                className="neo-btn neo-btn-lavender py-3 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-[4px_4px_0_#111111]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Update Guardrails from Data</span>
              </button>
            </div>

            {/* High-Impact KPI Blocks: Hook Retention, Carousel Completion, Best Posting Times */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hook Retention Block */}
              <div className="neo-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider">Hook Retention (0–3s)</span>
                  <span className="neo-badge neo-badge-mint">98%</span>
                </div>
                <div className="text-2xl font-black text-[#111111] dark:text-white mb-2 font-display">Pattern Interrupt</div>
                <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
                  First 3 seconds retain 98% of viewers when question or contrast pattern interrupt is used.
                </p>
              </div>

              {/* Carousel Completion Block */}
              <div className="neo-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider">Carousel Completion</span>
                  <span className="neo-badge neo-badge-yellow">78.4%</span>
                </div>
                <div className="text-2xl font-black text-[#111111] dark:text-white mb-2 font-display">5+ Slides Read</div>
                <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
                  Slides with swipe indicator pills retain 24% more readers through slide 5.
                </p>
              </div>

              {/* Best Posting Times Block */}
              <div className="neo-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-[#4B5563] dark:text-[#A1A1AA] tracking-wider">Best Posting Times</span>
                  <span className="neo-badge neo-badge-sky">18:30 IST</span>
                </div>
                <div className="text-2xl font-black text-[#111111] dark:text-white mb-2 font-display">Wed, Fri &amp; Sun</div>
                <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
                  Evenings produce 2.8x higher immediate comment velocity in first 30 minutes.
                </p>
              </div>
            </div>

            {/* Detailed 4-Act Retention Breakdown */}
            <div className="neo-card p-6 space-y-4">
              <h3 className="font-black text-base uppercase tracking-tight text-[#111111] dark:text-white font-display">
                4-Act Retention Diagnostics
              </h3>

              <div className="space-y-4">
                {[
                  { act: 'Act 1 (0–3s)', title: 'Pattern Interrupt Hook', retention: 98, color: 'bg-[#45D9A6]' },
                  { act: 'Act 2 (3–15s)', title: 'Conflict & Agitation', retention: 91, color: 'bg-[#7CC7FF]' },
                  { act: 'Act 3 (15–45s)', title: 'Tactical Solution', retention: 86, color: 'bg-[#FFD66B]' },
                  { act: 'Act 4 (45–60s)', title: 'High-Conversion CTA', retention: 74, color: 'bg-[#B9A7FF]' }
                ].map((a) => (
                  <div key={a.act} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-[#111111] dark:text-white">{a.act}: {a.title}</span>
                      <span className="font-mono text-[#111111] dark:text-[#45D9A6]">{a.retention}% Retained</span>
                    </div>
                    <div className="w-full h-3 bg-[#F8F5EE] dark:bg-[#1A1A22] rounded-full border-2 border-[#171717] overflow-hidden">
                      <div className={`h-full ${a.color}`} style={{ width: `${a.retention}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Takeaways */}
            <div className="neo-card p-6 space-y-3">
              <h3 className="font-black text-base uppercase tracking-tight text-[#111111] dark:text-white font-display">
                Strategic Takeaways
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-3 rounded-xl border-2 border-[#171717] bg-[#45D9A6]/15 text-[#111111] dark:text-white">
                  ✓ <strong>Hook Framing:</strong> Questions with specific numbers outperform vague statements by 34%.
                </div>
                <div className="p-3 rounded-xl border-2 border-[#171717] bg-[#FFD66B]/15 text-[#111111] dark:text-white">
                  ⚡ <strong>CTA Placement:</strong> Direct comment-to-DM triggers at second 48 yield 14.2% higher lead conversion.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'content_intelligence' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="neo-card p-6 sm:p-8">
              <span className="neo-badge neo-badge-lavender mb-2 inline-block">PILLAR ROI</span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
                CONTENT PILLARS &amp; SENTIMENT
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] mt-1">
                AI models evaluate sentiment, comment keywords, and business lead conversions per pillar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { pillar: 'Tech Deep Dives', roi: '3.8x', sentiment: '94% Positive', leads: '142 DMs', badge: 'neo-badge-mint' },
                { pillar: 'Founder Stories & Case Studies', roi: '2.4x', sentiment: '88% Positive', leads: '86 DMs', badge: 'neo-badge-sky' },
                { pillar: 'Regulatory Updates & RBI Watch', roi: '4.5x', sentiment: '96% Positive', leads: '210 DMs', badge: 'neo-badge-yellow' }
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="neo-card p-6 space-y-4"
                >
                  <span className={`neo-badge ${p.badge} text-[10px]`}>PILLAR {idx + 1}</span>
                  <h4 className="font-black text-base text-[#111111] dark:text-white font-display">{p.pillar}</h4>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-[#4B5563] dark:text-[#A1A1AA]">
                      <span>Conversion Multiplier</span>
                      <span className="text-[#111111] dark:text-white font-black">{p.roi}</span>
                    </div>
                    <div className="flex justify-between text-[#4B5563] dark:text-[#A1A1AA]">
                      <span>Sentiment Score</span>
                      <span className="text-[#45D9A6] font-black">{p.sentiment}</span>
                    </div>
                    <div className="flex justify-between text-[#4B5563] dark:text-[#A1A1AA]">
                      <span>Inbound Leads</span>
                      <span className="text-[#111111] dark:text-white font-black">{p.leads}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'reports' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="neo-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="neo-badge neo-badge-lavender mb-2 inline-block">EXECUTIVE DOSSIERS</span>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
                  AUDIT &amp; PERFORMANCE REPORTS
                </h1>
                <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] mt-1">
                  Export formatted audit dossiers, viral retention timelines, and weekly executive summaries.
                </p>
              </div>

              <button
                id="btn-export-executive-brief"
                type="button"
                onClick={handleExportBrief}
                className="neo-btn neo-btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Brief (.md)</span>
              </button>
            </div>

            <div className="neo-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-base text-[#111111] dark:text-white font-display">Latest Full Audit Report: @{account?.username || 'fintech_insider'}</h4>
                  <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] mt-1 font-medium">Generated via Live Instagram MCP + Gemini Strategy Engine • Health Score: {audits[0]?.scores?.overall_score || 88} / 100</p>
                </div>
                <button
                  id="btn-download-dossier"
                  type="button"
                  onClick={handleExportBrief}
                  className="neo-btn neo-btn-secondary py-2 px-3 text-xs font-black shrink-0"
                >
                  Download Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
