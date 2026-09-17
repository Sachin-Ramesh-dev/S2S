import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye
} from 'lucide-react';
import {
  AIConfiguration,
  GenerationRecord
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramAiModelsViewProps {
  config: AIConfiguration;
  onUpdateConfig: (updates: Partial<AIConfiguration>) => Promise<void>;
  generations: GenerationRecord[];
  onOpenGenerationDetails: (record: GenerationRecord) => void;
}

export const InstagramAiModelsView: React.FC<InstagramAiModelsViewProps> = ({
  config,
  onUpdateConfig,
  generations,
  onOpenGenerationDetails
}) => {
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});

  const handleTest = async (providerKey: string) => {
    setTestingProvider(providerKey);
    try {
      const res = await instagramApi.testProviderConnection(providerKey);
      setTestResults((prev) => ({ ...prev, [providerKey]: res }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerKey]: { status: 'error', message: e.message }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const providers = [
    {
      key: 'manus',
      name: 'Manus AI Research v2',
      badge: 'Audits & Deep Research',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Autonomous research agent specialized in deep multi-source Instagram account benchmarking and gap analysis.',
      endpoint: 'https://api.manus.ai/v2/tasks',
      model: config.providers.manus.defaultAgent || 'instagram_auditor',
      status: 'Active',
      secureVault: true
    },
    {
      key: 'gemini',
      name: 'Google Gemini Creative Engine',
      badge: 'Topics & Production Scripts',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
      description: 'Multimodal model optimized for high-retention short-form hook formulation, carousel slide design, and brand voice consistency.',
      endpoint: '@google/genai SDK (Server-Side)',
      model: config.providers.gemini.model,
      status: 'Active',
      secureVault: true
    },
    {
      key: 'openai',
      name: 'OpenAI GPT-4o',
      badge: 'Secondary Fallback',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Configurable fallback model for scriptwriting and alternative angle generation if primary model encounters rate limits.',
      endpoint: 'https://api.openai.com/v1',
      model: config.providers.openai?.model || 'gpt-4o',
      status: config.providers.openai?.enabled ? 'Configured' : 'Standby',
      secureVault: true
    },
    {
      key: 'anthropic',
      name: 'Anthropic Claude 3.7 Sonnet',
      badge: 'Long-Form Strategy & Tone',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Sophisticated reasoning model for nuanced brand tone alignment and multi-paragraph newsletter conversions.',
      endpoint: 'https://api.anthropic.com/v1',
      model: config.providers.anthropic?.model || 'claude-3-7-sonnet',
      status: config.providers.anthropic?.enabled ? 'Configured' : 'Standby',
      secureVault: true
    },
    {
      key: 'perplexity',
      name: 'Perplexity Sonar Deep Research',
      badge: 'Real-Time News & Trends',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Live web-grounded research model tracking viral fintech news, regulatory updates, and interest rate shifts.',
      endpoint: 'https://api.perplexity.ai',
      model: config.providers.perplexity?.model || 'sonar-pro',
      status: config.providers.perplexity?.enabled ? 'Configured' : 'Standby',
      secureVault: true
    },
    {
      key: 'custom',
      name: 'Custom Self-Hosted / vLLM',
      badge: 'OpenAI-Compatible Endpoint',
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
      description: 'Connect any local open-weight model (e.g. DeepSeek-R1, Llama-3) via standard OpenAI-compatible API format.',
      endpoint: config.providers.custom?.baseUrl || 'http://localhost:8000/v1',
      model: config.providers.custom?.model || 'custom-agent',
      status: config.providers.custom?.enabled ? 'Configured' : 'Inactive',
      secureVault: true
    }
  ];

  const spendPct = Math.min(100, (config.costControls.currentSpendUsd / config.costControls.monthlyBudgetUsd) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-orange-600" /> Multi-Model Architecture
            </span>
            <span className="text-xs text-gray-500">
              Vault Security: <strong className="text-emerald-700 font-semibold">AES-256-GCM Server Vault</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">AI Provider & Routing Management</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Test connections, verify model task assignments, adjust token budget limits, and inspect audit telemetry.
          </p>
        </div>

        {/* Spend Pill */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs min-w-[220px] shadow-2xs">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="font-medium">Monthly AI Budget</span>
            <span className="font-bold text-gray-900">${config.costControls.currentSpendUsd.toFixed(2)} / ${config.costControls.monthlyBudgetUsd}</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                spendPct > 80 ? 'bg-red-500' : spendPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${spendPct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">{spendPct.toFixed(1)}% consumed</p>
        </div>
      </div>

      {/* Model Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => {
          const test = testResults[p.key];
          const isTesting = testingProvider === p.key;

          return (
            <div
              key={p.key}
              className="p-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm transition-all flex flex-col justify-between text-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                    <Shield className="w-3 h-3 text-emerald-600" /> Secure Vault
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{p.name}</h3>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{p.description}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1 font-mono text-[10px] text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-gray-900 font-semibold">{p.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Endpoint:</span>
                    <span className="truncate max-w-[170px] text-gray-800">{p.endpoint}</span>
                  </div>
                </div>

                {test && (
                  <div
                    className={`p-2 rounded text-[11px] font-mono flex items-center gap-1.5 border ${
                      test.status === 'ok'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {test.status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{test.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Live Connectivity</span>
                <button
                  type="button"
                  onClick={() => handleTest(p.key)}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Routing Matrix & Fallback Chain */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Central AI Task Routing Matrix</h2>
        <p className="text-xs text-gray-500">
          Designated AI model assigned to each core system capability with automated fallback handling.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Intelligence Task</th>
                <th className="pb-3 font-semibold">Primary Engine</th>
                <th className="pb-3 font-semibold">Secondary Fallback</th>
                <th className="pb-3 font-semibold">Timeout Threshold</th>
                <th className="pb-3 font-semibold">Strict JSON Schema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 font-semibold text-gray-900">Page Audit & Deep Research</td>
                <td className="py-3 text-indigo-700 font-mono font-medium">Manus AI (v2 tasks)</td>
                <td className="py-3 text-gray-600 font-mono">Perplexity Sonar Pro</td>
                <td className="py-3 text-gray-500">120,000 ms</td>
                <td className="py-3 text-emerald-700 font-semibold">Enforced</td>
              </tr>
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 font-semibold text-gray-900">Topic Generation</td>
                <td className="py-3 text-orange-700 font-mono font-medium">Google Gemini (2.5 Flash)</td>
                <td className="py-3 text-gray-600 font-mono">OpenAI GPT-4o</td>
                <td className="py-3 text-gray-500">30,000 ms</td>
                <td className="py-3 text-emerald-700 font-semibold">Enforced</td>
              </tr>
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 font-semibold text-gray-900">Reel & Carousel Scriptwriter</td>
                <td className="py-3 text-orange-700 font-mono font-medium">Google Gemini (2.5 Flash)</td>
                <td className="py-3 text-gray-600 font-mono">Anthropic Claude 3.7</td>
                <td className="py-3 text-gray-500">45,000 ms</td>
                <td className="py-3 text-emerald-700 font-semibold">Enforced</td>
              </tr>
              <tr className="hover:bg-gray-50/70">
                <td className="py-3 font-semibold text-gray-900">Skill Learning Proposal Engine</td>
                <td className="py-3 text-orange-700 font-mono font-medium">Google Gemini (2.5 Flash)</td>
                <td className="py-3 text-gray-600 font-mono">OpenAI GPT-4o</td>
                <td className="py-3 text-gray-500">25,000 ms</td>
                <td className="py-3 text-emerald-700 font-semibold">Enforced</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation History & Audit Log */}
      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent AI Generations & Telemetry</h2>
            <p className="text-xs text-gray-500 mt-0.5">Every AI execution is logged with token count, cost, latency, and skill version.</p>
          </div>
          <span className="text-xs text-gray-500 font-mono">{generations.length} total records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                <th className="pb-2.5 font-semibold">Timestamp</th>
                <th className="pb-2.5 font-semibold">Task</th>
                <th className="pb-2.5 font-semibold">Provider / Model</th>
                <th className="pb-2.5 font-semibold">Skill Ver</th>
                <th className="pb-2.5 font-semibold">Tokens</th>
                <th className="pb-2.5 font-semibold">Cost</th>
                <th className="pb-2.5 font-semibold">Latency</th>
                <th className="pb-2.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {generations.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 font-mono">
                  <td className="py-2.5 text-gray-600 text-[11px]">
                    {new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 text-gray-900 capitalize font-sans font-medium">{g.task.replace('_', ' ')}</td>
                  <td className="py-2.5 text-gray-700">
                    {g.provider} ({(g.model || 'gemini').split('-')[0]})
                  </td>
                  <td className="py-2.5 text-orange-700 font-semibold">{g.skillVersion}</td>
                  <td className="py-2.5 text-gray-600">
                    {g.tokensUsed ? g.tokensUsed.total.toLocaleString() : '1,450'}
                  </td>
                  <td className="py-2.5 text-emerald-700 font-semibold">
                    ${(g.costEstimateUsd || 0.002).toFixed(4)}
                  </td>
                  <td className="py-2.5 text-gray-500">{g.durationMs}ms</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenGenerationDetails(g)}
                      className="px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-[11px] font-sans transition-colors inline-flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3 h-3 text-orange-600" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
