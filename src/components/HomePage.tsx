import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Database,
  Filter,
  Folder,
  FolderPlus,
  FolderInput,
  MoreVertical,
  CircleDot,
  Copy,
  Trash2,
  Edit2,
  Share2,
  ExternalLink,
  ChevronRight,
  User,
  Info,
  Sparkles,
  Tag,
  ArrowLeft,
  X,
  Keyboard,
  Check,
  Layers
} from 'lucide-react';
import { Workflow, ExecutionRecord, VaultCredential } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  activeNav: 'overview' | 'personal';
  onChangeNav: (nav: 'overview' | 'personal') => void;
  workflows: Workflow[];
  executions: ExecutionRecord[];
  vaultCredentials: VaultCredential[];
  securityStatus: any;
  allFolders?: string[];
  onCreateFolder?: (folderName: string) => void;
  onDeleteFolder?: (folderName: string) => void;
  onUpdateWorkflowFolder?: (workflowId: string, folderName?: string) => void;
  onOpenShortcuts?: () => void;
  onOpenWorkflow: (workflow: Workflow) => void;
  onCreateWorkflow: (folder?: string) => void;
  onDuplicateWorkflow: (workflow: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
  onRenameWorkflow: (workflow: Workflow, name: string) => void;
  onToggleWorkflowPublished: (workflow: Workflow) => void;
  onOpenTemplates: () => void;
  onOpenVault: () => void;
  onOpenShare: (workflow: Workflow) => void;
  onOpenAiBuilder?: () => void;
}

