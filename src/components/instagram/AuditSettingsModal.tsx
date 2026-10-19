import React from 'react';
import {
  X,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Users,
  Layers,
  Key,
  Activity,
  Instagram
} from 'lucide-react';
import { InstagramAccount, AISkillRecord } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface AuditSettingsModalProps {
  account: InstagramAccount | null;
  activeSkill?: AISkillRecord;
  onClose: () => void;
}

export const AuditSettingsModal: React.FC<AuditSettingsModalProps> = ({
  account,
  onClose,
}) => {
  const { isDark } = useTheme();

  const followersFormatted = account
    ? account.followersCount >= 1000000
      ? (account.followersCount / 1000000).toFixed(2) + 'M'
      : (account.followersCount / 1000).toFixed(1) + 'k'
    : '0';

  const isConnected = !!account && !account.isDemo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#14141c] border-[#2c2c3c] text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#262636] bg-[#181824]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Account Connection Diagnostics</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live Meta Graph API connection status and profile health
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
          {/* Section 1: Connected Profile Identity */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>@{account?.username || 'No Account Selected'}</span>
                    {isConnected ? (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                        LIVE CONNECTED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {account?.category || account?.displayName || 'Instagram Professional Account'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-neutral-900 dark:text-white">{followersFormatted}</div>
                <div className="text-[10px] text-zinc-400 uppercase font-mono">Followers</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <div className={`p-2.5 rounded-lg border text-[11px] ${
                isDark ? 'bg-[#12121a] border-[#222232]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-zinc-400 block font-mono text-[10px]">ACCOUNT ID</span>
                <span className="font-mono font-semibold truncate block">{account?.id || '—'}</span>
              </div>
              <div className={`p-2.5 rounded-lg border text-[11px] ${
                isDark ? 'bg-[#12121a] border-[#222232]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-zinc-400 block font-mono text-[10px]">API PROTOCOL</span>
                <span className="font-mono font-semibold truncate block">Meta Graph API v20.0</span>
              </div>
            </div>
          </div>

          {/* Section 2: Connection Status & Permissions */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Authorized Capabilities &amp; Permissions</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { name: 'Profile Insights & Metrics', scope: 'instagram_manage_insights', status: 'Active' },
                { name: 'Media Publishing & Scheduling', scope: 'instagram_content_publish', status: 'Active' },
                { name: 'Page & Asset Discovery', scope: 'pages_show_list', status: 'Active' },
                { name: 'Basic Profile & Media Read', scope: 'instagram_basic', status: 'Active' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDark ? 'bg-[#181824] border-[#2a2a3c]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-medium leading-tight">{item.name}</div>
                    <code className="text-[9px] text-zinc-400 block font-mono mt-0.5">{item.scope}</code>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${
          isDark ? 'border-[#262636] bg-[#181824]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connection Live</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
