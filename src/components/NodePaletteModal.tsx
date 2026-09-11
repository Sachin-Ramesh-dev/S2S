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
  HelpCircle
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
  Boxes
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
    return availableNodes.filter((node) => {
      const matchSearch =
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase()) ||
        node.type.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'plugin' ? node.isPlugin : node.category === selectedCategory);

      return matchSearch && matchCategory;
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
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              id="input-search-nodes"
              type="text"
              placeholder="Search nodes by name, description, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
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
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNodes.map((node) => {
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
          })}

          {filteredNodes.length === 0 && (
            <div className="col-span-2 py-12 text-center text-neutral-500 text-xs">
              No matching nodes found for "{search}".
            </div>
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
