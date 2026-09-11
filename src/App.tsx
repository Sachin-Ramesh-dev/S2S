import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Workflow,
  WorkflowNode as IWorkflowNode,
  WorkflowConnection,
  NodeDefinition,
  CustomPluginNode,
  VaultCredential,
  SecurityStatus,
  SingleNodeExecution,
  ExecutionRecord
} from './types';
import { BUILTIN_NODES } from './data/builtinNodes';
import { SAMPLE_WORKFLOWS } from './data/sampleWorkflows';
import { DEFAULT_PLUGINS } from './data/defaultPlugins';
import {
  fetchWorkflows,
  saveWorkflow as apiSaveWorkflow,
  deleteWorkflow as apiDeleteWorkflow,
  executeWorkflow as apiExecuteWorkflow,
  fetchPlugins,
  savePlugin as apiSavePlugin,
  deletePlugin as apiDeletePlugin,
  fetchVaultCredentials,
  addVaultCredential as apiAddVaultCredential,
  deleteVaultCredential as apiDeleteVaultCredential,
  fetchSecurityStatus,
  fetchExecutions
} from './services/api';

import { Navbar } from './components/Navbar';
import { Canvas } from './components/Canvas';
import { NodeDrawer } from './components/NodeDrawer';
import { NodePaletteModal } from './components/NodePaletteModal';
import { PluginManagerModal } from './components/PluginManagerModal';
import { VaultModal } from './components/VaultModal';
import { ExecutionHistoryModal } from './components/ExecutionHistoryModal';
import { TemplateModal } from './components/TemplateModal';
import { ShareExportModal } from './components/ShareExportModal';
import { HomePage } from './components/HomePage';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, Database } from 'lucide-react';

