import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorkflowNode as IWorkflowNode, VaultCredential } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  Database,
  KeyRound,
  Clock,
  Code2,
  ChevronRight,
  Search,
  X,
  Check,
  Star,
  History
} from 'lucide-react';

export interface VariableItem {
  key: string;
  syntax: string;
  category: 'recent' | 'input' | 'upstream' | 'system' | 'vault';
  sourceName: string;
  previewValue?: string;
  dataType?: string;
}

interface Props {
  isOpen: boolean;
  query?: string;
  inputData: any;
  upstreamNodes?: IWorkflowNode[];
  vaultCredentials?: VaultCredential[];
  allNodes?: IWorkflowNode[];
  onSelect: (syntax: string) => void;
  onClose: () => void;
  positionClass?: string;
}

export function recordRecentVariable(syntax: string) {
  try {
    const raw = localStorage.getItem('nodeflow_recent_variables');
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = [syntax, ...list.filter((s) => s !== syntax)].slice(0, 15);
    localStorage.setItem('nodeflow_recent_variables', JSON.stringify(filtered));
  } catch (e) {}
}

/** Recursively extracts JSON path keys from a payload */
function extractObjectPaths(obj: any, prefix = '$json', maxDepth = 4, currentDepth = 0): VariableItem[] {
  if (!obj || currentDepth > maxDepth) return [];
  const items: VariableItem[] = [];

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object') {
      return extractObjectPaths(obj[0], `${prefix}[0]`, maxDepth, currentDepth + 1);
    }
    return [{
      key: prefix,
      syntax: `{{ ${prefix} }}`,
      category: 'input',
      sourceName: 'Input Array',
      previewValue: `Array(${obj.length})`,
      dataType: 'array'
    }];
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const path = prefix ? `${prefix}.${key}` : `$json.${key}`;
      const valType = typeof val;

      if (val === null) {
        items.push({
          key: path,
          syntax: `{{ ${path} }}`,
          category: 'input',
          sourceName: 'Input Item',
          previewValue: 'null',
          dataType: 'null'
        });
      } else if (valType === 'object') {
        items.push({
          key: path,
          syntax: `{{ ${path} }}`,
          category: 'input',
          sourceName: 'Input Item',
          previewValue: Array.isArray(val) ? `[Array of ${val.length}]` : '{...}',
          dataType: Array.isArray(val) ? 'array' : 'object'
        });
        if (currentDepth < maxDepth) {
          items.push(...extractObjectPaths(val, path, maxDepth, currentDepth + 1));
        }
      } else {
        items.push({
          key: path,
          syntax: `{{ ${path} }}`,
          category: 'input',
          sourceName: 'Input Item',
          previewValue: String(val).length > 25 ? `${String(val).slice(0, 25)}...` : String(val),
          dataType: valType
        });
      }
    }
  }

  return items;
}

/** Extracts previously used variables and expressions across all workflow nodes and history */
function extractPreviouslyUsedVariables(allNodes: IWorkflowNode[] = []): VariableItem[] {
  const map = new Map<string, VariableItem>();

  // 1. Stored recent variables in localStorage
  try {
    const raw = localStorage.getItem('nodeflow_recent_variables');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((syntax) => {
          if (typeof syntax === 'string' && syntax.trim()) {
            const key = syntax.replace(/^\{\{\s*|\s*\}\}$/g, '').trim();
            map.set(syntax, {
              key,
              syntax,
              category: 'recent',
              sourceName: 'Recently Used',
              previewValue: 'Previous mapping',
              dataType: 'variable'
            });
          }
        });
      }
    }
  } catch (e) {}

  // 2. Scan parameter values across all workflow nodes for previously mapped expressions
  allNodes.forEach((node) => {
    if (!node.parameters) return;
    Object.entries(node.parameters).forEach(([paramName, val]) => {
      if (typeof val === 'string') {
        const matches = val.match(/\{\{\s*([^}]+)\s*\}\}/g);
        if (matches) {
          matches.forEach((matchedSyntax) => {
            const inner = matchedSyntax.replace(/^\{\{\s*|\s*\}\}$/g, '').trim();
            if (!map.has(matchedSyntax)) {
              map.set(matchedSyntax, {
                key: inner,
                syntax: matchedSyntax,
                category: 'recent',
                sourceName: `${node.name} • ${paramName}`,
                previewValue: 'Workflow variable',
                dataType: 'variable'
              });
            }
          });
        }
      }
    });
  });

  return Array.from(map.values());
}

