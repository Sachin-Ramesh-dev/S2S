import React, { useState } from 'react';
import { Workflow } from '../types';
import { WorkflowOptionsMenu } from './workflow-modals/WorkflowOptionsMenu';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import {
  User,
  ChevronDown,
  CircleDot,
  Check,
  Save,
  Loader2,
  Sparkles,
  Keyboard,
  Camera
} from 'lucide-react';

interface Props {
  workflow: Workflow;
  hasUnsavedChanges: boolean;
  isExecuting: boolean;
  activeSubView: 'editor' | 'executions' | 'evaluations';
  onChangeSubView: (subView: 'editor' | 'executions' | 'evaluations') => void;
  onNavigatePersonal: () => void;
  onRenameWorkflow: (name: string) => void;
  onDuplicateWorkflow: () => void;
  onDeleteWorkflow: () => void;
  onTogglePublish: () => void;
  onSaveWorkflow: () => void;
  onOpenShare: () => void;
  onOpenAiBuilder?: () => void;
  onTakeSnapshot?: () => void;
  isTakingSnapshot?: boolean;
  // n8n Workflow Options
  onEditDescriptionTags?: () => void;
  onToggleFavorite?: () => void;
  onExportJson?: () => void;
  onImportUrl?: () => void;
  onImportFile?: () => void;
  onPushToGit?: () => void;
  onVersionHistory?: () => void;
  onSettings?: () => void;
  onProductionChecklist?: () => void;
  onArchive?: () => void;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<Props> = ({
  workflow,
  hasUnsavedChanges,
  isExecuting,
  activeSubView,
  onChangeSubView,
  onNavigatePersonal,
  onRenameWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onTogglePublish,
  onSaveWorkflow,
  onOpenShare,
  onOpenAiBuilder,
  onTakeSnapshot,
  isTakingSnapshot,
  onEditDescriptionTags,
  onToggleFavorite,
  onExportJson,
  onImportUrl,
  onImportFile,
  onPushToGit,
  onVersionHistory,
  onSettings,
  onProductionChecklist,
  onArchive,
  onOpenShortcuts
}) => {
  const { isDark } = useTheme();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workflow.name);
  const [isPublishDropdownOpen, setIsPublishDropdownOpen] = useState(false);

