import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Key,
  Terminal,
  Globe,
  Trash2,
  Power,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Zap,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { McpConnection, McpTool, McpTestResult } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramMcpConnectionsViewProps {
  onRefresh?: () => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Google Drive Content Hub',
    transport: 'sse' as const,
    serverUrl: 'https://mcp.drive.internal.s2s.ai/sse',
    authMethod: 'bearer' as const,
    description: 'Access creative briefs, imagery assets, brand guidelines, and documents.'
  },
  {
    name: 'Marketing Analytics Postgres',
    transport: 'sse' as const,
    serverUrl: 'https://mcp.analytics-db.s2s.ai/sse',
    authMethod: 'bearer' as const,
    description: 'Query engagement history, conversion attribution, and audience analytics.'
  },
  {
    name: 'Slack Content Notification Bot',
    transport: 'sse' as const,
    serverUrl: 'https://mcp.slack-relay.internal.s2s.ai/sse',
    authMethod: 'bearer' as const,
    description: 'Dispatch real-time approvals, draft previews, and alerts to marketing team channels.'
  },
  {
    name: 'Notion Knowledge Base (Stdio)',
    transport: 'stdio' as const,
    serverUrl: 'npx -y @modelcontextprotocol/server-notion',
    authMethod: 'none' as const,
    description: 'Local Model Context Protocol stdio bridge to company docs and editorial roadmap.'
  }
];

