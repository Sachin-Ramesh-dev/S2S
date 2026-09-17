import React, { useState } from 'react';
import {
  FileText,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Video,
  Copy,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Edit3,
  CheckSquare,
  Eye,
  Send,
  Kanban,
  Users,
  Film,
  GripVertical,
  ArrowDown
} from 'lucide-react';
import { ScriptItem, TeamMember } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

export type SwimlaneStage = 'needs_writing' | 'draft' | 'in_review' | 'ready_to_record' | 'completed';

export interface SwimlaneStageConfig {
  key: SwimlaneStage;
  label: string;
  sublabel: string;
  badgeColor: string;
  borderAccent: string;
  headerBg: string;
}

export const SWIMLANE_STAGES: SwimlaneStageConfig[] = [
  {
    key: 'needs_writing',
    label: 'Needs Writing',
    sublabel: 'Backlog / Topic ready',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    borderAccent: 'border-slate-300',
    headerBg: 'bg-slate-50'
  },
  {
    key: 'draft',
    label: 'Drafting',
    sublabel: 'Writer developing hook & scenes',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    borderAccent: 'border-blue-400',
    headerBg: 'bg-blue-50/60'
  },
  {
    key: 'in_review',
    label: 'In Review',
    sublabel: 'Editorial & AI scoring polish',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    borderAccent: 'border-amber-400',
    headerBg: 'bg-amber-50/60'
  },
  {
    key: 'ready_to_record',
    label: 'Ready to Record',
    sublabel: 'Approved script ready for creator',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
    borderAccent: 'border-purple-400',
    headerBg: 'bg-purple-50/60'
  },
  {
    key: 'completed',
    label: 'Sent / Completed',
    sublabel: 'Dispatched to agency or scheduled',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    borderAccent: 'border-emerald-400',
    headerBg: 'bg-emerald-50/60'
  }
];

interface InstagramSwimlaneViewProps {
  scripts: ScriptItem[];
  teamMembers: TeamMember[];
  onSaveScript: (scriptId: string, updates: Partial<ScriptItem>) => Promise<void>;
  onOpenScriptEditor: (scriptId: string) => void;
  onAddTeamMember?: (member: Partial<TeamMember>) => Promise<TeamMember>;
  onCreateScript?: (data: Partial<ScriptItem>) => Promise<void>;
}

