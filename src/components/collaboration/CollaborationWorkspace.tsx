import React, { useState } from 'react';
import { CollaborationSubView } from '../../types/navigation';
import { InstagramAccount, ScriptItem, TopicIdea, TeamMember } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import {
  Users,
  CheckCircle2,
  MessageSquare,
  Globe,
  Shield,
  Clock,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Check,
  Copy
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CollaborationWorkspaceProps {
  activeSubView: CollaborationSubView;
  onSubViewChange: (sub: CollaborationSubView) => void;
  account: InstagramAccount | null;
  scripts: ScriptItem[];
  topics: TopicIdea[];
  teamMembers?: TeamMember[];
  onOpenScript?: (id: string) => void;
  onApproveScript?: (id: string) => Promise<void> | void;
}

export const CollaborationWorkspace: React.FC<CollaborationWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  account,
  scripts,
  topics,
  teamMembers: initialTeamMembers = [],
  onOpenScript,
  onApproveScript
}) => {
  const { isDark } = useTheme();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers.length > 0 ? initialTeamMembers : [
    { id: 'tm-1', name: 'Sachin Ramesh', role: 'Workspace Owner' as any, email: 'sachin@enterprise.internal', active: true, assignedAudits: 5, avatarUrl: '' },
    { id: 'tm-2', name: 'Priya Sharma', role: 'Lead Scriptwriter' as any, email: 'priya@enterprise.internal', active: true, assignedAudits: 3, avatarUrl: '' },
    { id: 'tm-3', name: 'Vikram Mehta', role: 'Brand & Legal Reviewer' as any, email: 'vikram@enterprise.internal', active: true, assignedAudits: 2, avatarUrl: '' }
  ]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (scriptId: string) => {
    setApprovingId(scriptId);
    try {
      if (onApproveScript) {
        await onApproveScript(scriptId);
      } else {
        await instagramApi.updateScript(scriptId, { status: 'approved' });
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleInviteMember = async () => {
    const name = window.prompt('Enter team member name:');
    if (!name) return;
    const email = window.prompt('Enter team member email:');
    if (!email) return;
    try {
      const created = await instagramApi.addTeamMember({
        name,
        email,
        role: 'Creator' as any,
        active: true
      });
      setTeamMembers(prev => [...prev, created]);
      alert(`Team member ${name} (${email}) invited successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to invite team member');
    }
  };

  const handleCopyClientLink = () => {
    const link = `https://s2s.internal/portal/client/${account?.username || 'brand'}-access-token`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Collaboration Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Collaboration Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30">
          <button
            id="subnav-collaboration-approvals"
            type="button"
            onClick={() => onSubViewChange('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'approvals'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approvals</span>
          </button>

          <button
            id="subnav-collaboration-comments"
            type="button"
            onClick={() => onSubViewChange('comments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'comments'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments</span>
          </button>

          <button
            id="subnav-collaboration-team"
            type="button"
            onClick={() => onSubViewChange('team')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'team'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </button>

          <button
            id="subnav-collaboration-client-portal"
            type="button"
            onClick={() => onSubViewChange('client_portal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'client_portal'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Client Portal</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubView === 'approvals' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Editorial Sign-Off Queue</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Review and approve scripts before automated peak-hour publishing to Instagram.
              </p>
            </div>

            <div className="space-y-3">
              {scripts.slice(0, 5).map((script) => (
                <div
                  key={script.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        script.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {script.status.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{script.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 italic">"{script.hookSentence}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenScript && (
                      <button
                        type="button"
                        onClick={() => onOpenScript(script.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                      >
                        Inspect Script
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={script.status === 'approved' || approvingId === script.id}
                      onClick={() => handleApprove(script.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60 ${
                        script.status === 'approved'
                          ? 'bg-emerald-700 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{script.status === 'approved' ? 'Approved' : approvingId === script.id ? 'Approving...' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'comments' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Editorial Feedback &amp; Revisions</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                In-line revision notes left by editors on hook retention sentences and compliance disclaimers.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">Editor (Sarah L.) on Act 1 Hook</span>
                  <span>10 mins ago</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-zinc-300">"Tighten the first 3 seconds: replace 'Understanding your EMI' with 'Stop paying EMI before checking this RBI rule'."</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">Legal &amp; Compliance on Act 4 CTA</span>
                  <span>1 hour ago</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-zinc-300">"Ensure SEBI/RBI registered disclaimer appears on screen for at least 2 seconds during the CTA act."</p>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'team' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Team &amp; Permissions</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Manage creator, reviewer, and administrator roles across your Instagram profiles.
                </p>
              </div>

              <button
                id="btn-invite-team-member"
                type="button"
                onClick={handleInviteMember}
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Team Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teamMembers.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      {String(m.role || 'Member')}
                    </span>
                    <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{String(m.role || 'Member')}</p>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    {m.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'client_portal' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">External Client Portal</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Shareable, read-only approval view for external brand managers, executives, and clients.
                </p>
              </div>

              <button
                id="btn-open-client-link"
                type="button"
                onClick={handleCopyClientLink}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Open Live Client Link'}</span>
              </button>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  CP
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Client Presentation View: @{account?.username || 'fintech_insider'}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Clients can review scheduled posts, play video drafts, and sign off with 1 click.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                <span>Secure Link: <code className="text-emerald-600 dark:text-emerald-400">https://s2s.internal/portal/client/ig-{account?.username || 'account'}-token982</code></span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">PIN Protected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


