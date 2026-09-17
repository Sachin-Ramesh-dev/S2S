import React from 'react';
import { Workflow } from '../types';
import { SAMPLE_WORKFLOWS } from '../data/sampleWorkflows';
import {
  X,
  Sparkles,
  ShieldCheck,
  Webhook,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (workflow: Workflow) => void;
}

export const TemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-template-library"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Workflow Templates & Recipes
              </h2>
              <p className="text-xs text-neutral-400">
                Jump-start your automation with pre-configured privacy, webhook, and ETL workflows.
              </p>
            </div>
          </div>
          <button
            id="btn-close-templates-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {SAMPLE_WORKFLOWS.map((wf) => (
            <div
              key={wf.id}
              className="p-5 bg-neutral-950/80 hover:bg-neutral-800/80 border border-neutral-800 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              onClick={() => {
                onSelectTemplate(wf);
                onClose();
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {wf.name}
                  </h3>
                  {(wf.tags || []).map((t) => {
                    const isAiGuide = t.includes('Codecademy') || t.includes('Gemini');
                    return (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          isAiGuide
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                  {wf.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                  <span>{wf.nodes.length} Nodes</span>
                  <span>•</span>
                  <span>{wf.connections.length} Connections</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  Load Template <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
