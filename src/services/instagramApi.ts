import {
  InstagramAccount,
  InstagramAuditRecord,
  InstagramAuditMode,
  TopicIdea,
  TopicStatus,
  ContentPipelineItem,
  PipelineStage,
  ScriptItem,
  CalendarPost,
  AIConfiguration,
  AISkillRecord,
  LearningProposal,
  GenerationRecord,
  SystemReadiness,
  McpConnection,
  McpTestResult,
  TeamMember,
  SmtpConfig,
  TeamsIntegrationConfig
} from '../types/instagram';

const BASE_URL = '/api/instagram';
const MCP_BASE_URL = '/api/mcp';

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 120) || res.statusText}`);
    }
    throw new Error(`Expected JSON but received ${contentType || 'non-JSON'} from ${url}`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const instagramApi = {
  // Accounts
  async getAccounts(environment?: string): Promise<InstagramAccount[]> {
    const url = environment ? `${BASE_URL}/accounts?environment=${encodeURIComponent(environment)}` : `${BASE_URL}/accounts`;
    const data = await safeFetchJson<{ accounts: InstagramAccount[] }>(url);
    return data.accounts || [];
  },

  async saveAccount(account: Partial<InstagramAccount>): Promise<InstagramAccount> {
    const data = await safeFetchJson<{ account: InstagramAccount }>(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account)
    });
    return data.account;
  },

  async disconnectAccount(id: string): Promise<{ success: boolean; accounts: InstagramAccount[] }> {
    const data = await safeFetchJson<{ success: boolean; accounts: InstagramAccount[] }>(`${BASE_URL}/accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return data;
  },

  async connectManusAccount(params: {
    method: 'manus_instagram_login' | 'manus_browser_crawl' | 'meta_graph_api';
    username: string;
    loginIdentifier?: string;
    displayName?: string;
    bio?: string;
    category?: string;
    followersCount?: number;
    engagementRate?: number;
    metaAccessToken?: string;
    metaPageId?: string;
    isDemo?: boolean;
  }): Promise<InstagramAccount> {
    const data = await safeFetchJson<{ account: InstagramAccount }>(`${BASE_URL}/accounts/connect-manus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return data.account;
  },

  // Environment Settings
  async getEnvironment(): Promise<'demo' | 'live'> {
    const data = await safeFetchJson<{ environment: 'demo' | 'live' }>('/api/settings/environment');
    return data.environment;
  },

  async setEnvironment(environment: 'demo' | 'live'): Promise<'demo' | 'live'> {
    const data = await safeFetchJson<{ environment: 'demo' | 'live' }>('/api/settings/environment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment })
    });
    return data.environment;
  },

  // Audits
  async getAudits(accountId?: string): Promise<InstagramAuditRecord[]> {
    const url = accountId ? `${BASE_URL}/audits?accountId=${accountId}` : `${BASE_URL}/audits`;
    const data = await safeFetchJson<{ audits: InstagramAuditRecord[] }>(url);
    return data.audits || [];
  },

  async runAudit(accountId: string, auditMode: InstagramAuditMode = 'full'): Promise<InstagramAuditRecord> {
    const data = await safeFetchJson<{ audit: InstagramAuditRecord }>(`${BASE_URL}/audits/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, auditMode })
    });
    return data.audit;
  },

  // Topics
  async getTopics(accountId?: string): Promise<TopicIdea[]> {
    const url = accountId ? `${BASE_URL}/topics?accountId=${accountId}` : `${BASE_URL}/topics`;
    const data = await safeFetchJson<{ topics: TopicIdea[] }>(url);
    return data.topics || [];
  },

  async generateTopics(
    accountId: string,
    options?: { count?: number; format?: 'Reel' | 'Carousel' | 'all'; customAngle?: string } | string
  ): Promise<TopicIdea[]> {
    const payload = typeof options === 'string'
      ? { accountId, customAngle: options }
      : { accountId, count: options?.count, format: options?.format, customAngle: options?.customAngle };

    const data = await safeFetchJson<{ topics: TopicIdea[] }>(`${BASE_URL}/topics/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return data.topics || [];
  },

  async updateTopicStatus(topicId: string, status: TopicStatus): Promise<TopicIdea> {
    const res = await this.actionTopic(topicId, status === 'approved' ? 'approve' : 'reject');
    return res.topic;
  },

  async actionTopic(
    topicId: string,
    action: 'approve' | 'reject',
    options?: {
      rejectionFeedback?: { category: string; feedback: string };
      approvalNote?: string;
      category?: string;
      feedback?: string;
    }
  ): Promise<{ topic: TopicIdea; pipelineItem?: ContentPipelineItem }> {
    return safeFetchJson<{ topic: TopicIdea; pipelineItem?: ContentPipelineItem }>(`${BASE_URL}/topics/${topicId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        approvalNote: options?.approvalNote,
        rejectionFeedback: options?.rejectionFeedback,
        category: options?.category,
        feedback: options?.feedback
      })
    });
  },

  async editTopic(topicId: string, updates: Partial<TopicIdea>): Promise<TopicIdea> {
    const data = await safeFetchJson<{ topic: TopicIdea }>(`${BASE_URL}/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.topic;
  },

  async restoreTopicVersion(topicId: string, version: number): Promise<TopicIdea> {
    const data = await safeFetchJson<{ topic: TopicIdea }>(`${BASE_URL}/topics/${topicId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version })
    });
    return data.topic;
  },

  async moveTopicBack(topicId: string, targetStage: string, reason: string, user?: string): Promise<TopicIdea> {
    const data = await safeFetchJson<{ topic: TopicIdea }>(`${BASE_URL}/topics/${topicId}/move-back`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage, reason, user })
    });
    return data.topic;
  },

  async createManualTopic(topic: Partial<TopicIdea>): Promise<TopicIdea> {
    const data = await safeFetchJson<{ topic: TopicIdea }>(`${BASE_URL}/topics/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topic)
    });
    return data.topic;
  },

  async aiAssistTopic(
    topicId: string,
    prompt: string,
    instructionType?: string
  ): Promise<{ original: Partial<TopicIdea>; suggested: Partial<TopicIdea>; diffSummary: string }> {
    return safeFetchJson<{ original: Partial<TopicIdea>; suggested: Partial<TopicIdea>; diffSummary: string }>(
      `${BASE_URL}/topics/${topicId}/ai-assist`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, instructionType })
      }
    );
  },

  async moveSelectedToScripts(topicIds: string[]): Promise<{ scripts: ScriptItem[]; topics: TopicIdea[] }> {
    return safeFetchJson<{ scripts: ScriptItem[]; topics: TopicIdea[] }>(`${BASE_URL}/topics/move-to-scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicIds })
    });
  },

  // Pipeline
  async getPipeline(accountId?: string): Promise<ContentPipelineItem[]> {
    const url = accountId ? `${BASE_URL}/pipeline?accountId=${accountId}` : `${BASE_URL}/pipeline`;
    const data = await safeFetchJson<{ pipeline: ContentPipelineItem[] }>(url);
    return data.pipeline || [];
  },

  async updatePipelineStage(itemId: string, stage: PipelineStage): Promise<ContentPipelineItem> {
    const data = await safeFetchJson<{ item: ContentPipelineItem }>(`${BASE_URL}/pipeline/${itemId}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    });
    return data.item;
  },

  async movePipelineItemBack(itemId: string, targetStage: PipelineStage, reason: string, user?: string): Promise<ContentPipelineItem> {
    const data = await safeFetchJson<{ item: ContentPipelineItem }>(`${BASE_URL}/pipeline/${itemId}/move-back`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage, reason, user })
    });
    return data.item;
  },

  // Scripts
  async getScripts(accountId?: string): Promise<ScriptItem[]> {
    const url = accountId ? `${BASE_URL}/scripts?accountId=${accountId}` : `${BASE_URL}/scripts`;
    const data = await safeFetchJson<{ scripts: ScriptItem[] }>(url);
    return data.scripts || [];
  },

  async generateScript(
    accountId: string,
    topicId?: string,
    format: 'Reel' | 'Carousel' = 'Reel',
    customTitle?: string
  ): Promise<ScriptItem> {
    const data = await safeFetchJson<{ script: ScriptItem }>(`${BASE_URL}/scripts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, topicId, format, customTitle })
    });
    return data.script;
  },

  async updateScript(scriptId: string, updates: Partial<ScriptItem>): Promise<ScriptItem> {
    const data = await safeFetchJson<{ script: ScriptItem }>(`${BASE_URL}/scripts/${scriptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.script;
  },

  async createManualScript(data: Partial<ScriptItem>): Promise<ScriptItem> {
    const res = await safeFetchJson<{ script: ScriptItem }>(`${BASE_URL}/scripts/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.script;
  },

  async aiAssistScript(
    scriptId: string,
    action: string,
    customPrompt?: string,
    currentText?: string
  ): Promise<{ original: string; suggested: string; diffSummary: string }> {
    return safeFetchJson<{ original: string; suggested: string; diffSummary: string }>(
      `${BASE_URL}/scripts/${scriptId}/ai-assist`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, customPrompt, currentText })
      }
    );
  },

  async scoreScript(scriptId: string, currentText?: string): Promise<{
    score: number;
    breakdown: { hook: number; clarity: number; engagement: number; flow: number; cta: number; instagramFit: number };
    suggestions: string[];
  }> {
    return safeFetchJson<{
      score: number;
      breakdown: { hook: number; clarity: number; engagement: number; flow: number; cta: number; instagramFit: number };
      suggestions: string[];
    }>(`${BASE_URL}/scripts/${scriptId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentText })
    });
  },

  async convertScriptToScenes(scriptId: string, currentText?: string): Promise<{ scenes: any[] }> {
    return safeFetchJson<{ scenes: any[] }>(`${BASE_URL}/scripts/${scriptId}/convert-to-scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentText })
    });
  },

  async convertScenesToText(scriptId: string, scenes: any[]): Promise<{ text: string }> {
    return safeFetchJson<{ text: string }>(`${BASE_URL}/scripts/${scriptId}/convert-to-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes })
    });
  },

  async sendScriptToAgency(scriptId: string, agencyPackage: any): Promise<{ script: ScriptItem; success: boolean }> {
    return safeFetchJson<{ script: ScriptItem; success: boolean }>(`${BASE_URL}/scripts/${scriptId}/send-to-agency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agencyPackage)
    });
  },

  // Calendar
  async getCalendar(accountId?: string): Promise<CalendarPost[]> {
    const url = accountId ? `${BASE_URL}/calendar?accountId=${accountId}` : `${BASE_URL}/calendar`;
    const data = await safeFetchJson<{ calendar: CalendarPost[] }>(url);
    return data.calendar || [];
  },

  async updateCalendarPost(postId: string, updates: Partial<CalendarPost>): Promise<CalendarPost> {
    const data = await safeFetchJson<{ post: CalendarPost }>(`${BASE_URL}/calendar/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.post;
  },

  async scheduleScript(data: {
    scriptId?: string;
    title: string;
    format: string;
    scheduledDate: string;
    scheduledTime?: string;
    status?: string;
    accountId?: string;
    pillar?: string;
    pipelineItemId?: string;
  }): Promise<CalendarPost> {
    const res = await safeFetchJson<{ post: CalendarPost }>(`${BASE_URL}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.post;
  },

  // AI Config
  async getAiConfig(): Promise<AIConfiguration> {
    const data = await safeFetchJson<{ config: AIConfiguration }>(`${BASE_URL}/ai-config`);
    return data.config;
  },

  async updateAiConfig(config: Partial<AIConfiguration>): Promise<AIConfiguration> {
    const data = await safeFetchJson<{ config: AIConfiguration }>(`${BASE_URL}/ai-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return data.config;
  },

  async testProviderConnection(
    provider: string,
    apiKeyOverride?: string
  ): Promise<{ status: string; message: string }> {
    return safeFetchJson<{ status: string; message: string }>(`${BASE_URL}/ai-test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKeyOverride })
    });
  },

  // Skills
  async getSkills(): Promise<{ skills: AISkillRecord[]; activeSkill: AISkillRecord }> {
    const data = await safeFetchJson<{ skills: AISkillRecord[]; activeSkill: AISkillRecord }>(`${BASE_URL}/skills`);
    return { skills: data.skills || [], activeSkill: data.activeSkill };
  },

  async rollbackSkill(version: string): Promise<AISkillRecord> {
    const data = await safeFetchJson<{ activeSkill: AISkillRecord }>(`${BASE_URL}/skills/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version })
    });
    return data.activeSkill;
  },

  // Learning Proposals
  async getLearningProposals(): Promise<LearningProposal[]> {
    const data = await safeFetchJson<{ proposals: LearningProposal[] }>(`${BASE_URL}/learning/proposals`);
    return data.proposals || [];
  },

  async actionProposal(
    id: string,
    action: 'approve' | 'reject',
    customRule?: string
  ): Promise<any> {
    return safeFetchJson<any>(`${BASE_URL}/learning/proposal/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, customRule })
    });
  },

  // Generations
  async getGenerations(): Promise<GenerationRecord[]> {
    const data = await safeFetchJson<{ generations: GenerationRecord[] }>(`${BASE_URL}/generations`);
    return data.generations || [];
  },

  async getGeneration(id: string): Promise<GenerationRecord> {
    const data = await safeFetchJson<{ generation: GenerationRecord }>(`${BASE_URL}/generations/${id}`);
    return data.generation;
  },

  // Readiness & Reset
  async getReadinessCheck(): Promise<SystemReadiness> {
    const data = await safeFetchJson<{ readiness: SystemReadiness }>(`${BASE_URL}/readiness-check`);
    return data.readiness;
  },

  async resetRecommendedConfig(): Promise<AIConfiguration> {
    const data = await safeFetchJson<{ config: AIConfiguration }>(`${BASE_URL}/reset-recommended-config`, {
      method: 'POST'
    });
    return data.config;
  },

  async exportConfig(): Promise<string> {
    const data = await safeFetchJson<{ configJson: string }>(`${BASE_URL}/export-config`);
    return data.configJson;
  },

  async importConfig(configJson: string): Promise<AIConfiguration> {
    const data = await safeFetchJson<{ config: AIConfiguration }>(`${BASE_URL}/import-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configJson })
    });
    return data.config;
  },

  // MCP (Model Context Protocol) Connections
  async getMcpConnections(): Promise<McpConnection[]> {
    const data = await safeFetchJson<{ connections: McpConnection[] }>(`${MCP_BASE_URL}/connections`);
    return data.connections || [];
  },

  async saveMcpConnection(conn: {
    name: string;
    transport: 'sse' | 'stdio';
    serverUrl: string;
    authMethod: 'none' | 'bearer' | 'basic' | 'custom_header';
    secretKey?: string;
    headers?: Record<string, string>;
    envVars?: Record<string, string>;
    allowDestructive?: boolean;
    enabled?: boolean;
  }): Promise<McpConnection> {
    const data = await safeFetchJson<{ connection: McpConnection }>(`${MCP_BASE_URL}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conn)
    });
    return data.connection;
  },

  async updateMcpConnection(id: string, updates: Partial<McpConnection>): Promise<McpConnection> {
    const data = await safeFetchJson<{ connection: McpConnection }>(`${MCP_BASE_URL}/connections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.connection;
  },

  async deleteMcpConnection(id: string): Promise<boolean> {
    const data = await safeFetchJson<{ success: boolean }>(`${MCP_BASE_URL}/connections/${id}`, {
      method: 'DELETE'
    });
    return !!data.success;
  },

  async testMcpConnection(id: string): Promise<McpTestResult> {
    return safeFetchJson<McpTestResult>(`${MCP_BASE_URL}/connections/${id}/test`, {
      method: 'POST'
    });
  },

  async testMcpConfig(config: any): Promise<McpTestResult> {
    return safeFetchJson<McpTestResult>(`${MCP_BASE_URL}/test-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  async toggleMcpTool(connectionId: string, toolName: string, enabled: boolean): Promise<McpConnection> {
    const data = await safeFetchJson<{ connection: McpConnection }>(`${MCP_BASE_URL}/connections/${connectionId}/tools/${encodeURIComponent(toolName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    return data.connection;
  },

  async updateMcpPermissions(connectionId: string, allowDestructive: boolean): Promise<McpConnection> {
    const res = await fetch(`${MCP_BASE_URL}/connections/${connectionId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowDestructive })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update connection permissions');
    return data.connection;
  },

  // Backward compatibility & convenience helpers
  async getSelectedAccount(): Promise<InstagramAccount> {
    const accounts = await this.getAccounts();
    return accounts[0];
  },

  async updateAccount(account: Partial<InstagramAccount>): Promise<InstagramAccount> {
    return this.saveAccount(account);
  },

  async getAuditHistory(accountId?: string): Promise<InstagramAuditRecord[]> {
    return this.getAudits(accountId);
  },

  async triggerAudit(mode: InstagramAuditMode = 'full', accountId: string = 'bajajfinance'): Promise<InstagramAuditRecord> {
    return this.runAudit(accountId, mode);
  },

  async getConfiguration(): Promise<AIConfiguration> {
    return this.getAiConfig();
  },

  async updateConfiguration(config: Partial<AIConfiguration>): Promise<AIConfiguration> {
    return this.updateAiConfig(config);
  },

  async resetToRecommendedConfig(): Promise<AIConfiguration> {
    return this.resetRecommendedConfig();
  },

  async getSkillHistory(): Promise<AISkillRecord[]> {
    const res = await this.getSkills();
    return res.skills;
  },

  async getGenerationHistory(): Promise<GenerationRecord[]> {
    return this.getGenerations();
  },

  async approveTopic(topicId: string, note?: string): Promise<TopicIdea> {
    const res = await this.actionTopic(topicId, 'approve', { approvalNote: note });
    return res.topic;
  },

  async rejectTopic(topicId: string, categoryOrReason?: string, feedback?: string): Promise<TopicIdea> {
    const cat = feedback !== undefined ? categoryOrReason || 'user_rejection' : 'user_rejection';
    const fb = feedback !== undefined ? feedback : (categoryOrReason || 'Rejected by user');
    const res = await this.actionTopic(topicId, 'reject', {
      category: cat,
      feedback: fb,
      rejectionFeedback: { category: cat, feedback: fb }
    });
    return res.topic;
  },

  async actionLearningProposal(id: string, action: 'approved' | 'rejected', customRule?: string): Promise<any> {
    return this.actionProposal(id, action === 'approved' ? 'approve' : 'reject', customRule);
  },

  async moveBackTopic(topicId: string, targetStage: string, reason: string, user?: string): Promise<TopicIdea> {
    return this.moveTopicBack(topicId, targetStage, reason, user);
  },

  // Bulk Script Actions
  async bulkActionScripts(scriptIds: string[], action: string, payload?: any): Promise<{ success: boolean; count: number; scripts?: ScriptItem[] }> {
    return safeFetchJson<{ success: boolean; count: number; scripts?: ScriptItem[] }>(`${BASE_URL}/scripts/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptIds, action, payload })
    });
  },

  // Team Management
  async getTeamMembers(): Promise<TeamMember[]> {
    const data = await safeFetchJson<{ members: TeamMember[] }>(`${BASE_URL}/team`);
    return data.members || [];
  },

  async addTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
    const data = await safeFetchJson<{ member: TeamMember }>(`${BASE_URL}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    return data.member;
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const data = await safeFetchJson<{ member: TeamMember }>(`${BASE_URL}/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.member;
  },

  async deleteTeamMember(id: string): Promise<boolean> {
    const data = await safeFetchJson<{ success: boolean }>(`${BASE_URL}/team/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  // SMTP Settings
  async getSmtpConfig(): Promise<SmtpConfig> {
    const data = await safeFetchJson<{ config: SmtpConfig }>(`${BASE_URL}/smtp`);
    return data.config;
  },

  async updateSmtpConfig(config: Partial<SmtpConfig>): Promise<SmtpConfig> {
    const data = await safeFetchJson<{ config: SmtpConfig }>(`${BASE_URL}/smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return data.config;
  },

  async testSmtpConnection(recipient?: string): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`${BASE_URL}/smtp/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient })
    });
  },

  // Teams & Power Automate Integration
  async getTeamsConfig(): Promise<TeamsIntegrationConfig> {
    const data = await safeFetchJson<{ config: TeamsIntegrationConfig }>(`${BASE_URL}/integrations/teams`);
    return data.config;
  },

  async updateTeamsConfig(config: Partial<TeamsIntegrationConfig>): Promise<TeamsIntegrationConfig> {
    const data = await safeFetchJson<{ config: TeamsIntegrationConfig }>(`${BASE_URL}/integrations/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return data.config;
  },

  async testTeamsWebhook(webhookUrl?: string): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`${BASE_URL}/integrations/teams/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl })
    });
  },

  async sendTopicsToTeams(topicIds?: string[]): Promise<{ success: boolean; count: number; message: string }> {
    return safeFetchJson<{ success: boolean; count: number; message: string }>(`${BASE_URL}/integrations/teams/send-topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicIds })
    });
  },

  async sendScriptToTeams(scriptId: string): Promise<{ success: boolean; scriptId: string; message: string }> {
    return safeFetchJson<{ success: boolean; scriptId: string; message: string }>(`${BASE_URL}/integrations/teams/send-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId })
    });
  },

  // Audit Guardrail Learning
  async injectAuditGuardrail(auditId: string, rule: string, reason?: string): Promise<{ success: boolean; skill: AISkillRecord }> {
    return safeFetchJson<{ success: boolean; skill: AISkillRecord }>(`${BASE_URL}/audits/guardrail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId, rule, reason })
    });
  },

  // Helpers for Topics & Scripts
  async bulkSendToScripts(topicIds: string[]): Promise<{ scripts: ScriptItem[]; createdScripts?: ScriptItem[] }> {
    const res = await this.moveSelectedToScripts(topicIds);
    return { scripts: res.scripts, createdScripts: res.scripts };
  },

  async bulkActionTopics(
    topicIds: string[],
    action: 'approve' | 'reject' | 'delete' | 'change_format' | 'move_to_scripts',
    payload?: any
  ): Promise<{ success: boolean; count: number; updatedTopics?: TopicIdea[]; createdScripts?: ScriptItem[] }> {
    return safeFetchJson<{ success: boolean; count: number; updatedTopics?: TopicIdea[]; createdScripts?: ScriptItem[] }>(
      `${BASE_URL}/topics/bulk-action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds, action, payload })
      }
    );
  },

  async saveScript(script: ScriptItem): Promise<ScriptItem> {
    return this.updateScript(script.id, script);
  }
};
