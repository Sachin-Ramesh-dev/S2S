import React, { useState } from 'react';
import { WorkflowNode as IWorkflowNode, NodeDefinition } from '../../types';
import { getNodeDocumentation } from '../../data/nodeDocumentation';
import { useTheme } from '../../context/ThemeContext';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Props {
  node: IWorkflowNode;
  definition: NodeDefinition;
  onApplyExampleConfig: (config: Record<string, any>) => void;
}

export const NodeDocumentationView: React.FC<Props> = ({
  node,
  definition,
  onApplyExampleConfig
}) => {
  const { isDark } = useTheme();
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);
  const [appliedExampleIndex, setAppliedExampleIndex] = useState<number | null>(null);

  const doc = definition.documentation || getNodeDocumentation(
    node.type,
    definition.name,
    definition.category,
    definition.parametersSchema
  );

  const handleCopyConfig = (config: Record<string, any>, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedExampleIndex(idx);
    setTimeout(() => setCopiedExampleIndex(null), 2000);
  };

  const handleApplyConfig = (config: Record<string, any>, idx: number) => {
    onApplyExampleConfig(config);
    setAppliedExampleIndex(idx);
    setTimeout(() => setAppliedExampleIndex(null), 2500);
  };

  return (
    <div
      id="node-documentation-container"
      className={`h-full overflow-y-auto p-5 space-y-6 ${
        isDark ? 'text-[#f4f4f5]' : 'text-slate-900'
      }`}
    >
      {/* 1. Node Header Banner */}
      <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
        isDark ? 'bg-[#18181c] border-[#26262b]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: `${definition.color || '#EA580C'}20`,
              color: definition.color || '#EA580C'
            }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {definition.name} Documentation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#EA580C]/20 text-[#EA580C] border border-[#EA580C]/30">
                {definition.category}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-[#121215] border-[#27272e] text-[#a1a1aa]' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                {definition.type}
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
              {definition.description}
            </p>
          </div>
        </div>

        {doc.externalDocsUrl && (
          <a
            href={doc.externalDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 shrink-0 transition-colors ${
              isDark
                ? 'bg-[#202026] hover:bg-[#282832] border-[#2e2e38] text-neutral-200 hover:text-white'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <span>External Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#EA580C]" />
          </a>
        )}
      </div>

      {/* 2. Overview & Usage Guide */}
      <div className="space-y-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-[#a1a1aa]' : 'text-slate-500'
        }`}>
          <HelpCircle className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>Overview & Usage Guide</span>
        </h4>

        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-3 ${
          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          {doc.overview && (
            <p className={isDark ? 'text-neutral-200' : 'text-slate-800'}>
              {doc.overview}
            </p>
          )}

          {doc.usageGuide && (
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#1a1a1e] border-[#2a2a30] text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="font-semibold text-[#EA580C] mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>How to use this node</span>
              </div>
              <p>{doc.usageGuide}</p>
            </div>
          )}

          {/* Input & Output Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#18181c] border-[#26262b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-semibold text-xs mb-1 flex items-center gap-1.5 ${
                isDark ? 'text-sky-300' : 'text-sky-700'
              }`}>
                <Layers className="w-3.5 h-3.5" />
                <span>Input Requirements</span>
              </div>
              <p className={`text-[11px] leading-normal ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                {doc.inputRequirements || 'Accepts upstream standard JSON items.'}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#18181c] border-[#26262b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-semibold text-xs mb-1 flex items-center gap-1.5 ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Output Format</span>
              </div>
              <p className={`text-[11px] leading-normal ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                {doc.outputDescription || 'Emits formatted output data downstream.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Configuration Examples */}
      {doc.configurationExamples && doc.configurationExamples.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-[#a1a1aa]' : 'text-slate-500'
          }`}>
            <Code2 className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Tested Configuration Examples</span>
          </h4>

          <div className="space-y-3">
            {doc.configurationExamples.map((ex, idx) => {
              const isCopied = copiedExampleIndex === idx;
              const isApplied = appliedExampleIndex === idx;
              return (
                <div
                  key={ex.title + idx}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ex.title}
                      </h5>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
                        {ex.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyConfig(ex.config, idx)}
                        title="Copy configuration JSON"
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-[#1e1e24] hover:bg-[#282832] border-[#2c2c34] text-neutral-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#EA580C]" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyConfig(ex.config, idx)}
                        title="Apply this configuration directly to this node"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EA580C] hover:bg-[#c2410c] text-white flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Applied!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Apply to Node</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Config code block */}
                  <div className={`p-3 rounded-lg font-mono text-[11px] overflow-x-auto border ${
                    isDark
                      ? 'bg-[#101013] border-[#222226] text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-emerald-300'
                  }`}>
                    <pre className="whitespace-pre">{JSON.stringify(ex.config, null, 2)}</pre>
                  </div>

                  {/* Sample output preview */}
                  {ex.sampleOutput && (
                    <div className="text-[11px] space-y-1">
                      <span className={`font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        Sample output item:
                      </span>
                      <div className={`p-2 rounded-lg font-mono text-[10px] overflow-x-auto border ${
                        isDark ? 'bg-[#18181c] border-[#27272e] text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        <pre className="whitespace-pre">{JSON.stringify(ex.sampleOutput, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Parameter Schema Reference */}
      <div className="space-y-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-[#a1a1aa]' : 'text-slate-500'
        }`}>
          <BookOpen className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>Parameter Schema Reference ({definition.parametersSchema.length})</span>
        </h4>

        <div className={`border rounded-xl overflow-hidden divide-y ${
          isDark
            ? 'bg-[#141417] border-[#222226] divide-[#222226]'
            : 'bg-white border-slate-200 divide-slate-100 shadow-2xs'
        }`}>
          {definition.parametersSchema.map((param) => {
            const hasExpr = param.supportsExpression !== false;
            return (
              <div key={param.name} className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {param.label}
                    </span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                      isDark ? 'bg-[#1e1e24] border-[#2c2c34] text-neutral-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {param.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded font-mono ${
                      isDark ? 'bg-[#27272e] text-sky-400' : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {param.type}
                    </span>
                    {param.required ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                        Required
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.2 rounded ${
                        isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Optional
                      </span>
                    )}
                    {hasExpr && (
                      <span className="px-1.5 py-0.2 rounded bg-[#EA580C]/15 text-[#EA580C] font-mono">
                        {'{{ expr }}'}
                      </span>
                    )}
                  </div>
                </div>

                {param.description && (
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {param.description}
                  </p>
                )}

                {param.default !== undefined && (
                  <div className={`text-[10px] font-mono ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Default:{' '}
                    <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>
                      {typeof param.default === 'object' ? JSON.stringify(param.default) : String(param.default)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pro Tips & Best Practices */}
      {doc.tips && doc.tips.length > 0 && (
        <div className={`p-4 rounded-xl border space-y-2 ${
          isDark ? 'bg-[#18181c] border-[#26262b]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-xs font-bold text-[#EA580C] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro Tips & Workflow Best Practices</span>
          </div>
          <ul className={`text-xs space-y-1.5 list-disc pl-4 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            {doc.tips.map((tip, i) => (
              <li key={i} className="leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
