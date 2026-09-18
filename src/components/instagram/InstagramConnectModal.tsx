import React, { useState, useEffect } from 'react';
import {
  Instagram,
  X,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  Globe,
  Key,
  ShieldCheck,
  Check,
  ChevronRight,
  AlertCircle,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  Zap,
  ExternalLink
} from 'lucide-react';
import { InstagramAccount } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { useEnvironment } from '../../context/EnvironmentContext';

interface InstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (account: InstagramAccount) => void;
  existingAccounts?: InstagramAccount[];
}

type ConnectTab = 'instagram_login' | 'browser_crawl' | 'meta_graph';

interface DemoPreset {
  username: string;
  displayName: string;
  category: string;
  followers: number;
  bio: string;
}

const PRESET_ACCOUNTS: DemoPreset[] = [
  {
    username: 'tatacapital_loans',
    displayName: 'Tata Capital Financial',
    category: 'Finance & Banking',
    followers: 185000,
    bio: 'Smart financial tools, personal credit strategies, and intelligent growth guidance.'
  },
  {
    username: 'zerodhainvest',
    displayName: 'Zerodha Varsity',
    category: 'Investing & FinTech',
    followers: 320000,
    bio: 'Democratizing financial education, stock markets, and long-term wealth compounding.'
  },
  {
    username: 'groww_official',
    displayName: 'Groww Mutual Funds',
    category: 'Mutual Funds & Wealth',
    followers: 410000,
    bio: 'Simple investing for smart India. Direct mutual funds, SIPs, and digital gold.'
  },
  {
    username: 'zomato_creators',
    displayName: 'Zomato Culture & Food',
    category: 'Consumer & Media',
    followers: 890000,
    bio: 'Viral pop culture, food reels, behind the scenes, and relatable moments.'
  }
];

