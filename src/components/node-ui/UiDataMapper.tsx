import React, { useState } from 'react';
import {
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Code2,
  FileCode2,
  Table
} from 'lucide-react';
import { WorkflowNode, NodeParameterSchema } from '../../types';

interface Props {
  currentNode: WorkflowNode;
  allNodes: WorkflowNode[];
  upstreamNodes: WorkflowNode[];
  inputData: any;
  parametersSchema: NodeParameterSchema[];
  onSelectField: (expression: string, targetParamName?: string) => void;
  onClose?: () => void;
}

export const UiDataMapper: React.FC<Props> = ({
  currentNode,
  allNodes,
  upstreamNodes,
  inputData,
  parametersSchema,
  onSelectField,
  onClose
}) => {
  const [selectedSourceNodeId, setSelectedSourceNodeId] = useState<string>('current_input');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [targetParam, setTargetParam] = useState<string>(
    parametersSchema.find((p) => p.supportsExpression !== false && p.type !== 'notice')?.name || ''
  );

  // Available source nodes for data mapping
  const sourceOptions = [
    { id: 'current_input', name: 'Input Data ($json)', subtitle: 'Direct preceding node output' },
    ...upstreamNodes.map((n) => ({
      id: n.id,
      name: n.name,
      subtitle: `Node: $('${n.name}')`
    }))
  ];

  // Resolve data based on selected source node
  const activeSourceNode = allNodes.find((n) => n.id === selectedSourceNodeId);
  const activeData =
    selectedSourceNodeId === 'current_input'
      ? inputData
      : activeSourceNode?.pinnedData || activeSourceNode?.parameters || {
          status: 'success',
          data: 'Sample node output',
          timestamp: new Date().toISOString()
        };

  // Flatten active data into schema items for mapping
  const schemaItems = React.useMemo(() => {
    const items: Array<{
      path: string;
      key: string;
      value: any;
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      expression: string;
    }> = [];

    const traverse = (obj: any, prefix = '') => {
      if (obj === null || obj === undefined) return;
      if (typeof obj !== 'object') {
        const key = prefix.split('.').pop() || prefix;
        const expr =
          selectedSourceNodeId === 'current_input'
            ? `{{ $json.${prefix} }}`
            : `{{ $('${activeSourceNode?.name || 'Node'}').first().json.${prefix} }}`;
        items.push({
          path: prefix,
          key,
          value: obj,
          type: typeof obj as any,
          expression: expr
        });
        return;
      }

      if (Array.isArray(obj)) {
        const expr =
          selectedSourceNodeId === 'current_input'
            ? `{{ $json.${prefix} }}`
            : `{{ $('${activeSourceNode?.name || 'Node'}').first().json.${prefix} }}`;
        items.push({
          path: prefix,
          key: prefix.split('.').pop() || prefix,
          value: `[Array(${obj.length})]`,
          type: 'array',
          expression: expr
        });
        if (obj.length > 0 && typeof obj[0] === 'object') {
          traverse(obj[0], prefix ? `${prefix}[0]` : '[0]');
        }
        return;
      }

      Object.entries(obj).forEach(([k, v]) => {
        const currentPath = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          const expr =
            selectedSourceNodeId === 'current_input'
              ? `{{ $json.${currentPath} }}`
              : `{{ $('${activeSourceNode?.name || 'Node'}').first().json.${currentPath} }}`;
          items.push({
            path: currentPath,
            key: k,
            value: '{Object}',
            type: 'object',
            expression: expr
          });
          traverse(v, currentPath);
        } else if (Array.isArray(v)) {
          const expr =
            selectedSourceNodeId === 'current_input'
              ? `{{ $json.${currentPath} }}`
              : `{{ $('${activeSourceNode?.name || 'Node'}').first().json.${currentPath} }}`;
          items.push({
            path: currentPath,
            key: k,
            value: `[Array(${v.length})]`,
            type: 'array',
            expression: expr
          });
          if (v.length > 0) {
            traverse(v[0], `${currentPath}[0]`);
          }
        } else {
          const expr =
            selectedSourceNodeId === 'current_input'
              ? `{{ $json.${currentPath} }}`
              : `{{ $('${activeSourceNode?.name || 'Node'}').first().json.${currentPath} }}`;
          items.push({
            path: currentPath,
            key: k,
            value: v,
            type: typeof v as any,
            expression: expr
          });
        }
      });
    };

    traverse(activeData);
    return items;
  }, [activeData, selectedSourceNodeId, activeSourceNode?.name]);

  const filteredItems = schemaItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.path.toLowerCase().includes(q) || String(item.value).toLowerCase().includes(q);
  });

  const handleCopy = (expr: string, path: string) => {
    navigator.clipboard.writeText(expr);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleApplyToParam = (expr: string) => {
    onSelectField(expr, targetParam);
  };

  return (
    <div
      id="n8n-ui-mapper-container"
      className="flex flex-col h-full bg-[#111114] border-r border-[#26262b] text-neutral-200 select-none overflow-hidden"
    >
      {/* Header */}
      <div className="h-11 px-4 border-b border-[#26262b] flex items-center justify-between bg-[#16161a] shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#EA580C]" />
          <span className="text-xs font-bold text-neutral-200 tracking-wide uppercase">UI Data Mapper</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono">
            {filteredItems.length} fields
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target Parameter Selector bar */}
      <div className="p-3 border-b border-[#26262b] bg-[#141417] space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400 font-medium">Map into parameter:</span>
          <span className="text-[10px] text-[#EA580C]">Click any field below to bind</span>
        </div>
        <select
          value={targetParam}
          onChange={(e) => setTargetParam(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none"
        >
          {parametersSchema
            .filter((p) => p.supportsExpression !== false && p.type !== 'notice')
            .map((p) => (
              <option key={p.name} value={p.name}>
                {p.label} ({p.name})
              </option>
            ))}
        </select>
      </div>

      {/* Source Node Selector & Search */}
      <div className="p-3 border-b border-[#26262b] bg-[#121215] space-y-2 shrink-0">
        <div className="text-[11px] text-neutral-400 font-medium">Source Node Data:</div>
        <select
          value={selectedSourceNodeId}
          onChange={(e) => setSelectedSourceNodeId(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none font-medium"
        >
          {sourceOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search schema keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-[#EA580C] focus:outline-none"
          />
        </div>
      </div>

      {/* Schema Property List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="text-[10px] text-neutral-500 mb-1 flex items-center justify-between">
          <span>DRAG OR CLICK TO MAP</span>
          <span>TYPE</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 italic">
            No matching schema fields found.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCopied = copiedPath === item.path;
            const typeColor =
              item.type === 'string'
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                : item.type === 'number'
                ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                : item.type === 'boolean'
                ? 'text-purple-400 bg-purple-950/40 border-purple-800/40'
                : item.type === 'array'
                ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                : 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40';

            return (
              <div
                key={item.path}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.expression);
                  e.dataTransfer.setData('application/json-expression', item.expression);
                }}
                className="group p-2 rounded-lg bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-[#EA580C]/60 transition-all cursor-grab active:cursor-grabbing flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-neutral-200 truncate group-hover:text-[#f97316] transition-colors">
                      {item.key}
                    </span>
                    {item.path !== item.key && (
                      <span className="text-[10px] text-neutral-500 truncate">
                        ({item.path})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${typeColor}`}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="truncate flex-1 opacity-80">
                    {typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.expression, item.path)}
                      title={`Copy: ${item.expression}`}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] flex items-center gap-0.5"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyToParam(item.expression)}
                      title={`Insert into [${targetParam || 'parameter'}]`}
                      className="px-2 py-0.5 rounded bg-[#EA580C] hover:bg-[#c2410c] text-white text-[10px] font-medium flex items-center gap-1 shadow-sm"
                    >
                      <span>Map</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#26262b] bg-[#141418] text-[10px] text-neutral-400 flex items-center justify-between shrink-0">
        <span className="italic">Drag pill into any input box or click Map</span>
        <span className="font-mono text-neutral-500">n8n Schema v2</span>
      </div>
    </div>
  );
};
