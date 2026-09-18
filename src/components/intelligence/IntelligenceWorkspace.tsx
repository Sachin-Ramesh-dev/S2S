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

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Intelligence Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-bold text-sm tracking-tight">Intelligence Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30">
          <button
            id="subnav-intelligence-analytics"
            type="button"
            onClick={() => onSubViewChange('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'analytics'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            id="subnav-intelligence-performance"
            type="button"
            onClick={() => onSubViewChange('performance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'performance'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>

          <button
            id="subnav-intelligence-content"
            type="button"
            onClick={() => onSubViewChange('content_intelligence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'content_intelligence'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Content Intelligence</span>
          </button>

          <button
            id="subnav-intelligence-reports"
            type="button"
            onClick={() => onSubViewChange('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'reports'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
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
            <div>
              <h2 className="text-xl font-bold tracking-tight">Account Analytics &amp; Velocity</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                30-day velocity benchmarks, follower growth rate, and impressions breakdown.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
                <div className="text-xs text-zinc-400 mb-1">Average Reel Reach</div>
                <div className="text-2xl font-black text-white">32,400</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+18.4% vs last month</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
                <div className="text-xs text-zinc-400 mb-1">Engagement Rate</div>
                <div className="text-2xl font-black text-white">4.12%</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Top 5% in Fintech niche</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
                <div className="text-xs text-zinc-400 mb-1">Comment-to-DM Ratio</div>
                <div className="text-2xl font-black text-white">14.2%</div>
                <div className="text-[11px] text-orange-400 font-semibold mt-2 flex items-center gap-1">
                  <span>High conversion intent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'performance' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight">4-Act Hook Retention Diagnostics</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Analysis of audience retention across the 4 acts: 0–3s hook, 3–15s agitation, 15–45s solution, and 45–60s CTA.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
            }`}>
              <h3 className="font-bold text-sm text-white">Audience Retention Curve (0s – 60s)</h3>

              <div className="space-y-3">
                {[
                  { act: 'Act 1 (0–3s)', title: 'Pattern Interrupt Hook', retention: 98, color: 'bg-emerald-500' },
                  { act: 'Act 2 (3–15s)', title: 'Conflict & Agitation', retention: 91, color: 'bg-teal-500' },
                  { act: 'Act 3 (15–45s)', title: 'Tactical Solution', retention: 86, color: 'bg-blue-500' },
                  { act: 'Act 4 (45–60s)', title: 'High-Conversion CTA', retention: 74, color: 'bg-purple-500' }
                ].map((a) => (
                  <div key={a.act} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{a.act}: {a.title}</span>
                      <span className="font-bold text-emerald-400">{a.retention}% Retained</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${a.color} rounded-full`} style={{ width: `${a.retention}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'content_intelligence' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Content Pillar ROI &amp; Audience Sentiment</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                AI models evaluate sentiment, comment keywords, and business lead conversions per pillar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { pillar: 'Tech Deep Dives', roi: '3.8x', sentiment: '94% Positive', leads: '142 DMs' },
                { pillar: 'Founder Stories & Case Studies', roi: '2.4x', sentiment: '88% Positive', leads: '86 DMs' },
                { pillar: 'Regulatory Updates & RBI Watch', roi: '4.5x', sentiment: '96% Positive', leads: '210 DMs' }
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm text-white mb-3">{p.pillar}</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Conversion Multiplier</span>
                      <span className="font-bold text-orange-400">{p.roi}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Sentiment Score</span>
                      <span className="font-bold text-emerald-400">{p.sentiment}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Inbound Leads</span>
                      <span className="font-bold text-white">{p.leads}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'reports' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Executive Audit &amp; Performance Reports</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Export formatted audit dossiers, viral retention timelines, and weekly executive summaries.
                </p>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Executive Brief (.md)</span>
              </button>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Latest Full Audit Report: @{account?.username || 'fintech_insider'}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Generated via Manus AI Strategy Engine • Health Score: 88 / 100</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
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
