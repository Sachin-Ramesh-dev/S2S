import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Bot,
  Zap,
  Sparkles,
  HelpCircle,
  Code,
  ChevronDown,
  ChevronUp,
  FileText,
  Workflow
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TeamsIntegrationConfig, InstagramAccount } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramIntegrationsViewProps {
  account: InstagramAccount;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const POWER_AUTOMATE_SCHEMA = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "description": "Event type: 'topics', 'script', or 'test'"
    },
    "timestamp": {
      "type": "string"
    },
    "account": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "username": { "type": "string" },
        "displayName": { "type": "string" }
      }
    },
    "count": {
      "type": "integer"
    },
    "topics": {
      "type": "array"
    },
    "script": {
      "type": "object"
    },
    "message": {
      "type": "string"
    },
    "adaptiveCard": {
      "type": "object",
      "description": "Pre-built Microsoft Teams Adaptive Card v1.4 object"
    }
  }
};

const SAMPLE_PAYLOAD_PREVIEW = {
  "type": "script",
  "timestamp": "2026-09-17T12:30:00.000Z",
  "account": {
    "id": "ig-bajajfinance",
    "username": "bajajfinance",
    "displayName": "Bajaj Finserv"
  },
  "script": {
    "id": "script-101",
    "title": "3 Emergency Fund Mistakes That Cost Thousands",
    "format": "Reel",
    "hook": "90% of people park their emergency fund in the wrong place.",
    "status": "ready_to_record",
    "callToAction": "Save this reel and share with a friend who needs this."
  },
  "adaptiveCard": {
    "type": "AdaptiveCard",
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.4",
    "body": [
      {
        "type": "Container",
        "style": "emphasis",
        "items": [
          {
            "type": "TextBlock",
            "text": "🎬 Ready for Production: 3 Emergency Fund Mistakes",
            "weight": "Bolder",
            "size": "Medium"
          }
        ]
      }
    ],
    "actions": [
      {
        "type": "Action.OpenUrl",
        "title": "🔍 Open in Script Studio",
        "url": "http://localhost:3000"
      }
    ]
  }
};

