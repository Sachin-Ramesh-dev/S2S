import React, { useState, useRef } from 'react';
import {
  NodeParameterSchema,
  VaultCredential,
  WorkflowNode as IWorkflowNode
} from '../../types';
import { evaluateExpression } from '../../utils/expressionEvaluator';
import { useTheme } from '../../context/ThemeContext';
import { VariableSuggestionDropdown } from './VariableSuggestionDropdown';
import {
  Eye,
  EyeOff,
  Wand2,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Database,
  Sparkles
} from 'lucide-react';

interface Props {
  param: NodeParameterSchema;
  value: any;
  mode: 'fixed' | 'expression';
  inputData: any;
  vaultCredentials: VaultCredential[];
  upstreamNodes?: IWorkflowNode[];
  allNodes?: IWorkflowNode[];
  onChangeValue: (val: any) => void;
  onChangeMode: (mode: 'fixed' | 'expression') => void;
}

export const NodeParameterField: React.FC<Props> = ({
  param,
  value,
  mode,
  inputData,
  vaultCredentials,
  upstreamNodes = [],
  allNodes = [],
  onChangeValue,
  onChangeMode
}) => {
  const { isDark } = useTheme();
  const [showSecret, setShowSecret] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // 1. NOTICE UI Element
  if (param.type === 'notice') {
    const isInfo = param.noticeType === 'info' || !param.noticeType;
    const isWarning = param.noticeType === 'warning';
    const isError = param.noticeType === 'error';
    const isSuccess = param.noticeType === 'success';

    return (
      <div
        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          isInfo
            ? isDark
              ? 'bg-sky-950/30 border-sky-800/50 text-sky-200'
              : 'bg-sky-50 border-sky-200 text-sky-900'
            : isWarning
            ? isDark
              ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
              : 'bg-amber-50 border-amber-200 text-amber-900'
            : isError
            ? isDark
              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-900'
            : isDark
            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isInfo && <Info className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />}
          {isWarning && <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />}
          {isError && <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />}
          {isSuccess && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
        </div>
        <div className="leading-relaxed font-sans">{param.noticeText}</div>
      </div>
    );
  }

  const supportsExpr = param.supportsExpression !== false;

  // Evaluate current expression if in expression mode
  const exprEval = mode === 'expression' && typeof value === 'string'
    ? evaluateExpression(value, inputData, vaultCredentials)
    : null;

  // Handle typing inside text/expression inputs to trigger context-aware dropdown
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChangeValue(newVal);

    // Context-aware trigger: Detect if cursor or text ends with or contains {{ or $
    const cursorPos = e.target.selectionStart || newVal.length;
    const textBeforeCursor = newVal.slice(0, cursorPos);
    const lastOpen = textBeforeCursor.lastIndexOf('{{');
    const lastClose = textBeforeCursor.lastIndexOf('}}');
    const lastDollar = textBeforeCursor.lastIndexOf('$');

    if (lastOpen !== -1 && lastOpen > lastClose) {
      const queryPart = textBeforeCursor.slice(lastOpen + 2).trim();
      setDropdownQuery(queryPart);
      setIsDropdownOpen(true);
    } else if (lastDollar !== -1 && lastDollar >= cursorPos - 20) {
      const queryPart = textBeforeCursor.slice(lastDollar);
      setDropdownQuery(queryPart);
      setIsDropdownOpen(true);
    } else if (mode === 'expression' && newVal.trim().length > 0) {
      setDropdownQuery(newVal.trim());
      setIsDropdownOpen(true);
    }
  };

  // Variable insertion handler
  const handleInsertVariable = (variableSyntax: string) => {
    if (mode === 'expression') {
      const current = typeof value === 'string' ? value : '';
      if (!current.trim()) {
        onChangeValue(variableSyntax);
      } else if (current.includes('{{') && current.includes(dropdownQuery)) {
        // Replace current partial expression
        onChangeValue(variableSyntax);
      } else {
        onChangeValue(current + ' ' + variableSyntax);
      }
    } else {
      // In fixed mode: if user inserts a variable, automatically switch to expression mode or append
      const current = typeof value === 'string' ? value : (value !== undefined ? String(value) : '');
      onChangeValue(current ? `${current} ${variableSyntax}` : variableSyntax);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5 group relative">
      {/* Parameter Header */}
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-[#f4f4f5]' : 'text-slate-800'}`}>
          <span>{param.label}</span>
          {param.required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        <div className="flex items-center gap-2">
          {/* Secret reveal toggle */}
          {param.type === 'secret' && mode === 'fixed' && (
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-[11px] text-[#EA580C] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showSecret ? (
                <>
                  <EyeOff className="w-3 h-3" /> Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> Reveal
                </>
              )}
            </button>
          )}

          {/* Smart variable trigger button for text/expression inputs */}
          {supportsExpr && (
            <button
              type="button"
              onClick={() => {
                setDropdownQuery('');
                setIsDropdownOpen(!isDropdownOpen);
              }}
              title="Map Upstream Output Key or Variable"
              className={`p-1 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                isDropdownOpen
                  ? 'bg-[#EA580C] text-white font-semibold'
                  : isDark
                  ? 'hover:bg-[#27272e] text-[#a1a1aa] hover:text-[#EA580C]'
                  : 'hover:bg-slate-200 text-slate-600 hover:text-[#EA580C]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#EA580C]" />
              <span className="text-[10px] font-mono hidden sm:inline">{'{...}'}</span>
            </button>
          )}

          {/* n8n Signature [Fixed | Expression] Mode Toggle */}
          {supportsExpr && (
            <div className={`flex items-center p-0.5 rounded text-[10px] font-mono select-none border ${
              isDark ? 'bg-[#121215] border-[#27272b]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => onChangeMode('fixed')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  mode === 'fixed'
                    ? isDark
                      ? 'bg-[#27272e] text-white font-semibold'
                      : 'bg-white text-slate-900 shadow-xs font-semibold'
                    : isDark
                    ? 'text-neutral-400 hover:text-neutral-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Fixed
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('expression')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  mode === 'expression'
                    ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                    : isDark
                    ? 'text-neutral-400 hover:text-neutral-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Expression
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description / Helper */}
      {param.description && (
        <p className={`text-[11px] leading-snug ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
          {param.description}
        </p>
      )}

      {/* Context-Aware Dropdown Popup */}
      {isDropdownOpen && (
        <VariableSuggestionDropdown
          isOpen={isDropdownOpen}
          query={dropdownQuery}
          inputData={inputData}
          upstreamNodes={upstreamNodes}
          vaultCredentials={vaultCredentials}
          allNodes={allNodes}
          onSelect={handleInsertVariable}
          onClose={() => setIsDropdownOpen(false)}
        />
      )}

      {/* EXPRESSION MODE RENDERING */}
      {mode === 'expression' ? (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              ref={inputRef as any}
              type="text"
              value={value ?? ''}
              placeholder="e.g. {{ $json.user.id }} or {{ $now }}"
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none transition-colors border ${
                isDark
                  ? 'bg-[#121215] border-[#EA580C]/60 focus:border-[#EA580C] text-[#f97316]'
                  : 'bg-white border-[#EA580C]/60 focus:border-[#EA580C] text-[#c2410c] shadow-xs'
              }`}
            />
          </div>

          {/* Quick Expression Shortcuts */}
          <div className={`flex items-center gap-1.5 flex-wrap text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>Quick map:</span>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{ $json.id }}')}
              className={`px-1.5 py-0.5 rounded font-mono transition-colors border ${
                isDark
                  ? 'bg-[#18181c] border-[#27272b] hover:border-[#38383f] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              {'{{ $json.id }}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{ $json.name }}')}
              className={`px-1.5 py-0.5 rounded font-mono transition-colors border ${
                isDark
                  ? 'bg-[#18181c] border-[#27272b] hover:border-[#38383f] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              {'{{ $json.name }}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{ $now }}')}
              className={`px-1.5 py-0.5 rounded font-mono transition-colors border ${
                isDark
                  ? 'bg-[#18181c] border-[#27272b] hover:border-[#38383f] text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              {'{{ $now }}'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownQuery('');
                setIsDropdownOpen(true);
              }}
              className="text-[#EA580C] hover:underline font-semibold flex items-center gap-0.5"
            >
              <Sparkles className="w-2.5 h-2.5" /> More variables...
            </button>
          </div>

          {/* Live Expression Resolution Preview */}
          <div className={`p-2 rounded-lg font-mono text-[11px] flex items-start gap-2 border ${
            isDark
              ? 'bg-[#15181c] border-neutral-800/80 text-neutral-300'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <span className={`shrink-0 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>Result:</span>
            {exprEval?.error ? (
              <span className="text-rose-500 break-all">{exprEval.error}</span>
            ) : (
              <span className="text-emerald-500 break-all font-semibold">
                {typeof exprEval?.result === 'object'
                  ? JSON.stringify(exprEval.result)
                  : String(exprEval?.result ?? '(empty)')}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* FIXED MODE RENDERING BY PARAMETER TYPE */
        <>
          {/* 1. STRING / TEXTAREA */}
          {param.type === 'string' && (
            param.typeOptions?.rows ? (
              <textarea
                ref={inputRef as any}
                rows={param.typeOptions.rows}
                value={value ?? ''}
                placeholder={param.placeholder}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none resize-y transition-colors border ${
                  isDark
                    ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5] placeholder:text-[#52525b] focus:border-[#EA580C]'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#EA580C] shadow-2xs'
                }`}
              />
            ) : (
              <div className="relative">
                <input
                  ref={inputRef as any}
                  type="text"
                  value={value ?? ''}
                  placeholder={param.placeholder}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-colors border ${
                    isDark
                      ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5] placeholder:text-[#52525b] focus:border-[#EA580C]'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#EA580C] shadow-2xs'
                  }`}
                />
              </div>
            )
          )}

          {/* 2. NUMBER */}
          {param.type === 'number' && (
            <input
              type="number"
              min={param.typeOptions?.minValue}
              max={param.typeOptions?.maxValue}
              step={param.typeOptions?.step || 1}
              value={value ?? 0}
              onChange={(e) => onChangeValue(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none font-mono transition-colors border ${
                isDark
                  ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5] focus:border-[#EA580C]'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-[#EA580C] shadow-2xs'
              }`}
            />
          )}

          {/* 3. BOOLEAN SWITCH */}
          {param.type === 'boolean' && (
            <label className="flex items-center gap-3 cursor-pointer pt-1 select-none">
              <div
                onClick={() => onChangeValue(!value)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  value ? 'bg-[#EA580C]' : isDark ? 'bg-neutral-800' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                {value ? 'True' : 'False'}
              </span>
            </label>
          )}

          {/* 4. OPTIONS / SELECT */}
          {(param.type === 'options' || param.type === 'select') && (
            <select
              value={value ?? param.default}
              onChange={(e) => onChangeValue(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none cursor-pointer transition-colors border ${
                isDark
                  ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5] focus:border-[#EA580C]'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-[#EA580C] shadow-2xs'
              }`}
            >
              {(param.options || []).map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label} {opt.description ? `— ${opt.description}` : ''}
                </option>
              ))}
            </select>
          )}

          {/* 5. MULTI-OPTIONS */}
          {param.type === 'multiOptions' && (
            <div className="space-y-1.5">
              <div className={`flex flex-wrap gap-1 min-h-[34px] p-1.5 rounded-lg border ${
                isDark ? 'bg-[#121215] border-[#27272b]' : 'bg-white border-slate-300'
              }`}>
                {(Array.isArray(value) ? value : []).map((itemVal: any) => {
                  const opt = param.options?.find((o) => o.value === itemVal);
                  return (
                    <span
                      key={itemVal}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                        isDark ? 'bg-[#27272e] text-neutral-200' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {opt?.label || itemVal}
                      <button
                        type="button"
                        onClick={() => {
                          const next = (value || []).filter((v: any) => v !== itemVal);
                          onChangeValue(next);
                        }}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const current = Array.isArray(value) ? value : [];
                    if (!current.includes(e.target.value)) {
                      onChangeValue([...current, e.target.value]);
                    }
                  }
                }}
                className={`w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer border ${
                  isDark ? 'bg-[#121215] border-[#27272b] text-[#a1a1aa]' : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                <option value="">+ Add Option...</option>
                {(param.options || []).map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 6. DATE TIME */}
          {param.type === 'dateTime' && (
            <div className="space-y-1.5">
              <input
                type="datetime-local"
                value={value ?? ''}
                onChange={(e) => onChangeValue(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5]'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              />
              <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                <span>Presets:</span>
                <button
                  type="button"
                  onClick={() => onChangeValue(new Date().toISOString().slice(0, 16))}
                  className="hover:underline text-[#EA580C] cursor-pointer"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    onChangeValue(d.toISOString().slice(0, 16));
                  }}
                  className="hover:underline text-[#EA580C] cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>
            </div>
          )}

          {/* 7. COLOR */}
          {param.type === 'color' && (
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={value || '#EA580C'}
                onChange={(e) => onChangeValue(e.target.value)}
                className={`w-8 h-8 rounded border bg-transparent cursor-pointer ${
                  isDark ? 'border-neutral-800' : 'border-slate-300'
                }`}
              />
              <input
                type="text"
                value={value || '#EA580C'}
                onChange={(e) => onChangeValue(e.target.value)}
                className={`w-28 px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase border ${
                  isDark
                    ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5]'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          {/* 8. SECRET PASSWORD */}
          {param.type === 'secret' && (
            <div className="space-y-1.5">
              <input
                type={showSecret ? 'text' : 'password'}
                value={value ?? ''}
                placeholder={param.placeholder || 'Secret key'}
                onChange={(e) => onChangeValue(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none border ${
                  isDark
                    ? 'bg-[#121215] border-[#27272b] text-[#f4f4f5] placeholder:text-[#52525b] focus:border-[#EA580C]'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#EA580C] shadow-2xs'
                }`}
              />
              {vaultCredentials && vaultCredentials.length > 0 && (
                <div className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  <Database className="w-3 h-3 text-[#EA580C]" />
                  <span>Use Vault Credential:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onChangeValue(e.target.value);
                      }
                    }}
                    className={`rounded px-1.5 py-0.5 text-[11px] border cursor-pointer ${
                      isDark
                        ? 'bg-[#18181c] border-[#27272b] text-[#f4f4f5]'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Choose Vault Item --</option>
                    {vaultCredentials.map((c) => (
                      <option key={c.id} value={`vault:${c.id}`}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 9. CODE & JSON EDITORS */}
          {(param.type === 'code' || param.type === 'json') && (
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-[#EA580C]" />
                  {param.typeOptions?.language?.toUpperCase() || (param.type === 'code' ? 'CODE' : 'JSON')}
                </span>
                {param.type === 'json' && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = typeof value === 'object' ? value : JSON.parse(value || '{}');
                        onChangeValue(JSON.stringify(parsed, null, 2));
                      } catch (e) {}
                    }}
                    className="text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" /> Format JSON
                  </button>
                )}
              </div>
              <textarea
                rows={param.typeOptions?.rows || (param.type === 'code' ? 8 : 6)}
                value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value ?? '')}
                onChange={(e) => onChangeValue(e.target.value)}
                className={`w-full p-2.5 rounded-lg font-mono text-xs focus:outline-none leading-relaxed border ${
                  isDark
                    ? 'bg-[#121215] border-[#27272b] text-emerald-400 focus:border-[#EA580C]'
                    : 'bg-slate-900 border-slate-800 text-emerald-300 focus:border-[#EA580C]'
                }`}
                spellCheck={false}
              />
            </div>
          )}

          {/* 10. FIXED COLLECTION / COLLECTION (Key-Value Dynamic Rows) */}
          {(param.type === 'fixedCollection' || param.type === 'collection' || param.type === 'headers') && (
            <div className={`space-y-2 p-3 rounded-xl border ${
              isDark ? 'bg-[#141418] border-[#26262b]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {param.label} ({(Array.isArray(value) ? value : []).length} items)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? [...value] : [];
                    const newItem: Record<string, any> = {};
                    if (param.collectionFields && param.collectionFields.length > 0) {
                      param.collectionFields.forEach((f) => {
                        newItem[f.name] = f.default || '';
                      });
                    } else {
                      newItem['name'] = '';
                      newItem['value'] = '';
                    }
                    onChangeValue([...current, newItem]);
                  }}
                  className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border cursor-pointer ${
                    isDark
                      ? 'bg-[#1e1e24] border-[#2e2e36] text-neutral-200 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Plus className="w-3 h-3 text-[#EA580C]" /> Add Item
                </button>
              </div>

              {/* Items List */}
              {Array.isArray(value) && value.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {value.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                        isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      {param.collectionFields && param.collectionFields.length > 0 ? (
                        param.collectionFields.map((field) => (
                          <input
                            key={field.name}
                            type="text"
                            placeholder={field.label}
                            value={item[field.name] ?? ''}
                            onChange={(e) => {
                              const updated = [...value];
                              updated[idx] = { ...updated[idx], [field.name]: e.target.value };
                              onChangeValue(updated);
                            }}
                            className={`flex-1 px-2.5 py-1 rounded text-xs focus:outline-none border ${
                              isDark
                                ? 'bg-[#121215] border-[#27272b] text-neutral-200 focus:border-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#EA580C]'
                            }`}
                          />
                        ))
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Key"
                            value={item.name ?? item.key ?? ''}
                            onChange={(e) => {
                              const updated = [...value];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              onChangeValue(updated);
                            }}
                            className={`w-1/3 px-2.5 py-1 rounded text-xs focus:outline-none border ${
                              isDark
                                ? 'bg-[#121215] border-[#27272b] text-neutral-200 focus:border-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#EA580C]'
                            }`}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={item.value ?? ''}
                            onChange={(e) => {
                              const updated = [...value];
                              updated[idx] = { ...updated[idx], value: e.target.value };
                              onChangeValue(updated);
                            }}
                            className={`flex-1 px-2.5 py-1 rounded text-xs focus:outline-none border ${
                              isDark
                                ? 'bg-[#121215] border-[#27272b] text-neutral-200 focus:border-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#EA580C]'
                            }`}
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = value.filter((_: any, i: number) => i !== idx);
                          onChangeValue(updated);
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-[11px] italic py-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  No items configured. Click &apos;Add Item&apos; to add one.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
