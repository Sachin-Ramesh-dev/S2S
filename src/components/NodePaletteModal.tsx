import React, { useState, useMemo } from 'react';
import { NodeDefinition, NodeCategory } from '../types';
import {
  X,
  Search,
  Play,
  Webhook,
  Clock,
  Globe,
  Code2,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Send,
  BellRing,
  FileSpreadsheet,
  Plus,
  Boxes,
  HelpCircle,
  Database,
  Repeat,
  Filter,
  GitMerge,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Mail,
  MessageSquare
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableNodes: NodeDefinition[];
  onAddNode: (definition: NodeDefinition) => void;
  onOpenPluginManager: () => void;
}

const ICON_MAP: Record<string, any> = {
  Play,
  Webhook,
  Clock,
  Globe,
  Code2,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Send,
  BellRing,
  FileSpreadsheet,
  Boxes,
  Database,
  Repeat,
  Filter,
  GitMerge,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Mail,
  MessageSquare
};

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  trigger: ['trigger', 'triggers', 'webhook', 'schedule', 'cron', 'event', 'inbound', 'start', 'email'],
  action: ['action', 'actions', 'network', 'rest', 'api', 'http', 'request', 'post', 'get', 'slack', 'discord', 'telegram', 'send'],
  transform: ['transform', 'code', 'javascript', 'eval', 'format', 'json', 'data', 'math', 'string', 'parser'],
  logic: ['logic', 'branch', 'if', 'else', 'switch', 'filter', 'router', 'merge', 'condition', 'branching'],
  security: ['security', 'e2ee', 'crypto', 'encrypt', 'decrypt', 'hash', 'signature', 'jwt', 'vault'],
  plugin: ['plugin', 'plugins', 'community', 'custom', 'extension', 'npm']
};

export const NodePaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  availableNodes,
  onAddNode,
  onOpenPluginManager
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredNodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableNodes.filter((node) => {
      const matchCategoryTab =
        selectedCategory === 'all' ||
        (selectedCategory === 'plugin' ? node.isPlugin : node.category === selectedCategory);

      if (!matchCategoryTab) return false;
      if (!q) return true;

      const nameMatch = node.name.toLowerCase().includes(q);
      const descMatch = node.description.toLowerCase().includes(q);
      const typeMatch = node.type.toLowerCase().includes(q);
      const categoryMatch = node.category.toLowerCase().includes(q);

      const synonyms = CATEGORY_SYNONYMS[node.category] || [];
      const synonymMatch = synonyms.some((syn) => syn.includes(q) || q.includes(syn));

      return nameMatch || descMatch || typeMatch || categoryMatch || synonymMatch;
    });
  }, [availableNodes, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-node-palette"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              Node Catalog & Plugin Library
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Add triggers, actions, local data transforms, or custom developer plugins to your workflow.
            </p>
          </div>
          <button
            id="btn-close-palette"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              id="input-search-nodes"
              type="text"
              placeholder="Search nodes by name, description, or category (e.g. trigger, action, logic)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-24 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition-colors"
              autoFocus
            />
            {search && (
              <button
                id="btn-clear-palette-search"
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 font-mono">
              {filteredNodes.length} found
            </span>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
            {[
              { id: 'all', label: 'All Nodes' },
              { id: 'trigger', label: 'Triggers' },
              { id: 'action', label: 'Network & REST' },
              { id: 'transform', label: 'Transform & Code' },
              { id: 'logic', label: 'Logic & Branching' },
              { id: 'security', label: 'Security & E2EE' },
              { id: 'plugin', label: 'Custom Plugins' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nodes Grid */}
        <div
          id="palette-nodes-grid"
          className="flex-1 min-h-0 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start auto-rows-max scroll-smooth"
        >
          {filteredNodes.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-200">No nodes found</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                No components matched your search query "{search}". Try searching by category like "trigger", "action", or "logic".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredNodes.map((node) => {
              const IconComp = ICON_MAP[node.icon] || HelpCircle;
              return (
                <div
                  key={node.type}
                  id={`palette-item-${node.type}`}
                  onClick={() => {
                    onAddNode(node);
                    onClose();
                  }}
                  className="group p-4 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-start gap-3.5 relative overflow-hidden"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${node.color || '#6366F1'}20`,
                      color: node.color || '#6366F1'
                    }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-300 transition-colors truncate">
                        {node.name}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                        {node.category}
                      </span>
                      {node.isPlugin && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 text-[10px] font-mono border border-indigo-800/40">
                          PLUGIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-indigo-600 text-white rounded-lg self-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer / Plugin CTA */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            Need a custom integration or specialized data module?
          </span>
          <button
            id="btn-open-plugin-creator-from-palette"
            type="button"
            onClick={() => {
              onClose();
              onOpenPluginManager();
            }}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 hover:text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            Develop Custom Node Plugin
          </button>
        </div>
      </div>
    </div>
  );
};
