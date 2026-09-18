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
  ShieldCheck,
  ChevronRight,
  Hash,
  Zap,
  Instagram,
  Send,
  ExternalLink,
  RefreshCw,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Youtube,
  Linkedin,
  Palette,
  Mic,
  Volume2,
  FileText,
  Radio,
  SlidersHorizontal,
  UserPlus,
  Key,
  Plus,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { instagramApi } from '../services/instagramApi';
import { AIConfiguration, InstagramAccount } from '../types/instagram';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useEnvironment } from '../context/EnvironmentContext';
import { EnvironmentToggle } from './EnvironmentToggle';
import { InstagramIntegrationsView } from './instagram/InstagramIntegrationsView';
import { McpConnectionsPage } from './McpConnectionsPage';
import { InstagramConnectModal } from './instagram/InstagramConnectModal';

export type UnifiedSettingsTab = 'general' | 'ai' | 'integrations' | 'mcp' | 'notifications' | 'security';
export type IntegrationId =
  | 'teams'
  | 'instagram'
  | 'slack'
  | 'webhooks'
  | 'youtube'
  | 'linkedin'
  | 'canva'
  | 'elevenlabs'
  | 'notion';

const ALL_INTEGRATION_IDS: IntegrationId[] = [
  'teams',
  'instagram',
  'slack',
  'webhooks',
  'youtube',
  'linkedin',
  'canva',
  'elevenlabs',
  'notion'
];

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
  const { environment, isLiveMode, isDemoMode, setEnvironment } = useEnvironment();
  const [activeTab, setActiveTab] = useState<UnifiedSettingsTab>(initialTab);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<IntegrationId | null>(
    initialSubTab && ALL_INTEGRATION_IDS.includes(initialSubTab as IntegrationId)
      ? (initialSubTab as IntegrationId)
      : null
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

  const [slackChannel, setSlackChannel] = useState('customer-escalations');
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [slackSuccess, setSlackSuccess] = useState(false);

  const handleTestSlack = async () => {
    setIsTestingSlack(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsTestingSlack(false);
    setSlackSuccess(true);
    setTimeout(() => setSlackSuccess(false), 3000);
  };

  // Instagram Graph API State (Disconnected by default)
  const [instagramConfig, setInstagramConfig] = useState({
    metaAccessToken: '',
    metaPageId: '',
    username: '',
    displayName: '',
    isConnected: false
  });
  const [isTestingInstagram, setIsTestingInstagram] = useState(false);
  const [instagramSuccess, setInstagramSuccess] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [showAddInstagramModal, setShowAddInstagramModal] = useState(false);
  const [showAddAnotherInstagram, setShowAddAnotherInstagram] = useState(false);

  const handleConnectInstagram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = (instagramConfig.username || 'bajajfinance').replace('@', '').trim();
    if (!cleanUser) {
      setInstagramError('Please enter an Instagram handle.');
      return;
    }
    if (!instagramConfig.metaAccessToken.trim()) {
      setInstagramError('Please enter a valid Meta Graph Access Token (starts with EAA...).');
      return;
    }

    setIsTestingInstagram(true);
    setInstagramError(null);

    try {
      const newAcc = await instagramApi.connectManusAccount({
        method: 'meta_graph_api',
        username: cleanUser,
        loginIdentifier: instagramConfig.metaPageId || cleanUser,
        displayName: instagramConfig.displayName || cleanUser.replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: 'Finance & Enterprise',
        bio: `Connected via Meta Graph API v20.0. Account ID: ${instagramConfig.metaPageId || '178414009281740'}`,
        followersCount: isDemoMode ? 1710000 : undefined,
        metaAccessToken: instagramConfig.metaAccessToken.trim(),
        metaPageId: instagramConfig.metaPageId.trim() || undefined,
        isDemo: isDemoMode
      });

      const updatedAccounts = await instagramApi.getAccounts(environment);
      setAccounts(updatedAccounts);
      setSelectedAccount(newAcc);
      setInstagramConfig(prev => ({
        ...prev,
        username: newAcc.username || cleanUser,
        displayName: newAcc.displayName || cleanUser,
        isConnected: true
      }));
      setIsTestingInstagram(false);
      setInstagramSuccess(true);
      setShowAddAnotherInstagram(false);
      setTimeout(() => setInstagramSuccess(false), 3500);
    } catch (err: any) {
      setIsTestingInstagram(false);
      setInstagramError(err.message || 'Failed to verify Meta Graph API token. Please check permissions.');
    }
  };

  const handleQuickFillInstagram = () => {
    setInstagramConfig({
      metaAccessToken: 'EAAGNO4m...98fKq7L3x0ZBa902k',
      metaPageId: '178414092817409',
      username: 'bajajfinance',
      displayName: 'Bajaj Finance Limited',
      isConnected: false
    });
    setInstagramError(null);
  };

  // State for individual account disconnection
  const [accountToDisconnect, setAccountToDisconnect] = useState<InstagramAccount | null>(null);
  const [isDisconnectingAccount, setIsDisconnectingAccount] = useState(false);

  const handleConfirmDisconnectAccount = async () => {
    if (!accountToDisconnect) return;
    const targetId = accountToDisconnect.id;
    const targetUsername = accountToDisconnect.username;
    setIsDisconnectingAccount(true);
    try {
      await instagramApi.disconnectAccount(targetId);
      const updatedAccounts = accounts.filter(a => a.id !== targetId);
      setAccounts(updatedAccounts);

      // If the disconnected account was the active selected account:
      if (selectedAccount?.id === targetId) {
        if (updatedAccounts.length > 0) {
          setSelectedAccount(updatedAccounts[0]);
          setInstagramConfig(prev => ({
            ...prev,
            username: updatedAccounts[0].username,
            displayName: updatedAccounts[0].displayName || updatedAccounts[0].username,
            isConnected: true
          }));
        } else {
          setSelectedAccount(null);
          setInstagramConfig(prev => ({
            ...prev,
            username: '',
            displayName: '',
            isConnected: false
          }));
        }
      } else if (updatedAccounts.length === 0) {
        setInstagramConfig(prev => ({ ...prev, isConnected: false }));
      }

      setInstagramSuccess(true);
      setTimeout(() => setInstagramSuccess(false), 3000);
      setAccountToDisconnect(null);
    } catch (err: any) {
      setInstagramError(err.message || `Failed to disconnect @${targetUsername}`);
    } finally {
      setIsDisconnectingAccount(false);
    }
  };

  const handleConnectAnotherAccountClick = () => {
    setInstagramConfig(prev => ({
      ...prev,
      metaAccessToken: '',
      metaPageId: '',
      username: '',
      displayName: ''
    }));
    setInstagramError(null);
    const tokenInput = document.getElementById('input-meta-token');
    if (tokenInput) {
      tokenInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tokenInput.focus();
    }
  };

  // 1. YouTube Data API State (Disconnected by default)
  const [youtubeConfig, setYoutubeConfig] = useState({
    apiKey: '',
    channelId: 'UC_BajajFinance_Official',
    autoUploadShorts: false,
    defaultPrivacy: 'unlisted',
    isConnected: false
  });
  const [isTestingYoutube, setIsTestingYoutube] = useState(false);
  const [youtubeSuccess, setYoutubeSuccess] = useState(false);
  const handleTestYoutube = async () => {
    setIsTestingYoutube(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsTestingYoutube(false);
    setYoutubeConfig((prev) => ({ ...prev, isConnected: true }));
    setYoutubeSuccess(true);
    setTimeout(() => setYoutubeSuccess(false), 3000);
  };

  // 2. LinkedIn Marketing API State (Disconnected by default)
  const [linkedinConfig, setLinkedinConfig] = useState({
    clientId: '',
    clientSecret: '',
    orgId: 'urn:li:organization:1049281',
    autoPublish: false,
    isConnected: false
  });
  const [isTestingLinkedin, setIsTestingLinkedin] = useState(false);
  const [linkedinSuccess, setLinkedinSuccess] = useState(false);
  const handleTestLinkedin = async () => {
    setIsTestingLinkedin(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsTestingLinkedin(false);
    setLinkedinConfig((prev) => ({ ...prev, isConnected: true }));
    setLinkedinSuccess(true);
    setTimeout(() => setLinkedinSuccess(false), 3000);
  };

  // 3. Canva Connect State (Disconnected by default)
  const [canvaConfig, setCanvaConfig] = useState({
    apiKey: '',
    brandKitId: 'bk_bajaj_brand_2026',
    autoExportAssets: true,
    templateId: 'tpl_carousel_finance_1080',
    isConnected: false
  });
  const [isTestingCanva, setIsTestingCanva] = useState(false);
  const [canvaSuccess, setCanvaSuccess] = useState(false);
  const handleTestCanva = async () => {
    setIsTestingCanva(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsTestingCanva(false);
    setCanvaConfig((prev) => ({ ...prev, isConnected: true }));
    setCanvaSuccess(true);
    setTimeout(() => setCanvaSuccess(false), 3000);
  };

  // 4. ElevenLabs State (Disconnected by default)
  const [elevenlabsConfig, setElevenlabsConfig] = useState({
    apiKey: '',
    selectedVoice: 'Rachel (Professional Narrator)',
    model: 'eleven_multilingual_v2',
    stability: 0.75,
    clarity: 0.85,
    isConnected: false
  });
  const [isTestingElevenLabs, setIsTestingElevenLabs] = useState(false);
  const [elevenlabsSuccess, setElevenlabsSuccess] = useState(false);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const handleTestElevenLabs = async () => {
    setIsTestingElevenLabs(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsTestingElevenLabs(false);
    setElevenlabsConfig((prev) => ({ ...prev, isConnected: true }));
    setElevenlabsSuccess(true);
    setTimeout(() => setElevenlabsSuccess(false), 3000);
  };
  const handlePlayVoicePreview = () => {
    setIsPlayingVoiceSample(true);
    setTimeout(() => setIsPlayingVoiceSample(false), 2400);
  };

  // 5. Notion Workspace State (Disconnected by default)
  const [notionConfig, setNotionConfig] = useState({
    integrationToken: '',
    databaseId: 'd48291a2-c319-482a-9f7b-1234abcd5678',
    syncScripts: true,
    syncCalendar: true,
    isConnected: false
  });
  const [isTestingNotion, setIsTestingNotion] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState(false);
  const handleTestNotion = async () => {
    setIsTestingNotion(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsTestingNotion(false);
    setNotionConfig((prev) => ({ ...prev, isConnected: true }));
    setNotionSuccess(true);
    setTimeout(() => setNotionSuccess(false), 3000);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialSubTab) {
      setSelectedIntegrationId(initialSubTab as IntegrationId);
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
      const accList = await instagramApi.getAccounts(environment);
      setAccounts(accList);
      if (accList.length > 0) {
        setSelectedAccount(accList[0]);
        setInstagramConfig(prev => ({
          ...prev,
          username: accList[0].username,
          displayName: accList[0].displayName || accList[0].username,
          isConnected: true
        }));
      } else {
        setSelectedAccount(null);
        setInstagramConfig(prev => ({
          ...prev,
          username: '',
          displayName: '',
          isConnected: false
        }));
      }
    } catch (e) {
      console.error('Failed to load accounts for integrations:', e);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [environment]);

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
          <EnvironmentToggle variant="pill" />
          <ThemeToggle variant="pill" />
          {savedSuccess && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                  <EnvironmentToggle variant="card" />
                </div>

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
                  <span className="font-medium">{testResult.message}</span>
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

          {/* ==================== INTEGRATIONS TAB (DIRECTORY & DRILL-DOWN) ==================== */}
          {activeTab === 'integrations' && (
            <div className="p-8 max-w-4xl space-y-6 animate-fadeIn">
              {selectedIntegrationId === null ? (
                /* DIRECTORY LIST VIEW (Categorized Matching Screenshot Style) */
                <div className="space-y-7">
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Integrations
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                      Manage connected external channels, creative design suites, AI voice synthesis, and workspace endpoints
                    </p>
                  </div>

                  {/* CATEGORY 1: Social & Video Channels */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Social & Video Channels
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-[#18181c] text-zinc-400 border border-[#27272b]' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        3 Services
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                        isDark
                          ? 'bg-[#141417] border-[#26262a] divide-[#222226]'
                          : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
                      }`}
                    >
                      {/* 1. Instagram Graph API */}
                      <div
                        id="item-integration-instagram"
                        onClick={() => setSelectedIntegrationId('instagram')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <Instagram className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Instagram Graph API
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              {accounts.length > 0 || instagramConfig.isConnected
                                ? `Real-time engagement feed active for @${selectedAccount?.username || accounts[0]?.username || instagramConfig.username || 'bajajfinance'}`
                                : 'Direct Meta Graph API connection for enterprise profiles'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            accounts.length > 0 || instagramConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {accounts.length > 0 || instagramConfig.isConnected
                              ? `Connected (${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'})`
                              : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 2. YouTube Studio & Data API */}
                      <div
                        id="item-integration-youtube"
                        onClick={() => setSelectedIntegrationId('youtube')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <Youtube className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              YouTube Studio & Data API
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Video shorts dispatch, transcriptions & channel performance feed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            youtubeConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {youtubeConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 3. LinkedIn Marketing API */}
                      <div
                        id="item-integration-linkedin"
                        onClick={() => setSelectedIntegrationId('linkedin')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <Linkedin className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              LinkedIn Marketing API
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              B2B content publishing & company page engagement analytics
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            linkedinConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {linkedinConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY 2: Creative & Audio AI */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Creative & Audio AI
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-[#18181c] text-zinc-400 border border-[#27272b]' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        2 Services
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                        isDark
                          ? 'bg-[#141417] border-[#26262a] divide-[#222226]'
                          : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
                      }`}
                    >
                      {/* 4. Canva Connect */}
                      <div
                        id="item-integration-canva"
                        onClick={() => setSelectedIntegrationId('canva')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <Palette className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Canva Connect
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Automated carousel templates & branded graphic asset generation
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            canvaConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {canvaConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 5. ElevenLabs Voice AI */}
                      <div
                        id="item-integration-elevenlabs"
                        onClick={() => setSelectedIntegrationId('elevenlabs')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-violet-400 font-bold shadow-xs shrink-0 border border-zinc-700/50">
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              ElevenLabs Voice AI
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              High-fidelity AI voice narration & speech synthesis from scripts
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            elevenlabsConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {elevenlabsConfig.isConnected ? 'Active' : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY 3: Team Messaging & Workspaces */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Team Messaging & Workspaces
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-[#18181c] text-zinc-400 border border-[#27272b]' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        4 Endpoints
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl border divide-y overflow-hidden transition-colors ${
                        isDark
                          ? 'bg-[#141417] border-[#26262a] divide-[#222226]'
                          : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
                      }`}
                    >
                      {/* 6. Microsoft Teams */}
                      <div
                        id="item-integration-teams"
                        onClick={() => setSelectedIntegrationId('teams')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M19.5 7.5h-4.2c.4-.7.7-1.5.7-2.5 0-2.2-1.8-4-4-4-1.5 0-2.8.8-3.5 2C7.8 1.8 6.5 1 5 1 2.8 1 1 2.8 1 5c0 1 .3 1.8.7 2.5H1.5C.7 7.5 0 8.2 0 9v10c0 .8.7 1.5 1.5 1.5h18c.8 0 1.5-.7 1.5-1.5V9c0-.8-.7-1.5-1.5-1.5zM12 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm14 15.5H2v-8h17v8zm-7-2h3v-4h-3v4zm-5 0h3v-4H7v4z"/>
                            </svg>
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Microsoft Teams
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Adaptive Cards & automated content dispatch via Power Automate
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Active
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 7. Slack Webhook */}
                      <div
                        id="item-integration-slack"
                        onClick={() => setSelectedIntegrationId('slack')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center text-white font-bold shadow-xs shrink-0 border border-purple-800/40">
                            <Hash className="w-5 h-5 text-amber-300" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Slack Webhook
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Escalation alerts & quality drop notifications (#customer-escalations)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Configured
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 8. Notion Workspace */}
                      <div
                        id="item-integration-notion"
                        onClick={() => setSelectedIntegrationId('notion')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#191919] flex items-center justify-center text-white font-bold shadow-xs shrink-0 border border-zinc-700/60">
                            <FileText className="w-5 h-5 text-zinc-200" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Notion Workspace
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Two-way sync for script drafts, topics pipeline & content calendar
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            notionConfig.isConnected
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDark
                              ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {notionConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>

                      {/* 9. Production Webhooks */}
                      <div
                        id="item-integration-webhooks"
                        onClick={() => setSelectedIntegrationId('webhooks')}
                        className={`group flex items-center justify-between p-4.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                            <Zap className="w-5 h-5 text-amber-200" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Production Webhooks
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Outbound payload delivery for approved production scripts (Asana, Notion)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                            Standby
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* DRILL-DOWN DETAIL VIEW */
                <div className="space-y-6">
                  {/* Drill-down Breadcrumb / Back Bar */}
                  <div className={`flex items-center justify-between border-b pb-4 ${
                    isDark ? 'border-[#222226]' : 'border-slate-200'
                  }`}>
                    <button
                      type="button"
                      id="btn-back-to-integrations"
                      onClick={() => setSelectedIntegrationId(null)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f24]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 text-[#EA580C]" />
                      <span>Back to Integrations</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {selectedIntegrationId === 'teams' && 'Microsoft Teams & Power Automate'}
                        {selectedIntegrationId === 'instagram' && 'Instagram Graph API Connector'}
                        {selectedIntegrationId === 'slack' && 'Slack Escalations Webhook'}
                        {selectedIntegrationId === 'webhooks' && 'Outbound Production Webhooks'}
                        {selectedIntegrationId === 'youtube' && 'YouTube Studio & Data API'}
                        {selectedIntegrationId === 'linkedin' && 'LinkedIn Marketing API'}
                        {selectedIntegrationId === 'canva' && 'Canva Connect Platform'}
                        {selectedIntegrationId === 'elevenlabs' && 'ElevenLabs Voice AI Studio'}
                        {selectedIntegrationId === 'notion' && 'Notion Workspace Sync'}
                      </span>
                    </div>
                  </div>

                  {/* Detail 1: Microsoft Teams */}
                  {selectedIntegrationId === 'teams' && (
                    <div>
                      {selectedAccount ? (
                        <InstagramIntegrationsView
                          account={selectedAccount}
                          onShowToast={(msg, typ) => {
                            if (typ === 'success') setSavedSuccess(true);
                            setTimeout(() => setSavedSuccess(false), 3000);
                          }}
                        />
                      ) : (
                        <div className={`p-8 text-center rounded-2xl border ${
                          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200'
                        }`}>
                          <p className="text-xs text-[#a1a1aa]">Loading accounts for Microsoft Teams configuration...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail 2: Instagram Graph API */}
                  {selectedIntegrationId === 'instagram' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white font-bold shadow-xs">
                              <Instagram className="w-5 h-5" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Instagram Graph API Connector
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Meta Business Suite & Direct Graph API v20.0 Gateway
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            accounts.length > 0 || instagramConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {accounts.length > 0 || instagramConfig.isConnected
                              ? `Connected (${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'})`
                              : 'Disconnected'}
                          </span>
                        </div>

                        {instagramSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              {selectedAccount
                                ? `Meta Graph API credentials verified! Connected to @${selectedAccount.username} and synchronized workspace metrics.`
                                : 'Meta Graph API updated successfully.'}
                            </span>
                          </div>
                        )}

                        {instagramError && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                              : 'bg-rose-50 border border-rose-300 text-rose-900 shadow-2xs'
                          }`}>
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span className="font-semibold">{instagramError}</span>
                          </div>
                        )}

                        {/* SECTION 1: Token / API Credential Fields */}
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b]/40 border-[#27272a]' : 'bg-slate-50/70 border-slate-200'} space-y-4`}>
                          <div>
                            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Meta Graph API Credentials & Setup
                            </div>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                              Enter your Meta Graph API credentials to establish a direct server-to-server connection. Requires an Instagram Professional or Business account linked to a Meta Business Suite page.
                            </p>
                          </div>

                          {isDemoMode ? (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-zinc-500">Fast-track setup with pre-validated credentials:</span>
                              <button
                                type="button"
                                id="btn-quick-fill-instagram"
                                onClick={handleQuickFillInstagram}
                                className="flex items-center gap-1 text-[11px] text-amber-500 hover:text-amber-400 font-medium cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Quick Fill Demo Token (@bajajfinance)</span>
                              </button>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                              isDark
                                ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-300'
                                : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                            }`}>
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span><strong>Live Production Mode:</strong> Enter an active Meta Graph API System User or User Token (starts with EAA...) to verify against Meta servers.</span>
                            </div>
                          )}

                          <form onSubmit={handleConnectInstagram} className="space-y-3.5">
                            <div>
                              <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Meta Graph Access Token (User or System User)
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  id="input-meta-token"
                                  placeholder="EAA..."
                                  value={instagramConfig.metaAccessToken}
                                  onChange={(e) => setInstagramConfig({ ...instagramConfig, metaAccessToken: e.target.value })}
                                  className={`w-full rounded-lg pl-3.5 pr-10 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                    isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                                <Key className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                Generate a 60-day or Never-Expiring System User token in Meta Business Manager with <code className="text-orange-400">instagram_basic</code> and <code className="text-orange-400">pages_show_list</code>.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                  Instagram Business Account ID
                                </label>
                                <input
                                  type="text"
                                  id="input-meta-page-id"
                                  placeholder="178414092817409"
                                  value={instagramConfig.metaPageId}
                                  onChange={(e) => setInstagramConfig({ ...instagramConfig, metaPageId: e.target.value })}
                                  className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                    isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                              </div>

                              <div>
                                <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                  Instagram Handle / Username
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-zinc-500 text-xs">@</span>
                                  <input
                                    type="text"
                                    id="input-meta-username"
                                    placeholder="bajajfinance"
                                    value={instagramConfig.username}
                                    onChange={(e) => setInstagramConfig({ ...instagramConfig, username: e.target.value })}
                                    className={`w-full rounded-lg pl-7 pr-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                      isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className={`block font-semibold mb-1.5 text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Display Label (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Bajaj Finance Limited (Primary)"
                                value={instagramConfig.displayName}
                                onChange={(e) => setInstagramConfig({ ...instagramConfig, displayName: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>

                            <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                              <button
                                type="button"
                                id="btn-open-instagram-modal"
                                onClick={() => setShowAddInstagramModal(true)}
                                className={`text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Or connect via Manus Browser Modal / OAuth</span>
                              </button>

                              <button
                                type="submit"
                                id="btn-connect-instagram"
                                disabled={isTestingInstagram}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#EA580C] to-[#DD2A7B] hover:opacity-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>{isTestingInstagram ? 'Verifying Token...' : 'Verify Token & Connect'}</span>
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* SECTION 2: Connected Accounts Section (LOADED IMMEDIATELY FROM SAVED STATE) */}
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b]/70 border-[#27272a]' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Connected Accounts ({accounts.length})
                              </span>
                              {accounts.length > 0 && (
                                <span className="text-[10px] text-zinc-500">
                                  • Click row to set active profile
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              id="btn-connect-another-account"
                              onClick={handleConnectAnotherAccountClick}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5 text-orange-500" />
                              <span>+ Connect Another Account</span>
                            </button>
                          </div>

                          {accounts.length > 0 ? (
                            <div className="space-y-2">
                              {accounts.map(acc => {
                                const isActive = selectedAccount?.id === acc.id || instagramConfig.username === acc.username;
                                return (
                                  <div
                                    key={acc.id}
                                    id={`connected-account-${acc.username}`}
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setInstagramConfig(prev => ({
                                        ...prev,
                                        username: acc.username,
                                        displayName: acc.displayName || acc.username,
                                        isConnected: true
                                      }));
                                    }}
                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                      isActive
                                        ? isDark
                                          ? 'bg-orange-500/10 border-orange-500/40 text-white shadow-xs'
                                          : 'bg-orange-50/80 border-orange-300 text-orange-950 shadow-xs'
                                        : isDark
                                        ? 'bg-[#121215] border-[#222226] hover:border-zinc-700 text-zinc-300'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shrink-0 shadow-xs">
                                        <Instagram className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs tracking-tight">@{acc.username}</span>
                                          {isActive && (
                                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                              <Check className="w-2.5 h-2.5" /> Active Profile
                                            </span>
                                          )}
                                        </div>
                                        <div className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                          {acc.displayName || acc.username}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Individual Disconnect Action */}
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                      <button
                                        type="button"
                                        id={`btn-disconnect-${acc.username}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAccountToDisconnect(acc);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                          isDark
                                            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border-rose-900/50'
                                            : 'text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-300 shadow-2xs'
                                        }`}
                                      >
                                        Disconnect
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Empty State when no accounts are connected */
                            <div className={`p-6 rounded-xl border border-dashed text-center space-y-2 ${
                              isDark ? 'border-zinc-800 bg-[#121215]/50 text-zinc-400' : 'border-slate-300 bg-white text-slate-500'
                            }`}>
                              <div className="w-10 h-10 rounded-full bg-zinc-800/40 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
                                <Instagram className="w-5 h-5" />
                              </div>
                              <div className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                                No Connected Accounts
                              </div>
                              <p className="text-[11px] max-w-sm mx-auto">
                                No Instagram accounts are currently linked. Enter your Meta Graph credentials above and click <strong>Verify Token & Connect</strong> to connect your first account.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 3: Slack Webhook */}
                  {selectedIntegrationId === 'slack' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center text-white font-bold shadow-xs border border-purple-800/40">
                              <Hash className="w-5 h-5 text-amber-300" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Slack Webhook Escalations
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Instant team channels alerting and script warnings
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Configured
                          </span>
                        </div>

                        {slackSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Test alert dispatched successfully to Slack channel #{slackChannel}!</span>
                          </div>
                        )}

                        <div className="space-y-4 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Incoming Webhook URL
                            </label>
                            <input
                              type="url"
                              value={notificationSettings.slackWebhook}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, slackWebhook: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Default Channel
                              </label>
                              <input
                                type="text"
                                value={slackChannel}
                                onChange={(e) => setSlackChannel(e.target.value)}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Bot Display Name
                              </label>
                              <input
                                type="text"
                                defaultValue="S2S Alert Bot"
                                className={`w-full rounded-lg px-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Verify connectivity by pinging your target channel
                            </span>
                            <button
                              type="button"
                              disabled={isTestingSlack}
                              onClick={handleTestSlack}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4A154B] hover:bg-[#3d113e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border border-purple-800/60"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isTestingSlack ? 'Pinging Slack...' : 'Send Test Alert'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 4: Production Webhooks */}
                  {selectedIntegrationId === 'webhooks' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-4 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-xs">
                              <Zap className="w-5 h-5 text-amber-200" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Production Webhook Dispatches
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Automated Content Handoffs to Asana, Monday.com, or Notion
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Standby
                          </span>
                        </div>

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Triggers external production project management boards whenever a script status advances to &apos;Approved for Production&apos;.
                        </p>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Webhook Target URL
                            </label>
                            <input
                              type="url"
                              placeholder="https://api.yourorganization.com/webhooks/production"
                              className={`w-full rounded-lg px-3 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Authorization Bearer Token (Optional)
                            </label>
                            <input
                              type="password"
                              placeholder="secret_wh_token_..."
                              className={`w-full rounded-lg px-3 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 5: YouTube Studio & Data API */}
                  {selectedIntegrationId === 'youtube' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center text-white font-bold shadow-xs">
                              <Youtube className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                YouTube Studio & Data API Connector
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Channel Metrics Feed & Video Shorts Automated Dispatch
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            youtubeConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {youtubeConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>

                        {youtubeSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Successfully authenticated with YouTube Data API v3! Channel: @BajajFinanceOfficial</span>
                          </div>
                        )}

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Connects S2S Studio directly to YouTube Studio to sync subscriber engagement metrics, shorts views, and automatically dispatch scripts as drafted uploads.
                        </p>

                        <div className="space-y-4 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Google Cloud / YouTube API Key
                            </label>
                            <input
                              type="password"
                              value={youtubeConfig.apiKey}
                              placeholder="AIzaSyA4..."
                              onChange={(e) => setYoutubeConfig({ ...youtubeConfig, apiKey: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Credentials are automatically encrypted locally in your Credential Vault.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Target Channel Identifier
                              </label>
                              <input
                                type="text"
                                value={youtubeConfig.channelId}
                                onChange={(e) => setYoutubeConfig({ ...youtubeConfig, channelId: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Default Privacy Level
                              </label>
                              <select
                                value={youtubeConfig.defaultPrivacy}
                                onChange={(e) => setYoutubeConfig({ ...youtubeConfig, defaultPrivacy: e.target.value as any })}
                                className={`w-full rounded-lg px-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              >
                                <option value="unlisted">Unlisted (Review Draft)</option>
                                <option value="private">Private (Restricted)</option>
                                <option value="public">Public (Immediate Publish)</option>
                              </select>
                            </div>
                          </div>

                          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div>
                              <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Auto-Upload Approved Shorts
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Automatically draft upload whenever video generation completes
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={youtubeConfig.autoUploadShorts}
                              onChange={(e) => setYoutubeConfig({ ...youtubeConfig, autoUploadShorts: e.target.checked })}
                              className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C]"
                            />
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Verify API quota and authenticate with YouTube Data API
                            </span>
                            <button
                              type="button"
                              id="btn-connect-youtube"
                              disabled={isTestingYoutube}
                              onClick={handleTestYoutube}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF0000] hover:bg-[#d90000] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isTestingYoutube ? 'Authenticating...' : youtubeConfig.isConnected ? 'Re-verify API Quota' : 'Connect YouTube Channel'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 6: LinkedIn Marketing API */}
                  {selectedIntegrationId === 'linkedin' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white font-bold shadow-xs">
                              <Linkedin className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                LinkedIn Marketing API
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Company Page Publishing & Corporate Reach Analytics
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            linkedinConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {linkedinConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>

                        {linkedinSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>LinkedIn OAuth token valid! Organization page &apos;Bajaj Finserv&apos; linked.</span>
                          </div>
                        )}

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Enables corporate publishing for B2B financial insights, carousel articles, and engagement tracking across your LinkedIn Company Page.
                        </p>

                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                OAuth Client ID
                              </label>
                              <input
                                type="text"
                                placeholder="86abc123xyz..."
                                value={linkedinConfig.clientId}
                                onChange={(e) => setLinkedinConfig({ ...linkedinConfig, clientId: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Client Secret
                              </label>
                              <input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={linkedinConfig.clientSecret}
                                onChange={(e) => setLinkedinConfig({ ...linkedinConfig, clientSecret: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Organization URN / Company Page ID
                            </label>
                            <input
                              type="text"
                              value={linkedinConfig.orgId}
                              onChange={(e) => setLinkedinConfig({ ...linkedinConfig, orgId: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div>
                              <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Auto-Publish Approved Summaries
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Publish script hooks and key bullet takeaways directly to LinkedIn feed
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={linkedinConfig.autoPublish}
                              onChange={(e) => setLinkedinConfig({ ...linkedinConfig, autoPublish: e.target.checked })}
                              className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C]"
                            />
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Authenticate OAuth scopes: r_organization_social, w_organization_social
                            </span>
                            <button
                              type="button"
                              id="btn-connect-linkedin"
                              disabled={isTestingLinkedin}
                              onClick={handleTestLinkedin}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isTestingLinkedin ? 'Verifying Token...' : linkedinConfig.isConnected ? 'Re-authorize OAuth' : 'Connect LinkedIn Page'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 7: Canva Connect */}
                  {selectedIntegrationId === 'canva' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white font-bold shadow-xs">
                              <Palette className="w-5 h-5" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Canva Connect Platform
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Automated Visual Carousels & Brand Kit Template Sync
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            canvaConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {canvaConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>

                        {canvaSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Canva Connect authenticated! Brand Kit &apos;Bajaj Finserv Official&apos; synchronized.</span>
                          </div>
                        )}

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Transform generated video scripts and topic hooks into ready-to-post Canva Instagram carousels using approved corporate typography and brand assets.
                        </p>

                        <div className="space-y-4 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Canva Developer API Key / Connect Token
                            </label>
                            <input
                              type="password"
                              placeholder="canva_live_token_..."
                              value={canvaConfig.apiKey}
                              onChange={(e) => setCanvaConfig({ ...canvaConfig, apiKey: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Brand Kit ID
                              </label>
                              <input
                                type="text"
                                value={canvaConfig.brandKitId}
                                onChange={(e) => setCanvaConfig({ ...canvaConfig, brandKitId: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Default Carousel Template
                              </label>
                              <input
                                type="text"
                                value={canvaConfig.templateId}
                                onChange={(e) => setCanvaConfig({ ...canvaConfig, templateId: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>

                          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div>
                              <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Auto-Generate Slides on Script Approval
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Automatically push hook, scene breakdowns, and CTA slides to Canva folder
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={canvaConfig.autoExportAssets}
                              onChange={(e) => setCanvaConfig({ ...canvaConfig, autoExportAssets: e.target.checked })}
                              className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C]"
                            />
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Test Canva template rendering and design export pipeline
                            </span>
                            <button
                              type="button"
                              id="btn-connect-canva"
                              disabled={isTestingCanva}
                              onClick={handleTestCanva}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7D2AE8] hover:bg-[#6820c7] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Palette className="w-3.5 h-3.5" />
                              <span>{isTestingCanva ? 'Connecting...' : canvaConfig.isConnected ? 'Verify Brand Templates' : 'Connect Canva Account'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 8: ElevenLabs Voice AI */}
                  {selectedIntegrationId === 'elevenlabs' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-violet-400 font-bold shadow-xs border border-zinc-700/50">
                              <Volume2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                ElevenLabs Voice AI Studio
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Ultra-Realistic AI Voiceover Narration & Speech Synthesis
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            elevenlabsConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {elevenlabsConfig.isConnected ? 'Active' : 'Disconnected'}
                          </span>
                        </div>

                        {elevenlabsSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>ElevenLabs API Key active! 45,000 synthesis characters available.</span>
                          </div>
                        )}

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Directly synthesizes spoken voiceovers from approved video script scenes, allowing instant audio preview and video-ready MP3 narration export.
                        </p>

                        <div className="space-y-4 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              ElevenLabs API Key
                            </label>
                            <input
                              type="password"
                              placeholder="xi-api-key-..."
                              value={elevenlabsConfig.apiKey}
                              onChange={(e) => setElevenlabsConfig({ ...elevenlabsConfig, apiKey: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Strored with AES-256 encryption in local S2S Vault.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Primary Voice Actor
                              </label>
                              <select
                                value={elevenlabsConfig.selectedVoice}
                                onChange={(e) => setElevenlabsConfig({ ...elevenlabsConfig, selectedVoice: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              >
                                <option>Rachel (Professional Narrator)</option>
                                <option>Adam (Deep &amp; Authoritative)</option>
                                <option>Antoni (Dynamic &amp; Energetic)</option>
                                <option>Bella (Warm &amp; Conversational)</option>
                                <option>Josh (Youthful &amp; Upbeat)</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                                Synthesis Model
                              </label>
                              <select
                                value={elevenlabsConfig.model}
                                onChange={(e) => setElevenlabsConfig({ ...elevenlabsConfig, model: e.target.value })}
                                className={`w-full rounded-lg px-3.5 py-2 text-xs border focus:outline-none focus:border-[#EA580C] ${
                                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              >
                                <option value="eleven_multilingual_v2">Eleven Multilingual v2 (High Quality)</option>
                                <option value="eleven_turbo_v2_5">Eleven Flash v2.5 (Fastest Latency)</option>
                                <option value="eleven_monolingual_v1">Eleven Monolingual English</option>
                              </select>
                            </div>
                          </div>

                          {/* Voice Tuner Sliders */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className={`font-semibold ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>Voice Stability</span>
                                <span className="font-mono text-zinc-500">{Math.round(elevenlabsConfig.stability * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={elevenlabsConfig.stability}
                                onChange={(e) => setElevenlabsConfig({ ...elevenlabsConfig, stability: parseFloat(e.target.value) })}
                                className="w-full accent-[#EA580C]"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className={`font-semibold ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>Clarity / Similarity Boost</span>
                                <span className="font-mono text-zinc-500">{Math.round(elevenlabsConfig.clarity * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={elevenlabsConfig.clarity}
                                onChange={(e) => setElevenlabsConfig({ ...elevenlabsConfig, clarity: parseFloat(e.target.value) })}
                                className="w-full accent-[#EA580C]"
                              />
                            </div>
                          </div>

                          {/* Interactive Preview Bar */}
                          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <Mic className="w-4 h-4 text-violet-400" />
                              <div>
                                <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {isPlayingVoiceSample ? 'Playing Voice Sample...' : 'Audition Voice Narration'}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                  &ldquo;Smart budgeting starts with understanding your recurring EMIs...&rdquo;
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              id="btn-preview-voice"
                              onClick={handlePlayVoicePreview}
                              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                isPlayingVoiceSample
                                  ? 'bg-violet-600 text-white border-violet-500 animate-pulse'
                                  : isDark
                                  ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'
                                  : 'border-slate-300 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isPlayingVoiceSample ? 'Playing (2.4s)' : 'Preview Voice'}</span>
                            </button>
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Verify credentials and connect speech synthesis engine
                            </span>
                            <button
                              type="button"
                              id="btn-connect-elevenlabs"
                              disabled={isTestingElevenLabs}
                              onClick={handleTestElevenLabs}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isTestingElevenLabs ? 'Synthesizing...' : elevenlabsConfig.isConnected ? 'Re-verify API Status' : 'Connect ElevenLabs'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail 9: Notion Workspace */}
                  {selectedIntegrationId === 'notion' && (
                    <div className="space-y-4 max-w-3xl">
                      <div className={`p-6 rounded-2xl border space-y-5 ${
                        isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#191919] flex items-center justify-center text-white font-bold shadow-xs border border-zinc-700/60">
                              <FileText className="w-5 h-5 text-zinc-200" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Notion Workspace Sync
                              </div>
                              <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                Two-Way Editorial Calendar & Script Draft Synchronization
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            notionConfig.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDark
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {notionConfig.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>

                        {notionSuccess && (
                          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Connected to Notion Database! &apos;Content Calendar 2026&apos; synchronized.</span>
                          </div>
                        )}

                        <p className={`text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-600'}`}>
                          Keeps marketing teams aligned by mirroring generated scripts, video hooks, and publication dates directly to a shared Notion database.
                        </p>

                        <div className="space-y-4 text-xs">
                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Notion Internal Integration Token
                            </label>
                            <input
                              type="password"
                              placeholder="secret_..."
                              value={notionConfig.integrationToken}
                              onChange={(e) => setNotionConfig({ ...notionConfig, integrationToken: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Obtained from notion.so/my-integrations with Read/Write content access.</p>
                          </div>

                          <div>
                            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
                              Target Notion Database ID
                            </label>
                            <input
                              type="text"
                              value={notionConfig.databaseId}
                              onChange={(e) => setNotionConfig({ ...notionConfig, databaseId: e.target.value })}
                              className={`w-full rounded-lg px-3.5 py-2 font-mono text-xs border focus:outline-none focus:border-[#EA580C] ${
                                isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                              isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Sync Script Drafts
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                  Export hook & scenes as page blocks
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={notionConfig.syncScripts}
                                onChange={(e) => setNotionConfig({ ...notionConfig, syncScripts: e.target.checked })}
                                className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C]"
                              />
                            </div>

                            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                              isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Sync Calendar Dates
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                                  Mirror scheduled social post dates
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={notionConfig.syncCalendar}
                                onChange={(e) => setNotionConfig({ ...notionConfig, syncCalendar: e.target.checked })}
                                className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C]"
                              />
                            </div>
                          </div>

                          <div className={`pt-3 flex items-center justify-between border-t ${isDark ? 'border-[#27272a]' : 'border-slate-100'}`}>
                            <span className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                              Verify Notion database permissions and write a sample page
                            </span>
                            <button
                              type="button"
                              id="btn-connect-notion"
                              disabled={isTestingNotion}
                              onClick={handleTestNotion}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border border-zinc-600"
                            >
                              <FileText className="w-3.5 h-3.5 text-zinc-300" />
                              <span>{isTestingNotion ? 'Verifying Sync...' : notionConfig.isConnected ? 'Test Database Access' : 'Connect Notion Workspace'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#222226]' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-emerald-950/60 border border-emerald-700/40 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}>
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

      <InstagramConnectModal
        isOpen={showAddInstagramModal}
        onClose={() => setShowAddInstagramModal(false)}
        onConnected={(newAcc) => {
          setAccounts(prev => [...prev.filter(a => a.id !== newAcc.id), newAcc]);
          setSelectedAccount(newAcc);
          setInstagramConfig({
            metaAccessToken: 'EAAGNO4m...system_token',
            metaPageId: newAcc.id,
            username: newAcc.username,
            displayName: newAcc.displayName || newAcc.username,
            isConnected: true
          });
          setInstagramSuccess(true);
          setShowAddInstagramModal(false);
          setTimeout(() => setInstagramSuccess(false), 3000);
        }}
        existingAccounts={accounts}
      />

      {/* Confirmation Modal for Individual Instagram Account Disconnection */}
      {accountToDisconnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-disconnect-account-title"
          onClick={() => {
            if (!isDisconnectingAccount) setAccountToDisconnect(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 id="modal-disconnect-account-title" className="text-sm font-bold">
                  Disconnect Instagram Account
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  Are you sure you want to disconnect <span className="font-semibold text-rose-400">@{accountToDisconnect.username}</span> ({accountToDisconnect.displayName || accountToDisconnect.username})?
                </p>
                <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  This account will be removed from your active integrations. Other connected accounts and your API configuration will remain active.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-disconnect"
                onClick={() => setAccountToDisconnect(null)}
                disabled={isDisconnectingAccount}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-disconnect"
                onClick={handleConfirmDisconnectAccount}
                disabled={isDisconnectingAccount}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDisconnectingAccount ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
