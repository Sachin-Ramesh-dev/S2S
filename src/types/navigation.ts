export type PrimaryJourneyId =
  | 'home'
  | 'audit'
  | 'topics'
  | 'production'
  | 'publishing'
  | 'performance';

export type AutomationDomainId = 'workflows';

export type SupportingToolId =
  | 'competitors'
  | 'guardrails'
  | 'collaboration'
  | 'settings'
  | 'audit_history';

export type LegacyDomainId =
  | 'strategy'
  | 'content'
  | 'intelligence';

export type DomainId =
  | PrimaryJourneyId
  | AutomationDomainId
  | SupportingToolId
  | LegacyDomainId;

export type StrategySubView = 'audit' | 'competitors' | 'opportunities';
export type ContentSubView = 'topics' | 'scripts' | 'creative' | 'repurpose' | 'media';
export type WorkflowsSubView = 'builder' | 'templates' | 'active' | 'runs' | 'automations';
export type PublishingSubView = 'calendar' | 'queue' | 'swimlane' | 'campaigns' | 'scheduler';
export type IntelligenceSubView = 'analytics' | 'performance' | 'content_intelligence' | 'reports';
export type CollaborationSubView = 'approvals' | 'comments' | 'team' | 'client_portal';
export type SettingsSubView = 'integrations' | 'mcp' | 'ai' | 'security' | 'existing';
export type ProductionSubView = 'scripts' | 'creative' | 'storyboard' | 'overview';

export type SubViewId =
  | StrategySubView
  | ContentSubView
  | WorkflowsSubView
  | PublishingSubView
  | IntelligenceSubView
  | CollaborationSubView
  | SettingsSubView
  | ProductionSubView
  | 'overview';

export interface DomainNavigationConfig {
  id: DomainId;
  label: string;
  icon: string;
  description: string;
  defaultSubView: SubViewId;
  category?: 'primary' | 'automation' | 'supporting' | 'legacy';
  subItems?: {
    id: SubViewId;
    label: string;
    description: string;
    badge?: string;
  }[];
}

// 1. PRIMARY JOURNEY (Visually dominant core content engine)
export const PRIMARY_JOURNEY_DOMAINS: DomainNavigationConfig[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    description: 'Action Center: What should I work on now?',
    defaultSubView: 'overview',
    category: 'primary'
  },
  {
    id: 'audit',
    label: 'Page Audit',
    icon: '🔍',
    description: 'Diagnostic profile audit, health score, and content pillar breakdown',
    defaultSubView: 'overview',
    category: 'primary'
  },
  {
    id: 'topics',
    label: 'Topics',
    icon: '💡',
    description: 'AI topic generation, pillar deficit alignment, and approval queue',
    defaultSubView: 'overview',
    category: 'primary'
  },
  {
    id: 'production',
    label: 'Content Production',
    icon: '🎬',
    description: '4-Act viral script studio and slide storyboard production',
    defaultSubView: 'scripts',
    category: 'primary',
    subItems: [
      { id: 'scripts', label: 'Script Studio', description: '4-Act retention timeline and hook builder' },
      { id: 'creative', label: 'Slide Storyboard', description: 'Carousel and visual slide storyboard' }
    ]
  },
  {
    id: 'publishing',
    label: 'Publishing',
    icon: '📅',
    description: 'Content calendar, Kanban pipeline, and 18:30 peak slot scheduling',
    defaultSubView: 'calendar',
    category: 'primary',
    subItems: [
      { id: 'calendar', label: 'Calendar', description: 'Monthly schedule and 18:30 peak slots' },
      { id: 'queue', label: 'Queue & Monitor', description: 'Live publishing queue, delivery states & snapshot inspector' },
      { id: 'swimlane', label: 'Swimlane', description: 'Kanban pipeline across stages' }
    ]
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: '📊',
    description: 'Reel 3s hook retention, audience growth, and pillar ROI intelligence',
    defaultSubView: 'performance',
    category: 'primary',
    subItems: [
      { id: 'performance', label: 'Performance', description: 'Hook retention and completion rates' },
      { id: 'analytics', label: 'Analytics', description: 'Growth curves and engagement' }
    ]
  }
];

// 2. AUTOMATION DOMAIN (n8n-style visual workflow system)
export const AUTOMATION_DOMAINS: DomainNavigationConfig[] = [
  {
    id: 'workflows',
    label: 'Workflows',
    icon: '⚡',
    description: 'Visual n8n-style node canvas for automated data sync, auditing, and AI pipelines',
    defaultSubView: 'builder',
    category: 'automation',
    subItems: [
      { id: 'builder', label: 'Workflow Builder', description: 'Visual drag-and-drop node graph canvas' },
      { id: 'templates', label: 'Templates', description: 'Pre-built automation blueprints' },
      { id: 'active', label: 'Active Workflows', description: 'Running background monitors and scheduled triggers' },
      { id: 'runs', label: 'Workflow Runs', description: 'Execution history, node payload inspection, and logs' },
      { id: 'automations', label: 'Automations', description: 'Event-driven triggers (auto-audit, auto-script)' }
    ]
  }
];

