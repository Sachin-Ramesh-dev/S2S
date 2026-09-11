import React, { useState } from 'react';
import { CustomPluginNode, NodeParameterSchema } from '../types';
import {
  X,
  Plus,
  Trash2,
  Code2,
  Play,
  Download,
  Upload,
  Sparkles,
  Check,
  HelpCircle,
  Copy,
  Terminal,
  Layers,
  Wand2,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plugins: CustomPluginNode[];
  onSavePlugin: (plugin: CustomPluginNode) => Promise<void>;
  onDeletePlugin: (pluginId: string) => Promise<void>;
}

export const PluginManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  plugins,
  onSavePlugin,
  onDeletePlugin
}) => {
  const [editingPlugin, setEditingPlugin] = useState<CustomPluginNode | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'sandbox'>('editor');
  const [sandboxInput, setSandboxInput] = useState<string>(
    JSON.stringify({ message: 'Hello from NodeFlow sandbox test', count: 42 }, null, 2)
  );
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  if (!isOpen) return null;

  const handleStartNewPlugin = () => {
    const id = `plugin-custom-${Date.now()}`;
    const newPlugin: CustomPluginNode = {
      id,
      type: `customNode_${Math.random().toString(36).slice(2, 7)}`,
      name: 'Custom API Connector',
      icon: 'Code2',
      category: 'plugin',
      description: 'Custom automation module interacting with third-party service or bespoke internal logic.',
      version: '1.0.0',
      author: 'Self-Hosted Developer',
      inputs: [{ id: 'main', label: 'Input', type: 'main' }],
      outputs: [{ id: 'main', label: 'Output', type: 'main' }],
      parametersSchema: [
        {
          name: 'apiUrl',
          label: 'Service Endpoint URL',
          type: 'string',
          default: 'https://httpbin.org/json',
          placeholder: 'https://api.thirdparty.com/v1/resource',
          required: true
        },
        {
          name: 'apiKey',
          label: 'API Key / Secret Token',
          type: 'secret',
          placeholder: 'Bearer token or secret',
          required: false
        }
      ],
      code: `// Custom Plugin Execution Handler
// inputs: incoming array/object data from upstream nodes
// params: user-configured parameters from node form
// helpers: { fetch, crypto, log }

helpers.log('Executing custom node with endpoint: ' + params.apiUrl);

// Example HTTP dispatch or local transformation
const data = Array.isArray(inputs) ? inputs : [inputs];

return data.map(item => ({
  ...item,
  customProcessed: true,
  timestamp: new Date().toISOString()
}));`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingPlugin(newPlugin);
  };

  const handleSaveCurrentPlugin = async () => {
    if (!editingPlugin) return;
    setIsSaving(true);
    try {
      await onSavePlugin(editingPlugin);
    } catch (e) {
      alert('Failed to save plugin: ' + e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!editingPlugin) return;
    setIsTesting(true);
    setSandboxLogs([]);
    setSandboxOutput(null);

    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Starting sandbox run for ${editingPlugin.name}`);

    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(sandboxInput);
      } catch (e) {
        parsedInput = { text: sandboxInput };
      }

      // Safe client-side sandbox execution of the plugin code
      const helpers = {
        fetch: window.fetch.bind(window),
        crypto: window.crypto,
        log: (...args: any[]) => logs.push('[plugin.log] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      };

      // Construct async function
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('inputs', 'params', 'credentials', 'helpers', editingPlugin.code);

      // Build default params
      const params: Record<string, any> = {};
      editingPlugin.parametersSchema.forEach(p => {
        params[p.name] = p.default;
      });

      const start = performance.now();
      const result = await fn(parsedInput, params, {}, helpers);
      const duration = (performance.now() - start).toFixed(1);

      logs.push(`[${new Date().toLocaleTimeString()}] Completed in ${duration}ms`);
      setSandboxOutput(result);
      setSandboxLogs(logs);
    } catch (err: any) {
      logs.push(`[ERROR] ${err.message}`);
      setSandboxLogs(logs);
      setSandboxOutput({ error: err.message, stack: err.stack });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportPluginJson = (plugin: CustomPluginNode) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plugin, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${plugin.type}.nodeflow-plugin.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportPlugin = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.name || !parsed.code) {
        alert('Invalid plugin JSON structure: must contain name and code properties.');
        return;
      }
      parsed.id = `plugin-custom-${Date.now()}`;
      await onSavePlugin(parsed);
      setShowImportModal(false);
      setImportJsonText('');
      setEditingPlugin(parsed);
    } catch (e: any) {
      alert('Failed to parse plugin JSON: ' + e.message);
    }
  };

  return (
    <div
      id="modal-plugin-manager"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Custom Node Plugin Developer Studio
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-xs font-mono border border-indigo-800/40">
                  Extensible SDK
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Develop, test, and distribute custom JavaScript nodes with dynamic parameters and sandboxed execution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-import-plugin-modal"
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Plugin JSON
            </button>
            <button
              id="btn-create-new-plugin"
              type="button"
              onClick={handleStartNewPlugin}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Plugin Node
            </button>
            <button
              id="btn-close-plugin-manager"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar List + Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Plugins Sidebar */}
          <div className="w-72 border-r border-neutral-800 bg-neutral-950/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-neutral-800/60 text-xs font-semibold text-neutral-400 flex items-center justify-between">
              <span>INSTALLED PLUGINS ({plugins.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  id={`plugin-list-item-${plugin.id}`}
                  onClick={() => setEditingPlugin(plugin)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    editingPlugin?.id === plugin.id
                      ? 'bg-neutral-800 border-indigo-500/50 shadow-sm'
                      : 'hover:bg-neutral-900/80 border-transparent text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-neutral-100 truncate">
                      {plugin.name}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/40">
                      v{plugin.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-1">
                    {plugin.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/50 text-[10px] text-neutral-500">
                    <span>{plugin.author}</span>
                    <button
                      type="button"
                      title="Export Plugin JSON"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPluginJson(plugin);
                      }}
                      className="hover:text-indigo-300 p-1"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Workspace */}
          {editingPlugin ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
              {/* Workspace Top Toolbar */}
              <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Node Definition & Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sandbox')}
                      className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'sandbox' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      Live Test Sandbox
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-export-current-plugin"
                    type="button"
                    onClick={() => handleExportPluginJson(editingPlugin)}
                    className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    id="btn-delete-plugin"
                    type="button"
                    onClick={async () => {
                      if (confirm(`Delete custom plugin "${editingPlugin.name}"?`)) {
                        await onDeletePlugin(editingPlugin.id);
                        setEditingPlugin(null);
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-red-950 text-neutral-400 hover:text-red-400 rounded-lg text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-save-plugin"
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveCurrentPlugin}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : 'Save & Publish Plugin'}
                  </button>
                </div>
              </div>

              {/* Workspace Body */}
              <div className="flex-1 overflow-y-auto p-5 text-neutral-200">
                {activeTab === 'editor' && (
                  <div className="space-y-5 max-w-3xl">
                    {/* Metadata Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Plugin Name</label>
                        <input
                          type="text"
                          value={editingPlugin.name}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Type Identifier (unique)</label>
                        <input
                          type="text"
                          value={editingPlugin.type}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, type: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-neutral-300">Description</label>
                        <input
                          type="text"
                          value={editingPlugin.description}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, description: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Version</label>
                        <input
                          type="text"
                          value={editingPlugin.version}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, version: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Author</label>
                        <input
                          type="text"
                          value={editingPlugin.author}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, author: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Parameters Schema Builder */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          Configurable Node Parameters ({editingPlugin.parametersSchema.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newParam: NodeParameterSchema = {
                              name: `param_${editingPlugin.parametersSchema.length + 1}`,
                              label: `Custom Field ${editingPlugin.parametersSchema.length + 1}`,
                              type: 'string',
                              default: '',
                              description: ''
                            };
                            setEditingPlugin({
                              ...editingPlugin,
                              parametersSchema: [...editingPlugin.parametersSchema, newParam]
                            });
                          }}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Parameter
                        </button>
                      </div>

                      <div className="space-y-2">
                        {editingPlugin.parametersSchema.map((param, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                          >
                            <input
                              type="text"
                              placeholder="Field Name (Key)"
                              value={param.name}
                              onChange={(e) => {
                                const updated = [...editingPlugin.parametersSchema];
                                updated[idx].name = e.target.value;
                                setEditingPlugin({ ...editingPlugin, parametersSchema: updated });
                              }}
                              className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-indigo-300"
                            />
                            <input
                              type="text"
                              placeholder="Display Label"
                              value={param.label}
                              onChange={(e) => {
                                const updated = [...editingPlugin.parametersSchema];
                                updated[idx].label = e.target.value;
                                setEditingPlugin({ ...editingPlugin, parametersSchema: updated });
                              }}
                              className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200"
                            />
                            <select
                              value={param.type}
                              onChange={(e) => {
                                const updated = [...editingPlugin.parametersSchema];
                                updated[idx].type = e.target.value as any;
                                setEditingPlugin({ ...editingPlugin, parametersSchema: updated });
                              }}
                              className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200"
                            >
                              <option value="string">String (Text)</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean (Toggle)</option>
                              <option value="secret">Secret / Token</option>
                              <option value="json">JSON Object</option>
                              <option value="code">JavaScript Code</option>
                            </select>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlugin({
                                    ...editingPlugin,
                                    parametersSchema: editingPlugin.parametersSchema.filter((_, i) => i !== idx)
                                  });
                                }}
                                className="text-neutral-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* JavaScript Execution Code Editor */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-emerald-400" />
                          Node Execution Function (JavaScript)
                        </label>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          inputs, params, credentials, helpers
                        </span>
                      </div>
                      <textarea
                        rows={14}
                        value={editingPlugin.code}
                        onChange={(e) => setEditingPlugin({ ...editingPlugin, code: e.target.value })}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-300 focus:border-indigo-500 focus:outline-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'sandbox' && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sandbox Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                          <span>Sandbox Test Input Data</span>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                setSandboxInput(JSON.stringify(JSON.parse(sandboxInput), null, 2));
                              } catch (e) {}
                            }}
                            className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <Wand2 className="w-3 h-3" /> Format JSON
                          </button>
                        </div>
                        <textarea
                          rows={12}
                          value={sandboxInput}
                          onChange={(e) => setSandboxInput(e.target.value)}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          id="btn-run-plugin-sandbox"
                          type="button"
                          disabled={isTesting}
                          onClick={handleRunSandbox}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isTesting ? 'Executing Plugin in Sandbox...' : 'Run Sandbox Execution'}
                        </button>
                      </div>

                      {/* Sandbox Output */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                          <span>Sandbox Output Result</span>
                          {sandboxOutput && (
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(sandboxOutput, null, 2))}
                              className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          )}
                        </div>
                        <div className="h-[285px] p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-300 overflow-auto">
                          {sandboxOutput !== null ? (
                            <pre>{JSON.stringify(sandboxOutput, null, 2)}</pre>
                          ) : (
                            <span className="text-neutral-600 italic">Click "Run Sandbox Execution" to test output.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Console Logs */}
                    {sandboxLogs.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          Sandbox Console Telemetry
                        </div>
                        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 space-y-1 max-h-36 overflow-auto">
                          {sandboxLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-3">
              <Code2 className="w-12 h-12 text-neutral-700" />
              <div className="text-sm font-semibold text-neutral-300">
                Select a custom plugin to edit or create a new one
              </div>
              <p className="text-xs text-neutral-500 max-w-sm">
                Plugins allow you to build proprietary API integrations, security filters, or custom data workflows with standard JavaScript.
              </p>
              <button
                type="button"
                onClick={handleStartNewPlugin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Custom Node
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Plugin Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" /> Import Community Plugin
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Paste the exported JSON of any custom nodeflow plugin to install it directly into your local database.
            </p>
            <textarea
              rows={8}
              placeholder="Paste plugin JSON here..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPlugin}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium"
              >
                Import & Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
