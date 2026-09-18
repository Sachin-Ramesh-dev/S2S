import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Layers,
  Server,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Lock,
  KeyRound,
  Download,
  ExternalLink
} from 'lucide-react';
import { instagramApi } from '../services/instagramApi';
import { AIConfiguration } from '../types/instagram';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'ai' | 'integrations' | 'mcp' | 'notifications' | 'security';
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'general'
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations' | 'mcp' | 'notifications' | 'security'>(defaultTab);
  const [aiConfig, setAiConfig] = useState<AIConfiguration | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'S2S Workflow & Content Studio',
    timezone: 'Asia/Kolkata (IST)',
    theme: 'Dark Graphite (Default)',
    autoSaveInterval: '30 seconds',
    enableTelemetry: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    slackWebhook: 'https://hooks.slack.com/services/T00/B00/XXXX',
    notifyOnAuditComplete: true,
    notifyOnScriptScoreDrop: true,
    weeklyDigest: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    vaultStatus: 'Initialized (AES-256-GCM)',
    pbkdf2Iterations: '100,000 rounds',
    keyRotationPeriod: '90 days',
    storeKeysLocally: true
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      loadAiConfig();
    }
  }, [isOpen, defaultTab]);

  const loadAiConfig = async () => {
    try {
      const cfg = await instagramApi.getAiConfig();
      setAiConfig(cfg);
    } catch (e) {
      console.error('Failed to load AI config:', e);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131316] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f4f4f5]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#222226] flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#EA580C]" />
            <h2 className="text-lg font-semibold text-white">Global Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Left Tab Bar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-52 border-r border-[#222226] bg-[#111113] p-3 space-y-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'general' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>General</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'ai' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI & Models</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'integrations' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Integrations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mcp')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'mcp' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>MCP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'notifications' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'security' ? 'bg-[#EA580C] text-white font-semibold' : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#131316]">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">General Application Settings</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Workspace defaults, localization and storage.</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Workspace Display Name</label>
                    <input
                      type="text"
                      value={generalSettings.appName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Timezone</label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EA580C]"
                      >
                        <option>Asia/Kolkata (IST)</option>
                        <option>America/New_York (EST)</option>
                        <option>America/Los_Angeles (PST)</option>
                        <option>Europe/London (GMT)</option>
                        <option>UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Color Theme</label>
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <ThemeToggle variant="pill" />
                        <span className="text-xs text-[#a1a1aa]">
                          {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Auto-Save Rhythm</label>
                    <select
                      value={generalSettings.autoSaveInterval}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, autoSaveInterval: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EA580C]"
                    >
                      <option>15 seconds</option>
                      <option>30 seconds</option>
                      <option>1 minute</option>
                      <option>Manual only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* AI & MODELS TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">AI Engine & Provider Routing</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Connect and configure intelligence providers powering audits and content generation.
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? isDark
                          ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                          : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                        : isDark
                          ? 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                          : 'bg-rose-50 border border-rose-300 text-rose-900 shadow-2xs'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="font-semibold">{testResult.message}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Manus AI */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-950/60 border border-orange-700/40 flex items-center justify-center font-bold text-xs text-orange-400">
                          M
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Manus AI</div>
                          <div className="text-xs text-[#a1a1aa]">Primary Research Engine for In-Depth Instagram Page Audits</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active Agent
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <label className="text-[#a1a1aa] block mb-1">Agent Model</label>
                        <input
                          type="text"
                          disabled
                          value="manus-research-v2"
                          className="w-full bg-[#111113] border border-[#27272a] rounded px-2.5 py-1.5 text-[#f4f4f5] font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[#a1a1aa] block mb-1">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            disabled={testingProvider === 'manus'}
                            onClick={() => handleTestProvider('manus')}
                            className="flex items-center gap-1 px-3 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded text-xs transition-colors"
                          >
                            <Play className="w-3 h-3 text-emerald-400" />
                            <span>{testingProvider === 'manus' ? 'Testing...' : 'Test Connection'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Gemini */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-700/40 flex items-center justify-center font-bold text-xs text-blue-400">
                          G
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Google Gemini</div>
                          <div className="text-xs text-[#a1a1aa]">Creative Engine for Script Writing & Multi-Hook Optimization</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Connected (Server-Side)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <label className="text-[#a1a1aa] block mb-1">Active Model</label>
                        <input
                          type="text"
                          disabled
                          value="gemini-3.8-flash"
                          className="w-full bg-[#111113] border border-[#27272a] rounded px-2.5 py-1.5 text-[#f4f4f5] font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[#a1a1aa] block mb-1">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            disabled={testingProvider === 'gemini'}
                            onClick={() => handleTestProvider('gemini')}
                            className="flex items-center gap-1 px-3 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded text-xs transition-colors"
                          >
                            <Play className="w-3 h-3 text-emerald-400" />
                            <span>{testingProvider === 'gemini' ? 'Testing...' : 'Test Connection'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Integrations & External APIs</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Manage connected platforms and media sinks.</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Instagram Graph API</h4>
                      <p className="text-xs text-[#a1a1aa]">Connected to @bajajfinserv_official page intelligence stream.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  </div>

                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Production Webhooks</h4>
                      <p className="text-xs text-[#a1a1aa]">Push approved scripts directly to external production boards.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Standby
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MCP TAB */}
            {activeTab === 'mcp' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Model Context Protocol Runtime</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Global configuration for tool discovery and sandboxing.</p>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Execution Timeout</div>
                      <div className="text-[#a1a1aa]">Maximum time per tool invocation before cancellation.</div>
                    </div>
                    <span className="font-mono text-white bg-[#111113] px-3 py-1.5 rounded border border-[#27272a]">30,000 ms</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#27272a] pt-3">
                    <div>
                      <div className="text-sm font-medium text-white">Destructive Tool Guard</div>
                      <div className="text-[#a1a1aa]">Require confirmation before executing delete/drop operations.</div>
                    </div>
                    <span className="text-emerald-400 font-medium">Enforced</span>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Notifications & Alerts</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Control where and when workflow alerts are dispatched.</p>
                </div>

                <div className="space-y-4 max-w-lg text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnAuditComplete}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnAuditComplete: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <span className="text-white text-xs">Notify when Page Audit completes</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyOnScriptScoreDrop}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnScriptScoreDrop: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <span className="text-white text-xs">Alert if script score falls below 80</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyDigest}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyDigest: e.target.checked })}
                      className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <span className="text-white text-xs">Send weekly performance recap</span>
                  </label>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Security & Vault Encryption</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Local cryptographic protections and credentials handling.</p>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-sm font-medium text-white">AES-256-GCM Storage Vault</div>
                        <div className="text-[#a1a1aa]">All secrets encrypted at rest in local storage container.</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="border-t border-[#27272a] pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-[#a1a1aa]" />
                      <div>
                        <div className="text-sm font-medium text-white">Key Derivation</div>
                        <div className="text-[#a1a1aa]">PBKDF2 with SHA-256 (100,000 iterations).</div>
                      </div>
                    </div>
                    <span className="font-mono text-zinc-400">PBKDF2-SHA256</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#222226] flex items-center justify-between bg-[#18181b]">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