export const InstagramMcpConnectionsView: React.FC<InstagramMcpConnectionsViewProps> = () => {
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTransport, setFormTransport] = useState<'sse' | 'stdio'>('sse');
  const [formServerUrl, setFormServerUrl] = useState('');
  const [formAuthMethod, setFormAuthMethod] = useState<'none' | 'bearer' | 'basic' | 'custom_header'>('none');
  const [formSecretKey, setFormSecretKey] = useState('');
  const [formAllowDestructive, setFormAllowDestructive] = useState(false);
  const [formHeadersText, setFormHeadersText] = useState('');
  const [formEnvVarsText, setFormEnvVarsText] = useState('');
  const [testingForm, setTestingForm] = useState(false);
  const [formTestResult, setFormTestResult] = useState<McpTestResult | null>(null);

  // Testing per connection
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, McpTestResult>>({});
  const [expandedConnId, setExpandedConnId] = useState<string | null>(null);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await instagramApi.getMcpConnections();
      setConnections(data);
      if (data.length > 0 && !expandedConnId) {
        setExpandedConnId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load MCP connections:', err);
      setError(err.message || 'Failed to fetch MCP connections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (preset?: typeof PRESET_TEMPLATES[0]) => {
    setEditingConnId(null);
    setFormName(preset ? preset.name : '');
    setFormTransport(preset ? preset.transport : 'sse');
    setFormServerUrl(preset ? preset.serverUrl : '');
    setFormAuthMethod(preset ? preset.authMethod : 'none');
    setFormSecretKey('');
    setFormAllowDestructive(false);
    setFormHeadersText('');
    setFormEnvVarsText('');
    setFormTestResult(null);
    setShowModal(true);
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      const result = await instagramApi.testMcpConnection(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
      // Reload connections to update lastConnected and status
      const updated = await instagramApi.getMcpConnections();
      setConnections(updated);
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [id]: {
          success: false,
          serverName: 'Server',
          toolsCount: 0,
          discoveredTools: [],
          message: err.message || 'Connection ping failed',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleTestFormConfig = async () => {
    if (!formServerUrl.trim()) return;
    try {
      setTestingForm(true);
      setFormTestResult(null);
      const result = await instagramApi.testMcpConfig({
        name: formName || 'New Server',
        transport: formTransport,
        serverUrl: formServerUrl,
        authMethod: formAuthMethod,
        secretKey: formSecretKey
      });
      setFormTestResult(result);
    } catch (err: any) {
      setFormTestResult({
        success: false,
        serverName: formName || 'Server',
        toolsCount: 0,
        discoveredTools: [],
        message: err.message || 'Test failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingForm(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formServerUrl.trim()) return;

    try {
      let parsedHeaders: Record<string, string> | undefined;
      if (formHeadersText.trim()) {
        try {
          parsedHeaders = JSON.parse(formHeadersText);
        } catch {
          // If simple KEY=VALUE format
          parsedHeaders = {};
          formHeadersText.split('\n').forEach(line => {
            const [k, ...v] = line.split(':');
            if (k && v.length > 0) parsedHeaders![k.trim()] = v.join(':').trim();
          });
        }
      }

      let parsedEnv: Record<string, string> | undefined;
      if (formEnvVarsText.trim()) {
        try {
          parsedEnv = JSON.parse(formEnvVarsText);
        } catch {
          parsedEnv = {};
          formEnvVarsText.split('\n').forEach(line => {
            const [k, ...v] = line.split('=');
            if (k && v.length > 0) parsedEnv![k.trim()] = v.join('=').trim();
          });
        }
      }

      if (editingConnId) {
        await instagramApi.updateMcpConnection(editingConnId, {
          name: formName,
          transport: formTransport,
          serverUrl: formServerUrl,
          authMethod: formAuthMethod,
          allowDestructive: formAllowDestructive,
          headers: parsedHeaders,
          envVars: parsedEnv
        });
      } else {
        await instagramApi.saveMcpConnection({
          name: formName,
          transport: formTransport,
          serverUrl: formServerUrl,
          authMethod: formAuthMethod,
          secretKey: formSecretKey || undefined,
          allowDestructive: formAllowDestructive,
          headers: parsedHeaders,
          envVars: parsedEnv,
          enabled: true
        });
      }

      setShowModal(false);
      await loadConnections();
    } catch (err: any) {
      alert(`Error saving MCP connection: ${err.message}`);
    }
  };

  const handleDeleteConnection = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove MCP server "${name}"?`)) return;
    try {
      await instagramApi.deleteMcpConnection(id);
      setConnections(prev => prev.filter(c => c.id !== id));
      if (expandedConnId === id) setExpandedConnId(null);
    } catch (err: any) {
      alert(`Failed to delete connection: ${err.message}`);
    }
  };

  const handleToggleConnectionState = async (id: string, currentlyEnabled: boolean) => {
    try {
      const updated = await instagramApi.updateMcpConnection(id, { enabled: !currentlyEnabled });
      setConnections(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err: any) {
      alert(`Failed to toggle server: ${err.message}`);
    }
  };

  const handleToggleTool = async (connId: string, toolName: string, currentlyEnabled: boolean) => {
    try {
      const updated = await instagramApi.toggleMcpTool(connId, toolName, !currentlyEnabled);
      setConnections(prev => prev.map(c => c.id === connId ? updated : c));
    } catch (err: any) {
      alert(`Failed to toggle tool: ${err.message}`);
    }
  };

  const handleToggleDestructive = async (connId: string, currentVal: boolean) => {
    if (!currentVal) {
      const ok = window.confirm(
        'WARNING: Enabling destructive operations allows this MCP server to execute file deletions, database drops, or irreversible actions. Proceed with caution?'
      );
      if (!ok) return;
    }
    try {
      const updated = await instagramApi.updateMcpPermissions(connId, !currentVal);
      setConnections(prev => prev.map(c => c.id === connId ? updated : c));
    } catch (err: any) {
      alert(`Failed to update permissions: ${err.message}`);
    }
  };

  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.serverUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tools.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Model Context Protocol (MCP) Connections</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-3 h-3 text-emerald-600" /> Vault Protected
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 max-w-2xl leading-relaxed">
            Connect external context providers, databases, and enterprise workspaces via standardized MCP endpoints.
            AI models query these tools on-demand during audit analysis and content scripting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-mcp"
            type="button"
            onClick={loadConnections}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            Refresh
          </button>
          <button
            id="btn-add-mcp"
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add MCP Server
          </button>
        </div>
      </div>

      {/* Security & Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xs mb-1">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Server-Side Storage</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            API keys and tokens are stored in the backend AES-256-GCM encrypted vault. Never exposed in frontend code or client state.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xs mb-1">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Granular Safety Boundaries</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Destructive tools (file deletion, drop table) are disabled by default and require explicit safety overrides per connection.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-xs mb-1">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Instant Tool Discovery</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Discovered tools are dynamically mapped to the Gemini and Manus agent runtime during workflow execution.
          </p>
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quick Connect Presets</span>
          <span className="text-[11px] text-gray-400">Standardized Model Context Protocol integrations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleOpenAddModal(preset)}
              className="group border border-gray-200 hover:border-orange-500 rounded-lg p-3 bg-gray-50/50 hover:bg-orange-50/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 uppercase">
                    {preset.transport}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">
                  {preset.description}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                <span>Configure & Connect</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search connections or tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {filteredConnections.length} configured {filteredConnections.length === 1 ? 'server' : 'servers'}
        </div>
      </div>

      {/* Connections List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Loading MCP server registry...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button
            onClick={loadConnections}
            className="mt-3 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
          >
            Retry Connection Fetch
          </button>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Server className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-800">No MCP Connections Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Add an external Model Context Protocol server or choose a preset above to equip your Instagram engine with live tools.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="mt-4 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700"
          >
            Add First MCP Server
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConnections.map((conn) => {
            const isExpanded = expandedConnId === conn.id;
            const testRes = testResults[conn.id];
            const isTesting = testingId === conn.id;
            const enabledToolsCount = conn.tools.filter(t => t.enabled).length;

            return (
              <div
                key={conn.id}
                id={`mcp-conn-${conn.id}`}
                className={`bg-white border rounded-xl transition-all shadow-sm ${
                  conn.enabled ? 'border-gray-200' : 'border-gray-200 opacity-75 bg-gray-50/50'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      conn.status === 'connected' && conn.enabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : conn.status === 'error'
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}>
                      {conn.transport === 'stdio' ? <Terminal className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900">{conn.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {conn.transport}
                        </span>
                        {conn.enabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            Disabled
                          </span>
                        )}
                        {conn.allowDestructive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" /> Destructive Allowed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap font-mono text-[11px]">
                        <span className="text-gray-700 font-normal truncate max-w-md">{conn.serverUrl}</span>
                        <span>•</span>
                        <span className="text-gray-500">Auth: {conn.authMethod}</span>
                        {conn.maskedToken && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Key className="w-3 h-3 text-gray-400" /> {conn.maskedToken}
                            </span>
                          </>
                        )}
                        {conn.lastConnected && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400 font-sans text-[11px]">
                              Last checked {new Date(conn.lastConnected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      id={`btn-test-mcp-${conn.id}`}
                      onClick={() => handleTestConnection(conn.id)}
                      disabled={isTesting || !conn.enabled}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-orange-600' : ''}`} />
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                      type="button"
                      id={`btn-power-mcp-${conn.id}`}
                      onClick={() => handleToggleConnectionState(conn.id, conn.enabled)}
                      title={conn.enabled ? 'Disable Connection' : 'Enable Connection'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        conn.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-mcp-${conn.id}`}
                      onClick={() => handleDeleteConnection(conn.id, conn.name)}
                      title="Remove Connection"
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedConnId(isExpanded ? null : conn.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                      title={isExpanded ? 'Collapse Tools' : 'Expand Tools'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline Test Result Banner */}
                {testRes && (
                  <div className={`px-5 py-2.5 text-xs border-b flex items-center justify-between ${
                    testRes.success
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                      : 'bg-red-50 border-red-100 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testRes.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span className="font-medium">{testRes.message}</span>
                      {testRes.latencyMs && (
                        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-emerald-100/60 text-emerald-800">
                          {testRes.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(testRes.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Collapsible Tool Discovery & Permissions Section */}
                {isExpanded && (
                  <div className="p-5 bg-gray-50/40 space-y-4">
                    {/* Sub-bar: Safety Switch & Discovered Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">
                          Discovered Capabilities ({enabledToolsCount} of {conn.tools.length} active)
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Tools automatically registered into agent toolbelt
                        </span>
                      </div>

                      {/* Safety Override Control */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={conn.allowDestructive}
                            onChange={() => handleToggleDestructive(conn.id, conn.allowDestructive)}
                            className="rounded text-red-600 focus:ring-red-500 border-gray-300 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-gray-800 font-semibold">Allow Destructive Actions</span>
                        </label>
                        <span title="Controls whether delete/drop tools can execute">
                          <Info className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      </div>
                    </div>

                    {/* Tools Table / Cards */}
                    {conn.tools.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs">
                        No tools discovered yet. Click "Test Connection" to fetch schema from this server.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {conn.tools.map((tool) => {
                          const isDestructive = tool.permissionCategory === 'destructive' || tool.isDestructive;
                          const isBlocked = isDestructive && !conn.allowDestructive;

                          return (
                            <div
                              key={tool.name}
                              className={`p-3 rounded-lg border transition-all ${
                                tool.enabled && !isBlocked
                                  ? 'bg-white border-gray-200 shadow-2xs'
                                  : 'bg-gray-100/70 border-gray-200 text-gray-500'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-gray-900">
                                      {tool.name}
                                    </span>
                                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${
                                      tool.permissionCategory === 'read'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : tool.permissionCategory === 'write'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                      {tool.permissionCategory}
                                    </span>
                                    {isBlocked && (
                                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                                        Safety Blocked
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                                    {tool.description}
                                  </p>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={tool.enabled && !isBlocked}
                                    disabled={isBlocked || !conn.enabled}
                                    onChange={() => handleToggleTool(conn.id, tool.name, tool.enabled)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600 peer-disabled:opacity-40"></div>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  {editingConnId ? 'Edit MCP Connection' : 'Add Model Context Protocol (MCP) Server'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="p-6 space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Marketing Postgres or Google Drive Hub"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Transport */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Transport Protocol
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTransport('sse')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      formTransport === 'sse'
                        ? 'bg-orange-50 border-orange-500 text-orange-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-orange-600" />
                    <div>
                      <div className="font-bold">SSE (Server-Sent Events)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Remote HTTP/HTTPS endpoint</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTransport('stdio')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      formTransport === 'stdio'
                        ? 'bg-orange-50 border-orange-500 text-orange-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-orange-600" />
                    <div>
                      <div className="font-bold">stdio (CLI Command)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Local sub-process execution</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Server URL / Command */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {formTransport === 'sse' ? 'Server SSE Endpoint URL' : 'Command Line Invocation'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formTransport === 'sse' ? 'https://mcp-server.yourdomain.com/sse' : 'npx -y @modelcontextprotocol/server-postgres'}
                  value={formServerUrl}
                  onChange={(e) => setFormServerUrl(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Auth Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Authentication Method
                  </label>
                  <select
                    value={formAuthMethod}
                    onChange={(e) => setFormAuthMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="none">None (Public / Local)</option>
                    <option value="bearer">Bearer Token (Authorization)</option>
                    <option value="custom_header">Custom Header (e.g., X-MCP-Key)</option>
                    <option value="basic">HTTP Basic Auth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Secret Key / Token (Vault Protected)
                  </label>
                  <input
                    type="password"
                    placeholder={formAuthMethod === 'none' ? 'Not required for None' : 'Enter secret key...'}
                    disabled={formAuthMethod === 'none'}
                    value={formSecretKey}
                    onChange={(e) => setFormSecretKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-orange-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Safety Override */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="form-allow-destructive"
                  checked={formAllowDestructive}
                  onChange={(e) => setFormAllowDestructive(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 border-gray-300"
                />
                <div>
                  <label htmlFor="form-allow-destructive" className="font-bold text-gray-900 block cursor-pointer">
                    Authorize Destructive Operations
                  </label>
                  <p className="text-[11px] text-gray-600 leading-normal">
                    When enabled, tools tagged with delete or write operations can run. Keep disabled if you only require contextual read access.
                  </p>
                </div>
              </div>

              {/* Test Result during editing */}
              {formTestResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  formTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {formTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span>{formTestResult.message}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestFormConfig}
                  disabled={testingForm || !formServerUrl.trim()}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingForm ? 'animate-spin text-orange-600' : ''}`} />
                  {testingForm ? 'Testing...' : 'Test Handshake'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
                  >
                    Save MCP Server
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
