import React, { useState, useMemo } from 'react';
import {
  WorkflowNode as IWorkflowNode,
  NodeDefinition,
  SingleNodeExecution,
  VaultCredential,
  WorkflowConnection,
  NodeParameterSchema
} from '../types';
import { NodeParameterField } from './node-ui/NodeParameterField';
import { UiDataMapper } from './node-ui/UiDataMapper';
import { NodeDocumentationView } from './node-ui/NodeDocumentationView';
import { testNodeExecution } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  Play,
  Copy,
  Check,
  Code2,
  Database,
  Pin,
  Search,
  Table,
  FileCode2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Send,
  HelpCircle,
  ExternalLink,
  Layers,
  BookOpen
} from 'lucide-react';

interface Props {
  node: IWorkflowNode | null;
  definition?: NodeDefinition;
  workflowId: string;
  executionState?: SingleNodeExecution;
  vaultCredentials: VaultCredential[];
  allNodes?: IWorkflowNode[];
  connections?: WorkflowConnection[];
  onClose: () => void;
  onUpdateNode: (updated: IWorkflowNode) => void;
}

export const NodeDrawer: React.FC<Props> = ({
  node,
  definition,
  workflowId,
  executionState,
  vaultCredentials,
  allNodes = [],
  connections = [],
  onClose,
  onUpdateNode
}) => {
  const { isDark } = useTheme();
  const [activePane, setActivePane] = useState<'all' | 'params' | 'input' | 'output' | 'docs'>('all');
  const [activeParamTab, setActiveParamTab] = useState<'params' | 'mapper' | 'docs'>('params');
  const [inputViewMode, setInputViewMode] = useState<'json' | 'table' | 'schema'>('json');
  const [outputViewMode, setOutputViewMode] = useState<'json' | 'table'>('json');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [inputSearch, setInputSearch] = useState('');
  const [outputSearch, setOutputSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isEditingInput, setIsEditingInput] = useState(false);

  // Compute upstream nodes connected into this node
  const upstreamNodes = useMemo(() => {
    if (!node) return [];
    const incomingConnections = connections.filter((c) => c.targetNodeId === node.id);
    const sourceIds = new Set(incomingConnections.map((c) => c.sourceNodeId));
    return allNodes.filter((n) => sourceIds.has(n.id));
  }, [node, connections, allNodes]);

  // Custom editable test input data
  const defaultSampleInput = useMemo(() => {
    return (
      node?.pinnedData ||
      executionState?.inputData || {
        event: 'order_completed',
        id: 1042,
        user: {
          id: 'usr_8821',
          name: 'Alex Mercer',
          email: 'alex.mercer@example.com',
          role: 'admin'
        },
        items: [
          { sku: 'PRO-100', name: 'Enterprise Plan', price: 299 },
          { sku: 'ADD-50', name: 'Dedicated Server Addon', price: 99 }
        ],
        status: 'approved',
        timestamp: new Date().toISOString()
      }
    );
  }, [node?.pinnedData, executionState?.inputData]);

  const [customInputText, setCustomInputText] = useState(() =>
    JSON.stringify(defaultSampleInput, null, 2)
  );

  if (!node || !definition) return null;

  const webhookUrl = `${window.location.origin}/api/webhooks/${workflowId}/${node.id}`;

  const currentInput = (() => {
    try {
      return JSON.parse(customInputText);
    } catch (e) {
      return defaultSampleInput;
    }
  })();

  const currentOutput = testResult ? (testResult.outputData ?? testResult) : executionState?.outputData;

  // Handle parameter value change
  const handleParamChange = (name: string, val: any) => {
    onUpdateNode({
      ...node,
      parameters: {
        ...node.parameters,
        [name]: val
      }
    });
  };

  // Handle parameter mode change (fixed vs expression)
  const handleModeChange = (name: string, mode: 'fixed' | 'expression') => {
    onUpdateNode({
      ...node,
      parameterModes: {
        ...(node.parameterModes || {}),
        [name]: mode
      }
    });
  };

  // Apply full configuration from documentation example
  const handleApplyExampleConfig = (config: Record<string, any>) => {
    onUpdateNode({
      ...node,
      parameters: {
        ...node.parameters,
        ...config
      }
    });
  };

  // Run isolated step execution test
  const handleTestStep = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(customInputText);
      } catch (e) {
        parsed = { rawText: customInputText };
      }
      const res = await testNodeExecution(node, parsed);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        error: err.message,
        logs: [err.message]
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Toggle Pinned Data
  const handleTogglePinData = () => {
    if (node.pinnedData) {
      onUpdateNode({ ...node, pinnedData: undefined });
    } else {
      onUpdateNode({ ...node, pinnedData: currentInput });
    }
  };

  // Copy expression to clipboard helper
  const handleCopyExpression = (path: string) => {
    const expr = `{{ $json.${path} }}`;
    navigator.clipboard.writeText(expr);
    setCopiedToken(path);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Check displayOptions visibility rules
  const isParamVisible = (param: NodeParameterSchema) => {
    if (!param.displayOptions) return true;
    const currentParams = node.parameters || {};

    if (param.displayOptions.show) {
      for (const [field, allowedValues] of Object.entries(param.displayOptions.show)) {
        const val = currentParams[field] ?? definition.defaultParameters?.[field];
        if (!allowedValues.includes(val)) {
          return false;
        }
      }
    }

    if (param.displayOptions.hide) {
      for (const [field, deniedValues] of Object.entries(param.displayOptions.hide)) {
        const val = currentParams[field] ?? definition.defaultParameters?.[field];
        if (deniedValues.includes(val)) {
          return false;
        }
      }
    }

    return true;
  };

  const handleSelectMapperField = (expression: string, targetParamName?: string) => {
    if (targetParamName) {
      handleParamChange(targetParamName, expression);
      handleModeChange(targetParamName, 'expression');
    }
    setActiveParamTab('params');
  };

  return (
    <div
      id="node-drawer-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="node-drawer-modal"
        className={`w-full max-w-[96vw] h-[92vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-[#141416] border-[#222226] text-[#f4f4f5]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* ========================================================= */}
        {/* TOP BAR: Node Details & Actions                           */}
        {/* ========================================================= */}
        <div className={`h-14 px-5 border-b flex items-center justify-between gap-4 shrink-0 select-none ${
          isDark ? 'border-[#26262b] bg-[#18181c]' : 'border-slate-200 bg-slate-50'
        }`}>
          {/* Node Icon & Editable Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{
                backgroundColor: `${definition.color || '#EA580C'}20`,
                color: definition.color || '#EA580C'
              }}
            >
              <Database className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <input
                id="input-node-name"
                type="text"
                value={node.name}
                onChange={(e) => onUpdateNode({ ...node, name: e.target.value })}
                className={`border border-transparent rounded px-2 py-1 text-sm font-bold focus:outline-none transition-colors max-w-[240px] sm:max-w-xs truncate ${
                  isDark
                    ? 'bg-transparent hover:bg-neutral-800/60 focus:bg-neutral-900 hover:border-neutral-700 focus:border-[#EA580C] text-white'
                    : 'bg-transparent hover:bg-slate-200/60 focus:bg-white hover:border-slate-300 focus:border-[#EA580C] text-slate-900'
                }`}
              />
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {definition.type}
              </span>
            </div>
          </div>

          {/* Center Pane Controls for Responsive screens */}
          <div className={`hidden lg:flex items-center p-1 rounded-lg text-xs border ${
            isDark ? 'bg-[#101012] border-[#26262b]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setActivePane('all')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'all'
                  ? isDark ? 'bg-[#26262b] text-white font-medium' : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3-Column View
            </button>
            <button
              type="button"
              onClick={() => setActivePane('input')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'input'
                  ? isDark ? 'bg-[#26262b] text-white font-medium' : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input
            </button>
            <button
              type="button"
              onClick={() => setActivePane('params')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'params'
                  ? isDark ? 'bg-[#26262b] text-white font-medium' : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parameters
            </button>
            <button
              type="button"
              onClick={() => setActivePane('output')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'output'
                  ? isDark ? 'bg-[#26262b] text-white font-medium' : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Output
            </button>
            <button
              id="btn-pane-docs"
              type="button"
              onClick={() => setActivePane('docs')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activePane === 'docs'
                  ? 'bg-[#EA580C] text-white font-semibold shadow-xs'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active / Disabled Switch */}
            <button
              id="btn-toggle-active"
              type="button"
              onClick={() => onUpdateNode({ ...node, disabled: !node.disabled })}
              title={node.disabled ? 'Enable Node' : 'Disable Node'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                node.disabled
                  ? isDark ? 'border-neutral-700 bg-neutral-800 text-neutral-400' : 'border-slate-300 bg-slate-100 text-slate-500'
                  : 'border-emerald-700/60 bg-emerald-950/30 text-emerald-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${node.disabled ? 'bg-neutral-500' : 'bg-emerald-400'}`} />
              <span className="font-medium">{node.disabled ? 'Disabled' : 'Active'}</span>
            </button>

            {/* Pin Data Button */}
            <button
              id="btn-pin-data"
              type="button"
              onClick={handleTogglePinData}
              title={node.pinnedData ? 'Unpin Data' : 'Pin Data (Freeze test dataset)'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                node.pinnedData
                  ? 'border-[#EA580C] bg-[#EA580C]/20 text-[#EA580C]'
                  : isDark ? 'border-[#26262b] bg-[#1a1a1e] text-neutral-400 hover:text-white' : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <Pin className="w-4 h-4" />
            </button>

            {/* Execute / Test Step Button */}
            <button
              id="btn-test-step"
              type="button"
              onClick={handleTestStep}
              disabled={isTesting}
              className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test step</span>
                </>
              )}
            </button>

            {/* Close Drawer Button */}
            <button
              id="btn-close-node-drawer"
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: 3 COLUMNS OR FULL DOCUMENTATION VIEW           */}
        {/* ========================================================= */}
        {activePane === 'docs' ? (
          <div className="flex-1 overflow-hidden">
            <NodeDocumentationView
              node={node}
              definition={definition}
              onApplyExampleConfig={handleApplyExampleConfig}
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* ------------------------------------------------------- */}
            {/* PANE 1: INPUT DATA (Left Column)                        */}
            {/* ------------------------------------------------------- */}
            {(activePane === 'all' || activePane === 'input') && (
              <div className={`w-full lg:w-[28%] border-r flex flex-col overflow-hidden ${
                isDark ? 'border-[#26262b] bg-[#111113]' : 'border-slate-200 bg-slate-50/50'
              }`}>
                {/* Input Header */}
                <div className={`h-11 px-4 border-b flex items-center justify-between shrink-0 ${
                  isDark ? 'border-[#26262b] bg-[#151518]' : 'border-slate-200 bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      INPUT
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-white border-slate-300 text-slate-700'
                    }`}>
                      1 item
                    </span>
                    {node.pinnedData && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        PINNED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View Switcher: Table | JSON */}
                    <div className={`flex items-center p-0.5 rounded text-[10px] border ${
                      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-300'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setInputViewMode('json')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          inputViewMode === 'json'
                            ? isDark ? 'bg-neutral-800 text-white font-medium' : 'bg-slate-200 text-slate-900 font-semibold'
                            : isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputViewMode('table')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          inputViewMode === 'table'
                            ? isDark ? 'bg-neutral-800 text-white font-medium' : 'bg-slate-200 text-slate-900 font-semibold'
                            : isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        Table
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingInput(!isEditingInput)}
                      title="Edit test input payload"
                      className={`p-1 rounded text-[11px] cursor-pointer ${
                        isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isEditingInput ? 'Done' : 'Edit'}
                    </button>
                  </div>
                </div>

                {/* Input Search Bar */}
                <div className={`p-2 border-b ${isDark ? 'border-[#26262b]/60 bg-[#121214]' : 'border-slate-200 bg-white'}`}>
                  <div className="relative">
                    <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Search in input items..."
                      value={inputSearch}
                      onChange={(e) => setInputSearch(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 rounded-md text-xs focus:outline-none focus:border-[#EA580C] border ${
                        isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Input Content */}
                <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                  {isEditingInput ? (
                    <div className="h-full flex flex-col gap-2">
                      <div className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        Customize the JSON data fed to this node during tests:
                      </div>
                      <textarea
                        value={customInputText}
                        onChange={(e) => setCustomInputText(e.target.value)}
                        className={`flex-1 w-full p-2.5 rounded-lg text-xs font-mono text-emerald-400 focus:border-[#EA580C] focus:outline-none border ${
                          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-900 border-slate-800'
                        }`}
                        spellCheck={false}
                      />
                    </div>
                  ) : inputViewMode === 'json' ? (
                    <div className="space-y-1">
                      <div className={`text-[10px] mb-2 italic ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        Tip: Click any field below to copy its expression into your parameters.
                      </div>
                      {/* Render Interactive JSON Tree */}
                      {Object.entries(typeof currentInput === 'object' ? currentInput : { value: currentInput }).map(
                        ([key, val]) => {
                          if (inputSearch && !key.toLowerCase().includes(inputSearch.toLowerCase())) {
                            return null;
                          }
                          return (
                            <div
                              key={key}
                              onClick={() => handleCopyExpression(key)}
                              className={`group p-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                                isDark ? 'hover:bg-neutral-800/80' : 'hover:bg-slate-200/70'
                              }`}
                              title={`Click to copy {{ $json.${key} }}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{key}:</span>
                                <span className={`truncate ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-[#EA580C] shrink-0">
                                {copiedToken === key ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-sans">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span className="font-sans">Copy</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    /* Table View */
                    <div className={`border rounded-lg overflow-hidden text-xs ${
                      isDark ? 'border-neutral-800' : 'border-slate-200'
                    }`}>
                      <table className="w-full text-left">
                        <thead className={`border-b font-medium ${
                          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <tr>
                            <th className="p-2">Key</th>
                            <th className="p-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-neutral-800/60' : 'divide-slate-200'}`}>
                          {Object.entries(typeof currentInput === 'object' ? currentInput : { value: currentInput }).map(
                            ([k, v]) => (
                              <tr
                                key={k}
                                onClick={() => handleCopyExpression(k)}
                                className={`cursor-pointer transition-colors ${
                                  isDark ? 'hover:bg-neutral-900/60' : 'hover:bg-slate-100'
                                }`}
                              >
                                <td className={`p-2 font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{k}</td>
                                <td className={`p-2 break-all ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* PANE 2: NODE PARAMETERS (Center Column)                 */}
            {/* ------------------------------------------------------- */}
            {(activePane === 'all' || activePane === 'params') && (
              <div className={`flex-1 border-r flex flex-col overflow-hidden ${
                isDark ? 'border-[#26262b] bg-[#141416]' : 'border-slate-200 bg-white'
              }`}>
                {/* Parameters Header */}
                <div className={`h-11 px-4 border-b flex items-center justify-between shrink-0 ${
                  isDark ? 'border-[#26262b] bg-[#18181c]' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveParamTab('params')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        activeParamTab === 'params'
                          ? isDark ? 'bg-neutral-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Parameters</span>
                    </button>
                    <button
                      id="btn-open-ui-mapper-tab"
                      type="button"
                      onClick={() => setActiveParamTab('mapper')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        activeParamTab === 'mapper'
                          ? 'bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#EA580C]'
                          : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>UI Data Mapper</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#EA580C]/30 text-[#EA580C] font-bold">
                        n8n
                      </span>
                    </button>
                    <button
                      id="btn-open-docs-tab"
                      type="button"
                      onClick={() => setActiveParamTab('docs')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        activeParamTab === 'docs'
                          ? 'bg-[#EA580C] text-white shadow-xs'
                          : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Documentation</span>
                    </button>
                  </div>
                  <div className={`text-[11px] hidden sm:block ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                    {(definition?.category || '').toUpperCase()} • {definition?.name || ''}
                  </div>
                </div>

                {/* Tab Content: UI Mapper vs Standard Parameters vs Documentation */}
                {activeParamTab === 'docs' ? (
                  <div className="flex-1 overflow-hidden">
                    <NodeDocumentationView
                      node={node}
                      definition={definition}
                      onApplyExampleConfig={handleApplyExampleConfig}
                    />
                  </div>
                ) : activeParamTab === 'mapper' ? (
                  <div className="flex-1 overflow-hidden p-4">
                    <UiDataMapper
                      currentNode={node}
                      allNodes={allNodes}
                      upstreamNodes={upstreamNodes}
                      inputData={currentInput}
                      parametersSchema={definition.parametersSchema}
                      onSelectField={handleSelectMapperField}
                      onClose={() => setActiveParamTab('params')}
                    />
                  </div>
                ) : (
                  /* Parameters Body */
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Special Webhook Card if Webhook Trigger */}
                    {node.type === 'webhookTrigger' && (
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                        isDark ? 'bg-rose-950/20 border-rose-800/30' : 'bg-rose-50 border-rose-200'
                      }`}>
                        <div className="font-semibold text-rose-500 flex items-center gap-1.5">
                          <Send className="w-4 h-4" />
                          Inbound Webhook URL Endpoint
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          Send HTTP {node.parameters?.httpMethod || 'POST'} requests directly to this local endpoint to trigger execution:
                        </p>
                        <div className={`flex items-center gap-2 p-2 rounded-lg border font-mono text-[11px] break-all ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <span className="flex-1">{webhookUrl}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(webhookUrl);
                              setCopiedWebhook(true);
                              setTimeout(() => setCopiedWebhook(false), 2000);
                            }}
                            className={`p-1 rounded cursor-pointer ${
                              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Copy webhook URL"
                          >
                            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render All Parameters with Upstream Context */}
                    {definition.parametersSchema.map((param) => {
                      if (!isParamVisible(param)) return null;

                      const currentValue = node.parameters?.[param.name] ?? param.default;
                      const currentMode = node.parameterModes?.[param.name] || 'fixed';

                      return (
                        <NodeParameterField
                          key={param.name}
                          param={param}
                          value={currentValue}
                          mode={currentMode}
                          inputData={currentInput}
                          vaultCredentials={vaultCredentials}
                          upstreamNodes={upstreamNodes}
                          allNodes={allNodes}
                          onChangeValue={(val) => handleParamChange(param.name, val)}
                          onChangeMode={(mode) => handleModeChange(param.name, mode)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* PANE 3: OUTPUT DATA (Right Column)                      */}
            {/* ------------------------------------------------------- */}
            {(activePane === 'all' || activePane === 'output') && (
              <div className={`w-full lg:w-[35%] flex flex-col overflow-hidden ${
                isDark ? 'bg-[#111113]' : 'bg-slate-50/50'
              }`}>
                {/* Output Header */}
                <div className={`h-11 px-4 border-b flex items-center justify-between shrink-0 ${
                  isDark ? 'border-[#26262b] bg-[#151518]' : 'border-slate-200 bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      OUTPUT
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-white border-slate-300 text-slate-700'
                    }`}>
                      {currentOutput ? (Array.isArray(currentOutput) ? `${currentOutput.length} items` : '1 item') : '0 items'}
                    </span>
                    {testResult && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          testResult.status === 'error'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {testResult.status === 'error' ? 'ERROR' : 'SUCCESS'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View Switcher: Table | JSON */}
                    <div className={`flex items-center p-0.5 rounded text-[10px] border ${
                      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-300'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setOutputViewMode('json')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          outputViewMode === 'json'
                            ? isDark ? 'bg-neutral-800 text-white font-medium' : 'bg-slate-200 text-slate-900 font-semibold'
                            : isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutputViewMode('table')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          outputViewMode === 'table'
                            ? isDark ? 'bg-neutral-800 text-white font-medium' : 'bg-slate-200 text-slate-900 font-semibold'
                            : isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        Table
                      </button>
                    </div>

                    {currentOutput && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(currentOutput, null, 2))}
                        className={`p-1 rounded cursor-pointer ${
                          isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                        title="Copy Output JSON"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Output Search Bar */}
                <div className={`p-2 border-b ${isDark ? 'border-[#26262b]/60 bg-[#121214]' : 'border-slate-200 bg-white'}`}>
                  <div className="relative">
                    <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Filter output..."
                      value={outputSearch}
                      onChange={(e) => setOutputSearch(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 rounded-md text-xs focus:outline-none focus:border-[#EA580C] border ${
                        isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Output Content */}
                <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                  {isTesting ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
                      <Loader2 className="w-6 h-6 animate-spin text-[#EA580C]" />
                      <span>Executing step in sandbox...</span>
                    </div>
                  ) : currentOutput ? (
                    outputViewMode === 'json' ? (
                      <pre className="text-emerald-500 leading-relaxed overflow-auto">
                        {JSON.stringify(currentOutput, null, 2)}
                      </pre>
                    ) : (
                      /* Table View */
                      <div className={`border rounded-lg overflow-hidden text-xs ${
                        isDark ? 'border-neutral-800' : 'border-slate-200'
                      }`}>
                        <table className="w-full text-left">
                          <thead className={`border-b font-medium ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <tr>
                              <th className="p-2">Property</th>
                              <th className="p-2">Value</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/60' : 'divide-slate-200'}`}>
                            {Object.entries(
                              typeof currentOutput === 'object' ? currentOutput : { value: currentOutput }
                            ).map(([k, v]) => (
                              <tr key={k} className={isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-slate-100'}>
                                <td className={`p-2 font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{k}</td>
                                <td className={`p-2 break-all ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className={`h-full flex flex-col items-center justify-center p-6 text-center space-y-3 ${
                      isDark ? 'text-neutral-500' : 'text-slate-400'
                    }`}>
                      <Play className="w-8 h-8 opacity-40" />
                      <div>
                        <div className={`font-semibold text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>No Output Data Yet</div>
                        <div className={`text-[11px] mt-1 max-w-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          Click the <span className="text-[#EA580C] font-semibold">Test step</span> button in the top right to execute this node with the input data.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Logs / Telemetry Drawer */}
                {testResult?.logs && testResult.logs.length > 0 && (
                  <div className={`border-t p-2 font-mono text-[10px] max-h-32 overflow-auto ${
                    isDark ? 'border-[#26262b] bg-neutral-950 text-neutral-400' : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}>
                    <div className="font-semibold text-[#EA580C] mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#EA580C]" /> Execution Telemetry ({testResult.durationMs ?? 0}ms)
                    </div>
                    {testResult.logs.map((log: string, i: number) => (
                      <div key={i} className="truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
