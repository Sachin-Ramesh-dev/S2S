import React, { useState, useEffect } from 'react';
import { ContentSubView } from '../../types/navigation';
import {
  InstagramAccount,
  TopicIdea,
  ScriptItem,
  AISkillRecord,
  TopicFormat,
  CarouselSlide,
  ReelScene,
  ImageConceptData,
  ArchivedFormatData,
  ArchivedFormatsMap,
  ScheduleParams
} from '../../types/instagram';
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
  Film,
  Copy,
  Check,
  Download,
  Share2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Compass,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Edit3,
  Play,
  RotateCcw,
  Sliders,
  Info,
  ExternalLink,
  ShieldCheck,
  Eye,
  ArrowUp,
  ArrowDown,
  Video,
  Clock,
  Wand2,
  X,
  RefreshCw,
  AlertCircle,
  Camera,
  CheckSquare,
  Square
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  renderSocialCard,
  downloadDataUrl,
  downloadCarouselDeckZip,
  StylePreset,
  AspectRatio
} from '../../utils/socialCardRenderer';

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
  onApproveAndScheduleScript: (script: ScriptItem, scheduleParams?: ScheduleParams) => void;
  onCreateScript: (topicId?: string, format?: 'Reel' | 'Carousel') => void;
  onApproveTopic?: (topicId: string) => void;
  onApproveTopicWithFormat?: (topicId: string, format: TopicFormat) => void;
  onUpdateScript?: (scriptId: string, updates: Partial<ScriptItem>) => void;
  onRejectTopic?: (topicId: string, reason: string, category?: string) => Promise<void> | void;
  onMoveSelectedToScripts?: (topicIds: string[]) => Promise<void>;
  onTopicUpdated?: () => void;
  skills: AISkillRecord[];
  onClearToast?: () => void;
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
  onApproveTopic,
  onApproveTopicWithFormat,
  onUpdateScript,
  onRejectTopic,
  onMoveSelectedToScripts,
  onTopicUpdated,
  skills,
  onClearToast
}) => {
  const { isDark } = useTheme();

  // Find active script or default to first
  const selectedScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0] || null;

  // Normalize format to one of 3 primary branches
  const getNormalizedFormat = (fmt?: TopicFormat): 'Reel' | 'Carousel' | 'Image' => {
    if (fmt === 'Carousel') return 'Carousel';
    if (fmt === 'Image' || fmt === 'Static') return 'Image';
    return 'Reel'; // Reel, Story, Other
  };

  const currentBranch = getNormalizedFormat(selectedScript?.format);

  // Active stage within the current format branch
  const [reelStage, setReelStage] = useState<'script' | 'storyboard' | 'video' | 'review'>('script');
  const [carouselStage, setCarouselStage] = useState<'copy' | 'mock' | 'final' | 'review'>('copy');
  const [imageStage, setImageStage] = useState<'concept' | 'mock' | 'final' | 'review'>('concept');

  // Format Switcher Modal state
  const [isFormatSwitcherOpen, setIsFormatSwitcherOpen] = useState(false);
  const [formatSwitchNotification, setFormatSwitchNotification] = useState<string | null>(null);

  // Secondary Tools Modal (Repurpose & Media Vault)
  const [secondaryToolModal, setSecondaryToolModal] = useState<'repurpose' | 'media' | null>(null);

  // Reel-specific state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [editSceneData, setEditSceneData] = useState<ReelScene | null>(null);
  const [sceneDiffModal, setSceneDiffModal] = useState<{
    sceneIndex: number;
    title: string;
    original: ReelScene;
    proposed: ReelScene;
    diffNotes: string;
  } | null>(null);

  // Reel Video Preview state
  const [previewSceneIdx, setPreviewSceneIdx] = useState(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGeneratedSuccess, setVideoGeneratedSuccess] = useState(false);

  // Reel Review & Scheduling state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [scheduleDate, setScheduleDate] = useState(tomorrowStr);
  const [scheduleTime, setScheduleTime] = useState('18:30');
  const [hasConfirmedScheduleCheckbox, setHasConfirmedScheduleCheckbox] = useState(false);
  const [isSchedulingInProgress, setIsSchedulingInProgress] = useState(false);
  const [scheduleSuccessToast, setScheduleSuccessToast] = useState<string | null>(null);
  const [reviewCaption, setReviewCaption] = useState(selectedScript?.caption || '');
  const [reviewHashtags, setReviewHashtags] = useState(selectedScript?.hashtags?.join(' ') || '#reels #growth #contentos');

  useEffect(() => {
    if (selectedScript) {
      setReviewCaption(selectedScript.caption || '');
      setReviewHashtags(selectedScript.hashtags?.join(' ') || '#reels #growth #contentos');
    }
  }, [selectedScript?.id, selectedScript?.caption]);

  // Storyboard persistence helper
  const updateScriptScenes = (newScenes: ReelScene[]) => {
    if (!selectedScript || !onUpdateScript) return;
    const currentArchive: ArchivedFormatData = {
      format: 'Reel',
      savedAt: new Date().toISOString(),
      scenes: newScenes,
      timeline: newScenes,
      slides: selectedScript.slides,
      imageConcept: selectedScript.imageConcept,
      acts: selectedScript.acts,
      fullTextScript: selectedScript.fullTextScript,
      caption: selectedScript.caption,
      callToAction: selectedScript.callToAction
    };
    onUpdateScript(selectedScript.id, {
      scenes: newScenes,
      timeline: newScenes,
      archivedFormats: {
        ...(selectedScript.archivedFormats || {}),
        Reel: currentArchive
      }
    });
  };

  const handleGenerateStoryboardFromScript = () => {
    if (!selectedScript) return;
    const acts = selectedScript.acts || {
      act1_hook: selectedScript.hook || 'Stop scrolling: The Hidden Insight',
      act2_agitation: 'Most creators burn out trying to produce without strategic deficits.',
      act3_solution: 'Follow this exact 3-step blueprint to fix your distribution.',
      act4_cta: selectedScript.callToAction || "Comment 'BLUEPRINT' below and I will send you the full guide."
    };

    const newScenes: ReelScene[] = [
      {
        sceneNumber: 1,
        timeframe: '0:00 - 0:03',
        visualCue: 'Fast push-in on host with dramatic pattern-interrupt hand gesture',
        onScreenText: acts.act1_hook.slice(0, 35).toUpperCase(),
        spokenAudio: acts.act1_hook,
        cameraMovement: 'Fast Push-in',
        transition: 'Hard Cut',
        audioNote: 'Trending high-tempo audio bed'
      },
      {
        sceneNumber: 2,
        timeframe: '0:03 - 0:15',
        visualCue: 'Screen recording highlighting the common error / deficit in audit metrics',
        onScreenText: 'THE HIDDEN TRAP',
        spokenAudio: acts.act2_agitation,
        cameraMovement: 'Screen Pan & Zoom',
        transition: 'Whoosh Transition',
        audioNote: 'SFX: Whoosh interrupt'
      },
      {
        sceneNumber: 3,
        timeframe: '0:15 - 0:40',
        visualCue: 'Split screen showing the 3-step solution framework in action',
        onScreenText: 'THE 3-STEP FIX',
        spokenAudio: acts.act3_solution,
        cameraMovement: 'Static Eye-Level Authority',
        transition: 'Zoom Blur',
        audioNote: 'Upbeat rhythm build'
      },
      {
        sceneNumber: 4,
        timeframe: '0:40 - 0:55',
        visualCue: 'Direct eye contact to camera with bookmark/save gesture',
        onScreenText: 'SAVE THIS REEL',
        spokenAudio: acts.act4_cta,
        cameraMovement: 'Tracking Close-up',
        transition: 'Fade to Black',
        audioNote: 'Outro audio swell'
      }
    ];

    updateScriptScenes(newScenes);
  };

  const handleAddScene = () => {
    const currentScenes = selectedScript?.scenes || [];
    const newIdx = currentScenes.length + 1;
    const newScene: ReelScene = {
      sceneNumber: newIdx,
      timeframe: `0:${50 + (newIdx * 2)} - 0:${55 + (newIdx * 2)}`,
      visualCue: 'Host demonstrates tactical takeaway on device',
      onScreenText: `KEY POINT #${newIdx}`,
      spokenAudio: 'Make sure to bookmark this point before moving forward.',
      cameraMovement: 'Static Tripod',
      transition: 'Hard Cut',
      audioNote: 'Background synth bed'
    };
    updateScriptScenes([...currentScenes, newScene]);
  };

  const handleDeleteScene = (idx: number) => {
    const currentScenes = selectedScript?.scenes || [];
    const filtered = currentScenes.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    updateScriptScenes(filtered);
    if (previewSceneIdx >= filtered.length) {
      setPreviewSceneIdx(Math.max(0, filtered.length - 1));
    }
  };

  const handleDuplicateScene = (idx: number) => {
    const currentScenes = selectedScript?.scenes || [];
    const target = currentScenes[idx];
    if (!target) return;
    const clone: ReelScene = {
      ...target,
      onScreenText: `${target.onScreenText} (Copy)`
    };
    const updated = [...currentScenes.slice(0, idx + 1), clone, ...currentScenes.slice(idx + 1)].map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    updateScriptScenes(updated);
  };

  const handleMoveScene = (idx: number, direction: 'up' | 'down') => {
    const currentScenes = [...(selectedScript?.scenes || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentScenes.length) return;
    const temp = currentScenes[idx];
    currentScenes[idx] = currentScenes[targetIdx];
    currentScenes[targetIdx] = temp;
    const renumbered = currentScenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    updateScriptScenes(renumbered);
  };

  const handleStartEditScene = (idx: number) => {
    const currentScenes = selectedScript?.scenes || [];
    if (currentScenes[idx]) {
      setEditingSceneIdx(idx);
      setEditSceneData({ ...currentScenes[idx] });
    }
  };

  const handleSaveSceneEdit = () => {
    if (editingSceneIdx === null || !editSceneData) return;
    const currentScenes = [...(selectedScript?.scenes || [])];
    currentScenes[editingSceneIdx] = editSceneData;
    updateScriptScenes(currentScenes);
    setEditingSceneIdx(null);
    setEditSceneData(null);
  };

  const handleAiImproveScene = (idx: number) => {
    const currentScenes = selectedScript?.scenes || [];
    const scene = currentScenes[idx];
    if (!scene) return;
    const proposed: ReelScene = {
      ...scene,
      visualCue: `${scene.visualCue} [High-contrast dynamic lighting with fast text pop-in]`,
      onScreenText: scene.onScreenText.toUpperCase(),
      spokenAudio: `Listen closely: ${scene.spokenAudio}`,
      cameraMovement: scene.cameraMovement || 'Fast Push-in',
      transition: 'Whoosh Transition'
    };
    setSceneDiffModal({
      sceneIndex: idx,
      title: `AI Improve Scene ${idx + 1}`,
      original: scene,
      proposed,
      diffNotes: 'Sharpened visual pacing and elevated spoken audio hook.'
    });
  };

  const handleRegenerateScene = (idx: number) => {
    const currentScenes = selectedScript?.scenes || [];
    const scene = currentScenes[idx];
    if (!scene) return;
    const proposed: ReelScene = {
      ...scene,
      visualCue: 'Split screen B-roll demonstration with kinetic typography accent',
      onScreenText: 'PROVEN FRAMEWORK',
      spokenAudio: 'This exact formula increased reach by 3.4x across 40 accounts.',
      cameraMovement: 'Smooth Gimbal Pan',
      transition: 'Zoom Blur'
    };
    setSceneDiffModal({
      sceneIndex: idx,
      title: `Regenerate Scene ${idx + 1}`,
      original: scene,
      proposed,
      diffNotes: 'Generated alternative camera movement, kinetic typography, and proof-point dialogue.'
    });
  };

  const handleAcceptSceneDiff = () => {
    if (!sceneDiffModal) return;
    const currentScenes = [...(selectedScript?.scenes || [])];
    currentScenes[sceneDiffModal.sceneIndex] = sceneDiffModal.proposed;
    updateScriptScenes(currentScenes);
    setSceneDiffModal(null);
  };

  // Video generation handler (mock only, no expensive external APIs)
  const handleGenerateVideo = () => {
    setIsGeneratingVideo(true);
    setTimeout(() => {
      setIsGeneratingVideo(false);
      setVideoGeneratedSuccess(true);
      setTimeout(() => setVideoGeneratedSuccess(false), 4000);
    }, 1200);
  };

  // Explicit scheduling confirmation
  const handleConfirmSchedule = async () => {
    if (!selectedScript || !onApproveAndScheduleScript) return;
    if (!hasConfirmedScheduleCheckbox) return;

    setIsScheduleModalOpen(false);
    setIsSchedulingInProgress(true);
    try {
      await onApproveAndScheduleScript(selectedScript, {
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime,
        timezone: 'Asia/Kolkata',
        caption: selectedScript.caption,
        hashtags: selectedScript.hashtags,
        callToAction: selectedScript.callToAction,
        reelScenes: selectedScript.scenes,
        aspectRatio: '9:16'
      });
      setScheduleSuccessToast(`Reel scheduled successfully for ${scheduleDate} at ${scheduleTime}!`);
      setTimeout(() => setScheduleSuccessToast(null), 4000);
    } catch (err: any) {
      alert(`Scheduling failed: ${err.message}`);
    } finally {
      setIsSchedulingInProgress(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CAROUSEL & IMAGE HELPERS & STATE
  // ---------------------------------------------------------------------------
  const getDefaultCarouselSlides = (script?: ScriptItem): CarouselSlide[] => [
    {
      slideNumber: 1,
      slideType: 'hook',
      visualLayout: 'Bold Hook',
      headline: script?.hook || script?.title || 'Stop scrolling: The Hidden Insight',
      bodyText: 'Here is what many creators miss about this strategy.',
      swipeTrigger: 'Swipe to see the breakdown 👉',
      score: 90
    },
    {
      slideNumber: 2,
      slideType: 'content',
      visualLayout: 'Agitation Card',
      headline: 'The Hidden Trap',
      bodyText: 'Most accounts burn out trying to produce without strategic deficits.',
      swipeTrigger: 'Next: The solution ➔',
      score: 88
    },
    {
      slideNumber: 3,
      slideType: 'content',
      visualLayout: '3-Step Blueprint',
      headline: 'The 3-Step Fix',
      bodyText: '1. Identify deficit\n2. Select format\n3. Rapid modular copy',
      swipeTrigger: 'Keep swiping 👉',
      score: 92
    },
    {
      slideNumber: 4,
      slideType: 'content',
      visualLayout: 'Rule Highlight',
      headline: 'Key Principle',
      bodyText: 'Format dictates retention: 0-60s for video, 5-10 slides for carousels.',
      swipeTrigger: 'Final slide ➔',
      score: 87
    },
    {
      slideNumber: 5,
      slideType: 'cta',
      visualLayout: 'Action Card',
      headline: 'Ready to Scale?',
      bodyText: 'Save this carousel for reference & share with your team.',
      swipeTrigger: 'Save & Share 📌',
      score: 95
    }
  ];

  const getDefaultImageConcept = (script?: ScriptItem): ImageConceptData => ({
    headline: script?.hook || script?.title || 'Scale Your Organic Distribution',
    textOverlay: script?.hook || script?.title || 'Scale Your Organic Distribution',
    visualPrompt: `Minimalist modern graphic poster for: ${script?.title || 'Financial Growth'}. Clean typography, high contrast, brand accent orange, structured layout.`,
    aspectRatio: '1:1',
    score: 91,
    mockImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&fit=crop&q=80',
    finalImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&fit=crop&q=80',
    stylePreset: 'Modern Minimalist',
    lighting: 'Studio Softbox',
    colorPalette: 'Deep Slate & Amber Accent'
  });

  // Carousel-specific state
  const [isGeneratingMockCarousel, setIsGeneratingMockCarousel] = useState(false);
  const [isRenderingFinalDeck, setIsRenderingFinalDeck] = useState(false);
  const [deckRenderSuccess, setDeckRenderSuccess] = useState(false);
  const [carouselPreviewIdx, setCarouselPreviewIdx] = useState(0);
  const [isCarouselGridMode, setIsCarouselGridMode] = useState(false);
  const [slideDiffModal, setSlideDiffModal] = useState<{
    slideIndex: number;
    title: string;
    original: CarouselSlide;
    proposed: CarouselSlide;
    diffNotes?: string;
  } | null>(null);
  const [fullCarouselDiffModal, setFullCarouselDiffModal] = useState<{
    title: string;
    originalSlides: CarouselSlide[];
    proposedSlides: CarouselSlide[];
    diffNotes?: string;
  } | null>(null);
  const [isScheduleCarouselModalOpen, setIsScheduleCarouselModalOpen] = useState(false);
  const [hasConfirmedCarouselSchedule, setHasConfirmedCarouselSchedule] = useState(false);
  const [carouselScheduleDate, setCarouselScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [carouselScheduleTime, setCarouselScheduleTime] = useState('18:30');
  const [carouselReviewCaption, setCarouselReviewCaption] = useState(
    selectedScript?.caption || 'Swipe through this complete blueprint to optimize your content retention and save rates.'
  );
  const [carouselReviewHashtags, setCarouselReviewHashtags] = useState(
    (selectedScript?.hashtags || ['#carousel', '#contentstrategy', '#creatorgrowth']).join(' ')
  );
  const [carouselCoverIndex, setCarouselCoverIndex] = useState(0);
  const [carouselSuccessToast, setCarouselSuccessToast] = useState<string | null>(null);

  // Image-specific state
  const [isGeneratingMockImage, setIsGeneratingMockImage] = useState(false);
  const [isRenderingFinalImage, setIsRenderingFinalImage] = useState(false);
  const [imageRenderSuccess, setImageRenderSuccess] = useState(false);
  const [imageDiffModal, setImageDiffModal] = useState<{
    title: string;
    original: ImageConceptData;
    proposed: ImageConceptData;
    diffNotes?: string;
  } | null>(null);
  const [isScheduleImageModalOpen, setIsScheduleImageModalOpen] = useState(false);
  const [hasConfirmedImageSchedule, setHasConfirmedImageSchedule] = useState(false);
  const [imageScheduleDate, setImageScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [imageScheduleTime, setImageScheduleTime] = useState('18:30');
  const [imageReviewCaption, setImageReviewCaption] = useState(
    selectedScript?.caption || 'Visual breakdown of the core strategic rule. Save this post for your next content sprint.'
  );
  const [imageReviewHashtags, setImageReviewHashtags] = useState(
    (selectedScript?.hashtags || ['#design', '#visualcontent', '#branding', '#s2s']).join(' ')
  );

  useEffect(() => {
    // Auto-clear stale approval toast after 2.5s so it does not linger in production
    const timer = setTimeout(() => {
      onClearToast?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const [imageSuccessToast, setImageSuccessToast] = useState<string | null>(null);

  // High-Resolution Social Card Rendering State
  const [renderedDeckBlobs, setRenderedDeckBlobs] = useState<
    Array<{ slideNumber: number; dataUrl: string; blob: Blob; headline: string }>
  >([]);
  const [carouselActiveRenderStyle, setCarouselActiveRenderStyle] =
    useState<StylePreset>('Editorial Swiss Graphic');
  const [deckActivePreviewIdx, setDeckActivePreviewIdx] = useState(0);
  const [deckViewMode, setDeckViewMode] = useState<'single' | 'grid'>('single');
  const [carouselVaultToast, setCarouselVaultToast] = useState<string | null>(null);

  const [renderedImageData, setRenderedImageData] = useState<{
    dataUrl: string;
    blob: Blob;
  } | null>(null);
  const [imageActiveRenderStyle, setImageActiveRenderStyle] =
    useState<StylePreset>('Editorial Swiss Graphic');
  const [imageVaultToast, setImageVaultToast] = useState<string | null>(null);

  // Repurpose tool state
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const safeSkills = Array.isArray(skills) ? skills : (skills && (skills as any).skills ? (skills as any).skills : []);
  const activeSkill = safeSkills.find((s: any) => s.isActive) || safeSkills[0] || ({ version: 'v4', title: 'Default Strategy', guardrails: [] } as any);

  // Sync stage if script has productionStage
  useEffect(() => {
    if (selectedScript?.productionStage) {
      const st = selectedScript.productionStage;
      if (currentBranch === 'Reel') {
        if (st === 'storyboard' || st === 'script' || st === 'review' || st === 'video') {
          setReelStage(st as any);
        } else {
          setReelStage('script');
        }
      } else if (currentBranch === 'Carousel') {
        if (st === 'copy' || st === 'mock' || st === 'final' || st === 'review') {
          setCarouselStage(st as any);
        } else {
          setCarouselStage('copy');
        }
      } else if (currentBranch === 'Image') {
        if (st === 'concept' || st === 'mock' || st === 'final' || st === 'review') {
          setImageStage(st as any);
        } else {
          setImageStage('concept');
        }
      }
    } else {
      setReelStage('script');
      setCarouselStage('copy');
      setImageStage('concept');
    }
  }, [selectedScript?.id, selectedScript?.productionStage, currentBranch]);

  // Carousel Handlers
  const handleUpdateSlide = (idx: number, updates: Partial<CarouselSlide>) => {
    if (!selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    if (currentSlides[idx]) {
      currentSlides[idx] = { ...currentSlides[idx], ...updates };
      onUpdateScript(selectedScript.id, { slides: currentSlides });
    }
  };

  const handleAddSlide = () => {
    if (!selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    const newSlide: CarouselSlide = {
      slideNumber: currentSlides.length + 1,
      slideType: 'content',
      visualLayout: 'Value Highlight',
      headline: `Key Insight #${currentSlides.length}`,
      bodyText: 'Deliver actionable insight, checklist point, or breakdown.',
      swipeTrigger: 'Next insight ➔',
      score: 89
    };
    if (currentSlides.length > 0 && currentSlides[currentSlides.length - 1].slideType === 'cta') {
      currentSlides.splice(currentSlides.length - 1, 0, newSlide);
    } else {
      currentSlides.push(newSlide);
    }
    const reindexed = currentSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateScript(selectedScript.id, { slides: reindexed });
  };

  const handleDuplicateSlide = (idx: number) => {
    if (!selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    const target = currentSlides[idx];
    if (!target) return;
    const duplicate: CarouselSlide = {
      ...target,
      headline: `${target.headline} (Copy)`
    };
    currentSlides.splice(idx + 1, 0, duplicate);
    const reindexed = currentSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateScript(selectedScript.id, { slides: reindexed });
  };

  const handleDeleteSlide = (idx: number) => {
    if (!selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    if (currentSlides.length <= 2) {
      alert('A carousel must contain at least 2 slides.');
      return;
    }
    currentSlides.splice(idx, 1);
    const reindexed = currentSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateScript(selectedScript.id, { slides: reindexed });
  };

  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    if (!selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentSlides.length) return;
    const temp = currentSlides[idx];
    currentSlides[idx] = currentSlides[targetIdx];
    currentSlides[targetIdx] = temp;
    const reindexed = currentSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onUpdateScript(selectedScript.id, { slides: reindexed });
  };

  const handleAiImproveSlide = (idx: number) => {
    const currentSlides = selectedScript?.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript);
    const s = currentSlides[idx];
    if (!s) return;
    const improvedHeadline = s.slideType === 'hook'
      ? `Stop Scrolling: ${s.headline.replace(/^(Stop scrolling:\s*)/i, '')}`
      : s.slideType === 'cta'
      ? `Save This Carousel: Ready To Implement ${selectedScript?.title || 'This Strategy'}?`
      : `Step ${idx}: ${s.headline}`;
    const improvedBody = `${s.bodyText.trim()} Specifically designed to eliminate friction and maximize conversion rates.`;
    const improvedTrigger = s.slideType === 'cta' ? 'Save & Share Now 📌' : 'Swipe to continue 👉';
    setSlideDiffModal({
      slideIndex: idx,
      title: `AI Polish: Slide ${idx + 1} (${s.slideType.toUpperCase()})`,
      original: s,
      proposed: {
        ...s,
        headline: improvedHeadline,
        bodyText: improvedBody,
        swipeTrigger: improvedTrigger,
        score: Math.min(98, (s.score || 88) + 7)
      },
      diffNotes: 'Enhanced clarity, stronger pattern interrupt, and optimized swipe motivation.'
    });
  };

  const handleRegenerateSlide = (idx: number) => {
    const currentSlides = selectedScript?.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript);
    const s = currentSlides[idx];
    if (!s) return;
    const regenHeadline = s.slideType === 'hook'
      ? `The #1 Mistake Creators Make with ${selectedScript?.title || 'This Strategy'}`
      : s.slideType === 'cta'
      ? `Which step will you implement first? Comment below & bookmark.`
      : `Core Principle: Why ${s.headline} Matters More Than You Think`;
    const regenBody = `Breakdown: Focus exclusively on high-leverage execution rather than vanity metrics.`;
    setSlideDiffModal({
      slideIndex: idx,
      title: `Regenerate Slide ${idx + 1}`,
      original: s,
      proposed: {
        ...s,
        headline: regenHeadline,
        bodyText: regenBody,
        swipeTrigger: s.slideType === 'cta' ? 'Bookmark for later 🔖' : 'Next slide 👉',
        score: Math.min(97, (s.score || 88) + 6)
      },
      diffNotes: 'Regenerated fresh angle with high-retention phrasing.'
    });
  };

  const handleAcceptSlideDiff = () => {
    if (!slideDiffModal || !selectedScript || !onUpdateScript) return;
    const currentSlides = [...(selectedScript.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript))];
    currentSlides[slideDiffModal.slideIndex] = slideDiffModal.proposed;
    onUpdateScript(selectedScript.id, { slides: currentSlides });
    setSlideDiffModal(null);
  };

  const handleAiImproveFullCarousel = () => {
    const currentSlides = selectedScript?.slides && selectedScript.slides.length > 0 ? selectedScript.slides : getDefaultCarouselSlides(selectedScript);
    const proposed = currentSlides.map((s, i) => ({
      ...s,
      headline: i === 0
        ? `Stop Scrolling: ${selectedScript?.title || 'The Strategic Insight'}`
        : i === currentSlides.length - 1
        ? `Ready to Implement? Save & Share This Deck`
        : `Part ${i}: ${s.headline.replace(/^(Part \d+:\s*)/i, '')}`,
      bodyText: `${s.bodyText.trim()} Designed for clear execution and practical results.`,
      swipeTrigger: i === currentSlides.length - 1 ? 'Save & Share 📌' : `Swipe to Part ${i + 1} 👉`,
      score: Math.min(99, (s.score || 88) + 8)
    }));
    setFullCarouselDiffModal({
      title: `AI Narrative Polish: Full ${currentSlides.length}-Slide Carousel Deck`,
      originalSlides: currentSlides,
      proposedSlides: proposed,
      diffNotes: 'Cohesive narrative arc established from Hook to Value points to CTA, with synchronized swipe motivators.'
    });
  };

  const handleAcceptFullCarouselDiff = () => {
    if (!fullCarouselDiffModal || !selectedScript || !onUpdateScript) return;
    onUpdateScript(selectedScript.id, { slides: fullCarouselDiffModal.proposedSlides });
    setFullCarouselDiffModal(null);
  };

  const handleGenerateMockCarousel = () => {
    setIsGeneratingMockCarousel(true);
    setTimeout(() => {
      setIsGeneratingMockCarousel(false);
      setCarouselStage('mock');
    }, 1000);
  };

  const handleRenderFinalDeck = async (overrideStyle?: StylePreset) => {
    setIsRenderingFinalDeck(true);
    const styleToUse = overrideStyle || carouselActiveRenderStyle;
    try {
      const currentSlides = selectedScript?.slides && selectedScript.slides.length > 0
        ? selectedScript.slides
        : getDefaultCarouselSlides(selectedScript);

      const deckResults: Array<{ slideNumber: number; dataUrl: string; blob: Blob; headline: string }> = [];

      for (let i = 0; i < currentSlides.length; i++) {
        const s = currentSlides[i];
        const res = await renderSocialCard({
          headline: s.headline || `Slide ${i + 1}`,
          bodyText: s.bodyText || '',
          tag: s.slideType || 'SLIDE',
          authorHandle: account?.username ? `@${account.username}` : '@s2s.studio',
          aspectRatio: '1:1',
          stylePreset: styleToUse,
          slideNumber: s.slideNumber || i + 1,
          totalSlides: currentSlides.length,
          swipeTrigger: s.swipeTrigger,
          watermarkText: account?.displayName || 'S2S STUDIO'
        });
        deckResults.push({
          slideNumber: s.slideNumber || i + 1,
          dataUrl: res.dataUrl,
          blob: res.blob,
          headline: s.headline || `Slide ${i + 1}`
        });
      }

      setRenderedDeckBlobs(deckResults);

      if (selectedScript && onUpdateScript) {
        const updatedSlides = currentSlides.map((s, idx) => ({
          ...s,
          finalImageUrl: deckResults[idx]?.dataUrl || s.finalImageUrl
        }));
        onUpdateScript(selectedScript.id, { slides: updatedSlides });
      }

      setDeckRenderSuccess(true);
      setCarouselStage('final');
      setTimeout(() => setDeckRenderSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to render final deck:', err);
    } finally {
      setIsRenderingFinalDeck(false);
    }
  };

  const handleConfirmScheduleCarousel = async () => {
    console.log('DEBUG: handleConfirmScheduleCarousel entered. selectedScript:', !!selectedScript, 'onApproveAndScheduleScript:', !!onApproveAndScheduleScript, 'hasConfirmedCarouselSchedule:', hasConfirmedCarouselSchedule);
    if (!selectedScript || !onApproveAndScheduleScript) return;
    if (!hasConfirmedCarouselSchedule) return;

    setIsScheduleCarouselModalOpen(false);
    try {
      const currentSlides = selectedScript.slides && selectedScript.slides.length > 0
        ? selectedScript.slides
        : getDefaultCarouselSlides(selectedScript);

      await onApproveAndScheduleScript(selectedScript, {
        scheduledDate: carouselScheduleDate,
        scheduledTime: carouselScheduleTime,
        timezone: 'Asia/Kolkata',
        caption: selectedScript.caption,
        hashtags: selectedScript.hashtags,
        callToAction: selectedScript.callToAction,
        carouselSlides: currentSlides,
        slideCount: currentSlides.length,
        coverSlideIndex: carouselCoverIndex,
        coverImageUrl: currentSlides[carouselCoverIndex]?.finalImageUrl || currentSlides[carouselCoverIndex]?.mockImageUrl,
        mediaUrls: currentSlides.map(s => s.finalImageUrl || s.mockImageUrl || ''),
        aspectRatio: '1:1'
      });
      setCarouselSuccessToast(`Carousel scheduled successfully for ${carouselScheduleDate} at ${carouselScheduleTime}!`);
      setTimeout(() => setCarouselSuccessToast(null), 4000);
    } catch (err: any) {
      alert(`Scheduling failed: ${err.message}`);
    }
  };

  // Image Handlers
  const handleUpdateImageConcept = (updates: Partial<ImageConceptData>) => {
    if (!selectedScript || !onUpdateScript) return;
    const current = selectedScript.imageConcept || getDefaultImageConcept(selectedScript);
    const updated = { ...current, ...updates };
    onUpdateScript(selectedScript.id, { imageConcept: updated });
  };

  const handleAiImproveImageConcept = () => {
    const current = selectedScript?.imageConcept || getDefaultImageConcept(selectedScript);
    const improvedHeadline = `The Unspoken Rule of ${selectedScript?.title || 'High Growth'}`;
    const improvedPrompt = `Award-winning editorial graphic design for: ${selectedScript?.title || 'Strategy'}. Minimalist Swiss typography, brutalist geometric grid, ultra high-contrast dark theme, vibrant fluorescent orange accent, clean negative space, 8k resolution.`;
    setImageDiffModal({
      title: 'AI Polish: Image Concept & Visual Prompt',
      original: current,
      proposed: {
        ...current,
        headline: improvedHeadline,
        textOverlay: improvedHeadline,
        visualPrompt: improvedPrompt,
        stylePreset: 'Swiss Minimalist Brutalism',
        lighting: 'High-Contrast Edge Rim Lighting',
        colorPalette: 'Obsidian Black & Electric Neon Orange',
        score: Math.min(99, (current.score || 88) + 8)
      },
      diffNotes: 'Enhanced typographic punch, professional studio lighting directives, and high-contrast color scheme.'
    });
  };

  const handleRegenerateImageConcept = () => {
    const current = selectedScript?.imageConcept || getDefaultImageConcept(selectedScript);
    const regenHeadline = `Stop Doing ${selectedScript?.title || 'This Common Mistake'}`;
    const regenPrompt = `Hyper-modern corporate graphic poster: bold 3D typography floating above sleek matte metallic platform, monochrome background with sharp golden-amber spotlight.`;
    setImageDiffModal({
      title: 'Regenerate Image Concept',
      original: current,
      proposed: {
        ...current,
        headline: regenHeadline,
        textOverlay: regenHeadline,
        visualPrompt: regenPrompt,
        stylePreset: '3D Typography Floating Matte',
        lighting: 'Volumetric Golden Spotlight',
        colorPalette: 'Charcoal & Amber Glow',
        score: Math.min(97, (current.score || 88) + 6)
      },
      diffNotes: 'Generated alternative 3D typography visual direction with high-authority presence.'
    });
  };

  const handleAcceptImageDiff = () => {
    if (!imageDiffModal || !selectedScript || !onUpdateScript) return;
    onUpdateScript(selectedScript.id, { imageConcept: imageDiffModal.proposed });
    setImageDiffModal(null);
  };

  const handleGenerateMockImage = () => {
    setIsGeneratingMockImage(true);
    setTimeout(() => {
      setIsGeneratingMockImage(false);
      setImageStage('mock');
    }, 1000);
  };

  const handleRenderFinalImage = async (overrideStyle?: StylePreset) => {
    setIsRenderingFinalImage(true);
    const styleToUse = overrideStyle || imageActiveRenderStyle;
    try {
      const currentImage = selectedScript?.imageConcept || getDefaultImageConcept(selectedScript);
      const aspect = (currentImage.aspectRatio as AspectRatio) || '1:1';

      const res = await renderSocialCard({
        headline: currentImage.headline || selectedScript?.hook || selectedScript?.title || 'High Impact Strategy',
        bodyText: currentImage.textOverlay || selectedScript?.title || '',
        tag: selectedScript?.contentPillar || 'STRATEGY',
        authorHandle: account?.username ? `@${account.username}` : '@s2s.studio',
        aspectRatio: aspect,
        stylePreset: styleToUse,
        watermarkText: account?.displayName || 'S2S STUDIO'
      });

      setRenderedImageData(res);

      if (selectedScript && onUpdateScript) {
        const updatedConcept = {
          ...currentImage,
          finalImageUrl: res.dataUrl,
          stylePreset: styleToUse
        };
        onUpdateScript(selectedScript.id, { imageConcept: updatedConcept });
      }

      setImageRenderSuccess(true);
      setImageStage('final');
      setTimeout(() => setImageRenderSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to render final image:', err);
    } finally {
      setIsRenderingFinalImage(false);
    }
  };

  useEffect(() => {
    if (carouselStage === 'final' && renderedDeckBlobs.length === 0 && !isRenderingFinalDeck) {
      handleRenderFinalDeck();
    }
  }, [carouselStage, selectedScript?.id]);

  useEffect(() => {
    if (imageStage === 'final' && !renderedImageData && !isRenderingFinalImage) {
      handleRenderFinalImage();
    }
  }, [imageStage, selectedScript?.id]);

  const handleConfirmScheduleImage = async () => {
    if (!selectedScript || !onApproveAndScheduleScript) return;
    if (!hasConfirmedImageSchedule) return;

    setIsScheduleImageModalOpen(false);
    try {
      const currentImage = selectedScript.imageConcept || getDefaultImageConcept(selectedScript);

      await onApproveAndScheduleScript(selectedScript, {
        scheduledDate: imageScheduleDate,
        scheduledTime: imageScheduleTime,
        timezone: 'Asia/Kolkata',
        caption: selectedScript.caption,
        hashtags: selectedScript.hashtags,
        callToAction: selectedScript.callToAction,
        imageConcept: currentImage,
        aspectRatio: currentImage.aspectRatio || '1:1',
        mediaUrls: [currentImage.finalImageUrl || currentImage.mockImageUrl || ''],
        coverImageUrl: currentImage.finalImageUrl || currentImage.mockImageUrl
      });
      setImageSuccessToast(`Image scheduled successfully for ${imageScheduleDate} at ${imageScheduleTime}!`);
      setTimeout(() => setImageSuccessToast(null), 4000);
    } catch (err: any) {
      alert(`Scheduling failed: ${err.message}`);
    }
  };

  // Non-destructive Format Switching Handler
  const handleSwitchFormat = (targetFormat: TopicFormat) => {
    if (!selectedScript || !onUpdateScript) return;
    const oldFormat = selectedScript.format;
    if (oldFormat === targetFormat) {
      setIsFormatSwitcherOpen(false);
      return;
    }

    // 1. Archive current format data in typed structure
    const currentArchive: ArchivedFormatData = {
      format: oldFormat,
      savedAt: new Date().toISOString(),
      stage: oldFormat === 'Reel' ? reelStage : oldFormat === 'Carousel' ? carouselStage : imageStage,
      acts: selectedScript.acts,
      scenes: selectedScript.scenes,
      timeline: selectedScript.timeline,
      slides: selectedScript.slides,
      imageConcept: selectedScript.imageConcept,
      fullTextScript: selectedScript.fullTextScript,
      caption: selectedScript.caption,
      hashtags: selectedScript.hashtags,
      callToAction: selectedScript.callToAction
    };

    const updatedArchives: ArchivedFormatsMap = {
      ...(selectedScript.archivedFormats || {}),
      [oldFormat]: currentArchive
    };

    // 2. Check if target format has existing archived work
    const existingArchive = updatedArchives[targetFormat];

    let newScenes = selectedScript.scenes;
    let newSlides = selectedScript.slides;
    let newImageConcept = selectedScript.imageConcept;

    if (existingArchive) {
      // Restore from archive
      if (existingArchive.scenes) newScenes = existingArchive.scenes;
      if (existingArchive.slides) newSlides = existingArchive.slides;
      if (existingArchive.imageConcept) newImageConcept = existingArchive.imageConcept;
      if (existingArchive.stage) {
        if (targetFormat === 'Reel') setReelStage(existingArchive.stage as any);
        else if (targetFormat === 'Carousel') setCarouselStage(existingArchive.stage as any);
        else if (targetFormat === 'Image' || targetFormat === 'Static') setImageStage(existingArchive.stage as any);
      }
    } else {
      // Initialize clean default for new format if none exists
      if (targetFormat === 'Carousel' && (!newSlides || newSlides.length === 0)) {
        newSlides = getDefaultCarouselSlides(selectedScript);
      } else if ((targetFormat === 'Image' || targetFormat === 'Static') && !newImageConcept) {
        newImageConcept = getDefaultImageConcept(selectedScript);
      }
    }

    onUpdateScript(selectedScript.id, {
      format: targetFormat,
      archivedFormats: updatedArchives,
      scenes: newScenes,
      slides: newSlides,
      imageConcept: newImageConcept,
      productionStage: targetFormat === 'Reel' ? reelStage : targetFormat === 'Carousel' ? carouselStage : imageStage
    });

    setIsFormatSwitcherOpen(false);
    setFormatSwitchNotification(`Switched to ${targetFormat}. Previous ${oldFormat} work is preserved.`);
    setTimeout(() => setFormatSwitchNotification(null), 4000);
  };

  const handleCopy = (format: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // If subview is 'topics', render InstagramTopicsView directly
  if (activeSubView === 'topics') {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <InstagramTopicsView
          account={account || ({ id: 'default', username: 'account', displayName: 'Account', followersCount: 0 } as any)}
          topics={topics}
          activeSkill={activeSkill}
          onApproveTopic={onApproveTopic || (() => {})}
          onApproveTopicWithFormat={onApproveTopicWithFormat}
          onClearToast={onClearToast}
          onRejectTopic={onRejectTopic || (() => {})}
          onGenerateScript={onCreateScript}
          onGenerateTopics={onGenerateTopics}
          isGenerating={isGeneratingTopics}
          onApproveTopicAndGenerateScript={onApproveTopicAndGenerateScript}
          onMoveSelectedToScripts={onMoveSelectedToScripts}
          onTopicUpdated={onTopicUpdated}
        />
      </div>
    );
  }

  // Otherwise, render ONE UNIFIED CONTENT PRODUCTION WORKSPACE
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* 1. TOP STRATEGIC LINEAGE BAR (Always visible) */}
      <div
        className="px-6 py-3 border-b-2 border-[#171717] dark:border-[#383844] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shrink-0 select-none bg-[#F8F5EE] dark:bg-[#131316] transition-colors"
      >
        {/* Left: Strategic Lineage Hierarchy */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="neo-badge neo-badge-lavender text-[10px] flex items-center gap-1 font-black">
            <Compass className="w-3.5 h-3.5" />
            <span>LINEAGE</span>
          </span>

          <span className="font-mono font-bold text-xs text-[#111111] dark:text-[#E4E4E7]">
            AUDIT: <span className="underline decoration-[#FFD66B] font-black">{selectedScript?.contentPillar || 'Core Content Gap'}</span>
          </span>

          <span className="font-black text-sm text-[#111111] dark:text-[#F5F3EC]">→</span>

          <span className="font-mono font-bold text-xs truncate max-w-[200px] text-[#111111] dark:text-[#E4E4E7]" title={selectedScript?.topicTitle || selectedScript?.title}>
            TOPIC: <span className="underline decoration-[#45D9A6] font-black">"{selectedScript?.topicTitle || selectedScript?.title || 'Untitled'}"</span>
          </span>

          <span className="font-black text-sm text-[#111111] dark:text-[#F5F3EC]">→</span>

          {/* Active Format Badge with Change Dropdown */}
          <div className="relative inline-block">
            <button
              id="btn-format-switcher"
              type="button"
              onClick={() => setIsFormatSwitcherOpen(!isFormatSwitcherOpen)}
              className="neo-btn neo-btn-sky py-1 px-2.5 text-xs font-black flex items-center gap-1.5"
            >
              {currentBranch === 'Reel' && <Film className="w-3.5 h-3.5" />}
              {currentBranch === 'Carousel' && <Layers className="w-3.5 h-3.5" />}
              {currentBranch === 'Image' && <ImageIcon className="w-3.5 h-3.5" />}
              <span>FORMAT: {selectedScript?.format || 'Reel'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Non-Destructive Format Switcher Dropdown */}
            {isFormatSwitcherOpen && (
              <div
                className="absolute left-0 mt-2 w-72 neo-card p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-2 border-b-2 border-[#171717] dark:border-[#383844] mb-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#111111] dark:text-white">
                    Switch Production Format
                  </div>
                  <div className="text-[10px] text-[#4B5563] dark:text-[#A1A1AA]">
                    Non-destructive: Previous work is preserved in typed archive.
                  </div>
                </div>

                {(['Reel', 'Carousel', 'Image'] as TopicFormat[]).map((fmt) => {
                  const isCurrent = (selectedScript?.format || 'Reel') === fmt;
                  return (
                    <button
                      key={fmt}
                      id={`switch-to-format-${fmt.toLowerCase()}`}
                      type="button"
                      onClick={() => handleSwitchFormat(fmt)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs font-black transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#FFD66B] text-[#111111] border-2 border-[#171717]'
                          : 'hover:bg-[#F8F5EE] dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {fmt === 'Reel' && <Film className="w-4 h-4" />}
                        {fmt === 'Carousel' && <Layers className="w-4 h-4" />}
                        {fmt === 'Image' && <ImageIcon className="w-4 h-4" />}
                        <span>{fmt} Studio</span>
                      </div>
                      {isCurrent && <span className="neo-badge neo-badge-coral text-[9px]">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="font-black text-sm text-[#111111] dark:text-[#F5F3EC]">→</span>

          <span className="neo-badge neo-badge-coral text-[10px] font-black">
            STAGE: {currentBranch === 'Reel' ? reelStage.toUpperCase() : currentBranch === 'Carousel' ? carouselStage.toUpperCase() : imageStage.toUpperCase()}
          </span>
        </div>

        {/* Right: Draft Selector & Secondary Tools */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Draft selector dropdown */}
          {scripts.length > 1 && (
            <select
              value={selectedScript?.id}
              onChange={(e) => onSelectScript(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 border font-semibold cursor-pointer outline-none ${
                isDark ? 'bg-[#1b1b28] border-zinc-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.format || 'Reel'}] {s.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <button
              id="btn-open-repurpose-tool"
              type="button"
              onClick={() => setSecondaryToolModal('repurpose')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Cross-platform repurposing engine"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repurpose</span>
            </button>

            <button
              id="btn-open-media-vault"
              type="button"
              onClick={() => setSecondaryToolModal('media')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Media asset vault"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Media Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* Format Switch Notification Toast */}
      {formatSwitchNotification && (
        <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{formatSwitchNotification}</span>
        </div>
      )}

      {/* 2. DYNAMIC FORMAT WORKSPACE BODY */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* ========================================================================= */}
        {/* BRANCH A: 🎬 REEL / VIDEO WORKSPACE                                      */}
        {/* ========================================================================= */}
        {currentBranch === 'Reel' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stage Pipeline Tabs */}
            <div
              className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto select-none ${
                isDark ? 'bg-[#12121a] border-[#222230]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {[
                { id: 'script', label: '1. Script (4-Act)', icon: FileText },
                { id: 'storyboard', label: '2. Storyboard', icon: Layers },
                { id: 'video', label: '3. Video Preview', icon: Film },
                { id: 'review', label: '4. Review & Schedule', icon: Calendar }
              ].map((st) => (
                <button
                  key={st.id}
                  id={`reel-stage-tab-${st.id}`}
                  type="button"
                  onClick={() => {
                    onClearToast?.();
                    setReelStage(st.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    reelStage === st.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <st.icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Stage Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* STAGE 1: Script Studio (Reusing existing 4-Act studio!) */}
              {reelStage === 'script' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="p-3 bg-orange-500/10 border-b border-orange-500/20 px-6 flex items-center justify-between text-xs">
                    <span className="text-orange-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>4-Act Script Studio: Refine Hook, Agitation, Solution &amp; CTA.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReelStage('storyboard')}
                      className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>Proceed to Storyboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-h-0">
                    <InstagramScriptsView
                      scripts={scripts}
                      activeSkill={activeSkill}
                      initialSelectedScriptId={selectedScript?.id}
                      onGenerateScript={async (topicId, format, customTitle) => {
                        onCreateScript(topicId, format);
                      }}
                      onSaveScript={async (scriptId, updates) => {
                        if (onUpdateScript) onUpdateScript(scriptId, updates);
                      }}
                      onScheduleScript={onApproveAndScheduleScript}
                      isGenerating={false}
                    />
                  </div>
                </div>
              )}

              {/* STAGE 2: Storyboard Scene Breakdown */}
              {reelStage === 'storyboard' && (
                <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-orange-500" />
                        <span>Reel Storyboard Scene Cards</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Visual cues, camera movements, transitions, pacing timeframes, and on-screen text breakdown.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-generate-storyboard"
                        type="button"
                        onClick={handleGenerateStoryboardFromScript}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                          isDark
                            ? 'bg-[#1e1e2c] border-orange-500/40 text-orange-400 hover:bg-[#28283a]'
                            : 'bg-white border-orange-300 text-orange-600 hover:bg-orange-50'
                        }`}
                        title="Generate structured scenes from current 4-Act script"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate Storyboard from Script</span>
                      </button>

                      <button
                        id="btn-add-scene"
                        type="button"
                        onClick={handleAddScene}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Scene</span>
                      </button>

                      <button
                        id="btn-proceed-to-video"
                        type="button"
                        onClick={() => setReelStage('video')}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Proceed to Video Preview</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scene Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedScript?.scenes && selectedScript.scenes.length > 0
                      ? selectedScript.scenes
                      : [
                          { timeframe: '0:00 - 0:03', visualCue: 'Fast push-in on camera, hand gesture pattern interrupt', onScreenText: selectedScript?.hook || 'Stop scrolling!', spokenAudio: selectedScript?.hook || 'Watch this before posting.', cameraMovement: 'Fast Push-in', transition: 'Hard Cut', audioNote: 'Trending high-tempo audio bed' },
                          { timeframe: '0:03 - 0:15', visualCue: 'Screen recording demonstrating the common mistake', onScreenText: 'The common mistake', spokenAudio: 'Here is why most creators fail to retain viewers in the first 5 seconds.', cameraMovement: 'Screen Pan & Zoom', transition: 'Whoosh Transition', audioNote: 'SFX: Whoosh transition' },
                          { timeframe: '0:15 - 0:40', visualCue: 'Split screen with concrete framework demonstration', onScreenText: 'The 3-step solution', spokenAudio: 'Follow this exact 3-step blueprint to fix your distribution.', cameraMovement: 'Static Eye-Level Authority', transition: 'Zoom Blur', audioNote: 'Upbeat rhythm build' },
                          { timeframe: '0:40 - 0:55', visualCue: 'Direct eye contact to camera with bookmark gesture', onScreenText: 'Save this Reel for later', spokenAudio: 'Comment BLUEPRINT and I will send you the full guide.', cameraMovement: 'Tracking Close-up', transition: 'Fade to Black', audioNote: 'Outro audio swell' }
                        ]
                    ).map((sc, idx, arr) => (
                      <div
                        key={idx}
                        id={`scene-card-${idx}`}
                        className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                          isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {/* Card Header with Badges & Reorder Controls */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              Scene {idx + 1} ({sc.timeframe})
                            </span>
                            {sc.cameraMovement && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                                <Camera className="w-2.5 h-2.5" />
                                <span>{sc.cameraMovement}</span>
                              </span>
                            )}
                            {sc.transition && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 flex items-center gap-1">
                                <span>⚡ {sc.transition}</span>
                              </span>
                            )}
                          </div>

                          {/* Reorder and Delete controls */}
                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-move-up-scene-${idx}`}
                              type="button"
                              onClick={() => handleMoveScene(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Move scene up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-move-down-scene-${idx}`}
                              type="button"
                              onClick={() => handleMoveScene(idx, 'down')}
                              disabled={idx === arr.length - 1}
                              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Move scene down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-duplicate-scene-${idx}`}
                              type="button"
                              onClick={() => handleDuplicateScene(idx)}
                              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                              title="Duplicate scene"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-scene-${idx}`}
                              type="button"
                              onClick={() => handleDeleteScene(idx)}
                              disabled={arr.length <= 1}
                              className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Delete scene"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content Fields */}
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Visual Direction:</span>
                            <p className="font-medium text-slate-900 dark:text-zinc-200 mt-0.5">{sc.visualCue}</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">On-Screen Text:</span>
                            <p className="font-bold text-orange-500 mt-0.5">"{sc.onScreenText}"</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dialogue / Spoken Audio:</span>
                            <p className="italic text-slate-700 dark:text-zinc-300 mt-0.5">"{sc.spokenAudio}"</p>
                          </div>

                          {sc.audioNote && (
                            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono">
                              🎵 {sc.audioNote}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            id={`btn-edit-scene-${idx}`}
                            type="button"
                            onClick={() => handleStartEditScene(idx)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Scene</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-ai-improve-scene-${idx}`}
                              type="button"
                              onClick={() => handleAiImproveScene(idx)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI Improve</span>
                            </button>
                            <button
                              id={`btn-regenerate-scene-${idx}`}
                              type="button"
                              onClick={() => handleRegenerateScene(idx)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scene Edit Modal */}
                  {editingSceneIdx !== null && editSceneData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
                      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
                        isDark ? 'bg-[#181826] border-[#2e2e42] text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}>
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-orange-500" />
                            <span>Edit Scene {editingSceneIdx + 1}</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => { setEditingSceneIdx(null); setEditSceneData(null); }}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Timeframe / Timing:</label>
                            <input
                              id="input-scene-timeframe"
                              type="text"
                              value={editSceneData.timeframe}
                              onChange={(e) => setEditSceneData({ ...editSceneData, timeframe: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs"
                              placeholder="e.g. 0:00 - 0:03"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Visual Direction / Cue:</label>
                            <textarea
                              id="input-scene-visual"
                              rows={2}
                              value={editSceneData.visualCue}
                              onChange={(e) => setEditSceneData({ ...editSceneData, visualCue: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs leading-relaxed"
                              placeholder="Describe camera framing, actor movement, gestures..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">On-Screen Text Overlay:</label>
                            <input
                              id="input-scene-onscreen"
                              type="text"
                              value={editSceneData.onScreenText}
                              onChange={(e) => setEditSceneData({ ...editSceneData, onScreenText: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-orange-400 font-bold text-xs"
                              placeholder="Key text to display on screen..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Dialogue / Spoken Audio:</label>
                            <textarea
                              id="input-scene-dialogue"
                              rows={3}
                              value={editSceneData.spokenAudio}
                              onChange={(e) => setEditSceneData({ ...editSceneData, spokenAudio: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs leading-relaxed"
                              placeholder="Spoken script lines or voiceover for this scene..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Camera Movement:</label>
                              <input
                                id="input-scene-camera"
                                type="text"
                                value={editSceneData.cameraMovement || ''}
                                onChange={(e) => setEditSceneData({ ...editSceneData, cameraMovement: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs"
                                placeholder="e.g. Fast Push-in, Pan, Tracking"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Transition:</label>
                              <input
                                id="input-scene-transition"
                                type="text"
                                value={editSceneData.transition || ''}
                                onChange={(e) => setEditSceneData({ ...editSceneData, transition: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs"
                                placeholder="e.g. Hard Cut, Whoosh, Zoom Blur"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Audio / Music Note:</label>
                            <input
                              id="input-scene-audio"
                              type="text"
                              value={editSceneData.audioNote || ''}
                              onChange={(e) => setEditSceneData({ ...editSceneData, audioNote: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs"
                              placeholder="e.g. Upbeat rhythm build, SFX whoosh"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                          <button
                            id="btn-cancel-scene-edit"
                            type="button"
                            onClick={() => { setEditingSceneIdx(null); setEditSceneData(null); }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="btn-save-scene-edit"
                            type="button"
                            onClick={handleSaveSceneEdit}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                          >
                            Save Scene
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scene AI Diff Modal */}
                  {sceneDiffModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
                      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 ${
                        isDark ? 'bg-[#181826] border-[#2e2e42] text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}>
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span>{sceneDiffModal.title}</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setSceneDiffModal(null)}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Current Scene:</span>
                            <p className="text-zinc-400 font-mono text-[11px] line-through">{sceneDiffModal.original.visualCue}</p>
                            <p className="text-zinc-400 font-mono text-[11px] line-through">"{sceneDiffModal.original.spokenAudio}"</p>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Proposed (AI Improvement):</span>
                            <p className="text-emerald-400 font-mono text-[11px] font-semibold">{sceneDiffModal.proposed.visualCue}</p>
                            <p className="text-emerald-300 font-mono text-[11px]">"{sceneDiffModal.proposed.spokenAudio}"</p>
                          </div>

                          {sceneDiffModal.diffNotes && (
                            <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>{sceneDiffModal.diffNotes}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                          <button
                            id="btn-scene-diff-discard"
                            type="button"
                            onClick={() => setSceneDiffModal(null)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          >
                            Cancel / Discard
                          </button>
                          <button
                            id="btn-scene-diff-accept"
                            type="button"
                            onClick={handleAcceptSceneDiff}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Changes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3: Video Preview (9:16 Scene Sequence Player) */}
              {reelStage === 'video' && (() => {
                const currentScenes = selectedScript?.scenes && selectedScript.scenes.length > 0
                  ? selectedScript.scenes
                  : [
                      { timeframe: '0:00 - 0:03', visualCue: 'Fast push-in on camera, hand gesture pattern interrupt', onScreenText: selectedScript?.hook || 'STOP SCROLLING', spokenAudio: selectedScript?.hook || 'Watch this before posting.', cameraMovement: 'Fast Push-in', transition: 'Hard Cut', audioNote: 'Trending high-tempo audio bed' },
                      { timeframe: '0:03 - 0:15', visualCue: 'Screen recording demonstrating the common mistake', onScreenText: 'THE HIDDEN TRAP', spokenAudio: 'Here is why most creators fail to retain viewers in the first 5 seconds.', cameraMovement: 'Screen Pan & Zoom', transition: 'Whoosh Transition', audioNote: 'SFX: Whoosh transition' },
                      { timeframe: '0:15 - 0:40', visualCue: 'Split screen with concrete framework demonstration', onScreenText: 'THE 3-STEP FIX', spokenAudio: 'Follow this exact 3-step blueprint to fix your distribution.', cameraMovement: 'Static Eye-Level Authority', transition: 'Zoom Blur', audioNote: 'Upbeat rhythm build' },
                      { timeframe: '0:40 - 0:55', visualCue: 'Direct eye contact to camera with bookmark gesture', onScreenText: 'SAVE THIS REEL', spokenAudio: 'Comment BLUEPRINT and I will send you the full guide.', cameraMovement: 'Tracking Close-up', transition: 'Fade to Black', audioNote: 'Outro audio swell' }
                    ];
                const activeScene = currentScenes[previewSceneIdx] || currentScenes[0];

                return (
                  <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                          <Film className="w-5 h-5 text-orange-500" />
                          <span>Reel Video Preview (9:16 Scene Sequence)</span>
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          Step through each scene with timing, visual direction, on-screen text overlays, and audio cues.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id="btn-generate-video"
                          type="button"
                          onClick={handleGenerateVideo}
                          disabled={isGeneratingVideo}
                          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isGeneratingVideo ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Rendering Sequence...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>Generate Video</span>
                            </>
                          )}
                        </button>

                        <button
                          id="btn-proceed-to-review"
                          type="button"
                          onClick={() => setReelStage('review')}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Proceed to Review &amp; Schedule</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {videoGeneratedSuccess && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>✓ 9:16 Video Preview sequence generated and synchronized with audio cues!</span>
                      </div>
                    )}

                    {/* 9:16 Video Mockup Frame */}
                    <div className="mx-auto w-76 aspect-[9/16] rounded-3xl border-2 border-orange-500/50 bg-[#0a0a0f] shadow-2xl relative overflow-hidden flex flex-col justify-between p-5 text-white">
                      {/* Top Header inside Frame */}
                      <div className="z-10 space-y-2">
                        {/* Segmented Scene Progress Bar */}
                        <div className="flex gap-1">
                          {currentScenes.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                i === previewSceneIdx
                                  ? 'bg-orange-500'
                                  : i < previewSceneIdx
                                  ? 'bg-orange-500/60'
                                  : 'bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono">
                          <span className="font-bold text-orange-400">
                            Scene {previewSceneIdx + 1} of {currentScenes.length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-orange-600/80 font-bold text-white text-[9px]">
                            {activeScene.timeframe}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Visual Cue and On-Screen Text Overlay */}
                      <div className="my-auto text-center space-y-4 z-10 px-2">
                        {/* Camera and Transition Badges */}
                        <div className="flex items-center justify-center gap-2">
                          {activeScene.cameraMovement && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-zinc-200 border border-white/20">
                              🎥 {activeScene.cameraMovement}
                            </span>
                          )}
                          {activeScene.transition && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-orange-300 border border-orange-500/30">
                              ⚡ {activeScene.transition}
                            </span>
                          )}
                        </div>

                        {/* On-Screen Text Sticker */}
                        <div className="inline-block px-4 py-2 rounded-xl bg-orange-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg transform -rotate-1">
                          {activeScene.onScreenText}
                        </div>

                        {/* Visual Direction Banner */}
                        <div className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400 block mb-0.5">Visual Direction:</span>
                          <p>{activeScene.visualCue}</p>
                        </div>
                      </div>

                      {/* Bottom: Spoken Audio Subtitles */}
                      <div className="z-10 space-y-2.5">
                        <div className="p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">Spoken Audio:</span>
                          <p className="italic text-white">"{activeScene.spokenAudio}"</p>
                        </div>

                        {/* Navigation Buttons inside Frame */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            id="btn-prev-preview-scene"
                            type="button"
                            onClick={() => setPreviewSceneIdx((prev) => Math.max(0, prev - 1))}
                            disabled={previewSceneIdx === 0}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            ◀ Prev
                          </button>

                          <button
                            id="btn-play-preview"
                            type="button"
                            onClick={() => {
                              setIsPlayingVideo(!isPlayingVideo);
                              if (!isPlayingVideo && previewSceneIdx === currentScenes.length - 1) {
                                setPreviewSceneIdx(0);
                              }
                            }}
                            className="p-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white cursor-pointer shadow-md"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>

                          <button
                            id="btn-next-preview-scene"
                            type="button"
                            onClick={() => setPreviewSceneIdx((prev) => Math.min(currentScenes.length - 1, prev + 1))}
                            disabled={previewSceneIdx === currentScenes.length - 1}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            Next ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* STAGE 4: Review & Schedule */}
              {reelStage === 'review' && (
                <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <span>Reel Final Review &amp; Publication Slot</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Comprehensive verification of Script, Storyboard, Video preview, and metadata before explicit scheduling.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-review-edit-script"
                        type="button"
                        onClick={() => setReelStage('script')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                      >
                        Edit Script
                      </button>
                      <button
                        id="btn-review-edit-storyboard"
                        type="button"
                        onClick={() => setReelStage('storyboard')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                      >
                        Edit Storyboard
                      </button>
                      <button
                        id="btn-review-approve"
                        type="button"
                        onClick={() => {
                          if (selectedScript && onUpdateScript) {
                            onUpdateScript(selectedScript.id, { status: 'ready_to_record' });
                          }
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                      >
                        Approve Production
                      </button>
                      <button
                        id="btn-review-schedule"
                        type="button"
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule to Calendar</span>
                      </button>
                    </div>
                  </div>

                  {scheduleSuccessToast && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{scheduleSuccessToast}</span>
                    </div>
                  )}

                  {/* Review Dashboard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Script & Storyboard Review */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Topic & Lineage Card */}
                      <div className={`p-5 rounded-2xl border ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Linked Strategic Topic</span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{selectedScript?.title}</h3>
                        <p className={`text-xs mt-1 italic ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>"{selectedScript?.hook}"</p>
                        <div className="flex items-center gap-2 mt-3 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-[10px]">
                            Pillar: {selectedScript?.contentPillar || 'Content Gap'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold text-[10px]">
                            Format: Reel (0–60s)
                          </span>
                        </div>
                      </div>

                      {/* 4-Act Script Review Card */}
                      <div className={`p-5 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-orange-500" />
                            <span>4-Act Script Breakdown</span>
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Score: {selectedScript?.score || 92}/100
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <span className="text-[10px] font-bold uppercase text-orange-400 block">Act 1: Hook (0-3s)</span>
                            <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">{selectedScript?.acts?.act1_hook || selectedScript?.hook}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[10px] font-bold uppercase text-amber-400 block">Act 2: Agitation (3-15s)</span>
                            <p className="text-slate-800 dark:text-zinc-200 mt-0.5">{selectedScript?.acts?.act2_agitation || 'Most creators burn out trying to produce without strategic deficits.'}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <span className="text-[10px] font-bold uppercase text-blue-400 block">Act 3: Solution (15-45s)</span>
                            <p className="text-slate-800 dark:text-zinc-200 mt-0.5">{selectedScript?.acts?.act3_solution || 'Follow this exact 3-step blueprint to fix your distribution.'}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] font-bold uppercase text-emerald-400 block">Act 4: CTA (45-60s)</span>
                            <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">{selectedScript?.acts?.act4_cta || selectedScript?.callToAction}</p>
                          </div>
                        </div>
                      </div>

                      {/* Storyboard Scenes Summary */}
                      <div className={`p-5 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-orange-500" />
                          <span>Storyboard Scenes ({selectedScript?.scenes?.length || 4} Total)</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(selectedScript?.scenes || [
                            { timeframe: '0:00 - 0:03', onScreenText: 'STOP SCROLLING' },
                            { timeframe: '0:03 - 0:15', onScreenText: 'THE HIDDEN TRAP' },
                            { timeframe: '0:15 - 0:40', onScreenText: 'THE 3-STEP FIX' },
                            { timeframe: '0:40 - 0:55', onScreenText: 'SAVE THIS REEL' }
                          ]).map((sc, i) => (
                            <div key={i} className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px]">
                              <span className="font-bold text-orange-400">Scene {i + 1} ({sc.timeframe})</span>
                              <p className="text-zinc-300 font-semibold truncate mt-0.5">{sc.onScreenText}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right 1 Col: Video Preview, Caption, Cover, Scheduling CTA */}
                    <div className="space-y-4">
                      {/* Video Preview Thumbnail */}
                      <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <div className="w-36 aspect-[9/16] mx-auto rounded-2xl bg-black border border-orange-500/40 p-2 flex flex-col justify-between text-white shadow-md">
                          <span className="text-[8px] font-mono text-orange-400">9:16 Preview</span>
                          <p className="text-[9px] font-bold leading-tight">"{selectedScript?.hook?.slice(0, 30)}..."</p>
                          <span className="text-[8px] text-zinc-400 font-mono">1080 × 1920</span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-400 block">Simulated Reel Frame</span>
                      </div>

                      {/* Caption & Hashtags Card */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Caption:</span>
                        <textarea
                          id="review-caption-input"
                          rows={4}
                          value={reviewCaption}
                          onChange={(e) => {
                            setReviewCaption(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, { caption: e.target.value });
                            }
                          }}
                          className="w-full p-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-white leading-relaxed"
                          placeholder="Instagram caption..."
                        />

                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Hashtags:</span>
                        <input
                          id="review-hashtags-input"
                          type="text"
                          value={reviewHashtags}
                          onChange={(e) => {
                            setReviewHashtags(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, { hashtags: e.target.value.split(/\s+/).filter(Boolean) });
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-orange-400 font-mono"
                          placeholder="#reels #growth #content"
                        />
                      </div>

                      {/* Cover Selection Preview */}
                      <div className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Cover Frame:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-16 rounded-lg bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                            Cover 1
                          </div>
                          <div className="w-12 h-16 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-400">
                            Frame 2
                          </div>
                          <div className="w-12 h-16 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-400">
                            Upload
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explicit Scheduling Confirmation Modal */}
                  {isScheduleModalOpen && (
                    <div id="modal-confirm-schedule" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
                      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 ${
                        isDark ? 'bg-[#181826] border-[#2e2e42] text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}>
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <h3 className="font-bold text-base">Schedule Reel Publication</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Explicit Non-Auto-Publish Warning */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Strict Confirmation Required:</span>
                            <span>Scheduling will reserve a verified slot on your Instagram calendar. The system will NEVER auto-publish without manual confirmation.</span>
                          </div>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Publication Date:</label>
                            <input
                              id="input-schedule-date"
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Peak Slot Time:</label>
                            <input
                              id="input-schedule-time"
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-xs font-semibold"
                            />
                            <span className="text-[10px] text-zinc-500 mt-1 block">Default 18:30 (Peak audience activity slot) • Timezone: Asia/Kolkata (IST)</span>
                          </div>

                          {/* Mandatory Confirmation Checkbox */}
                          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                            <input
                              id="checkbox-confirm-schedule"
                              type="checkbox"
                              checked={hasConfirmedScheduleCheckbox}
                              onChange={(e) => setHasConfirmedScheduleCheckbox(e.target.checked)}
                              className="w-4 h-4 text-orange-600 rounded border-zinc-700 cursor-pointer accent-orange-600"
                            />
                            <label htmlFor="checkbox-confirm-schedule" className="text-xs font-semibold text-zinc-200 cursor-pointer">
                              I confirm this Reel will be scheduled for {scheduleDate} at {scheduleTime}.
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                          <button
                            id="btn-cancel-schedule"
                            type="button"
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="btn-confirm-schedule"
                            type="button"
                            onClick={handleConfirmSchedule}
                            disabled={!hasConfirmedScheduleCheckbox || isSchedulingInProgress}
                            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isSchedulingInProgress ? 'Scheduling...' : 'Schedule Reel'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BRANCH B: 📚 CAROUSEL WORKSPACE                                          */}
        {/* ========================================================================= */}
        {currentBranch === 'Carousel' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stage Pipeline Tabs */}
            <div
              className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto select-none ${
                isDark ? 'bg-[#12121a] border-[#222230]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {[
                { id: 'copy', label: `1. Slide Copy (${(selectedScript?.slides?.length || 5)} Slides)`, icon: FileText },
                { id: 'mock', label: '2. Mock Carousel', icon: Eye },
                { id: 'final', label: '3. Final Render', icon: Sparkles },
                { id: 'review', label: '4. Review & Schedule', icon: Calendar }
              ].map((st) => (
                <button
                  key={st.id}
                  id={`carousel-stage-tab-${st.id}`}
                  type="button"
                  onClick={() => {
                    onClearToast?.();
                    setCarouselStage(st.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    carouselStage === st.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <st.icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Stage Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* STAGE 1: Slide Copy Editor */}
              {carouselStage === 'copy' && (
                <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-400" />
                        <span>Carousel Slide Copy Editor</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Default: Hook → Value 1 → Value 2 → Value 3 → CTA ({selectedScript?.slides?.length || 5} slides total). Edit, reorder, and polish with AI.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-ai-improve-full-carousel"
                        type="button"
                        onClick={handleAiImproveFullCarousel}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Polish Deck</span>
                      </button>

                      <button
                        id="btn-add-carousel-slide"
                        type="button"
                        onClick={handleAddSlide}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slide</span>
                      </button>

                      <button
                        id="btn-generate-mock-carousel"
                        type="button"
                        onClick={handleGenerateMockCarousel}
                        disabled={isGeneratingMockCarousel}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMockCarousel ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingMockCarousel ? 'Generating Mockup...' : 'Generate Mock Carousel ➔'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Slides List */}
                  <div className="space-y-4">
                    {(selectedScript?.slides && selectedScript.slides.length > 0
                      ? selectedScript.slides
                      : getDefaultCarouselSlides(selectedScript)
                    ).map((slide, idx, arr) => (
                      <div
                        key={idx}
                        id={`carousel-slide-card-${idx}`}
                        className={`p-5 rounded-2xl border transition-all ${
                          isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {/* Slide Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/40">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Slide {slide.slideNumber || idx + 1}: {slide.slideType.toUpperCase()}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">1080 × 1080 px</span>
                            {slide.score && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Quality: {slide.score}%
                              </span>
                            )}
                          </div>

                          {/* Slide Actions Toolbar */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              id={`btn-move-slide-up-${idx}`}
                              disabled={idx === 0}
                              onClick={() => handleMoveSlide(idx, 'up')}
                              title="Move Slide Up"
                              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-move-slide-down-${idx}`}
                              disabled={idx === arr.length - 1}
                              onClick={() => handleMoveSlide(idx, 'down')}
                              title="Move Slide Down"
                              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-ai-improve-slide-${idx}`}
                              onClick={() => handleAiImproveSlide(idx)}
                              title="AI Polish Slide"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Wand2 className="w-3 h-3 text-purple-400" />
                              <span>AI Polish</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-regenerate-slide-${idx}`}
                              onClick={() => handleRegenerateSlide(idx)}
                              title="Regenerate Slide"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-zinc-400" />
                              <span>Regenerate</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-duplicate-slide-${idx}`}
                              onClick={() => handleDuplicateSlide(idx)}
                              title="Duplicate Slide"
                              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-slide-${idx}`}
                              disabled={arr.length <= 2}
                              onClick={() => handleDeleteSlide(idx)}
                              title="Delete Slide"
                              className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Slide Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Slide Role
                            </label>
                            <select
                              value={slide.slideType}
                              onChange={(e) => handleUpdateSlide(idx, { slideType: e.target.value as any })}
                              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                                isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            >
                              <option value="hook">Hook (Slide 1)</option>
                              <option value="content">Value Point (Slide 2-4)</option>
                              <option value="cta">CTA / Summary (Slide 5)</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Visual Layout Directive
                            </label>
                            <input
                              type="text"
                              value={slide.visualLayout}
                              onChange={(e) => handleUpdateSlide(idx, { visualLayout: e.target.value })}
                              placeholder="e.g. Bold Typography, Agitation Card, 3-Step Blueprint"
                              className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                                isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Headline
                            </label>
                            <input
                              id={`input-slide-headline-${idx}`}
                              type="text"
                              value={slide.headline}
                              onChange={(e) => handleUpdateSlide(idx, { headline: e.target.value })}
                              className={`w-full text-xs font-bold px-3 py-2 rounded-xl border outline-none ${
                                isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Body Text / Breakdown
                            </label>
                            <textarea
                              id={`input-slide-body-${idx}`}
                              rows={2}
                              value={slide.bodyText}
                              onChange={(e) => handleUpdateSlide(idx, { bodyText: e.target.value })}
                              className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                                isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              Swipe Trigger Indicator
                            </label>
                            <input
                              id={`input-slide-trigger-${idx}`}
                              type="text"
                              value={slide.swipeTrigger}
                              onChange={(e) => handleUpdateSlide(idx, { swipeTrigger: e.target.value })}
                              className={`w-full text-xs font-mono px-3 py-1.5 rounded-xl border outline-none text-purple-400 ${
                                isDark ? 'bg-[#13131e] border-zinc-700' : 'bg-slate-50 border-slate-200'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 2: Mock Carousel Visual Preview */}
              {carouselStage === 'mock' && (
                <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-400" />
                        <span>Mock Carousel Preview ({selectedScript?.slides?.length || 5} Slides • 1080 × 1080)</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Review high-fidelity slide cards with swipe triggers. Click 'Render Final Slide Deck' to finalize assets.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center rounded-xl border border-zinc-700 p-0.5 bg-zinc-900/60">
                        <button
                          id="btn-carousel-view-stepper"
                          type="button"
                          onClick={() => setIsCarouselGridMode(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            !isCarouselGridMode ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Card Stepper
                        </button>
                        <button
                          id="btn-carousel-view-grid"
                          type="button"
                          onClick={() => setIsCarouselGridMode(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isCarouselGridMode ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Grid Overview
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCarouselStage('copy')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        Edit Copy
                      </button>

                      <button
                        id="btn-render-final-deck"
                        type="button"
                        onClick={handleRenderFinalDeck}
                        disabled={isRenderingFinalDeck}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isRenderingFinalDeck ? 'animate-spin' : ''}`} />
                        <span>{isRenderingFinalDeck ? 'Rendering Deck...' : deckRenderSuccess ? 'Deck Rendered!' : 'Render Final Slide Deck ➔'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Stepper Preview */}
                  {!isCarouselGridMode && (() => {
                    const slides = selectedScript?.slides && selectedScript.slides.length > 0
                      ? selectedScript.slides
                      : getDefaultCarouselSlides(selectedScript);
                    const currentSlide = slides[carouselPreviewIdx] || slides[0];

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span className="font-bold text-purple-400">
                            Viewing Slide {carouselPreviewIdx + 1} of {slides.length}
                          </span>
                          <span className="font-mono">1080 × 1080 px (Instagram Standard Square)</span>
                        </div>

                        {/* Interactive Square Preview */}
                        <div
                          className={`max-w-md mx-auto aspect-square p-8 rounded-3xl border shadow-2xl flex flex-col justify-between transition-all ${
                            isDark
                              ? 'bg-gradient-to-br from-[#1e1b2e] via-[#161426] to-[#100f1c] border-purple-500/30'
                              : 'bg-gradient-to-br from-purple-50 via-white to-slate-50 border-purple-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Slide {currentSlide.slideNumber || carouselPreviewIdx + 1}: {currentSlide.slideType.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {currentSlide.visualLayout}
                            </span>
                          </div>

                          <div className="space-y-4 my-auto text-center px-4">
                            <h3 className="text-xl font-black tracking-tight leading-snug text-slate-900 dark:text-white">
                              {currentSlide.headline}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                              {currentSlide.bodyText}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono text-purple-400 pt-3 border-t border-purple-500/20">
                            <span>S2S Strategic Content</span>
                            <span className="font-bold">{currentSlide.swipeTrigger}</span>
                          </div>
                        </div>

                        {/* Stepper Navigation Controls */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            id="btn-carousel-prev-slide"
                            type="button"
                            disabled={carouselPreviewIdx === 0}
                            onClick={() => setCarouselPreviewIdx((p) => Math.max(0, p - 1))}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Previous Slide</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {slides.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setCarouselPreviewIdx(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                  carouselPreviewIdx === i ? 'bg-purple-500 w-6' : 'bg-zinc-700 hover:bg-zinc-500'
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            id="btn-carousel-next-slide"
                            type="button"
                            disabled={carouselPreviewIdx === slides.length - 1}
                            onClick={() => setCarouselPreviewIdx((p) => Math.min(slides.length - 1, p + 1))}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Next Slide</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mode B: Grid Overview */}
                  {isCarouselGridMode && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-bold text-purple-400">
                          All {selectedScript?.slides && selectedScript.slides.length > 0 ? selectedScript.slides.length : 5} Slides Overview
                        </span>
                        <span className="font-mono">1080 × 1080 px</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {(selectedScript?.slides && selectedScript.slides.length > 0
                        ? selectedScript.slides
                        : getDefaultCarouselSlides(selectedScript)
                      ).map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCarouselPreviewIdx(idx);
                            setIsCarouselGridMode(false);
                          }}
                          className={`aspect-square p-5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] ${
                            isDark
                              ? 'bg-gradient-to-br from-[#1d1a2c] via-[#161424] to-[#12111d] border-purple-500/30 shadow-lg'
                              : 'bg-gradient-to-br from-purple-50/50 via-white to-slate-50 border-purple-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Slide {s.slideNumber || idx + 1}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">{s.slideType}</span>
                          </div>

                          <div className="space-y-2 text-center my-auto px-1">
                            <h4 className="text-xs font-black tracking-tight leading-snug text-slate-900 dark:text-white line-clamp-2">
                              {s.headline}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                              {s.bodyText}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-purple-400 pt-2 border-t border-purple-500/20 font-mono">
                            <span>1080 × 1080</span>
                            <span className="truncate">{s.swipeTrigger}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* STAGE 3: Final Render Deck */}
              {carouselStage === 'final' && (
                <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span>Final Carousel Slide Deck ({selectedScript?.slides?.length || 5} Slides)</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        All high-res slide assets rendered and ready for export or Instagram scheduling.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Theme Selector */}
                      <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-zinc-800">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold px-1.5">Theme:</span>
                        <select
                          value={carouselActiveRenderStyle}
                          onChange={(e) => {
                            const newStyle = e.target.value as StylePreset;
                            setCarouselActiveRenderStyle(newStyle);
                            handleRenderFinalDeck(newStyle);
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="Editorial Swiss Graphic">Editorial Swiss Graphic</option>
                          <option value="Modern Minimalist">Modern Minimalist</option>
                          <option value="Brutalist High Contrast">Brutalist High Contrast</option>
                          <option value="Studio Product Lighting">Studio Product Lighting</option>
                          <option value="Cyberpunk Neon Dark">Cyberpunk Neon Dark</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRenderFinalDeck()}
                          disabled={isRenderingFinalDeck}
                          title="Re-render all slides with current theme"
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRenderingFinalDeck ? 'animate-spin' : ''}`} />
                          <span>Re-render</span>
                        </button>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex rounded-xl p-1 bg-zinc-800/60 border border-zinc-700">
                        <button
                          type="button"
                          onClick={() => setDeckViewMode('single')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            deckViewMode === 'single'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Stepper
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeckViewMode('grid')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            deckViewMode === 'grid'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          All Slides Grid
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCarouselStage('review')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                      >
                        <span>Proceed to Review &amp; Schedule</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {carouselVaultToast && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{carouselVaultToast}</span>
                    </div>
                  )}

                  {/* HIGH-RES RENDERED GALLERY */}
                  {(() => {
                    const currentSlides = selectedScript?.slides && selectedScript.slides.length > 0
                      ? selectedScript.slides
                      : getDefaultCarouselSlides(selectedScript);

                    if (isRenderingFinalDeck) {
                      return (
                        <div className="p-12 rounded-3xl border-2 border-dashed border-purple-500/40 flex flex-col items-center justify-center space-y-4 text-center">
                          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Rendering High-Resolution Slide Deck...</h3>
                            <p className="text-xs text-zinc-400 mt-1">Generating 1080×1080 pixel-perfect typographic slides with Swiss layouts.</p>
                          </div>
                        </div>
                      );
                    }

                    if (deckViewMode === 'grid') {
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span className="font-bold text-purple-400">
                              Rendered Deck Grid Overview ({currentSlides.length} Slides)
                            </span>
                            <span className="font-mono">1080 × 1080 PNG Format</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {currentSlides.map((slide, idx) => {
                              const renderedItem = renderedDeckBlobs.find((b) => b.slideNumber === (slide.slideNumber || idx + 1));
                              const imgSrc = renderedItem?.dataUrl || slide.finalImageUrl || slide.mockImageUrl;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setDeckActivePreviewIdx(idx);
                                    setDeckViewMode('single');
                                  }}
                                  className="aspect-square rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-lg relative group cursor-pointer hover:border-purple-400 transition-all bg-black"
                                >
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={`Slide ${idx + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full p-2 text-center text-[10px] text-zinc-400">
                                      Generating...
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-mono text-purple-300 border border-purple-500/30">
                                    Slide {idx + 1}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Single Stepper Mode
                    const activeSlide = currentSlides[deckActivePreviewIdx] || currentSlides[0];
                    const activeRendered = renderedDeckBlobs.find(
                      (b) => b.slideNumber === (activeSlide.slideNumber || deckActivePreviewIdx + 1)
                    );
                    const activeImageUrl =
                      activeRendered?.dataUrl ||
                      activeSlide.finalImageUrl ||
                      activeSlide.mockImageUrl;

                    return (
                      <div className="space-y-4">
                        {/* Slide Selector Badges */}
                        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                          {currentSlides.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setDeckActivePreviewIdx(i)}
                              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                                deckActivePreviewIdx === i
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              Slide {i + 1}
                            </button>
                          ))}
                        </div>

                        {/* 1080x1080 Active Slide Frame */}
                        <div className="aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-black relative flex items-center justify-center">
                          {activeImageUrl ? (
                            <img
                              src={activeImageUrl}
                              alt={`Slide ${deckActivePreviewIdx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center p-6 space-y-2">
                              <p className="text-xs text-zinc-400">Rendering preview asset...</p>
                              <button
                                type="button"
                                onClick={() => handleRenderFinalDeck()}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
                              >
                                Render Now
                              </button>
                            </div>
                          )}

                          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-purple-300 border border-purple-500/30">
                            1080 × 1080 PNG
                          </div>
                        </div>

                        {/* Stepper Controls */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <button
                            type="button"
                            disabled={deckActivePreviewIdx === 0}
                            onClick={() => setDeckActivePreviewIdx((p) => Math.max(0, p - 1))}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Previous</span>
                          </button>

                          <span className="text-xs font-mono text-zinc-400">
                            {deckActivePreviewIdx + 1} of {currentSlides.length}
                          </span>

                          <button
                            type="button"
                            disabled={deckActivePreviewIdx === currentSlides.length - 1}
                            onClick={() => setDeckActivePreviewIdx((p) => Math.min(currentSlides.length - 1, p + 1))}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {activeImageUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                downloadDataUrl(
                                  activeImageUrl,
                                  `slide-${String(deckActivePreviewIdx + 1).padStart(2, '0')}.png`
                                );
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-purple-300 flex items-center gap-1.5 cursor-pointer ml-2"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Slide {deckActivePreviewIdx + 1} PNG</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary & Batch Export Card */}
                  <div className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Deck Renders Complete</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">
                        {selectedScript?.slides?.length || 5} PNG Assets (1080 × 1080)
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Slides have been rendered with crisp typography, balanced margins, and safe zones for Instagram mobile viewing.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (renderedDeckBlobs.length > 0) {
                            const zipName = `${(selectedScript?.title || 'carousel').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-slides.zip`;
                            await downloadCarouselDeckZip(renderedDeckBlobs, zipName);
                            setCarouselVaultToast(`✓ Downloaded ${renderedDeckBlobs.length} slides as ZIP package!`);
                            setTimeout(() => setCarouselVaultToast(null), 3500);
                          } else {
                            await handleRenderFinalDeck();
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download ZIP Package</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCarouselVaultToast(`✓ All ${selectedScript?.slides?.length || 5} rendered slides saved to Media Vault!`);
                          setTimeout(() => setCarouselVaultToast(null), 3500);
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Save to Media Vault</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 4: Review & Schedule */}
              {carouselStage === 'review' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>Carousel Review &amp; Publication Schedule</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Review all slides, choose cover slide, verify caption &amp; hashtags, and confirm publication.
                      </p>
                    </div>
                  </div>

                  {carouselSuccessToast && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{carouselSuccessToast}</span>
                    </div>
                  )}

                  <div className={`p-6 rounded-2xl border space-y-6 ${
                    isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedScript?.title}</h3>
                        <p className="text-xs text-zinc-400">Pillar: {selectedScript?.contentPillar || 'Growth'} | Deficit: Format Optimization</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Ready to Schedule
                      </span>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">FORMAT</div>
                        <div className="font-bold text-purple-400 mt-0.5">Carousel ({selectedScript?.slides?.length || 5} Slides)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">SAVE POTENTIAL</div>
                        <div className="font-bold text-emerald-400 mt-0.5">High (Educational)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">COVER SLIDE</div>
                        <div className="font-bold text-white mt-0.5">Slide {carouselCoverIndex + 1}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">ASSET STATUS</div>
                        <div className="font-bold text-emerald-400 mt-0.5">Rendered Deck</div>
                      </div>
                    </div>

                    {/* All Slides Review & Cover Selector */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                        Select Cover Slide &amp; Review All Cards
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {(selectedScript?.slides && selectedScript.slides.length > 0
                          ? selectedScript.slides
                          : getDefaultCarouselSlides(selectedScript)
                        ).map((s, idx) => {
                          const rendered = renderedDeckBlobs.find((b) => b.slideNumber === (s.slideNumber || idx + 1));
                          const slideImg = rendered?.dataUrl || s.finalImageUrl;
                          return (
                            <div
                              key={idx}
                              onClick={() => setCarouselCoverIndex(idx)}
                              className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                                carouselCoverIndex === idx
                                  ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/40'
                                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                              }`}
                            >
                              {slideImg && (
                                <div className="aspect-square rounded-lg overflow-hidden bg-black mb-1.5 border border-zinc-800">
                                  <img src={slideImg} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain" />
                                </div>
                              )}
                              <div className="text-[10px] font-bold text-purple-400 mb-0.5">
                                Slide {s.slideNumber || idx + 1} {carouselCoverIndex === idx ? '★ Cover' : ''}
                              </div>
                              <div className="text-xs font-bold text-zinc-200 line-clamp-1 mb-0.5">{s.headline}</div>
                              <div className="text-[10px] text-zinc-400 truncate">{s.swipeTrigger}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Caption & Hashtags */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Instagram Caption
                        </label>
                        <textarea
                          id="input-carousel-caption"
                          rows={3}
                          value={carouselReviewCaption}
                          onChange={(e) => {
                            setCarouselReviewCaption(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, { caption: e.target.value });
                            }
                          }}
                          className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Hashtags
                        </label>
                        <input
                          id="input-carousel-hashtags"
                          type="text"
                          value={carouselReviewHashtags}
                          onChange={(e) => {
                            setCarouselReviewHashtags(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, {
                                hashtags: e.target.value.split(' ').filter(Boolean)
                              });
                            }
                          }}
                          className={`w-full text-xs px-3 py-2 rounded-xl border outline-none text-purple-400 ${
                            isDark ? 'bg-[#13131e] border-zinc-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCarouselStage('mock')}
                        className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Back to Mock Carousel
                      </button>

                      <button
                        id="btn-schedule-carousel"
                        type="button"
                        onClick={() => {
                          onClearToast?.();
                          setHasConfirmedCarouselSchedule(false);
                          setIsScheduleCarouselModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Carousel to Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL: Single Slide AI Polish / Regenerate Diff */}
            {slideDiffModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                <div
                  className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#151522] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-base">{slideDiffModal.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlideDiffModal(null)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                      <strong>AI Optimization:</strong> {slideDiffModal.diffNotes}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Original */}
                      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                        <span className="font-bold text-red-400 uppercase text-[10px] tracking-wider block">
                          Current Draft
                        </span>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">HEADLINE</span>
                          <p className="font-bold text-zinc-200">{slideDiffModal.original.headline}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">BODY</span>
                          <p className="text-zinc-300 leading-relaxed">{slideDiffModal.original.bodyText}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">SWIPE TRIGGER</span>
                          <p className="font-mono text-zinc-400">{slideDiffModal.original.swipeTrigger}</p>
                        </div>
                      </div>

                      {/* Proposed */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                        <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                          AI Proposed
                        </span>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">HEADLINE</span>
                          <p className="font-bold text-emerald-200">{slideDiffModal.proposed.headline}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">BODY</span>
                          <p className="text-emerald-100 leading-relaxed">{slideDiffModal.proposed.bodyText}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">SWIPE TRIGGER</span>
                          <p className="font-mono text-emerald-300">{slideDiffModal.proposed.swipeTrigger}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                    <button
                      id="btn-discard-slide-diff"
                      type="button"
                      onClick={() => setSlideDiffModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      id="btn-accept-slide-diff"
                      type="button"
                      onClick={handleAcceptSlideDiff}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept AI Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Full Carousel AI Narrative Diff */}
            {fullCarouselDiffModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                <div
                  className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
                    isDark ? 'bg-[#151522] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-base">{fullCarouselDiffModal.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFullCarouselDiffModal(null)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <p className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                      <strong>Narrative Synthesis:</strong> {fullCarouselDiffModal.diffNotes}
                    </p>

                    <div className="space-y-4">
                      {fullCarouselDiffModal.proposedSlides.map((pSlide, i) => {
                        const oSlide = fullCarouselDiffModal.originalSlides[i] || pSlide;
                        return (
                          <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-black/20 space-y-2 text-xs">
                            <span className="font-bold text-purple-400 uppercase text-[10px]">
                              Slide {i + 1}: {pSlide.slideType.toUpperCase()}
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                                <span className="text-[10px] text-red-400 block font-bold">CURRENT</span>
                                <p className="font-semibold text-zinc-300">{oSlide.headline}</p>
                                <p className="text-zinc-400 text-[11px] mt-1">{oSlide.bodyText}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <span className="text-[10px] text-emerald-400 block font-bold">PROPOSED</span>
                                <p className="font-semibold text-emerald-200">{pSlide.headline}</p>
                                <p className="text-emerald-100 text-[11px] mt-1">{pSlide.bodyText}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                    <button
                      id="btn-discard-full-carousel-diff"
                      type="button"
                      onClick={() => setFullCarouselDiffModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                    >
                      Discard All
                    </button>
                    <button
                      id="btn-accept-full-carousel-diff"
                      type="button"
                      onClick={handleAcceptFullCarouselDiff}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Full Carousel Polish</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Explicit Carousel Scheduling Confirmation */}
            {isScheduleCarouselModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                <div
                  className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#151522] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-base">Schedule Carousel Publication</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScheduleCarouselModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                      <span className="font-bold text-purple-300 block">Carousel Details:</span>
                      <p className="text-zinc-300">"{selectedScript?.title}"</p>
                      <p className="text-zinc-400 font-mono text-[11px]">
                        Format: Carousel ({selectedScript?.slides?.length || 5} Slides) • Cover: Slide {carouselCoverIndex + 1}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Publication Date
                        </label>
                        <input
                          id="input-carousel-schedule-date"
                          type="date"
                          value={carouselScheduleDate}
                          onChange={(e) => setCarouselScheduleDate(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Publication Time
                        </label>
                        <input
                          id="input-carousel-schedule-time"
                          type="time"
                          value={carouselScheduleTime}
                          onChange={(e) => setCarouselScheduleTime(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">Default 18:30 • Timezone: Asia/Kolkata (IST)</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/30 border border-zinc-800 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="checkbox-confirm-schedule-carousel"
                          type="checkbox"
                          checked={hasConfirmedCarouselSchedule}
                          onChange={(e) => setHasConfirmedCarouselSchedule(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded border-zinc-700 cursor-pointer accent-purple-600 mt-0.5"
                        />
                        <label
                          htmlFor="checkbox-confirm-schedule-carousel"
                          className="text-xs font-semibold text-zinc-200 cursor-pointer select-none"
                        >
                          I confirm this Carousel will be scheduled for {carouselScheduleDate} at {carouselScheduleTime}.
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                    <button
                      id="btn-cancel-schedule-carousel"
                      type="button"
                      onClick={() => setIsScheduleCarouselModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-schedule-carousel"
                      type="button"
                      onClick={handleConfirmScheduleCarousel}
                      disabled={!hasConfirmedCarouselSchedule}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Carousel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BRANCH C: 🖼️ IMAGE WORKSPACE                                             */}
        {/* ========================================================================= */}
        {currentBranch === 'Image' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stage Pipeline Tabs */}
            <div
              className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto select-none ${
                isDark ? 'bg-[#12121a] border-[#222230]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {[
                { id: 'concept', label: '1. Concept & Copy', icon: FileText },
                { id: 'mock', label: '2. Mock Image', icon: Eye },
                { id: 'final', label: '3. Final Render', icon: Sparkles },
                { id: 'review', label: '4. Review & Schedule', icon: Calendar }
              ].map((st) => (
                <button
                  key={st.id}
                  id={`image-stage-tab-${st.id}`}
                  type="button"
                  onClick={() => {
                    onClearToast?.();
                    setImageStage(st.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    imageStage === st.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <st.icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Stage Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* STAGE 1: Concept & Copy Editor */}
              {imageStage === 'concept' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-400" />
                        <span>Single Image Concept &amp; Copy</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Configure typography overlay, visual prompt direction, and frame aspect ratio.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-ai-improve-image"
                        type="button"
                        onClick={handleAiImproveImageConcept}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>AI Polish</span>
                      </button>

                      <button
                        id="btn-regenerate-image"
                        type="button"
                        onClick={handleRegenerateImageConcept}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>

                      <button
                        id="btn-generate-mock-image"
                        type="button"
                        onClick={handleGenerateMockImage}
                        disabled={isGeneratingMockImage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMockImage ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingMockImage ? 'Generating Mockup...' : 'Generate Mock Image ➔'}</span>
                      </button>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Headline &amp; Text Overlay
                      </label>
                      <input
                        id="input-image-headline"
                        type="text"
                        value={selectedScript?.imageConcept?.headline || selectedScript?.hook || selectedScript?.title}
                        onChange={(e) => handleUpdateImageConcept({
                          headline: e.target.value,
                          textOverlay: e.target.value
                        })}
                        className={`w-full text-xs font-bold px-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Visual Prompt / Graphic Direction
                      </label>
                      <textarea
                        id="input-image-prompt"
                        rows={3}
                        value={selectedScript?.imageConcept?.visualPrompt || `Minimalist modern graphic poster for: ${selectedScript?.title}. Clean typography, high contrast, brand accent orange.`}
                        onChange={(e) => handleUpdateImageConcept({ visualPrompt: e.target.value })}
                        className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Aspect Ratio
                        </label>
                        <div className="flex gap-2">
                          {(['1:1', '4:5', '9:16'] as Array<'1:1' | '4:5' | '9:16'>).map((ratio) => {
                            const currentRatio = selectedScript?.imageConcept?.aspectRatio || '1:1';
                            const btnId = ratio === '1:1' ? 'btn-aspect-1-1' : ratio === '4:5' ? 'btn-aspect-4-5' : 'btn-aspect-9-16';
                            return (
                              <button
                                key={ratio}
                                id={btnId}
                                type="button"
                                onClick={() => handleUpdateImageConcept({ aspectRatio: ratio })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                                  currentRatio === ratio
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                    : isDark
                                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {ratio} {ratio === '1:1' ? '(Square)' : ratio === '4:5' ? '(Portrait)' : '(Story)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Style Preset
                        </label>
                        <select
                          value={selectedScript?.imageConcept?.stylePreset || 'Editorial Swiss Graphic'}
                          onChange={(e) => handleUpdateImageConcept({ stylePreset: e.target.value })}
                          className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        >
                          <option value="Editorial Swiss Graphic">Editorial Swiss Graphic</option>
                          <option value="Brutalist High Contrast">Brutalist High Contrast</option>
                          <option value="Minimal Modern Vector">Minimal Modern Vector</option>
                          <option value="Studio Product Lighting">Studio Product Lighting</option>
                          <option value="Cyberpunk Neon Dark">Cyberpunk Neon Dark</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: Mock Image Preview */}
              {imageStage === 'mock' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto text-center">
                  <div className="flex items-center justify-between text-left flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-400" />
                        <span>Mock Image Preview</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Visual layout framing, aspect ratio check, and typography overlay verification.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setImageStage('concept')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        Edit Concept
                      </button>

                      <button
                        id="btn-render-final-image"
                        type="button"
                        onClick={handleRenderFinalImage}
                        disabled={isRenderingFinalImage}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isRenderingFinalImage ? 'animate-spin' : ''}`} />
                        <span>{isRenderingFinalImage ? 'Rendering Image...' : imageRenderSuccess ? 'Image Rendered!' : 'Render Final Image ➔'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive Aspect Ratio Mock Container */}
                  {(() => {
                    const ratio = selectedScript?.imageConcept?.aspectRatio || '1:1';
                    const aspectClass = ratio === '9:16' ? 'aspect-[9/16] max-w-xs' : ratio === '4:5' ? 'aspect-[4/5] max-w-sm' : 'aspect-square max-w-sm';
                    const resText = ratio === '9:16' ? '1080 × 1920 px (9:16 Story/Reel)' : ratio === '4:5' ? '1080 × 1350 px (4:5 Portrait)' : '1080 × 1080 px (1:1 Square)';

                    return (
                      <div
                        id="mock-image-container"
                        className={`mx-auto ${aspectClass} rounded-3xl border shadow-2xl p-6 flex flex-col justify-between transition-all ${
                          isDark
                            ? 'bg-gradient-to-br from-[#121626] via-[#10131e] to-[#0c0d15] border-blue-500/30'
                            : 'bg-gradient-to-br from-blue-50 via-white to-slate-100 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                            {ratio} Aspect Ratio
                          </span>
                          <span className="truncate">{selectedScript?.imageConcept?.stylePreset || 'Editorial Graphic'}</span>
                        </div>

                        <div className="my-auto space-y-3 px-2">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                            "{selectedScript?.imageConcept?.headline || selectedScript?.hook || selectedScript?.title}"
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 italic">
                            {selectedScript?.contentPillar || 'Strategic Growth Principle'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                          <span>{resText}</span>
                          <span className="text-blue-400 font-bold">Mock Preview</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STAGE 3: Final Render Image */}
              {imageStage === 'final' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <span>Final Rendered Image Asset</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        High-resolution asset produced and ready for export or scheduling.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Theme Selector */}
                      <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-zinc-800">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold px-1.5">Theme:</span>
                        <select
                          value={imageActiveRenderStyle}
                          onChange={(e) => {
                            const newStyle = e.target.value as StylePreset;
                            setImageActiveRenderStyle(newStyle);
                            handleRenderFinalImage(newStyle);
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="Editorial Swiss Graphic">Editorial Swiss Graphic</option>
                          <option value="Modern Minimalist">Modern Minimalist</option>
                          <option value="Brutalist High Contrast">Brutalist High Contrast</option>
                          <option value="Studio Product Lighting">Studio Product Lighting</option>
                          <option value="Cyberpunk Neon Dark">Cyberpunk Neon Dark</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRenderFinalImage()}
                          disabled={isRenderingFinalImage}
                          title="Re-render with current theme"
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRenderingFinalImage ? 'animate-spin' : ''}`} />
                          <span>Re-render</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setImageStage('review')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                      >
                        <span>Proceed to Review &amp; Schedule</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {imageVaultToast && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{imageVaultToast}</span>
                    </div>
                  )}

                  {/* HIGH-RES RENDERED IMAGE FRAME */}
                  {(() => {
                    const ratio = selectedScript?.imageConcept?.aspectRatio || '1:1';
                    const aspectClass =
                      ratio === '9:16'
                        ? 'aspect-[9/16] max-w-xs'
                        : ratio === '4:5'
                        ? 'aspect-[4/5] max-w-sm'
                        : 'aspect-square max-w-md';
                    const resBadge =
                      ratio === '9:16'
                        ? '1080 × 1920 PNG'
                        : ratio === '4:5'
                        ? '1080 × 1350 PNG'
                        : '1080 × 1080 PNG';
                    const currentImgUrl =
                      renderedImageData?.dataUrl ||
                      selectedScript?.imageConcept?.finalImageUrl ||
                      selectedScript?.imageConcept?.mockImageUrl;

                    if (isRenderingFinalImage) {
                      return (
                        <div className={`mx-auto ${aspectClass} rounded-3xl border-2 border-dashed border-blue-500/40 flex flex-col items-center justify-center p-8 space-y-4 text-center`}>
                          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Rendering High-Resolution Canvas Graphic...</h3>
                            <p className="text-xs text-zinc-400 mt-1">Generating pixel-perfect typography, margins, safe zones, and Swiss hierarchy.</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className={`mx-auto ${aspectClass} rounded-3xl overflow-hidden border-2 border-blue-500/40 shadow-2xl bg-black relative flex items-center justify-center group`}>
                        {currentImgUrl ? (
                          <img
                            src={currentImgUrl}
                            alt="Final Rendered Asset"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <p className="text-xs text-zinc-400">Asset ready to be generated.</p>
                            <button
                              type="button"
                              onClick={() => handleRenderFinalImage()}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                            >
                              Render Image Now
                            </button>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30">
                          {resBadge}
                        </div>
                      </div>
                    );
                  })()}

                  <div className={`p-6 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Image Rendered ({selectedScript?.imageConcept?.aspectRatio || '1:1'} PNG)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">High-Resolution Asset</span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Visual asset has been generated according to the prompt directive and formatted with exact platform dimensions.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const imgUrl =
                            renderedImageData?.dataUrl ||
                            selectedScript?.imageConcept?.finalImageUrl ||
                            selectedScript?.imageConcept?.mockImageUrl;
                          if (imgUrl) {
                            const fname = `${(selectedScript?.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-rendered.png`;
                            downloadDataUrl(imgUrl, fname);
                            setImageVaultToast(`✓ Downloaded ${fname} (${selectedScript?.imageConcept?.aspectRatio || '1:1'})!`);
                            setTimeout(() => setImageVaultToast(null), 3500);
                          } else {
                            handleRenderFinalImage();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setImageVaultToast('✓ High-resolution image asset saved to Media Vault!');
                          setTimeout(() => setImageVaultToast(null), 3500);
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Save to Media Vault</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 4: Review & Schedule */}
              {imageStage === 'review' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span>Image Review &amp; Publication Schedule</span>
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Review post copy, verify aspect ratio, and book publication slot on calendar.
                      </p>
                    </div>
                  </div>

                  {imageSuccessToast && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{imageSuccessToast}</span>
                    </div>
                  )}

                  <div className={`p-6 rounded-2xl border space-y-6 ${
                    isDark ? 'bg-[#181826] border-[#2c2c40]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedScript?.title}</h3>
                        <p className="text-xs text-zinc-400">Pillar: {selectedScript?.contentPillar || 'Growth'} | Lineage: Topic Verification</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Ready to Schedule
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">FORMAT</div>
                        <div className="font-bold text-blue-400 mt-0.5">Single Image</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">ASPECT RATIO</div>
                        <div className="font-bold text-white mt-0.5">{selectedScript?.imageConcept?.aspectRatio || '1:1'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">ASSET STATUS</div>
                        <div className="font-bold text-emerald-400 mt-0.5">Rendered Asset</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                        <div className="text-zinc-400 text-[10px]">PILLAR</div>
                        <div className="font-bold text-orange-400 mt-0.5">{selectedScript?.contentPillar || 'Growth'}</div>
                      </div>
                    </div>

                    {/* Rendered Asset Preview in Review */}
                    {(renderedImageData?.dataUrl || selectedScript?.imageConcept?.finalImageUrl) && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-zinc-800">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-700 shadow-md">
                          <img
                            src={renderedImageData?.dataUrl || selectedScript?.imageConcept?.finalImageUrl}
                            alt="Final Render Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span>Verified Rendered Asset</span>
                          </div>
                          <p className="text-zinc-400 text-[11px]">
                            High-resolution graphic card styled with {selectedScript?.imageConcept?.stylePreset || 'Editorial Swiss Graphic'} layout.
                          </p>
                          <span className="inline-block text-[10px] font-mono text-blue-300">
                            {selectedScript?.imageConcept?.aspectRatio || '1:1'} Format • High-DPI PNG
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Headline and Prompt summary */}
                    <div className="p-4 rounded-xl bg-black/20 border border-zinc-800 space-y-2 text-xs">
                      <div className="text-zinc-400 text-[10px] uppercase font-bold">Headline / Overlay</div>
                      <p className="font-bold text-zinc-200">
                        "{selectedScript?.imageConcept?.headline || selectedScript?.hook || selectedScript?.title}"
                      </p>
                      <div className="text-zinc-400 text-[10px] uppercase font-bold pt-2">Prompt Directive</div>
                      <p className="text-zinc-400 font-mono text-[11px]">
                        {selectedScript?.imageConcept?.visualPrompt || 'Default brand graphic prompt'}
                      </p>
                    </div>

                    {/* Caption & Hashtags */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Instagram Caption
                        </label>
                        <textarea
                          id="input-image-caption"
                          rows={3}
                          value={imageReviewCaption}
                          onChange={(e) => {
                            setImageReviewCaption(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, { caption: e.target.value });
                            }
                          }}
                          className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Hashtags
                        </label>
                        <input
                          id="input-image-hashtags"
                          type="text"
                          value={imageReviewHashtags}
                          onChange={(e) => {
                            setImageReviewHashtags(e.target.value);
                            if (selectedScript && onUpdateScript) {
                              onUpdateScript(selectedScript.id, {
                                hashtags: e.target.value.split(' ').filter(Boolean)
                              });
                            }
                          }}
                          className={`w-full text-xs px-3 py-2 rounded-xl border outline-none text-blue-400 ${
                            isDark ? 'bg-[#13131e] border-zinc-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setImageStage('mock')}
                        className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Back to Mock Image
                      </button>

                      <button
                        id="btn-schedule-image"
                        type="button"
                        onClick={() => {
                          onClearToast?.();
                          setHasConfirmedImageSchedule(false);
                          setIsScheduleImageModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Image to Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL: Image AI Polish / Regenerate Diff */}
            {imageDiffModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                <div
                  className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#151522] border-blue-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-base">{imageDiffModal.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageDiffModal(null)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                      <strong>AI Optimization:</strong> {imageDiffModal.diffNotes}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Original */}
                      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                        <span className="font-bold text-red-400 uppercase text-[10px] tracking-wider block">
                          Current Draft
                        </span>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">HEADLINE</span>
                          <p className="font-bold text-zinc-200">{imageDiffModal.original.headline}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">PROMPT DIRECTIVE</span>
                          <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">{imageDiffModal.original.visualPrompt}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">STYLE PRESET</span>
                          <p className="text-zinc-300">{imageDiffModal.original.stylePreset || 'Editorial'}</p>
                        </div>
                      </div>

                      {/* Proposed */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                        <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                          AI Proposed
                        </span>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">HEADLINE</span>
                          <p className="font-bold text-emerald-200">{imageDiffModal.proposed.headline}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">PROMPT DIRECTIVE</span>
                          <p className="text-emerald-100 font-mono text-[11px] leading-relaxed">{imageDiffModal.proposed.visualPrompt}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] block">STYLE PRESET</span>
                          <p className="text-emerald-200">{imageDiffModal.proposed.stylePreset}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                    <button
                      id="btn-discard-image-diff"
                      type="button"
                      onClick={() => setImageDiffModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      id="btn-accept-image-diff"
                      type="button"
                      onClick={handleAcceptImageDiff}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept AI Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Explicit Image Scheduling Confirmation */}
            {isScheduleImageModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                <div
                  className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#151522] border-blue-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-base">Schedule Image Publication</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScheduleImageModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                      <span className="font-bold text-blue-300 block">Image Details:</span>
                      <p className="text-zinc-300">"{selectedScript?.title}"</p>
                      <p className="text-zinc-400 font-mono text-[11px]">
                        Format: Single Image • Aspect Ratio: {selectedScript?.imageConcept?.aspectRatio || '1:1'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Publication Date
                        </label>
                        <input
                          id="input-image-schedule-date"
                          type="date"
                          value={imageScheduleDate}
                          onChange={(e) => setImageScheduleDate(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Publication Time
                        </label>
                        <input
                          id="input-image-schedule-time"
                          type="time"
                          value={imageScheduleTime}
                          onChange={(e) => setImageScheduleTime(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-[#13131e] border-zinc-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">Default 18:30 • Timezone: Asia/Kolkata (IST)</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/30 border border-zinc-800 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="checkbox-confirm-schedule-image"
                          type="checkbox"
                          checked={hasConfirmedImageSchedule}
                          onChange={(e) => setHasConfirmedImageSchedule(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-zinc-700 cursor-pointer accent-blue-600 mt-0.5"
                        />
                        <label
                          htmlFor="checkbox-confirm-schedule-image"
                          className="text-xs font-semibold text-zinc-200 cursor-pointer select-none"
                        >
                          I confirm this Image will be scheduled for {imageScheduleDate} at {imageScheduleTime}.
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                    <button
                      id="btn-cancel-schedule-image"
                      type="button"
                      onClick={() => setIsScheduleImageModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-schedule-image"
                      type="button"
                      onClick={handleConfirmScheduleImage}
                      disabled={!hasConfirmedImageSchedule}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Image</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLS MODALS (Repurpose & Media Vault)                          */}
      {/* ========================================================================= */}
      {secondaryToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#151522] border-[#2c2c40] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {secondaryToolModal === 'repurpose' && <Repeat className="w-5 h-5 text-orange-500" />}
                {secondaryToolModal === 'media' && <FolderOpen className="w-5 h-5 text-orange-500" />}
                <h3 className="font-bold text-lg">
                  {secondaryToolModal === 'repurpose' ? 'Cross-Platform Repurposing Engine' : 'Media & Asset Vault'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSecondaryToolModal(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {secondaryToolModal === 'repurpose' && (
                <div className="space-y-4">
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Instantly repurpose <strong className="text-white">"{selectedScript?.title || 'Selected Draft'}"</strong> across multiple channels:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Twitter */}
                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#1a1a28] border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className="font-bold text-xs text-blue-400 block mb-1">X (Twitter) Thread</span>
                        <p className="text-xs text-zinc-400 mb-3">
                          1/5 {selectedScript?.hook || 'Stop scrolling before you post.'} Full breakdown below...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('twitter', selectedScript?.caption || '')}
                        className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedFormat === 'twitter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFormat === 'twitter' ? 'Copied!' : 'Copy Thread'}</span>
                      </button>
                    </div>

                    {/* LinkedIn */}
                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#1a1a28] border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className="font-bold text-xs text-blue-500 block mb-1">LinkedIn Post</span>
                        <p className="text-xs text-zinc-400 mb-3">
                          {selectedScript?.hook} Strategic growth requires disciplined execution...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('linkedin', selectedScript?.caption || '')}
                        className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedFormat === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFormat === 'linkedin' ? 'Copied!' : 'Copy Post'}</span>
                      </button>
                    </div>

                    {/* Story */}
                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#1a1a28] border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className="font-bold text-xs text-pink-400 block mb-1">Story Interactive Poll</span>
                        <p className="text-xs text-zinc-400 mb-3">
                          "Did you know about this rule? [Yes / No]"
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('story', selectedScript?.hook || '')}
                        className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedFormat === 'story' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFormat === 'story' ? 'Copied!' : 'Copy Story'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {secondaryToolModal === 'media' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Audio tracks, visual hook templates, and brand overlays:
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('Media uploaded!')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Asset</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: 'Trending Tech Beat #4', type: 'Audio Track', duration: '0:45', tag: 'High Velocity' },
                      { name: 'Stock Chart Red Drop', type: 'B-Roll Video', duration: '0:06', tag: 'Pattern Interrupt' },
                      { name: 'RBI Building Exterior', type: 'B-Roll Video', duration: '0:08', tag: 'Authority' },
                      { name: 'S2S Brand Lower Third', type: 'Graphic Overlay', duration: 'Overlay', tag: 'Branding' }
                    ].map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border ${
                          isDark ? 'bg-[#1a1a28] border-zinc-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {m.type}
                        </span>
                        <h4 className="font-bold text-xs mt-2 mb-1 truncate text-white">{m.name}</h4>
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

            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSecondaryToolModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
