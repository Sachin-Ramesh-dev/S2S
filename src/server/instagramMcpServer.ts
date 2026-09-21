/**
 * Instagram Live MCP Server
 * Exposes live Meta Graph API v20.0 tools to the Gemini Page Audit Agent.
 * Zero-mock, zero-hallucination: queries authentic connected Meta account.
 */

export interface InstagramMcpToolContext {
  accessToken: string;
  instagramBusinessId?: string;
  username?: string;
}

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

// Function Declarations compatible with @google/genai SDK (Type/Schema)
export const INSTAGRAM_MCP_FUNCTION_DECLARATIONS = [
  {
    name: 'get_account_profile',
    description: 'Retrieve live Instagram Professional account profile details including handle, bio, follower count, following count, media count, and profile picture.',
    parameters: {
      type: 'OBJECT',
      properties: {
        username: {
          type: 'STRING',
          description: 'The Instagram username (optional, defaults to connected account).'
        }
      }
    }
  },
  {
    name: 'get_recent_media',
    description: 'Retrieve the most recent published media items (Reels, Carousels, Images) from the connected Instagram account with captions, timestamps, like counts, and comment counts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'INTEGER',
          description: 'Maximum number of recent posts to retrieve (between 5 and 30, default: 20).'
        },
        media_type: {
          type: 'STRING',
          description: 'Optional filter: VIDEO (Reels), CAROUSEL_ALBUM, or IMAGE.'
        }
      }
    }
  },
  {
    name: 'get_media_insights',
    description: 'Retrieve detailed engagement insights for a specific media post/Reel, such as reach, impressions, saves, shares, and total interactions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        media_id: {
          type: 'STRING',
          description: 'The Meta media item ID to query insights for.'
        }
      },
      required: ['media_id']
    }
  },
  {
    name: 'get_account_insights',
    description: 'Retrieve account-level performance trends such as overall reach, impressions, profile views, and follower demographics over a 28-day period.',
    parameters: {
      type: 'OBJECT',
      properties: {
        period: {
          type: 'STRING',
          description: 'Time period for metric aggregation (e.g. "day", "days_28"). Default: "day".'
        }
      }
    }
  },
  {
    name: 'get_recent_comments',
    description: 'Retrieve recent user comments on a specific post to assess audience sentiment, questions, pain points, and feedback.',
    parameters: {
      type: 'OBJECT',
      properties: {
        media_id: {
          type: 'STRING',
          description: 'The ID of the Instagram media item to retrieve comments for.'
        },
        limit: {
          type: 'INTEGER',
          description: 'Maximum number of comments to fetch (default: 10).'
        }
      },
      required: ['media_id']
    }
  }
];

import { sanitizeErrorMessage } from './instagramPublishingEngine';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

/**
 * Resolve Instagram Business Account ID from Page or /me if not directly known
 */
