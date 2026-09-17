import React, { useState, useEffect } from 'react';
import {
  Settings,
  Instagram,
  Sparkles,
  Save,
  CheckCircle2,
  RotateCcw,
  Users,
  Mail,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Send,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
  Bot
} from 'lucide-react';
import {
  InstagramAccount,
  AIConfiguration,
  TeamMember,
  SmtpConfig
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { InstagramConnectModal } from './InstagramConnectModal';

interface InstagramSettingsViewProps {
  account: InstagramAccount;
  accounts?: InstagramAccount[];
  config: AIConfiguration;
  onSaveAccount: (updates: Partial<InstagramAccount>) => Promise<void>;
  onUpdateConfig: (updates: Partial<AIConfiguration>) => Promise<void>;
  onResetRecommended: () => Promise<void>;
  onSwitchAccount?: (accountId: string) => void;
  onCreateAccount?: (accountData: Partial<InstagramAccount>) => Promise<void>;
}

export type SettingsTab = 'strategy' | 'team' | 'smtp' | 'accounts';

export const InstagramSettingsView: React.FC<InstagramSettingsViewProps> = ({
  account,
  accounts = [],
  config,
  onSaveAccount,
  onUpdateConfig,
  onResetRecommended,
  onSwitchAccount,
  onCreateAccount
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('strategy');

  // Strategy & Profile States
  const [handle, setHandle] = useState(account.username);
  const [displayName, setDisplayName] = useState(account.displayName);
  const [bio, setBio] = useState(account.bio || '');
  const [niche, setNiche] = useState(account.category);
  const [targetAudience, setTargetAudience] = useState(
    account.targetAudience || 'Salaried professionals aged 24-42 seeking financial freedom, smart investments and debt payoff.'
  );
  const [brandTone, setBrandTone] = useState(
    account.brandTone || 'Authoritative, accessible, educational, zero fluff, actionable.'
  );
  const [contentPillars, setContentPillars] = useState(
    (account.contentPillars || ['Personal Finance & Loans', 'Debt Snowball Strategies', 'Tax Optimization', 'Emergency Funds']).join(', ')
  );
  const [auditFrequency, setAuditFrequency] = useState(config.schedulerSettings?.auditFrequency || 'weekly');
  const [geminiModel, setGeminiModel] = useState(config.providers?.gemini?.model || 'gemini-3.8-flash');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Team Management States
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState<{
    name: string;
    email: string;
    role: 'Account Manager' | 'Script Writer' | 'Content Creator' | 'Admin';
    phone: string;
    assignedAccountIds: string[];
    status: 'active' | 'invited';
  }>({
    name: '',
    email: '',
    role: 'Account Manager',
    phone: '',
    assignedAccountIds: [account.id],
    status: 'active'
  });

  // SMTP Settings States
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'notifications@agency.internal',
    pass: '',
    fromEmail: 'content-engine@agency.internal',
    agencyEmail: 'production-agency@studio.com',
    isConfigured: true
  });
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // New Account Modal State
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    username: '',
    displayName: '',
    category: 'Finance & Banking',
    niche: 'Personal Credit & Financial Planning',
    bio: '',
    followersCount: 15000
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Sync profile values when account changes
  useEffect(() => {
    setHandle(account.username);
    setDisplayName(account.displayName);
    setBio(account.bio || '');
    setNiche(account.category);
    setTargetAudience(account.targetAudience || 'Salaried professionals aged 24-42 seeking financial freedom.');
    setBrandTone(account.brandTone || 'Authoritative, accessible, educational, zero fluff.');
  }, [account]);

  // Load Team & SMTP data on mount or tab change
  useEffect(() => {
    if (activeTab === 'team') {
      loadTeam();
    } else if (activeTab === 'smtp') {
      loadSmtp();
    }
  }, [activeTab]);

  const loadTeam = async () => {
    try {
      setLoadingTeam(true);
      const members = await instagramApi.getTeamMembers();
      setTeamMembers(members);
    } catch (e) {
      console.error('Failed to load team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadSmtp = async () => {
    try {
      setLoadingSmtp(true);
      const data = await instagramApi.getSmtpConfig();
      if (data) setSmtpConfig(data);
    } catch (e) {
      console.error('Failed to load SMTP config:', e);
    } finally {
      setLoadingSmtp(false);
    }
  };

  // Save Strategy Form
  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveAccount({
        username: handle,
        displayName,
        bio,
        category: niche,
        targetAudience,
        brandTone,
        contentPillars: contentPillars.split(',').map((p) => p.trim()).filter(Boolean)
      });
      await onUpdateConfig({
        schedulerSettings: {
          ...config.schedulerSettings,
          auditFrequency: auditFrequency as any
        },
        providers: {
          ...config.providers,
          gemini: {
            ...config.providers.gemini,
            model: geminiModel
          }
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Team Member Actions
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      email: '',
      role: 'Account Manager',
      phone: '',
      assignedAccountIds: [account.id],
      status: 'active'
    });
    setShowAddMemberModal(true);
  };

  const handleOpenEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      role: (member.role as any) || 'Account Manager',
      phone: member.phone || '',
      assignedAccountIds: member.assignedAccountIds || member.accountIds || [account.id],
      status: member.status || 'active'
    });
    setShowAddMemberModal(true);
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await instagramApi.updateTeamMember(editingMember.id, memberForm);
      } else {
        await instagramApi.addTeamMember(memberForm);
      }
      setShowAddMemberModal(false);
      await loadTeam();
    } catch (err: any) {
      alert(`Error saving team member: ${err.message}`);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await instagramApi.deleteTeamMember(id);
      await loadTeam();
    } catch (err: any) {
      alert(`Failed to delete member: ${err.message}`);
    }
  };

  const toggleAccountAssignment = (accId: string) => {
    setMemberForm(prev => {
      const exists = prev.assignedAccountIds.includes(accId);
      if (exists) {
        return {
          ...prev,
          assignedAccountIds: prev.assignedAccountIds.filter(id => id !== accId)
        };
      } else {
        return {
          ...prev,
          assignedAccountIds: [...prev.assignedAccountIds, accId]
        };
      }
    });
  };

  // Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      const updated = await instagramApi.updateSmtpConfig(smtpConfig);
      setSmtpConfig(updated);
      setSmtpTestResult({ success: true, message: 'SMTP configuration saved successfully' });
      setTimeout(() => setSmtpTestResult(null), 4000);
    } catch (err: any) {
      alert(`Failed to save SMTP: ${err.message}`);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await instagramApi.testSmtpConnection(smtpConfig.agencyEmail);
      setSmtpTestResult(res);
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err.message || 'SMTP Connection failed' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Create New Account
  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.username) return;
    setIsCreatingAccount(true);
    try {
      const cleanHandle = newAccountForm.username.replace('@', '').trim();
      const accountData = {
        ...newAccountForm,
        username: cleanHandle,
        displayName: newAccountForm.displayName || cleanHandle
      };
      if (onCreateAccount) {
        await onCreateAccount(accountData);
      } else {
        await instagramApi.saveAccount(accountData as any);
      }
      setShowNewAccountModal(false);
      setNewAccountForm({
        username: '',
        displayName: '',
        category: 'Finance & Banking',
        niche: 'Personal Credit & Financial Planning',
        bio: '',
        followersCount: 15000
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to add Instagram page: ${err.message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              Instagram Settings & Team
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">
            Account, Multi-Page & Team Configuration
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage multi-account switching, user assignments, SMTP agency dispatch, and AI editorial strategy.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('strategy')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'strategy'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Account & Strategy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Management</span>
          {teamMembers.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'team' ? 'bg-orange-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {teamMembers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'smtp'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>SMTP & Agency Dispatch</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Instagram Pages</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700 font-bold">
            {accounts.length || 1}
          </span>
        </button>
      </div>

      {/* TAB 1: STRATEGY & PROFILE */}
      {activeTab === 'strategy' && (
        <form onSubmit={handleSaveStrategy} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Instagram className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm font-bold text-gray-900">Target Profile & Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Instagram Handle</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:border-orange-500">
                  <span className="bg-gray-50 px-3 py-2 text-xs text-gray-500 font-mono border-r border-gray-300">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace('@', ''))}
                    className="w-full px-3 py-2 text-xs text-gray-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Niche / Category</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bio Summary</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm font-bold text-gray-900">Brand Voice & Editorial Guidelines</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience Persona</label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Tone of Voice</label>
                <input
                  type="text"
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Content Pillars (Comma-separated)</label>
                <input
                  type="text"
                  value={contentPillars}
                  onChange={(e) => setContentPillars(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onResetRecommended}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to AI Best Practices</span>
            </button>

            <button
              id="btn-save-instagram-settings"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TEAM MANAGEMENT (USER MANAGEMENT WITH MULTI-ACCOUNT ASSOCIATION) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Team & Role Management
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage Account Managers, Script Writers, and Content Teams. 1 Account Manager can be assigned to multiple Instagram accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddMember}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Team Member</span>
              </button>
            </div>

            {loadingTeam ? (
              <div className="p-8 text-center text-xs text-gray-500">Loading team members...</div>
            ) : teamMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No team members found. Click "Add Team Member" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-3">Member Name & Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Assigned Accounts</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((member) => {
                      const assignedIds = member.assignedAccountIds || member.accountIds || [];
                      return (
                        <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="font-semibold text-gray-900 block">{member.name}</strong>
                                <span className="text-gray-500 text-[11px] font-mono">{member.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              member.role === 'Account Manager'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : member.role === 'Script Writer'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : member.role === 'Admin'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {assignedIds.length === 0 ? (
                                <span className="text-gray-400 text-[11px]">None</span>
                              ) : (
                                assignedIds.map((accId) => {
                                  const acc = accounts.find(a => a.id === accId);
                                  return (
                                    <span
                                      key={accId}
                                      className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-mono font-medium border border-gray-200 flex items-center gap-1"
                                    >
                                      <Instagram className="w-2.5 h-2.5 text-gray-500" />
                                      @{acc?.username || accId.replace('ig-', '')}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 font-mono text-[11px]">
                            {member.phone || '—'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              member.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {member.status || 'active'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMember(member)}
                                className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTeamMember(member.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMTP CONFIGURATION & AGENCY DISPATCH */}
      {activeTab === 'smtp' && (
        <form onSubmit={handleSaveSmtp} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-gray-900">SMTP Server & Production Agency Dispatch</h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                smtpConfig.isConfigured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <Check className="w-3 h-3" />
                {smtpConfig.isConfigured ? 'Configured & Active' : 'Not Configured'}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              When scripts are approved and dispatched using "Send to Agency", the system generates production packages (dialogue script, audio cues, visual framing, on-screen text overlays) and dispatches them directly to your video production agency via SMTP.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                  placeholder="587"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Username / Auth User</label>
                <input
                  type="text"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  placeholder="notifications@domain.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password / App Password</label>
                <input
                  type="password"
                  value={smtpConfig.pass || ''}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">From Email (Sender Address)</label>
                <input
                  type="email"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                  placeholder="content-engine@domain.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Agency Email (Production Recipient)</label>
                <input
                  type="email"
                  value={smtpConfig.agencyEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, agencyEmail: e.target.value })}
                  placeholder="production-agency@studio.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500 font-semibold text-orange-950"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtp-secure"
                  checked={smtpConfig.secure}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="smtp-secure" className="text-xs text-gray-700 font-medium">
                  Use Secure TLS/SSL connection (recommended for port 465)
                </label>
              </div>
            </div>

            {smtpTestResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                smtpTestResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{smtpTestResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingSmtp ? 'animate-bounce' : ''}`} />
              <span>{isTestingSmtp ? 'Testing Connection...' : 'Test SMTP Connection'}</span>
            </button>

            <button
              id="btn-save-smtp-settings"
              type="submit"
              disabled={isSavingSmtp}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSmtp ? 'Saving SMTP...' : 'Save SMTP Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: INSTAGRAM ACCOUNTS (MULTI-PAGE MANAGEMENT) */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-orange-600" />
                  Connected Instagram Pages
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage multiple brand or client profiles. Switch active workspaces seamlessly from the top right switcher.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAccountModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Connect Instagram Page (Manus)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => {
                const isCurrent = acc.id === account.id;
                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-orange-400 bg-orange-50/30 ring-2 ring-orange-400/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-gray-800">
                            {acc.username.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="font-bold text-sm text-gray-900 block">
                              @{acc.username}
                            </strong>
                            {acc.isVerified && (
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold" title="Meta Verified">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{acc.displayName}</span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600 text-white">
                          Active Workspace
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSwitchAccount && onSwitchAccount(acc.id)}
                          className="px-3 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Switch to Page
                        </button>
                      )}
                    </div>

                    {/* Manus Connection Tag */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <Bot className="w-2.5 h-2.5" /> Manus Connection Active
                      </span>
                      {acc.manusSessionId && (
                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">
                          {acc.manusSessionId}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Followers</span>
                        <div className="font-bold text-gray-900 mt-0.5">{acc.followersCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Category</span>
                        <div className="font-semibold text-gray-800 mt-0.5 truncate">{acc.category}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Engage Rate</span>
                        <div className="font-bold text-emerald-600 mt-0.5">{acc.engagementRate}%</div>
                      </div>
                    </div>

                    {acc.bio && (
                      <p className="mt-2 text-[11px] text-gray-600 line-clamp-2 italic">
                        "{acc.bio}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TEAM MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h3>

            <form onSubmit={handleSaveTeamMember} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="priya@agency.internal"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Account Manager">Account Manager</option>
                    <option value="Script Writer">Script Writer</option>
                    <option value="Content Creator">Content Team</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                  </select>
                </div>
              </div>

              {/* Multi-Account Association */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign to Instagram Accounts (Select Multiple)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  1 Account Manager can be assigned to multiple Instagram accounts simultaneously.
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {accounts.map((acc) => {
                    const isChecked = memberForm.assignedAccountIds.includes(acc.id);
                    return (
                      <label
                        key={acc.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccountAssignment(acc.id)}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-semibold text-gray-900">@{acc.username}</span>
                        <span className="text-gray-500 text-[11px]">({acc.displayName})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT INSTAGRAM PAGE VIA MANUS */}
      <InstagramConnectModal
        isOpen={showNewAccountModal}
        onClose={() => setShowNewAccountModal(false)}
        onConnected={async (newAcc) => {
          setShowNewAccountModal(false);
          if (onCreateAccount) {
            await onCreateAccount(newAcc);
          }
          if (onSwitchAccount) {
            onSwitchAccount(newAcc.id);
          }
        }}
        existingAccounts={accounts}
      />
    </div>
  );
};
