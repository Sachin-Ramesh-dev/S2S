import React, { useState, useEffect } from 'react';
import {
  Server,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Terminal,
  Code,
  Globe,
  Laptop,
  ChevronDown,
  ChevronRight,
  X,
  Key,
  ShieldCheck,
  Power,
  Play,
  Sparkles,
  RefreshCw,
  Layers,
  Lock,
  Search,
  Workflow as WorkflowIcon
} from 'lucide-react';
import { SAMPLE_WORKFLOWS } from '../data/sampleWorkflows';

interface ConnectedClientSession {
  id: string;
  name: string;
  clientType: 'Claude.ai' | 'Cursor' | 'VS Code' | 'Claude Code' | 'ChatGPT' | 'Windsurf';
  transport: 'http' | 'sse' | 'stdio';
  connectedAt: string;
  lastPing: string;
  ipAddress: string;
  status: 'active' | 'idle';
}

interface McpToolDefinition {
  name: string;
  description: string;
  category: 'Workflows' | 'Instagram Intelligence' | 'Content Studio' | 'System';
  schema: Record<string, any>;
  enabled: boolean;
}

export const McpConnectionsPage: React.FC = () => {
  // 1. Instance MCP Server Status (Screenshots 2 & 3)
  const [mcpEnabled, setMcpEnabled] = useState<boolean>(true);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // 2. "Connect a Client" Modal State (Screenshots 4 & 5)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectTab, setConnectTab] = useState<'oauth' | 'apikey'>('oauth');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<
    'Claude Code' | 'Codex' | 'Gemini CLI' | 'Claude.ai' | 'ChatGPT' | 'Cursor' | 'VS Code' | 'Windsurf'
  >('Claude.ai');

  // 3. Modals for Access & Governance (Screenshot 2)
  const [isExposedWorkflowsModalOpen, setIsExposedWorkflowsModalOpen] = useState(false);
  const [isAllowedCallbacksModalOpen, setIsAllowedCallbacksModalOpen] = useState(false);
  const [isConnectedClientsModalOpen, setIsConnectedClientsModalOpen] = useState(false);

  // Exposed Workflows State
  const [exposedWorkflowIds, setExposedWorkflowIds] = useState<string[]>([
    SAMPLE_WORKFLOWS[0]?.id || 'wf-1',
    SAMPLE_WORKFLOWS[1]?.id || 'wf-2'
  ]);
  const [workflowSearch, setWorkflowSearch] = useState('');

  // Allowed Callback URLs State
  const [callbackMode, setCallbackMode] = useState<'all' | 'restricted'>('all');
  const [allowedUrls, setAllowedUrls] = useState<string[]>([
    'https://claude.ai/api/mcp/callback',
    'https://chatgpt.com/oauth/callback',
    'http://localhost:3000/callback'
  ]);
  const [newUrlInput, setNewUrlInput] = useState('');

  // Connected Clients State
  const [connectedClients, setConnectedClients] = useState<ConnectedClientSession[]>([
    {
      id: 'sess-1',
      name: 'Claude Desktop Agent',
      clientType: 'Claude.ai',
      transport: 'http',
      connectedAt: 'Today at 09:14 AM',
      lastPing: '2 mins ago',
      ipAddress: '127.0.0.1 (Local loopback)',
      status: 'active'
    },
    {
      id: 'sess-2',
      name: 'Cursor AI Workspace',
      clientType: 'Cursor',
      transport: 'http',
      connectedAt: 'Yesterday at 18:30 PM',
      lastPing: '15 mins ago',
      ipAddress: '192.168.1.42',
      status: 'active'
    }
  ]);

  // Copied toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live MCP Tools Registry (Better than example)
  const [tools, setTools] = useState<McpToolDefinition[]>([
    {
      name: 'workflow_execute',
      description: 'Trigger an S2S workflow by ID or name with optional JSON parameters.',
      category: 'Workflows',
      schema: { type: 'object', properties: { workflowId: { type: 'string' }, parameters: { type: 'object' } } },
      enabled: true
    },
    {
      name: 'workflow_list',
      description: 'Discover and inspect available instance workflows, inputs, and active status.',
      category: 'Workflows',
      schema: { type: 'object', properties: { filter: { type: 'string' } } },
      enabled: true
    },
    {
      name: 'instagram_audit_page',
      description: 'Run deep Manus AI audit on an Instagram profile to detect content gaps and viral hooks.',
      category: 'Instagram Intelligence',
      schema: { type: 'object', properties: { handle: { type: 'string' }, mode: { type: 'string' } } },
      enabled: true
    },
    {
      name: 'instagram_generate_script',
      description: 'Generate high-converting Reel or Carousel script from approved topic ideas.',
      category: 'Content Studio',
      schema: { type: 'object', properties: { topicId: { type: 'string' }, format: { type: 'string' } } },
      enabled: true
    },
    {
      name: 'instagram_schedule_post',
      description: 'Queue ready content assets directly into the editorial calendar.',
      category: 'Content Studio',
      schema: { type: 'object', properties: { scriptId: { type: 'string' }, publishDate: { type: 'string' } } },
      enabled: true
    }
  ]);

  // Test Runner state
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTestingTool, setIsTestingTool] = useState(false);

  // Server URL derived from current window or standard container port
  const serverUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/mcp-server/http`
    : 'https://app.s2s.ai/mcp-server/http';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestPing = async (toolName: string) => {
    setIsTestingTool(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsTestingTool(false);
      setTestOutput(
        JSON.stringify(
          {
            jsonrpc: '2.0',
            result: {
              status: 'success',
              tool: toolName,
              instance: 'S2S Workflow Engine',
              protocolVersion: '2024-11-05',
              availableToolsCount: tools.filter((t) => t.enabled).length,
              activeSessions: connectedClients.length,
              timestamp: new Date().toISOString()
            }
          },
          null,
          2
        )
      );
    }, 450);
  };

  const handleRevokeClient = (id: string) => {
    setConnectedClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCallbackUrl = () => {
    if (!newUrlInput.trim()) return;
    setAllowedUrls((prev) => [...prev, newUrlInput.trim()]);
    setNewUrlInput('');
  };

  const handleToggleWorkflowExposed = (id: string) => {
    setExposedWorkflowIds((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setIsStatusDropdownOpen(false);
      setIsClientDropdownOpen(false);
    };
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#101015] text-[#f4f4f5] overflow-y-auto font-sans select-none">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="border-b border-[#22222d] bg-[#14141a]/95 px-6 py-5 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/20">
                <Server className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">Instance level MCP</h1>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed">
              Let AI assistants and IDEs connect to this instance over the Model Context Protocol (MCP), then control which tools and workflows they can use.{' '}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noreferrer"
                className="text-[#EA580C] hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                Learn more in the documentation <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Quick Health Indicators */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#181822] border border-[#272736] text-[#a1a1aa]">
              <span className={`w-2 h-2 rounded-full ${mcpEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              {mcpEnabled ? 'Server Ready' : 'Server Inactive'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#181822] border border-[#272736] text-zinc-400">
              MCP 2024-11-05
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        
        {/* SECTION 1: Connection details (Screenshot 2 & 3) */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider px-1">
            Connection details
          </h2>

          <div className="bg-[#181820] border border-[#282834] rounded-2xl divide-y divide-[#282834] shadow-sm overflow-visible">
            
            {/* Row 1: MCP status */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">MCP status</div>
                <div className="text-xs text-[#9c9cb0] max-w-lg leading-relaxed">
                  Connect AI assistants and IDEs like Claude, Cursor, and ChatGPT to this instance over MCP.
                </div>
              </div>

              {/* Status Dropdown (Screenshots 2 & 3) */}
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  id="btn-mcp-status-dropdown"
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#20202a] hover:bg-[#272734] border border-[#353545] text-xs font-medium text-[#f0f0f5] transition-all cursor-pointer shadow-xs"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      mcpEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                    }`}
                  />
                  <span>{mcpEnabled ? 'Enabled' : 'Disabled'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9c9cb0]" />
                </button>

                {/* Dropdown Menu (Screenshot 3) */}
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-[#20202a] border border-[#353545] rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {mcpEnabled ? (
                      <button
                        id="btn-disable-mcp"
                        type="button"
                        onClick={() => {
                          setMcpEnabled(false);
                          setIsStatusDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Disable</span>
                      </button>
                    ) : (
                      <button
                        id="btn-enable-mcp"
                        type="button"
                        onClick={() => {
                          setMcpEnabled(true);
                          setIsStatusDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-left"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Enable</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Connect your client */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Connect your client</div>
                <div className="text-xs text-[#9c9cb0] max-w-lg leading-relaxed">
                  Choose your AI assistant, IDE, or CLI to get tailored setup steps.
                </div>
              </div>

              <button
                id="btn-connect-client"
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[#242430] hover:bg-[#2e2e3e] border border-[#38384a] hover:border-[#4d4d63] text-xs font-semibold text-white transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Access & Governance (Screenshot 2) */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider px-1">
            Access
          </h2>

          <div className="bg-[#181820] border border-[#282834] rounded-2xl divide-y divide-[#282834] shadow-sm overflow-hidden">
            
            {/* Row 1: Workflows exposed */}
            <div
              onClick={() => setIsExposedWorkflowsModalOpen(true)}
              className="p-5 flex items-center justify-between gap-4 hover:bg-[#1d1d26] transition-colors cursor-pointer group"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors">
                  Workflows exposed
                </div>
                <div className="text-xs text-[#9c9cb0] max-w-lg leading-relaxed">
                  Choose which workflows connected clients can access.
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] font-medium shrink-0 group-hover:text-white transition-colors">
                <span>{exposedWorkflowIds.length} workflows</span>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Row 2: Allowed callback URLs */}
            <div
              onClick={() => setIsAllowedCallbacksModalOpen(true)}
              className="p-5 flex items-center justify-between gap-4 hover:bg-[#1d1d26] transition-colors cursor-pointer group"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors">
                  Allowed callback URLs
                </div>
                <div className="text-xs text-[#9c9cb0] max-w-lg leading-relaxed">
                  Restrict OAuth sign-in redirects to trusted URLs. Allowing all URLs (the default) is less secure.
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] font-medium shrink-0 group-hover:text-white transition-colors">
                <span>{callbackMode === 'all' ? 'All' : `${allowedUrls.length} configured`}</span>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Connected clients (Screenshot 2) */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider px-1">
            Connected clients
          </h2>

          <div className="bg-[#181820] border border-[#282834] rounded-2xl shadow-sm overflow-hidden">
            <div
              onClick={() => setIsConnectedClientsModalOpen(true)}
              className="p-5 flex items-center justify-between gap-4 hover:bg-[#1d1d26] transition-colors cursor-pointer group"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors">
                  All connected clients
                </div>
                <div className="text-xs text-[#9c9cb0] max-w-lg leading-relaxed">
                  {connectedClients.length} {connectedClients.length === 1 ? 'client has' : 'clients have'} access
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] font-medium shrink-0 group-hover:text-white transition-colors">
                <span>View all</span>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Live Tool Registry & Testing (Better Than Example!) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                Exported Tools & Capabilities
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                These tools are automatically registered and discovered when any client connects via MCP.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1c1c27] text-zinc-400 border border-[#2e2e3f]">
              {tools.filter((t) => t.enabled).length} active tools
            </span>
          </div>

          <div className="bg-[#181820] border border-[#282834] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tools.map((t) => (
                <div
                  key={t.name}
                  className="p-3 bg-[#13131a] rounded-xl border border-[#252533] flex flex-col justify-between space-y-2 hover:border-[#38384c] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#EA580C]">{t.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e1e2c] text-zinc-400 border border-[#2a2a3e]">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#9c9cb0] mt-1 leading-snug line-clamp-2">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#20202c]">
                    <span className="text-[10px] text-zinc-500 font-mono">JSON-RPC 2.0</span>
                    <button
                      type="button"
                      onClick={() => handleTestPing(t.name)}
                      disabled={isTestingTool}
                      className="px-2 py-1 rounded bg-[#20202c] hover:bg-[#282838] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-[#EA580C]" />
                      <span>Test Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Call Output Drawer */}
            {testOutput && (
              <div className="p-3.5 bg-[#0f0f14] rounded-xl border border-[#282838] font-mono text-xs text-zinc-300 space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MCP Tool Execution Output (Simulated)
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestOutput(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] text-emerald-300/90 leading-relaxed max-h-40">
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================
          MODAL 1: "Connect a client" (Screenshots 4 & 5)
         ========================================================= */}
      {isConnectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsConnectModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#181820] border border-[#2b2b3b] rounded-2xl shadow-2xl overflow-visible text-[#f4f4f5]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Connect a client</h3>
                <p className="text-xs text-[#9c9cb0] mt-1 leading-relaxed">
                  Pick the client you want to connect, then follow the tailored setup steps. When your client connects, S2S asks you to grant it access in a new tab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg text-[#9c9cb0] hover:text-white hover:bg-[#252533] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs (Screenshot 4) */}
            <div className="px-6 border-b border-[#282836] flex items-center gap-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setConnectTab('oauth')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  connectTab === 'oauth'
                    ? 'border-[#EA580C] text-[#EA580C]'
                    : 'border-transparent text-[#9c9cb0] hover:text-white'
                }`}
              >
                OAuth (recommended)
              </button>
              <button
                type="button"
                onClick={() => setConnectTab('apikey')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  connectTab === 'apikey'
                    ? 'border-[#EA580C] text-[#EA580C]'
                    : 'border-transparent text-[#9c9cb0] hover:text-white'
                }`}
              >
                API key
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {connectTab === 'oauth' ? (
                <div className="bg-[#121218] border border-[#262634] rounded-xl divide-y divide-[#262634]">
                  
                  {/* Row 1: Your client dropdown (Screenshots 4 & 5) */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                    <div>
                      <div className="text-xs font-semibold text-white">Your client</div>
                      <div className="text-[11px] text-[#9c9cb0]">
                        Choose your client to see tailored setup steps
                      </div>
                    </div>

                    {/* Client Dropdown Trigger */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        id="btn-client-picker"
                        type="button"
                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#222230] border border-[#343446] text-xs font-semibold text-white min-w-[130px] transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          {selectedClient.includes('Claude') && <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />}
                          {selectedClient.includes('Cursor') && <Code className="w-3.5 h-3.5 text-indigo-400" />}
                          {selectedClient.includes('VS Code') && <Laptop className="w-3.5 h-3.5 text-blue-400" />}
                          {selectedClient.includes('ChatGPT') && <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                          {!['Claude', 'Cursor', 'VS Code', 'ChatGPT'].some((k) => selectedClient.includes(k)) && (
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{selectedClient}</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#9c9cb0]" />
                      </button>

                      {/* Dropdown Menu matching Screenshot 5 */}
                      {isClientDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-48 bg-[#1f1f2a] border border-[#343446] rounded-xl shadow-2xl p-1 z-40 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                          
                          {/* CLI Category */}
                          <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            CLI
                          </div>
                          {(['Claude Code', 'Codex', 'Gemini CLI'] as const).map((cli) => (
                            <button
                              key={cli}
                              type="button"
                              onClick={() => {
                                setSelectedClient(cli);
                                setIsClientDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedClient === cli
                                  ? 'bg-[#EA580C]/15 text-[#EA580C] font-semibold'
                                  : 'text-zinc-300 hover:bg-[#272736] hover:text-white'
                              }`}
                            >
                              <span>{cli}</span>
                              {selectedClient === cli && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
                            </button>
                          ))}

                          <div className="my-1 border-t border-[#2b2b3c]" />

                          {/* WEB Category */}
                          <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            WEB
                          </div>
                          {(['Claude.ai', 'ChatGPT'] as const).map((web) => (
                            <button
                              key={web}
                              type="button"
                              onClick={() => {
                                setSelectedClient(web);
                                setIsClientDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedClient === web
                                  ? 'bg-[#EA580C]/15 text-[#EA580C] font-semibold'
                                  : 'text-zinc-300 hover:bg-[#272736] hover:text-white'
                              }`}
                            >
                              <span>{web}</span>
                              {selectedClient === web && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
                            </button>
                          ))}

                          <div className="my-1 border-t border-[#2b2b3c]" />

                          {/* IDE Category */}
                          <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            IDE
                          </div>
                          {(['Cursor', 'VS Code', 'Windsurf'] as const).map((ide) => (
                            <button
                              key={ide}
                              type="button"
                              onClick={() => {
                                setSelectedClient(ide);
                                setIsClientDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedClient === ide
                                  ? 'bg-[#EA580C]/15 text-[#EA580C] font-semibold'
                                  : 'text-zinc-300 hover:bg-[#272736] hover:text-white'
                              }`}
                            >
                              <span>{ide}</span>
                              {selectedClient === ide && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Client Tailored Action */}
                  {selectedClient === 'Claude.ai' && (
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-white">One-click setup</div>
                        <div className="text-[11px] text-[#9c9cb0]">
                          Add S2S to Claude.ai in one click, then approve access
                        </div>
                      </div>

                      <a
                        href={`https://claude.ai/settings/integrations?mcp=${encodeURIComponent(serverUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#d94e07] text-white text-xs font-semibold transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add to Claude.ai</span>
                      </a>
                    </div>
                  )}

                  {/* Row 3: Server URL (Screenshot 4) */}
                  <div className="p-4 space-y-2">
                    <div>
                      <div className="text-xs font-semibold text-white">Server URL</div>
                      <div className="text-[11px] text-[#9c9cb0]">
                        Paste this into your config to point {selectedClient} at your instance
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-[#0c0c10] border border-[#2a2a38] text-xs font-mono text-zinc-300 truncate select-all">
                        {serverUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(serverUrl, 'server-url')}
                        className="p-2 rounded-lg bg-[#1f1f2c] hover:bg-[#29293a] border border-[#333346] text-white text-xs font-medium transition-colors shrink-0"
                        title="Copy Server URL"
                      >
                        {copiedKey === 'server-url' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tailored Code Snippet for IDE / CLI clients */}
                  {(selectedClient === 'Cursor' || selectedClient === 'VS Code' || selectedClient === 'Windsurf') && (
                    <div className="p-4 space-y-2 bg-[#0c0c10]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-300">
                          {selectedClient === 'Cursor' ? '~/.cursor/mcp.json' : 'mcp.json Configuration'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                {
                                  mcpServers: {
                                    s2s: {
                                      url: serverUrl,
                                      transport: 'http'
                                    }
                                  }
                                },
                                null,
                                2
                              ),
                              'ide-json'
                            )
                          }
                          className="text-[#EA580C] hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedKey === 'ide-json' ? 'Copied JSON!' : 'Copy JSON'}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#14141d] rounded-lg border border-[#252533] text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "s2s": {
      "url": "${serverUrl}",
      "transport": "http"
    }
  }
}`}
                      </pre>
                    </div>
                  )}

                  {selectedClient === 'Claude Code' && (
                    <div className="p-4 space-y-2 bg-[#0c0c10]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-300">Terminal Command</span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(`claude mcp add s2s ${serverUrl}`, 'claude-cmd')
                          }
                          className="text-[#EA580C] hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedKey === 'claude-cmd' ? 'Copied Command!' : 'Copy Command'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-[#14141d] rounded-lg border border-[#252533] text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                        <span>claude mcp add s2s {serverUrl}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: API Key authentication */
                <div className="bg-[#121218] border border-[#262634] rounded-xl p-4 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-white">Generate Instance Access Token</div>
                    <div className="text-[11px] text-[#9c9cb0] mt-0.5">
                      Use a Bearer token for CLI clients, custom agents, or servers that do not support web OAuth redirects.
                    </div>
                  </div>

                  <div className="p-3 bg-[#0d0d12] rounded-lg border border-[#252533] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Token: <strong className="text-white font-mono">s2s_mcp_live_99f2e718b4</strong></span>
                      <span className="text-emerald-400 font-semibold">Scope: Workflows & Tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value="s2s_mcp_live_99f2e718b417c493010b"
                        className="flex-1 px-3 py-1.5 bg-[#161622] border border-[#2f2f42] rounded-lg text-xs font-mono text-zinc-300"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard('s2s_mcp_live_99f2e718b417c493010b', 'api-token')}
                        className="px-3 py-1.5 rounded-lg bg-[#242434] hover:bg-[#2d2d40] text-white text-xs font-semibold"
                      >
                        {copiedKey === 'api-token' ? 'Copied' : 'Copy Token'}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 font-mono">
                    HTTP Header: <span className="text-zinc-200">Authorization: Bearer s2s_mcp_live_...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#14141c] border-t border-[#242434] rounded-b-2xl flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#222230] hover:bg-[#2a2a3c] text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: "Workflows exposed"
         ========================================================= */}
      {isExposedWorkflowsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsExposedWorkflowsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#181820] border border-[#2b2b3b] rounded-2xl shadow-2xl overflow-hidden text-[#f4f4f5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-3 border-b border-[#282836] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Workflows exposed to MCP</h3>
                <p className="text-xs text-[#9c9cb0] mt-0.5">
                  Connected AI clients can view and trigger only the checked workflows below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExposedWorkflowsModalOpen(false)}
                className="p-1 rounded text-[#9c9cb0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter workflows..."
                  value={workflowSearch}
                  onChange={(e) => setWorkflowSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#121218] border border-[#282838] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              {/* Workflows List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-[#222230] border border-[#262634] rounded-xl bg-[#121218]">
                {SAMPLE_WORKFLOWS.filter((w) =>
                  w.name.toLowerCase().includes(workflowSearch.toLowerCase())
                ).map((wf) => {
                  const isChecked = exposedWorkflowIds.includes(wf.id);
                  return (
                    <label
                      key={wf.id}
                      className="p-3 flex items-center justify-between hover:bg-[#181822] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleWorkflowExposed(wf.id)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#EA580C] focus:ring-0 focus:ring-offset-0"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{wf.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {wf.nodes.length} nodes • {wf.active ? 'Active' : 'Draft'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#1c1c28] text-zinc-400 border border-[#2b2b3a]">
                        {wf.id}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-[#14141c] border-t border-[#242434] flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {exposedWorkflowIds.length} of {SAMPLE_WORKFLOWS.length} workflows exposed
              </span>
              <button
                type="button"
                onClick={() => setIsExposedWorkflowsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#d94e07] text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: "Allowed callback URLs"
         ========================================================= */}
      {isAllowedCallbacksModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsAllowedCallbacksModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#181820] border border-[#2b2b3b] rounded-2xl shadow-2xl overflow-hidden text-[#f4f4f5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-3 border-b border-[#282836] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Allowed Callback URLs</h3>
                <p className="text-xs text-[#9c9cb0] mt-0.5">
                  Protect against unauthorized redirect interception during OAuth grant flows.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllowedCallbacksModalOpen(false)}
                className="p-1 rounded text-[#9c9cb0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="callback-mode"
                    checked={callbackMode === 'all'}
                    onChange={() => setCallbackMode('all')}
                    className="text-[#EA580C]"
                  />
                  <div>
                    <div className="font-semibold text-white">Allow all URLs (Default)</div>
                    <div className="text-[11px] text-zinc-500">
                      Suitable for development, local testing, and trusted internal networks.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="radio"
                    name="callback-mode"
                    checked={callbackMode === 'restricted'}
                    onChange={() => setCallbackMode('restricted')}
                    className="text-[#EA580C]"
                  />
                  <div>
                    <div className="font-semibold text-white">Restrict to trusted URLs</div>
                    <div className="text-[11px] text-zinc-500">
                      Block any redirect URL that is not explicitly in the whitelist below.
                    </div>
                  </div>
                </label>
              </div>

              {callbackMode === 'restricted' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://client.domain.com/callback"
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#121218] border border-[#282838] rounded-lg text-white placeholder-zinc-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCallbackUrl}
                      className="px-3 py-1.5 bg-[#252535] hover:bg-[#303042] text-white rounded-lg text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {allowedUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-[#121218] rounded-lg border border-[#252533] flex items-center justify-between text-zinc-300 font-mono text-[11px]"
                      >
                        <span className="truncate">{url}</span>
                        <button
                          type="button"
                          onClick={() => setAllowedUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-rose-400 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#14141c] border-t border-[#242434] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsAllowedCallbacksModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#d94e07] text-white text-xs font-semibold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: "All connected clients"
         ========================================================= */}
      {isConnectedClientsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsConnectedClientsModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#181820] border border-[#2b2b3b] rounded-2xl shadow-2xl overflow-hidden text-[#f4f4f5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-3 border-b border-[#282836] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Active MCP Client Sessions</h3>
                <p className="text-xs text-[#9c9cb0] mt-0.5">
                  Clients currently holding granted OAuth tokens or active stream connections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectedClientsModalOpen(false)}
                className="p-1 rounded text-[#9c9cb0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {connectedClients.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No active client sessions connected. Use the "Connect" button to link Claude, Cursor, or ChatGPT.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {connectedClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3.5 bg-[#121218] border border-[#282838] rounded-xl flex items-center justify-between gap-4 hover:border-[#38384c] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-white">{client.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1f1f2e] text-zinc-400 border border-[#2b2b3f]">
                            {client.transport.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Origin: {client.ipAddress} • Connected: {client.connectedAt} • Ping: {client.lastPing}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeClient(client.id)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#14141c] border-t border-[#242434] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsConnectedClientsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#222230] hover:bg-[#2c2c3e] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
