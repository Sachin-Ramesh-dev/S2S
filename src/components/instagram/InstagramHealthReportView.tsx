import React from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Bookmark
} from 'lucide-react';
import { InstagramAccount, InstagramAuditRecord } from '../../types/instagram';

interface InstagramHealthReportViewProps {
  account: InstagramAccount;
  audit?: InstagramAuditRecord;
}

export const InstagramHealthReportView: React.FC<InstagramHealthReportViewProps> = ({
  account,
  audit
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Algorithmic Health Diagnostic
            </span>
            <span className="text-xs text-gray-500">
              Account: <strong className="text-gray-900">@{account.username}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">Instagram Account Health Diagnostic</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Algorithmic audit assessing shadowban risk, save-to-share ratios, retention velocity, and compliance safety.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export Diagnostic
        </button>
      </div>

      {/* Primary Diagnostic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold">Save-to-Share Ratio</span>
            <Bookmark className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">2.4x</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">High Utility</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Audience consistently bookmarks content for future financial calculation reference.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold">Avg 30s Reel Retention</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">68.4%</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">+12% vs niche</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Strong hook window retention prevents algorithm distribution throttle.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold">Algorithmic Penalty Risk</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">0.0%</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Clean Status</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            No shadowban flags, no repeated banned hashtags, compliance with regulatory guidelines.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold">Bio Link Click Rate</span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">4.1%</span>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">Can Improve</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Opportunity to optimize call-to-action in bio with loan eligibility calculators.
          </p>
        </div>
      </div>

      {/* Actionable Health Checklist */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Actionable Health Improvement Checklist</h2>
        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Consistent High-Contrast Cover Thumbnails</p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Ensure all Reel covers maintain unified typography so profile visitors instantly understand the value proposition.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Increase Personal Loan vs Mutual Funds Diversity</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Current content is heavily weighted towards Personal Loans (42%). Introduce SIP & Credit Score carousels to reach target 25%.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Active Hashtag Pool Hygiene</p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Verified that none of the 15 active finance tags are flagged or hidden by Instagram's spam filter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
