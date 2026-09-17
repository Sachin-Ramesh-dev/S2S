import { Workflow } from '../types';

export const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-email-support-bot',
    name: 'AI Email Support Bot with Google Gemini',
    description: 'Codecademy Tutorial workflow: Inbound support email trigger, Gemini AI classification & auto-drafter, intelligent priority routing, and automated Slack escalation.',
    active: true,
    tags: ['Codecademy Guide', 'Google Gemini', 'Email Support', 'AI Agent'],
    scope: 'Personal',
    published: true,
    triggerCount: 5,
    createdAt: '2026-09-11T09:00:00.000Z',
    updatedAt: '2026-09-11T14:30:00.000Z',
    nodes: [
      {
        id: 'node-email-in',
        type: 'emailTrigger',
        name: 'Inbound Support Email',
        position: { x: 80, y: 240 },
        parameters: {
          inbox: 'support@acmecorp.com',
          mockPayload: JSON.stringify({
            from: 'alex.rivera@enterprise.com',
            subject: 'CRITICAL: Production database sync failing after upgrade',
            email_body: 'Our database sync cluster failed right after the v4 update. We are losing transactions across our EU servers. Need immediate emergency response.',
            received_at: '2026-09-11T14:00:00Z'
          }, null, 2)
        }
      },
      {
        id: 'node-gemini-classifier',
        type: 'aiAgent',
        name: 'Gemini Classifier & Drafter',
        position: { x: 440, y: 240 },
        parameters: {
          model: 'gemini-2.5-flash',
          task: 'email_support',
          promptTemplate: 'Analyze the customer email inquiry: categorize into [Technical, Billing, Bug, Feature Request, Urgent], determine urgency score (1-5), and compose a polite resolution draft:\n{{ $json.email_body }}',
          temperature: 0.2
        }
      },
      {
        id: 'node-check-urgent',
        type: 'ifCondition',
        name: 'Urgent Issue Check',
        position: { x: 800, y: 240 },
        parameters: {
          fieldPath: 'urgency',
          operator: 'equals',
          compareValue: 'Urgent'
        }
      },
      {
        id: 'node-slack-alert',
        type: 'slackNode',
        name: 'Slack Urgent Alert',
        position: { x: 1140, y: 140 },
        parameters: {
          channel: '#customer-escalations',
          message: ':rotating_light: *HIGH URGENCY TICKET RECEIVED*\n*From:* {{ $json.from || "Enterprise Customer" }}\n*Issue:* {{ $json.subject || "Sync failure" }}\n*AI Summary:* {{ $json.aiResult?.summary || $json.summary || "Action needed immediately" }}',
          botName: 'Gemini Escalation Bot'
        }
      },
      {
        id: 'node-auto-responder',
        type: 'respondToWebhook',
        name: 'Draft Email Reply',
        position: { x: 1140, y: 360 },
        parameters: {
          respondWith: 'customJson',
          responseCode: 200,
          customResponsePayload: JSON.stringify({
            status: 'draft_prepared',
            replyTo: 'alex.rivera@enterprise.com',
            draftSubject: 'Re: CRITICAL: Production database sync failing after upgrade',
            content: 'Hello Alex, our engineering team has been paged with highest priority regarding the sync cluster. An on-call engineer is inspecting the EU logs now.'
          }, null, 2)
        }
      }
    ],
    connections: [
      {
        id: 'c-email-ai',
        sourceNodeId: 'node-email-in',
        sourcePortId: 'main',
        targetNodeId: 'node-gemini-classifier',
        targetPortId: 'main'
      },
      {
        id: 'c-ai-if',
        sourceNodeId: 'node-gemini-classifier',
        sourcePortId: 'main',
        targetNodeId: 'node-check-urgent',
        targetPortId: 'main'
      },
      {
        id: 'c-if-urgent',
        sourceNodeId: 'node-check-urgent',
        sourcePortId: 'true',
        targetNodeId: 'node-slack-alert',
        targetPortId: 'main',
        label: 'Urgent'
      },
      {
        id: 'c-if-standard',
        sourceNodeId: 'node-check-urgent',
        sourcePortId: 'false',
        targetNodeId: 'node-auto-responder',
        targetPortId: 'main',
        label: 'Standard'
      }
    ]
  },
  {
    id: 'wf-customer-review-summarizer',
    name: 'Customer Review Summarizer & Slack Dispatcher',
    description: 'Codecademy Article workflow: Inbound customer review webhook, Gemini AI sentiment analysis & action extraction, conditional branching, Slack alerts, and database logging.',
    active: true,
    tags: ['Codecademy Guide', 'Sentiment Analysis', 'Slack', 'Database'],
    scope: 'Personal',
    published: true,
    triggerCount: 8,
    createdAt: '2026-09-10T11:00:00.000Z',
    updatedAt: '2026-09-11T12:15:00.000Z',
    nodes: [
      {
        id: 'node-review-wh',
        type: 'webhookTrigger',
        name: 'Inbound Review Webhook',
        position: { x: 80, y: 240 },
        parameters: {
          httpMethod: 'POST',
          path: 'customer-reviews',
          responseBody: '{\n  "status": "received",\n  "analyzing": true\n}'
        }
      },
      {
        id: 'node-gemini-sentiment',
        type: 'aiAgent',
        name: 'Gemini Sentiment Analyzer',
        position: { x: 440, y: 240 },
        parameters: {
          model: 'gemini-2.5-flash',
          task: 'review_sentiment',
          promptTemplate: 'Analyze user review: extract sentiment (Positive/Neutral/Negative), star rating equivalent (1-5), key highlights, and constructive feedback:\n{{ $json.review_text || $json.body }}',
          temperature: 0.1
        }
      },
      {
        id: 'node-if-negative',
        type: 'ifCondition',
        name: 'Is Negative Feedback?',
        position: { x: 800, y: 240 },
        parameters: {
          fieldPath: 'sentiment',
          operator: 'equals',
          compareValue: 'Negative'
        }
      },
      {
        id: 'node-slack-feedback-alert',
        type: 'slackNode',
        name: 'Slack CS Alert',
        position: { x: 1140, y: 140 },
        parameters: {
          channel: '#customer-experience',
          message: ':warning: *Unhappy Customer Review Alert*\n*Sentiment:* Negative\n*Summary:* {{ $json.aiResult?.summary || "Customer experienced onboarding friction." }}\n*Action Item:* Reach out within 2 hours.',
          botName: 'Voice of Customer AI'
        }
      },
      {
        id: 'node-sql-save-review',
        type: 'sqlQuery',
        name: 'Log Positive Review to SQL',
        position: { x: 1140, y: 360 },
        parameters: {
          operation: 'insert',
          query: 'INSERT INTO customer_reviews (sentiment, rating, summary, created_at) VALUES ("Positive", 5, "Customer praised reliability and workflow speed", NOW());'
        }
      }
    ],
    connections: [
      {
        id: 'c-rev-ai',
        sourceNodeId: 'node-review-wh',
        sourcePortId: 'main',
        targetNodeId: 'node-gemini-sentiment',
        targetPortId: 'main'
      },
      {
        id: 'c-ai-if-neg',
        sourceNodeId: 'node-gemini-sentiment',
        sourcePortId: 'main',
        targetNodeId: 'node-if-negative',
        targetPortId: 'main'
      },
      {
        id: 'c-if-neg-true',
        sourceNodeId: 'node-if-negative',
        sourcePortId: 'true',
        targetNodeId: 'node-slack-feedback-alert',
        targetPortId: 'main',
        label: 'Negative'
      },
      {
        id: 'c-if-neg-false',
        sourceNodeId: 'node-if-negative',
        sourcePortId: 'false',
        targetNodeId: 'node-sql-save-review',
        targetPortId: 'main',
        label: 'Positive'
      }
    ]
  },
  {
    id: 'wf-adaptive-content-intel',
    name: 'Adaptive content intelligence Engine',
    description: 'Automated intelligence pipeline listening for inbound webhooks, executing SQL queries, and responding back.',
    active: false,
    tags: ['AI', 'Content', 'Pipeline'],
    scope: 'Personal',
    published: false,
    triggerCount: 1,
    createdAt: '2026-09-09T14:20:00.000Z',
    updatedAt: '2026-09-09T18:45:00.000Z',
    nodes: [
      {
        id: 'node-webhook-1',
        type: 'webhookTrigger',
        name: 'Webhook',
        position: { x: 260, y: 240 },
        parameters: {
          httpMethod: 'GET',
          path: 'adaptive-intel',
          responseBody: '{\n  "status": "success",\n  "data": []\n}'
        }
      },
      {
        id: 'node-sql-1',
        type: 'sqlQuery',
        name: 'Execute a SQL query',
        subtitle: 'executeQuery',
        position: { x: 580, y: 240 },
        parameters: {
          operation: 'executeQuery',
          query: 'SELECT * FROM content_models WHERE status = "active";'
        }
      },
      {
        id: 'node-respond-1',
        type: 'respondToWebhook',
        name: 'Respond to Webhook',
        position: { x: 900, y: 240 },
        parameters: {
          respondWith: 'allIncomingItems',
          responseCode: 200
        }
      }
    ],
    connections: [
      {
        id: 'conn-wh-sql',
        sourceNodeId: 'node-webhook-1',
        sourcePortId: 'main',
        targetNodeId: 'node-sql-1',
        targetPortId: 'main',
        label: 'GET'
      },
      {
        id: 'conn-sql-respond',
        sourceNodeId: 'node-sql-1',
        sourcePortId: 'main',
        targetNodeId: 'node-respond-1',
        targetPortId: 'main'
      }
    ]
  },
  {
    id: 'wf-content-plan',
    name: 'Content plan',
    description: 'Weekly Instagram content plan generated for @bajajfinance: Manus performance audit, T-2 diagnostic, brand rulebook SQL query, Gemini content strategist, and Teams adaptive cards.',
    active: true,
    tags: ['Social Media', 'Content Generation', 'Instagram', 'Manus AI', 'Google Gemini', 'Teams'],
    scope: 'Personal / For Teams',
    folder: 'For Teams',
    published: true,
    triggerCount: 1,
    createdAt: '2026-09-08T09:00:00.000Z',
    updatedAt: '2026-09-11T16:00:00.000Z',
    settings: {
      executionOrder: 'v1',
      saveExecutionData: 'all',
      timeoutMinutes: 60,
      availableInMCP: true
    },
    nodes: [
      {
        id: '29619930-5daa-4822-9b74-57d962116fe0',
        type: 'scheduleTrigger',
        name: 'Schedule Trigger',
        position: { x: 80, y: 220 },
        parameters: {
          intervalType: 'daily',
          triggerAtHour: 9,
          rule: { interval: [{ triggerAtHour: 9 }] }
        }
      },
      {
        id: '91eae3e9-053d-4585-893c-2e6bcb932a42',
        type: 'sqlQuery',
        name: 'Execute a SQL query',
        position: { x: 380, y: 220 },
        parameters: {
          operation: 'executeQuery',
          query: "SELECT \n  string_agg(\n    '• [' || UPPER(rule_type) || ' - ' || UPPER(rule_category) || '] ' || rule_name || ': ' || rule_statement, \n    E'\\n'\n  ) AS skill_rules\nFROM (\n  SELECT DISTINCT ON (rule_name) \n    rule_type, rule_category, rule_name, rule_statement, confidence_score\n  FROM social_content_rulebook\n  WHERE account_name = 'bajajfinance'\n    AND platform = 'instagram'\n    AND status = 'approved'\n    AND active = TRUE\n  ORDER BY rule_name, confidence_score DESC\n) sub;"
        }
      },
      {
        id: '10d1ab32-f5b8-49f5-9b6d-8391cb3abeb9',
        type: 'httpRequest',
        name: 'Page audit',
        position: { x: 680, y: 220 },
        parameters: {
          method: 'POST',
          url: 'https://api.manus.ai/v2/task.create',
          authType: 'bearer',
          authToken: 'manus-api-key-live',
          sendBody: true,
          bodyContentType: 'json',
          body: JSON.stringify({
            prompt: "Conduct an exhaustive, high-fidelity Instagram performance audit of @bajajfinance. Scrape account metrics, top 20 recent posts, engagement rates, format distribution (Reels vs Carousels vs Static), and pinpoint the post published exactly 48 hours ago (T-2, 6 September 2026). Deliver a diagnostic of what worked, what failed, and the strategic rationale.",
            agent_profile: "manus-1.6-lite",
            task_mode: "agent"
          }, null, 2)
        }
      },
      {
        id: '4b9402b0-22a6-43c3-af0b-dff8bc7ea6c2',
        type: 'waitNode',
        name: 'Wait',
        position: { x: 980, y: 220 },
        parameters: {
          amount: 30,
          unit: 'seconds'
        }
      },
      {
        id: '5dc9e7b7-af44-4232-b262-38eb0bc58874',
        type: 'httpRequest',
        name: 'HTTP Request2',
        position: { x: 1280, y: 220 },
        parameters: {
          method: 'GET',
          url: 'https://api.manus.ai/v2/task.listMessages?task_id={{ $json.task_id }}',
          authType: 'bearer',
          authToken: 'manus-api-key-live'
        }
      },
      {
        id: 'a424dca6-d3a8-4a7a-9a17-b77dfd336afe',
        type: 'ifCondition',
        name: 'If',
        position: { x: 1580, y: 220 },
        parameters: {
          fieldPath: 'messages.0.status_update.agent_status',
          operator: 'equals',
          compareValue: 'stopped'
        }
      },
      {
        id: 'deeee6b3-e98e-47ff-8e2d-cd34c0eacd16',
        type: 'aiAgent',
        name: 'Gemini T-2 Filter',
        position: { x: 1880, y: 120 },
        parameters: {
          model: 'gemini-3.8-flash',
          task: 'instagram_strategy',
          promptTemplate: "You are an Instagram performance analyst. Extract and evaluate ONLY the posts published on T-2 (48 hours ago / 6 September 2026). Output 4 concise sections:\n1. What Worked (Hook, format, saves)\n2. What Did Not Work\n3. Root-Cause Analysis (Why it happened)\n4. Strategic Adjustments for upcoming content"
        }
      },
      {
        id: 'd01d20b4-8b04-4259-9040-8318c6bfff66',
        type: 'httpRequest',
        name: 'Teams T-2 Diagnostic Card',
        position: { x: 2180, y: 120 },
        parameters: {
          method: 'POST',
          url: 'https://powerautomate.microsoft.com/teams/webhook',
          sendBody: true,
          bodyContentType: 'json',
          body: JSON.stringify({
            type: "message",
            attachments: [{
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                type: "AdaptiveCard",
                body: [
                  { type: "TextBlock", text: "📊 Instagram Performance Diagnostic (T-2)", weight: "Bolder", size: "Medium" },
                  { type: "TextBlock", text: "{{ $json.aiResult }}", wrap: true }
                ]
              }
            }]
          }, null, 2)
        }
      },
      {
        id: '644d772e-f83b-45c8-b73f-25f91fd3d97b',
        type: 'aiAgent',
        name: 'Gemini Content Planner',
        position: { x: 2480, y: 120 },
        parameters: {
          model: 'gemini-3.8-flash',
          task: 'social_media_planner',
          promptTemplate: "You are an expert Instagram content strategist for @bajajfinance. Brainstorm exactly 10 highly engaging, specific content topics (4 Short-form Reels, 4 Educational Carousels, 2 Single-image Infographics) addressing consumer personal loan pain points and fraud safety."
        }
      },
      {
        id: 'f5ba5626-ff61-4c3c-aa21-870945ac7ac8',
        type: 'httpRequest',
        name: 'Teams Message',
        position: { x: 2780, y: 120 },
        parameters: {
          method: 'POST',
          url: 'https://powerautomate.microsoft.com/teams/webhook',
          sendBody: true,
          bodyContentType: 'json',
          body: JSON.stringify({
            type: "message",
            attachments: [{
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                type: "AdaptiveCard",
                body: [
                  { type: "TextBlock", text: "🚀 10 Content Topics for @bajajfinance", weight: "Bolder", size: "Medium" },
                  { type: "TextBlock", text: "{{ $json.aiResult }}", wrap: true }
                ]
              }
            }]
          }, null, 2)
        }
      }
    ],
    connections: [
      {
        id: 'c-cp-1',
        sourceNodeId: '29619930-5daa-4822-9b74-57d962116fe0',
        sourcePortId: 'main',
        targetNodeId: '91eae3e9-053d-4585-893c-2e6bcb932a42',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-2',
        sourceNodeId: '91eae3e9-053d-4585-893c-2e6bcb932a42',
        sourcePortId: 'main',
        targetNodeId: '10d1ab32-f5b8-49f5-9b6d-8391cb3abeb9',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-3',
        sourceNodeId: '10d1ab32-f5b8-49f5-9b6d-8391cb3abeb9',
        sourcePortId: 'main',
        targetNodeId: '4b9402b0-22a6-43c3-af0b-dff8bc7ea6c2',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-4',
        sourceNodeId: '4b9402b0-22a6-43c3-af0b-dff8bc7ea6c2',
        sourcePortId: 'main',
        targetNodeId: '5dc9e7b7-af44-4232-b262-38eb0bc58874',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-5',
        sourceNodeId: '5dc9e7b7-af44-4232-b262-38eb0bc58874',
        sourcePortId: 'main',
        targetNodeId: 'a424dca6-d3a8-4a7a-9a17-b77dfd336afe',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-6',
        sourceNodeId: 'a424dca6-d3a8-4a7a-9a17-b77dfd336afe',
        sourcePortId: 'true',
        targetNodeId: 'deeee6b3-e98e-47ff-8e2d-cd34c0eacd16',
        targetPortId: 'main',
        label: 'True'
      },
      {
        id: 'c-cp-7',
        sourceNodeId: 'a424dca6-d3a8-4a7a-9a17-b77dfd336afe',
        sourcePortId: 'false',
        targetNodeId: '4b9402b0-22a6-43c3-af0b-dff8bc7ea6c2',
        targetPortId: 'main',
        label: 'False'
      },
      {
        id: 'c-cp-8',
        sourceNodeId: 'deeee6b3-e98e-47ff-8e2d-cd34c0eacd16',
        sourcePortId: 'main',
        targetNodeId: 'd01d20b4-8b04-4259-9040-8318c6bfff66',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-9',
        sourceNodeId: 'd01d20b4-8b04-4259-9040-8318c6bfff66',
        sourcePortId: 'main',
        targetNodeId: '644d772e-f83b-45c8-b73f-25f91fd3d97b',
        targetPortId: 'main'
      },
      {
        id: 'c-cp-10',
        sourceNodeId: '644d772e-f83b-45c8-b73f-25f91fd3d97b',
        sourcePortId: 'main',
        targetNodeId: 'f5ba5626-ff61-4c3c-aa21-870945ac7ac8',
        targetPortId: 'main'
      }
    ]
  },
  {
    id: 'wf-feedback-governance',
    name: 'Feedback',
    description: 'Strategy governance engine for @bajajfinance Instagram content: Inbound critique webhook, current active SQL rules, Gemini strategy formulator, and PostgreSQL automated rulebook upsert.',
    active: true,
    tags: ['Feedback', 'Governance', 'Instagram Strategy', 'Postgres', 'Google Gemini'],
    scope: 'Personal / For Teams',
    folder: 'For Teams',
    published: true,
    triggerCount: 1,
    createdAt: '2026-08-21T09:00:00.000Z',
    updatedAt: '2026-09-11T16:20:00.000Z',
    settings: {
      executionOrder: 'v1',
      saveExecutionData: 'all',
      timeoutMinutes: 60,
      availableInMCP: true
    },
    nodes: [
      {
        id: '6018ff98-0a90-4a41-8e18-26df394da867',
        type: 'webhookTrigger',
        name: 'Webhook',
        position: { x: 100, y: 220 },
        parameters: {
          httpMethod: 'POST',
          path: '31ef01f5-d582-4e64-9df7-fa5a1c865059',
          responseBody: JSON.stringify({
            status: 'received',
            message: 'Feedback received and passed to AI Governance engine'
          }, null, 2)
        }
      },
      {
        id: 'f48a8536-7b21-4473-ad18-3a9e00922ecb',
        type: 'sqlQuery',
        name: 'Execute a SQL query',
        position: { x: 420, y: 220 },
        parameters: {
          operation: 'executeQuery',
          query: "SELECT \n  string_agg(\n    format('• [%s - %s] %s: %s', upper(rule_type), upper(rule_category), rule_name, rule_statement), \n    E'\\n' ORDER BY rule_id\n  ) AS skill_rules\nFROM social_content_rulebook\nWHERE account_name = 'bajajfinance' \n  AND platform = 'instagram' \n  AND active = TRUE;"
        }
      },
      {
        id: '950102d2-b16c-4047-be70-af116e7a15c3',
        type: 'aiAgent',
        name: 'Message a model',
        position: { x: 740, y: 220 },
        parameters: {
          model: 'gemini-3.8-flash',
          task: 'rule_governance',
          promptTemplate: "You are the strategy governance engine for @bajajfinance's Instagram content.\nThe creative team rejected or critiqued a proposed content plan with this feedback:\n\"{{ $('Webhook').first().json.body.feedback }}\"\n\nCURRENT ACTIVE RULES:\n{{ $('Execute a SQL query').first().json.skill_rules }}\n\nTASK:\nAnalyze the critique. Formulate a specific, actionable rule that prevents this mistake in future content generation."
        }
      },
      {
        id: 'cca35530-58dd-493e-88a6-d9ef2140897e',
        type: 'sqlQuery',
        name: 'Execute a SQL query1',
        position: { x: 1060, y: 220 },
        parameters: {
          operation: 'executeQuery',
          query: "WITH raw_data AS (\n  SELECT '{{ $json.content.parts[0].text.replace(/'/g, \"''\").trim() }}' AS raw_text\n),\nparsed AS (\n  SELECT \n    raw_text::json->>'rule_name'        AS rule_name,\n    raw_text::json->>'rule_statement'   AS rule_statement,\n    raw_text::json->>'rule_category'    AS rule_category,\n    raw_text::json->>'rule_type'        AS rule_type,\n    raw_text::json->>'observation'      AS observation,\n    (raw_text::json->>'confidence_score')::numeric AS confidence_score\n  FROM raw_data\n),\nupsert_rule AS (\n  INSERT INTO social_content_rulebook (\n    account_name, platform, rule_name, rule_statement, \n    rule_category, rule_type, status, active, confidence_score\n  )\n  SELECT \n    'bajajfinance', 'instagram', rule_name, rule_statement,\n    rule_category, rule_type, 'approved', TRUE, confidence_score\n  FROM parsed\n  ON CONFLICT (account_name, platform, rule_name) DO UPDATE\n    SET rule_statement   = EXCLUDED.rule_statement,\n        confidence_score = EXCLUDED.confidence_score,\n        updated_at       = CURRENT_TIMESTAMP\n  RETURNING rule_id\n)\nINSERT INTO social_rule_evidence (\n  rule_id, account_name, platform, evidence_type, raw_critique\n)\nSELECT \n  ur.rule_id, 'bajajfinance', 'instagram', 'human_critique',\n  p.observation\nFROM upsert_rule ur, parsed p;"
        }
      }
    ],
    connections: [
      {
        id: 'c-fb-1',
        sourceNodeId: '6018ff98-0a90-4a41-8e18-26df394da867',
        sourcePortId: 'main',
        targetNodeId: 'f48a8536-7b21-4473-ad18-3a9e00922ecb',
        targetPortId: 'main'
      },
      {
        id: 'c-fb-2',
        sourceNodeId: 'f48a8536-7b21-4473-ad18-3a9e00922ecb',
        sourcePortId: 'main',
        targetNodeId: '950102d2-b16c-4047-be70-af116e7a15c3',
        targetPortId: 'main'
      },
      {
        id: 'c-fb-3',
        sourceNodeId: '950102d2-b16c-4047-be70-af116e7a15c3',
        sourcePortId: 'main',
        targetNodeId: 'cca35530-58dd-493e-88a6-d9ef2140897e',
        targetPortId: 'main'
      }
    ]
  }
];