export const HomePage: React.FC<Props> = ({
  activeNav,
  onChangeNav,
  workflows,
  executions,
  vaultCredentials,
  allFolders = ['For Teams'],
  onCreateFolder,
  onDeleteFolder,
  onUpdateWorkflowFolder,
  onOpenShortcuts,
  onOpenWorkflow,
  onCreateWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onRenameWorkflow,
  onToggleWorkflowPublished,
  onOpenTemplates,
  onOpenVault,
  onOpenShare,
  onOpenAiBuilder
}) => {
  const { isDark } = useTheme();
  // Tabs & Folder Navigation
  const [activeTab, setActiveTab] = useState<'workflows' | 'credentials' | 'executions' | 'variables' | 'dataTables'>('workflows');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [menuOpenWorkflowId, setMenuOpenWorkflowId] = useState<string | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  // Modals for Folder Management
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingWf, setMovingWf] = useState<Workflow | null>(null);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');
  const [customNewFolderInline, setCustomNewFolderInline] = useState('');

  // Rename Modal
  const [renamingWf, setRenamingWf] = useState<Workflow | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Extract all unique folders
  const computedFolders = useMemo(() => {
    const set = new Set<string>(allFolders);
    workflows.forEach((w) => {
      if (w.folder) set.add(w.folder);
    });
    return Array.from(set).filter(Boolean);
  }, [allFolders, workflows]);

  // Extract all unique tags across workflows
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    workflows.forEach((w) => {
      (w.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [workflows]);

  // Fixed & Live Metrics matching Screenshot 1
  const metrics = useMemo(() => {
    const totalExecs = executions.length > 0 ? executions.length : 7;
    const failedExecs = executions.filter((e) => e.status === 'error').length;
    const failureRate = totalExecs > 0 ? Math.round((failedExecs / totalExecs) * 100) : 0;

    return {
      totalExecs,
      failedExecs,
      failureRate: `${failureRate}%`,
      timeSaved: '--',
      avgRunTime: '97.48s'
    };
  }, [executions]);

  // Total workflows in current view context (before search/tag filter)
  const totalInContext = useMemo(() => {
    if (activeNav === 'personal') {
      if (activeFolder) {
        return workflows.filter((w) => w.folder === activeFolder).length;
      }
      return workflows.filter((w) => !w.folder).length;
    }
    return workflows.length;
  }, [workflows, activeNav, activeFolder]);

  // Filtered workflows based on search, tag, folder, and sort
  const filteredWorkflows = useMemo(() => {
    const seen = new Set<string>();
    return workflows
      .filter((w) => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      })
      .filter((w) => {
        if (activeNav === 'personal') {
          if (activeFolder) {
            return w.folder === activeFolder;
          } else {
            // At root of personal: show only items without a subfolder
            return !w.folder;
          }
        }
        // In overview: show all
        return true;
      })
      .filter((w) => {
        // Tag filter
        if (selectedTag && !(w.tags || []).includes(selectedTag)) {
          return false;
        }
        // Text search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchesName = w.name.toLowerCase().includes(q);
        const matchesDesc = (w.description || '').toLowerCase().includes(q);
        const matchesTags = (w.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesFolder = (w.folder || '').toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesTags || matchesFolder;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [workflows, activeNav, activeFolder, searchQuery, selectedTag, sortBy]);

  const handleFinishRename = () => {
    if (renamingWf && renameValue.trim()) {
      onRenameWorkflow(renamingWf, renameValue.trim());
    }
    setRenamingWf(null);
  };

  const handleCreateNewFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (onCreateFolder) {
      onCreateFolder(trimmed);
    }
    setActiveFolder(trimmed);
    setNewFolderName('');
    setIsCreateFolderModalOpen(false);
  };

  const handleConfirmMoveWorkflow = () => {
    if (!movingWf) return;
    let targetFolder = selectedTargetFolder;
    if (customNewFolderInline.trim()) {
      targetFolder = customNewFolderInline.trim();
      if (onCreateFolder) {
        onCreateFolder(targetFolder);
      }
    }

    if (onUpdateWorkflowFolder) {
      onUpdateWorkflowFolder(
        movingWf.id,
        targetFolder === '__ROOT__' || !targetFolder ? undefined : targetFolder
      );
    }
    setMovingWf(null);
    setSelectedTargetFolder('');
    setCustomNewFolderInline('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
  };

  const isFiltering = searchQuery.trim().length > 0 || selectedTag !== null;

  return (
    <div
      id="dashboard-home-page"
      className={`flex-1 flex flex-col h-full overflow-y-auto ${
        isDark ? 'bg-[#0e0e11] text-[#f4f4f5]' : 'bg-slate-50 text-slate-900'
      } select-none`}
    >
      {/* Top Banner / Breadcrumb & Actions Bar (Screenshot 1) */}
      <header
        id="home-header-bar"
        className={`h-14 px-6 border-b flex items-center justify-between gap-4 shrink-0 transition-colors ${
          isDark ? 'border-[#222226] bg-[#131316]' : 'border-slate-200 bg-white shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {activeNav === 'personal' ? (
              <div className="flex items-center gap-1.5 text-[#a1a1aa]">
                <User className="w-3.5 h-3.5" />
                <span className="text-[#f4f4f5] cursor-pointer hover:underline" onClick={() => setActiveFolder(null)}>Personal</span>
                {activeFolder && (
                  <>
                    <ChevronRight className="w-3 h-3 text-[#52525b]" />
                    <span className="text-white font-bold flex items-center gap-1">
                      <Folder className="w-3 h-3 text-[#EA580C]" /> {activeFolder}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[#f4f4f5]">Overview</span>
            )}
          </div>
        </div>

        {/* Action Buttons: Shortcuts Cheatsheet, AI Builder & Create Workflow */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle variant="icon" />

          {/* Persistent Keyboard Shortcuts Reference Button */}
          {onOpenShortcuts && (
            <button
              id="btn-header-shortcuts"
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts Cheatsheet (?)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                isDark
                  ? 'bg-[#1a1a1e] hover:bg-[#26262c] border-[#27272b] hover:border-[#383840] text-[#a1a1aa] hover:text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-950'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-[#EA580C]" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd
                className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                  isDark ? 'bg-[#26262c] text-neutral-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                ?
              </kbd>
            </button>
          )}

          {onOpenAiBuilder && (
            <button
              id="btn-open-ai-builder"
              type="button"
              onClick={onOpenAiBuilder}
              title="Build workflow using natural language"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 hover:border-amber-500/60 text-amber-500 dark:text-amber-300 hover:text-amber-600 dark:hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Builder</span>
            </button>
          )}

          {/* Primary Create Workflow Button */}
          <div className="relative">
            <button
              id="btn-create-workflow"
              type="button"
              onClick={() => onCreateWorkflow(activeFolder || undefined)}
              className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create workflow</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards Row (Screenshot 1: Overview mode) */}
        {activeNav === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            {/* Prod. Executions */}
            <div
              className={`p-3.5 rounded-xl shadow-xs border transition-colors ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`text-[11px] font-sans font-medium ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Prod. executions
              </div>
              <div className={`text-xl font-bold mt-1 ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                {metrics.totalExecs}
              </div>
            </div>

            {/* Prod. Failure Rate */}
            <div
              className={`p-3.5 rounded-xl shadow-xs border transition-colors ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`text-[11px] font-sans font-medium ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Prod. failure rate
              </div>
              <div className={`text-xl font-bold mt-1 ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                {metrics.failureRate}
              </div>
            </div>

            {/* Time Saved */}
            <div
              className={`p-3.5 rounded-xl shadow-xs border transition-colors ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`text-[11px] font-sans font-medium ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Time saved
              </div>
              <div className={`text-xl font-bold mt-1 ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>
                {metrics.timeSaved}
              </div>
            </div>

            {/* Avg Run Time */}
            <div
              className={`p-3.5 rounded-xl shadow-xs border transition-colors ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`text-[11px] font-sans font-medium ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Avg. run time
              </div>
              <div className="text-xl font-bold text-[#10b981] mt-1">{metrics.avgRunTime}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation (Workflows, Credentials, Executions, Variables, Data tables) */}
        <div className={`border-b transition-colors ${isDark ? 'border-[#222226]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-6 text-xs">
            <button
              id="tab-workflows"
              type="button"
              onClick={() => setActiveTab('workflows')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'workflows'
                  ? isDark ? 'text-[#f4f4f5] font-semibold' : 'text-slate-900 font-semibold'
                  : isDark ? 'text-[#8e8e93] hover:text-[#d4d4d8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Workflows</span>
              {activeTab === 'workflows' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C]" />
              )}
            </button>

            <button
              id="tab-credentials"
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'credentials'
                  ? isDark ? 'text-[#f4f4f5] font-semibold' : 'text-slate-900 font-semibold'
                  : isDark ? 'text-[#8e8e93] hover:text-[#d4d4d8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Credentials</span>
              {activeTab === 'credentials' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C]" />
              )}
            </button>

            <button
              id="tab-executions"
              type="button"
              onClick={() => setActiveTab('executions')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'executions'
                  ? isDark ? 'text-[#f4f4f5] font-semibold' : 'text-slate-900 font-semibold'
                  : isDark ? 'text-[#8e8e93] hover:text-[#d4d4d8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Executions</span>
              {activeTab === 'executions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C]" />
              )}
            </button>

            <button
              id="tab-variables"
              type="button"
              onClick={() => setActiveTab('variables')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'variables'
                  ? isDark ? 'text-[#f4f4f5] font-semibold' : 'text-slate-900 font-semibold'
                  : isDark ? 'text-[#8e8e93] hover:text-[#d4d4d8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Variables</span>
              {activeTab === 'variables' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C]" />
              )}
            </button>

            <button
              id="tab-data-tables"
              type="button"
              onClick={() => setActiveTab('dataTables')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'dataTables'
                  ? isDark ? 'text-[#f4f4f5] font-semibold' : 'text-slate-900 font-semibold'
                  : isDark ? 'text-[#8e8e93] hover:text-[#d4d4d8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Data tables</span>
              {activeTab === 'dataTables' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C]" />
              )}
            </button>
          </div>
        </div>

        {/* TAB CONTENT: WORKFLOWS */}
        {activeTab === 'workflows' && (
          <div className="space-y-4">
            {/* Top Toolbar: Breadcrumbs / Actions on Left, Searchable Filter Bar on Right */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Left: Breadcrumbs & Folder Organization Actions */}
              <div className="flex items-center gap-2">
                {activeNav === 'personal' ? (
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                    {activeFolder ? (
                      <button
                        type="button"
                        onClick={() => setActiveFolder(null)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                          isDark
                            ? 'text-[#d4d4d8] hover:text-white hover:bg-[#1f1f24]'
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                        }`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Personal</span>
                      </button>
                    ) : (
                      <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                        <User className="w-3.5 h-3.5" />
                        <span>Personal</span>
                      </div>
                    )}

                    {activeFolder && (
                      <>
                        <span>/</span>
                        <div
                          className={`flex items-center gap-1.5 font-bold px-2 py-1 rounded-md border ${
                            isDark
                              ? 'text-white bg-[#1a1a1e] border-[#27272b]'
                              : 'text-slate-900 bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>{activeFolder}</span>
                        </div>
                      </>
                    )}

                    {/* New Folder Button (in Personal root or folder view) */}
                    {!activeFolder && (
                      <button
                        id="btn-create-folder"
                        type="button"
                        onClick={() => setIsCreateFolderModalOpen(true)}
                        className={`ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isDark
                            ? 'bg-[#1a1a1e] hover:bg-[#26262c] border-[#27272b] hover:border-[#383840] text-[#d4d4d8] hover:text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
                        }`}
                        title="Create new folder"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>New folder</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
                    <Layers className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span className={`font-semibold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>All Workflows</span>
                  </div>
                )}
              </div>

              {/* Right: Searchable Filter Bar with Clear Button & Sort */}
              <div className="flex items-center gap-2">
                {/* Search Input with Clear Button */}
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`} />
                  <input
                    id="input-search-workflows"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, tag, or desc..."
                    className={`w-56 pl-8 pr-7 py-1.5 rounded-lg text-xs transition-colors border focus:outline-none focus:border-[#EA580C] ${
                      isDark
                        ? 'bg-[#141417] border-[#242428] text-[#f4f4f5] placeholder-[#71717a]'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-[#71717a] hover:text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    id="btn-sort-dropdown"
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-[#141417] border-[#242428] text-[#d4d4d8] hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
                    }`}
                  >
                    <span>
                      {sortBy === 'updated'
                        ? 'Updated'
                        : sortBy === 'created'
                        ? 'Created'
                        : 'Name'}
                    </span>
                    <ChevronDown className={`w-3 h-3 ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div
                      className={`absolute right-0 mt-1 w-44 rounded-lg shadow-xl py-1 z-50 text-xs border ${
                        isDark
                          ? 'bg-[#18181c] border-[#27272b] text-[#d4d4d8]'
                          : 'bg-white border-slate-200 text-slate-700 shadow-xl'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('updated');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left transition-colors ${
                          isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                        } ${sortBy === 'updated' ? 'text-[#EA580C] font-semibold' : ''}`}
                      >
                        Sort by last updated
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('created');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left transition-colors ${
                          isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                        } ${sortBy === 'created' ? 'text-[#EA580C] font-semibold' : ''}`}
                      >
                        Sort by created date
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('name');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left transition-colors ${
                          isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                        } ${sortBy === 'name' ? 'text-[#EA580C] font-semibold' : ''}`}
                      >
                        Sort by name
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear all filters shortcut if active */}
                {isFiltering && (
                  <button
                    id="btn-clear-all-filters"
                    type="button"
                    onClick={clearAllFilters}
                    className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-rose-950/40 hover:bg-rose-950/70 border-rose-800/50 text-rose-300'
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    }`}
                    title="Reset search and active tag filter"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Tag Filter Bar */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-1">
                <div className={`flex items-center gap-1 text-[11px] font-medium mr-1 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                  <Tag className="w-3 h-3" />
                  <span>Tags:</span>
                </div>

                {/* All Tags Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    selectedTag === null
                      ? 'bg-[#EA580C] text-white shadow-xs font-semibold'
                      : isDark
                      ? 'bg-[#18181d] border border-[#27272e] text-[#a1a1aa] hover:text-white hover:border-[#383842]'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  All Tags ({workflows.length})
                </button>

                {/* Individual Tag Chips */}
                {allTags.map((tag) => {
                  const count = workflows.filter((w) => (w.tags || []).includes(tag)).length;
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EA580C] text-white shadow-xs font-semibold'
                          : isDark
                          ? 'bg-[#18181d] border border-[#27272e] text-[#a1a1aa] hover:text-white hover:border-[#383842]'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <span>{tag}</span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-white/80' : isDark ? 'text-[#71717a]' : 'text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Status indicator bar for active filter */}
            {isFiltering && (
              <div
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                  isDark
                    ? 'bg-[#18181d] border-[#27272e] text-[#a1a1aa]'
                    : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>
                    Filtered results: <b className={isDark ? 'text-white' : 'text-slate-900'}>{filteredWorkflows.length}</b> of {totalInContext} workflows
                  </span>
                  {selectedTag && (
                    <span className="px-2 py-0.5 rounded bg-[#EA580C]/20 border border-[#EA580C]/30 text-amber-500 font-medium text-[11px]">
                      Tag: {selectedTag}
                    </span>
                  )}
                  {searchQuery && (
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      &quot;{searchQuery}&quot;
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-[#EA580C] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* In Personal view at root: Render Folder Cards (Dynamic Folder support) */}
            {activeNav === 'personal' && !activeFolder && computedFolders.length > 0 && (
              <div className="space-y-2">
                <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                  <Folder className="w-3 h-3 text-[#EA580C]" />
                  <span>Folders ({computedFolders.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {computedFolders.map((folderName) => {
                    const count = workflows.filter((w) => w.folder === folderName).length;
                    return (
                      <div
                        key={folderName}
                        id={`folder-card-${folderName.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setActiveFolder(folderName)}
                        className={`group p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                          isDark
                            ? 'bg-[#141417] border-[#222226] hover:border-[#EA580C]/40 hover:bg-[#18181c]'
                            : 'bg-white border-slate-200 hover:border-[#EA580C]/40 hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isDark
                                ? 'bg-[#222226] group-hover:bg-[#EA580C]/15 text-[#EA580C]'
                                : 'bg-slate-100 group-hover:bg-orange-50 text-[#EA580C]'
                            }`}
                          >
                            <Folder className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-semibold group-hover:text-[#EA580C] transition-colors truncate ${
                                isDark ? 'text-[#f4f4f5]' : 'text-slate-800'
                              }`}
                            >
                              {folderName}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                              {count} {count === 1 ? 'Workflow' : 'Workflows'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onDeleteFolder && folderName !== 'For Teams' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete folder "${folderName}"? Contained workflows will be moved to Personal root.`)) {
                                onDeleteFolder(folderName);
                              }
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark
                                  ? 'hover:bg-rose-950/40 text-[#71717a] hover:text-rose-400'
                                  : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight
                            className={`w-4 h-4 transition-colors ${
                              isDark ? 'text-[#71717a] group-hover:text-white' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inside Folder Header (when activeFolder is selected) */}
            {activeNav === 'personal' && activeFolder && (
              <div
                className={`p-4 rounded-xl flex items-center justify-between border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EA580C]/15 border border-[#EA580C]/30 flex items-center justify-center text-[#EA580C]">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>{activeFolder}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          isDark ? 'bg-[#222226] text-[#a1a1aa]' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {filteredWorkflows.length} workflows
                      </span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                      Workflows assigned to the {activeFolder} folder
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateWorkflow(activeFolder)}
                    className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New in this folder</span>
                  </button>
                </div>
              </div>
            )}

            {/* Workflows List Section Header */}
            {activeNav === 'personal' && !activeFolder && (
              <div className={`pt-2 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Workflows in Personal Root ({filteredWorkflows.length})
              </div>
            )}

            {/* Empty State when no workflows match search or filter */}
            {filteredWorkflows.length === 0 && (
              <div
                className={`py-12 px-4 text-center rounded-2xl space-y-3 border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                    isDark ? 'bg-[#1e1e24] text-[#71717a]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No workflows found</div>
                  <p className={`text-xs max-w-sm mx-auto mt-1 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                    {isFiltering
                      ? 'No workflows match your search query or active tag filter.'
                      : activeFolder
                      ? `No workflows have been placed into "${activeFolder}" yet.`
                      : 'No workflows found in this view.'}
                  </p>
                </div>
                {isFiltering ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear Search & Filters
                  </button>
                ) : activeFolder ? (
                  <button
                    type="button"
                    onClick={() => onCreateWorkflow(activeFolder)}
                    className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Create First Workflow in {activeFolder}
                  </button>
                ) : null}
              </div>
            )}

            {/* Workflows List */}
            {filteredWorkflows.map((workflow) => {
              const triggerCount =
                workflow.triggerCount ??
                workflow.nodes.filter(
                  (n) => n.type.includes('Trigger') || n.type === 'webhookTrigger' || n.type === 'manualTrigger'
                ).length ??
                1;

              return (
                <div
                  key={workflow.id}
                  id={`workflow-card-${workflow.id}`}
                  onClick={() => onOpenWorkflow(workflow)}
                  className={`group p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                    isDark
                      ? 'bg-[#141417] border-[#222226] hover:border-[#383840] shadow-xs hover:shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Left: Workflow Title, Description & Associated Tags */}
                  <div className="min-w-0 pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold group-hover:text-[#EA580C] transition-colors truncate ${
                          isDark ? 'text-[#f4f4f5]' : 'text-slate-900'
                        }`}
                      >
                        {workflow.name}
                      </span>
                      {workflow.folder && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 border ${
                            isDark
                              ? 'bg-[#222226] border-[#2f2f36] text-[#a1a1aa]'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          <Folder className="w-2.5 h-2.5 text-[#EA580C]" />
                          <span>{workflow.folder}</span>
                        </span>
                      )}
                    </div>

                    <div className={`text-[11px] truncate max-w-xl ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                      {workflow.description || 'No description provided'}
                    </div>

                    {/* Associated Tag Pills on Card */}
                    {workflow.tags && workflow.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {workflow.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(tag === selectedTag ? null : tag);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                              selectedTag === tag
                                ? 'bg-[#EA580C] text-white font-semibold border-transparent'
                                : isDark
                                ? 'bg-[#1e1e24] text-[#a1a1aa] hover:text-white hover:bg-[#282830] border-[#2a2a32]'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
                            }`}
                            title={`Filter by tag: ${tag}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Badges & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Trigger Count Pill */}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 border ${
                        isDark
                          ? 'bg-[#1e1e24] border-[#2a2a32] text-[#d4d4d8]'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title={`${triggerCount} Trigger(s)`}
                    >
                      <svg
                        className={`w-3 h-3 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="5" cy="12" r="3" />
                        <circle cx="19" cy="7" r="3" />
                        <circle cx="19" cy="17" r="3" />
                        <path d="M5 12C9 12 11 7 19 7M5 12C9 12 11 17 19 17" />
                      </svg>
                      <span>{triggerCount}</span>
                    </div>

                    {/* Scope / Folder Pill (Rendered in Overview mode) */}
                    {activeNav === 'overview' && (
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1.5 border ${
                          isDark
                            ? 'bg-[#1e1e24] border-[#2a2a32] text-[#d4d4d8]'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <User className={`w-3 h-3 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`} />
                        <span>
                          {workflow.folder ? `Personal / ${workflow.folder}` : 'Personal'}
                        </span>
                      </div>
                    )}

                    {/* Published Status Dot */}
                    {workflow.published && (
                      <div className="px-2 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] text-[11px] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        <span>Published</span>
                      </div>
                    )}

                    {/* 3-Dot Workflow Actions Menu */}
                    <div className="relative">
                      <button
                        id={`btn-menu-${workflow.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenWorkflowId(
                            menuOpenWorkflowId === workflow.id ? null : workflow.id
                          );
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isDark
                            ? 'hover:bg-[#222226] text-[#71717a] hover:text-white'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpenWorkflowId === workflow.id && (
                        <div
                          className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl py-1 z-50 text-xs border ${
                            isDark
                              ? 'bg-[#18181c] border-[#27272b] text-[#d4d4d8]'
                              : 'bg-white border-slate-200 text-slate-700 shadow-2xl'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              setRenamingWf(workflow);
                              setRenameValue(workflow.name);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#a1a1aa]" />
                            <span>Rename</span>
                          </button>

                          {/* Move to Folder option */}
                          <button
                            id={`btn-move-to-folder-${workflow.id}`}
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              setMovingWf(workflow);
                              setSelectedTargetFolder(workflow.folder || '__ROOT__');
                              setCustomNewFolderInline('');
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark
                                ? 'hover:bg-[#222226] text-amber-300 hover:text-amber-200'
                                : 'hover:bg-amber-50 text-amber-600 hover:text-amber-700'
                            }`}
                          >
                            <FolderInput className="w-3.5 h-3.5 text-amber-500" />
                            <span>Move to folder...</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              onDuplicateWorkflow(workflow);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              onToggleWorkflowPublished(workflow);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                            }`}
                          >
                            <CircleDot className="w-3.5 h-3.5 text-[#10b981]" />
                            <span>{workflow.published ? 'Unpublish' : 'Publish'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              onOpenShare(workflow);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark ? 'hover:bg-[#222226]' : 'hover:bg-slate-100'
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Export / Share</span>
                          </button>
                          <div className={`h-px my-1 ${isDark ? 'bg-[#26262a]' : 'bg-slate-200'}`} />
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenWorkflowId(null);
                              onDeleteWorkflow(workflow.id);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors ${
                              isDark
                                ? 'hover:bg-rose-950/60 text-rose-400'
                                : 'hover:bg-rose-50 text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Footer */}
            <div className={`pt-3 flex items-center justify-end gap-4 text-xs ${isDark ? 'text-[#8e8e93]' : 'text-slate-500'}`}>
              <div>
                Total {filteredWorkflows.length} {filteredWorkflows.length === 1 ? 'workflow' : 'workflows'}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="px-1.5 py-0.5 text-[#52525b] cursor-not-allowed hover:bg-transparent"
                >
                  &lt;
                </button>
                <span className="w-5 h-5 rounded border border-[#EA580C] text-[#EA580C] flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <button
                  type="button"
                  disabled
                  className="px-1.5 py-0.5 text-[#52525b] cursor-not-allowed hover:bg-transparent"
                >
                  &gt;
                </button>
              </div>

              <div className="relative">
                <span
                  className={`px-2 py-0.5 rounded text-xs border ${
                    isDark ? 'bg-[#141417] border-[#242428] text-[#d4d4d8]' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  50/page
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: CREDENTIALS */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                Manage encrypted authentication tokens and local database keys.
              </div>
              <button
                type="button"
                onClick={onOpenVault}
                className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Credential
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vaultCredentials.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl flex items-center justify-between border ${
                    isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-[#222226] text-[#EA580C]' : 'bg-orange-50 text-[#EA580C]'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.name}</div>
                      <div className={`text-[11px] font-mono ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                        {c.type} • {c.maskedPreview}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] text-[10px] font-mono border border-[#10b981]/20">
                    AES-GCM
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: EXECUTIONS */}
        {activeTab === 'executions' && (
          <div className="space-y-3">
            <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
              Audit log of workflow runs stored locally in Node.js database.
            </div>

            <div
              className={`rounded-xl overflow-hidden divide-y border ${
                isDark
                  ? 'bg-[#141417] border-[#222226] divide-[#222226]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
              }`}
            >
              {executions.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                    isDark ? 'hover:bg-[#18181c]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {e.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>{e.workflowName}</div>
                      <div className={`text-[11px] font-mono ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>
                        {e.id} • Trigger: {e.triggerType}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 font-mono text-[11px] ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                    <span>{new Date(e.startedAt).toLocaleTimeString()}</span>
                    <span>{e.durationMs ? `${e.durationMs}ms` : '97.48s'}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        e.status === 'success'
                          ? isDark ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-950/60 text-rose-400'
                      }`}
                    >
                      {(e.status || 'success').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: VARIABLES */}
        {activeTab === 'variables' && (
          <div className="space-y-3">
            <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
              Global execution variables available in all workflow expressions.
            </div>
            <div
              className={`rounded-xl p-4 space-y-2 font-mono text-xs border ${
                isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  isDark ? 'bg-[#18181c] border-[#242428]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[#EA580C]">ENV_MODE</span>
                <span className={isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}>production (self-hosted)</span>
              </div>
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  isDark ? 'bg-[#18181c] border-[#242428]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[#EA580C]">STORAGE_ENGINE</span>
                <span className={isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}>local-database (/data/nodeflow_db.json)</span>
              </div>
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  isDark ? 'bg-[#18181c] border-[#242428]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[#EA580C]">ENCRYPTION_CIPHER</span>
                <span className={isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}>AES-256-GCM + PBKDF2</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: DATA TABLES */}
        {activeTab === 'dataTables' && (
          <div className="space-y-3">
            <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
              Local Database Tables & Collections stored on your self-hosted instance.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className={`p-4 rounded-xl space-y-2 border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                  <Database className="w-4 h-4 text-[#EA580C]" />
                  <span>workflows</span>
                </div>
                <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>{workflows.length} records stored</div>
              </div>
              <div
                className={`p-4 rounded-xl space-y-2 border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                  <Lock className="w-4 h-4 text-[#10b981]" />
                  <span>vault_credentials</span>
                </div>
                <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>{vaultCredentials.length} encrypted keys</div>
              </div>
              <div
                className={`p-4 rounded-xl space-y-2 border ${
                  isDark ? 'bg-[#141417] border-[#222226]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-[#f4f4f5]' : 'text-slate-900'}`}>
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>execution_logs</span>
                </div>
                <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>{executions.length} runs recorded</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create New Folder */}
      {isCreateFolderModalOpen && (
        <div
          id="modal-create-folder"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsCreateFolderModalOpen(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl border ${
              isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FolderPlus className="w-4 h-4 text-[#EA580C]" />
                <span>Create New Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateFolderModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-[#71717a] hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-medium ${isDark ? 'text-[#a1a1aa]' : 'text-slate-700'}`}>Folder Name</label>
              <input
                id="input-new-folder-name"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Marketing, Production, Integrations"
                className={`w-full px-3 py-2 rounded-xl text-sm border focus:border-[#EA580C] focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#141417] border-[#27272b] text-white placeholder-[#71717a]'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewFolder();
                  if (e.key === 'Escape') setIsCreateFolderModalOpen(false);
                }}
              />
              <p className={`text-[11px] ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Folders allow organizing workflows into distinct projects or teams.
              </p>
            </div>

            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setIsCreateFolderModalOpen(false)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
                  isDark
                    ? 'bg-[#222226] hover:bg-[#2c2c34] border-transparent text-[#a1a1aa] hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-create-folder"
                type="button"
                disabled={!newFolderName.trim()}
                onClick={handleCreateNewFolder}
                className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Move Workflow to Folder */}
      {movingWf && (
        <div
          id="modal-move-workflow"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setMovingWf(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl border ${
              isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FolderInput className="w-4 h-4 text-amber-500" />
                <span>Move to Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setMovingWf(null)}
                className={`cursor-pointer ${isDark ? 'text-[#71717a] hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>

            <div>
              <div className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-600'}`}>
                Moving workflow: <b className={isDark ? 'text-white' : 'text-slate-900'}>&quot;{movingWf.name}&quot;</b>
              </div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Current location: {movingWf.folder ? `Folder "${movingWf.folder}"` : 'Personal Root'}
              </div>
            </div>

            {/* Folder selection list */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>
                Choose Destination
              </div>

              {/* Personal Root */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFolder('__ROOT__');
                  setCustomNewFolderInline('');
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  selectedTargetFolder === '__ROOT__' && !customNewFolderInline
                    ? 'bg-[#EA580C]/15 border-[#EA580C] text-[#EA580C] font-semibold'
                    : isDark
                    ? 'bg-[#141417] border-[#27272b] text-[#d4d4d8] hover:bg-[#1a1a1e]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`} />
                  <span>Personal Root (No folder)</span>
                </div>
                {selectedTargetFolder === '__ROOT__' && !customNewFolderInline && (
                  <Check className="w-4 h-4 text-[#EA580C]" />
                )}
              </button>

              {/* Existing Folders */}
              {computedFolders.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setSelectedTargetFolder(f);
                    setCustomNewFolderInline('');
                  }}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    selectedTargetFolder === f && !customNewFolderInline
                      ? 'bg-[#EA580C]/15 border-[#EA580C] text-[#EA580C] font-semibold'
                      : isDark
                      ? 'bg-[#141417] border-[#27272b] text-[#d4d4d8] hover:bg-[#1a1a1e]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#EA580C]" />
                    <span>{f}</span>
                  </div>
                  {selectedTargetFolder === f && !customNewFolderInline && (
                    <Check className="w-4 h-4 text-[#EA580C]" />
                  )}
                </button>
              ))}

              {/* Or Create New Folder Inline */}
              <div className="pt-2">
                <div className={`text-[11px] mb-1 ${isDark ? 'text-[#71717a]' : 'text-slate-500'}`}>Or create a new folder:</div>
                <input
                  type="text"
                  value={customNewFolderInline}
                  onChange={(e) => setCustomNewFolderInline(e.target.value)}
                  placeholder="New folder name..."
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:border-[#EA580C] focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#141417] border-[#27272b] text-white placeholder-[#71717a]'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#27272b]' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setMovingWf(null)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
                  isDark
                    ? 'bg-[#222226] hover:bg-[#2c2c34] border-transparent text-[#a1a1aa] hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-move-workflow"
                type="button"
                onClick={handleConfirmMoveWorkflow}
                className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Workflow Modal */}
      {renamingWf && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-5 space-y-4 border shadow-2xl ${
              isDark ? 'bg-[#18181c] border-[#27272b]' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Rename Workflow</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-sm border focus:border-[#EA580C] focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#141417] border-[#27272b] text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') setRenamingWf(null);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingWf(null)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
                  isDark
                    ? 'bg-[#222226] border-transparent text-[#a1a1aa]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinishRename}
                className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#d94806] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