export const InstagramIntegrationsView: React.FC<InstagramIntegrationsViewProps> = ({
  account,
  onShowToast
}) => {
  const { isDark } = useTheme();

  // Configuration State
  const [config, setConfig] = useState<TeamsIntegrationConfig>({
    webhookUrl: '',
    enabled: true,
    autoSendTopics: false,
    autoSendScripts: true
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedExpression, setCopiedExpression] = useState(false);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  const [activeSetupStep, setActiveSetupStep] = useState<number>(1);

  // Fetch initial config
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await instagramApi.getTeamsConfig();
      if (data) {
        setConfig(data);
      }
    } catch (err: any) {
      console.error('Failed to load Teams config:', err);
      if (onShowToast) {
        onShowToast(`Failed to load Teams config: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await instagramApi.updateTeamsConfig(config);
      setConfig(updated);
      if (onShowToast) {
        onShowToast('Microsoft Teams webhook settings saved successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Failed to save Teams config:', err);
      if (onShowToast) {
        onShowToast(`Failed to save settings: ${err.message}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.webhookUrl || !config.webhookUrl.trim()) {
      if (onShowToast) {
        onShowToast('Please enter a valid Power Automate Webhook URL first.', 'error');
      }
      return;
    }

    try {
      setIsTesting(true);
      const res = await instagramApi.testTeamsWebhook(config.webhookUrl.trim());
      await loadConfig();
      if (res.success) {
        if (onShowToast) {
          onShowToast('Test card dispatched to Microsoft Teams! Check your channel.', 'success');
        }
      } else {
        if (onShowToast) {
          onShowToast(`Test failed: ${res.message}`, 'error');
        }
      }
    } catch (err: any) {
      console.error('Failed to test Teams webhook:', err);
      if (onShowToast) {
        onShowToast(`Test dispatch failed: ${err.message}`, 'error');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'schema' | 'expression') => {
    navigator.clipboard.writeText(text);
    if (type === 'schema') {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2500);
    } else {
      setCopiedExpression(true);
      setTimeout(() => setCopiedExpression(false), 2500);
    }
  };

  const isConnected = !!config.webhookUrl && config.lastTestStatus === 'success';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-gray-700">Loading Integration Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-[#18181f] border-purple-900/40'
            : 'bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white border-purple-100 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold">Microsoft Teams & Automation</h1>
                {isConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live & Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Setup Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Seamlessly route S2S AI topic batches and production-ready scripts directly into your Microsoft Teams channels via Power Automate. Features pre-rendered interactive Adaptive Cards v1.4 with one-click review actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !config.webhookUrl}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isTesting || !config.webhookUrl
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
              }`}
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isTesting ? 'Dispatching Test...' : 'Send Test Card'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Webhook Configuration + Status Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Webhook Configuration</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Single shared HTTP trigger endpoint for topic batches and production scripts
                  </p>
                </div>
              </div>

              {/* Master Enabled Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {config.enabled ? 'Active' : 'Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 relative"></div>
              </label>
            </div>

            <div className="space-y-5">
              {/* Webhook URL Field */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Power Automate HTTP POST URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showWebhookUrl ? 'text' : 'password'}
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://prod-xx.westus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?api-version=2016-06-01..."
                    className={`w-full text-xs font-mono px-3.5 py-2.5 pr-10 rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-[#1c1c24] border-gray-700 text-gray-200 focus:border-purple-500'
                        : 'bg-slate-50/50 border-gray-300 text-gray-900 focus:border-purple-600 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    title={showWebhookUrl ? 'Hide URL' : 'Show URL'}
                  >
                    {showWebhookUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 shrink-0" />
                  Obtained after creating a flow with trigger &quot;When an HTTP request is received&quot; in Power Automate.
                </p>
              </div>

              {/* Automated Dispatch Toggles */}
              <div className="pt-3 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Automated Triggers
                </h3>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#181820] border-gray-800' : 'bg-gray-50/60 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Auto-Send New Topic Batches</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Automatically dispatch a formatted Adaptive Card to Teams whenever Manus/AI generates new topic batches.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoSendTopics}
                    onChange={(e) => setConfig({ ...config, autoSendTopics: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#181820] border-gray-800' : 'bg-gray-50/60 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Auto-Send Scripts on Approval / Ready</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Dispatch full script packages (hook, scenes, CTA, review buttons) to Teams when marked ready or approved.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoSendScripts}
                    onChange={(e) => setConfig({ ...config, autoSendScripts: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Status & Test Result Card */}
        <div className="space-y-6">
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <Bot className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Integration Health</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                    config.lastTestStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : config.lastTestStatus === 'failed'
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {config.lastTestStatus === 'success'
                    ? 'Connected'
                    : config.lastTestStatus === 'failed'
                    ? 'Connection Error'
                    : 'Not Tested'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Active Account</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  @{account.username}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last Tested</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-400">
                  {config.lastTestedAt
                    ? new Date(config.lastTestedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })
                    : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last Dispatched</span>
                <span className="text-[11px] text-gray-600 dark:text-gray-400">
                  {config.lastDispatchedAt
                    ? new Date(config.lastDispatchedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })
                    : 'Never'}
                </span>
              </div>

              {/* Status Message Display */}
              {config.lastTestMessage && (
                <div
                  className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                    config.lastTestStatus === 'success'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <p className="font-semibold mb-0.5">
                    {config.lastTestStatus === 'success' ? 'Verification OK' : 'Verification Issue'}
                  </p>
                  <p className="text-[10px] break-words">{config.lastTestMessage}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !config.webhookUrl}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 text-purple-500" />
                  {isTesting ? 'Sending...' : 'Test Webhook Connectivity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Power Automate Setup Guide */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Power Automate Setup Documentation</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Follow these 4 simple steps to connect Microsoft Teams with S2S Studio in under 3 minutes
              </p>
            </div>
          </div>

          <a
            href="https://make.powerautomate.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
          >
            Open Power Automate Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 4 Step Visual Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              step: 1,
              title: 'Create Cloud Flow',
              desc: 'Instant Cloud Flow with HTTP Request Trigger'
            },
            {
              step: 2,
              title: 'Paste JSON Schema',
              desc: 'Define S2S payload & Adaptive Card structure'
            },
            {
              step: 3,
              title: 'Add Teams Action',
              desc: 'Post adaptive card in a chat or channel'
            },
            {
              step: 4,
              title: 'Save & Copy URL',
              desc: 'Paste HTTP POST URL into S2S & test'
            }
          ].map((s) => (
            <button
              type="button"
              key={s.step}
              onClick={() => setActiveSetupStep(s.step)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeSetupStep === s.step
                  ? isDark
                    ? 'bg-purple-950/30 border-purple-600 shadow-sm'
                    : 'bg-purple-50/70 border-purple-500 shadow-sm'
                  : isDark
                  ? 'bg-[#181820] border-gray-800 hover:border-gray-700'
                  : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeSetupStep === s.step
                      ? 'bg-purple-600 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s.step}
                </span>
                {activeSetupStep === s.step && (
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                )}
              </div>
              <h4 className="text-xs font-bold mb-0.5">{s.title}</h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Step Content Detail */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#181820] border-gray-800' : 'bg-slate-50/70 border-gray-200'
          }`}
        >
          {activeSetupStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="text-xs font-bold">
                  Create an Instant Cloud Flow in Microsoft Power Automate
                </h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed pl-1">
                <li>
                  Sign in to{' '}
                  <a
                    href="https://make.powerautomate.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 font-semibold underline"
                  >
                    make.powerautomate.com
                  </a>{' '}
                  using your Microsoft 365 work account.
                </li>
                <li>
                  In the left sidebar, click <strong>Create</strong>, then choose{' '}
                  <strong>Instant cloud flow</strong> (or <strong>Automated cloud flow</strong>).
                </li>
                <li>
                  Name your flow (e.g. <code>S2S Instagram Alerts to Teams</code>).
                </li>
                <li>
                  Under &quot;Choose how to trigger this flow&quot;, search for and select:{' '}
                  <strong>&quot;When an HTTP request is received&quot;</strong>.
                </li>
                <li>
                  Click <strong>Create</strong> to open the Flow canvas.
                </li>
              </ol>
            </div>
          )}

          {activeSetupStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-xs font-bold">
                    Configure Request Body JSON Schema in the HTTP Trigger
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(POWER_AUTOMATE_SCHEMA, null, 2), 'schema')
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSchema ? 'Copied!' : 'Copy JSON Schema'}
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Click on the <strong>When an HTTP request is received</strong> trigger card. Paste the JSON schema below into the <strong>&quot;Request Body JSON Schema&quot;</strong> textarea. This allows Power Automate to dynamically parse the pre-rendered Adaptive Card and script data.
              </p>

              <div className="relative">
                <pre
                  className={`p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 border ${
                    isDark
                      ? 'bg-[#101015] border-gray-700 text-purple-300'
                      : 'bg-white border-gray-300 text-purple-900'
                  }`}
                >
                  {JSON.stringify(POWER_AUTOMATE_SCHEMA, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeSetupStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="text-xs font-bold">
                    Add Microsoft Teams &quot;Post adaptive card in a chat or channel&quot; Action
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard("triggerBody()?['adaptiveCard']", 'expression')
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedExpression ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedExpression ? 'Copied Expression!' : 'Copy Expression'}
                </button>
              </div>

              <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed pl-1">
                <li>
                  Click <strong>+ New step</strong> (or <strong>Add an action</strong>) below the trigger.
                </li>
                <li>
                  Search for <strong>Microsoft Teams</strong> and select the action:{' '}
                  <strong>&quot;Post adaptive card in a chat or channel&quot;</strong>.
                </li>
                <li>
                  Set <strong>Post as</strong>: <code>Flow bot</code>.
                </li>
                <li>
                  Set <strong>Post in</strong>: <code>Channel</code> (or <code>Chat with Flow bot</code>).
                </li>
                <li>
                  Select your desired <strong>Team</strong> and <strong>Channel</strong> (e.g. <code>#content-production</code>).
                </li>
                <li>
                  In the <strong>Adaptive Card</strong> field, switch to expression mode or select dynamic content:
                  <div className="mt-1 flex items-center gap-2 font-mono text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-500/20 w-fit">
                    <code>triggerBody()?[&apos;adaptiveCard&apos;]</code>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeSetupStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h3 className="text-xs font-bold">
                  Save Flow, Copy Generated HTTP URL & Verify Connectivity
                </h3>
              </div>
              <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed pl-1">
                <li>
                  Click <strong>Save</strong> at the top right of the Power Automate editor.
                </li>
                <li>
                  Click back into the <strong>When an HTTP request is received</strong> trigger card.
                </li>
                <li>
                  You will now see a generated <strong>HTTP POST URL</strong>. Click the copy icon.
                </li>
                <li>
                  Paste this URL into the <strong>&quot;Power Automate HTTP POST URL&quot;</strong> input field above on this page.
                </li>
                <li>
                  Click <strong>Save Settings</strong>, then click <strong>&quot;Send Test Card&quot;</strong>.
                </li>
                <li>
                  Open your Microsoft Teams channel — you will see a verified S2S Studio test card appear in real-time!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Collapsible Sample Payload Preview */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPayloadPreview(!showPayloadPreview)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showPayloadPreview ? 'Hide Payload Inspector' : 'Inspect Sample Webhook Payload (JSON & Card)'}</span>
            {showPayloadPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showPayloadPreview && (
            <div className="mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#0d0d12] text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72">
              <pre>{JSON.stringify(SAMPLE_PAYLOAD_PREVIEW, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
