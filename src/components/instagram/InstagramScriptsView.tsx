import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Film,
  Layers,
  Clock,
  Volume2,
  Eye,
  Type,
  Wand2,
  RefreshCw,
  Save,
  MessageSquare,
  ArrowRight,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Video,
  ExternalLink,
  Download,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  Mail,
  Kanban,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Share2
} from 'lucide-react';
import { ScriptItem, AISkillRecord, TeamMember } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { useTheme } from '../../context/ThemeContext';

interface InstagramScriptsViewProps {
  scripts: ScriptItem[];
  activeSkill: AISkillRecord;
  teamMembers?: TeamMember[];
  initialSelectedScriptId?: string;
  onGenerateScript: (topicId?: string, format?: 'Reel' | 'Carousel', customTitle?: string) => Promise<void>;
  onSaveScript: (scriptId: string, updates: Partial<ScriptItem>) => Promise<void>;
  onNavigateToCalendar?: (scriptId: string) => void;
  onSwitchToSwimlane?: () => void;
  isGenerating: boolean;
}

export const InstagramScriptsView: React.FC<InstagramScriptsViewProps> = ({
  scripts,
  activeSkill,
  teamMembers = [],
  initialSelectedScriptId,
  onGenerateScript,
  onSaveScript,
  onNavigateToCalendar,
  onSwitchToSwimlane,
  isGenerating
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialSelectedScriptId || scripts[0]?.id || '');

  useEffect(() => {
    if (initialSelectedScriptId) {
      setSelectedScriptId(initialSelectedScriptId);
    } else if (!selectedScriptId && scripts.length > 0) {
      setSelectedScriptId(scripts[0].id);
    }
  }, [initialSelectedScriptId, scripts]);
  const [filterFormat, setFilterFormat] = useState<'all' | 'Reel' | 'Carousel'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Filter team members to strictly 'Script Writer' role
  const isScriptWriter = (m: TeamMember) => m.role === 'Script Writer' || (m.role as string) === 'script_writer';
  const scriptWriters = teamMembers.filter(isScriptWriter);
  const nonScriptWriters = teamMembers.filter((m) => !isScriptWriter(m));

  const handleAssignScriptWriter = async (scriptId: string, memberId: string | 'unassigned') => {
    try {
      setAssignmentError(null);
      setIsAssigneeDropdownOpen(false);

      if (memberId === 'unassigned') {
        await onSaveScript(scriptId, {
          assignedWriterId: undefined,
          assignedWriterName: undefined,
          assignedWriterEmail: undefined
        });
        return;
      }

      const target = teamMembers.find((m) => m.id === memberId);
      if (!target) return;

      // Strict validation: Only Script Writers can be assigned
      if (!isScriptWriter(target)) {
        setAssignmentError(
          `Action blocked: Only team members with the 'Script Writer' role can be assigned. ${target.name} has the role '${target.role}'.`
        );
        return;
      }

      await onSaveScript(scriptId, {
        assignedWriterId: target.id,
        assignedWriterName: target.name,
        assignedWriterEmail: target.email
      });
    } catch (err: any) {
      setAssignmentError(err.message || 'Failed to assign script writer');
    }
  };

  // Multi-Select & Bulk Actions
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([]);
  const [isBulkAgencyModalOpen, setIsBulkAgencyModalOpen] = useState(false);
  const [bulkAgencyNotes, setBulkAgencyNotes] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  // Manual Script Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualFormat, setManualFormat] = useState<'Reel' | 'Carousel'>('Reel');
  const [manualHook, setManualHook] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [manualCta, setManualCta] = useState('');

  // AI Assist Modal / Side Panel (Section 24)
  const [isAiAssistOpen, setIsAiAssistOpen] = useState(false);
  const [aiAssistType, setAiAssistType] = useState<'enhance_hook' | 'shorten' | 'add_humor' | 'optimize_retention' | 'custom'>('enhance_hook');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDiffResult, setAiDiffResult] = useState<{
    originalHook?: string;
    suggestedHook?: string;
    originalBody?: string;
    suggestedBody?: string;
    diffNotes?: string;
  } | null>(null);

  // Scoring State (Section 25)
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    breakdown: { hookStrength: number; clarity: number; engagementPotential: number; ctaQuality: number };
    suggestions: string[];
  } | null>(null);

  // Agency Modal State (Section 26)
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [agencyNotes, setAgencyNotes] = useState('');
  const [isSendingAgency, setIsSendingAgency] = useState(false);
  const [agencySuccess, setAgencySuccess] = useState(false);
  const [isSendingToTeams, setIsSendingToTeams] = useState(false);

  // Active Script
  const activeScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0];

  // Editor states synced with activeScript
  const [editorStyle, setEditorStyle] = useState<'freeform' | 'scenes'>('freeform');
  const [editTitle, setEditTitle] = useState(activeScript?.title || '');
  const [editHook, setEditHook] = useState(activeScript?.hook || '');
  const [editBody, setEditBody] = useState(activeScript?.caption || '');
  const [editCta, setEditCta] = useState(activeScript?.callToAction || '');
  const [editScenes, setEditScenes] = useState<any[]>(activeScript?.scenes || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize when selectedScriptId changes
  React.useEffect(() => {
    if (activeScript) {
      setEditTitle(activeScript.title);
      setEditHook(activeScript.hook);
      setEditBody(activeScript.caption || '');
      setEditCta(activeScript.callToAction || '');
      setEditScenes(activeScript.scenes || []);
      setEditorStyle(activeScript.scenes && activeScript.scenes.length > 0 ? 'scenes' : 'freeform');
      setScoreResult(
        activeScript.score
          ? {
              score: activeScript.score,
              breakdown: activeScript.scoreBreakdown || {
                hookStrength: 85,
                clarity: 88,
                engagementPotential: 82,
                ctaQuality: 80
              },
              suggestions: activeScript.scoreSuggestions || [
                'Hook is punchy. Consider adding on-screen text in the first second.',
                'CTA is clear and direct.'
              ]
            }
          : null
      );
    }
  }, [selectedScriptId, activeScript?.id]);

  // Filter scripts
  const filteredScripts = scripts.filter((s) => {
    if (filterFormat !== 'all' && s.format !== filterFormat) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const handleToggleSelectScript = (scriptId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedScriptIds((prev) =>
      prev.includes(scriptId) ? prev.filter((id) => id !== scriptId) : [...prev, scriptId]
    );
  };

  const handleSelectAllScripts = () => {
    if (selectedScriptIds.length === filteredScripts.length) {
      setSelectedScriptIds([]);
    } else {
      setSelectedScriptIds(filteredScripts.map((s) => s.id));
    }
  };

  const handleBulkAction = async (action: 'send_to_agency' | 'mark_ready' | 'mark_draft' | 'delete') => {
    if (selectedScriptIds.length === 0) return;
    if (action === 'send_to_agency') {
      setIsBulkAgencyModalOpen(true);
      return;
    }
    setIsBulkProcessing(true);
    try {
      await instagramApi.bulkActionScripts(selectedScriptIds, action);
      for (const id of selectedScriptIds) {
        if (action === 'mark_ready') await onSaveScript(id, { status: 'ready' });
        if (action === 'mark_draft') await onSaveScript(id, { status: 'draft' });
      }
      setBulkSuccessMessage(`Successfully updated ${selectedScriptIds.length} script(s)`);
      setTimeout(() => setBulkSuccessMessage(null), 3000);
      setSelectedScriptIds([]);
    } catch (err: any) {
      alert(`Bulk action failed: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleConfirmBulkAgency = async () => {
    setIsBulkProcessing(true);
    try {
      await instagramApi.bulkActionScripts(selectedScriptIds, 'send_to_agency', { notes: bulkAgencyNotes });
      for (const id of selectedScriptIds) {
        await onSaveScript(id, { status: 'sent_to_agency' });
      }
      setBulkSuccessMessage(`Dispatched ${selectedScriptIds.length} script package(s) to agency via SMTP email!`);
      setTimeout(() => setBulkSuccessMessage(null), 3500);
      setIsBulkAgencyModalOpen(false);
      setSelectedScriptIds([]);
    } catch (err: any) {
      alert(`Agency dispatch failed: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Save changes to current script
  const handleSave = async () => {
    if (!activeScript) return;
    setIsSaving(true);
    try {
      await onSaveScript(activeScript.id, {
        title: editTitle,
        hook: editHook,
        caption: editBody,
        callToAction: editCta,
        scenes: editScenes,
        timeline: editScenes
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert between Freeform & Scene-by-Scene (Section 23)
  const handleConvertToScenes = async () => {
    if (!activeScript) return;
    setIsSaving(true);
    try {
      const updated = await instagramApi.convertScriptToScenes(activeScript.id);
      setEditScenes(updated.scenes || []);
      setEditorStyle('scenes');
      await onSaveScript(activeScript.id, { scenes: updated.scenes, timeline: updated.scenes });
    } catch (err: any) {
      alert(`Conversion to scenes failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToFreeform = () => {
    if (editScenes.length > 0) {
      const combinedBody = editScenes
        .map((s, idx) => `Scene ${idx + 1}: ${s.spokenAudio || s.narration || ''} [Visual: ${s.visualDescription || ''}]`)
        .join('\n\n');
      setEditBody((prev) => (prev ? prev : combinedBody));
    }
    setEditorStyle('freeform');
  };

  // AI Assist (Section 24)
  const handleRunAiAssist = async () => {
    if (!activeScript) return;
    setIsAiLoading(true);
    try {
      let prompt = customAiPrompt;
      if (aiAssistType === 'enhance_hook') prompt = 'Make the opening hook 10x more attention-grabbing for finance audiences.';
      if (aiAssistType === 'shorten') prompt = 'Trim 30% of words for punchy, rapid-fire pacing.';
      if (aiAssistType === 'add_humor') prompt = 'Add relatable, self-deprecating humor without losing credibility.';
      if (aiAssistType === 'optimize_retention') prompt = 'Add visual loop reset cues and cliffhangers in the middle.';

      const result = await instagramApi.aiAssistScript(activeScript.id, prompt, aiAssistType);
      setAiDiffResult(result);
    } catch (err: any) {
      alert(`AI Assist failed: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptAiDiff = async () => {
    if (!aiDiffResult || !activeScript) return;
    if (aiDiffResult.suggestedHook) setEditHook(aiDiffResult.suggestedHook);
    if (aiDiffResult.suggestedBody) setEditBody(aiDiffResult.suggestedBody);
    await onSaveScript(activeScript.id, {
      hook: aiDiffResult.suggestedHook || editHook,
      caption: aiDiffResult.suggestedBody || editBody
    });
    setAiDiffResult(null);
    setIsAiAssistOpen(false);
  };

  // Script Scoring (Section 25)
  const handleScoreScript = async () => {
    if (!activeScript) return;
    setIsScoring(true);
    try {
      const res = await instagramApi.scoreScript(activeScript.id);
      setScoreResult({
        score: res.score,
        breakdown: res.breakdown,
        suggestions: res.suggestions
      });
      await onSaveScript(activeScript.id, {
        score: res.score,
        scoreBreakdown: res.breakdown,
        scoreSuggestions: res.suggestions,
        status: res.score >= 80 ? 'ready' : 'in_review'
      });
    } catch (err: any) {
      alert(`Scoring failed: ${err.message}`);
    } finally {
      setIsScoring(false);
    }
  };

  // Send to Agency / Production Handoff (Section 26)
  const handleSendToAgency = async () => {
    if (!activeScript) return;
    setIsSendingAgency(true);
    try {
      await instagramApi.sendScriptToAgency(activeScript.id, agencyNotes);
      await onSaveScript(activeScript.id, { status: 'sent_to_agency' });
      setAgencySuccess(true);
      setTimeout(() => {
        setAgencySuccess(false);
        setIsAgencyModalOpen(false);
      }, 2000);
    } catch (err: any) {
      alert(`Failed to send package: ${err.message}`);
    } finally {
      setIsSendingAgency(false);
    }
  };

  // Send to Microsoft Teams via Power Automate Webhook
  const handleSendToTeams = async () => {
    if (!activeScript) return;
    setIsSendingToTeams(true);
    try {
      const res = await instagramApi.sendScriptToTeams(activeScript.id);
      if (res.success) {
        alert(res.message || `Dispatched "${activeScript.title}" to Microsoft Teams!`);
      } else {
        alert(`Failed to send to Teams: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Teams dispatch error: ${err.message}`);
    } finally {
      setIsSendingToTeams(false);
    }
  };

  // Schedule in Content Calendar (Section 27)
  const handleScheduleInCalendar = () => {
    if (!activeScript) return;
    if (onNavigateToCalendar) {
      onNavigateToCalendar(activeScript.id);
    }
  };

  const copyFullScript = () => {
    if (!activeScript) return;
    const content = `TITLE: ${editTitle}\nFORMAT: ${activeScript.format}\nHOOK: ${editHook}\n\nBODY / SCRIPT:\n${editBody}\n\nCALL TO ACTION: ${editCta}\n\nHASHTAGS: ${(activeScript.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(content);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ready') {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          Ready
        </span>
      );
    }
    if (status === 'sent_to_agency') {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isDark ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}>
          Sent to Agency
        </span>
      );
    }
    if (status === 'in_review') {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          In Review
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
      }`}>
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              <FileText className="w-3.5 h-3.5 text-orange-500" /> Scripts Studio
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Strategy Rulebook: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{activeSkill.version}</strong>
            </span>
          </div>
          <h1 className={`text-xl font-bold mt-1.5 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Script Crafting & Scene Storyboards
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Write freeform scripts or scene-by-scene shoot plans, score hook retention, and export to agency.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onSwitchToSwimlane && (
            <button
              type="button"
              onClick={onSwitchToSwimlane}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-colors cursor-pointer shadow-2xs ${
                isDark 
                  ? 'bg-orange-950/50 hover:bg-orange-900/60 text-orange-300 border-orange-850' 
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200'
              }`}
              title="Open horizontal Script Writer Swimlane view"
            >
              <Kanban className="w-3.5 h-3.5 text-orange-500" />
              <span>Swimlane Board</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-gray-400" />
            <span>New Script</span>
          </button>

          <button
            type="button"
            onClick={() => onGenerateScript(undefined, 'Reel', 'Top Personal Loan Prepayment Mistakes')}
            disabled={isGenerating}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Drafting...' : 'AI Reel Script'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Section 21: Left List, Right Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Script List / Queue (Section 22) */}
        <div className={`lg:col-span-4 border rounded-xl p-4 shadow-sm space-y-3 ${
          isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllScripts}
                title={selectedScriptIds.length === filteredScripts.length ? 'Deselect All' : 'Select All'}
                className="text-gray-400 hover:text-orange-500 p-0.5 rounded transition-colors cursor-pointer"
              >
                {selectedScriptIds.length > 0 && selectedScriptIds.length === filteredScripts.length ? (
                  <CheckSquare className="w-4 h-4 text-orange-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <h2 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Queue ({filteredScripts.length})
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value as any)}
                className={`text-[11px] rounded px-2 py-1 border ${
                  isDark ? 'bg-[#181820] text-gray-200 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <option value="all">All Formats</option>
                <option value="Reel">Reels</option>
                <option value="Carousel">Carousels</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedScriptIds.length > 0 && (
            <div className={`p-2.5 rounded-lg border space-y-2 ${
              isDark ? 'bg-orange-950/30 border-orange-900/60' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`flex items-center justify-between text-xs font-semibold ${
                isDark ? 'text-orange-200' : 'text-orange-900'
              }`}>
                <span>{selectedScriptIds.length} script{selectedScriptIds.length > 1 ? 's' : ''} selected</span>
                <button
                  type="button"
                  onClick={() => setSelectedScriptIds([])}
                  className="text-[11px] text-orange-500 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleBulkAction('send_to_agency')}
                  disabled={isBulkProcessing}
                  className="px-2.5 py-1 text-[11px] font-bold bg-orange-600 hover:bg-orange-700 text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>Send to Agency</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('mark_ready')}
                  disabled={isBulkProcessing}
                  className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-800/60' 
                      : 'bg-white hover:bg-gray-100 text-emerald-700 border-emerald-300'
                  }`}
                >
                  Mark Ready
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('mark_draft')}
                  disabled={isBulkProcessing}
                  className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' 
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>
          )}

          {bulkSuccessMessage && (
            <div className={`p-2 border text-xs rounded flex items-center gap-1.5 ${
              isDark ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{bulkSuccessMessage}</span>
            </div>
          )}

          {filteredScripts.length === 0 ? (
            <div className={`py-8 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No scripts in queue. Select a topic or click "New Script".
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredScripts.map((s) => {
                const isSelected = (activeScript?.id === s.id);
                const isChecked = selectedScriptIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScriptId(s.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? (isDark ? 'border-orange-500 bg-orange-950/40 shadow-xs' : 'border-orange-500 bg-orange-50/40 shadow-xs')
                        : (isDark ? 'border-gray-800 bg-[#181820] hover:border-gray-700 hover:bg-white/[0.02]' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50')
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectScript(s.id, e)}
                          className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-orange-500" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div className="flex items-center gap-1.5">
                          {s.format === 'Reel' ? (
                            <Video className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          ) : (
                            <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s.format}</span>
                        </div>
                      </div>
                      {getStatusBadge(s.status || 'draft')}
                    </div>

                    <h3 className={`font-bold text-xs line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                    <p className={`text-[11px] italic mt-0.5 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      "{s.hook}"
                    </p>

                    <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        {s.assignedWriterName ? (
                          <span className={`font-semibold px-1.5 py-0.5 rounded border truncate ${
                            isDark ? 'text-orange-300 bg-orange-950/60 border-orange-800/60' : 'text-orange-800 bg-orange-50 border-orange-200'
                          }`}>
                            ✍️ {s.assignedWriterName.split(' ')[0]}
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded border ${
                            isDark ? 'text-amber-300 bg-amber-950/60 border-amber-800/60' : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            ⚠️ Unassigned
                          </span>
                        )}
                      </div>
                      {s.score ? (
                        <span className={`font-bold px-1.5 py-0.5 rounded border ${
                          isDark ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}>
                          Score: {s.score}/100
                        </span>
                      ) : (
                        <span className="text-gray-500">Unscored</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Script Editor Workspace (Section 23) */}
        {activeScript ? (
          <div className={`lg:col-span-8 border rounded-xl p-6 shadow-sm space-y-6 ${
            isDark ? 'bg-[#141419] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header: Title, Format, Topic source, Obvious next action button */}
            <div className={`pb-5 border-b space-y-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-100 text-orange-800 border-orange-200'
                  }`}>
                    {activeScript.format} Script
                  </span>
                  {activeScript.topicId && (
                    <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      <span>Linked Topic: #{activeScript.topicId.substring(0, 6)}</span>
                    </span>
                  )}
                  {getStatusBadge(activeScript.status || 'draft')}
                </div>

                {/* The Next Obvious Step: Schedule in Calendar (Section 27) */}
                <button
                  id="btn-schedule-calendar"
                  type="button"
                  onClick={handleScheduleInCalendar}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule in Content Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title input */}
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`text-lg font-bold w-full focus:outline-none focus:border-b-2 focus:border-orange-500 pb-1 ${
                  isDark ? 'bg-transparent text-white placeholder-gray-500' : 'bg-transparent text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Script Title..."
              />

              {/* Persistent Quick Action Bar (Top of Editor) */}
              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
                isDark ? 'bg-[#181820] border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSendToTeams}
                    disabled={isSendingToTeams}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                      isDark 
                        ? 'bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border-purple-800/60'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                    }`}
                    title="Dispatch script to Microsoft Teams via Power Automate"
                  >
                    {isSendingToTeams ? (
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>Send to Teams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAgencyModalOpen(true)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border-indigo-800/60'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send to Agency</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyFullScript}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    <span>{copiedFull ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Assigned Script Writer Row (Strict Role Policy Enforced) */}
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#181820] border-gray-800' : 'bg-slate-50/80 border-gray-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${
                    isDark ? 'bg-orange-950/60 text-orange-300 border border-orange-800/60' : 'bg-orange-100 text-orange-800'
                  }`}>
                    ✍️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {activeScript.assignedWriterName
                          ? activeScript.assignedWriterName
                          : 'Unassigned Script'}
                      </span>
                      {activeScript.assignedWriterName ? (
                        <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${
                          isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-100 text-orange-900 border-orange-200'
                        }`}>
                          Script Writer
                        </span>
                      ) : (
                        <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${
                          isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          ⚠️ Needs Script Writer
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Strict policy: Only team members with the &apos;Script Writer&apos; role can be assigned.
                    </p>
                  </div>
                </div>

                {/* Assignee Picker Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs border transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' 
                        : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300'
                    }`}
                  >
                    <span>{activeScript.assignedWriterName ? 'Change Writer' : 'Assign Script Writer'}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {isAssigneeDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsAssigneeDropdownOpen(false)}
                      />
                      <div className={`absolute right-0 mt-1.5 w-64 rounded-xl shadow-xl border py-2 z-40 animate-in fade-in zoom-in-95 duration-100 ${
                        isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}>
                        <div className={`px-3 py-1.5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                          <span className={`block text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Available Script Writers
                          </span>
                          <span className="block text-[10px] text-emerald-500 font-medium">
                            ✓ Only &apos;Script Writer&apos; role can be assigned
                          </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto py-1">
                          <button
                            type="button"
                            onClick={() => handleAssignScriptWriter(activeScript.id, 'unassigned')}
                            className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                              isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            <span>None (Unassigned)</span>
                          </button>

                          {scriptWriters.map((writer) => {
                            const isSelected = activeScript.assignedWriterId === writer.id;
                            return (
                              <button
                                key={writer.id}
                                type="button"
                                onClick={() => handleAssignScriptWriter(activeScript.id, writer.id)}
                                className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? (isDark ? 'bg-orange-950/60 text-orange-200 font-bold' : 'bg-orange-50 text-orange-950 font-bold')
                                    : (isDark ? 'text-gray-200 hover:bg-gray-800 hover:text-white' : 'text-gray-800 hover:bg-orange-50/70 hover:text-orange-900')
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

                          {nonScriptWriters.length > 0 && (
                            <>
                              <div className="px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                                <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                  Other Roles (Ineligible for Scripts)
                                </span>
                              </div>
                              {nonScriptWriters.map((m) => (
                                <div
                                  key={m.id}
                                  className="px-3 py-1 text-xs text-gray-400 flex items-center justify-between opacity-60 cursor-not-allowed"
                                  title={`Cannot assign: ${m.name} has role '${m.role}', not 'Script Writer'`}
                                >
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 rounded text-gray-500">
                                    {m.role}
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
              </div>

              {assignmentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
                  <span>{assignmentError}</span>
                  <button
                    type="button"
                    onClick={() => setAssignmentError(null)}
                    className="text-rose-600 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Editor Mode Switcher & Format Conversion (Section 23) */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Writing Mode:</span>
                <div className={`inline-flex rounded-lg border p-0.5 ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
                }`}>
                  <button
                    type="button"
                    onClick={() => setEditorStyle('freeform')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      editorStyle === 'freeform'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Freeform Text (Hook, Body, CTA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorStyle('scenes')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      editorStyle === 'scenes'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Scene-by-Scene Storyboard
                  </button>
                </div>
              </div>

              {/* Conversion Buttons */}
              <div className="flex items-center gap-2">
                {editorStyle === 'freeform' ? (
                  <button
                    type="button"
                    onClick={handleConvertToScenes}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-orange-950/40 hover:bg-orange-900/50 text-orange-400 border-orange-800'
                        : 'bg-white hover:bg-orange-50 text-orange-600 border-orange-200'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Convert to Scene-by-Scene</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvertToFreeform}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Convert to Simple Script</span>
                  </button>
                )}
              </div>
            </div>

            {/* Writing Area */}
            {editorStyle === 'freeform' ? (
              /* Freeform Text Mode */
              <div className="space-y-4">
                {/* Hook */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      1. The Hook (0-3 Seconds)
                    </label>
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Critical for 3s drop-off defense</span>
                  </div>
                  <input
                    type="text"
                    value={editHook}
                    onChange={(e) => setEditHook(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-orange-500 transition-colors ${
                      isDark
                        ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-orange-50/20 border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Punchy statement, negative frame, or question..."
                  />
                </div>

                {/* Body / Script */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      2. Script Body & Narration
                    </label>
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fast value delivery, bullet points, proof</span>
                  </div>
                  <textarea
                    rows={8}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className={`w-full px-3.5 py-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-orange-500 transition-colors ${
                      isDark
                        ? 'bg-[#121217] border-gray-700 text-gray-100 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Write the full script text here..."
                  />
                </div>

                {/* Call to Action */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      3. Call to Action (CTA)
                    </label>
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Single clear prompt (Comment, Save, Share)</span>
                  </div>
                  <input
                    type="text"
                    value={editCta}
                    onChange={(e) => setEditCta(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-colors ${
                      isDark
                        ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="e.g. Comment 'CALC' and I will DM you the free debt snowball template..."
                  />
                </div>
              </div>
            ) : (
              /* Scene-by-Scene Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Visual & Audio Scene Breakdown</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditScenes((prev) => [
                        ...prev,
                        {
                          sceneNumber: prev.length + 1,
                          durationSeconds: 5,
                          visualDescription: 'Host gestures to graphic on screen',
                          spokenAudio: 'Next step to remember...',
                          onScreenText: 'STEP ' + (prev.length + 1)
                        }
                      ])
                    }
                    className="text-xs text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Scene
                  </button>
                </div>

                <div className="space-y-3">
                  {editScenes.map((scene, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border space-y-3 transition-colors ${
                        isDark ? 'bg-[#181820] border-gray-800' : 'border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isDark ? 'text-orange-300 bg-orange-950/70 border border-orange-800/60' : 'text-orange-700 bg-orange-100'
                        }`}>
                          Scene {idx + 1} ({scene.durationSeconds || 5}s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditScenes((prev) => prev.filter((_, i) => i !== idx))}
                          className={`hover:text-rose-500 cursor-pointer transition-colors ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Visual Description
                          </label>
                          <textarea
                            rows={2}
                            value={scene.visualDescription || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditScenes((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, visualDescription: val } : s))
                              );
                            }}
                            className={`w-full p-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 shadow-2xs leading-relaxed transition-colors ${
                              isDark
                                ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="e.g. Fast zoom on phone screen..."
                          />
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Spoken Audio / Voiceover
                          </label>
                          <textarea
                            rows={2}
                            value={scene.spokenAudio || scene.narration || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditScenes((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, spokenAudio: val } : s))
                              );
                            }}
                            className={`w-full p-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 shadow-2xs leading-relaxed transition-colors ${
                              isDark
                                ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="e.g. Most people waste thousands on EMI interest..."
                          />
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            On-Screen Text Overlay
                          </label>
                          <textarea
                            rows={2}
                            value={scene.onScreenText || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditScenes((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, onScreenText: val } : s))
                              );
                            }}
                            className={`w-full p-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 shadow-2xs leading-relaxed transition-colors ${
                              isDark
                                ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder="e.g. STOP OVERPAYING INTEREST"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Assist & Scoring Toolbar (Section 24 & 25) */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-orange-950/20 border-orange-900/50' : 'bg-orange-50/40 border-orange-200/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Assistant & Scoring</span>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(Never overwrites without confirmation)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScoreScript}
                    disabled={isScoring}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors border cursor-pointer ${
                      isDark 
                        ? 'bg-[#181820] hover:bg-gray-800 text-gray-200 border-gray-700' 
                        : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isScoring ? 'Scoring...' : 'Score Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAiAssistOpen(!isAiAssistOpen)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI Polish Tools</span>
                  </button>
                </div>
              </div>

              {/* Score Display (Section 25) */}
              {scoreResult && (
                <div className={`border rounded-xl p-4 shadow-2xs space-y-3 ${
                  isDark ? 'bg-[#181820] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Script Quality Score:</span>
                      <span className="text-lg font-bold text-emerald-500">{scoreResult.score} / 100</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {scoreResult.score >= 80 ? 'Production Ready' : 'Needs Polish'}
                    </span>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className={`p-2 rounded border ${isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hook Strength</span>
                      <strong className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(scoreResult.breakdown as any)?.hookStrength ?? (scoreResult.breakdown as any)?.hook ?? 85}%
                      </strong>
                    </div>
                    <div className={`p-2 rounded border ${isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clarity & Pacing</span>
                      <strong className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(scoreResult.breakdown as any)?.clarity ?? 88}%
                      </strong>
                    </div>
                    <div className={`p-2 rounded border ${isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Engagement Potential</span>
                      <strong className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(scoreResult.breakdown as any)?.engagementPotential ?? (scoreResult.breakdown as any)?.engagement ?? 82}%
                      </strong>
                    </div>
                    <div className={`p-2 rounded border ${isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Call to Action</span>
                      <strong className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(scoreResult.breakdown as any)?.ctaQuality ?? (scoreResult.breakdown as any)?.cta ?? 80}%
                      </strong>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {scoreResult.suggestions.length > 0 && (
                    <div className={`text-xs space-y-1 pt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`font-semibold block text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>Suggestions to Improve:</span>
                      {scoreResult.suggestions.map((sug, i) => (
                        <div key={i} className={`flex items-start gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="text-orange-500 font-bold">•</span>
                          <span>{sug}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Assist Drawer / Options (Section 24) */}
              {isAiAssistOpen && (
                <div className={`border rounded-xl p-4 shadow-2xs space-y-3 ${
                  isDark ? 'bg-[#181820] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Select AI Transformation</span>
                    <button
                      type="button"
                      onClick={() => setIsAiAssistOpen(false)}
                      className={`cursor-pointer ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiAssistType('enhance_hook')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        aiAssistType === 'enhance_hook'
                          ? isDark ? 'border-orange-500 bg-orange-950/60 text-orange-300' : 'border-orange-500 bg-orange-50 text-orange-900'
                          : isDark ? 'border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Enhance Hook
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssistType('shorten')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        aiAssistType === 'shorten'
                          ? isDark ? 'border-orange-500 bg-orange-950/60 text-orange-300' : 'border-orange-500 bg-orange-50 text-orange-900'
                          : isDark ? 'border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Shorten Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssistType('add_humor')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        aiAssistType === 'add_humor'
                          ? isDark ? 'border-orange-500 bg-orange-950/60 text-orange-300' : 'border-orange-500 bg-orange-50 text-orange-900'
                          : isDark ? 'border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Add Humor
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssistType('optimize_retention')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        aiAssistType === 'optimize_retention'
                          ? isDark ? 'border-orange-500 bg-orange-950/60 text-orange-300' : 'border-orange-500 bg-orange-50 text-orange-900'
                          : isDark ? 'border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Optimize Retention
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customAiPrompt}
                      onChange={(e) => setCustomAiPrompt(e.target.value)}
                      placeholder="Or specify custom prompt (e.g. Rewrite with high urgency)..."
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-orange-500 transition-colors ${
                        isDark ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleRunAiAssist}
                      disabled={isAiLoading}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isAiLoading ? 'Analyzing...' : 'Run'}
                    </button>
                  </div>

                  {/* AI Diff Preview (Section 24: Accept / Discard) */}
                  {aiDiffResult && (
                    <div className={`p-3 rounded-lg border space-y-2 mt-2 ${
                      isDark ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <div className={`text-[11px] font-bold uppercase ${
                        isDark ? 'text-amber-300' : 'text-amber-900'
                      }`}>
                        Proposed Changes (Review before applying)
                      </div>

                      {aiDiffResult.suggestedHook && (
                        <div className="text-xs space-y-1">
                          <div className={`line-through text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Original: "{editHook}"</div>
                          <div className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-950'}`}>Suggested: "{aiDiffResult.suggestedHook}"</div>
                        </div>
                      )}

                      {aiDiffResult.diffNotes && (
                        <p className={`text-[11px] italic ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{aiDiffResult.diffNotes}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAiDiffResult(null)}
                          className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${
                            isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleAcceptAiDiff}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Changes</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls Bar: Save, Copy, Agency Export */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t ${
              isDark ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyFullScript}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFull ? 'Copied Full Script!' : 'Copy Script'}</span>
                </button>

                {/* Send to Agency (Section 26) */}
                <button
                  id="btn-send-to-agency"
                  type="button"
                  onClick={() => setIsAgencyModalOpen(true)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
                    isDark ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/80' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-purple-500" />
                  <span>Send to Agency</span>
                </button>

                {/* Send to Microsoft Teams */}
                <button
                  id="btn-send-to-teams"
                  type="button"
                  onClick={handleSendToTeams}
                  disabled={isSendingToTeams}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border ${
                    isDark ? 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/80' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                  title="Dispatch script with Adaptive Card to Microsoft Teams via Power Automate"
                >
                  {isSendingToTeams ? (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{isSendingToTeams ? 'Sending...' : 'Send to Teams'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`lg:col-span-8 border rounded-xl p-12 text-center shadow-sm space-y-3 ${
            isDark ? 'bg-[#141419] border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
          }`}>
            <FileText className={`w-10 h-10 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No Script Selected</h3>
            <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Select a script from the queue on the left, or create a new script to start crafting scenes and hooks.
            </p>
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              + Create New Script
            </button>
          </div>
        )}
      </div>

      {/* Manual Script Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Script</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!manualTitle.trim()) return;
                await onGenerateScript(undefined, manualFormat, manualTitle.trim());
                setIsManualModalOpen(false);
                setManualTitle('');
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. 3 Costly Loan Mistakes"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Format</label>
                <select
                  value={manualFormat}
                  onChange={(e) => setManualFormat(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Reel" className={isDark ? 'bg-[#181820]' : ''}>Reel (Short-form video)</option>
                  <option value="Carousel" className={isDark ? 'bg-[#181820]' : ''}>Carousel (Swipeable)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Create Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agency Production Handoff Modal (Section 26) */}
      {isAgencyModalOpen && activeScript && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-500" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Send to Agency / Production Partner</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAgencyModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                This compiles a clean, standardized production package for videographers, editors, or creative agencies.
              </p>

              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Script Title:</span>
                  <span className={`font-bold ml-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{editTitle}</span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Format:</span>
                  <span className={`font-bold ml-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeScript.format}</span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hook:</span>
                  <span className={`ml-1.5 italic ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>"{editHook}"</span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Scenes:</span>
                  <span className={`font-bold ml-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{editScenes.length || 1} scenes</span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Production Notes for Agency (Optional)
                </label>
                <textarea
                  rows={3}
                  value={agencyNotes}
                  onChange={(e) => setAgencyNotes(e.target.value)}
                  placeholder="e.g. Include brand logo watermark on top right, use fast jump cuts, B-roll of credit card statements..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {agencySuccess && (
                <div className={`p-3 rounded-lg font-semibold flex items-center gap-2 ${
                  isDark ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Production package dispatched to agency successfully!</span>
                </div>
              )}

              <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAgencyModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendToAgency}
                  disabled={isSendingAgency}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingAgency ? 'Packaging...' : 'Dispatch Package'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Agency Modal */}
      {isBulkAgencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  isDark ? 'bg-orange-950/60 text-orange-400' : 'bg-orange-100 text-orange-700'
                }`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bulk Send Scripts to Agency</h3>
                  <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dispatch {selectedScriptIds.length} Scripts via SMTP</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkAgencyModalOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                All {selectedScriptIds.length} selected production scripts will be packaged together and emailed to the configured agency inbox via SMTP.
              </p>

              <div className={`max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl border ${
                isDark ? 'bg-[#141419] border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                {scripts
                  .filter((s) => selectedScriptIds.includes(s.id))
                  .map((s, idx) => (
                    <div key={s.id} className={`flex items-center justify-between text-xs py-1 border-b last:border-b-0 ${
                      isDark ? 'border-gray-800' : 'border-gray-100'
                    }`}>
                      <div className={`font-semibold truncate max-w-[320px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {idx + 1}. {s.title}
                      </div>
                      <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.format}</span>
                    </div>
                  ))}
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Batch Agency Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bulkAgencyNotes}
                  onChange={(e) => setBulkAgencyNotes(e.target.value)}
                  placeholder="e.g. Prioritize script #1 for shoot tomorrow; keep all color palettes matching Q2 branding guidelines..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsBulkAgencyModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkAgency}
                  disabled={isBulkProcessing}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isBulkProcessing ? 'Dispatching Batch...' : `Send ${selectedScriptIds.length} Scripts via SMTP`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
