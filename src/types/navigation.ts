export type DomainId =
  | 'home'
  | 'strategy'
  | 'content'
  | 'workflows'
  | 'publishing'
  | 'intelligence'
  | 'collaboration'
  | 'settings';

export type StrategySubView = 'audit' | 'competitors' | 'opportunities';
export type ContentSubView = 'topics' | 'scripts' | 'creative' | 'repurpose' | 'media';
export type WorkflowsSubView = 'builder' | 'templates' | 'active' | 'runs' | 'automations';
export type PublishingSubView = 'calendar' | 'swimlane' | 'campaigns' | 'scheduler';
export type IntelligenceSubView = 'analytics' | 'performance' | 'content_intelligence' | 'reports';
export type CollaborationSubView = 'approvals' | 'comments' | 'team' | 'client_portal';
export type SettingsSubView = 'integrations' | 'mcp' | 'ai' | 'security' | 'existing';

export type SubViewId =
  | StrategySubView
  | ContentSubView
  | WorkflowsSubView
  | PublishingSubView
  | IntelligenceSubView
  | CollaborationSubView
  | SettingsSubView
  | 'overview';

export interface DomainNavigationConfig {
  id: DomainId;
  label: string;
  icon: string;
  description: string;
  defaultSubView: SubViewId;
  subItems: {
    id: SubViewId;
    label: string;
    description: string;
    badge?: string;
  }[];
}

export const S2S_DOMAINS: DomainNavigationConfig[] = [
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '🧠',
    description: 'Diagnose account health, benchmark competitors, and detect viral content gaps.',
    defaultSubView: 'audit',
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
    subItems: [
      { id: 'topics', label: 'Topics', description: 'AI topic generation, pillar tagging, and approval queue' },
      { id: 'scripts', label: 'Scripts', description: '4-Act viral retention timeline (0-60s) with real-time scoring' },
      { id: 'creative', label: 'Creative', description: 'Carousel slide storyboard and reel visual asset creator' },
      { id: 'repurpose', label: 'Repurpose', description: 'Cross-platform format converter (Thread, Story, Reel)' },
      { id: 'media', label: 'Media Library', description: 'Asset repository for audio trends, b-roll, and brand clips' }
    ]
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: '⚡',
    description: 'Visual n8n-style node canvas for automated data sync, auditing, and AI script generation.',
    defaultSubView: 'builder',
    subItems: [
      { id: 'builder', label: 'Workflow Builder', description: 'Visual drag-and-drop node graph canvas with live debugging' },
      { id: 'templates', label: 'Templates', description: 'Pre-built automation workflows and social pipeline blueprints' },
      { id: 'active', label: 'Active Workflows', description: 'Running background monitors and scheduled triggers' },
      { id: 'runs', label: 'Workflow Runs', description: 'Execution history, node payload inspection, and logs' },
      { id: 'automations', label: 'Automations', description: 'Event-driven triggers (auto-audit, auto-script on approval)' }
    ]
  },
  {
    id: 'publishing',
    label: 'Publishing',
    icon: '📅',
    description: 'Plan peak-hour publication slots, monitor Kanban pipeline progress, and organize campaigns.',
    defaultSubView: 'calendar',
    subItems: [
      { id: 'calendar', label: 'Calendar', description: 'Monthly and weekly schedule with 18:30 peak engagement slots' },
      { id: 'swimlane', label: 'Swimlane', description: 'Kanban content pipeline across 5 production stages' },
      { id: 'campaigns', label: 'Campaigns', description: 'Multi-post initiative tracking and promotional sprints' },
      { id: 'scheduler', label: 'Scheduler', description: 'Queue configuration and auto-publishing rules' }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: '📊',
    description: 'Deep audience metrics, reel retention drop-off analytics, and content ROI intelligence.',
    defaultSubView: 'analytics',
    subItems: [
      { id: 'analytics', label: 'Analytics', description: 'Follower growth curves, reach breakdown, and engagement' },
      { id: 'performance', label: 'Performance', description: 'Reel 3-second hook retention vs 60-second completion rates' },
      { id: 'content_intelligence', label: 'Content Intelligence', description: 'Audience sentiment analysis and pillar ROI breakdown' },
      { id: 'reports', label: 'Reports', description: 'Exportable executive PDF/Markdown audit briefs and digests' }
    ]
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: '👥',
    description: 'Editorial sign-offs, timestamped script revision notes, and client review portals.',
    defaultSubView: 'approvals',
    subItems: [
      { id: 'approvals', label: 'Approvals', description: 'Editorial sign-off queue for topics and scripts' },
      { id: 'comments', label: 'Comments', description: 'Threaded feedback notes on active script drafts' },
      { id: 'team', label: 'Team', description: 'Member roles, permissions, and audit log tracking' },
      { id: 'client_portal', label: 'Client Portal', description: 'External stakeholder presentation and approval view' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Meta Graph API OAuth connectors, MCP server configurations, AI models, and credentials.',
    defaultSubView: 'integrations',
    subItems: [
      { id: 'integrations', label: 'Integrations', description: 'Meta OAuth 2.0 popup and Token Auto-Discovery' },
      { id: 'mcp', label: 'MCP', description: 'Model Context Protocol connections and server tools' },
      { id: 'ai', label: 'AI', description: 'Gemini model parameters, system instructions, and skills' },
      { id: 'security', label: 'Security', description: 'Live vs. Demo Sandbox mode, token encryption, and vaults' },
      { id: 'existing', label: 'Existing Settings', description: 'Workspace preferences, themes, notifications, and export' }
    ]
  }
];
