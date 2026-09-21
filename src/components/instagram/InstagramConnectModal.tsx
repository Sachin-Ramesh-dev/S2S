import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Instagram,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search
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

export const InstagramConnectModal: React.FC<InstagramConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  existingAccounts = []
}) => {
  const { isLiveMode, isDemoMode } = useEnvironment();

  // Active Tab: 'oauth' or 'meta_graph'
  const [activeTab, setActiveTab] = useState<'oauth' | 'meta_graph'>('oauth');

  // Token Auto-Discovery State
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [isInspectingToken, setIsInspectingToken] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [detectedAccounts, setDetectedAccounts] = useState<any[]>([]);
  const [selectedDetectedAccount, setSelectedDetectedAccount] = useState<any | null>(null);

  // Manual fallback fields
  const [manualAccountMode, setManualAccountMode] = useState(false);
  const [metaPageId, setMetaPageId] = useState('');
  const [customHandle, setCustomHandle] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');

  // OAuth Setup State
  const [appIdInput, setAppIdInput] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/api/instagram/oauth/callback');
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthSuccess, setOauthSuccess] = useState(false);

  // Fetch initial OAuth info from backend
  useEffect(() => {
    if (isOpen) {
      instagramApi.getOAuthUrl().then(res => {
        if (res.redirectUri) setRedirectUri(res.redirectUri);
        if (res.appId) setAppIdInput(res.appId);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Listen for OAuth callback message from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'INSTAGRAM_OAUTH_RESULT') {
        const { code, error, errorDescription } = event.data;
        if (error) {
          setOauthError(errorDescription || 'Meta OAuth authorization failed.');
          setIsConnecting(false);
        } else if (code) {
          setIsConnecting(true);
          try {
            if (isDemoMode) {
              const newAcc = await instagramApi.connectManusAccount({
                method: 'meta_graph_api',
                username: 'fintech_insider',
                displayName: 'FinTech Insider Daily',
                category: 'Fintech & Technology',
                bio: 'Connected via Meta OAuth 2.0 Authorization.',
                metaAccessToken: `EAA_OAUTH_${code.slice(0, 20)}`,
                isDemo: true
              });
              setOauthSuccess(true);
              setTimeout(() => {
                onConnected(newAcc);
                onClose();
              }, 1200);
            } else {
              // Production: Exchange code for live Meta access token & discover accounts
              const exchangeRes = await instagramApi.exchangeOAuthCode(code);
              if (exchangeRes.requiresConfig) {
                setOauthError(exchangeRes.error || 'META_APP_ID and META_APP_SECRET must be set in .env.');
                setIsConnecting(false);
                return;
              }
              if (!exchangeRes.success) {
                setOauthError(exchangeRes.error || 'Failed to exchange authorization code with Meta.');
                setIsConnecting(false);
                return;
              }

              const connectedAccount = exchangeRes.account || (exchangeRes.connectedAccounts && exchangeRes.connectedAccounts[0]);
              if (connectedAccount) {
                setOauthSuccess(true);
                setTimeout(() => {
                  onConnected(connectedAccount);
                  onClose();
                }, 1200);
              } else if (exchangeRes.detectedAccounts && exchangeRes.detectedAccounts.length > 0) {
                const detected = exchangeRes.detectedAccounts[0];
                const newAcc = await instagramApi.connectManusAccount({
                  method: 'meta_graph_api',
                  username: detected.username,
                  displayName: detected.displayName,
                  category: detected.category,
                  bio: detected.bio || `Connected via Meta OAuth 2.0 (ID: ${detected.id})`,
                  followersCount: detected.followersCount,
                  metaPageId: detected.id,
                  isDemo: false
                });
                setOauthSuccess(true);
                setTimeout(() => {
                  onConnected(newAcc);
                  onClose();
                }, 1200);
              } else {
                setOauthError('Meta authorized successfully, but no Instagram Professional account is linked to your Facebook Page. Please link your Instagram account in Meta Business Suite.');
                setIsConnecting(false);
              }
            }
          } catch (err: any) {
            setOauthError(err.message || 'Failed to exchange authorization code with Meta.');
            setIsConnecting(false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isDemoMode, onConnected, onClose]);

  if (!isOpen) return null;

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const handleLaunchOAuthPopup = () => {
    setOauthError(null);
    setIsConnecting(true);

    const effectiveAppId = appIdInput.trim() || '178414009281740';
    const scope = 'instagram_basic,pages_show_list,instagram_manage_insights,pages_read_engagement,instagram_content_publish';
    const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${encodeURIComponent(effectiveAppId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      oauthUrl,
      'MetaInstagramOAuth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setOauthError('Popup blocked. Please allow popups for this site to log in with Meta.');
      setIsConnecting(false);
    }
  };

  const handleInspectToken = async () => {
    if (!metaAccessToken.trim()) {
      setInspectError('Please enter a Meta Graph Access Token (starts with EAA...).');
      return;
    }
    setIsInspectingToken(true);
    setInspectError(null);
    setDetectedAccounts([]);
    setSelectedDetectedAccount(null);

    try {
      const res = await instagramApi.inspectToken(metaAccessToken.trim(), isDemoMode);
      if (res.detectedAccounts && res.detectedAccounts.length > 0) {
        setDetectedAccounts(res.detectedAccounts);
        setSelectedDetectedAccount(res.detectedAccounts[0]);
      } else {
        setInspectError('No Instagram Business or Creator accounts linked to this token. Verify your Facebook Page and Instagram connection in Meta Business Suite.');
      }
    } catch (err: any) {
      setInspectError(err.message || 'Token inspection failed. Please check permissions.');
    } finally {
      setIsInspectingToken(false);
    }
  };

  const handleConnectDetectedAccount = async () => {
    if (!selectedDetectedAccount) return;
    setIsConnecting(true);
    setInspectError(null);

    try {
      const newAcc = await instagramApi.connectManusAccount({
        method: 'meta_graph_api',
        username: selectedDetectedAccount.username,
        displayName: selectedDetectedAccount.displayName,
        category: selectedDetectedAccount.category || 'Finance & Technology',
        bio: selectedDetectedAccount.bio || `Connected via Meta Graph API v20.0 (ID: ${selectedDetectedAccount.id})`,
        followersCount: selectedDetectedAccount.followersCount,
        metaAccessToken: metaAccessToken.trim(),
        metaPageId: selectedDetectedAccount.id,
        isDemo: isDemoMode
      });

      onConnected(newAcc);
      onClose();
    } catch (err: any) {
      setInspectError(err.message || 'Failed to link account to database.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = customHandle.replace('@', '').trim();
    if (!cleanUser) {
      setInspectError('Please enter an Instagram handle.');
      return;
    }
    if (!metaAccessToken.trim()) {
      setInspectError('Please enter a valid Meta Graph Access Token.');
      return;
    }

    setIsConnecting(true);
    setInspectError(null);

    try {
      const newAcc = await instagramApi.connectManusAccount({
        method: 'meta_graph_api',
        username: cleanUser,
        displayName: customDisplayName || cleanUser.replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: 'Finance & Technology',
        bio: `Connected via Meta Graph API v20.0. Account ID: ${metaPageId || '178414009281740'}`,
        metaAccessToken: metaAccessToken.trim(),
        metaPageId: metaPageId.trim() || undefined,
        isDemo: isDemoMode
      });

      onConnected(newAcc);
      onClose();
    } catch (err: any) {
      setInspectError(err.message || 'Failed to connect Instagram page.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="instagram-connect-modal"
        data-testid="manus-connect-modal"
        className="bg-[#11121c] rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-700/80 overflow-hidden my-4 transition-all flex flex-col max-h-[92vh]"
      >
        {/* Modal Window Header */}
        <div className="bg-[#181926] px-4 py-3 border-b border-zinc-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#DD2A7B] p-0.5 flex items-center justify-center shadow-xs">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Connect Instagram Account</h3>
              <span className="text-[10px] text-zinc-400">Official Meta Graph API v20.0 Connector</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isLiveMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isLiveMode ? '● LIVE PRODUCTION' : '🧪 DEMO SANDBOX'}
            </div>

            <button
              id="btn-close-connect-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#141520] px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-zinc-800">
            <button
              id="tab-oauth-connect"
              type="button"
              onClick={() => setActiveTab('oauth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'oauth'
                  ? 'bg-[#EA580C] text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Log in with Instagram (Meta OAuth)</span>
            </button>

            <button
              id="tab-graph-connect"
              type="button"
              onClick={() => setActiveTab('meta_graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'meta_graph'
                  ? 'bg-[#EA580C] text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Meta Graph API Key (Auto-Detect)</span>
            </button>
          </div>
        </div>

        {/* Environment Alert Banner */}
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Authentic Meta Verification:</strong> Connected profiles are authenticated using official Meta Graph API v20.0 endpoints.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono">
            v20.0 TLS 1.3
          </span>
        </div>

        {/* Tab 1: Meta OAuth 2.0 Popup Flow */}
        {activeTab === 'oauth' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 mx-auto flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-[#11121c] flex items-center justify-center">
                  <Instagram className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-white">One-Click Meta OAuth Connection</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect just like Manus! Click below to open Meta’s official authorization window, log into your Instagram professional profile, and grant basic permissions.
              </p>
            </div>

            {/* Launch Action */}
            <div className="max-w-md mx-auto space-y-3">
              <button
                type="button"
                id="btn-launch-meta-oauth"
                onClick={handleLaunchOAuthPopup}
                disabled={isConnecting}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#EA580C] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting with Meta...</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4" />
                    <span>Log in with Instagram (Meta OAuth)</span>
                  </>
                )}
              </button>

              {oauthError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{oauthError}</span>
                </div>
              )}

              {oauthSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Successfully authorized! Linking account to workspace...</span>
                </div>
              )}
            </div>

            {/* Step-by-Step Meta Developer App Guide */}
            <div className="p-5 rounded-2xl bg-[#161724] border border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                  <span>Step-by-Step Meta Developer App Setup Guide</span>
                </span>
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                >
                  <span>Open developers.facebook.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">1</span>
                  <span>Create an App in <strong>Meta for Developers</strong> with the <strong>"Business"</strong> use-case.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">2</span>
                  <span>Add <strong>Instagram Graph API</strong> and <strong>Facebook Login for Business</strong> products.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">3</span>
                  <div className="space-y-1 w-full">
                    <span>In Facebook Login Settings, add this exact <strong>Valid OAuth Redirect URI</strong>:</span>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0f1018] border border-zinc-800 font-mono text-[11px] text-emerald-400">
                      <span className="truncate flex-1">{redirectUri}</span>
                      <button
                        type="button"
                        onClick={handleCopyRedirect}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-colors flex items-center gap-1"
                      >
                        {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRedirect ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0">4</span>
                  <span>Add permissions: <code className="text-orange-400">instagram_basic</code>, <code className="text-orange-400">pages_show_list</code>, <code className="text-orange-400">instagram_manage_insights</code>.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Meta Graph API Token (Auto-Discovery) */}
        {activeTab === 'meta_graph' && (
          <div className="p-6 overflow-y-auto space-y-5">
            <div>
              <h3 className="font-bold text-sm text-white mb-1">Instant API Key Connection with Auto-Discovery</h3>
              <p className="text-xs text-zinc-400">
                Paste your System User or Page Token from Meta Business Manager. Our system will inspect the token against Meta Graph API v20.0 and automatically discover your linked Instagram profile.
              </p>
            </div>

            {/* Token Input Bar */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Meta Graph Access Token (starts with EAA...)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  id="input-access-token"
                  data-testid="input-modal-meta-token"
                  placeholder="EAAGNO4m...system_user_token"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#171826] border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  id="btn-auto-detect-token"
                  data-testid="btn-inspect-token"
                  onClick={handleInspectToken}
                  disabled={isInspectingToken}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isInspectingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{isInspectingToken ? 'Inspecting...' : 'Inspect & Auto-Detect'}</span>
                </button>
              </div>

              {isDemoMode && (
                <button
                  type="button"
                  onClick={() => setMetaAccessToken('EAAGNO4m...98fKq7L3x0ZBa902k')}
                  className="text-[11px] text-orange-400 hover:underline cursor-pointer"
                >
                  Insert Sample Sandbox Token
                </button>
              )}
            </div>

            {inspectError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inspectError}</span>
              </div>
            )}

            {/* Detected Accounts Picker */}
            {detectedAccounts.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Detected {detectedAccounts.length} Instagram Account(s) Linked to Token:</span>
                </span>

                <div className="space-y-2">
                  {detectedAccounts.map((acc) => {
                    const isSelected = selectedDetectedAccount?.id === acc.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedDetectedAccount(acc)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                            : 'bg-[#181824] border-zinc-800 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
                            <div className="w-full h-full rounded-full bg-[#11121c] flex items-center justify-center font-bold text-xs uppercase">
                              {acc.username.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">@{acc.username}</div>
                            <div className="text-[11px] text-zinc-400">{acc.displayName} • {(acc.followersCount || 0).toLocaleString()} followers</div>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="btn-connect-detected-account"
                  onClick={handleConnectDetectedAccount}
                  disabled={isConnecting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect @{selectedDetectedAccount?.username} to Workspace</span>
                </button>
              </div>
            )}

            {/* Manual fallback toggle */}
            <div className="pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setManualAccountMode(!manualAccountMode)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {manualAccountMode ? 'Hide manual fields' : 'Or enter Account ID and Username manually'}
              </button>

              {manualAccountMode && (
                <form onSubmit={handleConnectManual} className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Instagram Business Account ID</label>
                      <input
                        type="text"
                        placeholder="178414092817409"
                        value={metaPageId}
                        onChange={(e) => setMetaPageId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#181824] border border-zinc-700 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Instagram Handle</label>
                      <input
                        type="text"
                        placeholder="bajajfinance"
                        value={customHandle}
                        onChange={(e) => setCustomHandle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#181824] border border-zinc-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Connect via Manual Details
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
