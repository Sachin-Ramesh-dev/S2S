import React, { useState } from 'react';
import {
  Home,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeft,
  Keyboard,
  Settings,
  Plus
} from 'lucide-react';
import { DomainId, SubViewId, S2S_DOMAINS } from '../types/navigation';
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

  // Accordion state: open the active domain by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    strategy: true,
    content: true,
    workflows: false,
    publishing: false,
    intelligence: false,
    collaboration: false,
    settings: false,
    [activeDomain]: true
  });

  const toggleSection = (domainId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  return (
    <aside
      id="app-sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isDark ? 'bg-[#111116] border-[#22222c]' : 'bg-white border-slate-200 shadow-sm'
      } border-r flex flex-col justify-between shrink-0 transition-all duration-200 z-30 select-none h-full`}
    >
      {/* Top Header: Logo & Collapse Button */}
      <div className="flex flex-col min-h-0 flex-1">
        <div
          className={`h-14 px-3.5 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'border-[#22222c]' : 'border-slate-200'
          }`}
        >
          <div
            id="nav-logo-home"
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('home')}
            title="S2S Home Command Center"
          >
            {/* S2S Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#DD2A7B] p-0.5 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs tracking-tighter">S2S</span>
            </div>
            {!isCollapsed && (
              <div>
                <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  S2S Studio
                </span>
                <span className="block text-[9px] text-zinc-500 font-mono leading-none">v2.4 Enterprise</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-0.5">
              {onQuickSearch && (
                <button
                  id="btn-sidebar-quick-search"
                  type="button"
                  title="Quick Search (Cmd+K)"
                  onClick={onQuickSearch}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#1e1e28] text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
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
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#1e1e28] text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
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
              className={`p-1.5 rounded-lg cursor-pointer ${
                isDark ? 'hover:bg-[#1e1e28] text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {/* HOME LINK */}
          <button
            id="nav-home"
            type="button"
            onClick={() => onNavigate('home')}
            title="Home Command Center"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeDomain === 'home'
                ? 'bg-[#EA580C] text-white shadow-md'
                : isDark
                ? 'text-zinc-300 hover:bg-[#1a1a24] hover:text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Home Hub</span>}
          </button>

          {!isCollapsed && <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Core Domains</div>}

          {/* 7 DOMAIN ACCORDION GROUPS */}
          {S2S_DOMAINS.map((domain) => {
            const isDomainActive = activeDomain === domain.id;
            const isOpen = openSections[domain.id] ?? false;

            return (
              <div key={domain.id} className="space-y-0.5">
                {/* Domain Header Button */}
                <button
                  id={`nav-domain-${domain.id}`}
                  type="button"
                  onClick={() => {
                    if (isCollapsed) {
                      onNavigate(domain.id, domain.defaultSubView);
                    } else {
                      toggleSection(domain.id);
                      if (!isDomainActive) {
                        onNavigate(domain.id, domain.defaultSubView);
                      }
                    }
                  }}
                  title={domain.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDomainActive && isCollapsed
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : isDomainActive
                      ? isDark
                        ? 'bg-[#1c1c28] text-white border border-[#303042]'
                        : 'bg-orange-50/80 text-orange-950 border border-orange-200'
                      : isDark
                      ? 'text-zinc-400 hover:bg-[#181822] hover:text-zinc-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-sm shrink-0">{domain.icon}</span>
                    {!isCollapsed && <span className="truncate">{domain.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1 shrink-0 text-zinc-500">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </button>

                {/* Sub-items List (if open and not collapsed) */}
                {!isCollapsed && isOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-zinc-800 ml-4">
                    {domain.subItems.map((sub) => {
                      const isSubActive = isDomainActive && activeSubView === sub.id;

                      return (
                        <button
                          key={sub.id}
                          id={`nav-sub-${sub.id}`}
                          type="button"
                          onClick={() => onNavigate(domain.id, sub.id)}
                          title={sub.description}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSubActive
                              ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                              : isDark
                              ? 'text-zinc-400 hover:bg-[#1c1c28] hover:text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          {sub.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                              {sub.badge}
                            </span>
                          )}
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

      {/* Bottom Footer: Keyboard Shortcuts */}
      <div
        className={`p-2.5 border-t shrink-0 space-y-1 text-xs ${
          isDark ? 'border-[#22222c] text-zinc-400' : 'border-slate-200 text-slate-600'
        }`}
      >
        {onOpenShortcuts && (
          <button
            id="nav-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheatsheet (?)"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#181822] text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4 shrink-0 text-orange-500" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Shortcuts</span>
                <kbd className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'}`}>
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
