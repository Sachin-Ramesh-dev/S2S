export type InstagramAuditMode = 'full' | 'change' | 'performance' | 'quick';

export interface ContentPillar {
  name: string;
  targetPercentage: number;
  currentPercentage: number;
  description: string;
}

export interface CompetitorAccount {
  username: string;
  followers: number;
  engagementRate: number;
  note: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  engagementRate: number;
  averageReelViews: number;
  category: string;
  niche: string;
  avatarUrl?: string;
  connectedAt: string;
  lastSyncAt: string;
  contentPillars: ContentPillar[];
  competitors: CompetitorAccount[];
  competitorHandles: string[];
  connectionMethod?: 'manus_instagram_login' | 'manus_browser_crawl' | 'meta_graph_api' | 'manual';
  manusSessionId?: string;
  isVerified?: boolean;
  metaPageId?: string;
  loginEmailOrUser?: string;
}

export interface InstagramAuditScores {
  profile_score: number;
  content_score: number;
  consistency_score: number;
  engagement_score: number;
  positioning_score: number;
  overall_score: number;
}

export interface InstagramAuditRecommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface ContentPillarAnalysis {
  pillar: string;
  performance: string;
  recommendation: string;
}

export interface CompetitorObservation {
  competitor: string;
  insight: string;
  counterStrategy: string;
}

export interface InstagramAuditRecord {
  id: string;
  accountId: string;
  timestamp: string;
  audit_date?: string;
  auditMode: InstagramAuditMode;
  status?: 'in_progress' | 'completed' | 'failed';
  progressPct?: number;
  progressStep?: string;
  provider: string;
  model: string;
  skillVersion: string;
  promptVersion: string;
  scores: InstagramAuditScores;
  strengths: string[];
  weaknesses: string[];
  critical_issues: string[];
  content_gaps: string[];
  topic_opportunities: string[];
  opportunities?: string[];
  recommendations: InstagramAuditRecommendation[];
  content_pillar_analysis: ContentPillarAnalysis[];
  competitor_observations: CompetitorObservation[];
  changes_since_previous_audit: string[];
  whatsWorking?: Array<{ title: string; detail: string; reason: string }>;
  whatsNotWorking?: Array<{ title: string; detail: string; reason: string; guardrailRule: string; addedToSkills?: boolean }>;
  markdownReport?: string;
  rawResponse?: string;
  taskUrl?: string;
  shareUrl?: string;
  attachmentUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Account Manager' | 'Script Writer' | 'Content Creator' | 'Admin' | 'account_manager' | 'script_writer' | 'content_team' | 'reviewer';
  avatarUrl?: string;
  avatar?: string;
  assignedAccountIds?: string[];
  accountIds?: string[];
  status?: 'active' | 'invited';
  active?: boolean;
  phone?: string;
  joinedAt?: string;
  createdAt?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  agencyEmail: string;
  isConfigured?: boolean;
  enabled?: boolean;
}

export type TopicFormat = 'Reel' | 'Carousel' | 'Static' | 'Story' | 'Image' | 'Other';
export type TopicStatus = 'pending' | 'approved' | 'rejected';

export interface TopicRejectionReason {
  category: 'Too Generic' | 'Relevance' | 'Off-Brand' | 'Overdone' | 'Low Value' | 'Other';
  feedback: string;
  date: string;
}

export type ContentState =
  | 'IDEA'
  | 'REVIEW'
  | 'APPROVED'
  | 'BRIEF'
  | 'SCRIPT_IDEAS'
  | 'SCRIPT_DRAFT'
  | 'AGENCY_READY'
  | 'SENT_TO_AGENCY'
  | 'PUBLISHED';

export interface TopicVersionRecord {
  version: number; // e.g. 1, 2, 3
  timestamp: string;
  changedBy: string;
  changeSummary: string;
  snapshot: {
    title: string;
    hook: string;
    contentPillar: string;
    format: TopicFormat;
    objective?: string;
    audience?: string;
    angle?: string;
    priority?: 'high' | 'medium' | 'low';
    notes?: string;
  };
}

export type TopicVersion = TopicVersionRecord;

export interface TopicMoveBackRecord {
  fromStage: string;
  toStage: string;
  reason: string;
  timestamp: string;
  user: string;
}

