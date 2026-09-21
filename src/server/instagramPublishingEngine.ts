import {
  PublicationSnapshot,
  CalendarPost,
  PublishJobRecord,
  InstagramAccount
} from '../types/instagram';
import dns from 'dns';

// =============================================================================
// CREDENTIAL SANITIZATION HELPERS
// =============================================================================

export function sanitizeErrorMessage(msg: string): string {
  if (!msg) return msg;
  return msg
    .replace(/access_token=[^&\s]+/g, 'access_token=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/EA[A-Za-z0-9_-]{10,}/g, '[REDACTED_META_TOKEN]');
}

export function sanitizeMetaUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    if (url.searchParams.has('access_token')) {
      url.searchParams.set('access_token', '[REDACTED]');
    }
    return url.toString();
  } catch {
    return sanitizeErrorMessage(urlStr);
  }
}

// =============================================================================
// STATE MACHINE TRANSITION GUARDS (PRIORITY 3)
// =============================================================================

export type ExecutionStatus = 'IDLE' | 'QUEUED' | 'VALIDATING' | 'PUBLISHING' | 'VERIFYING' | 'PUBLISHED' | 'FAILED' | 'RETRY_PENDING' | 'CANCELLED';

export const ALLOWED_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
  IDLE: ['QUEUED', 'VALIDATING', 'CANCELLED'],
  QUEUED: ['VALIDATING', 'CANCELLED', 'FAILED'],
  VALIDATING: ['PUBLISHING', 'FAILED', 'RETRY_PENDING', 'CANCELLED'],
  PUBLISHING: ['VERIFYING', 'FAILED', 'RETRY_PENDING', 'CANCELLED'],
  VERIFYING: ['PUBLISHED', 'FAILED', 'RETRY_PENDING'], // CANCELLED is strictly forbidden once media_publish has been dispatched!
  PUBLISHED: [], // Terminal!
  FAILED: ['QUEUED', 'IDLE'], // Can be retried
  RETRY_PENDING: ['QUEUED', 'CANCELLED'],
  CANCELLED: [] // Terminal!
};

export function canTransition(current: ExecutionStatus, next: ExecutionStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function validateTransition(job: PublishJobRecord, nextStatus: ExecutionStatus): void {
  if (!canTransition(job.executionStatus as ExecutionStatus, nextStatus)) {
    throw new Error(`Illegal state transition for job ${job.id}: cannot transition from '${job.executionStatus}' to '${nextStatus}'.`);
  }
}

// =============================================================================
// IP & SSRF VALIDATION HELPERS (PRIORITY 4)
// =============================================================================

export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return false;
  const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();

  // IPv4 Loopback & Private & Reserved
  if (cleanIp === '0.0.0.0' || cleanIp.startsWith('0.')) return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  if (/^198\.(1[89])\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;

  // IPv6 Loopback, Link-Local, Unique-Local
  if (cleanIp === '::1' || cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:1' || cleanIp === '0:0:0:0:0:0:0:0') return true;
  if (cleanIp.startsWith('fe80:')) return true;
  if (cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd00:') || /^f[cd][0-9a-f]{2}:/i.test(cleanIp)) return true;

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith('::ffff:')) {
    const mapped = cleanIp.substring(7);
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(mapped)) {
      return isPrivateOrReservedIp(mapped);
    }
    const hexParts = mapped.split(':');
    if (hexParts.length === 2) {
      const high = parseInt(hexParts[0], 16);
      const low = parseInt(hexParts[1], 16);
      const b1 = (high >> 8) & 0xff;
      const b2 = high & 0xff;
      const b3 = (low >> 8) & 0xff;
      const b4 = low & 0xff;
      return isPrivateOrReservedIp(`${b1}.${b2}.${b3}.${b4}`);
    }
    return true; // Any other ::ffff: address is reserved
  }

  return false;
}

// =============================================================================
// STRUCTURED ERROR CLASSIFIER (PRIORITY 5)
// =============================================================================

export interface ErrorClassification {
  category: 'TRANSIENT' | 'AUTH' | 'MEDIA' | 'RATE_LIMIT' | 'PERMANENT';
  isTransient: boolean;
  errorCode: string;
  errorMessage: string;
}

export function classifyPublishingError(err: any): ErrorClassification {
  const message = sanitizeErrorMessage(err?.message || (typeof err === 'string' ? err : 'Unknown error'));
  const httpStatus = err?.httpStatus || err?.status;
  const metaErrorCode = err?.metaErrorCode || err?.error?.code || err?.code;
  const metaSubcode = err?.metaErrorSubcode || err?.error?.error_subcode;

  // 1. Check HTTP Status
  if (httpStatus) {
    const statusNum = Number(httpStatus);
    if (statusNum === 401 || statusNum === 403) {
      return { category: 'AUTH', isTransient: false, errorCode: 'ERR_AUTH_FAILED', errorMessage: message };
    }
    if (statusNum === 429) {
      return { category: 'RATE_LIMIT', isTransient: true, errorCode: 'ERR_RATE_LIMIT', errorMessage: message };
    }
    if (statusNum >= 500 && statusNum <= 504) {
      return { category: 'TRANSIENT', isTransient: true, errorCode: `ERR_HTTP_${statusNum}`, errorMessage: message };
    }
  }

  // 2. Check Meta Error Codes
  if (metaErrorCode) {
    const codeNum = Number(metaErrorCode);
    if (codeNum === 190 || codeNum === 102 || codeNum === 10) {
      return { category: 'AUTH', isTransient: false, errorCode: 'ERR_META_AUTH', errorMessage: message };
    }
    if (codeNum === 4 || codeNum === 17 || codeNum === 32 || codeNum === 613) {
      return { category: 'RATE_LIMIT', isTransient: true, errorCode: 'ERR_META_RATE_LIMIT', errorMessage: message };
    }
    if (codeNum === 1 || codeNum === 2) {
      return { category: 'TRANSIENT', isTransient: true, errorCode: 'ERR_META_TEMPORARY', errorMessage: message };
    }
    if (codeNum === 100 || metaSubcode === 2207001) {
      return { category: 'MEDIA', isTransient: false, errorCode: 'ERR_META_MEDIA_SPEC', errorMessage: message };
    }
  }

  // 3. Check Network Error Codes
  const networkCode = err?.code || '';
  if (typeof networkCode === 'string') {
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(networkCode)) {
      return { category: 'TRANSIENT', isTransient: true, errorCode: networkCode, errorMessage: message };
    }
  }

  // 4. Structured Regex Matching on Message (Word boundaries, NOT loose substring "500"!)
  if (/\b(OAuthException|access[-_ ]?token|invalid[-_ ]?token|permission)\b/i.test(message)) {
    return { category: 'AUTH', isTransient: false, errorCode: 'ERR_AUTH_FAILED', errorMessage: message };
  }
  if (/\b(ERR_INVALID_MEDIA_URL|ERR_MEDIA_SPEC_VIOLATION|ERR_MEDIA_UNREACHABLE|ERR_CAPTION_LIMIT_EXCEEDED|ERR_HASHTAG_LIMIT_EXCEEDED)\b/.test(message)) {
    return { category: 'MEDIA', isTransient: false, errorCode: 'ERR_MEDIA_VIOLATION', errorMessage: message };
  }
  if (/\b(500|502|503|504)\b/.test(message) && /\b(HTTP|status|gateway|server error|unavailable)\b/i.test(message)) {
    return { category: 'TRANSIENT', isTransient: true, errorCode: 'ERR_SERVER_ERROR', errorMessage: message };
  }
  if (/\b(ETIMEDOUT|ECONNRESET|timeout|timed out)\b/i.test(message)) {
    return { category: 'TRANSIENT', isTransient: true, errorCode: 'ERR_TIMEOUT', errorMessage: message };
  }
  if (/\b(rate[-_ ]?limit|quota[-_ ]?exceeded)\b/i.test(message)) {
    return { category: 'RATE_LIMIT', isTransient: true, errorCode: 'ERR_RATE_LIMIT', errorMessage: message };
  }

  // Default: PERMANENT failure
  return {
    category: 'PERMANENT',
    isTransient: false,
    errorCode: err?.code || 'ERR_PUBLISH_FAILED',
    errorMessage: message
  };
}

