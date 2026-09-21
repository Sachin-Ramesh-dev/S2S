import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Film,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Compass,
  Lightbulb,
  ShieldCheck,
  Info
} from 'lucide-react';
import { TopicIdea, TopicFormat } from '../../types/instagram';
import { useTheme } from '../../context/ThemeContext';

interface TopicFormatSelectionModalProps {
  isOpen: boolean;
  topic: TopicIdea | null;
  onClose: () => void;
  onConfirm: (topicId: string, format: TopicFormat) => void;
  onClearToast?: () => void;
}

export const TopicFormatSelectionModal: React.FC<TopicFormatSelectionModalProps> = ({
  isOpen,
  topic,
  onClose,
  onConfirm,
  onClearToast
}) => {
  const { isDark } = useTheme();

  // Normalize initial format to one of the 3 primary branches (defaults to Reel if none or legacy)
  const getInitialFormat = (t: TopicIdea | null): TopicFormat => {
    if (!t) return 'Reel';
    if (t.format === 'Carousel') return 'Carousel';
    if (t.format === 'Image' || t.format === 'Static') return 'Image';
    return 'Reel';
  };

  const [selectedFormat, setSelectedFormat] = useState<TopicFormat>('Reel');

  useEffect(() => {
    if (isOpen) {
      onClearToast?.();
      if (topic) {
        setSelectedFormat(getInitialFormat(topic));
      }
    }
  }, [isOpen, topic, onClearToast]);

  if (!isOpen || !topic) return null;

  const FORMAT_OPTIONS: Array<{
    id: TopicFormat;
    title: string;
    icon: any;
    badge: string;
    stages: string;
    description: string;
    accentColor: string;
  }> = [
    {
      id: 'Reel',
      title: 'Reel / Video',
      icon: Film,
      badge: 'High Reach & Retention',
      stages: 'Script (0-60s) ➔ Storyboard ➔ Video ➔ Review',
      description: '4-Act viral retention timeline with hook velocity, visual cues, and audio pacing.',
      accentColor: 'orange'
    },
    {
      id: 'Carousel',
      title: 'Carousel',
      icon: Layers,
      badge: 'High Save & Share Rate',
      stages: 'Slide Copy (5 Slides) ➔ Mock Carousel ➔ Final Render ➔ Review',
      description: 'Structured multi-slide educational breakdown (Hook, 3 Value Points, CTA).',
      accentColor: 'purple'
    },
    {
      id: 'Image',
      title: 'Single Image',
      icon: ImageIcon,
      badge: 'High Impact & Clarity',
      stages: 'Concept & Copy ➔ Mock Image ➔ Final Render ➔ Review',
      description: 'Focused single-frame graphic, stat highlight, or bold quote with copy overlay.',
      accentColor: 'blue'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#14141e] border-[#2c2c3e] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EA580C]/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Topic Approval</span>
              </span>
              <span className="text-xs text-zinc-400">Step 2: Choose Content Format</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Select Content Production Format</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Topic Summary & Strategic Lineage Box */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#1b1b28] border-[#34344a]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
                <span>Approved Topic Idea</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                {topic.contentPillar || 'Strategic Pillar'}
              </span>
            </div>

            <h3 className="text-base font-bold tracking-tight mb-1">{topic.title}</h3>
            {topic.hook && (
              <p className={`text-xs italic mb-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Hook: "{topic.hook}"
              </p>
            )}

            {topic.auditRationale && (
              <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-2 text-[11px] text-zinc-400">
                <Compass className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span>Lineage Context: {topic.auditRationale}</span>
              </div>
            )}
          </div>

          {/* Format Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Choose Format Branch
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Format is changeable later</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {FORMAT_OPTIONS.map((opt) => {
                const isSelected = selectedFormat === opt.id;
                const IconComponent = opt.icon;

                return (
                  <div
                    key={opt.id}
                    id={`format-card-${opt.id.toLowerCase()}`}
                    onClick={() => setSelectedFormat(opt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1f1a26] border-orange-500 shadow-md ring-1 ring-orange-500'
                          : 'bg-orange-50/70 border-orange-400 shadow-sm ring-1 ring-orange-400'
                        : isDark
                        ? 'bg-[#161622] hover:bg-[#1a1a2a] border-[#29293c]'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-tight">{opt.title}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold'
                              : 'bg-zinc-800/60 text-zinc-400'
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />}
                      </div>

                      <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        {opt.description}
                      </p>

                      <div className="text-[11px] font-mono flex items-center gap-1.5 text-zinc-400">
                        <ArrowRight className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="truncate">{opt.stages}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-Destructive / Safe Asset Notice */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            isDark ? 'bg-[#12121c] border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-zinc-200">No assets are automatically generated. </span>
              Confirming creates an editable draft in Content Production. You can edit copy, generate mockups, or switch formats non-destructively at any point before final rendering.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Cancel
          </button>

          <button
            id="btn-confirm-topic-format"
            type="button"
            onClick={() => {
              onClearToast?.();
              onConfirm(topic.id, selectedFormat);
            }}
            className="px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Approve as {selectedFormat} &amp; Open Production</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
