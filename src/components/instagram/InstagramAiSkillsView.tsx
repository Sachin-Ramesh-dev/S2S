import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Shield,
  ArrowRight,
  BrainCircuit,
  Workflow,
  Check,
  Edit3
} from 'lucide-react';
import { AISkillRecord, LearningProposal } from '../../types/instagram';

interface InstagramAiSkillsViewProps {
  skills: AISkillRecord[];
  activeSkill?: AISkillRecord | null;
  proposals: LearningProposal[];
  onRollbackSkill: (version: string) => Promise<void>;
  onActionProposal: (id: string, action: 'approve' | 'reject', customRule?: string) => Promise<void>;
}

export const InstagramAiSkillsView: React.FC<InstagramAiSkillsViewProps> = ({
  skills,
  activeSkill,
  proposals,
  onRollbackSkill,
  onActionProposal
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'proposals' | 'history'>('active');
  const [rollingBackVersion, setRollingBackVersion] = useState<string | null>(null);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [customRuleText, setCustomRuleText] = useState('');

  const currentSkill = activeSkill || skills.find((s) => s.isActive) || skills[skills.length - 1];
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  const handleRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to roll back the active AI skill to version ${version}?`)) return;
    setRollingBackVersion(version);
    try {
      await onRollbackSkill(version);
    } finally {
      setRollingBackVersion(null);
    }
  };

  const handleApproveProposal = async (proposal: LearningProposal) => {
    const rule = editingProposalId === proposal.id && customRuleText.trim() ? customRuleText.trim() : undefined;
    await onActionProposal(proposal.id, 'approve', rule);
    setEditingProposalId(null);
    setCustomRuleText('');
  };

  const activeVersion = currentSkill?.version || 'v4';
  const brandTone =
    currentSkill?.brandVoice?.tone ||
    (currentSkill?.brandVoiceRules && currentSkill.brandVoiceRules.length > 0
      ? currentSkill.brandVoiceRules.join(', ')
      : 'Professional, Authoritative, Helpful');
  const brandDemographic =
    currentSkill?.brandVoice?.demographic ||
    'Savvy consumers, retail borrowers, and young professionals (22-45)';
  const brandPhilosophy =
    currentSkill?.brandVoice?.styleGuidelines ||
    (currentSkill?.brandVoiceRules && currentSkill.brandVoiceRules.length > 0
      ? currentSkill.brandVoiceRules.slice(0, 3).join(' • ')
      : 'High-contrast pattern interrupts, verified calculations, zero motivational fluff');
  const skillRules = currentSkill?.rules || [];
  const forbiddenList = currentSkill?.forbiddenPhrases || [];
  const updatedDateStr = currentSkill?.approvedAt || currentSkill?.createdAt;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-orange-600" /> Self-Evolving AI Skill Engine
            </span>
            <span className="text-xs text-gray-500">
              Active Strategy Rulebook: <strong className="text-gray-900">{activeVersion}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">AI Skills & Learning Center</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Continuously learns from your rejections and edits. View the active rulebook, approve learned proposals, or roll back versions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Skill ({activeVersion})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'proposals'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Feedback Queue</span>
            {pendingProposals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {pendingProposals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Version History ({skills.length})
          </button>
        </div>
      </div>

      {/* 1. Active Skill View */}
      {activeTab === 'active' && currentSkill && (
        <div className="space-y-6">
          {/* Active Profile Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">{currentSkill.title}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    {currentSkill.version}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {currentSkill.description || currentSkill.changeSummary || currentSkill.reason}
                </p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Approved: {updatedDateStr ? new Date(updatedDateStr).toLocaleDateString() : 'Active'}
              </span>
            </div>

            {/* Injected Rules */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                Active Prompt Directives & Anti-Slop Constraints ({skillRules.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {skillRules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-2.5 text-xs text-gray-800">
                    <span className="text-orange-600 font-bold font-mono text-[11px] shrink-0 mt-0.5">0{idx + 1}</span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Voice Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Brand Tone</span>
                <p className="text-gray-900 font-semibold mt-1">{brandTone}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Target Demographic</span>
                <p className="text-gray-900 font-semibold mt-1">{brandDemographic}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Style Philosophy</span>
                <p className="text-gray-900 font-semibold mt-1">{brandPhilosophy}</p>
              </div>
            </div>

            {/* Forbidden Phrases */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Strictly Forbidden AI Phrases & Clichés ({forbiddenList.length})</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {forbiddenList.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-white text-red-700 border border-red-200 text-xs font-mono font-medium shadow-2xs"
                  >
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Proposals / Learning Queue */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {/* Feedback Architecture Visualizer */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-orange-600" />
              Automated Feedback Learning Loop
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">1. User Action</span>
                <p className="text-gray-800 font-medium">Rejections or "Move Back" with structured reasons (e.g. "Hook too generic").</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200 space-y-1">
                <span className="text-[10px] font-bold text-orange-800 uppercase block">2. Pattern Detection</span>
                <p className="text-orange-950 font-medium">Clustering engine identifies repetitive editorial friction points.</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">3. Skill Proposal</span>
                <p className="text-emerald-950 font-medium">Generates concrete rules below for one-click human adoption.</p>
              </div>
            </div>
          </div>

          {proposals.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white border border-gray-200 shadow-sm">
              <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No Learning Proposals In Queue</p>
              <p className="text-xs text-gray-500 mt-1">
                As you reject topics or edit scripts, the feedback loop will cluster patterns and suggest rule refinements here.
              </p>
            </div>
          ) : (
            proposals.map((prop) => {
              const confPct = prop.confidence ?? (prop.confidenceScore != null ? Math.round(prop.confidenceScore * 100) : 92);
              const evidenceStr =
                prop.evidence ||
                (prop.evidenceDetails && prop.evidenceDetails.length > 0
                  ? prop.evidenceDetails.join(' • ')
                  : `${prop.evidenceCount || 1} observations documented`);

              return (
                <div
                  key={prop.id}
                  className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        Observation Proposal
                      </span>
                      <span className="text-gray-500 font-mono text-[11px]">
                        Confidence: <strong className="text-emerald-700">{confPct}%</strong>
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize border ${
                        prop.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : prop.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-gray-400 font-bold block">Observation Source:</span>
                    <p className="text-gray-900 font-semibold mt-0.5">{prop.observation}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 italic">Evidence: {evidenceStr}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-orange-50/40 border border-orange-200">
                    <span className="text-[10px] uppercase text-orange-800 font-bold block mb-1">
                      Proposed Skill Rule to Adopt:
                    </span>
                    {editingProposalId === prop.id ? (
                      <textarea
                        value={customRuleText}
                        onChange={(e) => setCustomRuleText(e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white border border-gray-300 rounded text-gray-900 text-xs focus:outline-none focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold leading-relaxed">"{prop.proposedRule}"</p>
                    )}
                  </div>

                  {prop.status === 'pending' && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onActionProposal(prop.id, 'reject')}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-200 rounded-lg transition-colors font-medium flex items-center gap-1 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>

                      {editingProposalId === prop.id ? (
                        <button
                          type="button"
                          onClick={() => handleApproveProposal(prop)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-1 text-xs shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Save & Adopt Rule
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProposalId(prop.id);
                              setCustomRuleText(prop.proposedRule);
                            }}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors font-medium text-xs"
                          >
                            Edit Rule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveProposal(prop)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-1 text-xs shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Update Skill
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. History & Rollback View */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {skills.map((skill) => {
            const isActive = skill.version === activeVersion;
            const skillDate = skill.approvedAt || skill.createdAt;
            return (
              <div
                key={skill.id || skill.version}
                className={`p-5 rounded-xl border transition-all text-xs space-y-3 bg-white shadow-sm ${
                  isActive ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 text-sm">{skill.version}</span>
                    <h3 className="font-bold text-gray-900">{skill.title}</h3>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        Active Now
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {skillDate ? `Approved: ${new Date(skillDate).toLocaleDateString()}` : `Version ${skill.version}`}
                  </span>
                </div>

                <p className="text-gray-600">
                  {skill.description || skill.changeSummary || skill.reason}
                </p>

                {(skill.changelog || skill.changeSummary) && (
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                    <span className="text-gray-400 font-bold uppercase block">Changelog:</span>
                    <p className="mt-0.5">{skill.changelog || skill.changeSummary}</p>
                  </div>
                )}

                {!isActive && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRollback(skill.version)}
                      disabled={rollingBackVersion === skill.version}
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors font-medium flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      Rollback to {skill.version}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
