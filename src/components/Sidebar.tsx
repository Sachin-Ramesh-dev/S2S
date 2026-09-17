import React from 'react';
import {
  Workflow,
  Server,
  Settings,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Keyboard
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeNav: 'overview' | 'personal' | 'workflow' | 'instagram' | 'workflows' | 'mcp' | 'settings';
  onNavigate: (nav: 'instagram' | 'workflows' | 'mcp' | 'settings') => void;
  onCreateWorkflow: () => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onQuickSearch: () => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigate,
  onCreateWorkflow,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  onQuickSearch,
  onOpenShortcuts
}) => {
  const { isDark } = useTheme();
  const isWorkflowsActive = activeNav === 'workflows' || activeNav === 'overview' || activeNav === 'personal' || activeNav === 'workflow';

  return (
    <aside
      id="app-sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-56'
      } ${
        isDark
          ? 'bg-[#131316] border-[#222226]'
          : 'bg-white border-slate-200 shadow-xs'
      } border-r flex flex-col justify-between shrink-0 transition-all duration-200 z-30 select-none`}
    >
      {/* Top Section: Logo & Primary Nav */}
      <div className="flex flex-col">
        {/* Logo Bar */}
        <div
          className={`h-14 px-3.5 flex items-center justify-between border-b ${
            isDark ? 'border-[#222226]/60' : 'border-slate-200'
          }`}
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('instagram')}
            title="S2S Workspace"
          >
            {/* n8n Connected Node Logo */}
            <div className="flex items-center text-[#EA580C]">
              <svg
                className="w-6 h-6 fill-current"
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
            {!isCollapsed && (
              <span
                className={`text-base font-bold tracking-tight font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                S2S
              </span>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                id="btn-sidebar-quick-create"
                type="button"
                title="Create workflow"
                onClick={onCreateWorkflow}
                className={`p-1 rounded transition-colors ${
                  isDark
                    ? 'hover:bg-[#222226] text-[#a1a1aa] hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                id="btn-sidebar-quick-search"
                type="button"
                title="Search"
                onClick={onQuickSearch}
                className={`p-1 rounded transition-colors ${
                  isDark
                    ? 'hover:bg-[#222226] text-[#a1a1aa] hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                id="btn-sidebar-toggle"
                type="button"
                title="Toggle sidebar"
                onClick={onToggleCollapse}
                className={`p-1 rounded transition-colors ${
                  isDark
                    ? 'hover:bg-[#222226] text-[#a1a1aa] hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}
          {isCollapsed && (
            <button
              type="button"
              title="Expand sidebar"
              onClick={onToggleCollapse}
              className={`p-1 rounded ${
                isDark
                  ? 'hover:bg-[#222226] text-[#a1a1aa] hover:text-white'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Navigation List */}
        <nav className="p-2 space-y-1.5">
          {/* Content & Audit */}
          <button
            id="nav-content-and-audit"
            type="button"
            onClick={() => onNavigate('instagram')}
            title="Content & Audit"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeNav === 'instagram'
                ? 'bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white shadow-sm font-semibold'
                : isDark
                ? 'text-[#f4f4f5] bg-[#1a1a1e]/90 hover:bg-[#222226] border border-[#EA580C]/30 hover:border-[#EA580C]'
                : 'text-slate-800 bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200/80'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${activeNav === 'instagram' ? 'text-white' : 'text-[#EA580C]'}`} />
            {!isCollapsed && <span className="truncate">Content & Audit</span>}
          </button>

          {/* Workflows (combines Overview, Personal, Templates) */}
          <button
            id="nav-workflows"
            type="button"
            onClick={() => onNavigate('workflows')}
            title="Workflows"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isWorkflowsActive
                ? isDark
                  ? 'bg-[#222226] text-white shadow-sm font-semibold border border-[#3f3f46]'
                  : 'bg-slate-100 text-slate-950 shadow-xs font-semibold border border-slate-300'
                : isDark
                ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-[#f4f4f5]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Workflow className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#f4f4f5]' : 'text-slate-700'}`} />
            {!isCollapsed && <span>Workflows</span>}
          </button>

          {/* MCP Connections */}
          <button
            id="nav-mcp-connections"
            type="button"
            onClick={() => onNavigate('mcp')}
            title="MCP Connections"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeNav === 'mcp'
                ? isDark
                  ? 'bg-[#222226] text-white shadow-sm font-semibold border border-[#3f3f46]'
                  : 'bg-slate-100 text-slate-950 shadow-xs font-semibold border border-slate-300'
                : isDark
                ? 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-[#f4f4f5]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Server className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`} />
            {!isCollapsed && <span>MCP Connections</span>}
          </button>
        </nav>
      </div>

      {/* Bottom Section: Keyboard Shortcuts & Global Settings */}
      <div
        className={`p-2 border-t space-y-1 text-xs ${
          isDark ? 'border-[#222226]/60 text-[#a1a1aa]' : 'border-slate-200 text-slate-600'
        }`}
      >

        {/* Keyboard Shortcuts Cheatsheet */}
        {onOpenShortcuts && (
          <button
            id="nav-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheatsheet (?)"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-[#1a1a1e] hover:text-[#f4f4f5] text-[#a1a1aa]'
                : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
            }`}
          >
            <Keyboard className="w-4 h-4 shrink-0 text-[#EA580C]" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Shortcuts</span>
                <kbd className={`px-1 py-0.2 rounded text-[10px] font-mono ${isDark ? 'bg-[#222226] text-neutral-400' : 'bg-slate-200 text-slate-600'}`}>
                  ?
                </kbd>
              </div>
            )}
          </button>
        )}

        {/* Global Settings */}
        <button
          id="nav-settings"
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
            activeNav === 'settings'
              ? isDark
                ? 'bg-[#222226] text-white font-semibold'
                : 'bg-slate-100 text-slate-950 font-semibold'
              : isDark
              ? 'hover:bg-[#1a1a1e] hover:text-[#f4f4f5]'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};

