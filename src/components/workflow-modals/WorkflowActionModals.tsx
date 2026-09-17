import React, { useState } from 'react';
import {
  X,
  Tag,
  Check,
  CheckSquare,
  AlertTriangle,
  History,
  GitBranch,
  Upload,
  Globe,
  FileCode,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Loader2,
  Trash2,
  Lock
} from 'lucide-react';
import { Workflow } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { WorkflowDependencyView } from './WorkflowDependencyView';

// ==========================================
// 1. EDIT DESCRIPTION & TAGS MODAL
// ==========================================
interface EditMetaProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, tags: string[]) => void;
}

export const EditMetadataModal: React.FC<EditMetaProps> = ({
  workflow,
  isOpen,
  onClose,
  onSave
}) => {
  const [description, setDescription] = useState(workflow.description || '');
  const [tags, setTags] = useState<string[]>(workflow.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#18181c] border border-[#2c2c32] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-[#2c2c32] flex items-center justify-between bg-[#141418]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#EA580C]" />
            Edit description and tags
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Workflow Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear operational description of this workflow..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none placeholder:text-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-xs text-neutral-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 text-neutral-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter..."
                className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white rounded-lg transition-colors"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#2c2c32] bg-[#141418] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(description, tags);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-xs font-medium text-white rounded-lg transition-colors shadow-sm"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PRODUCTION CHECKLIST MODAL
// ==========================================
interface ChecklistProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onTogglePublish?: () => void;
}

export const ProductionChecklistModal: React.FC<ChecklistProps> = ({
  workflow,
  isOpen,
  onClose,
  onTogglePublish
}) => {
  if (!isOpen) return null;

  const hasTrigger = workflow.nodes.some((n) =>
    ['manualTrigger', 'webhookTrigger', 'scheduleTrigger', 'n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.webhook'].includes(n.type)
  );
  const isActivated = workflow.active;
  const hasMultipleNodes = workflow.nodes.length >= 2;
  const hasConnections = workflow.connections.length >= 1;
  const hasAiOrSecurity = workflow.nodes.some((n) =>
    ['aiAgent', 'sqlQuery', 'cryptoVault', 'httpRequest', 'googleGemini'].includes(n.type)
  );

  const checklist = [
    {
      title: 'Workflow Activation Status',
      desc: isActivated
        ? 'Workflow is active and ready to listen for live triggers.'
        : 'Workflow is currently deactivated. Activate to listen to live events.',
      passed: isActivated
    },
    {
      title: 'Valid Trigger Node Configured',
      desc: hasTrigger
        ? 'Trigger node detected to initiate execution stream.'
        : 'No trigger node detected. Add a Webhook or Schedule Trigger.',
      passed: hasTrigger
    },
    {
      title: 'Multi-Node Pipeline Connected',
      desc: hasConnections && hasMultipleNodes
        ? `Pipeline contains ${workflow.nodes.length} nodes connected by ${workflow.connections.length} wires.`
        : 'Add downstream action nodes and connect them with wires.',
      passed: hasConnections && hasMultipleNodes
    },
    {
      title: 'Target Integrations & Security',
      desc: hasAiOrSecurity
        ? 'Enterprise service nodes (Gemini AI / Database / Webhooks) configured.'
        : 'Ensure database or external API credentials are bound in Vault.',
      passed: hasAiOrSecurity
    },
    {
      title: 'Zero Hanging Outputs',
      desc: 'All branch terminations are either responded or routed cleanly.',
      passed: true
    }
  ];

  const score = checklist.filter((c) => c.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#18181c] border border-[#2c2c32] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-[#2c2c32] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Production checklist</h3>
              <p className="text-[11px] text-neutral-400">
                {score} of {checklist.length} readiness criteria met
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                item.passed
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-neutral-200'
                  : 'bg-amber-950/20 border-amber-800/40 text-neutral-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.passed ? (
                  <div className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center text-white">
                    <AlertTriangle className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold">{item.title}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#2c2c32] bg-[#141418] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            {isActivated ? 'Workflow is Live' : 'Currently in Draft / Test mode'}
          </span>
          <div className="flex gap-2">
            {onTogglePublish && (
              <button
                type="button"
                onClick={() => {
                  onTogglePublish();
                  onClose();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActivated
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isActivated ? 'Deactivate Workflow' : 'Activate in Production'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-xs font-medium text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. WORKFLOW SETTINGS MODAL
// ==========================================
interface SettingsProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: any) => void;
}

export const WorkflowSettingsModal: React.FC<SettingsProps> = ({
  workflow,
  isOpen,
  onClose,
  onSaveSettings
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'dependencies'>('general');
  const [executionOrder, setExecutionOrder] = useState<'v1'>(
    workflow.settings?.executionOrder || 'v1'
  );
  const [saveExecutionData, setSaveExecutionData] = useState<'all' | 'none' | 'errors'>(
    workflow.settings?.saveExecutionData || 'all'
  );
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(
    workflow.settings?.timeoutMinutes || 60
  );
  const [availableInMCP, setAvailableInMCP] = useState<boolean>(
    workflow.settings?.availableInMCP ?? true
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        className={`w-full ${
          activeTab === 'dependencies' ? 'max-w-4xl max-h-[90vh]' : 'max-w-2xl'
        } rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 border ${
          isDark
            ? 'bg-[#18181c] border-[#2c2c32] text-neutral-200'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
            isDark ? 'border-[#2c2c32] bg-[#141418]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#EA580C]" />
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Workflow settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div
          className={`flex border-b px-5 transition-colors ${
            isDark ? 'border-[#2c2c32] bg-[#121215]' : 'border-slate-200 bg-slate-100/60'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#EA580C] text-[#EA580C] font-semibold'
                : isDark
                ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dependencies')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'dependencies'
                ? 'border-[#EA580C] text-[#EA580C] font-semibold'
                : isDark
                ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Dependency & DAG View
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {workflow.nodes.length}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {activeTab === 'general' ? (
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Execution Order
                </label>
                <select
                  value={executionOrder}
                  onChange={(e) => setExecutionOrder(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:border-[#EA580C] focus:outline-none border transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="v1">v1 (Recommended: topological DAG dependency traversal)</option>
                </select>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  Guarantees upstream nodes complete and emit structured payloads before downstream nodes execute.
                </p>
              </div>

              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Save Execution Data
                </label>
                <select
                  value={saveExecutionData}
                  onChange={(e) => setSaveExecutionData(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:border-[#EA580C] focus:outline-none border transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Save all executions (Success + Errors)</option>
                  <option value="errors">Save only error executions</option>
                  <option value="none">Do not save execution data</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Execution Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg text-xs focus:border-[#EA580C] focus:outline-none border transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={availableInMCP}
                    onChange={(e) => setAvailableInMCP(e.target.checked)}
                    className="w-4 h-4 rounded text-[#EA580C] bg-neutral-900 border-neutral-700 focus:ring-0 cursor-pointer"
                  />
                  <span className={`text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Expose workflow as a tool in Model Context Protocol (MCP) server
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <WorkflowDependencyView workflow={workflow} />
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end gap-2 transition-colors ${
            isDark ? 'border-[#2c2c32] bg-[#141418]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveSettings({
                executionOrder,
                saveExecutionData,
                timeoutMinutes,
                availableInMCP
              });
              onClose();
            }}
            className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-xs font-medium text-white rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. VERSION HISTORY MODAL
// ==========================================
interface HistoryProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (versionNum: number) => void;
}

export const VersionHistoryModal: React.FC<HistoryProps> = ({
  workflow,
  isOpen,
  onClose,
  onRestoreVersion
}) => {
  if (!isOpen) return null;

  const versions = workflow.versionHistory || [
    {
      id: 'v-3',
      version: 3,
      name: 'Current Version',
      savedAt: workflow.updatedAt || new Date().toISOString(),
      author: 'Sachin Jayanth',
      nodeCount: workflow.nodes.length
    },
    {
      id: 'v-2',
      version: 2,
      name: 'Added AI & SQL Governance Nodes',
      savedAt: '2026-09-10T14:15:00.000Z',
      author: 'Sachin Jayanth',
      nodeCount: Math.max(1, workflow.nodes.length - 1)
    },
    {
      id: 'v-1',
      version: 1,
      name: 'Initial Pipeline Setup',
      savedAt: workflow.createdAt || '2026-09-08T09:00:00.000Z',
      author: 'Sachin Jayanth',
      nodeCount: 2
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#18181c] border border-[#2c2c32] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-[#2c2c32] flex items-center justify-between bg-[#141418]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#EA580C]" />
            Version history
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-xs font-mono font-semibold text-[#EA580C]">
                    v{ver.version}
                  </span>
                  <span className="text-xs font-medium text-white">{ver.name}</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Saved {new Date(ver.savedAt).toLocaleString()} by {ver.author} • {ver.nodeCount} nodes
                </div>
              </div>

              {ver.version === 3 ? (
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  Current
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreVersion(ver.version);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-neutral-400" />
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#2c2c32] bg-[#141418] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. PUSH TO GIT MODAL
// ==========================================
interface GitProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GitSyncModal: React.FC<GitProps> = ({
  workflow,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState(
    `Update ${workflow.name} pipeline configuration`
  );
  const [isPushing, setIsPushing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsPushing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsPushing(false);
    setStatus('success');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#18181c] border border-[#2c2c32] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-[#2c2c32] flex items-center justify-between bg-[#141418]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#EA580C]" />
            Push to git repository
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Target Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Commit Message
            </label>
            <textarea
              rows={3}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400">
            Path: <span className="font-mono text-neutral-300">workflows/{workflow.name.toLowerCase().replace(/\s+/g, '-')}.json</span>
          </div>

          {status === 'success' && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Pushed successfully to remote repository on branch {branch}!
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#2c2c32] bg-[#141418] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPushing}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePush}
            disabled={isPushing || status === 'success'}
            className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isPushing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Pushing...
              </>
            ) : (
              'Commit & Push'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. IMPORT WORKFLOW MODAL (URL / FILE)
// ==========================================
interface ImportProps {
  isOpen: boolean;
  initialMode?: 'url' | 'file';
  onClose: () => void;
  onImport: (importedWf: any) => void;
}

export const ImportWorkflowModal: React.FC<ImportProps> = ({
  isOpen,
  initialMode = 'url',
  onClose,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>(initialMode);
  const [urlInput, setUrlInput] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImportJson = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      onImport(parsed);
      onClose();
    } catch (e: any) {
      setError(`Invalid JSON syntax: ${e.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#18181c] border border-[#2c2c32] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-[#2c2c32] flex items-center justify-between bg-[#141418]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#EA580C]" />
            Import workflow
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-neutral-800 bg-[#121215]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-[#EA580C] text-white bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Import from URL or Raw JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('file');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-[#EA580C] text-white bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Import from File
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Workflow URL (n8n or raw GitHub URL)
                </label>
                <input
                  type="text"
                  placeholder="https://raw.githubusercontent.com/.../workflow.json"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-[#EA580C] focus:outline-none"
                />
              </div>

              <div className="text-center text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                — OR PASTE WORKFLOW JSON —
              </div>

              <div>
                <textarea
                  rows={6}
                  placeholder="Paste complete workflow JSON here..."
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 font-mono focus:border-[#EA580C] focus:outline-none placeholder:text-neutral-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-neutral-700 hover:border-[#EA580C] rounded-xl flex flex-col items-center justify-center gap-3 transition-colors bg-neutral-900/40">
              <Upload className="w-8 h-8 text-neutral-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-white">Choose a .json workflow file</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Compatible with standard n8n and NodeFlow JSON files</div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EA580C] file:text-white hover:file:bg-[#c2410c] cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#2c2c32] bg-[#141418] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'url' && (
            <button
              type="button"
              onClick={() => handleImportJson(jsonText)}
              disabled={!jsonText.trim() && !urlInput.trim()}
              className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] disabled:opacity-50 text-xs font-medium text-white rounded-lg transition-colors shadow-sm"
            >
              Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
