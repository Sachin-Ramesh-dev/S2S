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

  // Accordion state for Workflows and Supporting Tools
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(true);
  const [isSupportingOpen, setIsSupportingOpen] = useState(true);
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
        isDark ? 'bg-[#131316] border-[#383844]' : 'bg-[#F8F5EE] border-[#171717]'
      } border-r-2 flex flex-col justify-between shrink-0 transition-all duration-200 z-30 select-none h-full`}
    >
      {/* Top Header: Logo & Collapse Button */}
      <div className="flex flex-col min-h-0 flex-1">
        <div
          className={`h-14 px-3.5 flex items-center justify-between border-b-2 shrink-0 ${
            isDark ? 'border-[#383844]' : 'border-[#171717]'
          }`}
        >
          <div
            id="nav-logo-home"
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('home')}
            title="S2S Home Command Center"
          >
            {/* S2S Logo */}
            <div className="w-8 h-8 rounded-lg bg-[#FF4D5A] border-2 border-[#171717] dark:border-[#383844] shadow-[2px_2px_0_#111111] dark:shadow-[2px_2px_0_#0A0A0D] flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-tight font-heading">S2S</span>
            </div>
            {!isCollapsed && (
              <div>
                <span className={`text-sm font-black tracking-tight font-heading uppercase ${isDark ? 'text-[#F5F3EC]' : 'text-[#111111]'}`}>
                  S2S Studio
                </span>
                <span className="block text-[9px] text-[#4B5563] dark:text-[#9CA3AF] font-bold font-mono leading-none">Content OS &amp; Automation</span>
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
                  className={`p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
                    isDark
                      ? 'border-transparent hover:border-[#383844] hover:bg-[#1E1E24] text-zinc-400 hover:text-white shadow-none hover:shadow-[2px_2px_0_#0A0A0D]'
                      : 'border-transparent hover:border-[#171717] hover:bg-white text-[#111111] shadow-none hover:shadow-[2px_2px_0_#111111]'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-sidebar-toggle"
                type="button"
                title="Toggle Sidebar"
                onClick={onToggleCollapse}
                className={`p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
                  isDark
                    ? 'border-transparent hover:border-[#383844] hover:bg-[#1E1E24] text-zinc-400 hover:text-white shadow-none hover:shadow-[2px_2px_0_#0A0A0D]'
                    : 'border-transparent hover:border-[#171717] hover:bg-white text-[#111111] shadow-none hover:shadow-[2px_2px_0_#111111]'
                }`}
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
              className={`p-1.5 rounded-lg border-2 border-transparent hover:border-[#171717] dark:hover:border-[#383844] hover:bg-white dark:hover:bg-[#1E1E24] cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-[#111111]'
              }`}
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
              <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider font-heading text-[#111111] dark:text-[#F5F3EC]">
                <span className="flex items-center gap-1.5">
                  <span>🚀</span>
                  <span>Primary Journey</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#171717] dark:border-[#383844] bg-[#FFD66B] text-[#111111] font-bold">Content OS</span>
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
                        active
                          ? 'bg-[#111111] text-white dark:bg-[#F5F3EC] dark:text-[#111111] border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D]'
                          : isDark
                          ? 'border-transparent text-zinc-300 hover:border-[#383844] hover:bg-[#1E1E24] hover:text-[#F5F3EC] hover:shadow-[2px_2px_0_#0A0A0D]'
                          : 'border-transparent text-[#111111] hover:border-[#171717] hover:bg-white hover:text-[#111111] hover:shadow-[2px_2px_0_#111111]'
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
                      <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-[#171717] dark:border-[#383844] ml-4 my-1">
                        {domain.subItems!.map((sub) => {
                          const isSubActive = active && activeSubView === sub.id;
                          return (
                            <button
                              key={sub.id}
                              id={`nav-sub-${domain.id}-${sub.id}`}
                              type="button"
                              onClick={() => onNavigate(domain.id, sub.id)}
                              title={sub.description}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer text-left border-2 ${
                                isSubActive
                                  ? 'bg-[#FFD66B] text-[#111111] font-black border-[#171717] shadow-[2px_2px_0_#111111]'
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
          <div className="pt-2 border-t-2 border-[#171717] dark:border-[#383844] space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider font-heading text-[#111111] dark:text-[#F5F3EC]">
                <span className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Automation</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#171717] dark:border-[#383844] bg-[#7CC7FF] text-[#111111] font-bold">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
                      isWorkflowsActive
                        ? 'bg-[#7CC7FF] text-[#111111] border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D]'
                        : isDark
                        ? 'border-transparent text-zinc-400 hover:border-[#383844] hover:bg-[#1E1E24] hover:text-[#F5F3EC] hover:shadow-[2px_2px_0_#0A0A0D]'
                        : 'border-transparent text-[#111111] hover:border-[#171717] hover:bg-white hover:text-[#111111] hover:shadow-[2px_2px_0_#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Zap className="w-4 h-4 shrink-0 text-[#111111] dark:text-[#7CC7FF]" />
                      {!isCollapsed && <span className="truncate">{domain.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1 shrink-0 text-[#111111] dark:text-zinc-400">
                        {isWorkflowsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </button>

                  {/* Workflows 5 Sub-Items (Builder, Templates, Active, Runs, Automations) */}
                  {!isCollapsed && isWorkflowsOpen && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-[#171717] dark:border-[#383844] ml-4 my-1">
                      {domain.subItems!.map((sub) => {
                        const isSubActive = isWorkflowsActive && activeSubView === sub.id;

                        return (
                          <button
                            key={sub.id}
                            id={`nav-sub-${sub.id}`}
                            type="button"
                            onClick={() => onNavigate('workflows', sub.id)}
                            title={sub.description}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer text-left border-2 ${
                              isSubActive
                                ? 'bg-[#7CC7FF] text-[#111111] font-black border-[#171717] shadow-[2px_2px_0_#111111]'
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

          {/* ============================================================== */}
          {/* SECTION 3: 🛠️ SUPPORTING TOOLS (Collapsible, Visually Secondary) */}
          {/* ============================================================== */}
          <div className="pt-2 border-t-2 border-[#171717] dark:border-[#383844] space-y-1">
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSupportingOpen(!isSupportingOpen)}
                className="w-full px-2.5 pb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider font-heading text-[#111111] dark:text-[#F5F3EC] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>Supporting Tools</span>
                </span>
                <span className="text-[#111111] dark:text-zinc-400">
                  {isSupportingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              </button>
            ) : (
              <div className="h-0.5 bg-[#171717] dark:bg-[#383844] my-1" />
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-2 ${
                        active
                          ? 'bg-[#B9A7FF] text-[#111111] border-[#171717] dark:border-[#383844] shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#0A0A0D]'
                          : isDark
                          ? 'border-transparent text-zinc-400 hover:border-[#383844] hover:bg-[#1E1E24] hover:text-[#F5F3EC] hover:shadow-[2px_2px_0_#0A0A0D]'
                          : 'border-transparent text-[#111111] hover:border-[#171717] hover:bg-white hover:text-[#111111] hover:shadow-[2px_2px_0_#111111]'
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
        className={`p-2.5 border-t-2 shrink-0 space-y-1 text-xs ${
          isDark ? 'border-[#383844] text-zinc-400' : 'border-[#171717] text-[#111111]'
        }`}
      >
        {onOpenShortcuts && (
          <button
            id="nav-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheatsheet (?)"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 border-[#171717] dark:border-[#383844] bg-white dark:bg-[#1E1E24] shadow-[2px_2px_0_#111111] dark:shadow-[2px_2px_0_#0A0A0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer font-bold`}
          >
            <Keyboard className="w-4 h-4 shrink-0 text-[#111111] dark:text-[#FFD66B]" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Shortcuts</span>
                <kbd className="px-1.5 py-0.5 rounded border border-[#171717] dark:border-[#383844] bg-[#FFD66B] text-[#111111] text-[10px] font-mono font-black">
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

