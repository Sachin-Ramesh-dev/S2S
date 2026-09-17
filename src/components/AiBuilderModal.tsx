import React, { useState } from 'react';
import { Workflow } from '../types';
import {
  Sparkles,
  X,
  ArrowRight,
  Bot,
  Mail,
  MessageSquare,
  Zap,
  CheckCircle2,
  Loader2,
  FileCode,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyWorkflow: (workflow: Workflow) => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'AI Email Support Bot (Codecademy Guide)',
    description: 'Gmail/Email trigger -> Gemini classifier & drafter -> Urgency filter -> Slack alert & Auto-reply',
    icon: Mail,
    prompt: 'Build an AI email support bot with Google Gemini that classifies inquiries into billing/technical, detects urgency, drafts a resolution, and alerts Slack for urgent issues.'
  },
  {
    title: 'Customer Review & Feedback Sentiment (Codecademy)',
    description: 'Inbound Review webhook -> Gemini sentiment analysis -> Route negative reviews to Slack -> Save positive to SQL',
    icon: MessageSquare,
    prompt: 'Create a customer review summarizer with Gemini that analyzes sentiment and routes negative reviews to Slack and logs positive reviews in SQL.'
  },
  {
    title: 'AI Executive Brief & Research Digest',
    description: 'Schedule trigger -> HTTP documentation fetch -> Gemini synthesizer -> Slack channel briefing',
    icon: Bot,
    prompt: 'Schedule daily web research with Gemini that synthesizes tech news and posts an executive summary to Slack.'
  }
];

export const AiBuilderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyWorkflow
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<Workflow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedWorkflow(null);

    try {
      const res = await fetch('/api/ai/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse })
      });

      const data = await res.json();
      if (data.success && data.workflow) {
        setGeneratedWorkflow(data.workflow);
      } else {
        throw new Error(data.error || 'Failed to generate workflow');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with AI Workflow Builder');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedWorkflow) {
      onApplyWorkflow(generatedWorkflow);
      onClose();
    }
  };

  return (
    <div
      id="modal-ai-builder"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#16161a] border border-[#27272c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#26262a] flex items-center justify-between bg-gradient-to-r from-[#1c1c22] to-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Workflow Builder</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Powered by Google Gemini
                </span>
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Describe the workflow you want to automate in natural language. S2S will construct nodes and logic automatically.
              </p>
            </div>
          </div>
          <button
            id="btn-close-ai-builder"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#222226] text-[#71717a] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Examples */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] block mb-2">
              Featured Codecademy Tutorials & Prompts
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {SUGGESTED_PROMPTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                      handleGenerate(item.prompt);
                    }}
                    className="p-3 bg-[#1c1c22] hover:bg-[#22222a] border border-[#28282e] hover:border-amber-500/40 rounded-xl text-left transition-all group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-[#27272f] text-amber-400 group-hover:bg-amber-500/20 transition-colors mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#a1a1aa] mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#52525b] group-hover:text-amber-400 transition-colors self-center" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] block mb-2">
              Or Describe Your Custom Automation
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a webhook that parses customer emails with Google Gemini, checks if urgency is high, sends a Slack notification, and drafts an auto-reply..."
                rows={3}
                className="w-full bg-[#121215] border border-[#27272b] rounded-xl px-3.5 py-3 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none font-mono"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#71717a] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Synthesizes triggers, conditional logic, and AI prompt configs</span>
                </span>
                <button
                  id="btn-submit-ai-prompt"
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Workflow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Generated Workflow Preview */}
          {generatedWorkflow && (
            <div className="p-4 bg-[#1a1a20] border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#282830] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">{generatedWorkflow.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa]">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{generatedWorkflow.nodes.length} nodes configured</span>
                </div>
              </div>

              <p className="text-xs text-[#a1a1aa]">
                {generatedWorkflow.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {generatedWorkflow.nodes.map((node, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#24242c] border border-[#32323a] text-xs text-neutral-300 rounded-md font-mono flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{node.name}</span>
                    <span className="text-[10px] text-[#71717a]">({node.type})</span>
                  </span>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-apply-ai-workflow"
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Load onto Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
