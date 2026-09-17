import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Cpu,
  Shield,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  KeyRound,
  FileCode
} from 'lucide-react';
import {
  AIConfiguration,
  InstagramAccount,
  SystemReadiness
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramConfigurationViewProps {
  config: AIConfiguration;
  account: InstagramAccount;
  onUpdateConfig: (updates: Partial<AIConfiguration>) => Promise<void>;
  onResetRecommended: () => Promise<void>;
  onOpenSetupAssistant: () => void;
}

export const InstagramConfigurationView: React.FC<InstagramConfigurationViewProps> = ({
  config,
  account,
  onUpdateConfig,
  onResetRecommended,
  onOpenSetupAssistant
}) => {
  const [budget, setBudget] = useState(config.costControls.monthlyBudgetUsd);
  const [geminiModel, setGeminiModel] = useState(config.providers.gemini.model);
  const [geminiTemp, setGeminiTemp] = useState(config.providers.gemini.temperature);
  const [manusTimeout, setManusTimeout] = useState(config.providers.manus.timeoutMs);
  const [auditFrequency, setAuditFrequency] = useState(config.schedulerSettings.auditFrequency);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [readiness, setReadiness] = useState<SystemReadiness | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig({
        costControls: {
          ...config.costControls,
          monthlyBudgetUsd: budget
        },
        providers: {
          ...config.providers,
          gemini: {
            ...config.providers.gemini,
            model: geminiModel,
            temperature: geminiTemp
          },
          manus: {
            ...config.providers.manus,
            timeoutMs: manusTimeout
          }
        },
        schedulerSettings: {
          ...config.schedulerSettings,
          auditFrequency
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    const json = await instagramApi.exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-ai-config-${Date.now()}.json`;
    a.click();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;
    try {
      await instagramApi.importConfig(importJson);
      alert('Configuration imported successfully!');
      setIsImporting(false);
      setImportJson('');
      window.location.reload();
    } catch (e: any) {
      alert(`Import error: ${e.message}`);
    }
  };

  const handleReadinessCheck = async () => {
    setIsCheckingReadiness(true);
    try {
      const res = await instagramApi.getReadinessCheck();
      setReadiness(res);
    } finally {
      setIsCheckingReadiness(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <Settings className="w-3 h-3 text-orange-600" /> Settings & Engine Parameters
            </span>
            <span className="text-xs text-gray-500">
              Active Page: <strong className="text-gray-900">@{account.username}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">AI & Growth Configuration</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Manage spending limits, audit cadence, and strategy parameters. Technical configs are neatly tucked under Advanced.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onResetRecommended}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs"
            title="Reset to recommended verified defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Recommended Settings
          </button>
          <button
            type="button"
            onClick={onOpenSetupAssistant}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            Setup Assistant
          </button>
          <button
            id="btn-save-config"
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Friendly Cards (Non-Technical & Clean) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Cost & Budget Guardrails */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Monthly AI Spending Cap</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sets a strict hard ceiling on monthly API calls across research audits and generation batches.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Monthly Budget Limit ($ USD):</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block">Warning Email At:</span>
                <span className="text-gray-900 font-bold font-mono">
                  {config.costControls.warningThresholdPct}% (${((budget * config.costControls.warningThresholdPct) / 100).toFixed(2)})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-200">
                <span className="text-red-700 block">Automated Hard Stop:</span>
                <span className="text-red-900 font-bold font-mono">
                  {config.costControls.hardStopPct}% (${((budget * config.costControls.hardStopPct) / 100).toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Cadence & Routine */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Scheduled Routine & Cadence</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Automates periodic account diagnostics and checks for viral algorithmic shifts.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Page Audit Cadence:</label>
              <select
                value={auditFrequency}
                onChange={(e) => setAuditFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="daily">Daily 360° Scan</option>
                <option value="weekly">Weekly Comprehensive (Recommended)</option>
                <option value="monthly">Monthly Deep Benchmark</option>
              </select>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Content Batch Generation:</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                {config.schedulerSettings.contentGenerationSchedule} (Mon & Thu 09:00 UTC)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-xs font-bold text-gray-900">Advanced Technical Configuration</span>
              <p className="text-[11px] text-gray-500">
                API endpoints, model identifiers, temperature parameters, backup JSON, and system diagnostics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span>{showAdvanced ? 'Hide' : 'Show'}</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini Raw Engine */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Google Gemini Creative Engine</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-gray-500 block mb-1 font-semibold">Model Identifier:</label>
                    <input
                      type="text"
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-gray-500 font-semibold">Sampling Temperature:</label>
                      <span className="font-mono font-bold text-gray-900">{geminiTemp}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={geminiTemp}
                      onChange={(e) => setGeminiTemp(parseFloat(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                  </div>
                  <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                    <span className="text-emerald-700 font-bold block">Server-Side SDK:</span>
                    <span>Initialized via @google/genai. Key stored safely in vault.</span>
                  </div>
                </div>
              </div>

              {/* Manus AI Engine */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manus Research Engine</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-gray-500 block mb-1 font-semibold">Manus Base API URL:</label>
                    <input
                      type="text"
                      disabled
                      value={config.providers.manus.baseUrl}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1 font-semibold">Execution Timeout (ms):</label>
                    <input
                      type="number"
                      value={manusTimeout}
                      onChange={(e) => setManusTimeout(parseInt(e.target.value) || 30000)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                    <span className="text-blue-700 font-bold block">Agent Architecture:</span>
                    <span>Autonomous deep research crawler v2 with structured audit outputs.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup & System Health */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Configuration Backup & Diagnostics</h4>
                  <p className="text-[11px] text-gray-500">Export or import the full system state JSON or run an endpoint ping test.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImporting(true)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Import JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleReadinessCheck}
                    disabled={isCheckingReadiness}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingReadiness ? 'animate-spin' : ''}`} />
                    Run Diagnostic
                  </button>
                </div>
              </div>

              {readiness && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Status:</span>
                      <span className="text-emerald-700 font-bold">{(readiness.status || 'active').toUpperCase()}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Database:</span>
                      <span className="text-gray-900 font-bold">{readiness.database}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Active Skill:</span>
                      <span className="text-orange-700 font-bold">{readiness.activeSkillVersion}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Key Vault:</span>
                      <span className="text-emerald-700 font-bold">{readiness.security}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{readiness.summary}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 text-xs text-gray-900 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Import JSON Configuration</h3>
            <form onSubmit={handleImport} className="space-y-3">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste configuration JSON here..."
                rows={8}
                required
                className="w-full p-2.5 font-mono text-[11px] bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImporting(false)}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
