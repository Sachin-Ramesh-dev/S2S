import React, { useState } from 'react';
import { Workflow } from '../types';
import {
  Play,
  Save,
  Plus,
  History,
  Code2,
  Lock,
  Share2,
  Sparkles,
  ChevronDown,
  HardDrive,
  Check,
  Loader2,
  Boxes,
  FileCode,
  ShieldCheck
} from 'lucide-react';

interface Props {
  workflow: Workflow;
  allWorkflows: Workflow[];
  hasUnsavedChanges: boolean;
  isExecuting: boolean;
  onNavigateHome: () => void;
  onSelectWorkflow: (wf: Workflow) => void;
  onNewWorkflow: () => void;
  onRenameWorkflow: (name: string) => void;
  onSaveWorkflow: () => void;
  onExecuteWorkflow: () => void;
  onOpenPalette: () => void;
  onOpenPluginManager: () => void;
  onOpenVault: () => void;
  onOpenHistory: () => void;
  onOpenTemplates: () => void;
  onOpenShare: () => void;
}

export const Navbar: React.FC<Props> = ({
  workflow,
  allWorkflows,
  hasUnsavedChanges,
  isExecuting,
  onNavigateHome,
  onSelectWorkflow,
  onNewWorkflow,
  onRenameWorkflow,
  onSaveWorkflow,
  onExecuteWorkflow,
  onOpenPalette,
  onOpenPluginManager,
  onOpenVault,
  onOpenHistory,
  onOpenTemplates,
  onOpenShare
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(workflow.name);
  const [isWfDropdownOpen, setIsWfDropdownOpen] = useState(false);

  const handleFinishRename = () => {
    setIsRenaming(false);
    if (tempName.trim()) {
      onRenameWorkflow(tempName.trim());
    } else {
      setTempName(workflow.name);
    }
  };

  return (
    <header
      id="app-navbar"
      className="h-14 border-b border-[#222226] bg-[#131316] px-4 flex items-center justify-between gap-3 select-none shrink-0 z-40"
    >
      {/* Left: Brand / Back to Overview + Workflow Selector */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back to Overview / n8n Brand */}
        <button
          id="btn-navbar-back-overview"
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#202024] text-[#a1a1aa] hover:text-white transition-colors shrink-0 group"
          title="Back to Overview"
        >
          <div className="flex items-center text-[#EA580C]">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="5" cy="12" r="3" fill="#EA580C" />
              <circle cx="19" cy="7" r="3" fill="#EA580C" />
              <circle cx="19" cy="17" r="3" fill="#EA580C" />
              <path
                d="M5 12C9 12 11 7 19 7M5 12C9 12 11 17 19 17"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[#f4f4f5] group-hover:text-[#EA580C] transition-colors">
            Overview
          </span>
        </button>

        <div className="w-px h-5 bg-[#26262a]" />

        {/* Workflow Title & Switcher */}
        <div className="relative flex items-center gap-1 min-w-0">
          {isRenaming ? (
            <input
              id="input-workflow-rename"
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') {
                  setTempName(workflow.name);
                  setIsRenaming(false);
                }
              }}
              autoFocus
              className="bg-neutral-950 border border-indigo-500 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
            />
          ) : (
            <button
              id="btn-workflow-dropdown-toggle"
              type="button"
              onClick={() => setIsWfDropdownOpen(!isWfDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-800 text-xs font-bold text-neutral-200 transition-colors truncate max-w-xs"
            >
              <span className="truncate">{workflow.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            </button>
          )}

          {/* Workflow Selector Dropdown Menu */}
          {isWfDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsWfDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 flex items-center justify-between">
                  <span>LOCAL WORKFLOWS</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWfDropdownOpen(false);
                      onNewWorkflow();
                    }}
                    className="text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {allWorkflows.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => {
                        onSelectWorkflow(wf);
                        setTempName(wf.name);
                        setIsWfDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        wf.id === workflow.id
                          ? 'bg-neutral-800 text-indigo-300 font-semibold'
                          : 'hover:bg-neutral-850 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{wf.name}</span>
                      {wf.id === workflow.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWfDropdownOpen(false);
                      setIsRenaming(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  >
                    Rename current workflow
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Quick Primary Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Add Node Button */}
        <button
          id="btn-navbar-add-node"
          type="button"
          onClick={onOpenPalette}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Node</span>
        </button>

        {/* Run Entire Workflow */}
        <button
          id="btn-execute-workflow"
          type="button"
          disabled={isExecuting}
          onClick={onExecuteWorkflow}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all ${
            isExecuting
              ? 'bg-amber-600 text-white cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Workflow</span>
            </>
          )}
        </button>

        {/* Save Workflow */}
        <button
          id="btn-save-workflow"
          type="button"
          onClick={onSaveWorkflow}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
        </button>
      </div>

      {/* Right: Tools, Plugin Dev, Vault, History, Templates, Share */}
      <div className="flex items-center gap-1">
        {/* Execution History */}
        <button
          id="btn-open-history"
          type="button"
          title="Execution Audit History"
          onClick={onOpenHistory}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Plugin Developer Studio */}
        <button
          id="btn-open-plugin-manager"
          type="button"
          title="Custom Node Plugin IDE"
          onClick={onOpenPluginManager}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-indigo-400 transition-colors"
        >
          <Code2 className="w-4 h-4" />
        </button>

        {/* E2EE Vault */}
        <button
          id="btn-open-vault"
          type="button"
          title="End-to-End Encryption Vault"
          onClick={onOpenVault}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Templates */}
        <button
          id="btn-open-templates"
          type="button"
          title="Pre-built Templates"
          onClick={onOpenTemplates}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Share & Export */}
        <button
          id="btn-open-share"
          type="button"
          title="Share & Export Workflow"
          onClick={onOpenShare}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
