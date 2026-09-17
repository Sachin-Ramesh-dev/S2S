import React from 'react';
import { WorkflowNode as IWorkflowNode } from '../types';
import {
  AlignHorizontalDistributeCenter,
  AlignVerticalJustifyCenter,
  AlignHorizontalSpaceBetween,
  Trash2,
  Copy,
  X,
  Sparkles
} from 'lucide-react';

interface Props {
  selectedNodeIds: string[];
  nodes: IWorkflowNode[];
  onAlignHorizontal: () => void;
  onAlignVertical: () => void;
  onDistributeHorizontal: () => void;
  onBatchDuplicate: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}

export const SelectionContextMenu: React.FC<Props> = ({
  selectedNodeIds,
  nodes,
  onAlignHorizontal,
  onAlignVertical,
  onDistributeHorizontal,
  onBatchDuplicate,
  onBatchDelete,
  onClearSelection
}) => {
  if (selectedNodeIds.length <= 1) return null;

  return (
    <div
      id="selection-context-menu"
      className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#18181c]/95 border border-[#2e2e36] rounded-2xl shadow-2xl backdrop-blur-md px-3 py-2 flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-xs font-semibold text-indigo-300">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span>{selectedNodeIds.length} Selected</span>
      </div>

      <div className="w-px h-5 bg-[#2e2e36]" />

      {/* Alignment Actions */}
      <div className="flex items-center gap-1">
        <button
          id="btn-align-horizontal"
          type="button"
          onClick={onAlignHorizontal}
          title="Align Horizontally (Center Y)"
          className="p-1.5 hover:bg-[#26262c] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          <AlignHorizontalDistributeCenter className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Align H</span>
        </button>

        <button
          id="btn-align-vertical"
          type="button"
          onClick={onAlignVertical}
          title="Align Vertically (Center X)"
          className="p-1.5 hover:bg-[#26262c] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          <AlignVerticalJustifyCenter className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Align V</span>
        </button>

        <button
          id="btn-distribute-horizontal"
          type="button"
          onClick={onDistributeHorizontal}
          disabled={selectedNodeIds.length < 3}
          title="Distribute Horizontally (Even spacing)"
          className="p-1.5 hover:bg-[#26262c] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <AlignHorizontalSpaceBetween className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Distribute</span>
        </button>
      </div>

      <div className="w-px h-5 bg-[#2e2e36]" />

      {/* Operations: Duplicate & Delete */}
      <div className="flex items-center gap-1">
        <button
          id="btn-batch-duplicate"
          type="button"
          onClick={onBatchDuplicate}
          title="Duplicate selected nodes"
          className="p-1.5 hover:bg-[#26262c] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>

        <button
          id="btn-batch-delete"
          type="button"
          onClick={onBatchDelete}
          title="Delete selected nodes and connections"
          className="p-1.5 hover:bg-rose-950/60 text-[#a1a1aa] hover:text-rose-400 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      <div className="w-px h-5 bg-[#2e2e36]" />

      {/* Clear selection */}
      <button
        id="btn-clear-selection"
        type="button"
        onClick={onClearSelection}
        title="Clear selection (Esc)"
        className="p-1.5 hover:bg-[#26262c] text-[#71717a] hover:text-white rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