  const handleFinishRename = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      onRenameWorkflow(tempName.trim());
    } else {
      setTempName(workflow.name);
    }
  };

  return (
    <header
      id="workflow-navbar"
      className={`h-12 border-b px-4 flex items-center justify-between gap-3 select-none shrink-0 z-40 transition-colors ${
        isDark ? 'border-[#222226] bg-[#131316]' : 'border-slate-200 bg-white shadow-2xs'
      }`}
    >
      {/* Left: Breadcrumb (👤 Personal / Workflow Name ...) */}
      <div
        className={`flex items-center gap-2 text-xs min-w-0 ${
          isDark ? 'text-[#a1a1aa]' : 'text-slate-500'
        }`}
      >
        <button
          id="btn-nav-personal-breadcrumb"
          type="button"
          onClick={onNavigatePersonal}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark ? 'hover:text-white' : 'hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal</span>
        </button>

        <span className={isDark ? 'text-[#52525b]' : 'text-slate-300'}>/</span>

        {/* Workflow Title */}
        {isEditingName ? (
          <input
            id="input-wf-name"
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishRename();
              if (e.key === 'Escape') {
                setTempName(workflow.name);
                setIsEditingName(false);
              }
            }}
            autoFocus
            className={`px-2 py-0.5 border border-[#EA580C] rounded text-xs font-semibold focus:outline-none ${
              isDark ? 'bg-[#1a1a1e] text-white' : 'bg-slate-50 text-slate-900'
            }`}
          />
        ) : (
          <span
            onClick={() => {
              setTempName(workflow.name);
              setIsEditingName(true);
            }}
            className={`font-semibold cursor-pointer truncate max-w-xs transition-colors ${
              isDark ? 'text-[#f4f4f5] hover:text-white' : 'text-slate-900 hover:text-[#EA580C]'
            }`}
            title="Click to rename"
          >
            {workflow.name}
          </span>
        )}

        {/* n8n Workflow Options Menu (...) matching screenshot */}
        <WorkflowOptionsMenu
          workflow={workflow}
          onRename={() => {
            setTempName(workflow.name);
            setIsEditingName(true);
          }}
          onEditDescriptionTags={onEditDescriptionTags || (() => {})}
          onToggleFavorite={onToggleFavorite || (() => {})}
          onDuplicate={onDuplicateWorkflow}
          onExportJson={onExportJson || onOpenShare}
          onImportUrl={onImportUrl || (() => {})}
          onImportFile={onImportFile || (() => {})}
          onPushToGit={onPushToGit || (() => {})}
          onVersionHistory={onVersionHistory || (() => {})}
          onSettings={onSettings || (() => {})}
          onProductionChecklist={onProductionChecklist || (() => {})}
          onArchive={onArchive || onDeleteWorkflow}
        />

        {hasUnsavedChanges && (
          <button
            type="button"
            title="Save changes to local database"
            onClick={onSaveWorkflow}
            className="px-2 py-0.5 bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#EA580C] hover:bg-[#EA580C] hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        )}
      </div>

      {/* Center: Segmented Switch [ Editor | Executions | Evaluations ] (Screenshot 3) */}
      <div
        id="workflow-subviews-switch"
        className="bg-[#1a1a1e] border border-[#27272b] p-0.5 rounded-lg flex items-center text-xs font-medium"
      >
        <button
          id="btn-subview-editor"
          type="button"
          onClick={() => onChangeSubView('editor')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeSubView === 'editor'
              ? 'bg-[#26262c] text-white shadow-sm font-semibold'
              : 'text-[#8e8e93] hover:text-[#d4d4d8]'
          }`}
        >
          Editor
        </button>
        <button
          id="btn-subview-executions"
          type="button"
          onClick={() => onChangeSubView('executions')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeSubView === 'executions'
              ? 'bg-[#26262c] text-white shadow-sm font-semibold'
              : 'text-[#8e8e93] hover:text-[#d4d4d8]'
          }`}
        >
          Executions
        </button>
        <button
          id="btn-subview-evaluations"
          type="button"
          onClick={() => onChangeSubView('evaluations')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeSubView === 'evaluations'
              ? 'bg-[#26262c] text-white shadow-sm font-semibold'
              : 'text-[#8e8e93] hover:text-[#d4d4d8]'
          }`}
        >
          Evaluations
        </button>
      </div>

      {/* Right: AI Builder & Publish Button with Dropdown (Screenshot 3) */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle variant="icon" />

        {/* Keyboard Shortcuts Cheatsheet Button */}
        {onOpenShortcuts && (
          <button
            id="btn-navbar-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheatsheet (?)"
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1a1a1e] hover:bg-[#26262c] text-[#a1a1aa] hover:text-white border border-[#27272b]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#EA580C]" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className={`px-1 py-0.2 rounded text-[10px] font-mono ${isDark ? 'bg-[#26262c] text-neutral-300' : 'bg-white text-slate-500 border border-slate-300'}`}>
              ?
            </kbd>
          </button>
        )}

        {/* Take Snapshot Button */}
        {onTakeSnapshot && (
          <button
            id="btn-navbar-take-snapshot"
            type="button"
            onClick={onTakeSnapshot}
            disabled={isTakingSnapshot}
            title="Take Snapshot (Downloadable PNG image of current workflow layout)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#1a1a1e] hover:bg-[#26262c] text-[#a1a1aa] hover:text-white border border-[#27272b]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {isTakingSnapshot ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-[#EA580C]" />
            )}
            <span className="hidden sm:inline">{isTakingSnapshot ? 'Saving...' : 'Take Snapshot'}</span>
          </button>
        )}

        {onOpenAiBuilder && (
          <button
            id="btn-navbar-ai-builder"
            type="button"
            onClick={onOpenAiBuilder}
            title="Open AI Workflow Builder (Google Gemini)"
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Builder</span>
          </button>
        )}

        <div className="relative">
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              id="btn-toggle-publish"
              type="button"
              onClick={onTogglePublish}
              className={`px-3 py-1.5 text-xs font-semibold rounded-l-lg flex items-center gap-1.5 transition-colors ${
                workflow.published
                  ? 'bg-[#10b981] hover:bg-[#059669] text-white'
                  : 'bg-[#222226] hover:bg-[#2c2c32] text-[#d4d4d8]'
              }`}
            >
              <CircleDot
                className={`w-3 h-3 ${
                  workflow.published ? 'text-white' : 'text-[#71717a]'
                }`}
              />
              <span>{workflow.published ? 'Published' : 'Publish'}</span>
            </button>
            <button
              id="btn-publish-dropdown"
              type="button"
              onClick={() => setIsPublishDropdownOpen(!isPublishDropdownOpen)}
              className={`px-1.5 py-1.5 text-xs rounded-r-lg border-l transition-colors ${
                workflow.published
                  ? 'bg-[#059669] text-white border-[#10b981]/60'
                  : 'bg-[#1c1c20] text-[#71717a] hover:text-white border-[#2c2c32]'
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {isPublishDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsPublishDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#18181c] border border-[#27272b] rounded-xl shadow-2xl py-1 z-50 text-xs text-[#d4d4d8]">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublishDropdownOpen(false);
                    onTogglePublish();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#222226] flex items-center justify-between"
                >
                  <span>{workflow.published ? 'Unpublish workflow' : 'Publish workflow'}</span>
                  {workflow.published && <Check className="w-3.5 h-3.5 text-[#10b981]" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