// =============================================================================
// 1. META GRAPH API CLIENT
// =============================================================================

export interface MetaContainerResult {
  containerId: string;
}

export interface MetaPollResult {
  statusCode: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' | 'EXPIRED' | 'PUBLISHED';
  statusMessage?: string;
}

export interface MetaPublishResult {
  mediaId: string;
}

export interface MetaVerifyResult {
  id: string;
  permalink: string;
  publishedAt: string;
}

export interface MetaReconciliationQuery {
  metaMediaId?: string;
  metaContainerId?: string;
  idempotencyKey?: string;
  jobId?: string;
  expectedCaption?: string;
  createdAfter?: Date;
}

export interface MetaReconciliationResult {
  found: boolean;
  mediaId?: string;
  permalink?: string;
  publishedAt?: string;
  reconciledVia: 'MEDIA_ID' | 'CONTAINER_ID' | 'RECENT_MEDIA_FEED' | 'NONE';
}

export class MetaGraphApiClient {
  // Configurable hooks for automated tests
  public onChildContainerCreated?: (childId: string, slideIndex: number) => void;
  public onChildContainerPolled?: (childId: string, status: string) => void;
  public onParentContainerCreated?: (parentId: string, childIds: string[]) => void;
  public pollContainerStatusOverride?: (containerId: string) => Promise<MetaPollResult> | null;
  public reconcileOverride?: (
    account: InstagramAccount,
    query: MetaReconciliationQuery
  ) => Promise<MetaReconciliationResult> | null;

  private isSimulation(account?: InstagramAccount): boolean {
    if (!account) return true;
    if (account.isDemo || !account.metaAccessToken || account.connectionMethod !== 'meta_graph_api') {
      return true;
    }
    return false;
  }

  async checkPublishingLimit(account: InstagramAccount, signal?: AbortSignal): Promise<{ quotaTotal: number; quotaUsage: number }> {
    if (this.isSimulation(account)) {
      return { quotaTotal: 50, quotaUsage: 2 };
    }
    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/content_publishing_limit`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      signal
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(sanitizeErrorMessage(`Failed to query publishing limit: ${res.statusText} ${errText}`));
    }
    const data = await res.json();
    return {
      quotaTotal: data.data?.[0]?.quota_total || 50,
      quotaUsage: data.data?.[0]?.quota_usage || 0
    };
  }

  async createReelContainer(
    account: InstagramAccount,
    params: { videoUrl: string; coverUrl?: string; caption: string; shareToFeed?: boolean },
    signal?: AbortSignal
  ): Promise<MetaContainerResult> {
    if (this.isSimulation(account)) {
      const simulatedContainerId = `meta-reel-cont-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return { containerId: simulatedContainerId };
    }

    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const body: Record<string, any> = {
      media_type: 'REELS',
      video_url: params.videoUrl,
      caption: params.caption,
      share_to_feed: params.shareToFeed ?? true
    };
    if (params.coverUrl) {
      body.cover_url = params.coverUrl;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(errData.error?.message || `Failed to create Reel container: ${res.statusText}`));
    }
    const data = await res.json();
    return { containerId: data.id };
  }

  async createCarouselItemContainer(
    account: InstagramAccount,
    params: { imageUrl: string },
    signal?: AbortSignal
  ): Promise<MetaContainerResult> {
    if (this.isSimulation(account)) {
      const simulatedId = `meta-car-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return { containerId: simulatedId };
    }

    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        is_carousel_item: true
      }),
      signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(errData.error?.message || `Failed to create carousel item container: ${res.statusText}`));
    }
    const data = await res.json();
    return { containerId: data.id };
  }

  async createCarouselParentContainer(
    account: InstagramAccount,
    params: { childContainerIds: string[]; caption: string },
    signal?: AbortSignal
  ): Promise<MetaContainerResult> {
    if (this.isSimulation(account)) {
      const simulatedId = `meta-car-parent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      if (this.onParentContainerCreated) {
        this.onParentContainerCreated(simulatedId, params.childContainerIds);
      }
      return { containerId: simulatedId };
    }

    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: params.childContainerIds.join(','),
        caption: params.caption
      }),
      signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(errData.error?.message || `Failed to create parent carousel container: ${res.statusText}`));
    }
    const data = await res.json();
    if (this.onParentContainerCreated) {
      this.onParentContainerCreated(data.id, params.childContainerIds);
    }
    return { containerId: data.id };
  }

  async createImageContainer(
    account: InstagramAccount,
    params: { imageUrl: string; caption: string },
    signal?: AbortSignal
  ): Promise<MetaContainerResult> {
    if (this.isSimulation(account)) {
      const simulatedId = `meta-img-cont-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return { containerId: simulatedId };
    }

    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        caption: params.caption
      }),
      signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(errData.error?.message || `Failed to create image container: ${res.statusText}`));
    }
    const data = await res.json();
    return { containerId: data.id };
  }

  async pollContainerStatus(
    containerId: string,
    account: InstagramAccount,
    maxWaitMs: number = 180000,
    signal?: AbortSignal
  ): Promise<MetaPollResult> {
    if (this.pollContainerStatusOverride) {
      const overridden = await this.pollContainerStatusOverride(containerId);
      if (overridden) return overridden;
    }

    if (this.isSimulation(account)) {
      return { statusCode: 'FINISHED' };
    }

    const startTime = Date.now();
    const url = `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status`;

    while (Date.now() - startTime < maxWaitMs) {
      if (signal?.aborted) {
        throw new Error('Container status polling aborted');
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${account.metaAccessToken}`
        },
        signal
      });
      if (!res.ok) {
        return { statusCode: 'ERROR', statusMessage: `HTTP ${res.status}` };
      }
      const data = await res.json();
      const code = data.status_code;
      if (code === 'FINISHED' || code === 'PUBLISHED' || code === 'ERROR' || code === 'EXPIRED') {
        return { statusCode: code, statusMessage: data.status };
      }
      // Wait 3 seconds before next poll
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 3000);
        signal?.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Container status polling aborted'));
        }, { once: true });
      });
    }

    return { statusCode: 'IN_PROGRESS', statusMessage: `Timed out after ${Math.round(maxWaitMs / 1000)}s polling container status` };
  }

  async publishContainer(
    account: InstagramAccount,
    containerId: string,
    signal?: AbortSignal
  ): Promise<MetaPublishResult> {
    if (this.isSimulation(account)) {
      const simulatedMediaId = `ig-media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      return { mediaId: simulatedMediaId };
    }

    const igUserId = account.instagramBusinessId || account.id;
    const url = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      body: JSON.stringify({
        creation_id: containerId
      }),
      signal
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(errData.error?.message || `Failed to publish container: ${res.statusText}`));
    }
    const data = await res.json();
    return { mediaId: data.id };
  }

  async verifyPublishedMedia(
    account: InstagramAccount,
    mediaId: string,
    signal?: AbortSignal
  ): Promise<MetaVerifyResult> {
    if (this.isSimulation(account)) {
      const permalink = `https://www.instagram.com/p/${Math.random().toString(36).substring(2, 11)}/`;
      return {
        id: mediaId,
        permalink,
        publishedAt: new Date().toISOString()
      };
    }

    const url = `https://graph.facebook.com/v21.0/${mediaId}?fields=id,permalink,timestamp`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${account.metaAccessToken}`
      },
      signal
    });
    if (!res.ok) {
      throw new Error(sanitizeErrorMessage(`Failed to verify published media: ${res.statusText}`));
    }
    const data = await res.json();
    return {
      id: data.id,
      permalink: data.permalink || `https://www.instagram.com/p/live/`,
      publishedAt: data.timestamp || new Date().toISOString()
    };
  }

  // Durable Reconciliation Strategy (Priority 1)
  // Queries stored media ID or Instagram recent media feed to determine if publication already exists
  async reconcileRecentMedia(
    account: InstagramAccount,
    query: MetaReconciliationQuery,
    signal?: AbortSignal
  ): Promise<MetaReconciliationResult> {
    if (this.reconcileOverride) {
      const overridden = await this.reconcileOverride(account, query);
      if (overridden) return overridden;
    }

    if (this.isSimulation(account)) {
      if (query.metaMediaId) {
        return {
          found: true,
          mediaId: query.metaMediaId,
          permalink: `https://www.instagram.com/p/simulated_${query.metaMediaId}/`,
          publishedAt: new Date().toISOString(),
          reconciledVia: 'MEDIA_ID'
        };
      }
      return { found: false, reconciledVia: 'NONE' };
    }

    // 1. Check stored metaMediaId if available
    if (query.metaMediaId) {
      try {
        const verify = await this.verifyPublishedMedia(account, query.metaMediaId, signal);
        if (verify && verify.id) {
          return {
            found: true,
            mediaId: verify.id,
            permalink: verify.permalink,
            publishedAt: verify.publishedAt,
            reconciledVia: 'MEDIA_ID'
          };
        }
      } catch {
        // Media ID not verified
      }
    }

    // 2. Query recent media from Instagram account (up to last 15 posts)
    try {
      const igUserId = account.instagramBusinessId || account.id;
      const url = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,media_type,timestamp,permalink&limit=15`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${account.metaAccessToken}`
        },
        signal
      });

      if (res.ok) {
        const data = await res.json();
        const posts: Array<{ id: string; caption?: string; timestamp: string; permalink: string }> = data.data || [];

        const cutoffTime = query.createdAfter
          ? new Date(query.createdAfter.getTime() - 10 * 60 * 1000)
          : new Date(Date.now() - 2 * 60 * 60 * 1000);

        for (const post of posts) {
          const postTime = new Date(post.timestamp);
          if (postTime >= cutoffTime) {
            const postCaption = post.caption || '';
            const matchesIdempotency = (query.idempotencyKey && postCaption.includes(query.idempotencyKey)) ||
                                       (query.jobId && postCaption.includes(query.jobId));
            const matchesCaption = query.expectedCaption && postCaption.trim() === query.expectedCaption.trim();

            if (matchesIdempotency || matchesCaption) {
              return {
                found: true,
                mediaId: post.id,
                permalink: post.permalink,
                publishedAt: post.timestamp,
                reconciledVia: 'RECENT_MEDIA_FEED'
              };
            }
          }
        }
      }
    } catch (feedErr) {
      console.warn('[MetaGraphApiClient] Failed to query recent media for reconciliation:', feedErr);
    }

    return { found: false, reconciledVia: 'NONE' };
  }
}