async function resolveIgBusinessId(accessToken: string, targetId?: string): Promise<string> {
  if (targetId && targetId !== 'me' && !targetId.startsWith('page_')) {
    return targetId;
  }

  // 1. Try querying /me/accounts to find connected pages and their instagram_business_account
  try {
    const pagesRes = await fetch(`${GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account{id,username}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const pagesJson: any = await pagesRes.json();
    if (pagesJson?.data && Array.isArray(pagesJson.data)) {
      for (const page of pagesJson.data) {
        if (page.instagram_business_account?.id) {
          return page.instagram_business_account.id;
        }
      }
    }
  } catch (err: any) {
    console.warn('[Instagram MCP] Failed to resolve via /me/accounts:', sanitizeErrorMessage(err?.message || ''));
  }

  // 2. Direct /me with instagram_business_account
  try {
    const meRes = await fetch(`${GRAPH_BASE}/me?fields=id,name,instagram_business_account{id,username}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const meJson: any = await meRes.json();
    if (meJson?.instagram_business_account?.id) {
      return meJson.instagram_business_account.id;
    }
  } catch (err: any) {
    console.warn('[Instagram MCP] Failed to resolve via /me:', sanitizeErrorMessage(err?.message || ''));
  }

  return targetId || 'me';
}

/**
 * Execute Instagram Live MCP Tool
 */
export async function executeInstagramMcpTool(
  toolName: string,
  toolArgs: any,
  context: InstagramMcpToolContext
): Promise<McpToolResult> {
  const { accessToken } = context;
  if (!accessToken || !accessToken.trim() || accessToken.includes('...')) {
    return {
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      details: 'Instagram data could not be retrieved. Please reconnect the Instagram account or check the required permissions.'
    };
  }

  const cleanToken = accessToken.trim();
  const igId = await resolveIgBusinessId(cleanToken, context.instagramBusinessId);

  try {
    switch (toolName) {
      case 'get_account_profile': {
        const url = `${GRAPH_BASE}/${encodeURIComponent(igId)}?fields=id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const data: any = await res.json();

        if (data.error) {
          const isAuthError = data.error.code === 190 || data.error.type === 'OAuthException';
          return {
            success: false,
            error: isAuthError ? 'TOKEN_EXPIRED_OR_INVALID' : data.error.message,
            details: isAuthError
              ? 'Instagram data could not be retrieved. Please reconnect the Instagram account or check the required permissions.'
              : data.error.message
          };
        }

        return {
          success: true,
          data: {
            id: data.id,
            username: data.username || context.username,
            name: data.name || data.username,
            biography: data.biography || '',
            followers_count: data.followers_count ?? 0,
            follows_count: data.follows_count ?? 0,
            media_count: data.media_count ?? 0,
            profile_picture_url: data.profile_picture_url || null,
            website: data.website || null
          }
        };
      }

      case 'get_recent_media': {
        const limit = Math.min(Math.max(Number(toolArgs?.limit) || 20, 5), 35);
        const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
        const url = `${GRAPH_BASE}/${encodeURIComponent(igId)}/media?fields=${fields}&limit=${limit}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const data: any = await res.json();

        if (data.error) {
          return {
            success: false,
            error: data.error.message,
            details: data.error.code === 190
              ? 'Instagram data could not be retrieved. Please reconnect the Instagram account or check the required permissions.'
              : data.error.message
          };
        }

        let mediaList: any[] = data.data || [];
        if (toolArgs?.media_type) {
          mediaList = mediaList.filter(m => m.media_type === toolArgs.media_type);
        }

        return {
          success: true,
          data: {
            count: mediaList.length,
            media: mediaList.map(m => ({
              id: m.id,
              caption: m.caption || '(No caption)',
              media_type: m.media_type,
              like_count: m.like_count ?? 0,
              comments_count: m.comments_count ?? 0,
              timestamp: m.timestamp,
              permalink: m.permalink,
              thumbnail_url: m.thumbnail_url || m.media_url || null
            }))
          }
        };
      }

      case 'get_media_insights': {
        const mediaId = toolArgs?.media_id;
        if (!mediaId) {
          return { success: false, error: 'media_id is required' };
        }

        const metrics = 'reach,impressions,saved,shares,total_interactions';
        const url = `${GRAPH_BASE}/${encodeURIComponent(mediaId)}/insights?metric=${metrics}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const data: any = await res.json();

        if (data.error) {
          try {
            const fallbackUrl = `${GRAPH_BASE}/${encodeURIComponent(mediaId)}/insights?metric=reach,saved,total_interactions`;
            const fbRes = await fetch(fallbackUrl, {
              headers: { 'Authorization': `Bearer ${cleanToken}` }
            });
            const fbData: any = await fbRes.json();
            if (fbData.data) {
              const metricsMap: Record<string, number> = {};
              for (const m of fbData.data) {
                metricsMap[m.name] = m.values?.[0]?.value ?? 0;
              }
              return { success: true, data: { mediaId, metrics: metricsMap } };
            }
          } catch {
            // ignore fallback error
          }

          return {
            success: true,
            data: {
              mediaId,
              note: 'Detailed insights not accessible for this specific media (may be older than 30 days or private).',
              metaError: data.error.message
            }
          };
        }

        const metricsMap: Record<string, number> = {};
        if (data.data && Array.isArray(data.data)) {
          for (const m of data.data) {
            metricsMap[m.name] = m.values?.[0]?.value ?? 0;
          }
        }

        return {
          success: true,
          data: {
            mediaId,
            metrics: metricsMap
          }
        };
      }

      case 'get_account_insights': {
        const period = toolArgs?.period || 'day';
        const metrics = 'impressions,reach,profile_views';
        const url = `${GRAPH_BASE}/${encodeURIComponent(igId)}/insights?metric=${metrics}&period=${period}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const data: any = await res.json();

        if (data.error) {
          return {
            success: true,
            data: {
              note: 'Account-level aggregate insights unavailable (Meta requires minimum 100 followers and 28 days of active data for aggregate insights API).',
              metaError: data.error.message
            }
          };
        }

        const insightsResult: Record<string, any> = {};
        if (data.data && Array.isArray(data.data)) {
          for (const m of data.data) {
            insightsResult[m.name] = m.values || [];
          }
        }

        return {
          success: true,
          data: {
            period,
            insights: insightsResult
          }
        };
      }

      case 'get_recent_comments': {
        const mediaId = toolArgs?.media_id;
        if (!mediaId) {
          return { success: false, error: 'media_id is required' };
        }
        const limit = Math.min(Math.max(Number(toolArgs?.limit) || 10, 1), 25);
        const url = `${GRAPH_BASE}/${encodeURIComponent(mediaId)}/comments?fields=id,text,timestamp,like_count,username&limit=${limit}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const data: any = await res.json();

        if (data.error) {
          return {
            success: true,
            data: {
              mediaId,
              comments: [],
              note: 'No comments found or comments restricted by user settings.'
            }
          };
        }

        return {
          success: true,
          data: {
            mediaId,
            comments: (data.data || []).map((c: any) => ({
              id: c.id,
              text: c.text,
              username: c.username,
              timestamp: c.timestamp,
              like_count: c.like_count ?? 0
            }))
          }
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`[Instagram MCP Execution Error - ${toolName}]:`, sanitizeErrorMessage(err?.message || String(err)));
    return {
      success: false,
      error: 'MCP_EXECUTION_EXCEPTION',
      details: sanitizeErrorMessage(err?.message || String(err))
    };
  }
}
