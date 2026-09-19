import React, { useState } from 'react';
import { ContentSubView } from '../../types/navigation';
import { InstagramAccount, TopicIdea, ScriptItem, AISkillRecord } from '../../types/instagram';
import { InstagramTopicsView } from '../instagram/InstagramTopicsView';
import { InstagramScriptsView } from '../instagram/InstagramScriptsView';
import {
  FileText,
  ListFilter,
  Image as ImageIcon,
  Repeat,
  FolderOpen,
  Sparkles,
  Layers,
  Copy,
  Check,
  Download,
  Share2,
  Plus
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ContentWorkspaceProps {
  activeSubView: ContentSubView;
  onSubViewChange: (sub: ContentSubView) => void;
  account: InstagramAccount | null;
  topics: TopicIdea[];
  scripts: ScriptItem[];
  selectedScriptId?: string;
  onSelectScript: (id: string) => void;
  onGenerateTopics: (prompt: string, count: number) => void;
  isGeneratingTopics: boolean;
  onApproveTopicAndGenerateScript: (topic: TopicIdea) => void;
  onApproveAndScheduleScript: (script: ScriptItem) => void;
  onCreateScript: (topicId?: string) => void;
  skills: AISkillRecord[];
}

export const ContentWorkspace: React.FC<ContentWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  account,
  topics,
  scripts,
  selectedScriptId,
  onSelectScript,
  onGenerateTopics,
  isGeneratingTopics,
  onApproveTopicAndGenerateScript,
  onApproveAndScheduleScript,
  onCreateScript,
  skills
}) => {
  const { isDark } = useTheme();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const safeSkills = Array.isArray(skills) ? skills : (skills && (skills as any).skills ? (skills as any).skills : []);
  const activeSkill = safeSkills.find((s: any) => s.isActive) || safeSkills[0] || ({ version: 'v4', title: 'Default Strategy', guardrails: [] } as any);
  const selectedScript = scripts.find(s => s.id === selectedScriptId) || scripts[0] || null;

  const handleCopy = (format: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Content Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✍️</span>
          <span className="font-bold text-sm tracking-tight">Content Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30 overflow-x-auto">
          <button
            id="subnav-content-topics"
            type="button"
            onClick={() => onSubViewChange('topics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'topics'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Topics</span>
          </button>

          <button
            id="subnav-content-scripts"
            type="button"
            onClick={() => onSubViewChange('scripts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'scripts'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scripts (4-Act)</span>
          </button>

          <button
            id="subnav-content-creative"
            type="button"
            onClick={() => onSubViewChange('creative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'creative'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Creative</span>
          </button>

          <button
            id="subnav-content-repurpose"
            type="button"
            onClick={() => onSubViewChange('repurpose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'repurpose'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Repurpose</span>
          </button>

          <button
            id="subnav-content-media"
            type="button"
            onClick={() => onSubViewChange('media')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'media'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Media Library</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubView === 'topics' && (
          <InstagramTopicsView
            account={account || ({ id: 'default', username: 'account', displayName: 'Account', followersCount: 0 } as any)}
            topics={topics}
            activeSkill={activeSkill}
            onApproveTopic={() => {}}
            onRejectTopic={() => {}}
            onGenerateScript={onCreateScript}
            onGenerateTopics={onGenerateTopics}
            isGenerating={isGeneratingTopics}
            onApproveTopicAndGenerateScript={onApproveTopicAndGenerateScript}
          />
        )}

        {activeSubView === 'scripts' && (
          <InstagramScriptsView
            scripts={scripts}
            selectedScriptId={selectedScriptId}
            onSelectScript={onSelectScript}
            onCreateScript={onCreateScript}
            skills={safeSkills}
            onApproveAndSchedule={onApproveAndScheduleScript}
          />
        )}

        {activeSubView === 'creative' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Carousel &amp; Visual Storyboard Creator</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Convert your approved scripts into engaging Instagram multi-slide carousels and visual reel cards.
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render AI Slide Deck</span>
              </button>
            </div>

            {/* Slides Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { slide: 1, type: 'Hook Slide', text: selectedScript?.hookSentence || 'Stop paying EMI before checking this RBI loophole!' },
                { slide: 2, type: 'Agitation Slide', text: 'Banks charge up to 3.5% hidden penal interest on missed cycles.' },
                { slide: 3, type: 'Tactical Slide', text: 'Use RBI Section 45-L to restructure terms without CIBIL drops.' },
                { slide: 4, type: 'CTA Slide', text: 'Comment "LOAN" to get our automated loan calculator link in DM.' }
              ].map((s) => (
                <div
                  key={s.slide}
                  className={`aspect-square p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-[#181824] border-[#2c2c3e] shadow-md' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Slide {s.slide}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{s.type}</span>
                  </div>

                  <p className="text-xs font-bold leading-relaxed my-auto text-center px-2 text-white">
                    "{s.text}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
                    <span>1080 × 1080 px</span>
                    <span className="text-emerald-400 font-semibold">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'repurpose' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Cross-Platform Content Repurposing Engine</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Instantly repurpose the active script: <strong>"{selectedScript?.title || 'Selected Script'}"</strong> across multiple formats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Format 1: Twitter Thread */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161622] border-[#28283a]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-blue-400">X (Twitter) Thread</span>
                    <span className="text-[10px] text-zinc-500">5 Tweets</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    1/5 {selectedScript?.hookSentence || '90% of borrowers get this wrong.'} Here is the exact breakdown...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('twitter', selectedScript?.body || '')}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedFormat === 'twitter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat === 'twitter' ? 'Copied Thread!' : 'Copy Thread'}</span>
                </button>
              </div>

              {/* Format 2: LinkedIn Carousel Text */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161622] border-[#28283a]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-blue-600">LinkedIn Authority Post</span>
                    <span className="text-[10px] text-zinc-500">Long-form text</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    {selectedScript?.hookSentence} As financial institutions evolve, customer awareness is key...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('linkedin', selectedScript?.body || '')}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedFormat === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat === 'linkedin' ? 'Copied LinkedIn!' : 'Copy Post'}</span>
                </button>
              </div>

              {/* Format 3: Instagram Stories Hook */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#161622] border-[#28283a]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-pink-500">Instagram Stories</span>
                    <span className="text-[10px] text-zinc-500">Interactive Poll</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Quick poll sticker: "Did you know about this rule? [Yes / No]" leading to full reel link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('stories', selectedScript?.hookSentence || '')}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedFormat === 'stories' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat === 'stories' ? 'Copied Story Script!' : 'Copy Story'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'media' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Media &amp; Asset Vault</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Manage audio soundbites, b-roll snippets, brand lower-thirds, and visual hook templates.
                </p>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Media Asset</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Trending Tech Beat #4', type: 'Audio Track', duration: '0:45', tag: 'High Velocity' },
                { name: 'Stock Chart Red Drop', type: 'B-Roll Video', duration: '0:06', tag: 'Pattern Interrupt' },
                { name: 'RBI Building Exterior', type: 'B-Roll Video', duration: '0:08', tag: 'Authority' },
                { name: 'S2S Brand Lower Third', type: 'Graphic Overlay', duration: 'Overlay', tag: 'Branding' }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {m.type}
                  </span>
                  <h4 className="font-bold text-xs mt-3 mb-1 text-white truncate">{m.name}</h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                    <span>{m.duration}</span>
                    <span className="text-orange-400 font-semibold">{m.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
