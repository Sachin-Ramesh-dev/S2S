import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Edit2,
  Tag,
  Star,
  Copy,
  Download,
  Upload,
  GitBranch,
  History,
  Sliders,
  ShieldCheck,
  Archive,
  ChevronRight,
  Globe,
  FileCode
} from 'lucide-react';
import { Workflow } from '../../types';

interface Props {
  workflow: Workflow;
  onRename: () => void;
  onEditDescriptionTags: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onExportJson: () => void;
  onImportUrl: () => void;
  onImportFile: () => void;
  onPushToGit: () => void;
  onVersionHistory: () => void;
  onSettings: () => void;
  onProductionChecklist: () => void;
  onArchive: () => void;
}

export const WorkflowOptionsMenu: React.FC<Props> = ({
  workflow,
  onRename,
  onEditDescriptionTags,
  onToggleFavorite,
  onDuplicate,
  onExportJson,
  onImportUrl,
  onImportFile,
  onPushToGit,
  onVersionHistory,
  onSettings,
  onProductionChecklist,
  onArchive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportSubmenuOpen, setIsImportSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsImportSubmenuOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (actionFn: () => void) => {
    setIsOpen(false);
    setIsImportSubmenuOpen(false);
    actionFn();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* The "..." square button as seen in screenshot */}
      <button
        id="btn-wf-more-actions"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Workflow actions"
        className={`p-1 rounded-md border transition-colors flex items-center justify-center ${
          isOpen
            ? 'bg-[#28282c] border-[#3f3f46] text-white'
            : 'bg-[#1e1e22] hover:bg-[#28282c] border-[#2c2c32] text-[#a1a1aa] hover:text-white'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu (Exact match to n8n screenshot) */}
      {isOpen && (
        <div
          id="menu-workflow-actions-dropdown"
          className="absolute left-0 mt-1.5 w-60 bg-[#18181c] border border-[#27272b] rounded-lg shadow-2xl py-1.5 text-xs text-[#d4d4d8] z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 1. Rename */}
          <button
            type="button"
            onClick={() => handleAction(onRename)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Rename</span>
          </button>

          {/* 2. Edit description and tags */}
          <button
            type="button"
            onClick={() => handleAction(onEditDescriptionTags)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Edit description and tags</span>
          </button>

          {/* 3. Favorite */}
          <button
            type="button"
            onClick={() => handleAction(onToggleFavorite)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                workflow.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-[#a1a1aa]'
              }`}
            />
            <span>{workflow.isFavorite ? 'Remove from favorites' : 'Favorite'}</span>
          </button>

          {/* 4. Duplicate */}
          <button
            type="button"
            onClick={() => handleAction(onDuplicate)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Duplicate</span>
          </button>

          {/* 5. Export JSON */}
          <button
            type="button"
            onClick={() => handleAction(onExportJson)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Export JSON</span>
          </button>

          {/* 6. Import... with flyout submenu */}
          <div
            className="relative"
            onMouseEnter={() => setIsImportSubmenuOpen(true)}
            onMouseLeave={() => setIsImportSubmenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsImportSubmenuOpen(!isImportSubmenuOpen)}
              className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-3.5 h-3.5 text-[#a1a1aa]" />
                <span>Import...</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#71717a]" />
            </button>

            {/* Submenu */}
            {isImportSubmenuOpen && (
              <div className="absolute left-full top-0 ml-1 w-48 bg-[#18181c] border border-[#27272b] rounded-lg shadow-2xl py-1.5 text-xs text-[#d4d4d8] z-50">
                <button
                  type="button"
                  onClick={() => handleAction(onImportUrl)}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  <span>Import from URL...</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onImportFile)}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  <span>Import from file...</span>
                </button>
              </div>
            )}
          </div>

          <div className="my-1 border-t border-[#27272b]" />

          {/* 7. Push to git */}
          <button
            type="button"
            onClick={() => handleAction(onPushToGit)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Push to git</span>
          </button>

          {/* 8. Version history */}
          <button
            type="button"
            onClick={() => handleAction(onVersionHistory)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Version history</span>
          </button>

          {/* 9. Settings */}
          <button
            type="button"
            onClick={() => handleAction(onSettings)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Settings</span>
          </button>

          {/* 10. Production checklist */}
          <button
            type="button"
            onClick={() => handleAction(onProductionChecklist)}
            className="w-full px-3.5 py-2 text-left hover:bg-[#26262b] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Production checklist</span>
          </button>

          <div className="my-1 border-t border-[#27272b]" />

          {/* 11. Archive (in red) */}
          <button
            type="button"
            onClick={() => handleAction(onArchive)}
            className="w-full px-3.5 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-rose-400" />
            <span>Archive</span>
          </button>
        </div>
      )}
    </div>
  );
};
