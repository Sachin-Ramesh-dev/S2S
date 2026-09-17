import React, { useState, useMemo } from 'react';
import { Keyboard, Search, X, Command, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  category: 'Workflow Management' | 'Canvas Navigation' | 'Node Operations' | 'General';
}

const SHORTCUTS: ShortcutItem[] = [
  // Workflow Management
  {
    id: 'save',
    keys: ['Ctrl', 'S'],
    description: 'Save current workflow to local database',
    category: 'Workflow Management'
  },
  {
    id: 'undo',
    keys: ['Ctrl', 'Z'],
    description: 'Undo last node position or canvas change',
    category: 'Workflow Management'
  },
  {
    id: 'redo',
    keys: ['Ctrl', 'Y'],
    description: 'Redo previously undone change (or Ctrl+Shift+Z)',
    category: 'Workflow Management'
  },
  {
    id: 'auto-arrange',
    keys: ['Alt', 'A'],
    description: 'Auto-arrange nodes neatly into hierarchical pipeline layout',
    category: 'Workflow Management'
  },
  {
    id: 'delete-node',
    keys: ['Delete'],
    description: 'Delete selected node(s) and their connections',
    category: 'Workflow Management'
  },
  {
    id: 'escape',
    keys: ['Esc'],
    description: 'Deselect all nodes or close configuration drawers / modals',
    category: 'Workflow Management'
  },

  // Canvas Navigation
  {
    id: 'marquee',
    keys: ['Shift', 'Drag'],
    description: 'Draw a rectangular rubber-band marquee to multi-select nodes',
    category: 'Canvas Navigation'
  },
  {
    id: 'multi-select',
    keys: ['Shift', 'Click'],
    description: 'Add or remove an individual node from the multi-selection',
    category: 'Canvas Navigation'
  },
  {
    id: 'pan',
    keys: ['Space', 'Drag'],
    description: 'Pan around the infinite workflow canvas freely',
    category: 'Canvas Navigation'
  },
  {
    id: 'zoom',
    keys: ['Ctrl', 'Wheel'],
    description: 'Smoothly zoom in and out of the canvas workspace',
    category: 'Canvas Navigation'
  },

  // Node Operations
  {
    id: 'configure-node',
    keys: ['Double-Click'],
    description: 'Open node parameter editor drawer and live data inspector',
    category: 'Node Operations'
  },
  {
    id: 'drag-port',
    keys: ['Drag Port'],
    description: 'Drag connection line from an output port to an input port',
    category: 'Node Operations'
  },
  {
    id: 'quick-add',
    keys: ['+ Port Icon'],
    description: 'Open node catalog and auto-wire newly added step',
    category: 'Node Operations'
  },

  // General
  {
    id: 'shortcuts-modal',
    keys: ['?'],
    description: 'Show this keyboard shortcuts reference dialog',
    category: 'General'
  }
];

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [filterQuery, setFilterQuery] = useState('');
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  const filteredShortcuts = useMemo(() => {
    if (!filterQuery.trim()) return SHORTCUTS;
    const q = filterQuery.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q))
    );
  }, [filterQuery]);

  const categories = useMemo(() => {
    const list: ('Workflow Management' | 'Canvas Navigation' | 'Node Operations' | 'General')[] = [
      'Workflow Management',
      'Canvas Navigation',
      'Node Operations',
      'General'
    ];
    return list.filter((cat) => filteredShortcuts.some((s) => s.category === cat));
  }, [filteredShortcuts]);

  if (!isOpen) return null;

  return (
    <div
      id="keyboard-shortcuts-modal"
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          isDark ? 'bg-[#141418] border-[#27272e] text-[#f4f4f5]' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#222226] bg-[#18181d]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EA580C]/15 border border-[#EA580C]/30 flex items-center justify-center text-[#EA580C]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Keyboard Shortcuts</h2>
              <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                Fast navigation and power-user actions for workflow canvas
              </p>
            </div>
          </div>
          <button
            id="btn-close-shortcuts-modal"
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-[#26262e] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Filter Input */}
        <div className={`p-4 border-b ${isDark ? 'border-[#222226] bg-[#141418]' : 'border-slate-100 bg-white'}`}>
          <div className="relative">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#71717a]' : 'text-slate-400'
              }`}
            />
            <input
              id="input-filter-shortcuts"
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search shortcuts (e.g., save, undo, zoom, delete)..."
              autoFocus
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#1b1b20] border border-[#2c2c34] text-white placeholder-[#71717a] focus:border-[#EA580C]'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#EA580C]'
              }`}
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#71717a]">
              No shortcuts found matching &quot;{filterQuery}&quot;.
            </div>
          ) : (
            categories.map((category) => {
              const items = filteredShortcuts.filter((s) => s.category === category);
              return (
                <div key={category} className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#EA580C]">
                    {category}
                  </div>
                  <div
                    className={`rounded-xl border divide-y overflow-hidden ${
                      isDark ? 'bg-[#18181d] border-[#26262e] divide-[#222226]' : 'bg-slate-50 border-slate-200 divide-slate-200/70'
                    }`}
                  >
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-2.5 flex items-center justify-between gap-4 text-xs transition-colors ${
                          isDark ? 'hover:bg-[#1e1e24]' : 'hover:bg-slate-100/80'
                        }`}
                      >
                        <span className={`font-medium ${isDark ? 'text-[#e4e4e7]' : 'text-slate-700'}`}>
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.keys.map((k, idx) => {
                            const displayKey = isMac && k === 'Ctrl' ? '⌘' : k;
                            return (
                              <React.Fragment key={idx}>
                                <kbd
                                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold shadow-xs transition-colors ${
                                    isDark
                                      ? 'bg-[#26262c] text-neutral-200 border border-[#3b3b44] shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                                      : 'bg-white text-slate-800 border border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                  }`}
                                >
                                  {displayKey}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className={`text-[10px] ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>
                                    +
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-[11px] flex items-center justify-between ${
            isDark ? 'border-[#222226] bg-[#18181d] text-[#71717a]' : 'border-slate-100 bg-slate-50 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span>Tip: Press</span>
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${isDark ? 'bg-[#222226] text-neutral-300' : 'bg-white text-slate-700 border border-slate-200'}`}>
              ?
            </kbd>
            <span>anywhere on canvas to open this cheatsheet</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              isDark ? 'hover:bg-[#26262e] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