export const VariableSuggestionDropdown: React.FC<Props> = ({
  isOpen,
  query = '',
  inputData,
  upstreamNodes = [],
  vaultCredentials = [],
  allNodes = [],
  onSelect,
  onClose,
  positionClass = 'top-full left-0 mt-1'
}) => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'all' | 'recent' | 'input' | 'upstream' | 'system' | 'vault'>('all');
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync search state with incoming query when dropdown opens or query changes
  useEffect(() => {
    if (query) {
      // Clean query token (remove leading {{ or $)
      const clean = query.replace(/^(\{\{|\$)/, '').trim();
      setSearch(clean);
    } else {
      setSearch('');
    }
  }, [query, isOpen]);

  // Extract all available variables
  const allVariables = useMemo(() => {
    const list: VariableItem[] = [];

    // 1. Previously used variables (across workflow & history)
    const prevUsed = extractPreviouslyUsedVariables(allNodes);
    list.push(...prevUsed);

    // 2. Upstream Input Data keys
    if (inputData) {
      const dataToInspect = Array.isArray(inputData) && inputData.length > 0
        ? (inputData[0]?.json || inputData[0])
        : (inputData?.json || inputData);
      list.push(...extractObjectPaths(dataToInspect));
    }

    // Default sample fallback if no active input data loaded yet
    if (list.length === 0) {
      list.push(
        { key: '$json.id', syntax: '{{ $json.id }}', category: 'input', sourceName: 'Input Item', previewValue: '101', dataType: 'number' },
        { key: '$json.name', syntax: '{{ $json.name }}', category: 'input', sourceName: 'Input Item', previewValue: '"Alex Mercer"', dataType: 'string' },
        { key: '$json.email', syntax: '{{ $json.email }}', category: 'input', sourceName: 'Input Item', previewValue: '"alex@example.com"', dataType: 'string' },
        { key: '$json.payload', syntax: '{{ $json.payload }}', category: 'input', sourceName: 'Input Item', previewValue: '{...}', dataType: 'object' }
      );
    }

    // 3. Upstream Named Nodes
    upstreamNodes.forEach((node) => {
      const nodeName = node.name || node.type;
      list.push({
        key: `$node["${nodeName}"].json`,
        syntax: `{{ $node["${nodeName}"].json }}`,
        category: 'upstream',
        sourceName: nodeName,
        previewValue: 'Node Output Item',
        dataType: 'object'
      });
      list.push({
        key: `$node["${nodeName}"].json.id`,
        syntax: `{{ $node["${nodeName}"].json.id }}`,
        category: 'upstream',
        sourceName: nodeName,
        previewValue: '101',
        dataType: 'number'
      });
      list.push({
        key: `$node["${nodeName}"].json.name`,
        syntax: `{{ $node["${nodeName}"].json.name }}`,
        category: 'upstream',
        sourceName: nodeName,
        previewValue: '"Result"',
        dataType: 'string'
      });
    });

    // 4. System Variables
    list.push(
      { key: '$now', syntax: '{{ $now }}', category: 'system', sourceName: 'System Context', previewValue: new Date().toISOString(), dataType: 'date' },
      { key: '$today', syntax: '{{ $today }}', category: 'system', sourceName: 'System Context', previewValue: new Date().toISOString().slice(0, 10), dataType: 'date' },
      { key: '$execution.id', syntax: '{{ $execution.id }}', category: 'system', sourceName: 'Execution', previewValue: 'exec_83921', dataType: 'string' },
      { key: '$workflow.id', syntax: '{{ $workflow.id }}', category: 'system', sourceName: 'Workflow', previewValue: 'wf_prod_99', dataType: 'string' },
      { key: '$workflow.name', syntax: '{{ $workflow.name }}', category: 'system', sourceName: 'Workflow', previewValue: '"Customer Sync"', dataType: 'string' },
      { key: '$env.NODE_ENV', syntax: '{{ $env.NODE_ENV }}', category: 'system', sourceName: 'Environment', previewValue: '"production"', dataType: 'string' }
    );

    // 5. Vault Credentials
    vaultCredentials.forEach((cred) => {
      list.push({
        key: `$vault.${cred.name}`,
        syntax: `{{ $vault.${cred.name} }}`,
        category: 'vault',
        sourceName: 'Encrypted Vault',
        previewValue: '••••••••',
        dataType: 'secret'
      });
    });

    return list;
  }, [inputData, upstreamNodes, vaultCredentials, allNodes]);

  // Filtered variables
  const filteredVariables = useMemo(() => {
    return allVariables.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const lowerSearch = search.toLowerCase();
      return (
        item.key.toLowerCase().includes(lowerSearch) ||
        item.syntax.toLowerCase().includes(lowerSearch) ||
        item.sourceName.toLowerCase().includes(lowerSearch)
      );
    });
  }, [allVariables, activeCategory, search]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVariables.length, activeCategory]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredVariables.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % Math.max(1, filteredVariables.length));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredVariables[selectedIndex]) {
          e.preventDefault();
          onSelect(filteredVariables[selectedIndex].syntax);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredVariables, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      id="variable-suggestion-dropdown"
      className={`absolute z-50 w-80 md:w-96 rounded-xl border shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ${positionClass} ${
        isDark
          ? 'bg-[#18181c] border-[#2e2e36] text-[#f4f4f5]'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
      style={{ maxHeight: '340px' }}
    >
      {/* Header with Search & Filter */}
      <div className={`p-2.5 border-b flex flex-col gap-2 ${isDark ? 'border-[#27272e] bg-[#141417]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#EA580C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Map Variables & Outputs</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-[#27272e] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
          isDark
            ? 'bg-[#1e1e24] border-[#2e2e36] text-[#f4f4f5]'
            : 'bg-white border-slate-300 text-slate-900'
        }`}>
          <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter key, e.g. email, user, id..."
            autoFocus
            className="w-full bg-transparent border-none focus:outline-none text-xs placeholder:text-neutral-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Categories / Sources Pill Switcher */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5">
          {(['all', 'recent', 'input', 'upstream', 'system', 'vault'] as const).map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'all' ? 'All' : cat === 'recent' ? '⭐ Previously Used' : cat === 'input' ? 'Inputs' : cat === 'upstream' ? 'Nodes' : cat === 'system' ? 'System' : 'Vault';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EA580C] text-white font-semibold'
                    : isDark
                    ? 'bg-[#202026] text-[#a1a1aa] hover:text-white hover:bg-[#282830]'
                    : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-1.5 divide-y divide-transparent">
        {filteredVariables.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No variables match &quot;{search}&quot;
          </div>
        ) : (
          filteredVariables.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.syntax + index}
                type="button"
                onClick={() => {
                  recordRecentVariable(item.syntax);
                  onSelect(item.syntax);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#EA580C]/20 border border-[#EA580C]/40 text-white'
                      : 'bg-[#EA580C]/10 border border-[#EA580C]/30 text-slate-900'
                    : isDark
                    ? 'hover:bg-[#202026] text-[#d4d4d8] border border-transparent'
                    : 'hover:bg-slate-100 text-slate-800 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.category === 'recent' && <Star className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400/20" />}
                    {item.category === 'input' && <Database className="w-3 h-3 text-sky-400 shrink-0" />}
                    {item.category === 'upstream' && <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {item.category === 'system' && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                    {item.category === 'vault' && <KeyRound className="w-3 h-3 text-rose-400 shrink-0" />}
                    <span className="font-mono text-xs font-semibold truncate text-[#EA580C]">
                      {item.syntax}
                    </span>
                    {item.category === 'recent' && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Previously Used
                      </span>
                    )}
                    {item.dataType && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                        isDark ? 'bg-[#27272e] text-[#a1a1aa]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.dataType}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                    <span className={isDark ? 'text-[#71717a]' : 'text-slate-500'}>
                      {item.sourceName}
                    </span>
                    {item.previewValue && (
                      <span className={`font-mono truncate ${isDark ? 'text-[#a1a1aa]' : 'text-slate-700'}`}>
                        = {item.previewValue}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="text-[10px] text-[#EA580C] font-semibold shrink-0 flex items-center gap-0.5">
                    <span>Insert</span>
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer Navigation Tip */}
      <div className={`px-2.5 py-1.5 border-t text-[10px] flex items-center justify-between ${
        isDark ? 'border-[#27272e] bg-[#121215] text-[#71717a]' : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}>
        <span>↑↓ navigate • Enter to insert • Esc to close</span>
        <span className="font-mono">{filteredVariables.length} available</span>
      </div>
    </div>
  );
};