export interface TopicIdea {
  id: string;
  accountId: string;
  title: string;
  hook: string;
  format: TopicFormat;
  contentPillar: string;
  viralPotentialScore: number; // 1-100
  auditRationale: string;
  status: TopicStatus;
  stage?: ContentState;
  objective?: string;
  audience?: string;
  angle?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  rejectionReason?: TopicRejectionReason;
  approvalNote?: string;
  versions?: TopicVersionRecord[];
  currentVersion?: number;
  moveBackHistory?: TopicMoveBackRecord[];
  createdAt: string;
  updatedAt?: string;
  generationId?: string;
  angleOptions?: string[];
  contentGoal?: string;
  targetAudienceAngle?: string;
  source?: 'AI' | 'Manual' | 'AI + Manual';
}

export type PipelineStage =
  | 'approved'
  | 'scripting'
  | 'in_review'
  | 'ready_to_record'
  | 'scheduled'
  | 'published';

export interface ContentPipelineItem {
  id: string;
  accountId: string;
  topicId?: string;
  title: string;
  format: TopicFormat;
  contentPillar: string;
  stage: PipelineStage;
  dueDate: string;
  scriptId?: string;
  assignee?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReelScene {
  timeframe: string;
  visualCue: string;
  onScreenText: string;
  spokenAudio: string;
  audioNote: string;
}

export interface CarouselSlide {
  slideNumber: number;
  slideType: 'hook' | 'content' | 'summary' | 'cta';
  visualLayout: string;
  headline: string;
  bodyText: string;
  swipeTrigger: string;
}

export interface ScriptVersionRecord {
  version: number;
  label: string;
  date: string;
  fullTextScript?: string;
  scenes?: ReelScene[];
  score?: number;
  changedBy?: string;
}

export interface ScriptScoreBreakdown {
  hook: number;
  clarity: number;
  engagement: number;
  flow: number;
  cta: number;
  instagramFit: number;
}

export interface ScriptItem {
  id: string;
  pipelineItemId?: string;
  topicId?: string;
  topicTitle?: string;
  topicHook?: string;
  contentPillar?: string;
  objective?: string;
  accountId: string;
  title: string;
  format: 'Reel' | 'Carousel';
  hook: string;
  fullTextScript?: string;
  scenes?: ReelScene[];
  timeline?: any[];
  slides?: CarouselSlide[];
  carouselSlides?: any[];
  estimatedDurationSeconds?: number;
  modelUsed?: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  status: 'needs_writing' | 'draft' | 'in_review' | 'ready_to_record' | 'completed' | 'sent_to_agency' | 'approved' | 'rejected';
  assignedWriterId?: string;
  assignedWriterName?: string;
  assignedWriterEmail?: string;
  score?: number;
  scoreBreakdown?: ScriptScoreBreakdown;
  scoreSuggestions?: string[];
  source?: 'AI' | 'Manual' | 'AI + Manual' | 'Topic';
  versions?: ScriptVersionRecord[];
  currentVersion?: number;
  sentToAgencyAt?: string;
  agencyNotes?: string;
  userEdits?: Array<{
    field: string;
    original: string;
    edited: string;
    timestamp: string;
  }>;
  feedback?: string;
  generationId: string;
  skillVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarPost {
  id: string;
  accountId: string;
  title: string;
  format: TopicFormat;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: 'draft' | 'scheduled' | 'published';
  pillar: string;
  scriptId?: string;
  pipelineItemId?: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    retentionRatePct?: number;
  };
}

export type AIConnectionStatus =
  | 'connected'
  | 'auth_failed'
  | 'rate_limited'
  | 'config_error'
  | 'unavailable'
  | 'unconfigured';

export interface ProviderConfigBase {
  enabled: boolean;
  apiKeyConfigured: boolean;
  maskedApiKey?: string;
  baseUrl: string;
  timeoutMs: number;
  lastTested?: string;
  connectionStatus: AIConnectionStatus;
  statusMessage?: string;
}

export interface ManusProviderConfig extends ProviderConfigBase {
  defaultAgent: string;
  project?: string;
  skill?: string;
  maxRetries: number;
  webhookUrl?: string;
}

export interface GeminiProviderConfig extends ProviderConfigBase {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  structuredOutput: boolean;
  systemInstruction?: string;
  retryCount: number;
}

export interface StandardAIProviderConfig extends ProviderConfigBase {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface CustomAIProviderConfig extends ProviderConfigBase {
  providerName: string;
  model: string;
  temperature: number;
}

export interface AIRoutingSettings {
  instagram_audit: { provider: string; model: string };
  topic_generation: { provider: string; model: string };
  script_ideas: { provider: string; model: string };
  script_generation: { provider: string; model: string };
  feedback_analysis: { provider: string; model: string };
  skill_proposal: { provider: string; model: string };
  competitor_research: { provider: string; model: string };
  trend_research: { provider: string; model: string };
}

export interface AIFallbackSettings {
  primary: string;
  fallback: string;
  secondFallback: string;
  autoFallbackEnabled: boolean;
}

export interface AICostControls {
  monthlyBudgetUsd: number;
  warningThresholdPct: number;
  hardStopPct: number;
  currentSpendUsd: number;
  currentMonth: string;
  requestCountThisMonth: number;
  estimatedTokensThisMonth: number;
}

export interface AILearningSettings {
  enabled: boolean;
  requireHumanApproval: boolean;
  minFeedbackThreshold: number;
  confidenceThresholdPct: number;
}

export interface AISchedulerSettings {
  auditFrequency: 'daily' | 'every_3_days' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  auditMode: InstagramAuditMode;
  contentGenerationSchedule: string; // e.g. "Every Monday at 9:00 AM"
  syncSchedule: string;
  active: boolean;
  nextRunAt: string;
  lastRunAt?: string;
}

export interface AIConfiguration {
  providers: {
    manus: ManusProviderConfig;
    gemini: GeminiProviderConfig;
    openai: StandardAIProviderConfig;
    anthropic: StandardAIProviderConfig;
    perplexity: StandardAIProviderConfig;
    custom: CustomAIProviderConfig;
  };
  routing: AIRoutingSettings;
  fallbacks: AIFallbackSettings;
  costControls: AICostControls;
  learningSettings: AILearningSettings;
  schedulerSettings: AISchedulerSettings;
  notifications: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
    webhookUrl?: string;
  };
}

export interface AISkillRecord {
  id?: string;
  version: string; // e.g. 'v4'
  title: string;
  description?: string;
  isActive: boolean;
  isLive?: boolean;
  rules: string[];
  brandVoiceRules: string[];
  brandVoice?: {
    tone?: string;
    demographic?: string;
    styleGuidelines?: string;
  };
  forbiddenPhrases: string[];
  preferredFormats: string[];
  changeSummary: string;
  changelog?: string;
  reason: string;
  supportingFeedback: string[];
  approvedBy: string;
  approvedAt: string;
  createdAt?: string;
  previousVersion?: string;
}

export interface LearningProposal {
  id: string;
  observation: string;
  proposedRule: string;
  category: 'relevance' | 'format' | 'hook' | 'brand_voice' | 'content_pillar';
  confidence: number; // 0-100
  confidenceScore?: number;
  evidence?: string;
  evidenceCount: number;
  evidenceDetails: string[];
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  createdAt: string;
}

export interface GenerationRecord {
  id: string;
  task: string;
  provider: string;
  model: string;
  promptVersion: string;
  skillVersion: string;
  inputContextSummary: string;
  inputContext?: any;
  output: any;
  tokensUsed?: { prompt: number; completion: number; total: number };
  costEstimateUsd?: number;
  durationMs: number;
  status: 'success' | 'fallback_used' | 'error';
  userDecision?: 'approved' | 'rejected' | 'edited' | 'pending';
  feedback?: string;
  createdAt: string;
  error?: string;
}

export interface SystemReadiness {
  instagramConnected: boolean;
  manusConfigured: boolean;
  geminiConfigured: boolean;
  aiRoutingConfigured: boolean;
  activeSkillExists: boolean;
  schedulerConfigured: boolean;
  credentialVaultWorking: boolean;
  databaseWorking: boolean;
  allReady: boolean;
}

export type McpTransportType = 'stdio' | 'sse' | 'websocket' | 'http';
export type McpAuthMethod = 'none' | 'api_key' | 'bearer' | 'basic' | 'custom_header';
export type McpToolPermission = 'read' | 'write' | 'destructive';

export interface McpTool {
  name: string;
  description: string;
  permissionCategory: McpToolPermission;
  enabled: boolean;
  isDestructive?: boolean;
  parametersCount?: number;
}

export interface McpConnection {
  id: string;
  name: string;
  transport: McpTransportType;
  serverUrl: string;
  authMethod: McpAuthMethod;
  hasCredentials?: boolean;
  maskedToken?: string;
  headers?: Record<string, string>;
  envVars?: Record<string, string>;
  status: 'connected' | 'disconnected' | 'error';
  tools: McpTool[];
  lastConnected?: string;
  lastError?: string;
  enabled: boolean;
  allowDestructive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface McpTestResult {
  success: boolean;
  status?: string;
  serverName: string;
  toolsCount: number;
  discoveredTools: McpTool[];
  message: string;
  latencyMs?: number;
  timestamp: string;
}

export interface TeamsIntegrationConfig {
  webhookUrl: string;
  enabled: boolean;
  autoSendTopics: boolean;
  autoSendScripts: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed';
  lastTestMessage?: string;
  lastDispatchedAt?: string;
}


