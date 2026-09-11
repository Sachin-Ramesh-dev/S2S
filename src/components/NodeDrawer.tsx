import React, { useState } from 'react';
import {
  WorkflowNode as IWorkflowNode,
  NodeDefinition,
  SingleNodeExecution,
  VaultCredential
} from '../types';
import {
  X,
  Play,
  Copy,
  Check,
  Code2,
  Database,
  Terminal,
  ShieldCheck,
  Eye,
  EyeOff,
  Wand2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { testNodeExecution } from '../services/api';

interface Props {
  node: IWorkflowNode | null;
  definition?: NodeDefinition;
  workflowId: string;
  executionState?: SingleNodeExecution;
  vaultCredentials: VaultCredential[];
  onClose: () => void;
  onUpdateNode: (updated: IWorkflowNode) => void;
}

export const NodeDrawer: React.FC<Props> = ({
  node,
  definition,
  workflowId,
  executionState,
  vaultCredentials,
  onClose,
  onUpdateNode,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'data' | 'test'>('config');
  const [dataViewMode, setDataViewMode] = useState<'json' | 'table'>('json');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testInputJson, setTestInputJson] = useState<string>(
    JSON.stringify(
      executionState?.inputData || {
        event: 'test_execution',
        sampleItem: { id: 101, name: 'Alice Smith', email: 'alice@example.com' }
      },
      null,
      2
    )
  );
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});

  if (!node || !definition) return null;

  const webhookUrl = `${window.location.origin}/api/webhooks/${workflowId}/${node.id}`;

  const handleParameterChange = (paramName: string, value: any) => {
    onUpdateNode({
      ...node,
      parameters: {
        ...node.parameters,
        [paramName]: value
      }
    });
  };

  const handleRunSingleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(testInputJson);
      } catch (e) {
        parsedInput = { rawText: testInputJson };
      }
      const res = await testNodeExecution(node, parsedInput);
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

  const toggleShowSecret = (paramName: string) => {
    setShowSecretMap(prev => ({ ...prev, [paramName]: !prev[paramName] }));
  };

  return (
    <div
      id="node-inspector-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col transition-transform duration-200"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900/90 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${definition.color || '#6366F1'}25`,
              color: definition.color || '#6366F1'
            }}
          >
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <input
              id="input-node-name"
              type="text"
              value={node.name}
              onChange={(e) => onUpdateNode({ ...node, name: e.target.value })}
              className="bg-transparent border border-transparent hover:border-neutral-700 focus:border-indigo-500 rounded px-1.5 py-0.5 text-sm font-bold text-neutral-100 focus:outline-none w-full"
            />
            <div className="text-xs text-neutral-400 truncate px-1.5">
              {definition.name} • {definition.category.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-toggle-disabled"
            type="button"
            title={node.disabled ? 'Enable Node' : 'Disable Node'}
            onClick={() => onUpdateNode({ ...node, disabled: !node.disabled })}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              node.disabled
                ? 'border-neutral-700 text-neutral-500 bg-neutral-800'
                : 'border-emerald-800/80 text-emerald-400 bg-emerald-950/40'
            }`}
          >
            {node.disabled ? 'Disabled' : 'Active'}
          </button>
          <button
            id="btn-close-drawer"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-950/40 px-4 text-xs font-medium">
        <button
          id="tab-config"
          type="button"
          onClick={() => setActiveTab('config')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'config'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Configuration
        </button>
        <button
          id="tab-data"
          type="button"
          onClick={() => setActiveTab('data')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'data'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Data Inspector
          {executionState?.outputData && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          id="tab-test"
          type="button"
          onClick={() => setActiveTab('test')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'test'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Test Step
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-neutral-200 text-sm">
        {/* TAB 1: CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            {/* Special info card for Webhooks */}
            {node.type === 'webhookTrigger' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Local Inbound Webhook Endpoint
                </div>
                <p className="text-neutral-300">
                  Send external HTTP POST/GET calls directly to this local endpoint. All payloads remain strictly inside your private instance:
                </p>
                <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all">
                  <span className="flex-1">{webhookUrl}</span>
                  <button
                    id="btn-copy-webhook-url"
                    type="button"
                    title="Copy Webhook URL"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Render node parameters */}
            {definition.parametersSchema.map((param) => {
              const currentValue =
                node.parameters?.[param.name] ??
                param.default ??
                '';

              return (
                <div key={param.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      {param.label}
                      {param.required && <span className="text-rose-400 ml-1">*</span>}
                    </label>
                    {param.type === 'secret' && (
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(param.name)}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {showSecretMap[param.name] ? (
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
                  </div>

                  {param.description && (
                    <p className="text-[11px] text-neutral-400">{param.description}</p>
                  )}

                  {/* Input Type Renderers */}
                  {param.type === 'string' && (
                    <input
                      type="text"
                      value={currentValue}
                      placeholder={param.placeholder}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:border-indigo-500 focus:outline-none"
                    />
                  )}

                  {param.type === 'number' && (
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:border-indigo-500 focus:outline-none"
                    />
                  )}

                  {param.type === 'boolean' && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(currentValue)}
                        onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                        className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-300">Enabled</span>
                    </label>
                  )}

                  {param.type === 'select' && (
                    <select
                      value={currentValue}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {(param.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {param.type === 'secret' && (
                    <div className="space-y-1.5">
                      <input
                        type={showSecretMap[param.name] ? 'text' : 'password'}
                        value={currentValue}
                        placeholder={param.placeholder || 'Encrypted secret key'}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono focus:border-indigo-500 focus:outline-none"
                      />
                      {vaultCredentials.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <span>Use Vault item:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleParameterChange(param.name, e.target.value);
                              }
                            }}
                            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[11px] text-indigo-300"
                          >
                            <option value="">-- Choose Credential --</option>
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

                  {(param.type === 'code' || param.type === 'json') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span>{param.type === 'code' ? 'JavaScript Sandbox' : 'JSON Object'}</span>
                        {param.type === 'json' && (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(currentValue);
                                handleParameterChange(param.name, JSON.stringify(parsed, null, 2));
                              } catch (e) {}
                            }}
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" /> Format
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={param.type === 'code' ? 9 : 6}
                        value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: DATA INSPECTOR */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>Execution Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    executionState?.status === 'success'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : executionState?.status === 'error'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {executionState?.status ? executionState.status.toUpperCase() : 'NO RUN YET'}
                </span>
                {executionState?.durationMs !== undefined && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                    <Clock className="w-3 h-3" /> {executionState.durationMs}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDataViewMode('json')}
                  className={`px-2 py-0.5 rounded ${
                    dataViewMode === 'json' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setDataViewMode('table')}
                  className={`px-2 py-0.5 rounded ${
                    dataViewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            {/* Upstream Input Data */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Upstream Input Data
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg max-h-56 overflow-auto font-mono text-xs text-neutral-300">
                {executionState?.inputData !== undefined ? (
                  <pre>{JSON.stringify(executionState.inputData, null, 2)}</pre>
                ) : (
                  <span className="text-neutral-600 italic">No input data recorded for this step yet. Run workflow to capture.</span>
                )}
              </div>
            </div>

            {/* Downstream Output Data */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Output Data Payload</span>
                {executionState?.outputData && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(executionState.outputData, null, 2))}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy JSON
                  </button>
                )}
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg max-h-64 overflow-auto font-mono text-xs text-emerald-300">
                {executionState?.outputData !== undefined ? (
                  <pre>{JSON.stringify(executionState.outputData, null, 2)}</pre>
                ) : (
                  <span className="text-neutral-600 italic">No output data generated yet. Click "Test Step" or run workflow.</span>
                )}
              </div>
            </div>

            {/* Execution Logs */}
            {executionState?.logs && executionState.logs.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Execution Logs & Telemetry
                </div>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg max-h-36 overflow-auto font-mono text-[11px] text-neutral-400 space-y-1">
                  {executionState.logs.map((log, i) => (
                    <div key={i} className="leading-snug">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEST STEP */}
        {activeTab === 'test' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-neutral-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-indigo-300">Live Isolated Sandbox: </span>
                Test this individual node directly against custom test inputs without executing the entire workflow pipeline.
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Mock Input Payload</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setTestInputJson(JSON.stringify(JSON.parse(testInputJson), null, 2));
                    } catch (e) {}
                  }}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Format
                </button>
              </div>
              <textarea
                rows={6}
                value={testInputJson}
                onChange={(e) => setTestInputJson(e.target.value)}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-xs text-neutral-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-run-isolated-test"
              type="button"
              disabled={isTesting}
              onClick={handleRunSingleTest}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isTesting ? 'Testing Node in Sandbox...' : 'Test Step'}
            </button>

            {testResult && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    {testResult.status === 'success' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Test Succeeded
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Test Failed
                      </span>
                    )}
                  </span>
                  {testResult.durationMs !== undefined && (
                    <span className="font-mono text-neutral-500 text-[11px]">
                      {testResult.durationMs}ms
                    </span>
                  )}
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-xs text-emerald-300 max-h-56 overflow-auto">
                  <pre>{JSON.stringify(testResult.outputData || testResult.error, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
