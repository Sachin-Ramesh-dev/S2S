import { Workflow } from '../types';

export const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-adaptive-content-intel',
    name: 'Adaptive content intelligence Engine',
    description: 'Automated intelligence pipeline classifying incoming multi-modal requests, sentiment analysis, and topic routing.',
    active: false,
    tags: ['AI', 'Content', 'Pipeline'],
    scope: 'Personal',
    published: false,
    triggerCount: 1,
    createdAt: '2026-09-09T14:20:00.000Z',
    updatedAt: '2026-09-09T18:45:00.000Z',
    nodes: [
      {
        id: 'node-manual-1',
        type: 'manualTrigger',
        name: 'Manual Trigger',
        position: { x: 80, y: 220 },
        parameters: {
          payload: JSON.stringify({
            event: 'content_intel_eval',
            source: 'Adaptive Engine v2',
            prompt: 'Summarize product telemetry report',
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      },
      {
        id: 'node-pii-plugin',
        type: 'piiMaskerPlugin',
        name: 'PII Sanitizer & Masker',
        position: { x: 420, y: 220 },
        parameters: {
          maskEmails: true,
          maskPhones: true,
          redactKeys: 'apiKey, token, secret'
        },
        pluginId: 'plugin-pii-masker'
      },
      {
        id: 'node-crypto-vault',
        type: 'cryptoVault',
        name: 'AES-256-GCM Field Encryptor',
        position: { x: 780, y: 220 },
        parameters: {
          operation: 'encrypt',
          targetField: 'source',
          outputField: 'encryptedSource',
          secretKeyOrPassphrase: 'local-vault-master-key-2026'
        }
      }
    ],
    connections: [
      {
        id: 'conn-1',
        sourceNodeId: 'node-manual-1',
        sourcePortId: 'main',
        targetNodeId: 'node-pii-plugin',
        targetPortId: 'main'
      },
      {
        id: 'conn-2',
        sourceNodeId: 'node-pii-plugin',
        sourcePortId: 'main',
        targetNodeId: 'node-crypto-vault',
        targetPortId: 'main'
      }
    ]
  },
  {
    id: 'wf-content-plan',
    name: 'Content plan',
    description: 'Scheduled multi-step publication pipeline checking calendar schedules, structuring items, and notifying stakeholders.',
    active: true,
    tags: ['Marketing', 'Planning', 'Automation'],
    scope: 'Personal / For Teams',
    published: true,
    triggerCount: 3,
    createdAt: '2026-08-19T10:15:00.000Z',
    updatedAt: '2026-09-09T17:30:00.000Z',
    nodes: [
      {
        id: 'node-wh-1',
        type: 'webhookTrigger',
        name: 'Content Inbound Webhook',
        position: { x: 100, y: 260 },
        parameters: {
          httpMethod: 'POST',
          authSecret: 'content_token_889'
        }
      },
      {
        id: 'node-if-role',
        type: 'ifCondition',
        name: 'Verify Publication State',
        position: { x: 440, y: 260 },
        parameters: {
          fieldPath: 'status',
          operator: 'equals',
          compareValue: 'approved'
        }
      },
      {
        id: 'node-admin-action',
        type: 'setFields',
        name: 'Publish to Staging Target',
        position: { x: 800, y: 140 },
        parameters: {
          keepOnlySet: false,
          assignments: JSON.stringify({
            published: true,
            tier: 'Enterprise Channel'
          }, null, 2)
        }
      },
      {
        id: 'node-guest-action',
        type: 'setFields',
        name: 'Queue Revision Review',
        position: { x: 800, y: 380 },
        parameters: {
          keepOnlySet: false,
          assignments: JSON.stringify({
            needsApproval: true
          }, null, 2)
        }
      }
    ],
    connections: [
      {
        id: 'conn-wh-if',
        sourceNodeId: 'node-wh-1',
        sourcePortId: 'main',
        targetNodeId: 'node-if-role',
        targetPortId: 'main'
      },
      {
        id: 'conn-if-true',
        sourceNodeId: 'node-if-role',
        sourcePortId: 'true',
        targetNodeId: 'node-admin-action',
        targetPortId: 'main'
      },
      {
        id: 'conn-if-false',
        sourceNodeId: 'node-if-role',
        sourcePortId: 'false',
        targetNodeId: 'node-guest-action',
        targetPortId: 'main'
      }
    ]
  },
  {
    id: 'wf-feedback-collector',
    name: 'Feedback',
    description: 'Collects feedback responses, filters sentiment rating, and dispatches sanitized alert notifications.',
    active: true,
    tags: ['Feedback', 'CSAT', 'Support'],
    scope: 'Personal / For Teams',
    published: true,
    triggerCount: 2,
    createdAt: '2026-08-21T09:00:00.000Z',
    updatedAt: '2026-09-09T16:10:00.000Z',
    nodes: [
      {
        id: 'node-manual-csv',
        type: 'manualTrigger',
        name: 'Feedback Poller',
        position: { x: 80, y: 220 },
        parameters: {
          payload: JSON.stringify({
            rating: 5,
            comment: 'Flawless execution and zero data leaks.',
            userCategory: 'Enterprise Customer'
          }, null, 2)
        }
      },
      {
        id: 'node-csv-plugin',
        type: 'csvParserPlugin',
        name: 'CSV to JSON Transformer',
        position: { x: 420, y: 220 },
        parameters: {
          delimiter: ',',
          trimWhitespace: true
        },
        pluginId: 'plugin-csv-parser'
      },
      {
        id: 'node-webhook-out',
        type: 'webhookSender',
        name: 'Feedback Alert Webhook',
        position: { x: 840, y: 220 },
        parameters: {
          webhookUrl: 'https://httpbin.org/post',
          format: 'raw'
        }
      }
    ],
    connections: [
      {
        id: 'c-csv-1',
        sourceNodeId: 'node-manual-csv',
        sourcePortId: 'main',
        targetNodeId: 'node-csv-plugin',
        targetPortId: 'main'
      },
      {
        id: 'c-csv-2',
        sourceNodeId: 'node-csv-plugin',
        sourcePortId: 'main',
        targetNodeId: 'node-webhook-out',
        targetPortId: 'main'
      }
    ]
  }
];
