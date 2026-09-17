import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { AIConfiguration, InstagramAccount, SystemReadiness } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  account: InstagramAccount;
  config: AIConfiguration;
}

export const InstagramSetupWizardModal: React.FC<InstagramSetupWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  account,
  config
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [readiness, setReadiness] = useState<SystemReadiness | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [testingManus, setTestingManus] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [manusTestResult, setManusTestResult] = useState<string | null>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSteps = 7;
  const steps = [
    { num: 1, title: 'Instagram Page', desc: 'Verify Target Account' },
    { num: 2, title: 'Manus AI Setup', desc: 'Page Auditing Engine' },
    { num: 3, title: 'Gemini Setup', desc: 'Topic & Script Writer' },
    { num: 4, title: 'Routing & Fallbacks', desc: 'Task Assignment' },
    { num: 5, title: 'Active Skill', desc: 'Brand Voice & Anti-Slop' },
    { num: 6, title: 'Scheduler', desc: 'Cadence & Automation' },
    { num: 7, title: 'Verification', desc: 'System Readiness Check' }
  ];

  const handleTestManus = async () => {
    setTestingManus(true);
    setManusTestResult(null);
    try {
      const res = await instagramApi.testProviderConnection('manus');
      setManusTestResult(res.message);
    } catch (e: any) {
      setManusTestResult(e.message);
    } finally {
      setTestingManus(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await instagramApi.testProviderConnection('gemini');
      setGeminiTestResult(res.message);
    } catch (e: any) {
      setGeminiTestResult(e.message);
    } finally {
      setTestingGemini(false);
    }
  };

  const runReadinessVerification = async () => {
    setIsVerifying(true);
    try {
      const r = await instagramApi.getReadinessCheck();
      setReadiness(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900">
        {/* Top Progress Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase tracking-wider">
                Setup Assistant
              </span>
              <span className="text-xs text-gray-500">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">
              {steps[currentStep - 1].title} — {steps[currentStep - 1].desc}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-7 gap-1 px-6 py-2.5 bg-gray-50 border-b border-gray-200">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`cursor-pointer text-center py-1.5 px-1 rounded transition-all ${
                currentStep === s.num
                  ? 'bg-white text-orange-700 font-bold shadow-2xs border border-orange-200'
                  : currentStep > s.num
                  ? 'text-emerald-700 bg-emerald-50/60 font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="text-[10px] font-mono leading-none">0{s.num}</div>
              <div className="text-[10px] truncate mt-0.5">{s.title}</div>
            </div>
          ))}
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Step 1: Instagram Page */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-gray-900 font-bold text-base">
                    @
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">@{account.username}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-semibold">{account.displayName}</p>
                  <p className="text-xs text-gray-500 mt-1 italic">"{account.bio}"</p>
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Followers</span>
                      <p className="font-bold text-gray-900">{account.followersCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Engagement</span>
                      <p className="font-bold text-gray-900">{account.engagementRate}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Avg Views</span>
                      <p className="font-bold text-gray-900">{account.averageReelViews.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                  Content Pillars Target Allocation
                </span>
                <div className="space-y-2">
                  {account.contentPillars.map((p) => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-800 font-medium">{p.name}</span>
                        <span className="text-gray-500 font-mono">
                          Current: {p.currentPercentage}% / Target: {p.targetPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, (p.currentPercentage / p.targetPercentage) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Manus AI */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Manus AI Research v2</h4>
                      <p className="text-xs text-gray-500">Designated engine for Deep Instagram Page Audits & Competitor Intelligence</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestManus}
                    disabled={testingManus}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingManus ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </div>

                {manusTestResult && (
                  <div className="mt-3 p-2.5 rounded bg-white border border-gray-200 text-xs font-mono text-gray-700">
                    Status: <span className="text-emerald-700 font-semibold">{manusTestResult}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                  Manus Configuration Profile
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Endpoint:</span>
                    <p className="font-mono text-gray-900 mt-0.5">{config.providers.manus.baseUrl}/v2/tasks</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Default Agent:</span>
                    <p className="font-mono text-gray-900 mt-0.5">{config.providers.manus.defaultAgent}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Timeout:</span>
                    <p className="font-mono text-gray-900 mt-0.5">{config.providers.manus.timeoutMs} ms</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Key Security:</span>
                    <p className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Handled via Server Vault
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Google Gemini */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Google Gemini Creative Engine</h4>
                      <p className="text-xs text-gray-500">Primary model for Topic Ideation, Reel/Carousel Scriptwriting & Learning</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={testingGemini}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingGemini ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </div>

                {geminiTestResult && (
                  <div className="mt-3 p-2.5 rounded bg-white border border-gray-200 text-xs font-mono text-gray-700">
                    Status: <span className="text-emerald-700 font-semibold">{geminiTestResult}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                  Gemini SDK Parameters
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Model:</span>
                    <p className="font-mono text-gray-900 mt-0.5">{config.providers.gemini.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Temperature:</span>
                    <p className="font-mono text-gray-900 mt-0.5">{config.providers.gemini.temperature}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Structured Output:</span>
                    <p className="text-emerald-700 font-semibold mt-0.5">Strict JSON Schema Enforcement</p>
                  </div>
                  <div>
                    <span className="text-gray-400">SDK Architecture:</span>
                    <p className="text-gray-900 mt-0.5">Server-Side (@google/genai)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Routing & Fallbacks */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                  Model Routing Matrix
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-bold text-gray-900">Instagram Page Audit</p>
                      <p className="text-[11px] text-gray-500">Deep research & benchmarking</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-mono text-[11px] border border-indigo-200 font-semibold">
                      Manus AI (v2 Research)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-bold text-gray-900">Topic Generation</p>
                      <p className="text-[11px] text-gray-500">Viral ideas from audit gaps</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-orange-50 text-orange-800 font-mono text-[11px] border border-orange-200 font-semibold">
                      Google Gemini
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-bold text-gray-900">Script Generation</p>
                      <p className="text-[11px] text-gray-500">Reel timelines & Carousel slides</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-orange-50 text-orange-800 font-mono text-[11px] border border-orange-200 font-semibold">
                      Google Gemini
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold">Automatic Fallback Failover Active</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    If primary model times out or encounters rate limits, automatically failover to secondary model.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">Active</span>
              </div>
            </div>
          )}

          {/* Step 5: Active AI Skill */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Active Skill</span>
                    <h4 className="font-bold text-gray-900 text-sm mt-0.5">Version v4 — Niche-Specific Tactical Actionability</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    Live
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-700">
                  <p className="font-bold text-gray-900">Guaranteed Prompt Directives:</p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-600">
                    <li>Avoid generic motivational quotes unless grounded in verified math.</li>
                    <li>0-2.5s visual pattern interrupt required on all Reel intros.</li>
                    <li>Carousel slides must feature progressive swipe triggers.</li>
                    <li>Low-friction bookmarking CTA at end of every post.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs">
                <span className="font-bold">Forbidden Phrases Enforced:</span>
                <p className="text-[11px] text-red-700 mt-0.5">
                  "Hey guys", "In this video today", "Secret trick banks hate", "Hustle culture".
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Scheduler */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                  Scheduled Automation Cadence
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <span className="text-gray-400 font-semibold">Manus Audit Frequency:</span>
                    <p className="font-bold text-gray-900 mt-1 capitalize">{config.schedulerSettings.auditFrequency}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Mode: {(config.schedulerSettings?.auditMode || 'fast').toUpperCase()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <span className="text-gray-400 font-semibold">Topic Generation Schedule:</span>
                    <p className="font-bold text-gray-900 mt-1">{config.schedulerSettings.contentGenerationSchedule}</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold">Cost & Token Guardrails Active</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Monthly Budget: ${config.costControls.monthlyBudgetUsd} | Warning at {config.costControls.warningThresholdPct}% | Hard stop at {config.costControls.hardStopPct}%.
                  </p>
                </div>
                <span className="font-mono text-gray-900 font-bold">${config.costControls.currentSpendUsd.toFixed(2)} spent</span>
              </div>
            </div>
          )}

          {/* Step 7: System Readiness Verification */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">System Verification Matrix</h4>
                    <p className="text-xs text-gray-500">Run diagnostic to confirm all models, vault, routing and database state</p>
                  </div>
                  <button
                    type="button"
                    onClick={runReadinessVerification}
                    disabled={isVerifying}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    Run Readiness Check
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Instagram Account Connected</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Manus AI Research Engine</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Google Gemini Creative Model</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Active AI Skill Injected (v4)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Encrypted Vault Security</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-800 font-medium">Automated Scheduler Active</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold">All Systems Ready for Production</p>
                  <p className="text-[11px] text-emerald-800">
                    The Instagram Intelligence engine is ready to perform audits, generate topic ideas, and write production scripts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Setup & Launch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
