import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  FileText,
  Calendar,
  Settings,
  AlertCircle,
  ChevronDown,
  Instagram,
  Plus,
  Check,
  Building2,
  X,
  Kanban,
  Share2
} from 'lucide-react';
import {
  InstagramAccount,
  InstagramAuditRecord,
  TopicIdea,
  ContentPipelineItem,
  PipelineStage,
  ScriptItem,
  CalendarPost,
  AIConfiguration,
  AISkillRecord,
  InstagramAuditMode,
  TeamMember
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { InstagramDashboard } from './InstagramDashboard';
import { InstagramAuditView } from './InstagramAuditView';
import { InstagramTopicsView } from './InstagramTopicsView';
import { InstagramScriptsView } from './InstagramScriptsView';
import { InstagramSwimlaneView } from './InstagramSwimlaneView';
import { InstagramCalendarView } from './InstagramCalendarView';
import { InstagramConnectModal } from './InstagramConnectModal';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

export type InstagramSubTab =
  | 'dashboard'
  | 'audit'
  | 'topics'
  | 'scripts'
  | 'swimlane'
  | 'calendar';

interface InstagramWorkspaceProps {
  onOpenSettings?: () => void;
  onNavigateToSettings?: (tab?: string, subTab?: string) => void;
}

export const InstagramWorkspace: React.FC<InstagramWorkspaceProps> = ({
  onOpenSettings,
  onNavigateToSettings
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<InstagramSubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-Account States
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Core Data States
  const [audits, setAudits] = useState<InstagramAuditRecord[]>([]);
  const [topics, setTopics] = useState<TopicIdea[]>([]);
  const [pipeline, setPipeline] = useState<ContentPipelineItem[]>([]);
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [calendar, setCalendar] = useState<CalendarPost[]>([]);
  const [config, setConfig] = useState<AIConfiguration | null>(null);
  const [skills, setSkills] = useState<AISkillRecord[]>([]);
  const [activeSkill, setActiveSkill] = useState<AISkillRecord | null>(null);
  const [selectedScriptForEditor, setSelectedScriptForEditor] = useState<string | undefined>(undefined);

  // Action / Generation States
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial Load
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        accList,
        auditList,
        topicList,
        pipeList,
        scriptList,
        calList,
        cfg,
        skillList,
        memberList
      ] = await Promise.all([
        instagramApi.getAccounts(),
        instagramApi.getAuditHistory(),
        instagramApi.getTopics(),
        instagramApi.getPipeline(),
        instagramApi.getScripts(),
        instagramApi.getCalendar(),
        instagramApi.getConfiguration(),
        instagramApi.getSkillHistory(),
        instagramApi.getTeamMembers()
      ]);

      const initialAccList = accList.length > 0 ? accList : [
        {
          id: 'acc-bajaj',
          username: 'bajajfinance',
          displayName: 'Bajaj Finserv Official',
          followersCount: 84500,
          followingCount: 142,
          postsCount: 1240,
          engagementRate: 3.42,
          category: 'Banking & Financial Services',
          niche: 'Personal Loans & EMI Cards',
          bio: 'India\'s fastest personal loans, smart EMI card financing and debt management.'
        }
      ];

      setAccounts(initialAccList);
      setSelectedAccount(initialAccList[0]);
      setAudits(auditList);
      setTopics(topicList);
      setPipeline(pipeList);
      setScripts(scriptList);
      setTeamMembers(memberList || []);
      setCalendar(calList);
      setConfig(cfg);
      setSkills(skillList);
      setActiveSkill(skillList.find((s) => s.isActive) || skillList[0] || null);
    } catch (err: any) {
      console.error('Failed to load Instagram data:', err);
      setError(err.message || 'Failed to connect to Instagram intelligence services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Switch Instagram Account
  const handleSwitchAccount = async (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    setSelectedAccount(target);
    setIsAccountDropdownOpen(false);
    showToast(`Switched active workspace to @${target.username}`, 'info');

    try {
      const [accAudits, accTopics, accScripts, accCalendar] = await Promise.all([
        instagramApi.getAudits(target.id),
        instagramApi.getTopics(target.id),
        instagramApi.getScripts(target.id),
        instagramApi.getCalendar(target.id)
      ]);
      setAudits(accAudits.length > 0 ? accAudits : audits);
      setTopics(accTopics.length > 0 ? accTopics : topics);
      setScripts(accScripts.length > 0 ? accScripts : scripts);
      setCalendar(accCalendar.length > 0 ? accCalendar : calendar);
    } catch (e) {
      console.error('Error switching account datasets:', e);
    }
  };

  // Connect new Instagram Page via Manus
  const handlePageConnected = async (newAccount: InstagramAccount) => {
    setShowAddPageModal(false);
    try {
      const updatedAccounts = await instagramApi.getAccounts();
      setAccounts(updatedAccounts);
      setSelectedAccount(newAccount);
      await handleSwitchAccount(newAccount.id);
      showToast(`Connected @${newAccount.username} via Manus Instagram Gateway!`, 'success');
    } catch (err: any) {
      showToast(`Connected @${newAccount.username}`, 'success');
    }
  };

  // Actions
  const handleRunAudit = async (mode: InstagramAuditMode = 'full', targetHandle?: string) => {
    if (!selectedAccount) return;
    setIsRunningAudit(true);
    try {
      const cleanHandle = targetHandle || selectedAccount.username;
      const newAudit = await instagramApi.runAudit(cleanHandle, mode);
      setAudits([newAudit, ...audits]);
      showToast(`Manus AI Deep Audit completed for @${cleanHandle}. Anti-patterns saved to active skill!`, 'success');
      // Refresh skills to capture newly learned guardrails
      const updatedSkills = await instagramApi.getSkillHistory();
      setSkills(updatedSkills);
      setActiveSkill(updatedSkills.find(s => s.isActive) || updatedSkills[0] || null);
    } catch (err: any) {
      showToast(err.message || 'Audit execution failed', 'error');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleGenerateTopics = async (customAngle?: string) => {
    if (!selectedAccount) return;
    setIsGeneratingTopics(true);
    try {
      const newTopics = await instagramApi.generateTopics(selectedAccount.username, {
        count: 5,
        customAngle
      });
      setTopics([...newTopics, ...topics]);
      showToast(`Generated ${newTopics.length} new topics applying active guardrails!`, 'success');
      setActiveTab('topics');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate topics', 'error');
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleApproveTopic = async (topicId: string) => {
    try {
      const updated = await instagramApi.approveTopic(topicId);
      setTopics(topics.map((t) => (t.id === topicId ? updated : t)));
      showToast('Topic approved and sent to scriptwriter pipeline!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve topic', 'error');
    }
  };

  const handleRejectTopic = async (topicId: string, reason?: string, category?: string) => {
    try {
      const res = await instagramApi.rejectTopic(topicId, category || 'Too Generic', reason || 'Rejected by user');
      setTopics(topics.map((t) => (t.id === topicId ? (res || { ...t, status: 'rejected' }) : t)));
      if (reason) {
        showToast(`Topic rejected. Reason saved as negative constraint in Active Skill v4!`, 'success');
        const updatedSkills = await instagramApi.getSkillHistory();
        setSkills(updatedSkills);
        setActiveSkill(updatedSkills.find(s => s.isActive) || updatedSkills[0] || null);
      } else {
        showToast('Topic marked as rejected.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject topic', 'error');
    }
  };

  const handleMoveSelectedToScripts = async (topicIds: string[]) => {
    try {
      const res = await instagramApi.bulkSendToScripts(topicIds);
      showToast(`Converted ${res.createdScripts?.length || topicIds.length} topics into draft scripts!`, 'success');
      const updatedScripts = await instagramApi.getScripts();
      setScripts(updatedScripts);
      setActiveTab('scripts');
    } catch (err: any) {
      showToast(err.message || 'Failed to convert topics to scripts', 'error');
    }
  };

  const handleGenerateScript = async (topicId: string, format: 'Reel' | 'Carousel' = 'Reel') => {
    if (!selectedAccount) return;
    setIsGeneratingScript(true);
    try {
      const newScript = await instagramApi.generateScript(
        selectedAccount.id,
        topicId,
        format
      );
      setScripts([newScript, ...scripts]);
      showToast(`Viral script produced for: "${newScript.title}"`, 'success');
      setActiveTab('scripts');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate script', 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleSaveScript = async (scriptOrId: string | ScriptItem, updates?: Partial<ScriptItem>) => {
    try {
      let updated: ScriptItem;
      if (typeof scriptOrId === 'string') {
        updated = await instagramApi.updateScript(scriptOrId, updates || {});
        setScripts(scripts.map((s) => (s.id === scriptOrId ? updated : s)));
      } else {
        updated = await instagramApi.saveScript(scriptOrId);
        setScripts(scripts.map((s) => (s.id === scriptOrId.id ? updated : s)));
      }
      showToast('Script updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save script', 'error');
      throw err;
    }
  };

  const handleUpdateConfig = async (updates: Partial<AIConfiguration>) => {
    try {
      const updated = await instagramApi.updateConfiguration(updates);
      setConfig(updated);
      showToast('AI configuration saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update config', 'error');
    }
  };

  const handleResetRecommended = async () => {
    try {
      const reset = await instagramApi.resetToRecommendedConfig();
      setConfig(reset);
      showToast('Configuration restored to AI best practices', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset config', 'error');
    }
  };

  const handleSaveAccount = async (updates: Partial<InstagramAccount>) => {
    try {
      const updated = await instagramApi.updateAccount(updates);
      setSelectedAccount(updated);
      setAccounts(accounts.map((a) => (a.id === updated.id ? updated : a)));
      showToast('Instagram profile details updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update account', 'error');
    }
  };

  // Nav items
  const navItems: Array<{ key: InstagramSubTab; label: string; icon: any; badge?: number }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'audit', label: 'Page Audit', icon: Search },
    {
      key: 'topics',
      label: 'Topic Ideas',
      icon: Sparkles,
      badge: topics.filter((t) => t.status === 'pending' || t.status === 'suggested').length
    },
    { key: 'scripts', label: 'Scripts', icon: FileText, badge: scripts.filter((s) => s.status === 'draft').length },
    {
      key: 'swimlane',
      label: 'Swimlane View',
      icon: Kanban,
      badge: scripts.filter((s) => !s.assignedWriterId).length > 0 ? scripts.filter((s) => !s.assignedWriterId).length : undefined
    },
    { key: 'calendar', label: 'Content Calendar', icon: Calendar, badge: calendar.filter((c) => c.status === 'scheduled').length }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-gray-700">Loading Content & Audit Workspace...</p>
        <p className="text-[11px] text-gray-400 mt-1">Connecting to Instagram Intelligence Service</p>
      </div>
    );
  }

  if (error || !selectedAccount || !config || !activeSkill) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-gray-900 mb-1">Failed to Connect to Instagram Engine</h2>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">{error || 'Intelligence services are starting up.'}</p>
        <button
          type="button"
          onClick={loadAllData}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-colors duration-200 ${
        isDark ? 'bg-[#101015] text-[#f4f4f5]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-800'
              : isDark
              ? 'bg-zinc-900/90 text-zinc-200 border-zinc-700'
              : 'bg-white text-slate-800 border-slate-300 shadow-lg'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER: Multi-Page Switcher & Workflow Flow & Theme Toggle */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-2xl p-3 sm:px-5 shadow-xs transition-colors ${
          isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Content Flow Step Breadcrumbs */}
        <div
          className={`flex items-center gap-2 text-[11px] font-medium overflow-x-auto py-1 ${
            isDark ? 'text-[#9c9cb0]' : 'text-slate-500'
          }`}
        >
          <span className="text-[#EA580C] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" /> Flow:
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
            <span
              className={
                activeTab === 'audit'
                  ? isDark
                    ? 'text-white font-bold bg-[#252535] px-2 py-0.5 rounded border border-[#353548]'
                    : 'text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200'
                  : isDark
                  ? 'text-zinc-500'
                  : 'text-slate-400'
              }
            >
              Audit
            </span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>→</span>
            <span
              className={
                activeTab === 'topics'
                  ? isDark
                    ? 'text-white font-bold bg-[#252535] px-2 py-0.5 rounded border border-[#353548]'
                    : 'text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200'
                  : isDark
                  ? 'text-zinc-500'
                  : 'text-slate-400'
              }
            >
              Topics
            </span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>→</span>
            <span
              className={
                activeTab === 'scripts'
                  ? isDark
                    ? 'text-white font-bold bg-[#252535] px-2 py-0.5 rounded border border-[#353548]'
                    : 'text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200'
                  : isDark
                  ? 'text-zinc-500'
                  : 'text-slate-400'
              }
            >
              Scripts
            </span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>→</span>
            <span
              className={
                activeTab === 'swimlane'
                  ? isDark
                    ? 'text-white font-bold bg-[#252535] px-2 py-0.5 rounded border border-[#353548]'
                    : 'text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200'
                  : isDark
                  ? 'text-zinc-500'
                  : 'text-slate-400'
              }
            >
              Swimlane
            </span>
            <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>→</span>
            <span
              className={
                activeTab === 'calendar'
                  ? isDark
                    ? 'text-white font-bold bg-[#252535] px-2 py-0.5 rounded border border-[#353548]'
                    : 'text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200'
                  : isDark
                  ? 'text-zinc-500'
                  : 'text-slate-400'
              }
            >
              Schedule
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & Instagram Page Switcher Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle variant="pill" />

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              id="btn-instagram-page-switcher"
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-3 px-3.5 py-1.5 border rounded-xl text-xs transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#20202c] hover:bg-[#282838] border-[#36364a] text-white'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                      isDark ? 'bg-[#181820] text-white' : 'bg-white text-slate-900'
                    }`}
                  >
                    {selectedAccount.username.charAt(0)}
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-xs tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      @{selectedAccount.username}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-500 dark:text-orange-400 font-semibold border border-orange-500/30">
                      {(selectedAccount.followersCount / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                } ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Account Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 border rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 ${
                  isDark ? 'bg-[#1b1b26] border-[#343448]' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`px-3 py-2 border-b flex items-center justify-between ${
                    isDark ? 'border-[#28283a] text-[#8f8fa8]' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="font-bold uppercase tracking-wider text-[10px]">Switch Instagram Page</span>
                  <span className="text-[10px] font-mono">{accounts.length} Connected</span>
                </div>

                <div className="py-1.5 space-y-1 max-h-56 overflow-y-auto">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === selectedAccount.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSwitchAccount(acc.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? isDark
                              ? 'bg-[#28283a] text-white border border-[#404058]'
                              : 'bg-orange-50 text-slate-900 border border-orange-200'
                            : isDark
                            ? 'hover:bg-[#222232] text-zinc-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
                            <div
                              className={`w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                                isDark ? 'bg-[#1b1b26] text-white' : 'bg-white text-slate-900'
                              }`}
                            >
                              {acc.username.charAt(0)}
                            </div>
                          </div>
                          <div className="truncate">
                            <strong className="font-semibold block text-xs truncate">@{acc.username}</strong>
                            <span
                              className={`text-[10px] block truncate ${
                                isDark ? 'text-zinc-400' : 'text-slate-500'
                              }`}
                            >
                              {acc.displayName} • {(acc.followersCount).toLocaleString()} followers
                            </span>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className={`pt-2 border-t ${isDark ? 'border-[#28283a]' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      setShowAddPageModal(true);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Connect Instagram Page (Manus)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar (The 6 tabs) */}
      <div
        className={`border rounded-2xl p-1.5 shadow-xs overflow-x-auto transition-colors ${
          isDark ? 'bg-[#181820] border-[#282834]' : 'bg-white border-slate-200'
        }`}
      >
        <nav className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`tab-${item.key}`}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EA580C] text-white shadow-sm'
                    : isDark
                    ? 'text-[#9c9cb0] hover:text-white hover:bg-[#22222e]'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : isDark
                        ? 'bg-[#262638] text-zinc-300 border border-[#35354a]'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Workspace Content */}
      <div className="transition-all">
        {activeTab === 'dashboard' && (
          <InstagramDashboard
            account={selectedAccount}
            latestAudit={audits[0]}
            topics={topics}
            pipeline={pipeline}
            scripts={scripts}
            calendar={calendar}
            config={config}
            activeSkill={activeSkill}
            onNavigateTab={(tab) => setActiveTab(tab as InstagramSubTab)}
            onRunAudit={() => handleRunAudit('full')}
            onGenerateTopics={() => handleGenerateTopics()}
          />
        )}

        {activeTab === 'audit' && (
          <InstagramAuditView
            account={selectedAccount}
            audits={audits}
            activeSkill={activeSkill}
            onRunAudit={handleRunAudit}
            onSendToTopics={(opportunityTitle) => handleGenerateTopics(opportunityTitle)}
            onNavigateToTopics={() => setActiveTab('topics')}
            isRunningAudit={isRunningAudit}
            isGeneratingTopics={isGeneratingTopics}
          />
        )}

        {activeTab === 'topics' && (
          <InstagramTopicsView
            account={selectedAccount}
            topics={topics}
            activeSkill={activeSkill}
            onGenerateTopics={() => handleGenerateTopics()}
            onApproveTopic={handleApproveTopic}
            onRejectTopic={handleRejectTopic}
            onGenerateScript={handleGenerateScript}
            onTopicUpdated={loadAllData}
            onMoveSelectedToScripts={handleMoveSelectedToScripts}
            isGenerating={isGeneratingTopics}
            onNavigateToSettings={onNavigateToSettings}
          />
        )}

        {activeTab === 'scripts' && (
          <InstagramScriptsView
            scripts={scripts}
            activeSkill={activeSkill}
            teamMembers={teamMembers}
            initialSelectedScriptId={selectedScriptForEditor}
            onGenerateScript={handleGenerateScript}
            onSaveScript={handleSaveScript}
            onNavigateToCalendar={(scriptId) => setActiveTab('calendar')}
            onSwitchToSwimlane={() => setActiveTab('swimlane')}
            isGenerating={isGeneratingScript}
            onNavigateToSettings={onNavigateToSettings}
          />
        )}

        {activeTab === 'swimlane' && (
          <InstagramSwimlaneView
            scripts={scripts}
            teamMembers={teamMembers}
            onSaveScript={handleSaveScript}
            onOpenScriptEditor={(scriptId) => {
              setSelectedScriptForEditor(scriptId);
              setActiveTab('scripts');
            }}
            onAddTeamMember={async (member) => {
              const created = await instagramApi.addTeamMember(member);
              setTeamMembers((prev) => [...prev, created]);
              showToast(`Team member added: ${created.name} (${created.role})`, 'success');
              return created;
            }}
            onCreateScript={async (data) => {
              const created = await instagramApi.createManualScript({
                ...data,
                accountId: selectedAccount.id
              });
              setScripts((prev) => [created, ...prev]);
              showToast(`New script created: "${created.title}"`, 'success');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <InstagramCalendarView
            account={selectedAccount}
            calendar={calendar}
            scripts={scripts}
            onOpenScript={(scriptId) => {
              setActiveTab('scripts');
            }}
            onNavigateToScripts={() => setActiveTab('scripts')}
            onPostUpdated={loadAllData}
          />
        )}
      </div>

      {/* MODAL: CONNECT NEW INSTAGRAM PAGE VIA MANUS */}
      <InstagramConnectModal
        isOpen={showAddPageModal}
        onClose={() => setShowAddPageModal(false)}
        onConnected={handlePageConnected}
        existingAccounts={accounts}
      />
    </div>
  );
};