// =============================================================================
// 2. PRE-FLIGHT VALIDATOR
// =============================================================================

export interface PreflightCheckResult {
  passed: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export class PreflightValidator {
  /**
   * Strictly validates that a URL is a publicly accessible HTTPS URL.
   * Rejects: file://, filesystem paths, non-https, localhost, 127.0.0.0/8, 10.0.0.0/8,
   * 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 0.0.0.0/8, ::1, fe80::/10, fc00::/7,
   * IPv4-mapped IPv6, and malformed URLs.
   */
  static isValidHttpsUrl(urlStr: string): { valid: boolean; reason?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, reason: 'Media URL is empty or not a string.' };
    }

    const trimmed = urlStr.trim();
    if (trimmed.startsWith('file://') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return { valid: false, reason: `Local filesystem path '${urlStr}' is forbidden. Public HTTPS URL required.` };
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        return { valid: false, reason: `Protocol '${parsed.protocol}' is forbidden. Instagram requires public HTTPS URLs.` };
      }

      const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
      if (
        host === 'localhost' ||
        host.endsWith('.local') ||
        host.endsWith('.localhost') ||
        host.endsWith('.internal') ||
        host.endsWith('.lan') ||
        isPrivateOrReservedIp(host)
      ) {
        return { valid: false, reason: `Private/local network host '${host}' is forbidden. Instagram cannot reach internal URLs.` };
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: `Malformed URL '${urlStr}'. Valid HTTPS URL required.` };
    }
  }

  /**
   * Performs async DNS resolution to protect against DNS rebinding and hostnames pointing to private IPs.
   */
  static async validateMediaUrlWithDns(urlStr: string): Promise<{ valid: boolean; reason?: string }> {
    const staticCheck = PreflightValidator.isValidHttpsUrl(urlStr);
    if (!staticCheck.valid) return staticCheck;

    try {
      const parsed = new URL(urlStr.trim());
      const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

      if (isPrivateOrReservedIp(host)) {
        return { valid: false, reason: `Host '${host}' is an internal IP address.` };
      }

      const resolved = await dns.promises.lookup(host, { all: true });
      for (const entry of resolved) {
        if (isPrivateOrReservedIp(entry.address)) {
          return {
            valid: false,
            reason: `Hostname '${host}' resolved to internal IP '${entry.address}'. Internal destinations are forbidden.`
          };
        }
      }
      return { valid: true };
    } catch (dnsErr: any) {
      return { valid: false, reason: `DNS resolution failed for media URL: ${dnsErr.message}` };
    }
  }

  static validate(
    snapshot: PublicationSnapshot,
    account: InstagramAccount
  ): PreflightCheckResult {
    // 1. Immutable Snapshot Integrity
    if (!snapshot || !snapshot.id || !snapshot.format) {
      return {
        passed: false,
        errorCode: 'ERR_SNAPSHOT_CORRUPTED',
        errorMessage: 'Snapshot is missing required identification or format data.'
      };
    }

    // 2. Format-specific media checks with strict HTTPS validation
    if (snapshot.format === 'Reel') {
      if (!snapshot.mediaUrls || snapshot.mediaUrls.length === 0 || !snapshot.mediaUrls[0]) {
        return {
          passed: false,
          errorCode: 'ERR_MEDIA_UNREACHABLE',
          errorMessage: 'Reel requires at least one video media URL.'
        };
      }

      const videoValidation = this.isValidHttpsUrl(snapshot.mediaUrls[0]);
      if (!videoValidation.valid) {
        return {
          passed: false,
          errorCode: 'ERR_INVALID_MEDIA_URL',
          errorMessage: `Reel video URL failed HTTPS validation: ${videoValidation.reason}`
        };
      }

      if (snapshot.coverImageUrl) {
        const coverValidation = this.isValidHttpsUrl(snapshot.coverImageUrl);
        if (!coverValidation.valid) {
          return {
            passed: false,
            errorCode: 'ERR_INVALID_MEDIA_URL',
            errorMessage: `Reel cover image URL failed HTTPS validation: ${coverValidation.reason}`
          };
        }
      }
    } else if (snapshot.format === 'Carousel') {
      const slideCount = snapshot.slideCount || snapshot.carouselSlides?.length || 0;
      if (slideCount < 2 || slideCount > 10) {
        return {
          passed: false,
          errorCode: 'ERR_MEDIA_SPEC_VIOLATION',
          errorMessage: `Carousel slide count (${slideCount}) must be between 2 and 10.`
        };
      }

      const slides = snapshot.carouselSlides || [];
      if (slides.length > 0) {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const imgUrl = slide.finalImageUrl || slide.mockImageUrl || snapshot.mediaUrls?.[i];
          if (!imgUrl) {
            return {
              passed: false,
              errorCode: 'ERR_MEDIA_UNREACHABLE',
              errorMessage: `Carousel slide ${i + 1} is missing a media URL.`
            };
          }
          const slideValidation = this.isValidHttpsUrl(imgUrl);
          if (!slideValidation.valid) {
            return {
              passed: false,
              errorCode: 'ERR_INVALID_MEDIA_URL',
              errorMessage: `Carousel slide ${i + 1} URL failed HTTPS validation: ${slideValidation.reason}`
            };
          }
        }
      } else {
        if (!snapshot.mediaUrls || snapshot.mediaUrls.length < 2) {
          return {
            passed: false,
            errorCode: 'ERR_MEDIA_UNREACHABLE',
            errorMessage: 'Carousel requires media assets for each slide.'
          };
        }
        for (let i = 0; i < snapshot.mediaUrls.length; i++) {
          const urlValidation = this.isValidHttpsUrl(snapshot.mediaUrls[i]);
          if (!urlValidation.valid) {
            return {
              passed: false,
              errorCode: 'ERR_INVALID_MEDIA_URL',
              errorMessage: `Carousel asset ${i + 1} URL failed HTTPS validation: ${urlValidation.reason}`
            };
          }
        }
      }
    } else if (snapshot.format === 'Image') {
      const imgUrl = snapshot.mediaUrls?.[0] || snapshot.coverImageUrl;
      if (!imgUrl) {
        return {
          passed: false,
          errorCode: 'ERR_MEDIA_UNREACHABLE',
          errorMessage: 'Single image post requires a valid image URL.'
        };
      }
      const imageValidation = this.isValidHttpsUrl(imgUrl);
      if (!imageValidation.valid) {
        return {
          passed: false,
          errorCode: 'ERR_INVALID_MEDIA_URL',
          errorMessage: `Image post URL failed HTTPS validation: ${imageValidation.reason}`
        };
      }
    }

    // 3. Caption Length & Hashtag limit
    const caption = snapshot.caption || '';
    if (caption.length > 2200) {
      return {
        passed: false,
        errorCode: 'ERR_CAPTION_LIMIT_EXCEEDED',
        errorMessage: `Caption length (${caption.length}) exceeds Instagram limit of 2,200 characters.`
      };
    }

    const hashtags = snapshot.hashtags || [];
    if (hashtags.length > 30) {
      return {
        passed: false,
        errorCode: 'ERR_HASHTAG_LIMIT_EXCEEDED',
        errorMessage: `Hashtag count (${hashtags.length}) exceeds Instagram limit of 30 hashtags.`
      };
    }

    return { passed: true };
  }
}

