import React, { useState } from 'react';
import {
  Home,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeft,
  Keyboard,
  Compass,
  ListFilter,
  Layers,
  Calendar,
  BarChart3,
  Zap,
  Target,
  ShieldCheck,
  Users2,
  Settings,
  History,
  Sparkles,
  Wrench
} from 'lucide-react';
import {
  DomainId,
  SubViewId,
  PRIMARY_JOURNEY_DOMAINS,
  AUTOMATION_DOMAINS,
  SUPPORTING_TOOL_DOMAINS
} from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeDomain: DomainId;
  activeSubView: SubViewId;
  onNavigate: (domain: DomainId, subView?: SubViewId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onQuickSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeDomain,
  activeSubView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onQuickSearch,
  onOpenShortcuts
}) => {
  const { isDark } = useTheme();

  // Accordion state for Workflows and Supporting Tools (collapsed by default for clean airy sidebar)
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false);
  const [isSupportingOpen, setIsSupportingOpen] = useState(false);
  const [openPrimarySubViews, setOpenPrimarySubViews] = useState<Record<string, boolean>>({
    production: false,
    publishing: false,
    performance: false
  });

  // Map legacy domain active states to primary journey or supporting tools
  const isPrimaryActive = (id: string): boolean => {
    // 1. Content Production / Script Studio
    // Active whenever activeDomain is 'production' OR when in content with production subviews
    const isInsideProduction =
      activeDomain === 'production' ||
      ((activeDomain === 'content' || activeDomain === 'topics') &&
        (activeSubView === 'scripts' || activeSubView === 'creative' || activeSubView === 'storyboard' || activeSubView === 'repurpose'));

    if (isInsideProduction) {
      return id === 'production';
    }

    // 2. Topics (strictly inactive when inside production)
    const isInsideTopics =
      (activeDomain === 'topics' && activeSubView !== 'scripts' && activeSubView !== 'creative' && activeSubView !== 'storyboard') ||
      (activeDomain === 'content' && activeSubView === 'topics');

    if (isInsideTopics) {
      return id === 'topics';
    }

    // 3. Home
    if (id === 'home') {
      return activeDomain === 'home';
    }

    // 4. Page Audit
    if (id === 'audit') {
      return activeDomain === 'audit' || (activeDomain === 'strategy' && activeSubView === 'audit');
    }

    // 5. Publishing
    if (id === 'publishing') {
      return activeDomain === 'publishing';
    }

    // 6. Performance
    if (id === 'performance') {
      return activeDomain === 'performance' || activeDomain === 'intelligence';
    }

    return false;
  };

  const isSupportingActive = (id: string): boolean => {
    if (activeDomain === id) return true;
    if (id === 'competitors' && activeDomain === 'strategy' && activeSubView === 'competitors') return true;
    if (id === 'guardrails' && (activeDomain === 'strategy' && activeSubView === 'opportunities')) return true;
    if (id === 'collaboration' && activeDomain === 'collaboration') return true;
    if (id === 'settings' && activeDomain === 'settings') return true;
    return false;
  };

  const getPrimaryIcon = (id: string) => {
    switch (id) {
      case 'home':
        return <Home className="w-4 h-4 shrink-0" />;
      case 'audit':
        return <Compass className="w-4 h-4 shrink-0" />;
      case 'topics':
        return <ListFilter className="w-4 h-4 shrink-0" />;
      case 'production':
        return <Layers className="w-4 h-4 shrink-0" />;
      case 'publishing':
        return <Calendar className="w-4 h-4 shrink-0" />;
      case 'performance':
        return <BarChart3 className="w-4 h-4 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 shrink-0" />;
    }
  };

  const getSupportingIcon = (id: string) => {
    switch (id) {
      case 'competitors':
        return <Target className="w-4 h-4 shrink-0" />;
      case 'guardrails':
        return <ShieldCheck className="w-4 h-4 shrink-0" />;
      case 'collaboration':
        return <Users2 className="w-4 h-4 shrink-0" />;
      case 'settings':
        return <Settings className="w-4 h-4 shrink-0" />;
      case 'audit_history':
        return <History className="w-4 h-4 shrink-0" />;
      default:
        return <Wrench className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <aside
      id="app-sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-neutral-200'
      } border-r flex flex-col justify-between shrink-0 transition-all duration-200 z-30 select-none h-full`}
    >
      {/* Top Header: Logo & Collapse Button */}
      <div className="flex flex-col min-h-0 flex-1">
        <div
          className={`h-14 px-3.5 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'border-[#27272A]' : 'border-neutral-200'
          }`}
        >
          <div
            id="nav-logo-home"
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('home')}
            title="S2S Home Command Center"
          >
            {/* S2S Logo */}
            <div className="w-8 h-8 rounded-lg bg-[#F43F5E] shadow-xs flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-tight font-heading">S2S</span>
            </div>
            {!isCollapsed && (
              <div>
                <span className={`text-sm font-bold tracking-tight font-heading uppercase ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  S2S Studio
                </span>
                <span className="block text-[9px] text-neutral-400 dark:text-zinc-500 font-medium leading-none">Content OS &amp; Automation</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {onQuickSearch && (
                <button
                  id="btn-sidebar-quick-search"
                  type="button"
                  title="Quick Search (Cmd+K)"
                  onClick={onQuickSearch}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-sidebar-toggle"
                type="button"
                title="Toggle Sidebar"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg transition-colors cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {isCollapsed && (
            <button
              type="button"
              title="Expand Sidebar"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg transition-colors cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* ============================================================== */}
          {/* SECTION 1: 🚀 PRIMARY JOURNEY (Visually Dominant)              */}
          {/* ============================================================== */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider font-heading text-neutral-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span>🚀</span>
                  <span>Primary Journey</span>
                </span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400">Content OS</span>
              </div>
            )}

            <div className="space-y-1">
              {PRIMARY_JOURNEY_DOMAINS.map((domain) => {
                const active = isPrimaryActive(domain.id);
                const hasSubItems = domain.subItems && domain.subItems.length > 0;
                const isSubOpen = openPrimarySubViews[domain.id] ?? false;

                return (
                  <div key={domain.id} className="space-y-0.5">
                    <button
                      id={`nav-primary-${domain.id}`}
                      type="button"
                      onClick={() => {
                        if (hasSubItems && !isCollapsed) {
                          setOpenPrimarySubViews((prev) => ({ ...prev, [domain.id]: !prev[domain.id] }));
                        }
                        onNavigate(domain.id, domain.defaultSubView);
                      }}
                      title={domain.description}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                          : isDark
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {getPrimaryIcon(domain.id)}
                        {!isCollapsed && <span className="truncate">{domain.label}</span>}
                      </div>

                      {!isCollapsed && hasSubItems && (
                        <div
                          className="p-0.5 text-zinc-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPrimarySubViews((prev) => ({ ...prev, [domain.id]: !prev[domain.id] }));
                          }}
                        >
                          {isSubOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      )}
                    </button>

                    {/* Sub-items for Primary Journey (if expanded) */}
                    {!isCollapsed && hasSubItems && isSubOpen && (
                      <div className="pl-6 pr-1 py-1 space-y-1 border-l border-[#171717]/25 dark:border-[#383844] ml-4 my-1">
                        {domain.subItems!.map((sub) => {
                          const isSubActive = active && activeSubView === sub.id;
                          return (
                            <button
                              key={sub.id}
                              id={`nav-sub-${domain.id}-${sub.id}`}
                              type="button"
                              onClick={() => onNavigate(domain.id, sub.id)}
                              title={sub.description}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer text-left border ${
                                isSubActive
                                  ? 'bg-[#FFD66B] text-[#111111] font-bold border-[#171717]/40 shadow-[1px_1px_0_#111111]'
                                  : isDark
                                  ? 'border-transparent text-zinc-400 hover:bg-[#1E1E24] hover:text-[#F5F3EC]'
                                  : 'border-transparent text-[#4B5563] hover:bg-white hover:text-[#111111]'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: ⚡ AUTOMATION (Dedicated Domain - n8n Workflows)   */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-neutral-200 dark:border-zinc-800 space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider font-heading text-neutral-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Automation</span>
                </span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400">
                  n8n Engine
                </span>
              </div>
            )}

            {AUTOMATION_DOMAINS.map((domain) => {
              const isWorkflowsActive = activeDomain === 'workflows';

              return (
                <div key={domain.id} className="space-y-0.5">
                  <button
                    id="nav-automation-workflows"
                    type="button"
                    onClick={() => {
                      if (isCollapsed) {
                        onNavigate('workflows', 'builder');
                      } else {
                        setIsWorkflowsOpen(!isWorkflowsOpen);
                        if (!isWorkflowsActive) {
                          onNavigate('workflows', 'builder');
                        }
                      }
                    }}
                    title={domain.description}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isWorkflowsActive
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Zap className="w-4 h-4 shrink-0 text-sky-500" />
                      {!isCollapsed && <span className="truncate">{domain.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1 shrink-0 text-neutral-400 dark:text-zinc-500">
                        {isWorkflowsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </button>

                  {/* Workflows 5 Sub-Items (Builder, Templates, Active, Runs, Automations) */}
                  {!isCollapsed && isWorkflowsOpen && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l border-neutral-200 dark:border-zinc-800 ml-4 my-1">
                      {domain.subItems!.map((sub) => {
                        const isSubActive = isWorkflowsActive && activeSubView === sub.id;

                        return (
                          <button
                            key={sub.id}
                            id={`nav-sub-${sub.id}`}
                            type="button"
                            onClick={() => onNavigate('workflows', sub.id)}
                            title={sub.description}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                              isSubActive
                                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold'
                                : isDark
                                ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* SECTION 3: 🛠️ SUPPORTING TOOLS (Collapsible, Visually Secondary) */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-neutral-200 dark:border-zinc-800 space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSupportingOpen(!isSupportingOpen)}
                className="w-full px-2.5 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider font-heading text-neutral-400 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>Supporting Tools</span>
                </span>
                <span className="text-neutral-400 dark:text-zinc-500">
                  {isSupportingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              </button>
            ) : (
              <div className="h-px bg-neutral-200 dark:bg-zinc-800 my-1" />
            )}

            {(isSupportingOpen || isCollapsed) && (
              <div className="space-y-1">
                {SUPPORTING_TOOL_DOMAINS.map((tool) => {
                  const active = isSupportingActive(tool.id);

                  return (
                    <button
                      key={tool.id}
                      id={`nav-supporting-${tool.id}`}
                      type="button"
                      onClick={() => onNavigate(tool.id, tool.defaultSubView)}
                      title={tool.description}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                          : isDark
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {getSupportingIcon(tool.id)}
                        {!isCollapsed && <span className="truncate">{tool.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Keyboard Shortcuts */}
      <div
        className={`p-2.5 border-t shrink-0 space-y-1 text-xs ${
          isDark ? 'border-[#27272A] text-zinc-400' : 'border-neutral-200 text-neutral-600'
        }`}
      >
        {onOpenShortcuts && (
          <button
            id="nav-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheatsheet (?)"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300 transition-colors cursor-pointer font-medium text-xs`}
          >
            <Keyboard className="w-4 h-4 shrink-0 text-neutral-500 dark:text-zinc-400" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Shortcuts</span>
                <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 text-[10px] font-mono font-medium">
                  ?
                </kbd>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

