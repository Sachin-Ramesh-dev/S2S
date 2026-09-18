import React from 'react';
import { StrategySubView } from '../../types/navigation';
import { InstagramAccount, InstagramAuditRecord, TopicIdea } from '../../types/instagram';
import { InstagramAuditView } from '../instagram/InstagramAuditView';
import {
  Compass,
  Users,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Plus,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StrategyWorkspaceProps {
  activeSubView: StrategySubView;
  onSubViewChange: (sub: StrategySubView) => void;
  account: InstagramAccount | null;
  audits: InstagramAuditRecord[];
  onRunAudit: () => void;
  isRunningAudit: boolean;
  onGenerateTopicsFromAudit: (params: { pillars: string[]; deficitNotes: string }) => void;
  onNavigateToContentTopics?: () => void;
}

export const StrategyWorkspace: React.FC<StrategyWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  account,
  audits,
  onRunAudit,
  isRunningAudit,
  onGenerateTopicsFromAudit,
  onNavigateToContentTopics
}) => {
  const { isDark } = useTheme();
  const latestAudit = audits[0] || null;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Strategy Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-bold text-sm tracking-tight">Strategy Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30">
          <button
            id="subnav-strategy-audit"
            type="button"
            onClick={() => onSubViewChange('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'audit'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Page Audit</span>
          </button>

          <button
            id="subnav-strategy-competitors"
            type="button"
            onClick={() => onSubViewChange('competitors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'competitors'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Competitors</span>
          </button>

          <button
            id="subnav-strategy-opportunities"
            type="button"
            onClick={() => onSubViewChange('opportunities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'opportunities'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Opportunities</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubView === 'audit' && (
          <InstagramAuditView
            account={account}
            audits={audits}
            onRunAudit={onRunAudit}
            isRunningAudit={isRunningAudit}
            onGenerateTopicsFromAudit={onGenerateTopicsFromAudit}
          />
        )}

        {activeSubView === 'competitors' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Competitor Intelligence &amp; Benchmarks</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Track rival creator and enterprise handles, benchmark follower growth, and spot hooks dominating your niche.
                </p>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track New Competitor</span>
              </button>
            </div>

            {/* Competitor Benchmark Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Account Card */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#181824] border-orange-500/40 shadow-lg shadow-orange-950/10' : 'bg-orange-50/50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EA580C] text-white">
                    Your Profile
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">4.12% Eng.</span>
                </div>
                <h3 className="font-bold text-base">@{account?.username || 'fintech_insider'}</h3>
                <p className="text-xs text-zinc-400 mb-4">{account?.displayName || 'FinTech Insider Daily'}</p>
                <div className="text-2xl font-black text-white">
                  {account ? (account.followersCount / 1000).toFixed(1) + 'k' : '185.2k'}
                  <span className="text-xs font-normal text-zinc-400 ml-1.5">followers</span>
                </div>
              </div>

              {/* Competitor 1 */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#151520] border-[#2a2a3c]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    Competitor 1
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">1.80% Eng.</span>
                </div>
                <h3 className="font-bold text-base">@techcrunch</h3>
                <p className="text-xs text-zinc-400 mb-4">TechCrunch Global News</p>
                <div className="text-2xl font-black text-white">
                  1.5M <span className="text-xs font-normal text-zinc-400 ml-1.5">followers</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                  Global benchmark for tech news &amp; startup founder rounds.
                </p>
              </div>

              {/* Competitor 2 */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#151520] border-[#2a2a3c]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    Competitor 2
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">3.65% Eng.</span>
                </div>
                <h3 className="font-bold text-base">@inc42</h3>
                <p className="text-xs text-zinc-400 mb-4">Inc42 Media</p>
                <div className="text-2xl font-black text-white">
                  340.0k <span className="text-xs font-normal text-zinc-400 ml-1.5">followers</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                  Dominates short-form founder reels and carousel teardowns.
                </p>
              </div>
            </div>

            {/* Gap Analysis Card */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#161622] border-[#2a2a3c]' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Competitor Format Gaps Spotted by Manus AI</span>
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Competitors are over-indexing on basic news headlines, creating a major content gap for <strong>tactical breakdown reels</strong> with retention hooks.
              </p>

              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#1c1c28] border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-white">Opportunity #1: "RBI Policy &amp; UPI 2.0 Behind the Scenes"</span>
                    <p className="text-[11px] text-zinc-400">Competitors cover regulations as dry text. 4-act pattern interrupt reel will outperform by 3.2x.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onGenerateTopicsFromAudit({
                        pillars: ['Regulatory Updates & RBI Watch'],
                        deficitNotes: 'Gap identified in competitor breakdown reels'
                      });
                    }}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Generate Topics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'opportunities' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">AI Content Opportunities &amp; Pillar Deficits</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Real-time detection of content pillars below their target allocation, with immediate bridges to topic generation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToContentTopics) onNavigateToContentTopics();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Approved Topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pillar Balance Bar */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#161622] border-[#2a2a3c]' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold text-sm mb-4">Content Pillar Distribution vs. Targets</h3>

              <div className="space-y-4">
                {account?.contentPillars?.map((pillar) => {
                  const isDeficit = pillar.currentPercentage < pillar.targetPercentage;
                  return (
                    <div key={pillar.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{pillar.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={isDeficit ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {pillar.currentPercentage}% Current
                          </span>
                          <span className="text-zinc-500">/ {pillar.targetPercentage}% Target</span>
                          {isDeficit && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                              Deficit (-{pillar.targetPercentage - pillar.currentPercentage}%)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDeficit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pillar.currentPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
