import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  FileText,
  RefreshCw,
  Plus,
  Edit3,
  Check,
  X,
  ArrowRight,
  Target,
  Wand2,
  Video,
  Copy,
  Layers,
  HelpCircle,
  Sliders,
  RotateCcw,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  BookOpen,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  TopicIdea,
  InstagramAccount,
  AISkillRecord,
  TopicFormat
} from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';

interface InstagramTopicsViewProps {
  account: InstagramAccount;
  topics: TopicIdea[];
  activeSkill: AISkillRecord;
  onGenerateTopics: (options?: { count?: number; format?: 'Reel' | 'Carousel' | 'all'; customAngle?: string }) => Promise<void>;
  onApproveTopic: (topicId: string) => void;
  onRejectTopic: (topicId: string, reason: string, category?: string) => Promise<void> | void;
  onGenerateScript: (topicId: string, format: 'Reel' | 'Carousel') => void;
  onTopicUpdated?: () => void;
  onMoveSelectedToScripts?: (selectedTopicIds: string[]) => Promise<void>;
  isGenerating: boolean;
}

export const InstagramTopicsView: React.FC<InstagramTopicsViewProps> = ({
  account,
  topics,
  activeSkill,
  onGenerateTopics,
  onApproveTopic,
  onRejectTopic,
  onGenerateScript,
  onTopicUpdated,
  onMoveSelectedToScripts,
  isGenerating
}) => {
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'suggested' | 'selected' | 'sent_to_scripts' | 'needs_revision'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | TopicFormat>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject Topic Modal State (Self-Learning Guardrails)
  const [rejectingTopic, setRejectingTopic] = useState<TopicIdea | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('Tone & Content Angle');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectSuccessMessage, setRejectSuccessMessage] = useState<string | null>(null);

  // AI Generation Configuration Modal
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [genCount, setGenCount] = useState<number>(5);
  const [genFormat, setGenFormat] = useState<'all' | 'Reel' | 'Carousel'>('all');
  const [genAngle, setGenAngle] = useState('');

  // Manual Topic Modal State (Section 15)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualHook, setManualHook] = useState('');
  const [manualFormat, setManualFormat] = useState<TopicFormat>('Reel');
  const [manualGoal, setManualGoal] = useState<'Growth' | 'Engagement' | 'Conversion'>('Growth');
  const [manualAngle, setManualAngle] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Edit Topic Modal State
  const [editingTopic, setEditingTopic] = useState<TopicIdea | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHook, setEditHook] = useState('');
  const [editFormat, setEditFormat] = useState<TopicFormat>('Reel');
  const [editGoal, setEditGoal] = useState<'Growth' | 'Engagement' | 'Conversion'>('Growth');
  const [editAngle, setEditAngle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // AI Assist Modal State (Section 16)
  const [aiAssistTopic, setAiAssistTopic] = useState<TopicIdea | null>(null);
  const [aiAssistPrompt, setAiAssistPrompt] = useState('');
  const [aiAssistAction, setAiAssistAction] = useState<'rewrite_hook' | 'more_engaging' | 'repurpose_carousel' | 'custom'>('rewrite_hook');
  const [aiAssistLoading, setAiAssistLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ original: Partial<TopicIdea>; suggested: Partial<TopicIdea>; diffSummary: string } | null>(null);

  const [isMovingToScripts, setIsMovingToScripts] = useState(false);

  // Multi-Select Bulk Action State
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [bulkRejectCategory, setBulkRejectCategory] = useState('Tone & Content Angle');
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkRejectTrainGuardrail, setBulkRejectTrainGuardrail] = useState(true);
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.size === filteredTopics.length) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(filteredTopics.map((t) => t.id)));
    }
  };

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'suggested' && t.status !== 'pending' && t.status !== 'suggested') return false;
      if (statusFilter === 'selected' && t.status !== 'approved' && t.status !== 'selected') return false;
      if (statusFilter === 'sent_to_scripts' && t.status !== 'sent_to_scripts') return false;
      if (statusFilter === 'needs_revision' && t.status !== 'rejected' && t.status !== 'needs_revision') return false;
    }
    if (formatFilter !== 'all' && t.format !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.hook.toLowerCase().includes(q) ||
        (t.targetAudienceAngle || '').toLowerCase().includes(q) ||
        (t.contentGoal || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (topic: TopicIdea) => {
    setEditingTopic(topic);
    setEditTitle(topic.title);
    setEditHook(topic.hook);
    setEditFormat(topic.format);
    setEditGoal(topic.contentGoal || 'Growth');
    setEditAngle(topic.targetAudienceAngle || topic.contentPillar || '');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    setIsSavingEdit(true);
    try {
      await instagramApi.editTopic(editingTopic.id, {
        title: editTitle,
        hook: editHook,
        format: editFormat,
        contentGoal: editGoal,
        targetAudienceAngle: editAngle
      });
      setEditingTopic(null);
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to save topic: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Save Manual Topic (Section 15)
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    setIsSavingManual(true);
    try {
      await instagramApi.createManualTopic({
        title: manualTitle,
        hook: manualHook || manualTitle,
        format: manualFormat,
        contentGoal: manualGoal,
        targetAudienceAngle: manualAngle,
        contentPillar: manualAngle || 'General Finance',
        accountId: account.id
      });
      setIsManualModalOpen(false);
      setManualTitle('');
      setManualHook('');
      setManualAngle('');
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to create topic: ${err.message}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Open AI Assist Modal (Section 16)
  const handleOpenAiAssist = (topic: TopicIdea) => {
    setAiAssistTopic(topic);
    setAiAssistPrompt('');
    setAiAssistAction('rewrite_hook');
    setAiSuggestion(null);
  };

  // Request AI Assist
  const handleRequestAiAssist = async () => {
    if (!aiAssistTopic) return;
    setAiAssistLoading(true);
    try {
      let promptText = aiAssistPrompt;
      if (aiAssistAction === 'rewrite_hook') promptText = 'Make the hook more punchy, negative-framed, and under 9 words.';
      if (aiAssistAction === 'more_engaging') promptText = 'Boost controversy and debate value in the comments.';
      if (aiAssistAction === 'repurpose_carousel') promptText = 'Restructure this into a 6-slide swipeable educational carousel.';

      const result = await instagramApi.aiAssistTopic(aiAssistTopic.id, promptText, aiAssistAction);
      setAiSuggestion(result);
    } catch (err: any) {
      alert(`AI assist failed: ${err.message}`);
    } finally {
      setAiAssistLoading(false);
    }
  };

  // Accept AI suggestion
  const handleAcceptAiSuggestion = async () => {
    if (!aiAssistTopic || !aiSuggestion) return;
    try {
      await instagramApi.editTopic(aiAssistTopic.id, aiSuggestion.suggested);
      setAiAssistTopic(null);
      setAiSuggestion(null);
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to apply changes: ${err.message}`);
    }
  };

  // Reject Topic Modal Handlers
  const handleOpenRejectModal = (topic: TopicIdea) => {
    setRejectingTopic(topic);
    setRejectionReason('');
    setRejectionCategory('Tone & Content Angle');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTopic || !rejectionReason.trim()) return;
    setIsSubmittingReject(true);
    try {
      await onRejectTopic(rejectingTopic.id, rejectionReason.trim(), rejectionCategory);
      setRejectSuccessMessage(`Guardrail learned! "${rejectionReason.trim()}" saved to AI strategy rulebook.`);
      setTimeout(() => setRejectSuccessMessage(null), 4500);
      setRejectingTopic(null);
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to record guardrail: ${err.message}`);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleStartAiGeneration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAiGenModalOpen(false);
    await onGenerateTopics({
      count: genCount,
      format: genFormat,
      customAngle: genAngle.trim() || undefined
    });
  };

  // Bulk Approve Handler
  const handleBulkApprove = async () => {
    if (selectedTopicIds.size === 0) return;
    setIsPerformingBulkAction(true);
    try {
      const ids: string[] = Array.from(selectedTopicIds);
      await instagramApi.bulkActionTopics(ids, 'approve');
      setRejectSuccessMessage(`Approved ${ids.length} topics and added them to the Content Pipeline!`);
      setTimeout(() => setRejectSuccessMessage(null), 4500);
      setSelectedTopicIds(new Set());
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Bulk approval failed: ${err.message}`);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Bulk Reject Handlers (Self-Learning Guardrail Ingestion)
  const handleOpenBulkReject = () => {
    if (selectedTopicIds.size === 0) return;
    setBulkRejectCategory('Tone & Content Angle');
    setBulkRejectReason('');
    setBulkRejectTrainGuardrail(true);
    setIsBulkRejectModalOpen(true);
  };

  const handleConfirmBulkReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopicIds.size === 0) return;
    setIsPerformingBulkAction(true);
    try {
      const ids: string[] = Array.from(selectedTopicIds);
      const reason = bulkRejectReason.trim() || 'Rejected in bulk review';
      await instagramApi.bulkActionTopics(ids, 'reject', {
        category: bulkRejectCategory,
        feedback: reason,
        trainGuardrail: bulkRejectTrainGuardrail
      });
      setIsBulkRejectModalOpen(false);
      setRejectSuccessMessage(
        bulkRejectTrainGuardrail
          ? `Rejected ${ids.length} topics. Guardrail "${reason}" saved to AI strategy rulebook!`
          : `Rejected ${ids.length} topics successfully.`
      );
      setTimeout(() => setRejectSuccessMessage(null), 4500);
      setSelectedTopicIds(new Set());
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Bulk rejection failed: ${err.message}`);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedTopicIds.size === 0) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${selectedTopicIds.size} selected topic ideas?`
    );
    if (!confirmDelete) return;

    setIsPerformingBulkAction(true);
    try {
      const ids: string[] = Array.from(selectedTopicIds);
      await instagramApi.bulkActionTopics(ids, 'delete');
      setRejectSuccessMessage(`Permanently deleted ${ids.length} topic concepts.`);
      setTimeout(() => setRejectSuccessMessage(null), 4500);
      setSelectedTopicIds(new Set());
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to delete topics: ${err.message}`);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Bulk Format Change Handler
  const handleBulkChangeFormat = async (format: TopicFormat) => {
    if (selectedTopicIds.size === 0) return;
    setIsPerformingBulkAction(true);
    setIsFormatDropdownOpen(false);
    try {
      const ids: string[] = Array.from(selectedTopicIds);
      await instagramApi.bulkActionTopics(ids, 'change_format', { format });
      setRejectSuccessMessage(`Updated format to ${format} for ${ids.length} topics.`);
      setTimeout(() => setRejectSuccessMessage(null), 4500);
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to change format: ${err.message}`);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Move Selected Topics to Scripts (Unified Content Item, Section 17 & 20)
  const handleMoveSelected = async () => {
    if (selectedTopicIds.size === 0) return;
    setIsMovingToScripts(true);
    try {
      if (onMoveSelectedToScripts) {
        await onMoveSelectedToScripts(Array.from(selectedTopicIds));
      } else {
        await instagramApi.moveSelectedToScripts(Array.from(selectedTopicIds));
      }
      setSelectedTopicIds(new Set());
      if (onTopicUpdated) onTopicUpdated();
    } catch (err: any) {
      alert(`Failed to move topics to scripts: ${err.message}`);
    } finally {
      setIsMovingToScripts(false);
    }
  };

  const getSourceBadge = (source?: string) => {
    if (source === 'Derived from Audit' || source === 'audit') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Derived from Audit
        </span>
      );
    }
    if (source === 'Manual') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
          Manual
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        AI Suggested
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved' || status === 'selected') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <Check className="w-3 h-3" /> Selected
        </span>
      );
    }
    if (status === 'sent_to_scripts') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Sent to Scripts
        </span>
      );
    }
    if (status === 'rejected' || status === 'needs_revision') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Guardrailed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        Suggested
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Learned Guardrail Success Notification */}
      {rejectSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rejectSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRejectSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header & Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Topic Ideas Studio
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Active Strategy Rulebook: <strong className="text-gray-900">{activeSkill.version}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">
            Curate & Refine Content Topics
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Select high-converting concepts, reject unwanted angles to update AI guardrails, or configure customized AI generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Manual Topic Button (Section 15) */}
          <button
            id="btn-add-manual-topic"
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
            <span>Add Manual Topic</span>
          </button>

          {/* AI Generator Button - Opens Configuration Modal */}
          <button
            id="btn-generate-topics-ai"
            type="button"
            onClick={() => setIsAiGenModalOpen(true)}
            disabled={isGenerating}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Ideas...' : 'Generate with AI'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Bulk Action Banner (Section 17 & 20) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic or hook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-300 text-xs text-gray-800 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">All Statuses ({topics.length})</option>
            <option value="suggested">Suggested</option>
            <option value="selected">Selected</option>
            <option value="sent_to_scripts">Sent to Scripts</option>
            <option value="needs_revision">Needs Revision</option>
          </select>

          {/* Format Filter */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-300 text-xs text-gray-800 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">All Formats</option>
            <option value="Reel">Reel</option>
            <option value="Carousel">Carousel</option>
            <option value="Image">Image</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Bulk Action Controls: Approve, Reject, Move, Format, Delete */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {selectedTopicIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-lg bg-orange-100 text-orange-900 font-bold text-xs flex items-center gap-1.5 border border-orange-200">
                <Check className="w-3.5 h-3.5 text-orange-700" />
                <span>{selectedTopicIds.size} Selected</span>
              </span>

              {/* Bulk Approve */}
              <button
                id="btn-bulk-approve-topics"
                type="button"
                disabled={isPerformingBulkAction}
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Approve all selected topics"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve ({selectedTopicIds.size})</span>
              </button>

              {/* Bulk Reject & Guardrail */}
              <button
                id="btn-bulk-reject-topics"
                type="button"
                disabled={isPerformingBulkAction}
                onClick={handleOpenBulkReject}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Reject selected topics and teach AI guardrails"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject ({selectedTopicIds.size})</span>
              </button>

              {/* Bulk Move to Scripts */}
              <button
                id="btn-move-selected-to-scripts"
                type="button"
                disabled={isMovingToScripts || isPerformingBulkAction}
                onClick={handleMoveSelected}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Move selected topics to script writing pipeline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Move to Scripts</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              {/* Bulk Format Conversion Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  disabled={isPerformingBulkAction}
                  className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold border border-gray-300 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Change content format for selected"
                >
                  <span>Format</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {isFormatDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsFormatDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-40 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkChangeFormat('Reel');
                          setIsFormatDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-orange-600" />
                        <span className="text-gray-800 hover:text-orange-900 font-medium">Set to Reel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkChangeFormat('Carousel');
                          setIsFormatDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-gray-800 hover:text-orange-900 font-medium">Set to Carousel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleBulkChangeFormat('Image');
                          setIsFormatDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-800 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-gray-800 hover:text-orange-900 font-medium">Set to Image</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bulk Delete */}
              <button
                type="button"
                disabled={isPerformingBulkAction}
                onClick={handleBulkDelete}
                className="p-1.5 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-300 rounded-lg text-xs transition-colors cursor-pointer"
                title="Delete selected topics"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Deselect */}
              <button
                type="button"
                onClick={() => setSelectedTopicIds(new Set())}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1 transition-colors"
                title="Clear selection"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">
                0 of {filteredTopics.length} selected
              </span>
              <button
                id="btn-move-selected-to-scripts"
                type="button"
                disabled={true}
                className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Move Selected to Scripts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Topics Table View (Section 13) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTopicIds.size > 0 && selectedTopicIds.size === filteredTopics.length}
                    onChange={handleSelectAll}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="py-3.5 px-4">Topic Idea & Hook</th>
                <th className="py-3.5 px-3 w-28">Format</th>
                <th className="py-3.5 px-3 w-40">Target Audience / Angle</th>
                <th className="py-3.5 px-3 w-28">Content Goal</th>
                <th className="py-3.5 px-3 w-32">Source</th>
                <th className="py-3.5 px-3 w-32">Status</th>
                <th className="py-3.5 px-4 text-right min-w-[210px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <p className="text-sm font-semibold text-gray-700 mb-1">No topic ideas found</p>
                    <p className="text-xs text-gray-400 mb-4">Click "Add Manual Topic" or "Generate with AI" to add topics.</p>
                    <button
                      type="button"
                      onClick={() => setIsManualModalOpen(true)}
                      className="px-3.5 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Add Manual Topic
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic) => {
                  const isSelected = selectedTopicIds.has(topic.id);

                  return (
                    <tr
                      key={topic.id}
                      className={`hover:bg-orange-50/30 transition-colors ${
                        isSelected ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(topic.id)}
                          className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* Title & Hook */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-gray-900 text-xs mb-1">{topic.title}</div>
                        <div className="text-[11px] text-gray-600 italic bg-gray-50 p-1.5 rounded border border-gray-100">
                          "{topic.hook}"
                        </div>
                        {topic.rejectionReason && (
                          <div className="mt-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">
                              Learned Guardrail:{' '}
                              {typeof topic.rejectionReason === 'object'
                                ? `"${topic.rejectionReason.feedback || topic.rejectionReason.category || 'Rejected'}"`
                                : `"${topic.rejectionReason}"`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Format */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                          {topic.format === 'Reel' ? (
                            <Video className="w-3.5 h-3.5 text-orange-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{topic.format}</span>
                        </span>
                      </td>

                      {/* Target Audience / Angle */}
                      <td className="py-3 px-3 text-gray-700 font-medium">
                        <div className="line-clamp-2">
                          {topic.targetAudienceAngle || topic.contentPillar || 'Salaried Professionals'}
                        </div>
                      </td>

                      {/* Content Goal */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800">
                          {topic.contentGoal || 'Growth'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3">{getSourceBadge(topic.source)}</td>

                      {/* Status */}
                      <td className="py-3 px-3">{getStatusBadge(topic.status)}</td>

                      {/* Actions: Approve, Reject Guardrail, Edit, AI Assist, Quick Script */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Approve Button */}
                          {topic.status !== 'approved' && topic.status !== 'selected' && (
                            <button
                              type="button"
                              onClick={() => onApproveTopic(topic.id)}
                              title="Approve & select topic"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reject with Reason (Trains AI Guardrail) */}
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(topic)}
                            title="Reject topic & update AI guardrail skill"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          {/* AI Assist Button (Section 16) */}
                          <button
                            type="button"
                            onClick={() => handleOpenAiAssist(topic)}
                            title="Ask AI to assist with hook or angle"
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors cursor-pointer"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(topic)}
                            title="Edit topic directly"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to Script */}
                          <button
                            type="button"
                            onClick={() => onGenerateScript(topic.id, topic.format === 'Carousel' ? 'Carousel' : 'Reel')}
                            title="Draft script from topic"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-600 active:bg-orange-700 text-orange-700 hover:text-white border border-orange-200/90 hover:border-orange-600 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 group/script ml-0.5"
                          >
                            <span>Script</span>
                            <ArrowRight className="w-3.5 h-3.5 text-orange-600 group-hover/script:text-white transition-transform group-hover/script:translate-x-0.5 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. The Next Obvious Step Bottom Banner (Section 20) */}
      {selectedTopicIds.size > 0 && (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-100">Action Ready</div>
            <div className="text-base font-bold mt-0.5">
              {selectedTopicIds.size} Topic{selectedTopicIds.size > 1 ? 's' : ''} Selected
            </div>
            <div className="text-xs text-orange-100">
              Move directly into the Scripts Studio to draft scene-by-scene production reels.
            </div>
          </div>

          <button
            type="button"
            onClick={handleMoveSelected}
            disabled={isMovingToScripts}
            className="px-6 py-3 bg-white hover:bg-orange-50 text-orange-700 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span>Move Selected Topics to Scripts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Topic Modal (Section 15) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Add Manual Topic (No AI Required)</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic Title / Core Concept *</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Home Loan Hacks You Won't Hear From Banks"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Hook (First 3 Seconds)</label>
                <input
                  type="text"
                  placeholder="e.g. Stop paying the standard EMI before doing this..."
                  value={manualHook}
                  onChange={(e) => setManualHook(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Format</label>
                  <select
                    value={manualFormat}
                    onChange={(e) => setManualFormat(e.target.value as TopicFormat)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Reel">Reel (Short-form)</option>
                    <option value="Carousel">Carousel (Swipeable)</option>
                    <option value="Image">Static Image</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Content Goal</label>
                  <select
                    value={manualGoal}
                    onChange={(e) => setManualGoal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Growth">Growth (Viral / Reach)</option>
                    <option value="Engagement">Engagement (Comments)</option>
                    <option value="Conversion">Conversion (Link / Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience / Angle</label>
                <input
                  type="text"
                  placeholder="e.g. First-time home buyers aged 28-38"
                  value={manualAngle}
                  onChange={(e) => setManualAngle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {isSavingManual ? 'Saving...' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Edit Topic</h3>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hook</label>
                <input
                  type="text"
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Format</label>
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as TopicFormat)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Reel">Reel</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Image">Image</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Content Goal</label>
                  <select
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Growth">Growth</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Conversion">Conversion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience / Angle</label>
                <input
                  type="text"
                  value={editAngle}
                  onChange={(e) => setEditAngle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assist Modal (Section 16 - Diff View & Confirmation) */}
      {aiAssistTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-gray-900">AI Assist for Topic</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiAssistTopic(null);
                  setAiSuggestion(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="font-semibold text-gray-500 block mb-1">Target Topic</span>
                <p className="font-bold text-gray-900 text-sm">{aiAssistTopic.title}</p>
                <p className="text-gray-500 italic mt-0.5">"{aiAssistTopic.hook}"</p>
              </div>

              {/* Action Buttons */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Assistance Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiAssistAction('rewrite_hook')}
                    className={`p-2 rounded-lg border text-center font-medium transition-all ${
                      aiAssistAction === 'rewrite_hook'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Rewrite Hook
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAssistAction('more_engaging')}
                    className={`p-2 rounded-lg border text-center font-medium transition-all ${
                      aiAssistAction === 'more_engaging'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Make More Engaging
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAssistAction('repurpose_carousel')}
                    className={`p-2 rounded-lg border text-center font-medium transition-all ${
                      aiAssistAction === 'repurpose_carousel'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Repurpose to Carousel
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Custom Prompt or Directive (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Add urgency, focus on student loans, make it funny"
                  value={aiAssistPrompt}
                  onChange={(e) => setAiAssistPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestAiAssist}
                  disabled={aiAssistLoading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiAssistLoading ? 'animate-spin' : ''}`} />
                  <span>{aiAssistLoading ? 'Consulting Gemini...' : 'Generate Suggestion'}</span>
                </button>
              </div>

              {/* Diff Preview: Original vs Suggested (Section 16) */}
              {aiSuggestion && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Suggestion Preview
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Original */}
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Original</span>
                      <p className="font-semibold text-gray-700">{aiSuggestion.original.title}</p>
                      <p className="text-gray-500 italic mt-1 text-[11px]">"{aiSuggestion.original.hook}"</p>
                    </div>

                    {/* Suggested */}
                    <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-lg">
                      <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Suggested</span>
                      <p className="font-bold text-orange-950">{aiSuggestion.suggested.title}</p>
                      <p className="text-orange-800 italic mt-1 text-[11px]">"{aiSuggestion.suggested.hook}"</p>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-gray-200 text-[11px] text-gray-600">
                    <span className="font-semibold text-gray-900">Why this is better:</span> {aiSuggestion.diffSummary}
                  </div>

                  {/* Accept / Keep Original buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAiSuggestion(null)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                    >
                      Keep Original
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptAiSuggestion}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Topic & Learn Guardrail Modal (Self-Learning Engine) */}
      {rejectingTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Reject Topic & Add Guardrail</h3>
                  <span className="text-[10px] text-gray-500">Updates AI Skill Strategy Automatically</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingTopic(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Rejected Topic Concept
                </span>
                <p className="font-bold text-gray-900">{rejectingTopic.title}</p>
                <p className="text-gray-600 italic mt-0.5 text-[11px]">"{rejectingTopic.hook}"</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Why are you rejecting this? (New Guardrail Rule) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Too aggressive tone. Never advise borrowing money for non-essential luxury purchases."
                  className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Guardrail Category</label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="Tone & Content Angle">Tone & Content Angle</option>
                  <option value="Topic Theme & Relevance">Topic Theme & Relevance</option>
                  <option value="Target Audience Fit">Target Audience Fit</option>
                  <option value="Format & Structure">Format & Structure</option>
                  <option value="Brand Safety & Compliance">Brand Safety & Compliance</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Self-Learning Guardrail:</strong> When submitted, this reason will be committed into the active <code>{activeSkill.version}</code> AI strategy skill. Next time you generate topics, the AI will use this rule as an absolute negative constraint.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRejectingTopic(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectionReason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isSubmittingReject ? 'Saving Guardrail...' : 'Reject & Train Guardrail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Topic Generation Configuration Modal */}
      {isAiGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Configure AI Topic Generation</h3>
                  <span className="text-[10px] text-gray-500">Control volume, formats, and guardrails</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiGenModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartAiGeneration} className="mt-4 space-y-4">
              {/* How many topics */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  How many topic ideas would you like to generate?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGenCount(num)}
                      className={`py-2 px-3 rounded-lg border text-center font-bold transition-all ${
                        genCount === num
                          ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-200'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {num} Topics
                    </button>
                  ))}
                </div>
              </div>

              {/* What format */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  What content format?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenFormat('all')}
                    className={`py-2.5 px-3 rounded-lg border text-center font-medium transition-all ${
                      genFormat === 'all'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold ring-2 ring-orange-200'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs">Mixed</div>
                    <div className="text-[10px] text-gray-500">Reels & Carousels</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenFormat('Reel')}
                    className={`py-2.5 px-3 rounded-lg border text-center font-medium transition-all ${
                      genFormat === 'Reel'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold ring-2 ring-orange-200'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-center gap-1">
                      <Video className="w-3.5 h-3.5 text-orange-600" />
                      <span>Reels Only</span>
                    </div>
                    <div className="text-[10px] text-gray-500">High Virality / Hook</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenFormat('Carousel')}
                    className={`py-2.5 px-3 rounded-lg border text-center font-medium transition-all ${
                      genFormat === 'Carousel'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold ring-2 ring-orange-200'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-center gap-1">
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>Carousels</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Educational / Saves</div>
                  </button>
                </div>
              </div>

              {/* Optional Custom Angle */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Specific Theme or Campaign Focus (Optional)
                </label>
                <input
                  type="text"
                  value={genAngle}
                  onChange={(e) => setGenAngle(e.target.value)}
                  placeholder="e.g. Credit score hacks, emergency fund planning, first-time home buyers..."
                  className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Active Learned Guardrails in Rulebook */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                    <span>Enforced Guardrails ({activeSkill.guardrails?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-gray-500">Learned from rejections & audits</span>
                </div>
                {activeSkill.guardrails && activeSkill.guardrails.length > 0 ? (
                  <ul className="text-[11px] text-gray-600 space-y-1 max-h-24 overflow-y-auto pl-1">
                    {activeSkill.guardrails.slice(0, 4).map((g: any, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-orange-500 font-bold">•</span>
                        <span className="line-clamp-1">{typeof g === 'string' ? g : g.rule || g.description}</span>
                      </li>
                    ))}
                    {activeSkill.guardrails.length > 4 && (
                      <li className="text-[10px] text-gray-400 pl-2">
                        +{activeSkill.guardrails.length - 4} more guardrails active in skill rulebook
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">
                    No custom rejection guardrails yet. Any rejected topic reason will appear here!
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAiGenModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate {genCount} {genFormat === 'all' ? 'Ideas' : genFormat + 's'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Multi-Select Action Bar (appears when items are selected) */}
      {selectedTopicIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 text-white shadow-2xl rounded-2xl px-5 py-3 border border-gray-700 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-100 whitespace-nowrap">
              {selectedTopicIds.size} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={isPerformingBulkAction}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve All</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBulkReject}
              disabled={isPerformingBulkAction}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject All</span>
            </button>

            <button
              type="button"
              onClick={handleMoveSelected}
              disabled={isMovingToScripts || isPerformingBulkAction}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Move to Scripts</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPerformingBulkAction}
              className="p-1.5 bg-gray-800 hover:bg-rose-900/60 text-gray-300 hover:text-rose-200 rounded-lg text-xs font-semibold border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Delete selected topics"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedTopicIds(new Set())}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 transition-colors"
              title="Deselect all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal with Self-Learning Guardrail Ingestion */}
      {isBulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Reject & Guardrail ({selectedTopicIds.size} Topics)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Disapproves selected topics and trains the AI Engine not to repeat these angles.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBulkReject} className="space-y-4 text-xs">
              {/* Selected Topics Preview */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Selected Concepts to Reject ({selectedTopicIds.size})
                </label>
                <div className="max-h-28 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-2.5 space-y-1.5 divide-y divide-gray-100">
                  {topics
                    .filter((t) => selectedTopicIds.has(t.id))
                    .map((topic) => (
                      <div key={topic.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-800 truncate">{topic.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 shrink-0">
                          {topic.format}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Rejection Category */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Rejection Reason Category
                </label>
                <select
                  value={bulkRejectCategory}
                  onChange={(e) => setBulkRejectCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="Tone & Content Angle">Tone & Content Angle (Too aggressive, sensationalist)</option>
                  <option value="Too Generic">Too Generic / Lacks Strong Hook</option>
                  <option value="Off-Brand / Niche Mismatch">Off-Brand / Not aligned with account niche</option>
                  <option value="Compliance & Policy">Compliance, Financial or Legal Risk</option>
                  <option value="Format & Production Constraint">Production or Format Constraint</option>
                  <option value="Audience Fatigue">Overdone Topic / Audience Fatigue</option>
                </select>
              </div>

              {/* Feedback Note */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  AI Guardrail Feedback / Directive (Teaches the AI model)
                </label>
                <textarea
                  rows={3}
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="e.g. Avoid fear-mongering hooks regarding market crashes. Focus on structured asset allocation and verified tax data."
                  className="w-full px-3.5 py-2.5 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-orange-500 placeholder:text-gray-400 leading-relaxed"
                />
              </div>

              {/* Train AI Guardrails Checkbox */}
              <label className="flex items-start gap-2 p-3 bg-orange-50/70 border border-orange-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkRejectTrainGuardrail}
                  onChange={(e) => setBulkRejectTrainGuardrail(e.target.checked)}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block text-xs">
                    Update Active AI Strategy Skill (Self-Learning)
                  </span>
                  <span className="text-[11px] text-gray-600 leading-relaxed block">
                    Automatically persists this negative constraint into the Active AI Rulebook so future topic generations avoid this pattern.
                  </span>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBulkRejectModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPerformingBulkAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Reject {selectedTopicIds.size} Topics & Train AI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