// =============================================================================
// 3. INSTAGRAM PUBLISHING ENGINE
// =============================================================================

export class InstagramPublishingEngine {
  private publishJobs: PublishJobRecord[] = [];
  public metaClient: MetaGraphApiClient;
  // Concurrency: Strictly 1 active publication per Instagram account
  private accountLocks: Map<string, string> = new Map(); // accountId -> jobId
  private inFlightJobs: Set<string> = new Set(); // jobId -> currently executing
  private abortControllers: Map<string, AbortController> = new Map(); // jobId -> AbortController
  private schedulerTimer: NodeJS.Timeout | null = null;
  private onStateChangeCallback?: () => void;
  public reelProcessingTimeoutMs: number = 180000; // 180 seconds

  // Resolvers for queue draining
  private getSnapshotResolver?: (id: string) => PublicationSnapshot | null;
  private getAccountResolver?: (id: string) => InstagramAccount | null;
  private onCalendarPostPublishedResolver?: (calendarPostId: string, permalink: string, mediaId: string) => void;

  constructor(
    initialJobs: PublishJobRecord[] = [],
    onStateChange?: () => void
  ) {
    this.publishJobs = initialJobs;
    this.metaClient = new MetaGraphApiClient();
    this.onStateChangeCallback = onStateChange;
  }

  public setResolvers(
    getSnapshot: (id: string) => PublicationSnapshot | null,
    getAccount: (id: string) => InstagramAccount | null,
    onPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ) {
    this.getSnapshotResolver = getSnapshot;
    this.getAccountResolver = getAccount;
    this.onCalendarPostPublishedResolver = onPublished;
  }

  public setJobs(jobs: PublishJobRecord[]) {
    this.publishJobs = jobs;
  }

  public getJobs(accountId?: string): PublishJobRecord[] {
    if (!accountId) return this.publishJobs;
    return this.publishJobs.filter(j => j.accountId === accountId);
  }

  public getJobById(id: string): PublishJobRecord | null {
    return this.publishJobs.find(j => j.id === id) || null;
  }

  public getJobBySnapshotId(snapshotId: string): PublishJobRecord | null {
    return this.publishJobs.find(j => j.publicationSnapshotId === snapshotId) || null;
  }

  public getJobByCalendarPostId(calendarPostId: string): PublishJobRecord | null {
    return this.publishJobs.find(j => j.calendarPostId === calendarPostId) || null;
  }

  // Trigger state persistence whenever important state changes
  private notifyStateChange() {
    if (this.onStateChangeCallback) {
      try {
        this.onStateChangeCallback();
      } catch (err) {
        console.error('[PublishingEngine] Error in onStateChangeCallback:', err);
      }
    }
  }

  // Helper to append structured audit log to job (with credential sanitization)
  private log(job: PublishJobRecord, level: 'info' | 'warn' | 'error', stage: string, message: string, metadata?: any) {
    const cleanMessage = sanitizeErrorMessage(message);
    const cleanMeta = metadata ? JSON.parse(sanitizeErrorMessage(JSON.stringify(metadata))) : undefined;

    job.executionLogs.push({
      timestamp: new Date().toISOString(),
      level,
      stage,
      message: cleanMessage,
      metadata: cleanMeta
    });
    this.notifyStateChange();
  }