export const InstagramSwimlaneView: React.FC<InstagramSwimlaneViewProps> = ({
  scripts,
  teamMembers,
  onSaveScript,
  onOpenScriptEditor,
  onAddTeamMember,
  onCreateScript
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Reel' | 'Carousel'>('all');
  const [writerFilter, setWriterFilter] = useState<string>('all');
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);

  // Active Assignee Dropdown Popover
  const [openAssigneeDropdownScriptId, setOpenAssigneeDropdownScriptId] = useState<string | null>(null);

  // Quick New Script Modal
  const [isNewScriptModalOpen, setIsNewScriptModalOpen] = useState(false);
  const [newScriptTitle, setNewScriptTitle] = useState('');
  const [newScriptFormat, setNewScriptFormat] = useState<'Reel' | 'Carousel'>('Reel');
  const [newScriptHook, setNewScriptHook] = useState('');
  const [newScriptWriterId, setNewScriptWriterId] = useState<string>('');
  const [isCreatingScript, setIsCreatingScript] = useState(false);

  // Add Script Writer Modal
  const [isAddWriterModalOpen, setIsAddWriterModalOpen] = useState(false);
  const [newWriterName, setNewWriterName] = useState('');
  const [newWriterEmail, setNewWriterEmail] = useState('');
  const [isAddingWriter, setIsAddingWriter] = useState(false);

  // Error / Status feedback
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter team members by role: ONLY Script Writers
  const isScriptWriter = (member: TeamMember) =>
    member.role === 'Script Writer' || (member.role as string) === 'script_writer';

  const scriptWriters = teamMembers.filter(isScriptWriter);
  const nonScriptWriters = teamMembers.filter((m) => !isScriptWriter(m));

  // Map script status into 5 swimlane stages
  const mapScriptToSwimlaneStage = (status: string): SwimlaneStage => {
    switch (status) {
      case 'needs_writing':
        return 'needs_writing';
      case 'draft':
        return 'draft';
      case 'in_review':
        return 'in_review';
      case 'ready_to_record':
        return 'ready_to_record';
      case 'completed':
      case 'sent_to_agency':
      case 'approved':
        return 'completed';
      default:
        return 'draft';
    }
  };

  // Stage navigation
  const stageOrder: SwimlaneStage[] = ['needs_writing', 'draft', 'in_review', 'ready_to_record', 'completed'];

  // Drag and Drop States
  const [draggedScriptId, setDraggedScriptId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ writerId: string; stageKey: SwimlaneStage } | null>(null);

  // Drag and Drop drop handler (Moves stage and/or reassigns writer with strict role enforcement)
  const handleDropScript = async (
    scriptId: string,
    targetWriterId: string | 'unassigned',
    targetStageKey: SwimlaneStage
  ) => {
    setDragOverCell(null);
    setDraggedScriptId(null);
    try {
      setActionError(null);
      const script = scripts.find((s) => s.id === scriptId);
      if (!script) return;

      const updates: Partial<ScriptItem> = {
        status: targetStageKey
      };

      if (targetWriterId === 'unassigned') {
        updates.assignedWriterId = undefined;
        updates.assignedWriterName = undefined;
        updates.assignedWriterEmail = undefined;
      } else {
        const targetMember = teamMembers.find((m) => m.id === targetWriterId);
        if (targetMember) {
          // Strict Role Enforcement: Only Script Writers can be assigned!
          if (!isScriptWriter(targetMember)) {
            setActionError(
              `Cannot assign: "${targetMember.name}" has role ${targetMember.role}. Only team members with the 'Script Writer' role can be assigned.`
            );
            return;
          }
          updates.assignedWriterId = targetMember.id;
          updates.assignedWriterName = targetMember.name;
          updates.assignedWriterEmail = targetMember.email;
        }
      }

      await onSaveScript(scriptId, updates);
    } catch (err: any) {
      setActionError(err.message || 'Failed to move script');
    }
  };

  const handleAdvanceStage = async (script: ScriptItem, direction: 'next' | 'prev') => {
    const currentStage = mapScriptToSwimlaneStage(script.status);
    const currentIndex = stageOrder.indexOf(currentStage);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < stageOrder.length) {
      const nextStage = stageOrder[newIndex];
      try {
        setActionError(null);
        await onSaveScript(script.id, { status: nextStage });
      } catch (err: any) {
        setActionError(err.message || 'Failed to update stage');
      }
    }
  };

  // Handle assigning script writer (Strictly enforced!)
  const handleAssignWriter = async (scriptId: string, memberId: string | 'unassigned') => {
    try {
      setActionError(null);
      setOpenAssigneeDropdownScriptId(null);

      if (memberId === 'unassigned') {
        await onSaveScript(scriptId, {
          assignedWriterId: undefined,
          assignedWriterName: undefined,
          assignedWriterEmail: undefined
        });
        return;
      }

      const targetMember = teamMembers.find((m) => m.id === memberId);
      if (!targetMember) {
        setActionError('Selected team member was not found');
        return;
      }

      // STRICT VALIDATION: Only members with 'Script Writer' role can be assigned!
      if (!isScriptWriter(targetMember)) {
        setActionError(
          `Action blocked: Only team members with the 'Script Writer' role can be assigned to scripts. "${targetMember.name}" is an ${targetMember.role}.`
        );
        return;
      }

      await onSaveScript(scriptId, {
        assignedWriterId: targetMember.id,
        assignedWriterName: targetMember.name,
        assignedWriterEmail: targetMember.email
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign script writer');
    }
  };

  // Quick create script assigned to a specific writer
  const handleCreateNewScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptTitle.trim()) return;

    try {
      setIsCreatingScript(true);
      setActionError(null);

      let writerName: string | undefined;
      let writerEmail: string | undefined;

      if (newScriptWriterId && newScriptWriterId !== 'unassigned') {
        const writer = scriptWriters.find((w) => w.id === newScriptWriterId);
        if (writer) {
          writerName = writer.name;
          writerEmail = writer.email;
        }
      }

      if (onCreateScript) {
        await onCreateScript({
          title: newScriptTitle.trim(),
          format: newScriptFormat,
          hook: newScriptHook.trim() || `Hook: The secret to ${newScriptTitle.trim()}`,
          status: 'needs_writing',
          assignedWriterId: newScriptWriterId !== 'unassigned' ? newScriptWriterId : undefined,
          assignedWriterName: writerName,
          assignedWriterEmail: writerEmail
        });
      }

      setNewScriptTitle('');
      setNewScriptHook('');
      setNewScriptWriterId('');
      setIsNewScriptModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create script');
    } finally {
      setIsCreatingScript(false);
    }
  };

  // Add new Script Writer
  const handleAddWriterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriterName.trim() || !newWriterEmail.trim() || !onAddTeamMember) return;

    try {
      setIsAddingWriter(true);
      setActionError(null);

      await onAddTeamMember({
        name: newWriterName.trim(),
        email: newWriterEmail.trim(),
        role: 'Script Writer', // Pre-fixed strictly as Script Writer
        status: 'active'
      });

      setNewWriterName('');
      setNewWriterEmail('');
      setIsAddWriterModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to add script writer');
    } finally {
      setIsAddingWriter(false);
    }
  };

  // Filter scripts based on controls
  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      searchQuery === '' ||
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (script.assignedWriterName && script.assignedWriterName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFormat = formatFilter === 'all' || script.format === formatFilter;

    const matchesWriter =
      writerFilter === 'all' ||
      (writerFilter === 'unassigned' ? !script.assignedWriterId : script.assignedWriterId === writerFilter);

    return matchesSearch && matchesFormat && matchesWriter;
  });

  // Calculate high-level stats
  const totalInFlight = scripts.length;
  const unassignedCount = scripts.filter((s) => !s.assignedWriterId).length;
  const readyOrDoneCount = scripts.filter((s) => s.status === 'ready_to_record' || s.status === 'completed' || s.status === 'sent_to_agency').length;

  return (
    <div className="space-y-6">
      {/* Header Banner & Policy Guardrail */}
      <div className={`border rounded-2xl p-6 shadow-xs transition-colors ${
        isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${
                isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                <Kanban className="w-3.5 h-3.5 text-orange-500" />
                Script Writer Swimlanes
              </span>

              {/* Policy Enforced Badge */}
              <button
                type="button"
                onClick={() => setIsPolicyInfoOpen(!isPolicyInfoOpen)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="View role assignment policy"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Role Policy: Only Script Writers</span>
              </button>

              {/* Drag & Drop Pill */}
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 ${
                isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                <GripVertical className="w-3.5 h-3.5 text-orange-500" />
                <span>Drag & Drop Enabled</span>
              </span>
            </div>

            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Script Production Swimlane Board
            </h1>
            <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Horizontal swimlanes organized by assigned Script Writer, tracking content from initial brief through drafting, review, and recording readiness.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`px-3.5 py-2 border rounded-xl text-center min-w-[90px] ${
              isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className={`block text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalInFlight}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Scripts</span>
            </div>

            <div className={`px-3.5 py-2 border rounded-xl text-center min-w-[90px] ${
              isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className="block text-base font-bold text-purple-400">{scriptWriters.length}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Script Writers</span>
            </div>

            <div
              className={`px-3.5 py-2 border rounded-xl text-center min-w-[90px] ${
                unassignedCount > 0
                  ? isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark ? 'bg-[#141419] border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <span className={`block text-base font-bold ${unassignedCount > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                {unassignedCount}
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${unassignedCount > 0 ? (isDark ? 'text-amber-300' : 'text-amber-800') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Unassigned</span>
            </div>

            <div className={`px-3.5 py-2 border rounded-xl text-center min-w-[90px] ${
              isDark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`block text-base font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{readyOrDoneCount}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>Ready / Done</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-1">
              <button
                type="button"
                onClick={() => setIsNewScriptModalOpen(true)}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Script</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddWriterModalOpen(true)}
                className={`px-3 py-2 border text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                }`}
                title="Add a team member with the Script Writer role"
              >
                <Users className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span>+ Add Writer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Policy Explanation Banner (Toggled or visible) */}
        {isPolicyInfoOpen && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border animate-in fade-in duration-150 ${
            isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Assignment Policy Rules Enforced:</p>
              <p className={`leading-relaxed ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                1. Only team members with the explicit <strong>&apos;Script Writer&apos;</strong> role can be assigned to scripts.
                Account Managers, Content Creators, and general members cannot be assigned to writing lanes.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                2. Only <strong>scripts</strong> have assigned writers; ideas, topics, and calendar assets inherit or delegate through the script lifecycle.
              </p>
            </div>
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className={`mt-5 pt-4 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isDark ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts by title, hook, or writer..."
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors ${
                  isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Writer */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Writer:</span>
              <select
                value={writerFilter}
                onChange={(e) => setWriterFilter(e.target.value)}
                className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer ${
                  isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="all">All Script Writers ({scriptWriters.length})</option>
                {scriptWriters.map((w) => (
                  <option key={w.id} value={w.id}>
                    ✍️ {w.name}
                  </option>
                ))}
                <option value="unassigned">⚠️ Unassigned ({unassignedCount})</option>
              </select>
            </div>

            {/* Filter by Format */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Format:</span>
              <div className={`flex items-center p-0.5 rounded-lg border ${
                isDark ? 'bg-[#121217] border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setFormatFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    formatFilter === 'all'
                      ? isDark ? 'bg-gray-800 text-white shadow-2xs font-semibold' : 'bg-white text-gray-900 shadow-2xs'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('Reel')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    formatFilter === 'Reel'
                      ? isDark ? 'bg-orange-950/60 text-orange-300 shadow-2xs font-semibold' : 'bg-white text-orange-700 shadow-2xs font-semibold'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Reel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('Carousel')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    formatFilter === 'Carousel'
                      ? isDark ? 'bg-blue-950/60 text-blue-300 shadow-2xs font-semibold' : 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>Carousel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Swimlane Matrix */}
      <div className={`border rounded-2xl shadow-xs overflow-x-auto ${
        isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="min-w-[1100px]">
          {/* Header Row: Stage Columns */}
          <div className={`grid grid-cols-12 border-b sticky top-0 z-10 ${
            isDark ? 'border-gray-800 bg-[#181820]' : 'border-gray-200 bg-gray-50/80'
          }`}>
            {/* Lane Identifier Column Header */}
            <div className={`col-span-3 p-3.5 border-r flex items-center justify-between ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Script Writer Swimlane
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isDark ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-200/80'
              }`}>
                {scriptWriters.length} Writers
              </span>
            </div>

            {/* 5 Workflow Stage Column Headers */}
            <div className="col-span-9 grid grid-cols-5">
              {SWIMLANE_STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className={`p-3 border-r last:border-r-0 ${
                    isDark ? 'border-gray-800 bg-[#181820]' : `border-gray-200 ${stage.headerBg}`
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stage.label}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${stage.badgeColor}`}>
                      {filteredScripts.filter((s) => mapScriptToSwimlaneStage(s.status) === stage.key).length}
                    </span>
                  </div>
                  <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stage.sublabel}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Swimlanes Body: 1 Swimlane Row per Script Writer */}
          <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
            {/* 1. Unassigned Scripts Swimlane */}
            {unassignedCount > 0 && (writerFilter === 'all' || writerFilter === 'unassigned') && (
              <div className={`grid grid-cols-12 transition-colors ${
                isDark ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'bg-amber-50/20 hover:bg-amber-50/30'
              }`}>
                {/* Lane Header: Unassigned */}
                <div className={`col-span-3 p-4 border-r flex flex-col justify-between ${
                  isDark ? 'border-gray-800 bg-amber-950/30' : 'border-gray-200 bg-amber-50/40'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shadow-2xs ${
                        isDark ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-800'
                      }`}>
                        ⚠️
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <span>Unassigned Scripts</span>
                        </h3>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                          isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          Awaiting Script Writer
                        </span>
                      </div>
                    </div>
                    <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Scripts needing writer assignment. Click on any card below to assign a designated Script Writer.
                    </p>
                  </div>

                  <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-medium ${
                    isDark ? 'border-amber-900/60 text-amber-300' : 'border-amber-200/60 text-amber-900'
                  }`}>
                    <span>{filteredScripts.filter((s) => !s.assignedWriterId).length} unassigned scripts</span>
                    <span className={`text-[10px] ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Assign below ↓</span>
                  </div>
                </div>

                {/* 5 Columns for Unassigned Lane */}
                <div className={`col-span-9 grid grid-cols-5 divide-x ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {SWIMLANE_STAGES.map((stage) => {
                    const laneScripts = filteredScripts.filter(
                      (s) => !s.assignedWriterId && mapScriptToSwimlaneStage(s.status) === stage.key
                    );
                    const isCellOver =
                      dragOverCell?.writerId === 'unassigned' && dragOverCell?.stageKey === stage.key;

                    return (
                      <div
                        key={stage.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverCell?.writerId !== 'unassigned' || dragOverCell?.stageKey !== stage.key) {
                            setDragOverCell({ writerId: 'unassigned', stageKey: stage.key });
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDragOverCell(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const scriptId = e.dataTransfer.getData('text/plain');
                          if (scriptId) {
                            handleDropScript(scriptId, 'unassigned', stage.key);
                          }
                        }}
                        className={`p-2.5 min-h-[160px] flex flex-col gap-2 transition-all ${
                          isCellOver ? (isDark ? 'bg-orange-950/40 ring-2 ring-inset ring-orange-500' : 'bg-orange-100/60 ring-2 ring-inset ring-orange-400') : ''
                        }`}
                      >
                        {isCellOver && draggedScriptId && (
                          <div className={`p-2 border-2 border-dashed rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1 animate-pulse ${
                            isDark ? 'border-orange-500 bg-orange-950/60 text-orange-200' : 'border-orange-500 bg-orange-50 text-orange-900'
                          }`}>
                            <ArrowDown className="w-3 h-3 text-orange-500" />
                            <span>Drop in {stage.label}</span>
                          </div>
                        )}
                        {laneScripts.length === 0 && !isCellOver ? (
                          <div className={`flex-1 flex items-center justify-center p-3 text-center text-[11px] border border-dashed rounded-xl ${
                            isDark ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'
                          }`}>
                            <span className="text-[10px]">Empty</span>
                          </div>
                        ) : (
                          laneScripts.map((script) => (
                            <SwimlaneCard
                              key={script.id}
                              script={script}
                              stageKey={stage.key}
                              scriptWriters={scriptWriters}
                              nonScriptWriters={nonScriptWriters}
                              isDark={isDark}
                              isDragging={draggedScriptId === script.id}
                              onDragStart={() => setDraggedScriptId(script.id)}
                              onDragEnd={() => {
                                setDraggedScriptId(null);
                                setDragOverCell(null);
                              }}
                              isAssigneeOpen={openAssigneeDropdownScriptId === script.id}
                              onToggleAssignee={() =>
                                setOpenAssigneeDropdownScriptId(
                                  openAssigneeDropdownScriptId === script.id ? null : script.id
                                )
                              }
                              onAssignWriter={(writerId) => handleAssignWriter(script.id, writerId)}
                              onAdvanceStage={(dir) => handleAdvanceStage(script, dir)}
                              onOpenEditor={() => onOpenScriptEditor(script.id)}
                            />
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Registered Script Writers' Swimlanes */}
            {scriptWriters.length === 0 ? (
              <div className="p-12 text-center">
                <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>No Script Writers Configured</p>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  To use the script writer swimlane view, add at least one team member with the &apos;Script Writer&apos; role.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddWriterModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Script Writer
                </button>
              </div>
            ) : (
              scriptWriters
                .filter((w) => writerFilter === 'all' || writerFilter === w.id)
                .map((writer) => {
                  const writerScripts = filteredScripts.filter((s) => s.assignedWriterId === writer.id);
                  const inProgressCount = writerScripts.filter((s) => s.status === 'draft' || s.status === 'in_review').length;

                  return (
                    <div key={writer.id} className={`grid grid-cols-12 transition-colors ${
                      isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/40'
                    }`}>
                      {/* Lane Header: Writer Profile & Workload */}
                      <div className={`col-span-3 p-4 border-r flex flex-col justify-between ${
                        isDark ? 'border-gray-800 bg-[#16161d]' : 'border-gray-200 bg-slate-50/40'
                      }`}>
                        <div>
                          <div className="flex items-start gap-2.5">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                              {writer.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                <span className="truncate">{writer.name}</span>
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${
                                  isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-100 text-orange-900 border-orange-200'
                                }`}>
                                  <Edit3 className="w-2.5 h-2.5 text-orange-500" />
                                  Script Writer
                                </span>
                              </div>
                              <p className={`text-[10px] mt-1 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{writer.email}</p>
                            </div>
                          </div>

                          {/* Workload Stats */}
                          <div className="mt-3.5 grid grid-cols-2 gap-1.5 text-center">
                            <div className={`p-1.5 border rounded-lg ${
                              isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                            }`}>
                              <span className={`block text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{writerScripts.length}</span>
                              <span className={`text-[9px] font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Assigned</span>
                            </div>
                            <div className={`p-1.5 border rounded-lg ${
                              isDark ? 'bg-[#141419] border-gray-800' : 'bg-white border-gray-200'
                            }`}>
                              <span className="block text-xs font-bold text-orange-500">{inProgressCount}</span>
                              <span className={`text-[9px] font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>In Progress</span>
                            </div>
                          </div>
                        </div>

                        {/* Lane Quick Action */}
                        <div className={`mt-3 pt-2 border-t flex items-center justify-between ${
                          isDark ? 'border-gray-800' : 'border-gray-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => {
                              setNewScriptWriterId(writer.id);
                              setIsNewScriptModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-orange-500 hover:text-orange-400 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assign New Script</span>
                          </button>
                        </div>
                      </div>

                      {/* 5 Workflow Stage Columns for this Writer */}
                      <div className={`col-span-9 grid grid-cols-5 divide-x ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        {SWIMLANE_STAGES.map((stage) => {
                          const laneScripts = writerScripts.filter(
                            (s) => mapScriptToSwimlaneStage(s.status) === stage.key
                          );
                          const isCellOver =
                            dragOverCell?.writerId === writer.id && dragOverCell?.stageKey === stage.key;

                          return (
                            <div
                              key={stage.key}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverCell?.writerId !== writer.id || dragOverCell?.stageKey !== stage.key) {
                                  setDragOverCell({ writerId: writer.id, stageKey: stage.key });
                                }
                              }}
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  setDragOverCell(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const scriptId = e.dataTransfer.getData('text/plain');
                                if (scriptId) {
                                  handleDropScript(scriptId, writer.id, stage.key);
                                }
                              }}
                              className={`p-2.5 min-h-[170px] flex flex-col gap-2 transition-all ${
                                isCellOver ? (isDark ? 'bg-orange-950/40 ring-2 ring-inset ring-orange-500' : 'bg-orange-100/60 ring-2 ring-inset ring-orange-400') : ''
                              }`}
                            >
                              {isCellOver && draggedScriptId && (
                                <div className={`p-2 border-2 border-dashed rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1 animate-pulse ${
                                  isDark ? 'border-orange-500 bg-orange-950/60 text-orange-200' : 'border-orange-500 bg-orange-50 text-orange-900'
                                }`}>
                                  <ArrowDown className="w-3 h-3 text-orange-500" />
                                  <span>Drop to assign {writer.name.split(' ')[0]} ({stage.label})</span>
                                </div>
                              )}
                              {laneScripts.length === 0 && !isCellOver ? (
                                <div className={`flex-1 flex items-center justify-center p-3 text-center text-[11px] border border-dashed rounded-xl ${
                                  isDark ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'
                                }`}>
                                  <span className="text-[10px]">No scripts</span>
                                </div>
                              ) : (
                                laneScripts.map((script) => (
                                  <SwimlaneCard
                                    key={script.id}
                                    script={script}
                                    stageKey={stage.key}
                                    scriptWriters={scriptWriters}
                                    nonScriptWriters={nonScriptWriters}
                                    isDark={isDark}
                                    isDragging={draggedScriptId === script.id}
                                    onDragStart={() => setDraggedScriptId(script.id)}
                                    onDragEnd={() => {
                                      setDraggedScriptId(null);
                                      setDragOverCell(null);
                                    }}
                                    isAssigneeOpen={openAssigneeDropdownScriptId === script.id}
                                    onToggleAssignee={() =>
                                      setOpenAssigneeDropdownScriptId(
                                        openAssigneeDropdownScriptId === script.id ? null : script.id
                                      )
                                    }
                                    onAssignWriter={(writerId) => handleAssignWriter(script.id, writerId)}
                                    onAdvanceStage={(dir) => handleAdvanceStage(script, dir)}
                                    onOpenEditor={() => onOpenScriptEditor(script.id)}
                                  />
                                ))
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Quick Create New Script & Assign to Writer */}
      {isNewScriptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create & Assign New Script</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewScriptModalOpen(false)}
                className={`p-1 text-sm font-bold cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewScript} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Script Title</label>
                <input
                  type="text"
                  value={newScriptTitle}
                  onChange={(e) => setNewScriptTitle(e.target.value)}
                  placeholder="e.g. The 50/30/20 Rule Hack: Double Your Investment Rate"
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Content Format</label>
                  <select
                    value={newScriptFormat}
                    onChange={(e) => setNewScriptFormat(e.target.value as 'Reel' | 'Carousel')}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 cursor-pointer ${
                      isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Reel" className={isDark ? 'bg-[#181820]' : ''}>🎬 Reel (9:16 Video Script)</option>
                    <option value="Carousel" className={isDark ? 'bg-[#181820]' : ''}>📑 Carousel (Multi-Slide Script)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign Script Writer <span className="text-orange-500 font-semibold">*Strict Role</span>
                  </label>
                  <select
                    value={newScriptWriterId}
                    onChange={(e) => setNewScriptWriterId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 cursor-pointer ${
                      isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="unassigned" className={isDark ? 'bg-[#181820]' : ''}>⚠️ Leave Unassigned</option>
                    {scriptWriters.map((w) => (
                      <option key={w.id} value={w.id} className={isDark ? 'bg-[#181820]' : ''}>
                        ✍️ {w.name} (Script Writer)
                      </option>
                    ))}
                  </select>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Only team members with &apos;Script Writer&apos; role are selectable.
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Opening Hook (Optional)</label>
                <textarea
                  rows={2}
                  value={newScriptHook}
                  onChange={(e) => setNewScriptHook(e.target.value)}
                  placeholder="3-second hook that stops users from scrolling..."
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsNewScriptModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingScript || !newScriptTitle.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingScript ? 'Creating...' : 'Create in Swimlane'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Script Writer to Team */}
      {isAddWriterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Script Writer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWriterModalOpen(false)}
                className={`p-1 text-sm font-bold cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWriterSubmit} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                <input
                  type="text"
                  value={newWriterName}
                  onChange={(e) => setNewWriterName(e.target.value)}
                  placeholder="e.g. Neha Kapoor"
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                <input
                  type="email"
                  value={newWriterEmail}
                  onChange={(e) => setNewWriterEmail(e.target.value)}
                  placeholder="e.g. neha.k@contentlab.io"
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className={`p-3 rounded-xl border text-xs ${
                isDark ? 'bg-orange-950/40 border-orange-800/60 text-orange-200' : 'bg-orange-50/70 border-orange-200 text-orange-900'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Fixed Role: Script Writer</span>
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                  This member will be assigned the <strong>Script Writer</strong> role and will automatically get their own dedicated swimlane on this board.
                </p>
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddWriterModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingWriter || !newWriterName.trim() || !newWriterEmail.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isAddingWriter ? 'Adding...' : 'Add Script Writer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Card in Swimlane
interface SwimlaneCardProps {
  script: ScriptItem;
  stageKey: SwimlaneStage;
  scriptWriters: TeamMember[];
  nonScriptWriters: TeamMember[];
  isDark: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isAssigneeOpen: boolean;
  onToggleAssignee: () => void;
  onAssignWriter: (writerId: string) => void;
  onAdvanceStage: (direction: 'next' | 'prev') => void;
  onOpenEditor: () => void;
}

const SwimlaneCard: React.FC<SwimlaneCardProps> = ({
  script,
  stageKey,
  scriptWriters,
  nonScriptWriters,
  isDark,
  isDragging = false,
  onDragStart,
  onDragEnd,
  isAssigneeOpen,
  onToggleAssignee,
  onAssignWriter,
  onAdvanceStage,
  onOpenEditor
}) => {
  const isReel = script.format === 'Reel';
  const stageOrder: SwimlaneStage[] = ['needs_writing', 'draft', 'in_review', 'ready_to_record', 'completed'];
  const currentIndex = stageOrder.indexOf(stageKey);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < stageOrder.length - 1;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', script.id);
        e.dataTransfer.setData('application/json', JSON.stringify({ scriptId: script.id, stageKey }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      className={`relative border rounded-xl p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5 group cursor-grab active:cursor-grabbing select-none ${
        isDark ? 'bg-[#181820] text-white' : 'bg-white text-gray-900'
      } ${
        isDragging
          ? 'opacity-40 border-orange-500 ring-2 ring-orange-500 scale-[0.98]'
          : isDark ? 'border-gray-800 hover:border-orange-500/60' : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      {/* Top Row: Format badge + Viral Score */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`transition-colors ${isDark ? 'text-gray-500 group-hover:text-orange-400' : 'text-gray-400 group-hover:text-orange-500'}`}
              title="Drag to move stage or assign writer"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                isReel
                  ? isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'
                  : isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isReel ? <Video className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{script.format}</span>
            </span>
          </div>

          {script.score !== undefined && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
              isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              ★ {script.score}
            </span>
          )}
        </div>

        {/* Script Title */}
        <h4
          onClick={onOpenEditor}
          className={`text-xs font-bold leading-snug line-clamp-2 transition-colors cursor-pointer ${
            isDark ? 'text-white hover:text-orange-400' : 'text-gray-900 hover:text-orange-600'
          }`}
          title={script.title}
        >
          {script.title}
        </h4>

        {/* Hook Excerpt */}
        {script.hook && (
          <p className={`text-[11px] mt-1 line-clamp-2 italic leading-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            &ldquo;{script.hook}&rdquo;
          </p>
        )}
      </div>

      {/* Bottom Controls: Assignee Dropdown + Stage Arrows */}
      <div className={`pt-2 border-t flex items-center justify-between gap-1 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        {/* Assigned Writer Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAssignee();
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              script.assignedWriterName
                ? isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                : isDark
                  ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-800 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
            }`}
            title="Assign script writer"
          >
            <Edit3 className="w-2.5 h-2.5 text-orange-500" />
            <span className="max-w-[85px] truncate">
              {script.assignedWriterName ? script.assignedWriterName.split(' ')[0] : 'Assign Writer'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
          </button>

          {/* Strict Assignee Dropdown */}
          {isAssigneeOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={onToggleAssignee} />
              <div
                className={`absolute left-0 bottom-full mb-1 w-56 rounded-xl shadow-2xl border py-2 z-40 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`px-3 py-1.5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <span className={`block text-[11px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Assign Script Writer
                  </span>
                  <span className="block text-[9px] text-emerald-500 font-medium mt-0.5">
                    ✓ Only &apos;Script Writer&apos; role allowed
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto py-1">
                  {/* Unassign option */}
                  <button
                    type="button"
                    onClick={() => onAssignWriter('unassigned')}
                    className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                      isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    <span>None (Unassigned)</span>
                  </button>

                  {/* Eligible Script Writers */}
                  {scriptWriters.map((writer) => {
                    const isSelected = script.assignedWriterId === writer.id;
                    return (
                      <button
                        key={writer.id}
                        type="button"
                        onClick={() => onAssignWriter(writer.id)}
                        className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? isDark ? 'bg-orange-950/60 text-orange-200 font-bold' : 'bg-orange-50 text-orange-950 font-bold'
                            : isDark ? 'text-gray-200 hover:bg-gray-800 hover:text-white' : 'text-gray-800 hover:bg-orange-50/70 hover:text-orange-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-orange-950 text-orange-300' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {writer.name[0]}
                          </span>
                          <span className="truncate">{writer.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Ineligible Other Roles */}
                  {nonScriptWriters.length > 0 && (
                    <>
                      <div className={`px-3 pt-2 pb-1 border-t mt-1 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-500">
                          Other Roles (Ineligible for Script Assignment)
                        </span>
                      </div>
                      {nonScriptWriters.map((member) => (
                        <div
                          key={member.id}
                          className="px-3 py-1 text-xs text-gray-500 flex items-center justify-between opacity-60 cursor-not-allowed"
                          title={`Cannot assign: ${member.name} has role '${member.role}', not 'Script Writer'`}
                        >
                          <span className="truncate">{member.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stage Advancement Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onAdvanceStage('prev')}
            className={`p-1 disabled:opacity-30 rounded-md border transition-colors cursor-pointer ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
            title="Move to previous stage"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onOpenEditor}
            className={`px-1.5 py-0.8 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-gray-800 hover:bg-orange-950/60 text-gray-300 hover:text-orange-300 border-gray-700'
                : 'bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-700 border-gray-200'
            }`}
            title="Open script details"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onAdvanceStage('next')}
            className={`p-1 disabled:opacity-30 rounded-md border transition-colors cursor-pointer ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
            title="Move to next stage"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