export default function App() {
  // Navigation View: 'home' (Overview) or 'canvas' (Visual Workflow Editor)
  const [currentView, setCurrentView] = useState<'home' | 'canvas'>('home');

  // Workflow State
  const [workflows, setWorkflows] = useState<Workflow[]>(SAMPLE_WORKFLOWS);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(SAMPLE_WORKFLOWS[0]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Plugins & Custom Nodes
  const [plugins, setPlugins] = useState<CustomPluginNode[]>(DEFAULT_PLUGINS);

  // Vault & Security
  const [vaultCredentials, setVaultCredentials] = useState<VaultCredential[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    vaultInitialized: true,
    credentialsCount: 0,
    encryptionAlgorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2-SHA256',
    storageMode: 'local_encrypted',
    localStorageLocation: 'data/nodeflow_db.json'
  });

  // Executions
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Record<string, SingleNodeExecution>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // UI Modals & Drawers
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPluginManagerOpen, setIsPluginManagerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Initial Load from Node.js Local Database
  useEffect(() => {
    async function initData() {
      try {
        const [wfs, plgs, creds, sec, execs] = await Promise.all([
          fetchWorkflows(),
          fetchPlugins(),
          fetchVaultCredentials(),
          fetchSecurityStatus(),
          fetchExecutions()
        ]);

        if (wfs && wfs.length > 0) {
          setWorkflows(wfs);
          setCurrentWorkflow(wfs[0]);
        }
        if (plgs && plgs.length > 0) setPlugins(plgs);
        if (creds) setVaultCredentials(creds);
        if (sec) setSecurityStatus(sec);
        if (execs) setExecutions(execs);
      } catch (err) {
        console.warn('Backend initialized with local defaults', err);
      }
    }
    initData();
  }, []);

  // Compute full map of NodeDefinitions: Builtins + Custom Plugins
  const nodeDefinitions = useMemo(() => {
    const map: Record<string, NodeDefinition> = {};
    BUILTIN_NODES.forEach((n) => {
      map[n.type] = n;
    });

    plugins.forEach((p) => {
      const pluginDef: NodeDefinition = {
        type: p.type,
        name: p.name,
        category: 'plugin',
        description: p.description,
        icon: p.icon || 'Code2',
        color: '#6366F1',
        inputs: p.inputs,
        outputs: p.outputs,
        parametersSchema: p.parametersSchema,
        defaultParameters: p.parametersSchema.reduce((acc, cur) => {
          acc[cur.name] = cur.default ?? '';
          return acc;
        }, {} as Record<string, any>),
        isPlugin: true,
        pluginId: p.id
      };
      map[p.type] = pluginDef;
      map[p.id] = pluginDef;
    });

    return map;
  }, [plugins]);

  const allAvailableNodeDefs = useMemo(() => {
    const builtinList = [...BUILTIN_NODES];
    const pluginList = plugins.map((p) => ({
      type: p.type,
      name: p.name,
      category: 'plugin' as const,
      description: p.description,
      icon: p.icon || 'Code2',
      color: '#6366F1',
      inputs: p.inputs,
      outputs: p.outputs,
      parametersSchema: p.parametersSchema,
      defaultParameters: {},
      isPlugin: true,
      pluginId: p.id
    }));
    return [...builtinList, ...pluginList];
  }, [plugins]);

  // Selected Node for Drawer
  const selectedNode = useMemo(() => {
    return currentWorkflow.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [currentWorkflow.nodes, selectedNodeId]);

  const selectedNodeDef = useMemo(() => {
    if (!selectedNode) return undefined;
    return (
      nodeDefinitions[selectedNode.type] ||
      nodeDefinitions[selectedNode.pluginId || '']
    );
  }, [selectedNode, nodeDefinitions]);

  // Show Toast
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((n) => (n?.message === message ? null : n));
    }, 4000);
  };

  // Workflow Handlers
  const handleUpdateNodes = useCallback((newNodes: IWorkflowNode[]) => {
    setCurrentWorkflow((prev) => ({ ...prev, nodes: newNodes }));
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdateConnections = useCallback((newConnections: WorkflowConnection[]) => {
    setCurrentWorkflow((prev) => ({ ...prev, connections: newConnections }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveWorkflow = async () => {
    try {
      const saved = await apiSaveWorkflow(currentWorkflow);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === saved.id ? saved : w))
      );
      setHasUnsavedChanges(false);
      showToast('success', `Saved "${saved.name}" to local database.`);
    } catch (e: any) {
      showToast('error', `Failed to save: ${e.message}`);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionResults({});
    showToast('info', 'Executing workflow pipeline...');

    try {
      // First save if unsaved
      if (hasUnsavedChanges) {
        await apiSaveWorkflow(currentWorkflow);
        setHasUnsavedChanges(false);
      }

      const execRecord = await apiExecuteWorkflow(currentWorkflow.id, currentWorkflow);
      setExecutionResults(execRecord.nodeExecutions || {});
      setExecutions((prev) => [execRecord, ...prev]);

      if (execRecord.status === 'success') {
        showToast(
          'success',
          `Workflow completed successfully in ${execRecord.durationMs || 0}ms`
        );
      } else {
        showToast('error', `Execution stopped with error: ${execRecord.error || 'Unknown'}`);
      }
    } catch (err: any) {
      showToast('error', `Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddNodeToCanvas = (definition: NodeDefinition) => {
    // Determine position: place near center with slight offset
    const existingCount = currentWorkflow.nodes.length;
    const posX = 120 + (existingCount % 4) * 280;
    const posY = 150 + Math.floor(existingCount / 4) * 160;

    const newNode: IWorkflowNode = {
      id: `node-${Date.now()}`,
      type: definition.type,
      pluginId: definition.pluginId,
      name: definition.name,
      position: { x: posX, y: posY },
      parameters: { ...definition.defaultParameters }
    };

    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setHasUnsavedChanges(true);
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateNode = (updated: IWorkflowNode) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updated.id ? updated : n))
    }));
    setHasUnsavedChanges(true);
  };

  const handleNewWorkflow = () => {
    const newWf: Workflow = {
      id: `wf-${Date.now()}`,
      name: 'Untitled Automation',
      description: 'Privacy-first workflow built with NodeFlow.',
      active: true,
      nodes: [
        {
          id: `node-manual-${Date.now()}`,
          type: 'manualTrigger',
          name: 'Manual Trigger',
          position: { x: 100, y: 220 },
          parameters: {
            payload: JSON.stringify({ message: 'Pipeline started', timestamp: new Date().toISOString() }, null, 2)
          }
        }
      ],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => [newWf, ...prev]);
    setCurrentWorkflow(newWf);
    setHasUnsavedChanges(true);
    setSelectedNodeId(null);
    setExecutionResults({});
    setCurrentView('canvas');
    showToast('info', 'Created new empty workflow');
  };

  const handleDuplicateWorkflow = async (wf: Workflow) => {
    const duplicated: Workflow = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const saved = await apiSaveWorkflow(duplicated);
      setWorkflows((prev) => [saved, ...prev]);
      showToast('success', `Duplicated "${wf.name}"`);
    } catch (e: any) {
      setWorkflows((prev) => [duplicated, ...prev]);
      showToast('info', `Duplicated "${wf.name}" locally`);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await apiDeleteWorkflow(workflowId);
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
      if (currentWorkflow.id === workflowId && workflows.length > 1) {
        setCurrentWorkflow(workflows.find((w) => w.id !== workflowId) || workflows[0]);
      }
      showToast('info', 'Workflow deleted from database');
    } catch (e: any) {
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
      showToast('info', 'Workflow deleted locally');
    }
  };

  const handleRenameWorkflowDirect = async (wf: Workflow, newName: string) => {
    const updated = { ...wf, name: newName, updatedAt: new Date().toISOString() };
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)));
    if (currentWorkflow.id === wf.id) {
      setCurrentWorkflow(updated);
    }
    try {
      await apiSaveWorkflow(updated);
      showToast('success', `Renamed to "${newName}"`);
    } catch (e: any) {
      showToast('info', `Renamed locally to "${newName}"`);
    }
  };

  const handleToggleWorkflowPublished = async (wf: Workflow) => {
    const isNowPublished = !wf.published;
    const updated = {
      ...wf,
      published: isNowPublished,
      active: isNowPublished,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)));
    if (currentWorkflow.id === wf.id) {
      setCurrentWorkflow(updated);
    }
    try {
      await apiSaveWorkflow(updated);
      showToast('success', `Workflow is now ${isNowPublished ? 'Published' : 'Draft'}`);
    } catch (e: any) {
      showToast('info', `Status updated to ${isNowPublished ? 'Published' : 'Draft'}`);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWorkflow();
      }
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsPaletteOpen(false);
        setIsPluginManagerOpen(false);
        setIsVaultOpen(false);
        setIsHistoryOpen(false);
        setIsTemplatesOpen(false);
        setIsShareOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div id="nodeflow-app-root" className="h-screen w-screen flex flex-col bg-[#0e0e11] text-[#f4f4f5] overflow-hidden font-sans">
      {currentView === 'home' ? (
        <HomePage
          workflows={workflows}
          executions={executions}
          vaultCredentials={vaultCredentials}
          securityStatus={securityStatus}
          onOpenWorkflow={(wf) => {
            setCurrentWorkflow(wf);
            setCurrentView('canvas');
            setExecutionResults({});
          }}
          onCreateWorkflow={() => {
            handleNewWorkflow();
            setCurrentView('canvas');
          }}
          onDuplicateWorkflow={handleDuplicateWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onRenameWorkflow={handleRenameWorkflowDirect}
          onToggleWorkflowPublished={handleToggleWorkflowPublished}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onOpenVault={() => setIsVaultOpen(true)}
          onOpenShare={(wf) => {
            setCurrentWorkflow(wf);
            setIsShareOpen(true);
          }}
        />
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            workflow={currentWorkflow}
            allWorkflows={workflows}
            hasUnsavedChanges={hasUnsavedChanges}
            isExecuting={isExecuting}
            onNavigateHome={() => setCurrentView('home')}
            onSelectWorkflow={(wf) => {
              setCurrentWorkflow(wf);
              setHasUnsavedChanges(false);
              setSelectedNodeId(null);
              setExecutionResults({});
            }}
            onNewWorkflow={handleNewWorkflow}
            onRenameWorkflow={(name) => {
              setCurrentWorkflow((prev) => ({ ...prev, name }));
              setHasUnsavedChanges(true);
            }}
            onSaveWorkflow={handleSaveWorkflow}
            onExecuteWorkflow={handleExecuteWorkflow}
            onOpenPalette={() => setIsPaletteOpen(true)}
            onOpenPluginManager={() => setIsPluginManagerOpen(true)}
            onOpenVault={() => setIsVaultOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onOpenShare={() => setIsShareOpen(true)}
          />

          {/* Main Canvas Area */}
          <main className="flex-1 relative overflow-hidden">
            <Canvas
              workflow={currentWorkflow}
              nodeDefinitions={nodeDefinitions}
              executionResults={executionResults}
              isExecuting={isExecuting}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                if (!nodeId) setIsDrawerOpen(false);
              }}
              onUpdateNodes={handleUpdateNodes}
              onUpdateConnections={handleUpdateConnections}
              onOpenDrawer={(node) => {
                setSelectedNodeId(node.id);
                setIsDrawerOpen(true);
              }}
              onOpenPalette={() => setIsPaletteOpen(true)}
            />

            {/* Node Configuration & Data Inspector Drawer */}
            {isDrawerOpen && selectedNode && (
              <NodeDrawer
                node={selectedNode}
                definition={selectedNodeDef}
                workflowId={currentWorkflow.id}
                executionState={executionResults[selectedNode.id]}
                vaultCredentials={vaultCredentials}
                onClose={() => setIsDrawerOpen(false)}
                onUpdateNode={handleUpdateNode}
              />
            )}
          </main>
        </>
      )}

      {/* Node Catalog Modal */}
      <NodePaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        availableNodes={allAvailableNodeDefs}
        onAddNode={handleAddNodeToCanvas}
        onOpenPluginManager={() => setIsPluginManagerOpen(true)}
      />

      {/* Custom Node Plugin Developer Studio */}
      <PluginManagerModal
        isOpen={isPluginManagerOpen}
        onClose={() => setIsPluginManagerOpen(false)}
        plugins={plugins}
        onSavePlugin={async (plugin) => {
          const saved = await apiSavePlugin(plugin);
          setPlugins((prev) => {
            const idx = prev.findIndex((p) => p.id === saved.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = saved;
              return copy;
            }
            return [...prev, saved];
          });
          showToast('success', `Plugin "${plugin.name}" compiled and saved to local DB`);
        }}
        onDeletePlugin={async (pluginId) => {
          await apiDeletePlugin(pluginId);
          setPlugins((prev) => prev.filter((p) => p.id !== pluginId));
          showToast('info', 'Plugin removed');
        }}
      />

      {/* End-to-End Encryption & Security Vault Modal */}
      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        securityStatus={securityStatus}
        credentials={vaultCredentials}
        onAddCredential={async (name, type, secretValue, passphrase) => {
          const newCred = await apiAddVaultCredential(name, type, secretValue, passphrase);
          setVaultCredentials((prev) => [...prev, newCred]);
          showToast('success', `Credential "${name}" encrypted with AES-256-GCM and stored.`);
        }}
        onDeleteCredential={async (id) => {
          await apiDeleteVaultCredential(id);
          setVaultCredentials((prev) => prev.filter((c) => c.id !== id));
          showToast('info', 'Credential removed from vault.');
        }}
      />

      {/* Execution Audit History Modal */}
      <ExecutionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        executions={executions}
        onRefresh={async () => {
          const data = await fetchExecutions();
          setExecutions(data);
        }}
      />

      {/* Workflow Templates Modal */}
      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(template) => {
          const loaded: Workflow = {
            ...template,
            id: `wf-${Date.now()}`,
            name: `${template.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setWorkflows((prev) => [loaded, ...prev]);
          setCurrentWorkflow(loaded);
          setHasUnsavedChanges(true);
          setExecutionResults({});
          showToast('success', `Loaded template: ${template.name}`);
        }}
      />

      {/* Share & Encrypted Export Modal */}
      <ShareExportModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        workflow={currentWorkflow}
        onImportSuccess={(imported) => {
          setWorkflows((prev) => [imported, ...prev]);
          setCurrentWorkflow(imported);
          setHasUnsavedChanges(false);
          setExecutionResults({});
          showToast('success', `Imported workflow "${imported.name}" successfully.`);
        }}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-60 px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-300'
              : 'bg-neutral-900/90 border-neutral-700 text-neutral-200'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
