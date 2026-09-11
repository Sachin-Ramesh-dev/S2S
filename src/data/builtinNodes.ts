import { NodeDefinition } from '../types';

export const BUILTIN_NODES: NodeDefinition[] = [
  {
    type: 'manualTrigger',
    name: 'Manual Trigger',
    category: 'trigger',
    description: 'Trigger the workflow manually with custom test input data or default payload.',
    icon: 'Play',
    color: '#10B981', // emerald
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'payload',
        label: 'Initial JSON Payload',
        type: 'json',
        default: '{\n  "event": "manual_trigger",\n  "timestamp": "2026-09-11T12:00:00Z",\n  "user": {\n    "id": "usr_94102",\n    "name": "Jane Doe",\n    "email": "jane.doe@example.local",\n    "role": "security_admin"\n  }\n}',
        description: 'Provide the sample or starting JSON payload for this trigger.'
      }
    ],
    defaultParameters: {
      payload: '{\n  "event": "manual_trigger",\n  "timestamp": "2026-09-11T12:00:00Z",\n  "user": {\n    "id": "usr_94102",\n    "name": "Jane Doe",\n    "email": "jane.doe@example.local",\n    "role": "security_admin"\n  }\n}'
    }
  },
  {
    type: 'webhookTrigger',
    name: 'Webhook Trigger',
    category: 'trigger',
    description: 'Listen for external incoming HTTP POST / GET webhooks directly to this local instance.',
    icon: 'Webhook',
    color: '#059669', // darker emerald
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'httpMethod',
        label: 'HTTP Method',
        type: 'select',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
          { label: 'PUT', value: 'PUT' }
        ],
        default: 'POST',
        required: true
      },
      {
        name: 'authSecret',
        label: 'Authorization Token / Secret (Optional)',
        type: 'string',
        placeholder: 'Bearer token or secret header',
        description: 'If set, incoming requests must include matching Authorization or X-Webhook-Token header.'
      },
      {
        name: 'responseBody',
        label: 'Immediate Response Body',
        type: 'json',
        default: '{\n  "status": "success",\n  "message": "Webhook received and queued locally"\n}'
      }
    ],
    defaultParameters: {
      httpMethod: 'POST',
      authSecret: '',
      responseBody: '{\n  "status": "success",\n  "message": "Webhook received and queued locally"\n}'
    }
  },
  {
    type: 'scheduleTrigger',
    name: 'Schedule / Cron',
    category: 'trigger',
    description: 'Trigger workflow periodically on intervals (minutes, hours) or cron expressions.',
    icon: 'Clock',
    color: '#047857',
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'intervalType',
        label: 'Interval Frequency',
        type: 'select',
        options: [
          { label: 'Every 5 Minutes', value: '5min' },
          { label: 'Every 15 Minutes', value: '15min' },
          { label: 'Every Hour', value: '1hour' },
          { label: 'Every Day (Daily)', value: 'daily' },
          { label: 'Custom Cron', value: 'cron' }
        ],
        default: '1hour'
      },
      {
        name: 'cronExpression',
        label: 'Cron Expression',
        type: 'string',
        default: '0 * * * *',
        placeholder: '*/15 * * * *'
      }
    ],
    defaultParameters: {
      intervalType: '1hour',
      cronExpression: '0 * * * *'
    }
  },
  {
    type: 'httpRequest',
    name: 'HTTP Request',
    category: 'action',
    description: 'Execute REST, GraphQL, or raw API calls to external services or local servers.',
    icon: 'Globe',
    color: '#0284C7', // sky blue
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'method',
        label: 'Method',
        type: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ],
        default: 'GET',
        required: true
      },
      {
        name: 'url',
        label: 'URL Endpoint',
        type: 'string',
        placeholder: 'https://api.example.com/v1/data or {{ $json.apiUrl }}',
        default: 'https://jsonplaceholder.typicode.com/todos/1',
        required: true,
        description: 'Supports dynamic expressions e.g. {{ $json.userId }}'
      },
      {
        name: 'authType',
        label: 'Authentication',
        type: 'select',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Bearer Token', value: 'bearer' },
          { label: 'Basic Auth', value: 'basic' },
          { label: 'Use Vault Credential', value: 'vault' }
        ],
        default: 'none'
      },
      {
        name: 'authToken',
        label: 'Bearer / Auth Token',
        type: 'secret',
        placeholder: 'Secret token or API key',
        description: 'Sensitive credentials are encrypted in local vault.'
      },
      {
        name: 'headers',
        label: 'Custom Headers (JSON)',
        type: 'json',
        default: '{\n  "Accept": "application/json",\n  "Content-Type": "application/json"\n}'
      },
      {
        name: 'body',
        label: 'Request Body (JSON)',
        type: 'json',
        default: '{\n  "processed": true\n}',
        description: 'Leave empty or formatted for POST/PUT/PATCH'
      }
    ],
    defaultParameters: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      authType: 'none',
      authToken: '',
      headers: '{\n  "Accept": "application/json",\n  "Content-Type": "application/json"\n}',
      body: ''
    }
  },
  {
    type: 'codeJs',
    name: 'Code (JavaScript)',
    category: 'transform',
    description: 'Execute arbitrary JavaScript logic to transform, aggregate, or clean data items.',
    icon: 'Code2',
    color: '#8B5CF6', // violet
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'code',
        label: 'JavaScript Transform Code',
        type: 'code',
        default: `// item contains the input data from previous node
// return the transformed item or array of items
const data = Array.isArray(items) ? items : [items];

return data.map(item => ({
  ...item,
  processedAt: new Date().toISOString(),
  sanitized: true,
  summary: \`Processed record for \${item.user?.name || item.title || 'Unknown'}\`
}));`,
        description: 'Accessible variables: items, item, $json, console, Math, Date.'
      }
    ],
    defaultParameters: {
      code: `// items: incoming data from previous node
const data = Array.isArray(items) ? items : [items];

return data.map(item => ({
  ...item,
  processedAt: new Date().toISOString(),
  sanitized: true,
  summary: \`Processed record for \${item.user?.name || item.title || 'Unknown'}\`
}));`
    }
  },
  {
    type: 'ifCondition',
    name: 'If / Filter Condition',
    category: 'logic',
    description: 'Route execution down True or False branches based on dynamic value comparisons.',
    icon: 'GitBranch',
    color: '#F59E0B', // amber
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [
      { id: 'true', label: 'True', type: 'true' },
      { id: 'false', label: 'False', type: 'false' }
    ],
    parametersSchema: [
      {
        name: 'fieldPath',
        label: 'Field to Check (JSON path)',
        type: 'string',
        default: 'user.role',
        placeholder: 'e.g. user.role or status or completed',
        required: true
      },
      {
        name: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { label: 'Equals (==)', value: 'equals' },
          { label: 'Not Equals (!=)', value: 'not_equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Does Not Contain', value: 'not_contains' },
          { label: 'Greater Than (>)', value: 'greater_than' },
          { label: 'Less Than (<)', value: 'less_than' },
          { label: 'Is Empty / Null', value: 'is_empty' },
          { label: 'Is Not Empty', value: 'is_not_empty' }
        ],
        default: 'equals',
        required: true
      },
      {
        name: 'compareValue',
        label: 'Value to Compare Against',
        type: 'string',
        default: 'security_admin',
        placeholder: 'Comparison value'
      }
    ],
    defaultParameters: {
      fieldPath: 'user.role',
      operator: 'equals',
      compareValue: 'security_admin'
    }
  },
  {
    type: 'setFields',
    name: 'Edit Fields (Set)',
    category: 'transform',
    description: 'Add new fields, overwrite values, or drop unneeded properties from payload.',
    icon: 'SlidersHorizontal',
    color: '#6366F1', // indigo
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'keepOnlySet',
        label: 'Keep Only Set Fields',
        type: 'boolean',
        default: false,
        description: 'If checked, all other unlisted fields will be dropped from payload.'
      },
      {
        name: 'assignments',
        label: 'Fields to Set (JSON Key/Value Map)',
        type: 'json',
        default: '{\n  "environment": "self-hosted-local",\n  "securityLevel": "tier_1",\n  "auditStatus": "verified"\n}',
        description: 'Provide key-value pairs. Values can reference expressions.'
      }
    ],
    defaultParameters: {
      keepOnlySet: false,
      assignments: '{\n  "environment": "self-hosted-local",\n  "securityLevel": "tier_1",\n  "auditStatus": "verified"\n}'
    }
  },
  {
    type: 'cryptoVault',
    name: 'Crypto & E2EE Vault',
    category: 'security',
    description: 'Encrypt sensitive fields with AES-256-GCM, calculate SHA-256 hashes, or generate HMAC signatures.',
    icon: 'ShieldCheck',
    color: '#E11D48', // rose
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'operation',
        label: 'Operation',
        type: 'select',
        options: [
          { label: 'AES-256-GCM Encrypt Field', value: 'encrypt' },
          { label: 'AES-256-GCM Decrypt Field', value: 'decrypt' },
          { label: 'SHA-256 Hash Field', value: 'sha256' },
          { label: 'Base64 Encode', value: 'base64_encode' },
          { label: 'Base64 Decode', value: 'base64_decode' }
        ],
        default: 'encrypt'
      },
      {
        name: 'targetField',
        label: 'Target Field (JSON Path)',
        type: 'string',
        default: 'user.email',
        placeholder: 'e.g. user.email or sensitiveData',
        required: true
      },
      {
        name: 'outputField',
        label: 'Destination Field Name',
        type: 'string',
        default: 'encryptedUserEmail',
        placeholder: 'Field name where result will be written'
      },
      {
        name: 'secretKeyOrPassphrase',
        label: 'Secret Encryption Key / Passphrase',
        type: 'secret',
        default: 'local-vault-master-key-2026',
        description: 'Key used for cryptographic AES-GCM operation.'
      }
    ],
    defaultParameters: {
      operation: 'encrypt',
      targetField: 'user.email',
      outputField: 'encryptedUserEmail',
      secretKeyOrPassphrase: 'local-vault-master-key-2026'
    }
  },
  {
    type: 'delay',
    name: 'Delay / Sleep',
    category: 'utility',
    description: 'Wait for a specified duration before continuing workflow execution.',
    icon: 'Hourglass',
    color: '#64748B', // slate
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'durationMs',
        label: 'Delay Duration (Milliseconds)',
        type: 'number',
        default: 500,
        required: true,
        description: 'Duration in ms (e.g. 500 = 0.5s, 2000 = 2s)'
      }
    ],
    defaultParameters: {
      durationMs: 500
    }
  },
  {
    type: 'webhookSender',
    name: 'Webhook Dispatcher',
    category: 'action',
    description: 'Send sanitized workflow results to Discord, Slack, or any custom API webhook.',
    icon: 'Send',
    color: '#0D9488', // teal
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'webhookUrl',
        label: 'Webhook Destination URL',
        type: 'string',
        default: 'https://httpbin.org/post',
        placeholder: 'https://webhook.site/... or Slack webhook URL'
      },
      {
        name: 'format',
        label: 'Payload Format',
        type: 'select',
        options: [
          { label: 'Raw JSON Pipeline Data', value: 'raw' },
          { label: 'Slack Compatible Block Message', value: 'slack' },
          { label: 'Discord Embed', value: 'discord' }
        ],
        default: 'raw'
      }
    ],
    defaultParameters: {
      webhookUrl: 'https://httpbin.org/post',
      format: 'raw'
    }
  }
];

export function getNodeDefinition(type: string, customPlugins: NodeDefinition[] = []): NodeDefinition | undefined {
  const builtin = BUILTIN_NODES.find(n => n.type === type);
  if (builtin) return builtin;
  return customPlugins.find(n => n.type === type);
}
