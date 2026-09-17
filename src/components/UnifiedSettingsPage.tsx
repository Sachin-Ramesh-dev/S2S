import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  Server,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
  ArrowLeft,
  Save,
  ShieldCheck
} from 'lucide-react';
import { instagramApi } from '../services/instagramApi';
import { AIConfiguration, InstagramAccount } from '../types/instagram';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { InstagramIntegrationsView } from './instagram/InstagramIntegrationsView';
import { McpConnectionsPage } from './McpConnectionsPage';

export type UnifiedSettingsTab = 'general' | 'ai' | 'integrations' | 'mcp' | 'notifications' | 'security';
export type IntegrationsSubTab = 'teams' | 'instagram' | 'webhooks';

interface UnifiedSettingsPageProps {
  onBack: () => void;
  previousViewName?: string;
  initialTab?: UnifiedSettingsTab;
  initialSubTab?: string;
  onOpenVault?: () => void;
}

export const UnifiedSettingsPage: React.FC<UnifiedSettingsPageProps> = ({
  onBack,
  previousViewName = 'Content & Audit',
  initialTab = 'general',
  initialSubTab,
  onOpenVault
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<UnifiedSettingsTab>(initialTab);
  const [integrationsSubTab, setIntegrationsSubTab] = useState<IntegrationsSubTab>(
    (initialSubTab as IntegrationsSubTab) || 'teams'
  );

  const [aiConfig, setAiConfig] = useState<AIConfiguration | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // General Settings State (Preserved)
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'S2S Workflow & Content Studio',
    timezone: 'Asia/Kolkata (IST)',
    theme: 'Dark Graphite (Default)',
    autoSaveInterval: '30 seconds',
    enableTelemetry: false
  });

  // Notification Settings State (Preserved)
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    slackWebhook: 'https://hooks.slack.com/services/T00/B00/XXXX',
    notifyOnAuditComplete: true,
    notifyOnScriptScoreDrop: true,
    weeklyDigest: true
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialSubTab) {
      setIntegrationsSubTab(initialSubTab as IntegrationsSubTab);
    }
  }, [initialTab, initialSubTab]);

  useEffect(() => {
    loadAiConfig();
    loadAccounts();
  }, []);

  const loadAiConfig = async () => {
    try {
      const cfg = await instagramApi.getAiConfig();
      setAiConfig(cfg);
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
  };

  const loadAccounts = async () => {
    try {
      const accList = await instagramApi.getAccounts();
      setAccounts(accList);
      if (accList.length > 0) {
        setSelectedAccount(accList[0]);
      }
    } catch (e) {
      console.error('Failed to load accounts for integrations:', e);
    }
  };

  const handleTestProvider = async (provider: string) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await instagramApi.testProviderConnection(provider);
      setTestResult({
        provider,
        success: res.status === 'connected',
        message: res.message
      });
      loadAiConfig();
    } catch (e: any) {
      setTestResult({
        provider,
        success: false,
        message: e.message || 'Connection test failed'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      if (aiConfig) {
        await instagramApi.updateAiConfig(aiConfig);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="unified-settings-page"
      className={`flex-1 flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[#0f0f12] text-[#f4f4f5]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`h-14 px-6 border-b flex items-center justify-between shrink-0 z-20 ${
          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            id="btn-settings-back"
            onClick={onBack}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'text-[#a1a1aa] hover:text-white hover:bg-[#222226]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={`Back to ${previousViewName}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {previousViewName}</span>
          </button>
          <span className={`h-4 w-px ${isDark ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#EA580C]" />
            <h1 className="text-sm font-bold tracking-tight">Unified Settings & Integrations</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </header>

      {/* Main Settings Layout (Sidebar Navigation + Tab Workspace) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Settings Navigation Sidebar */}
        <aside
          className={`w-60 border-r flex flex-col justify-between shrink-0 p-3 select-none ${
            isDark ? 'bg-[#121215] border-[#222226]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Configuration
            </div>

            {/* General */}
            <button
              type="button"
              id="tab-settings-general"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>General</span>
            </button>

            {/* AI & Models */}
            <button
              type="button"
              id="tab-settings-ai"
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>AI & Models</span>
            </button>

            {/* Integrations (Consolidated) */}
            <button
              type="button"
              id="tab-settings-integrations"
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'integrations'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Integrations</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                activeTab === 'integrations' ? 'bg-black/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
              }`}>
                Teams
              </span>
            </button>

            {/* MCP Runtime (Consolidated) */}
            <button
              type="button"
              id="tab-settings-mcp"
              onClick={() => setActiveTab('mcp')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'mcp'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 shrink-0" />
                <span>MCP Runtime</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="MCP Active" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              id="tab-settings-notifications"
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifications</span>
            </button>

            {/* Security */}
            <button
              type="button"
              id="tab-settings-security"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark
                  ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Security & Vault</span>
            </button>
          </div>

          {/* Bottom Vault Status Card */}
          <div className={`p-3 rounded-xl border text-xs space-y-2 ${
            isDark ? 'bg-[#18181c] border-[#27272a]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vault Active</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">AES-256</span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
              Keys & webhooks are encrypted at rest locally.
            </p>
            {onOpenVault && (
              <button
                type="button"
                onClick={onOpenVault}
                className={`w-full py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#3f3f46] hover:bg-[#222226] text-white'
                    : 'border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Open Vault Manager
              </button>
            )}
          </div>
        </aside>

        {/* Tab Content Workspace */}
        <main className="flex-1 overflow-y-auto">
          {/* ==================== GENERAL TAB ==================== */}
          {activeTab === 'general' && (
            <div className="p-8 max-w-4xl space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold">General Application Settings</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                  Configure workspace defaults, localization, interface theme, and storage rhythm.
                </p>
              </div>

              <div className="space-y-6 max-w-xl">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                    Workspace Display Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm border font-medium focus:outline-none focus:border-[#EA580C] ${
                      isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                      Default Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className={`w-full rounded-lg px-3.5 py-2 text-sm border font-medium focus:outline-none focus:border-[#EA580C] ${
                        isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option>Asia/Kolkata (IST)</option>
                      <option>America/New_York (EST)</option>
                      <option>America/Los_Angeles (PST)</option>
                      <option>Europe/London (GMT)</option>
                      <option>UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                      Color Theme
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <ThemeToggle variant="pill" />
                      <span className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
                        {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                    Auto-Save Rhythm
                  </label>
                  <select
                    value={generalSettings.autoSaveInterval}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, autoSaveInterval: e.target.value })}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm border font-medium focus:outline-none focus:border-[#EA580C] ${
                      isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>15 seconds</option>
                    <option>30 seconds</option>
                    <option>1 minute</option>
                    <option>Manual only</option>
                  </select>
                </div>

                <div className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.enableTelemetry}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, enableTelemetry: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <div>
                      <span className="text-xs font-semibold">Enable Anonymous Local Diagnostics</span>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Keeps execution run logs stored strictly in your local database container (`data/nodeflow_db.json`).
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ==================== AI & MODELS TAB ==================== */}
          {activeTab === 'ai' && (
            <div className="p-8 max-w-4xl space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold">AI Engine & Provider Routing</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                  Configure and test the intelligence providers that power Instagram audits, topic generation, and script writing.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manus AI */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-950/60 border border-orange-700/40 flex items-center justify-center font-bold text-sm text-[#EA580C]">
                        M
                      </div>
                      <div>
                        <div className="text-sm font-bold">Manus AI</div>
                        <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                          Deep Web & Page Audit Engine
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                    Autonomously scrapes target profiles (@bajajfinance), formats diagnostic matrices, and parses T-2 engagement spikes.
                  </p>

                  <div className="space-y-2">
                    <label className={`text-[11px] font-semibold block ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                      Target Model
                    </label>
                    <input
                      type="text"
                      disabled
                      value="manus-1.6-lite / manus-research-v2"
                      className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border ${
                        isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={testingProvider === 'manus'}
                    onClick={() => handleTestProvider('manus')}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#3f3f46] hover:bg-[#222226] text-white'
                        : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{testingProvider === 'manus' ? 'Testing Connection...' : 'Test Manus AI API'}</span>
                  </button>
                </div>

                {/* Google Gemini */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-700/40 flex items-center justify-center font-bold text-sm text-blue-400">
                        G
                      </div>
                      <div>
                        <div className="text-sm font-bold">Google Gemini</div>
                        <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                          Strategist & Scene Scriptwriter
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                    Generates 10 high-converting topic angles, evaluates retention hooks, and drafts 4-act scripts aligned with approved rulebooks.
                  </p>

                  <div className="space-y-2">
                    <label className={`text-[11px] font-semibold block ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                      Active Engine Model
                    </label>
                    <select
                      className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border focus:outline-none focus:border-[#EA580C] ${
                        isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option>gemini-3.8-flash (Recommended)</option>
                      <option>gemini-2.5-flash</option>
                      <option>gemini-1.5-pro</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={testingProvider === 'gemini'}
                    onClick={() => handleTestProvider('gemini')}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#3f3f46] hover:bg-[#222226] text-white'
                        : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{testingProvider === 'gemini' ? 'Testing Connection...' : 'Test Google Gemini API'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== INTEGRATIONS TAB (CONSOLIDATED) ==================== */}
          {activeTab === 'integrations' && (
            <div className="p-8 max-w-5xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-[#222226]">
                <div>
                  <h2 className="text-lg font-bold">Integrations & External Channels</h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                    Configure external endpoints, communication channels, and webhooks shared across Workflows and Content & Audit.
                  </p>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className={`p-1 rounded-xl flex items-center gap-1 border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIntegrationsSubTab('teams')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      integrationsSubTab === 'teams'
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : isDark
                        ? 'text-[#a1a1aa] hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Microsoft Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegrationsSubTab('instagram')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      integrationsSubTab === 'instagram'
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : isDark
                        ? 'text-[#a1a1aa] hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Instagram Graph API
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegrationsSubTab('webhooks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      integrationsSubTab === 'webhooks'
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : isDark
                        ? 'text-[#a1a1aa] hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Production Webhooks
                  </button>
                </div>
              </div>

              {/* Sub-Tab 1: Microsoft Teams Integration (Full Rich Experience) */}
              {integrationsSubTab === 'teams' && (
                <div className="space-y-6">
                  {selectedAccount ? (
                    <InstagramIntegrationsView
                      account={selectedAccount}
                      onShowToast={(msg, typ) => {
                        if (typ === 'success') setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 3000);
                      }}
                    />
                  ) : (
                    <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'}`}>
                      <p className="text-xs text-[#a1a1aa]">Loading accounts for Microsoft Teams configuration...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Instagram Graph API */}
              {integrationsSubTab === 'instagram' && (
                <div className="space-y-4 max-w-3xl">
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-950/60 border border-pink-700/40 flex items-center justify-center font-bold text-sm text-pink-400">
                          IG
                        </div>
                        <div>
                          <div className="text-sm font-bold">Instagram Graph API Connector</div>
                          <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                            Live Stream & Analytics Feed
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Connected (@bajajfinance)
                      </span>
                    </div>

                    <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                      Enables real-time retrieval of metrics, post engagement numbers, impression ratios, and audience retention.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-zinc-500 block text-[10px]">Token Scope</span>
                        <span className="font-semibold text-white">instagram_basic, pages_show_list</span>
                      </div>
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-zinc-500 block text-[10px]">Token Status</span>
                        <span className="font-semibold text-emerald-400">Long-Lived (Valid for 58 days)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Production Webhooks */}
              {integrationsSubTab === 'webhooks' && (
                <div className="space-y-4 max-w-3xl">
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-700/40 flex items-center justify-center font-bold text-sm text-purple-400">
                          WH
                        </div>
                        <div>
                          <div className="text-sm font-bold">Production Webhook Dispatches</div>
                          <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                            Automated Content Handoffs
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Standby
                      </span>
                    </div>

                    <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                      Triggers third-party production project management boards (Asana, Monday.com, Notion) whenever a script status advances to &apos;Approved for Production&apos;.
                    </p>

                    <div className="space-y-2">
                      <label className={`text-[11px] font-semibold block ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Webhook Target URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://api.yourorganization.com/webhooks/production"
                        className={`w-full rounded-lg px-3 py-2 text-xs font-mono border focus:outline-none focus:border-[#EA580C] ${
                          isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== MCP RUNTIME TAB (CONSOLIDATED) ==================== */}
          {activeTab === 'mcp' && (
            <div className="p-8 max-w-6xl space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold">Model Context Protocol (MCP) Runtime</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                  Manage the local MCP server, connected clients (Claude Code, Cursor, Claude.ai), and exposed tools for Workflows and Content Intelligence.
                </p>
              </div>

              {/* Embedded Full MCP Connections Hub */}
              <div className="rounded-2xl overflow-hidden border border-[#222226]">
                <McpConnectionsPage />
              </div>
            </div>
          )}

          {/* ==================== NOTIFICATIONS TAB ==================== */}
          {activeTab === 'notifications' && (
            <div className="p-8 max-w-4xl space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold">Notifications & Alerts</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                  Configure when team alerts and performance recaps are automatically triggered.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnAuditComplete}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnAuditComplete: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <div>
                      <span className="text-xs font-semibold">Notify when Page Audit completes</span>
                      <p className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Sends a quick alert upon 100% completion of the Manus AI profile audit.
                      </p>
                    </div>
                  </label>
                </div>

                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnScriptScoreDrop}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnScriptScoreDrop: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <div>
                      <span className="text-xs font-semibold">Alert if script score falls below 80</span>
                      <p className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Triggers a warning if an authored scene script misses guardrail compliance criteria.
                      </p>
                    </div>
                  </label>
                </div>

                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyDigest}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyDigest: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <div>
                      <span className="text-xs font-semibold">Send weekly performance recap</span>
                      <p className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Dispatches a consolidated summary of weekly Reels vs Carousel performance.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2">
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                    Slack Escalation Webhook URL
                  </label>
                  <input
                    type="url"
                    value={notificationSettings.slackWebhook}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, slackWebhook: e.target.value })}
                    className={`w-full rounded-lg px-3.5 py-2 text-xs font-mono border focus:outline-none focus:border-[#EA580C] ${
                      isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== SECURITY & VAULT TAB ==================== */}
          {activeTab === 'security' && (
            <div className="p-8 max-w-4xl space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold">Security & Vault Encryption</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                  Local cryptographic protections, key derivation specs, and credential encryption status.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border space-y-6 ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-4 border-[#222226]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">AES-256-GCM Storage Container</div>
                      <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Hardware-accelerated authenticated symmetric cipher
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active & Enforced
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-zinc-500 block text-[10px]">Key Derivation</span>
                    <span className="font-mono font-semibold text-white">PBKDF2-SHA256</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">100,000 iterations</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-zinc-500 block text-[10px]">Key Rotation</span>
                    <span className="font-mono font-semibold text-white">90-Day Policy</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Zero external telemetry</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-zinc-500 block text-[10px]">Storage Mode</span>
                    <span className="font-mono font-semibold text-emerald-400">Local Encrypted DB</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">data/nodeflow_db.json</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
                    Need to add or update API tokens, database connections, or webhook secrets?
                  </p>
                  {onOpenVault && (
                    <button
                      type="button"
                      onClick={onOpenVault}
                      className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Open Credential Vault
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