  // Create a new PublishJobRecord linked to a snapshot & calendar post
  public createJob(snapshot: PublicationSnapshot, calendarPost: CalendarPost): PublishJobRecord {
    const existing = this.getJobBySnapshotId(snapshot.id);
    if (existing) return existing;

    const jobId = `pub-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newJob: PublishJobRecord = {
      id: jobId,
      publicationSnapshotId: snapshot.id,
      calendarPostId: calendarPost.id,
      accountId: snapshot.accountId,
      idempotencyKey: snapshot.idempotencyKey,
      format: snapshot.format,
      scheduleStatus: 'SCHEDULED',
      executionStatus: 'IDLE',
      attemptCount: 0,
      maxAttempts: 3,
      queuedAt: new Date().toISOString(),
      executionLogs: []
    };

    this.log(newJob, 'info', 'INITIALIZATION', `Publish job created for ${snapshot.format} "${snapshot.title}"`, {
      scheduledDate: snapshot.scheduledDate,
      scheduledTime: snapshot.scheduledTime,
      timezone: snapshot.timezone
    });

    this.publishJobs.unshift(newJob);
    this.notifyStateChange();
    return newJob;
  }

  // Trigger Immediate "Publish Now"
  // Safe against duplicate execution, already-published posts, and cancelled jobs (Priority 3)
  public async publishNow(
    jobId: string,
    snapshot: PublicationSnapshot,
    account: InstagramAccount,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ): Promise<PublishJobRecord> {
    const job = this.getJobById(jobId);
    if (!job) throw new Error(`Publish job ${jobId} not found`);

    // State machine guard: reject jobs in PUBLISHED or CANCELLED state
    if (job.executionStatus === 'PUBLISHED') {
      throw new Error(`Job ${jobId} has already been published to Instagram and cannot be re-published.`);
    }
    if (job.executionStatus === 'CANCELLED') {
      throw new Error(`Job ${jobId} is cancelled and cannot be published.`);
    }

    // Same-job race guard: atomic check-and-return
    if (this.inFlightJobs.has(job.id) || job.executionStatus === 'PUBLISHING' || job.executionStatus === 'VERIFYING') {
      this.log(job, 'info', 'DUPLICATE_SUPPRESSED', 'Duplicate Publish Now request received while job is actively executing. Returning active state.');
      return job;
    }

    job.executionStatus = 'QUEUED';
    this.log(job, 'info', 'MANUAL_TRIGGER', 'Manual Publish Now triggered by operator');
    this.notifyStateChange();

    // Execute asynchronously with atomic guard
    this.executeJob(job, snapshot, account, onCalendarPostPublished).catch(err => {
      console.error(`Error executing publishNow for job ${jobId}:`, err);
    });

    return job;
  }

  // Cancel Scheduled or Queued Publication
  // Safe against cancelling already-published posts or posts already dispatched to Meta (Priority 3)
  public cancelJob(jobId: string): PublishJobRecord {
    const job = this.getJobById(jobId);
    if (!job) throw new Error(`Publish job ${jobId} not found`);

    if (job.executionStatus === 'PUBLISHED') {
      throw new Error('Cannot cancel a post that has already been published to Instagram');
    }
    if (job.executionStatus === 'CANCELLED') {
      throw new Error('Job is already cancelled');
    }
    if (job.executionStatus === 'VERIFYING' || job.metaMediaId) {
      throw new Error('Cannot cancel publication: media has already been dispatched to Meta Graph API and may already be live.');
    }

    // If actively in-flight, abort local HTTP operations
    const controller = this.abortControllers.get(job.id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(job.id);
    }

    const wasActive = this.inFlightJobs.has(job.id);
    this.inFlightJobs.delete(job.id);

    job.scheduleStatus = 'CANCELLED';
    job.executionStatus = 'CANCELLED';

    if (wasActive) {
      this.log(
        job,
        'warn',
        'CANCELLATION',
        'Publication cancellation requested during active execution. Local HTTP requests aborted. Note: Any publication request already accepted by Meta Graph API cannot be recalled.'
      );
    } else {
      this.log(job, 'warn', 'CANCELLATION', 'Publication job cancelled before execution');
    }

    // Release account lock if held by this job
    if (this.accountLocks.get(job.accountId) === job.id) {
      this.accountLocks.delete(job.accountId);
    }

    this.notifyStateChange();
    return job;
  }

  // Retry a Failed Publication
  // Safe retry behavior: RECONCILE FIRST before resetting container IDs (Priority 1)
  public async retryJob(
    jobId: string,
    snapshot: PublicationSnapshot,
    account: InstagramAccount,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ): Promise<PublishJobRecord> {
    const job = this.getJobById(jobId);
    if (!job) throw new Error(`Publish job ${jobId} not found`);

    // State machine guard: retry must reject PUBLISHED or CANCELLED jobs
    if (job.executionStatus === 'PUBLISHED') {
      throw new Error(`Job ${jobId} has already been published to Instagram and cannot be retried.`);
    }
    if (job.executionStatus === 'CANCELLED') {
      throw new Error(`Job ${jobId} is cancelled and cannot be retried.`);
    }

    if (this.inFlightJobs.has(job.id) || job.executionStatus === 'PUBLISHING' || job.executionStatus === 'VERIFYING') {
      this.log(job, 'info', 'DUPLICATE_SUPPRESSED', 'Duplicate Retry request received while job is actively executing.');
      return job;
    }

    // 1. RECONCILE FIRST BEFORE RESETTING ANY CONTAINER IDS!
    if (job.metaMediaId || job.metaContainerId) {
      this.log(job, 'info', 'RETRY_RECONCILING', 'Reconciling publication state before retry to prevent duplicate posting...');
      try {
        const recon = await this.metaClient.reconcileRecentMedia(account, {
          metaMediaId: job.metaMediaId,
          metaContainerId: job.metaContainerId,
          idempotencyKey: job.idempotencyKey,
          jobId: job.id,
          expectedCaption: snapshot.caption,
          createdAfter: job.startedAt ? new Date(job.startedAt) : undefined
        });

        if (recon.found && recon.mediaId) {
          this.log(job, 'info', 'RETRY_RECONCILED', `Previous publication was found live (${recon.mediaId}). Transitioning to VERIFYING instead of creating a duplicate.`);
          job.metaMediaId = recon.mediaId;
          job.executionStatus = 'VERIFYING';
          this.notifyStateChange();

          // Complete verification
          const verifyResult = await this.metaClient.verifyPublishedMedia(account, recon.mediaId);
          job.permalink = verifyResult.permalink;
          job.publishedAt = verifyResult.publishedAt;
          job.executionStatus = 'PUBLISHED';
          job.finishedAt = new Date().toISOString();
          if (onCalendarPostPublished) {
            onCalendarPostPublished(job.calendarPostId, verifyResult.permalink, verifyResult.id);
          } else if (this.onCalendarPostPublishedResolver) {
            this.onCalendarPostPublishedResolver(job.calendarPostId, verifyResult.permalink, verifyResult.id);
          }
          return job;
        }
      } catch (reconErr) {
        this.log(job, 'warn', 'RETRY_RECONCILE_FAILED', `Reconciliation query failed: ${sanitizeErrorMessage(String(reconErr))}`);
      }
    }

    // 2. Only after reconciliation confirms NO publication exists, reset container IDs for fresh attempt (Priority 1)
    if (job.metaContainerId) {
      this.log(job, 'info', 'CONTAINER_RESET', `Resetting container ${job.metaContainerId} for retry attempt after reconciliation confirmed no publication.`);
      job.metaContainerId = undefined;
      job.metaChildContainerIds = undefined;
    }

    job.executionStatus = 'QUEUED';
    job.lastErrorCode = undefined;
    job.lastErrorMessage = undefined;
    this.log(job, 'info', 'MANUAL_RETRY', `Manual retry queued (attempt ${job.attemptCount + 1} of ${job.maxAttempts})`);
    this.notifyStateChange();

    this.executeJob(job, snapshot, account, onCalendarPostPublished).catch(err => {
      console.error(`Error retrying job ${jobId}:`, err);
    });

    return job;
  }

  // Core Execution Flow
  public async executeJob(
    job: PublishJobRecord,
    snapshot: PublicationSnapshot,
    account: InstagramAccount,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ): Promise<void> {
    // Atomic check: prevent concurrent executions of the exact same job
    if (this.inFlightJobs.has(job.id)) {
      return;
    }

    // 1. Acquire Concurrency Lock per Account (STRICTLY 1 ACTIVE PUBLICATION PER ACCOUNT)
    const activeJobForAccount = this.accountLocks.get(job.accountId);
    if (activeJobForAccount && activeJobForAccount !== job.id) {
      this.log(job, 'warn', 'CONCURRENCY_WAIT', `Account lock active for job (${activeJobForAccount}). Waiting in queue.`);
      job.executionStatus = 'QUEUED';
      this.notifyStateChange();
      return;
    }

    this.inFlightJobs.add(job.id);
    this.accountLocks.set(job.accountId, job.id);
    const abortController = new AbortController();
    this.abortControllers.set(job.id, abortController);

    job.startedAt = new Date().toISOString();
    job.attemptCount += 1;
    this.notifyStateChange();

    try {
      // 2. PRE-FLIGHT VALIDATION
      job.executionStatus = 'VALIDATING';
      this.log(job, 'info', 'VALIDATING', 'Running pre-flight checks (format, HTTPS media validation, caption limits)...');

      const validation = PreflightValidator.validate(snapshot, account);
      if (!validation.passed) {
        job.executionStatus = 'FAILED';
        job.lastErrorCode = validation.errorCode;
        job.lastErrorMessage = validation.errorMessage;
        job.errorCategory = validation.errorCode?.includes('MEDIA') ? 'MEDIA' : 'PERMANENT';
        this.log(job, 'error', 'VALIDATING', `Pre-flight check failed: ${validation.errorMessage}`, { code: validation.errorCode });
        return;
      }

      // 2.5 RECOVERY & DUPLICATE PREVENTION: CHECK IF ALREADY PUBLISHED (Priority 1)
      if (job.metaMediaId) {
        this.log(job, 'info', 'RECOVERY_VERIFY', `Existing media ID ${job.metaMediaId} detected. Skipping container creation & media_publish, proceeding directly to post verification.`);
        job.executionStatus = 'VERIFYING';
        this.notifyStateChange();

        const verifyResult = await this.metaClient.verifyPublishedMedia(account, job.metaMediaId, abortController.signal);
        job.permalink = verifyResult.permalink;
        job.publishedAt = verifyResult.publishedAt;
        job.executionStatus = 'PUBLISHED';
        job.finishedAt = new Date().toISOString();
        this.log(job, 'info', 'COMPLETED', `Post verified live on Instagram! Permalink: ${verifyResult.permalink}`, {
          mediaId: verifyResult.id,
          permalink: verifyResult.permalink
        });

        if (onCalendarPostPublished) {
          onCalendarPostPublished(job.calendarPostId, verifyResult.permalink, verifyResult.id);
        } else if (this.onCalendarPostPublishedResolver) {
          this.onCalendarPostPublishedResolver(job.calendarPostId, verifyResult.permalink, verifyResult.id);
        }
        return;
      }

      // Check Quota
      try {
        const quota = await this.metaClient.checkPublishingLimit(account, abortController.signal);
        if (quota.quotaUsage >= quota.quotaTotal) {
          job.executionStatus = 'RETRY_PENDING';
          job.lastErrorCode = 'ERR_QUOTA_EXCEEDED';
          job.lastErrorMessage = `Publishing quota reached (${quota.quotaUsage}/${quota.quotaTotal}). Rescheduling retry.`;
          job.errorCategory = 'RATE_LIMIT';
          job.nextAttemptAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour delay
          this.log(job, 'warn', 'RATE_LIMIT', job.lastErrorMessage);
          return;
        }
      } catch (quotaErr: any) {
        this.log(job, 'warn', 'RATE_LIMIT', `Could not check publishing limit: ${quotaErr.message}`);
      }

      // 3. CONTAINER CREATION
      job.executionStatus = 'PUBLISHING';
      this.log(job, 'info', 'PUBLISHING', `Creating Meta container for ${snapshot.format}...`);

      // Compile Caption + Hashtags + CTA
      const fullCaption = [
        snapshot.caption,
        snapshot.hashtags && snapshot.hashtags.length > 0
          ? snapshot.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
          : '',
        snapshot.callToAction || ''
      ].filter(Boolean).join('\n\n');

      let containerId = job.metaContainerId;

      // If container ID exists, reconcile first to see if publication already occurred (Priority 1)
      if (containerId) {
        this.log(job, 'info', 'RECONCILIATION_CHECK', `Checking if container ${containerId} was already published...`);
        const recon = await this.metaClient.reconcileRecentMedia(account, {
          metaContainerId: containerId,
          idempotencyKey: job.idempotencyKey,
          jobId: job.id,
          expectedCaption: snapshot.caption,
          createdAfter: job.startedAt ? new Date(job.startedAt) : undefined
        }, abortController.signal);

        if (recon.found && recon.mediaId) {
          job.metaMediaId = recon.mediaId;
          job.executionStatus = 'VERIFYING';
          this.log(job, 'info', 'RECONCILED', `Publication reconciled! Found existing Instagram Media ID: ${recon.mediaId}`);
          this.notifyStateChange();

          const verifyResult = await this.metaClient.verifyPublishedMedia(account, recon.mediaId, abortController.signal);
          job.permalink = verifyResult.permalink;
          job.publishedAt = verifyResult.publishedAt;
          job.executionStatus = 'PUBLISHED';
          job.finishedAt = new Date().toISOString();
          this.log(job, 'info', 'COMPLETED', `Post live on Instagram! Permalink: ${verifyResult.permalink}`);

          if (onCalendarPostPublished) {
            onCalendarPostPublished(job.calendarPostId, verifyResult.permalink, verifyResult.id);
          } else if (this.onCalendarPostPublishedResolver) {
            this.onCalendarPostPublishedResolver(job.calendarPostId, verifyResult.permalink, verifyResult.id);
          }
          return;
        }
      }

      if (!containerId) {
        if (snapshot.format === 'Reel') {
          const videoUrl = snapshot.mediaUrls[0];
          const coverUrl = snapshot.coverImageUrl;
          const cont = await this.metaClient.createReelContainer(account, {
            videoUrl,
            coverUrl,
            caption: fullCaption,
            shareToFeed: true
          }, abortController.signal);
          containerId = cont.containerId;
          job.metaContainerId = containerId;
          this.log(job, 'info', 'CONTAINER_CREATED', `Reel container created: ${containerId}`);
        } else if (snapshot.format === 'Carousel') {
          // P0: CAROUSEL CHILD CONTAINER INCREMENTAL PERSISTENCE & POLLING (Priority 2)
          // 1. Create every child container in exact slide order
          // 2. Persist child container IDs INCREMENTALLY after each child is created
          // 3. Resume from already-created child IDs if recovering from crash
          // 4. Poll every child until status_code === FINISHED
          // 5. Only create parent container after ALL children are FINISHED
          const slides = snapshot.carouselSlides || [];
          const childIds: string[] = [...(job.metaChildContainerIds || [])];

          this.log(job, 'info', 'CAROUSEL_CHILDREN_CREATION', `Processing ${slides.length} slides for Carousel (${childIds.length} already created)...`);

          for (let i = childIds.length; i < slides.length; i++) {
            const slide = slides[i];
            const imgUrl = slide.finalImageUrl || slide.mockImageUrl || snapshot.mediaUrls?.[i] || snapshot.mediaUrls?.[0];
            const childCont = await this.metaClient.createCarouselItemContainer(account, { imageUrl: imgUrl }, abortController.signal);
            childIds.push(childCont.containerId);
            // Immediately persist each child ID incrementally
            job.metaChildContainerIds = [...childIds];
            this.notifyStateChange();

            if (this.metaClient.onChildContainerCreated) {
              this.metaClient.onChildContainerCreated(childCont.containerId, i);
            }
            this.log(job, 'info', 'CHILD_CONTAINER_CREATED', `Carousel slide ${i + 1} container created and persisted: ${childCont.containerId}`);
          }

          // Poll every child container until FINISHED
          this.log(job, 'info', 'CAROUSEL_CHILDREN_POLLING', `Polling all ${childIds.length} child containers until FINISHED...`);

          for (let i = 0; i < childIds.length; i++) {
            const childId = childIds[i];
            const pollResult = await this.metaClient.pollContainerStatus(childId, account, 60000, abortController.signal);
            if (this.metaClient.onChildContainerPolled) {
              this.metaClient.onChildContainerPolled(childId, pollResult.statusCode);
            }

            if (pollResult.statusCode === 'ERROR' || pollResult.statusCode === 'EXPIRED') {
              throw new Error(`Carousel slide ${i + 1} (container ${childId}) failed processing: ${pollResult.statusCode} (${pollResult.statusMessage || ''})`);
            }

            if (pollResult.statusCode !== 'FINISHED' && pollResult.statusCode !== 'PUBLISHED') {
              throw new Error(`Carousel slide ${i + 1} (container ${childId}) did not finish in time: ${pollResult.statusCode}`);
            }

            this.log(job, 'info', 'CHILD_CONTAINER_READY', `Carousel slide ${i + 1} container ${childId} verified FINISHED.`);
          }

          // All children are FINISHED. Now create parent container with exact slide ordering.
          this.log(job, 'info', 'PARENT_CONTAINER_CREATING', `All ${childIds.length} children FINISHED. Creating parent Carousel container...`);
          const parentCont = await this.metaClient.createCarouselParentContainer(account, {
            childContainerIds: childIds,
            caption: fullCaption
          }, abortController.signal);

          containerId = parentCont.containerId;
          job.metaContainerId = containerId;
          this.log(job, 'info', 'PARENT_CONTAINER_CREATED', `Parent Carousel container created: ${containerId}`);
        } else { // Single Image
          const imgUrl = snapshot.mediaUrls?.[0] || snapshot.coverImageUrl || '';
          const cont = await this.metaClient.createImageContainer(account, {
            imageUrl: imgUrl,
            caption: fullCaption
          }, abortController.signal);
          containerId = cont.containerId;
          job.metaContainerId = containerId;
          this.log(job, 'info', 'CONTAINER_CREATED', `Image container created: ${containerId}`);
        }
      }

      this.notifyStateChange();

      // 4. POLL CONTAINER STATUS (180s timeout for Reels/video, 30s for image/carousel)
      const pollTimeoutMs = snapshot.format === 'Reel' ? this.reelProcessingTimeoutMs : 60000;
      this.log(job, 'info', 'POLLING_STATUS', `Polling parent container ${containerId} status (timeout: ${Math.round(pollTimeoutMs / 1000)}s)...`);
      const pollResult = await this.metaClient.pollContainerStatus(containerId, account, pollTimeoutMs, abortController.signal);

      if (pollResult.statusCode === 'EXPIRED') {
        job.metaContainerId = undefined;
        job.metaChildContainerIds = undefined;
        throw new Error(`Container ${containerId} expired before publishing. Container reset for next attempt.`);
      }

      if (pollResult.statusCode !== 'FINISHED' && pollResult.statusCode !== 'PUBLISHED') {
        throw new Error(`Container did not finish processing. Status: ${pollResult.statusCode} (${pollResult.statusMessage || ''})`);
      }

      // 5. DISPATCH MEDIA PUBLISH
      this.log(job, 'info', 'MEDIA_PUBLISH', `Dispatching media_publish for container ${containerId}...`);
      const pubResult = await this.metaClient.publishContainer(account, containerId, abortController.signal);
      job.metaMediaId = pubResult.mediaId;
      job.executionStatus = 'VERIFYING';
      this.log(job, 'info', 'MEDIA_PUBLISHED', `media_publish succeeded. Instagram Media ID: ${pubResult.mediaId}`);
      this.notifyStateChange();

      // 6. POST-PUBLISH VERIFICATION
      this.log(job, 'info', 'VERIFYING', `Verifying live status of media ${pubResult.mediaId}...`);
      const verifyResult = await this.metaClient.verifyPublishedMedia(account, pubResult.mediaId, abortController.signal);

      job.permalink = verifyResult.permalink;
      job.publishedAt = verifyResult.publishedAt;
      job.executionStatus = 'PUBLISHED';
      job.finishedAt = new Date().toISOString();
      this.log(job, 'info', 'COMPLETED', `Post live on Instagram! Permalink: ${verifyResult.permalink}`, {
        mediaId: verifyResult.id,
        permalink: verifyResult.permalink
      });

      // Notify calendar post update
      if (onCalendarPostPublished) {
        onCalendarPostPublished(job.calendarPostId, verifyResult.permalink, verifyResult.id);
      } else if (this.onCalendarPostPublishedResolver) {
        this.onCalendarPostPublishedResolver(job.calendarPostId, verifyResult.permalink, verifyResult.id);
      }

    } catch (err: any) {
      if (job.executionStatus === 'CANCELLED') {
        return;
      }

      const cleanMsg = sanitizeErrorMessage(err.message || 'Unknown error');
      console.error(`PublishJob ${job.id} error:`, cleanMsg);
      job.lastErrorMessage = cleanMsg;

      // P1 & P5: STRUCTURED ERROR CLASSIFICATION
      const classification = classifyPublishingError(err);
      job.lastErrorCode = classification.errorCode;
      job.errorCategory = classification.category;

      if (classification.category === 'AUTH') {
        job.executionStatus = 'FAILED';
        this.log(job, 'error', 'FAILED', `Authentication/Permissions error: ${cleanMsg}`, { code: classification.errorCode });
      } else if (classification.category === 'MEDIA') {
        job.executionStatus = 'FAILED';
        this.log(job, 'error', 'FAILED', `Creative or media spec violation: ${cleanMsg}`, { code: classification.errorCode });
      } else if (classification.isTransient && job.attemptCount < job.maxAttempts) {
        job.executionStatus = 'RETRY_PENDING';
        const delaySeconds = job.attemptCount === 1 ? 60 : 300; // 1m, then 5m
        job.nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
        this.log(job, 'warn', 'RETRY_SCHEDULED', `Transient error. Retrying in ${delaySeconds}s (attempt ${job.attemptCount}/${job.maxAttempts}): ${cleanMsg}`, { code: classification.errorCode });
      } else {
        job.executionStatus = 'FAILED';
        this.log(job, 'error', 'FAILED', `Publication failed permanently: ${cleanMsg}`, { code: classification.errorCode });
      }
    } finally {
      // Release account lock and in-flight tracking
      this.accountLocks.delete(job.accountId);
      this.inFlightJobs.delete(job.id);
      this.abortControllers.delete(job.id);
      this.notifyStateChange();

      // Automatically drain the next queued job for this account
      this.drainQueueForAccount(job.accountId, onCalendarPostPublished);
    }
  }

  // Queue Drain: Pick up next queued job for this account sequentially (Priority 2)
  // Head-of-line unblocking: if snapshot or account cannot be resolved, mark FAILED and continue draining!
  public drainQueueForAccount(
    accountId: string,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ) {
    // If account already has an active lock, do not start another
    if (this.accountLocks.has(accountId)) {
      return;
    }

    while (true) {
      // Find the next job in QUEUED status for this account (FIFO)
      const nextJob = this.publishJobs
        .filter(j => j.accountId === accountId && j.executionStatus === 'QUEUED')
        .sort((a, b) => new Date(a.queuedAt || 0).getTime() - new Date(b.queuedAt || 0).getTime())[0];

      if (!nextJob) {
        break;
      }

      if (!this.getSnapshotResolver || !this.getAccountResolver) {
        break;
      }

      const snapshot = this.getSnapshotResolver(nextJob.publicationSnapshotId);
      const account = this.getAccountResolver(nextJob.accountId);

      if (!snapshot || !account) {
        // Head-of-line unblocking
        nextJob.executionStatus = 'FAILED';
        nextJob.lastErrorCode = 'ERR_PUBLICATION_DEPENDENCY_MISSING';
        const missingDep = !snapshot ? `Snapshot '${nextJob.publicationSnapshotId}' not found` : `Account '${nextJob.accountId}' not found`;
        nextJob.lastErrorMessage = `Cannot execute queued job: ${missingDep}`;
        nextJob.errorCategory = 'PERMANENT';
        this.log(nextJob, 'error', 'QUEUE_DRAIN', nextJob.lastErrorMessage, {
          snapshotResolved: !!snapshot,
          accountResolved: !!account
        });
        this.notifyStateChange();
        // Continue loop to drain the next queued job in line!
        continue;
      }

      // Valid job found
      this.log(nextJob, 'info', 'QUEUE_DRAIN', `Automatically dispatching next queued job ${nextJob.id} for account.`);
      this.executeJob(nextJob, snapshot, account, onCalendarPostPublished).catch(err => {
        console.error(`[PublishingEngine] Queue drain error for job ${nextJob.id}:`, err);
      });
      break;
    }
  }

  // Crash / Server Restart Recovery (Priority 1 & 2)
  // Recovers pending jobs sequentially per account (Strictly 1 active job per account)
  public recoverPendingJobs(
    getSnapshot: (id: string) => PublicationSnapshot | null,
    getAccount: (id: string) => InstagramAccount | null,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void
  ) {
    this.setResolvers(getSnapshot, getAccount, onCalendarPostPublished);
    console.log('[PublishingEngine] Running server restart recovery on pending jobs...');

    // Group pending jobs by accountId
    const pendingByAccount: Map<string, PublishJobRecord[]> = new Map();

    for (const job of this.publishJobs) {
      if (
        job.executionStatus === 'QUEUED' ||
        job.executionStatus === 'VALIDATING' ||
        job.executionStatus === 'PUBLISHING' ||
        job.executionStatus === 'VERIFYING'
      ) {
        const list = pendingByAccount.get(job.accountId) || [];
        list.push(job);
        pendingByAccount.set(job.accountId, list);
      }
    }

    // For each account, launch ONLY the first job. Subsequent jobs will be drained automatically by drainQueueForAccount.
    for (const [accountId, jobs] of pendingByAccount.entries()) {
      // Sort jobs strictly in FIFO order by queuedAt ascending
      jobs.sort((a, b) => new Date(a.queuedAt || 0).getTime() - new Date(b.queuedAt || 0).getTime());
      if (jobs.length > 0) {
        const firstJob = jobs[0];
        const snapshot = getSnapshot(firstJob.publicationSnapshotId);
        const account = getAccount(firstJob.accountId);

        if (!snapshot || !account) {
          // Unblock queue immediately if dependency missing
          firstJob.executionStatus = 'FAILED';
          firstJob.lastErrorCode = 'ERR_PUBLICATION_DEPENDENCY_MISSING';
          const missingDep = !snapshot ? `Snapshot '${firstJob.publicationSnapshotId}' not found` : `Account '${firstJob.accountId}' not found`;
          firstJob.lastErrorMessage = `Cannot recover job: ${missingDep}`;
          firstJob.errorCategory = 'PERMANENT';
          this.log(firstJob, 'error', 'RECOVERY', firstJob.lastErrorMessage);
          this.notifyStateChange();
          // Draining will pick up the next queued job
          this.drainQueueForAccount(accountId, onCalendarPostPublished);
          continue;
        }

        this.log(firstJob, 'info', 'RECOVERY', `Recovering pending job ${firstJob.id} after server restart`);
        this.executeJob(firstJob, snapshot, account, onCalendarPostPublished).catch(e => console.error(e));

        // Remaining jobs remain in QUEUED status and will be picked up sequentially
        for (let i = 1; i < jobs.length; i++) {
          const queuedJob = jobs[i];
          queuedJob.executionStatus = 'QUEUED';
          this.log(queuedJob, 'info', 'RECOVERY', `Queued job ${queuedJob.id} waiting in sequence for account queue drain`);
        }
      }
    }
    this.notifyStateChange();
  }

  // Start periodic scheduler for due calendar slots
  public startScheduler(
    getDueJobs: () => Array<{ job: PublishJobRecord; snapshot: PublicationSnapshot; account: InstagramAccount }>,
    onCalendarPostPublished?: (calendarPostId: string, permalink: string, mediaId: string) => void,
    intervalMs: number = 30000
  ) {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => {
      try {
        const dueList = getDueJobs();
        for (const { job, snapshot, account } of dueList) {
          if (job.executionStatus === 'IDLE') {
            job.executionStatus = 'QUEUED';
            this.log(job, 'info', 'SCHEDULER_TICK', 'Scheduled delivery slot reached. Dispatched to queue.');
            this.executeJob(job, snapshot, account, onCalendarPostPublished).catch(e => console.error(e));
          }
        }
      } catch (e) {
        console.error('[PublishingScheduler] Tick error:', e);
      }
    }, intervalMs);
  }

  public stopScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }
}