// 3. SUPPORTING TOOLS (Visually secondary tools)
export const SUPPORTING_TOOL_DOMAINS: DomainNavigationConfig[] = [
  {
    id: 'competitors',
    label: 'Competitor Benchmarks',
    icon: '🎯',
    description: 'Track competitor handles, follower velocity, and winning hooks',
    defaultSubView: 'overview',
    category: 'supporting'
  },
  {
    id: 'guardrails',
    label: 'Self-Learning Guardrails',
    icon: '🛡️',
    description: 'AI skill versions, performance learnings, and safety guardrails',
    defaultSubView: 'overview',
    category: 'supporting'
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: '👥',
    description: 'Editorial sign-offs, timestamped script notes, and review portal',
    defaultSubView: 'approvals',
    category: 'supporting',
    subItems: [
      { id: 'approvals', label: 'Approvals', description: 'Editorial sign-off queue' },
      { id: 'comments', label: 'Comments', description: 'Threaded feedback on active drafts' },
      { id: 'team', label: 'Team', description: 'Member roles and permissions' }
    ]
  },
  {
    id: 'settings',
    label: 'AI Models & Settings',
    icon: '⚙️',
    description: 'Meta OAuth, MCP servers, Gemini model parameters, and credentials',
    defaultSubView: 'integrations',
    category: 'supporting',
    subItems: [
      { id: 'integrations', label: 'Integrations', description: 'Meta OAuth 2.0 popup and Token Auto-Discovery' },
      { id: 'mcp', label: 'MCP', description: 'Model Context Protocol connections and server tools' },
      { id: 'ai', label: 'AI Models', description: 'Gemini model parameters and system instructions' },
      { id: 'security', label: 'Security & Vault', description: 'Live vs. Demo Sandbox mode, token encryption, and vaults' },
      { id: 'existing', label: 'General Settings', description: 'Workspace preferences and themes' }
    ]
  },
  {
    id: 'audit_history',
    label: 'Audit History',
    icon: '📜',
    description: 'Historical diagnostic profile audits, version comparisons, and logs',
    defaultSubView: 'overview',
    category: 'supporting'
  }
];

// 4. LEGACY ALIASES (For backward compatibility with existing links/handlers)
export const LEGACY_DOMAINS: DomainNavigationConfig[] = [
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '🧠',
    description: 'Diagnose account health, benchmark competitors, and detect viral content gaps.',
    defaultSubView: 'audit',
    category: 'legacy',
    subItems: [
      { id: 'audit', label: 'Page Audit', description: 'Comprehensive diagnostic profile audit and pillar breakdown' },
      { id: 'competitors', label: 'Competitors', description: 'Benchmark competitor follower counts, hooks, and formats' },
      { id: 'opportunities', label: 'Opportunities', description: 'AI-detected content pillar deficits and high-ROI angles' }
    ]
  },
  {
    id: 'content',
    label: 'Content',
    icon: '✍️',
    description: 'Ideate topics, author 4-act viral retention scripts, design slides, and repurpose assets.',
    defaultSubView: 'topics',
    category: 'legacy',
    subItems: [
      { id: 'topics', label: 'Topics', description: 'AI topic generation, pillar tagging, and approval queue' },
      { id: 'scripts', label: 'Scripts', description: '4-Act viral retention timeline (0-60s) with real-time scoring' },
      { id: 'creative', label: 'Creative', description: 'Carousel slide storyboard and reel visual asset creator' },
      { id: 'repurpose', label: 'Repurpose', description: 'Cross-platform format converter (Thread, Story, Reel)' },
      { id: 'media', label: 'Media Library', description: 'Asset repository for audio trends, b-roll, and brand clips' }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: '📊',
    description: 'Deep audience metrics, reel retention drop-off analytics, and content ROI intelligence.',
    defaultSubView: 'analytics',
    category: 'legacy',
    subItems: [
      { id: 'analytics', label: 'Analytics', description: 'Follower growth curves, reach breakdown, and engagement' },
      { id: 'performance', label: 'Performance', description: 'Reel 3-second hook retention vs 60-second completion rates' },
      { id: 'content_intelligence', label: 'Content Intelligence', description: 'Audience sentiment analysis and pillar ROI breakdown' },
      { id: 'reports', label: 'Reports', description: 'Exportable executive PDF/Markdown audit briefs and digests' }
    ]
  }
];

// Unified catalog combining all domains for lookup utilities
export const S2S_DOMAINS: DomainNavigationConfig[] = [
  ...PRIMARY_JOURNEY_DOMAINS,
  ...AUTOMATION_DOMAINS,
  ...SUPPORTING_TOOL_DOMAINS,
  ...LEGACY_DOMAINS
];

