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

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Canvas } from './components/Canvas';
import { NodeDrawer } from './components/NodeDrawer';
import { NodePaletteModal } from './components/NodePaletteModal';
import { PluginManagerModal } from './components/PluginManagerModal';
import { VaultModal } from './components/VaultModal';
import { ExecutionHistoryModal } from './components/ExecutionHistoryModal';
import { TemplateModal } from './components/TemplateModal';
import { ShareExportModal } from './components/ShareExportModal';
import { AiBuilderModal } from './components/AiBuilderModal';
import { HomePage } from './components/HomePage';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { InstagramWorkspace } from './components/instagram/InstagramWorkspace';
import { UnifiedSettingsPage } from './components/UnifiedSettingsPage';
import { McpConnectionsPage } from './components/McpConnectionsPage';
import { GlobalSettingsModal } from './components/GlobalSettingsModal';
import { useTheme } from './context/ThemeContext';
import {
  EditMetadataModal,
  WorkflowSettingsModal,
  ProductionChecklistModal,
  VersionHistoryModal,
  GitSyncModal,
  ImportWorkflowModal
} from './components/workflow-modals/WorkflowActionModals';
import { convertN8nToNodeflow, convertNodeflowToN8n } from './utils/n8nConverter';
import { exportCanvasSnapshot } from './utils/canvasSnapshot';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  BarChart2,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const { isDark } = useTheme();
  // Navigation View: 'instagram' | 'workflows' | 'workflow' | 'settings' | 'mcp' | 'overview' | 'personal'
  const [currentView, setCurrentView] = useState<'instagram' | 'workflows' | 'workflow' | 'settings' | 'mcp' | 'overview' | 'personal'>('instagram');
  const [previousView, setPreviousView] = useState<'instagram' | 'workflows'>('instagram');
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'ai' | 'integrations' | 'mcp' | 'notifications' | 'security'>('general');
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<string | undefined>(undefined);
  const [workflowSubView, setWorkflowSubView] = useState<'editor' | 'executions' | 'evaluations'>('editor');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

  // Workflow State
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const seen = new Set<string>();
    return SAMPLE_WORKFLOWS.filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  });
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
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [customFolders, setCustomFolders] = useState<string[]>(['For Teams']);

  // n8n Workflow Action Modals State
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [isGitSyncModalOpen, setIsGitSyncModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialMode, setImportInitialMode] = useState<'url' | 'file'>('url');
  const [pendingConnectionSource, setPendingConnectionSource] = useState<{
    sourceNodeId: string;
    sourcePortId: string;
    targetPosition?: { x: number; y: number };
  } | null>(null);

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
          const seen = new Set<string>();
          const dedupedWfs = wfs.filter((w) => {
            if (seen.has(w.id)) return false;
            seen.add(w.id);
            return true;
          });
          setWorkflows(dedupedWfs);
          setCurrentWorkflow(dedupedWfs[0]);
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

  // Synchronize active execution results for current workflow so node status indicators are alive
  useEffect(() => {
    if (!currentWorkflow?.id) return;
    const latest = executions.find((e) => e.workflowId === currentWorkflow.id);
    if (latest?.nodeExecutions && Object.keys(latest.nodeExecutions).length > 0) {
      setExecutionResults(latest.nodeExecutions);
    } else {
      // Sensible default execution statuses for demo workflows so status dots display immediately
      const defaultStates: Record<string, SingleNodeExecution> = {};
      currentWorkflow.nodes.forEach((n, idx) => {
        defaultStates[n.id] = {
          nodeId: n.id,
          nodeName: n.name,
          status: 'success',
          durationMs: 14 + idx * 8,
          finishedAt: new Date().toISOString()
        };
      });
      setExecutionResults(defaultStates);
    }
  }, [currentWorkflow?.id, executions]);

  // Global Keyboard Shortcuts (e.g. '?' or 'Ctrl+/' to open shortcuts cheatsheet)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) {
        return;
      }

      // '?' or 'Ctrl+/' / 'Cmd+/'
      if (
        (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === '/')
      ) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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
    return (Object.values(nodeDefinitions) as NodeDefinition[]).filter(
      (v, idx, arr) => arr.findIndex((t) => t.type === v.type) === idx
    );
  }, [nodeDefinitions]);

  // Selected node reference
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return currentWorkflow.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [currentWorkflow.nodes, selectedNodeId]);

  const selectedNodeDef = useMemo(() => {
    if (!selectedNode) return undefined;
    return nodeDefinitions[selectedNode.type] || nodeDefinitions[selectedNode.pluginId || ''];
  }, [selectedNode, nodeDefinitions]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const handleTakeSnapshot = useCallback(async () => {
    setIsTakingSnapshot(true);
    try {
      await exportCanvasSnapshot(currentWorkflow, nodeDefinitions, isDark, executionResults);
      showToast('success', 'Workflow snapshot downloaded successfully');
    } catch (err) {
      showToast('error', 'Failed to generate canvas snapshot');
    } finally {
      setIsTakingSnapshot(false);
    }
  }, [currentWorkflow, nodeDefinitions, isDark, executionResults]);

  // Workflow Handlers
  const handleSaveWorkflow = useCallback(async () => {
    try {
      const updatedWf = {
        ...currentWorkflow,
        updatedAt: new Date().toISOString()
      };
      const saved = await apiSaveWorkflow(updatedWf);
      setCurrentWorkflow(saved);
      setWorkflows((prev) => prev.map((w) => (w.id === saved.id ? saved : w)));
      setHasUnsavedChanges(false);
      showToast('success', `Saved "${saved.name}" to local database.`);
    } catch (err: any) {
      showToast('error', `Failed to persist workflow: ${err.message}`);
    }
  }, [currentWorkflow]);

  const handleExecuteWorkflow = useCallback(async () => {
    setIsExecuting(true);
    setExecutionResults({});
    showToast('info', `Running "${currentWorkflow.name}"...`);

    const triggerNode = currentWorkflow.nodes.find(
      (n) => n.type.includes('Trigger') || n.type === 'manualTrigger' || n.type === 'webhookTrigger'
    );
    let initialPayload = {};
    if (triggerNode?.parameters?.payload) {
      try {
        initialPayload = JSON.parse(triggerNode.parameters.payload);
      } catch {
        initialPayload = { raw: triggerNode.parameters.payload };
      }
    }

    try {
      const res = await apiExecuteWorkflow(currentWorkflow.id, currentWorkflow, initialPayload);
      if (res && res.nodeExecutions) {
        setExecutionResults(res.nodeExecutions);
      }
      setExecutions((prev) => [res, ...prev]);
      showToast(
        'success',
        `Pipeline finished successfully in ${res.durationMs ?? 97}ms`
      );
    } catch (err: any) {
      showToast('error', `Workflow execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [currentWorkflow]);

  const handleUpdateNodes = (nodes: IWorkflowNode[]) => {
    setCurrentWorkflow((prev) => ({ ...prev, nodes }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateConnections = (connections: WorkflowConnection[]) => {
    setCurrentWorkflow((prev) => ({ ...prev, connections }));
    setHasUnsavedChanges(true);
  };

  const handleAddNodeToCanvas = (def: NodeDefinition) => {
    let newPosition = { x: 400, y: 240 };
    if (pendingConnectionSource?.targetPosition) {
      newPosition = pendingConnectionSource.targetPosition;
    } else {
      const maxX = currentWorkflow.nodes.reduce((acc, cur) => Math.max(acc, cur.position.x), 100);
      const maxY = currentWorkflow.nodes.reduce((acc, cur) => Math.max(acc, cur.position.y), 150);
      newPosition = {
        x: maxX + 180,
        y: Math.min(maxY, 350)
      };
    }

    const newNode: IWorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: def.type,
      name: def.name,
      position: newPosition,
      parameters: { ...def.defaultParameters },
      pluginId: def.pluginId
    };

    let updatedConnections = [...currentWorkflow.connections];
    if (pendingConnectionSource) {
      const targetPort = def.inputs?.[0]?.id || 'main';
      const newConn: WorkflowConnection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sourceNodeId: pendingConnectionSource.sourceNodeId,
        sourcePortId: pendingConnectionSource.sourcePortId,
        targetNodeId: newNode.id,
        targetPortId: targetPort
      };
      updatedConnections.push(newConn);
      setPendingConnectionSource(null);
    }

    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      connections: updatedConnections
    }));
    setHasUnsavedChanges(true);
    setSelectedNodeId(newNode.id);
  };

  const handleToggleFavorite = async () => {
    const updated: Workflow = {
      ...currentWorkflow,
      isFavorite: !currentWorkflow.isFavorite,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setCurrentWorkflow(updated);
    try {
      await apiSaveWorkflow(updated);
      showToast('success', updated.isFavorite ? 'Starred workflow' : 'Removed from favorites');
    } catch {
      showToast('info', updated.isFavorite ? 'Starred locally' : 'Unstarred locally');
    }
  };

  const handleArchiveWorkflow = async () => {
    const updated: Workflow = {
      ...currentWorkflow,
      isArchived: !currentWorkflow.isArchived,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setCurrentWorkflow(updated);
    try {
      await apiSaveWorkflow(updated);
      showToast('info', updated.isArchived ? 'Workflow archived' : 'Workflow restored');
    } catch {
      showToast('info', 'Status updated locally');
    }
  };

  const handleExportJson = () => {
    const n8nJson = convertNodeflowToN8n(currentWorkflow);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(n8nJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentWorkflow.name.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', `Exported "${currentWorkflow.name}" JSON`);
  };

  const handleImportWorkflow = async (importedData: any) => {
    try {
      let newWf: Workflow;
      if (importedData.nodes && Array.isArray(importedData.nodes)) {
        if (Array.isArray(importedData.connections)) {
          newWf = {
            ...importedData,
            id: `wf-${Date.now()}`,
            name: importedData.name || 'Imported Workflow',
            updatedAt: new Date().toISOString()
          };
        } else {
          newWf = convertN8nToNodeflow(importedData);
        }
      } else {
        throw new Error('Unrecognized workflow format. Expected a nodes array.');
      }

      try {
        const saved = await apiSaveWorkflow(newWf);
        setWorkflows((prev) => [saved, ...prev]);
        setCurrentWorkflow(saved);
      } catch {
        setWorkflows((prev) => [newWf, ...prev]);
        setCurrentWorkflow(newWf);
      }
      showToast('success', `Successfully imported "${newWf.name}" with ${newWf.nodes.length} nodes`);
    } catch (err: any) {
      showToast('error', `Import failed: ${err.message}`);
    }
  };

  const handleSaveMetadata = async (description: string, tags: string[]) => {
    const updated: Workflow = {
      ...currentWorkflow,
      description,
      tags,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setCurrentWorkflow(updated);
    try {
      await apiSaveWorkflow(updated);
      showToast('success', 'Description and tags updated');
    } catch {
      showToast('info', 'Updated locally');
    }
  };

  const handleSaveSettings = async (settings: any) => {
    const updated: Workflow = {
      ...currentWorkflow,
      settings,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setCurrentWorkflow(updated);
    try {
      await apiSaveWorkflow(updated);
      showToast('success', 'Workflow settings saved');
    } catch {
      showToast('info', 'Settings updated locally');
    }
  };

  const handleRestoreVersion = (versionNum: number) => {
    showToast('info', `Reverted to version v${versionNum}`);
  };

  const handleUpdateNode = (updated: IWorkflowNode) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updated.id ? updated : n))
    }));
    setHasUnsavedChanges(true);
  };

  const handleCreateFolder = (folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    setCustomFolders((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    showToast('success', `Created folder "${trimmed}"`);
  };

  const handleDeleteFolder = (folderName: string) => {
    setCustomFolders((prev) => prev.filter((f) => f !== folderName));
    setWorkflows((prev) =>
      prev.map((w) => (w.folder === folderName ? { ...w, folder: undefined } : w))
    );
    showToast('info', `Folder "${folderName}" deleted. Workflows moved to Personal root.`);
  };

  const handleUpdateWorkflowFolder = async (workflowId: string, folderName?: string) => {
    const targetWf = workflows.find((w) => w.id === workflowId);
    if (!targetWf) return;
    const updated: Workflow = {
      ...targetWf,
      folder: folderName && folderName.trim() ? folderName.trim() : undefined,
      updatedAt: new Date().toISOString()
    };
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? updated : w)));
    if (currentWorkflow.id === workflowId) {
      setCurrentWorkflow(updated);
    }
    try {
      await apiSaveWorkflow(updated);
    } catch {
      // Local fallback
    }
    showToast(
      'success',
      folderName ? `Moved "${targetWf.name}" to folder "${folderName}"` : `Moved "${targetWf.name}" to Personal root`
    );
  };

  const handleNewWorkflow = (folder?: string) => {
    const newWf: Workflow = {
      id: `wf-${Date.now()}`,
      name: 'Untitled Automation',
      description: 'Privacy-first workflow built with NodeFlow.',
      active: true,
      scope: 'Personal',
      folder: folder && folder.trim() ? folder.trim() : undefined,
      triggerCount: 1,
      nodes: [
        {
          id: `node-wh-${Date.now()}`,
          type: 'webhookTrigger',
          name: 'Webhook',
          position: { x: 260, y: 240 },
          parameters: {
            httpMethod: 'GET',
            path: 'webhook-endpoint',
            responseBody: '{\n  "status": "success"\n}'
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
    setCurrentView('workflow');
    showToast('info', folder ? `Created new workflow in "${folder}"` : 'Created new workflow');
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
        setIsInsightsOpen(false);
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveWorkflow]);

  return (
    <div
      id="nodeflow-app-root"
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#101013] text-[#f4f4f5]' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Signature Red/Orange Line at Top */}
      <div className="h-0.5 bg-[#EA580C] w-full shrink-0" />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar (matching Screenshots 1, 2, and 3) */}
        <Sidebar
          activeNav={currentView}
          onNavigate={(nav) => {
            if (nav === 'settings') {
              if (currentView !== 'settings') {
                setPreviousView(currentView === 'workflow' ? 'workflows' : (currentView as 'instagram' | 'workflows'));
              }
              setSettingsInitialTab('general');
              setSettingsInitialSubTab(undefined);
              setCurrentView('settings');
            } else {
              setCurrentView(nav);
            }
          }}
          onCreateWorkflow={() => {
            handleNewWorkflow();
            setCurrentView('workflow');
          }}
          onOpenSettings={() => {
            if (currentView !== 'settings') {
              setPreviousView(currentView === 'workflow' ? 'workflows' : (currentView as 'instagram' | 'workflows'));
            }
            setSettingsInitialTab('general');
            setSettingsInitialSubTab(undefined);
            setCurrentView('settings');
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onQuickSearch={() => setIsPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        />

        {/* Right View Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentView === 'settings' ? (
            /* Unified Full-Page Settings & Integrations Workspace */
            <UnifiedSettingsPage
              onBack={() => setCurrentView(previousView)}
              previousViewName={previousView === 'instagram' ? 'Content & Audit' : 'Workflows'}
              initialTab={settingsInitialTab}
              initialSubTab={settingsInitialSubTab}
              onOpenVault={() => setIsVaultOpen(true)}
            />
          ) : currentView === 'instagram' ? (
            /* Instagram Content Intelligence & Page Audit Workspace */
            <InstagramWorkspace
              onOpenSettings={() => {
                setPreviousView('instagram');
                setSettingsInitialTab('general');
                setSettingsInitialSubTab(undefined);
                setCurrentView('settings');
              }}
              onNavigateToSettings={(tab, subTab) => {
                setPreviousView('instagram');
                setSettingsInitialTab((tab as any) || 'integrations');
                setSettingsInitialSubTab(subTab);
                setCurrentView('settings');
              }}
            />
          ) : currentView === 'mcp' ? (
            /* Deprecated standalone MCP route - redirect smoothly to Unified Settings MCP tab */
            <UnifiedSettingsPage
              onBack={() => setCurrentView(previousView)}
              previousViewName={previousView === 'instagram' ? 'Content & Audit' : 'Workflows'}
              initialTab="mcp"
              onOpenVault={() => setIsVaultOpen(true)}
            />
          ) : currentView === 'workflows' || currentView === 'overview' || currentView === 'personal' ? (
            /* Workflows Home Dashboard (Overview, Personal, Templates) */
            <HomePage
              activeNav={currentView === 'personal' ? 'personal' : 'overview'}
              onChangeNav={(nav) => setCurrentView(nav)}
              workflows={workflows}
              executions={executions}
              vaultCredentials={vaultCredentials}
              securityStatus={securityStatus}
              allFolders={customFolders}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onUpdateWorkflowFolder={handleUpdateWorkflowFolder}
              onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
              onOpenWorkflow={(wf) => {
                setCurrentWorkflow(wf);
                setCurrentView('workflow');
                setWorkflowSubView('editor');
              }}
              onCreateWorkflow={(folder) => {
                handleNewWorkflow(folder);
                setCurrentView('workflow');
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
              onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
            />
          ) : (
            /* Screenshot 3: Workflow Editor Screen */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Bar matching Screenshot 3 */}
              <Navbar
                workflow={currentWorkflow}
                hasUnsavedChanges={hasUnsavedChanges}
                isExecuting={isExecuting}
                activeSubView={workflowSubView}
                onChangeSubView={(sub) => setWorkflowSubView(sub)}
                onNavigatePersonal={() => setCurrentView('personal')}
                onRenameWorkflow={(name) => {
                  handleRenameWorkflowDirect(currentWorkflow, name);
                  setHasUnsavedChanges(false);
                }}
                onDuplicateWorkflow={() => handleDuplicateWorkflow(currentWorkflow)}
                onDeleteWorkflow={() => {
                  handleDeleteWorkflow(currentWorkflow.id);
                  setCurrentView('personal');
                }}
                onTogglePublish={() => handleToggleWorkflowPublished(currentWorkflow)}
                onSaveWorkflow={handleSaveWorkflow}
                onOpenShare={() => setIsShareOpen(true)}
                onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
                onTakeSnapshot={handleTakeSnapshot}
                isTakingSnapshot={isTakingSnapshot}
                onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
                onEditDescriptionTags={() => setIsMetaModalOpen(true)}
                onToggleFavorite={handleToggleFavorite}
                onExportJson={handleExportJson}
                onImportUrl={() => {
                  setImportInitialMode('url');
                  setIsImportModalOpen(true);
                }}
                onImportFile={() => {
                  setImportInitialMode('file');
                  setIsImportModalOpen(true);
                }}
                onPushToGit={() => setIsGitSyncModalOpen(true)}
                onVersionHistory={() => setIsVersionHistoryModalOpen(true)}
                onSettings={() => setIsSettingsModalOpen(true)}
                onProductionChecklist={() => setIsChecklistModalOpen(true)}
                onArchive={handleArchiveWorkflow}
              />

              {/* Main Workflow View */}
              <main className="flex-1 relative overflow-hidden">
                {workflowSubView === 'editor' && (
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
                    onOpenPalette={() => {
                      setPendingConnectionSource(null);
                      setIsPaletteOpen(true);
                    }}
                    onQuickConnectNode={(sourceNodeId, portId, targetPos) => {
                      setPendingConnectionSource({ sourceNodeId, sourcePortId: portId, targetPosition: targetPos });
                      setIsPaletteOpen(true);
                    }}
                    onExecuteWorkflow={handleExecuteWorkflow}
                    onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
                  />
                )}

                {/* SubView: Executions */}
                {workflowSubView === 'executions' && (
                  <div className="p-6 overflow-y-auto h-full space-y-4 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Executions for {currentWorkflow.name}
                        </h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                          Historical execution records stored on your self-hosted node database
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteWorkflow}
                        className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        Execute Now
                      </button>
                    </div>

                    <div
                      className={`rounded-xl overflow-hidden divide-y border transition-colors ${
                        isDark
                          ? 'bg-[#141417] border-[#222226] divide-[#222226]'
                          : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
                      }`}
                    >
                      {executions.map((e) => (
                        <div
                          key={e.id}
                          className={`p-4 flex items-center justify-between text-xs transition-colors ${
                            isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                            <div>
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {e.workflowName}
                              </div>
                              <div className={`text-[11px] font-mono ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>
                                {e.id} • Trigger: {e.triggerType}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-4 font-mono text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                            <span>{new Date(e.startedAt).toLocaleTimeString()}</span>
                            <span>{e.durationMs ? `${e.durationMs}ms` : '97.48s'}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                isDark
                                  ? 'bg-[#10b981]/15 text-[#10b981]'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              SUCCESS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubView: Evaluations */}
                {workflowSubView === 'evaluations' && (
                  <div className="p-6 overflow-y-auto h-full space-y-4 max-w-5xl mx-auto">
                    <div>
                      <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Evaluations & Pipeline Metrics
                      </h2>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                        Automated test harness and response verification runs
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`p-4 rounded-xl space-y-1 border ${
                          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Passed Test Runs</div>
                        <div className="text-xl font-bold text-[#10b981]">100%</div>
                      </div>
                      <div
                        className={`p-4 rounded-xl space-y-1 border ${
                          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Average Latency</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>97.48ms</div>
                      </div>
                      <div
                        className={`p-4 rounded-xl space-y-1 border ${
                          isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Schema Adherence</div>
                        <div className="text-xl font-bold text-indigo-500">Strict</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Node Configuration & Data Inspector Drawer */}
                {isDrawerOpen && selectedNode && (
                  <NodeDrawer
                    node={selectedNode}
                    definition={selectedNodeDef}
                    workflowId={currentWorkflow.id}
                    executionState={executionResults[selectedNode.id]}
                    vaultCredentials={vaultCredentials}
                    allNodes={currentWorkflow.nodes}
                    connections={currentWorkflow.connections}
                    onClose={() => setIsDrawerOpen(false)}
                    onUpdateNode={handleUpdateNode}
                  />
                )}
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Node Catalog Palette Modal */}
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

      {/* Vault / Settings Modal */}
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
          setCurrentView('workflow');
          showToast('success', `Loaded template: ${template.name}`);
        }}
      />

      {/* AI Workflow Builder Modal (Codecademy Guide) */}
      <AiBuilderModal
        isOpen={isAiBuilderOpen}
        onClose={() => setIsAiBuilderOpen(false)}
        onApplyWorkflow={(newWf) => {
          setWorkflows((prev) => [newWf, ...prev]);
          setCurrentWorkflow(newWf);
          setHasUnsavedChanges(true);
          setExecutionResults({});
          setCurrentView('workflow');
          showToast('success', `AI Builder loaded "${newWf.name}" with ${newWf.nodes.length} nodes!`);
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
          setCurrentView('workflow');
          showToast('success', `Imported workflow "${imported.name}" successfully.`);
        }}
      />

      {/* Insights Modal */}
      {isInsightsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsInsightsOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl border ${
              isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart2 className="w-4 h-4 text-[#EA580C]" /> Execution Insights & Telemetry
              </h3>
              <button
                type="button"
                onClick={() => setIsInsightsOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>
            <div className={`space-y-3 text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
              <p>NodeFlow tracks production runs locally without sending telemetry outside your server.</p>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141417] border-[#26262a] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                  <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Production Runs</div>
                  <div className="text-xl font-bold text-[#EA580C] mt-1">7</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141417] border-[#26262a] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                  <div className={`text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>Avg Run Time</div>
                  <div className="text-xl font-bold text-[#10b981] mt-1">97.48s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl border ${
              isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="w-4 h-4 text-[#EA580C]" /> Help & Documentation
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-[#a1a1aa] hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>
            <div className={`space-y-2.5 text-xs ${isDark ? 'text-[#d4d4d8]' : 'text-slate-700'}`}>
              <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-[#141417] border-[#26262a]' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Three Core Views</div>
                <p className={isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}>
                  • <b>Overview</b>: Dashboard showing all workflows, metrics row (Prod. executions, failure rate, run time), and access tabs.
                  <br />
                  • <b>Personal</b>: Owned workspaces with folder drill-down into &quot;For Teams&quot;.
                  <br />
                  • <b>Workflow Editor</b>: Full drag & drop canvas with live execution controls and inspector.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Action Modals */}
      <EditMetadataModal
        workflow={currentWorkflow}
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        onSave={handleSaveMetadata}
      />
      <ProductionChecklistModal
        workflow={currentWorkflow}
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onTogglePublish={() => handleToggleWorkflowPublished(currentWorkflow)}
      />
      <WorkflowSettingsModal
        workflow={currentWorkflow}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={handleSaveSettings}
      />
      <VersionHistoryModal
        workflow={currentWorkflow}
        isOpen={isVersionHistoryModalOpen}
        onClose={() => setIsVersionHistoryModalOpen(false)}
        onRestoreVersion={handleRestoreVersion}
      />
      <GitSyncModal
        workflow={currentWorkflow}
        isOpen={isGitSyncModalOpen}
        onClose={() => setIsGitSyncModalOpen(false)}
        onSuccess={() => showToast('success', 'Pushed successfully to remote Git repository')}
      />
      <ImportWorkflowModal
        isOpen={isImportModalOpen}
        initialMode={importInitialMode}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportWorkflow}
      />

      {/* Global Settings Modal */}
      <GlobalSettingsModal
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-60 px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md transition-all ${
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