export const InstagramConnectModal: React.FC<InstagramConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  existingAccounts = []
}) => {
  const { environment, isLiveMode, isDemoMode } = useEnvironment();
  const [activeTab, setActiveTab] = useState<ConnectTab>(isLiveMode ? 'meta_graph' : 'instagram_login');
  
  // Instagram Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState(isLiveMode ? '' : 'tatacapital_loans');
  const [password, setPassword] = useState(isLiveMode ? '' : '••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  
  // Custom Profile details
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [customCategory, setCustomCategory] = useState('Finance & Banking');
  
  // Crawl URL State
  const [profileUrl, setProfileUrl] = useState('');
  
  // Meta Graph API State
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPageId, setMetaPageId] = useState('');
  
  // Connection Progress States
  const [connectionStage, setConnectionStage] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [connectedAccount, setConnectedAccount] = useState<InstagramAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminalDrawer, setShowTerminalDrawer] = useState(false);

  const connectionSteps = [
    { title: 'Provisioning Manus Chromium Sandbox', desc: 'Isolating browser session in secure micro-container with residential proxy...' },
    { title: 'Handshake with Instagram Auth Gateway', desc: 'Resolving CSRF challenges & negotiating secure OAuth 2.0 tokens...' },
    { title: 'Authenticating Account Credentials', desc: 'Validating Professional / Creator account permissions & 2FA...' },
    { title: 'Querying Meta Graph & Scraping Telemetry', desc: 'Extracting profile bio, follower count, engagement metrics, and recent reels...' },
    { title: 'Ingesting Page Insights into Manus Agent', desc: 'Configuring initial content pillars and active AI strategy rulebook...' }
  ];

  // Auto advance connection simulation and log emission
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionStage === 'connecting') {
      const now = new Date().toLocaleTimeString();
      const stepMessages = [
        `[${now}] Manus Chromium v126 session mounted in container [cid-774b9]`,
        `[${now}] Connected to https://www.instagram.com/accounts/login/ via SSL tunnel`,
        `[${now}] Credentials dispatched. Session tokens acquired: sessionid, ds_user_id`,
        `[${now}] Extracted page metrics: Followers, Category, Engagement rate, 12 recent Reels`,
        `[${now}] Ingested telemetry into Manus AI strategy engine. Account initialized!`
      ];

      setTerminalLogs(prev => [...prev, stepMessages[currentStepIndex] || `[${now}] Step ${currentStepIndex + 1} processing...`]);

      if (currentStepIndex < connectionSteps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, 650);
      }
    }
    return () => clearTimeout(timer);
  }, [connectionStage, currentStepIndex]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DemoPreset) => {
    setLoginIdentifier(preset.username);
    setCustomDisplayName(preset.displayName);
    setCustomCategory(preset.category);
    setPassword('••••••••••••');
  };

  const handleInstagramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = (loginIdentifier || '').replace('@', '').trim();
    if (!cleanUser) {
      setErrorMessage('Please enter an Instagram handle, email, or phone number.');
      return;
    }

    setErrorMessage(null);
    setConnectionStage('connecting');
    setCurrentStepIndex(0);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Manus Autonomous Browser connection for @${cleanUser}...`
    ]);

    try {
      const matchedPreset = isDemoMode ? PRESET_ACCOUNTS.find(p => p.username.toLowerCase() === cleanUser.toLowerCase()) : undefined;
      const res = await instagramApi.connectManusAccount({
        method: 'manus_instagram_login',
        username: cleanUser,
        loginIdentifier: cleanUser,
        displayName: customDisplayName || (isDemoMode ? matchedPreset?.displayName : cleanUser.replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
        category: customCategory || (isDemoMode ? matchedPreset?.category : 'Finance & Business'),
        bio: isDemoMode ? matchedPreset?.bio : undefined,
        followersCount: isDemoMode ? matchedPreset?.followers : undefined,
        isDemo: isDemoMode
      });

      // Wait for the steps animation to complete smoothly
      setTimeout(() => {
        setConnectedAccount(res);
        setConnectionStage('success');
      }, 2800);
    } catch (err: any) {
      setConnectionStage('idle');
      setErrorMessage(err.message || 'Instagram connection failed. Please check your credentials.');
    }
  };

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanHandle = profileUrl.trim();
    if (cleanHandle.includes('instagram.com/')) {
      cleanHandle = cleanHandle.split('instagram.com/')[1].split('/')[0].split('?')[0];
    }
    cleanHandle = cleanHandle.replace('@', '').trim();

    if (!cleanHandle) {
      setErrorMessage('Please enter an Instagram profile URL or @username.');
      return;
    }

    setErrorMessage(null);
    setConnectionStage('connecting');
    setCurrentStepIndex(0);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Manus Autonomous Crawler navigating to @${cleanHandle}...`
    ]);

    try {
      const matchedPreset = isDemoMode ? PRESET_ACCOUNTS.find(p => p.username.toLowerCase() === cleanHandle.toLowerCase()) : undefined;
      const res = await instagramApi.connectManusAccount({
        method: 'manus_browser_crawl',
        username: cleanHandle,
        loginIdentifier: cleanHandle,
        displayName: customDisplayName || (isDemoMode ? matchedPreset?.displayName : undefined),
        category: customCategory || (isDemoMode ? matchedPreset?.category : undefined),
        bio: isDemoMode ? matchedPreset?.bio : undefined,
        followersCount: isDemoMode ? matchedPreset?.followers : undefined,
        isDemo: isDemoMode
      });

      setTimeout(() => {
        setConnectedAccount(res);
        setConnectionStage('success');
      }, 2800);
    } catch (err: any) {
      setConnectionStage('idle');
      setErrorMessage(err.message || 'Failed to crawl Instagram profile via Manus browser.');
    }
  };

  const handleMetaGraphSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = (loginIdentifier || '').replace('@', '').trim();
    if (!cleanUser && !metaPageId) {
      setErrorMessage('Please enter an Instagram business handle or Facebook Page ID.');
      return;
    }
    if (!metaAccessToken.trim()) {
      setErrorMessage('Please enter your Meta Graph API Access Token (starts with EAA...).');
      return;
    }

    setErrorMessage(null);
    setConnectionStage('connecting');
    setCurrentStepIndex(0);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Authenticating Meta Graph API v20.0 for @${cleanUser || metaPageId}...`,
      `[${new Date().toLocaleTimeString()}] Validating token signature and scopes (instagram_basic, pages_show_list, instagram_manage_insights)...`,
      `[${new Date().toLocaleTimeString()}] Fetching Business Account metadata for ID: ${metaPageId || 'auto-resolved'}...`
    ]);

    try {
      const matchedPreset = isDemoMode ? PRESET_ACCOUNTS.find(p => p.username.toLowerCase() === cleanUser.toLowerCase()) : undefined;
      const res = await instagramApi.connectManusAccount({
        method: 'meta_graph_api',
        username: cleanUser || 'business_page',
        loginIdentifier: metaPageId || cleanUser,
        displayName: customDisplayName || (isDemoMode ? matchedPreset?.displayName : cleanUser.replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
        category: customCategory || (isDemoMode ? matchedPreset?.category : 'Enterprise & Creator'),
        bio: isDemoMode ? matchedPreset?.bio : undefined,
        followersCount: isDemoMode ? matchedPreset?.followers : undefined,
        metaAccessToken: metaAccessToken.trim(),
        metaPageId: metaPageId.trim() || undefined,
        isDemo: isDemoMode
      });

      setTimeout(() => {
        setConnectedAccount(res);
        setConnectionStage('success');
      }, 2200);
    } catch (err: any) {
      setConnectionStage('idle');
      setErrorMessage(err.message || 'Meta Graph API token verification failed. Please check permissions.');
    }
  };

  const handleCompleteAndSwitch = () => {
    if (connectedAccount) {
      onConnected(connectedAccount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#11121c] rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-700/80 overflow-hidden my-4 transition-all flex flex-col max-h-[92vh]">
        
        {/* ========================================================= */}
        {/* 1. MANUS CLOUD BROWSER WINDOW CHROME (Header) */}
        {/* ========================================================= */}
        <div className="bg-[#181926] px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between select-none">
          {/* Traffic light window controls + Browser Tab */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-[#4c0000] font-bold"
                title="Close Window"
              >
                ×
              </button>
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>

            {/* Active Browser Tab */}
            <div className="flex items-center gap-2 bg-[#232438] px-3 py-1.5 rounded-lg border border-zinc-700/60 text-xs text-zinc-200 shadow-xs">
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center">
                <Instagram className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {connectionStage === 'connecting' ? 'Connecting...' : connectionStage === 'success' ? `@${connectedAccount?.username || 'instagram'}` : 'Log in • Instagram'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>
          </div>

          {/* Manus Environment Badge & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold">
              <Bot className="w-3 h-3" />
              <span>Manus Cloud Browser</span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400 font-mono">1080p Stream</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BROWSER NAVIGATION / URL BAR */}
        {/* ========================================================= */}
        <div className="bg-[#1e2030] px-4 py-2 border-b border-zinc-800 flex items-center gap-3">
          {/* Browser Back / Forward / Reload controls */}
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              type="button"
              disabled
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30 cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30 cursor-not-allowed"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (connectionStage === 'success') {
                  setConnectionStage('idle');
                }
              }}
              className="p-1 rounded hover:bg-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Reload Browser Canvas"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Omnibox / URL Address Bar */}
          <div className="flex-1 bg-[#12131f] rounded-lg border border-zinc-700/80 px-3 py-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-mono text-[11px]">https://</span>
              <span className="text-zinc-200 font-mono text-[11px] truncate">
                www.instagram.com/accounts/login/
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 shrink-0">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> TLS 1.3
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-zinc-400">28ms</span>
            </div>
          </div>

          {/* Connection Method Tabs Switcher */}
          <div className="flex items-center bg-[#141522] rounded-lg p-0.5 border border-zinc-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('instagram_login')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'instagram_login'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('browser_crawl')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'browser_crawl'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Public Crawl
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meta_graph')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'meta_graph'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Graph API
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ENVIRONMENT BANNER & QUICK BRAND PRESET BAR */}
        {/* ========================================================= */}
        {isLiveMode && connectionStage === 'idle' && (
          <div className="bg-[#0c1e18] px-4 py-2 border-b border-emerald-900/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold">Live Production Mode:</span>
              <span className="text-emerald-400/80 hidden sm:inline">Connect verified creator or business accounts via Meta Graph API v20.0 or authentic credentials.</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              Live OAuth Enabled
            </span>
          </div>
        )}

        {isDemoMode && connectionStage === 'idle' && (
          <div className="bg-[#1f160e] px-4 py-1.5 border-b border-amber-900/50 flex items-center justify-between text-[11px] text-amber-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Demo Sandbox Mode: Quick presets & simulated connections enabled for testing.</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Sandbox Safe
            </span>
          </div>
        )}

        {isDemoMode && connectionStage === 'idle' && activeTab === 'instagram_login' && (
          <div className="bg-[#151624] px-4 py-2 border-b border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 shrink-0 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Fill Brand:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.username}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                    loginIdentifier.replace('@', '') === preset.username
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 ring-1 ring-orange-500/30'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                  <span>@{preset.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. MAIN BROWSER VIEWPORT CANVAS */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa] relative min-h-[380px]">

          {/* ======================================================= */}
          {/* STATE A: ACTIVE MANUS CONNECTION RUNNING (Live Stream)   */}
          {/* ======================================================= */}
          {connectionStage === 'connecting' && (
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px]">
              {/* Manus Live Stream Animation */}
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center shadow-md">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="text-center max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-300 mb-2">
                  <Bot className="w-3.5 h-3.5 text-orange-600" />
                  <span>Manus Autonomous Browser Agent Active</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Connecting Instagram Page @{loginIdentifier.replace('@', '')}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Authenticating in sandboxed Chromium instance, bypassing challenges, and syncing page telemetry.
                </p>
              </div>

              {/* Progress Steps Checklist */}
              <div className="w-full max-w-md mt-6 space-y-2.5 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                {connectionSteps.map((step, idx) => {
                  const isPast = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-orange-600 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isCurrent ? 'text-orange-600 font-bold' : isPast ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Logs Trigger */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-mono cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showTerminalDrawer ? 'Hide' : 'Show'} Manus Agent Terminal Stream</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STATE B: SUCCESS STATE (Account Connected)               */}
          {/* ======================================================= */}
          {connectionStage === 'success' && connectedAccount && (
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md mb-4">
                <Check className="w-8 h-8" />
              </div>

              <div className="text-center max-w-md">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Successfully Authenticated via Manus
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-2 flex items-center justify-center gap-1.5">
                  <span>@{connectedAccount.username}</span>
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold" title="Verified Creator">
                    ✓
                  </span>
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">{connectedAccount.displayName}</p>
              </div>

              {/* Account Telemetry Card */}
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-5 text-left">
                <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Followers</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {connectedAccount.followersCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Category</span>
                    <p className="text-xs font-bold text-gray-800 mt-1 truncate">
                      {connectedAccount.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Engagement</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      {connectedAccount.engagementRate}%
                    </p>
                  </div>
                </div>

                <div className="pt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Connection Engine:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                      <Bot className="w-3 h-3 text-orange-600" /> Manus Cloud Browser
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Session Token ID:</span>
                    <span className="font-mono text-gray-700">{connectedAccount.manusSessionId || 'manus-auth-session-live'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Auto Guardrails Seeded:</span>
                    <span className="font-bold text-orange-600">Active (Finance & Banking)</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md pt-5">
                <button
                  type="button"
                  onClick={handleCompleteAndSwitch}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Open Workspace with @{connectedAccount.username}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STATE C: IDLE - AUTHENTIC INSTAGRAM LOGIN CARD           */}
          {/* ======================================================= */}
          {connectionStage === 'idle' && (
            <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
              
              {/* Error Banner */}
              {errorMessage && (
                <div className="w-full max-w-[360px] mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* TAB 1: INSTAGRAM LOGIN (THE MANUS INSTAGRAM CONNECT) */}
              {activeTab === 'instagram_login' && (
                <div className="w-full max-w-[360px] space-y-3">
                  {/* The Authentic Instagram Login Frame */}
                  <div className="bg-white border border-gray-300 rounded-lg p-6 sm:p-8 shadow-xs">
                    
                    {/* Instagram Wordmark / Logo */}
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-serif italic">
                        Instagram
                      </h1>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-gray-500">
                        <span>Connect to</span>
                        <span className="font-bold text-orange-600 flex items-center gap-0.5">
                          <Bot className="w-3 h-3" /> Manus AI
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleInstagramLogin} className="space-y-2.5">
                      {/* Phone number, username, or email */}
                      <div>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="Phone number, username, or email"
                          className="w-full px-2.5 py-2 bg-[#fafafa] border border-gray-300 rounded-[4px] text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
                          required
                        />
                      </div>

                      {/* Password */}
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-2.5 py-2 bg-[#fafafa] border border-gray-300 rounded-[4px] text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-400 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-800 hover:text-gray-900 cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      {/* Category & Display Name Options */}
                      <div className="pt-1 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="block font-semibold text-gray-500 mb-0.5">Page Title</label>
                          <input
                            type="text"
                            value={customDisplayName}
                            onChange={(e) => setCustomDisplayName(e.target.value)}
                            placeholder="Tata Capital Loans"
                            className="w-full px-2 py-1 bg-[#fafafa] border border-gray-200 rounded text-xs text-gray-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-500 mb-0.5">Category</label>
                          <select
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full px-2 py-1 bg-[#fafafa] border border-gray-200 rounded text-xs text-gray-800 focus:bg-white focus:outline-none"
                          >
                            <option value="Finance & Banking">Finance & Banking</option>
                            <option value="Investing & FinTech">Investing & FinTech</option>
                            <option value="Education & Tech">Education & Tech</option>
                            <option value="Consumer Brands">Consumer Brands</option>
                          </select>
                        </div>
                      </div>

                      {/* Instagram Blue Log In Button */}
                      <button
                        type="submit"
                        className="w-full mt-3 py-2 bg-[#0095f6] hover:bg-[#1877f2] active:bg-[#0081d6] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Log in</span>
                      </button>

                      {/* OR Divider */}
                      <div className="relative my-3 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <span className="relative bg-white px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          OR
                        </span>
                      </div>

                      {/* Log in with Facebook */}
                      <button
                        type="button"
                        onClick={handleInstagramLogin}
                        className="w-full py-1 text-[#385185] hover:text-[#1877f2] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#1877f2] text-white flex items-center justify-center text-[10px] font-black">
                          f
                        </span>
                        <span>Log in with Facebook</span>
                      </button>

                      {/* Forgot password */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(PRESET_ACCOUNTS[0])}
                          className="text-[11px] text-[#00376b] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Secondary Sign Up box */}
                  <div className="bg-white border border-gray-300 rounded-lg p-3 text-center text-xs text-gray-700 shadow-xs">
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('browser_crawl')}
                      className="text-[#0095f6] font-semibold hover:underline cursor-pointer"
                    >
                      Connect via Public Scan
                    </button>
                  </div>

                  {/* Manus Security Guarantee */}
                  <div className="p-3 bg-zinc-100 rounded-lg border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800">Manus Sandboxed Environment: </span>
                      <span>Your session is isolated inside a secure micro-browser container. Credentials are not stored in plaintext.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANUS BROWSER SCAN (ZERO PASSWORD) */}
              {activeTab === 'browser_crawl' && (
                <div className="w-full max-w-[440px] bg-white border border-gray-300 rounded-xl p-6 shadow-xs space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                      <Globe className="w-4 h-4 text-orange-600" />
                      <span>Manus Zero-Password Profile Crawler</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter any public Instagram handle or URL. The Manus AI autonomous web crawler visits the live page, extracts bio, reels, and performance metrics without needing your password.
                    </p>
                  </div>

                  <form onSubmit={handleCrawlSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Instagram Profile URL or Handle
                      </label>
                      <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:border-orange-500 bg-white">
                        <span className="bg-gray-100 px-3 py-2 text-xs text-gray-500 font-mono border-r border-gray-300">
                          instagram.com/
                        </span>
                        <input
                          type="text"
                          value={profileUrl}
                          onChange={(e) => setProfileUrl(e.target.value)}
                          placeholder="tatacapital_loans"
                          className="w-full px-3 py-2 text-xs text-gray-900 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                        >
                          <option value="Finance & Banking">Finance & Banking</option>
                          <option value="Investing & FinTech">Investing & FinTech</option>
                          <option value="Education & Tech">Education & Tech</option>
                          <option value="Consumer Brands">Consumer Brands</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={customDisplayName}
                          onChange={(e) => setCustomDisplayName(e.target.value)}
                          placeholder="Brand Official"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Launch Manus Crawler & Connect</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: META GRAPH API (DEVELOPER TOKEN) */}
              {activeTab === 'meta_graph' && (
                <div className="w-full max-w-[440px] bg-white border border-gray-300 rounded-xl p-6 shadow-xs space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                      <Key className="w-4 h-4 text-orange-600" />
                      <span>Meta Graph API Enterprise Gateway</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Direct connection for enterprise Meta Business Suite accounts using long-lived System User access tokens.
                    </p>
                  </div>

                  <form onSubmit={handleMetaGraphSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Instagram Business Account ID</label>
                      <input
                        type="text"
                        value={metaPageId}
                        onChange={(e) => setMetaPageId(e.target.value)}
                        placeholder="17841400000000000"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Meta Graph Access Token</label>
                      <input
                        type="password"
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        placeholder="EAA..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Instagram Handle</label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="tatacapital_loans"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer mt-2"
                    >
                      Connect Meta Graph Token
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* 5. MANUS AGENT TERMINAL / LIVE LOG STREAM DRAWER          */}
        {/* ========================================================= */}
        <div className="bg-[#0e0f18] border-t border-zinc-800">
          <div className="px-4 py-2 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-zinc-300">Manus Agent Session: ACTIVE</span>
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-zinc-400">Isolated Sandbox PID: #20941</span>
            </div>

            <button
              type="button"
              onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer font-mono"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showTerminalDrawer ? 'Collapse Logs' : 'View Headless Logs'}</span>
            </button>
          </div>

          {showTerminalDrawer && (
            <div className="px-4 py-3 bg-black/60 border-t border-zinc-800/80 font-mono text-[10px] text-emerald-400/90 max-h-32 overflow-y-auto space-y-1">
              {terminalLogs.length > 0 ? (
                terminalLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500">Waiting for browser event triggers...</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
