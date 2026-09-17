import { NodeDefinition } from '../types';

export const BUILTIN_NODES: NodeDefinition[] = [
  // ==========================================
  // 1. TRIGGER NODES
  // ==========================================
  {
    type: 'manualTrigger',
    name: 'Manual Trigger',
    category: 'trigger',
    description: "Trigger the workflow manually when clicking 'Test step' or 'Execute workflow'.",
    icon: 'Play',
    color: '#10B981', // emerald
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'noticeManual',
        label: 'Trigger Information',
        type: 'notice',
        noticeType: 'info',
        noticeText: "This trigger initiates the workflow upon clicking 'Test step' or 'Execute workflow' in S2S."
      },
      {
        name: 'payload',
        label: 'Test Input Data (JSON)',
        type: 'json',
        default: '{\n  "event": "manual_trigger",\n  "timestamp": "2026-09-11T12:00:00Z",\n  "user": {\n    "id": 101,\n    "name": "Alex Mercer",\n    "email": "alex.mercer@example.com",\n    "role": "admin"\n  }\n}',
        description: 'Initial JSON items emitted downstream when triggered.'
      }
    ],
    defaultParameters: {
      payload: '{\n  "event": "manual_trigger",\n  "timestamp": "2026-09-11T12:00:00Z",\n  "user": {\n    "id": 101,\n    "name": "Alex Mercer",\n    "email": "alex.mercer@example.com",\n    "role": "admin"\n  }\n}'
    }
  },
  {
    type: 'webhookTrigger',
    name: 'Webhook',
    category: 'trigger',
    description: 'Listens for incoming HTTP POST, GET, PUT, or DELETE webhooks.',
    icon: 'Webhook',
    color: '#F43F5E', // rose / n8n signature
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'noticeWebhook',
        label: 'Webhook Endpoint',
        type: 'notice',
        noticeType: 'info',
        noticeText: 'External services can post JSON payloads directly to this S2S webhook endpoint URL.'
      },
      {
        name: 'httpMethod',
        label: 'HTTP Method',
        type: 'options',
        options: [
          { label: 'POST', value: 'POST', description: 'Standard method for webhooks delivering payloads' },
          { label: 'GET', value: 'GET', description: 'For health checks or simple URL pings' },
          { label: 'PUT', value: 'PUT', description: 'For resource replacements' },
          { label: 'DELETE', value: 'DELETE', description: 'For deletion notification events' }
        ],
        default: 'POST',
        required: true
      },
      {
        name: 'path',
        label: 'Webhook Path Slug',
        type: 'string',
        default: 'webhook-listener',
        placeholder: 'e.g. stripe-events or github-webhook',
        supportsExpression: false
      },
      {
        name: 'responseMode',
        label: 'Response Mode',
        type: 'options',
        options: [
          { label: 'On Received (Immediately)', value: 'onReceived', description: 'Returns immediate 200 response to caller' },
          { label: 'When Last Node Finishes', value: 'lastNode', description: 'Responds with payload from Respond to Webhook node' }
        ],
        default: 'onReceived'
      },
      {
        name: 'authSecret',
        label: 'Header Secret / Bearer Token',
        type: 'secret',
        placeholder: 'Optional secret token',
        description: 'If set, callers must provide Authorization: Bearer <token> or X-Webhook-Secret header.'
      },
      {
        name: 'responseBody',
        label: 'Immediate Response Body (JSON)',
        type: 'json',
        default: '{\n  "status": "success",\n  "message": "Webhook received by S2S"\n}',
        displayOptions: {
          show: { responseMode: ['onReceived'] }
        }
      }
    ],
    defaultParameters: {
      httpMethod: 'POST',
      path: 'webhook-listener',
      responseMode: 'onReceived',
      authSecret: '',
      responseBody: '{\n  "status": "success",\n  "message": "Webhook received by S2S"\n}'
    }
  },
  {
    type: 'scheduleTrigger',
    name: 'Schedule Trigger',
    category: 'trigger',
    description: 'Triggers the workflow periodically at set intervals or cron schedules.',
    icon: 'Clock',
    color: '#059669', // emerald
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'intervalType',
        label: 'Trigger Interval',
        type: 'options',
        options: [
          { label: 'Every 5 Minutes', value: '5min' },
          { label: 'Every 15 Minutes', value: '15min' },
          { label: 'Every Hour', value: '1hour' },
          { label: 'Every Day (Daily)', value: 'daily' },
          { label: 'Custom Cron Expression', value: 'cron' }
        ],
        default: '1hour'
      },
      {
        name: 'cronExpression',
        label: 'Cron Expression',
        type: 'string',
        default: '0 * * * *',
        placeholder: 'e.g. */15 * * * * or 0 9 * * 1-5',
        displayOptions: {
          show: { intervalType: ['cron'] }
        }
      },
      {
        name: 'triggerTime',
        label: 'Hour of Day (24h format)',
        type: 'number',
        default: 9,
        displayOptions: {
          show: { intervalType: ['daily'] }
        }
      }
    ],
    defaultParameters: {
      intervalType: '1hour',
      cronExpression: '0 * * * *',
      triggerTime: 9
    }
  },
  {
    type: 'intervalTrigger',
    name: 'Interval',
    category: 'trigger',
    description: 'Runs workflow repeatedly every N seconds, minutes, or hours.',
    icon: 'Clock',
    color: '#0D9488', // teal
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'intervalValue',
        label: 'Interval Value',
        type: 'number',
        default: 30,
        required: true
      },
      {
        name: 'unit',
        label: 'Unit',
        type: 'options',
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' }
        ],
        default: 'minutes'
      }
    ],
    defaultParameters: {
      intervalValue: 30,
      unit: 'minutes'
    }
  },
  {
    type: 'errorTrigger',
    name: 'Error Trigger',
    category: 'trigger',
    description: 'Triggers when another workflow in the system encounters an unhandled execution error.',
    icon: 'AlertTriangle',
    color: '#DC2626', // red
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'noticeError',
        label: 'Error Handler',
        type: 'notice',
        noticeType: 'warning',
        noticeText: 'This workflow will be automatically invoked whenever any tracked workflow execution fails.'
      },
      {
        name: 'includeStackTrace',
        label: 'Include Error Stack Trace',
        type: 'boolean',
        default: true
      }
    ],
    defaultParameters: {
      includeStackTrace: true
    }
  },

  // ==========================================
  // 2. LOGIC & FLOW CONTROL NODES
  // ==========================================
  {
    type: 'ifCondition',
    name: 'If',
    category: 'logic',
    description: 'Routes execution down True or False branches based on dynamic value comparisons.',
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
        label: 'Value 1 (JSON Path or Expression)',
        type: 'string',
        default: 'user.role',
        placeholder: 'e.g. user.role or {{ $json.status }}',
        supportsExpression: true,
        required: true
      },
      {
        name: 'operator',
        label: 'Operation',
        type: 'options',
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
        label: 'Value 2 to Compare Against',
        type: 'string',
        default: 'admin',
        placeholder: 'e.g. admin or active',
        supportsExpression: true,
        displayOptions: {
          hide: { operator: ['is_empty', 'is_not_empty'] }
        }
      }
    ],
    defaultParameters: {
      fieldPath: 'user.role',
      operator: 'equals',
      compareValue: 'admin'
    }
  },
  {
    type: 'switchNode',
    name: 'Switch',
    category: 'logic',
    description: 'Routes items down multiple distinct outputs based on matching rules or expression values.',
    icon: 'GitBranch',
    color: '#EA580C', // orange
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [
      { id: 'output_0', label: 'Output 0', type: 'main' },
      { id: 'output_1', label: 'Output 1', type: 'main' },
      { id: 'output_2', label: 'Output 2', type: 'main' },
      { id: 'fallback', label: 'Fallback', type: 'main' }
    ],
    parametersSchema: [
      {
        name: 'mode',
        label: 'Routing Mode',
        type: 'options',
        options: [
          { label: 'Rules', value: 'rules', description: 'Evaluate list of conditional matching rules' },
          { label: 'Expression', value: 'expression', description: 'Route according to numeric output index result' }
        ],
        default: 'rules'
      },
      {
        name: 'routingField',
        label: 'Value to Route On',
        type: 'string',
        default: 'status',
        placeholder: 'e.g. status or category',
        supportsExpression: true
      },
      {
        name: 'rule0Value',
        label: 'Output 0 Matches',
        type: 'string',
        default: 'approved',
        placeholder: 'Value for Output 0'
      },
      {
        name: 'rule1Value',
        label: 'Output 1 Matches',
        type: 'string',
        default: 'pending',
        placeholder: 'Value for Output 1'
      },
      {
        name: 'rule2Value',
        label: 'Output 2 Matches',
        type: 'string',
        default: 'rejected',
        placeholder: 'Value for Output 2'
      }
    ],
    defaultParameters: {
      mode: 'rules',
      routingField: 'status',
      rule0Value: 'approved',
      rule1Value: 'pending',
      rule2Value: 'rejected'
    }
  },
  {
    type: 'filterNode',
    name: 'Filter',
    category: 'logic',
    description: 'Removes items that do not meet specified criteria from the data stream.',
    icon: 'Filter',
    color: '#8B5CF6', // violet
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'fieldPath',
        label: 'Field to Filter On',
        type: 'string',
        default: 'active',
        placeholder: 'e.g. active or score',
        supportsExpression: true
      },
      {
        name: 'operator',
        label: 'Condition',
        type: 'options',
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'not_equals' },
          { label: 'Greater Than', value: 'greater_than' },
          { label: 'Less Than', value: 'less_than' },
          { label: 'Is Not Empty', value: 'is_not_empty' }
        ],
        default: 'equals'
      },
      {
        name: 'filterValue',
        label: 'Target Value',
        type: 'string',
        default: 'true',
        supportsExpression: true
      }
    ],
    defaultParameters: {
      fieldPath: 'active',
      operator: 'equals',
      filterValue: 'true'
    }
  },
  {
    type: 'loopBatchNode',
    name: 'Loop Over Items',
    category: 'logic',
    description: 'Processes incoming array of items one by one or in configurable batch sizes.',
    icon: 'Repeat',
    color: '#3B82F6', // blue
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [
      { id: 'loop', label: 'Loop (Batch)', type: 'main' },
      { id: 'done', label: 'Done', type: 'main' }
    ],
    parametersSchema: [
      {
        name: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        default: 1,
        description: 'Number of items to output in each iteration loop.'
      },
      {
        name: 'noticeLoop',
        label: 'Looping Information',
        type: 'notice',
        noticeType: 'info',
        noticeText: "Connect the 'Loop' output to actions to repeat, and connect their output back or proceed to 'Done'."
      }
    ],
    defaultParameters: {
      batchSize: 1
    }
  },
  {
    type: 'mergeNode',
    name: 'Merge',
    category: 'logic',
    description: 'Combines data streams from multiple previous nodes into a unified dataset.',
    icon: 'GitMerge',
    color: '#14B8A6', // teal
    inputs: [
      { id: 'input1', label: 'Input 1', type: 'main' },
      { id: 'input2', label: 'Input 2', type: 'main' }
    ],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'mode',
        label: 'Merge Mode',
        type: 'options',
        options: [
          { label: 'Append (Combine all items into one list)', value: 'append' },
          { label: 'Combine by Key (Join on matching field)', value: 'combineByKey' },
          { label: 'Combine by Position (Merge items item-by-item)', value: 'combineByPosition' },
          { label: 'Choose Branch (Pass either Input 1 or Input 2)', value: 'chooseBranch' }
        ],
        default: 'append'
      },
      {
        name: 'joinKey1',
        label: 'Input 1 Join Key',
        type: 'string',
        default: 'id',
        displayOptions: {
          show: { mode: ['combineByKey'] }
        }
      },
      {
        name: 'joinKey2',
        label: 'Input 2 Join Key',
        type: 'string',
        default: 'userId',
        displayOptions: {
          show: { mode: ['combineByKey'] }
        }
      }
    ],
    defaultParameters: {
      mode: 'append',
      joinKey1: 'id',
      joinKey2: 'userId'
    }
  },
  {
    type: 'waitNode',
    name: 'Wait',
    category: 'logic',
    description: 'Pauses execution for a specified duration or until an external event occurs.',
    icon: 'Hourglass',
    color: '#64748B', // slate
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'resumeMode',
        label: 'Resume Condition',
        type: 'options',
        options: [
          { label: 'After Time Interval', value: 'timeInterval' },
          { label: 'On Webhook Call', value: 'webhook' }
        ],
        default: 'timeInterval'
      },
      {
        name: 'amount',
        label: 'Wait Amount',
        type: 'number',
        default: 5,
        displayOptions: {
          show: { resumeMode: ['timeInterval'] }
        }
      },
      {
        name: 'unit',
        label: 'Time Unit',
        type: 'options',
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' }
        ],
        default: 'seconds',
        displayOptions: {
          show: { resumeMode: ['timeInterval'] }
        }
      }
    ],
    defaultParameters: {
      resumeMode: 'timeInterval',
      amount: 5,
      unit: 'seconds'
    }
  },
  {
    type: 'stopAndErrorNode',
    name: 'Stop and Error',
    category: 'logic',
    description: 'Intentionally halts workflow execution and raises a descriptive error.',
    icon: 'AlertOctagon',
    color: '#E11D48', // rose
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [],
    parametersSchema: [
      {
        name: 'errorMessage',
        label: 'Error Message',
        type: 'string',
        default: 'Execution stopped due to validation failure.',
        supportsExpression: true,
        required: true
      },
      {
        name: 'errorCode',
        label: 'Error Code',
        type: 'string',
        default: 'ERR_VALIDATION_FAILED',
        supportsExpression: false
      }
    ],
    defaultParameters: {
      errorMessage: 'Execution stopped due to validation failure.',
      errorCode: 'ERR_VALIDATION_FAILED'
    }
  },

  // ==========================================
  // 3. TRANSFORM & CODE NODES
  // ==========================================
  {
    type: 'codeJs',
    name: 'Code',
    category: 'transform',
    description: 'Execute custom JavaScript or Python code to transform and manipulate items.',
    icon: 'Code2',
    color: '#8B5CF6', // violet
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'language',
        label: 'Language',
        type: 'options',
        options: [
          { label: 'JavaScript', value: 'javaScript' },
          { label: 'Python (Simulated)', value: 'python' }
        ],
        default: 'javaScript'
      },
      {
        name: 'mode',
        label: 'Execution Mode',
        type: 'options',
        options: [
          { label: 'Run Once for All Items', value: 'runOnceForAllItems', description: 'Access items as an array via $input.all()' },
          { label: 'Run Once for Each Item', value: 'runOnceForEachItem', description: 'Access individual item via $json' }
        ],
        default: 'runOnceForAllItems'
      },
      {
        name: 'code',
        label: 'Code Sandbox',
        type: 'code',
        typeOptions: { language: 'javascript', rows: 10 },
        default: `// Loop over all incoming items and transform them
const items = $input.all();

return items.map(item => ({
  ...item,
  processedAt: new Date().toISOString(),
  sanitized: true,
  summary: \`Record for \${item.name || item.user?.name || item.id || 'Item'}\`
}));`,
        description: 'Variables available: $input.all(), $input.first(), $json, items, console, Date, Math.'
      }
    ],
    defaultParameters: {
      language: 'javaScript',
      mode: 'runOnceForAllItems',
      code: `// Loop over all incoming items and transform them
const items = $input.all();

return items.map(item => ({
  ...item,
  processedAt: new Date().toISOString(),
  sanitized: true,
  summary: \`Record for \${item.name || item.user?.name || item.id || 'Item'}\`
}));`
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
        description: 'If enabled, all incoming fields not explicitly set here are removed.'
      },
      {
        name: 'assignments',
        label: 'Field Assignments',
        type: 'fixedCollection',
        description: 'Specify fields to create or update with fixed values or expressions.',
        collectionFields: [
          { name: 'name', label: 'Field Name', type: 'string', placeholder: 'e.g. processedStatus' },
          { name: 'value', label: 'Value / Expression', type: 'string', placeholder: 'e.g. approved or {{ $now }}' }
        ],
        default: [
          { name: 'environment', value: 'production' },
          { name: 'auditStatus', value: 'verified' },
          { name: 'processedAt', value: '{{ $now }}' }
        ]
      }
    ],
    defaultParameters: {
      keepOnlySet: false,
      assignments: [
        { name: 'environment', value: 'production' },
        { name: 'auditStatus', value: 'verified' },
        { name: 'processedAt', value: '{{ $now }}' }
      ]
    }
  },
  {
    type: 'aggregateNode',
    name: 'Aggregate',
    category: 'transform',
    description: 'Condense, group, summarize, or sort items into aggregated collections.',
    icon: 'Boxes',
    color: '#0284C7', // sky blue
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'aggregateMode',
        label: 'Aggregate Type',
        type: 'options',
        options: [
          { label: 'Aggregate All Items into a Single List', value: 'allToList' },
          { label: 'Sort Items by Field', value: 'sort' },
          { label: 'Remove Duplicate Items', value: 'deduplicate' }
        ],
        default: 'allToList'
      },
      {
        name: 'destinationFieldName',
        label: 'Output Field Name',
        type: 'string',
        default: 'dataList',
        displayOptions: {
          show: { aggregateMode: ['allToList'] }
        }
      },
      {
        name: 'sortField',
        label: 'Field to Sort by',
        type: 'string',
        default: 'id',
        displayOptions: {
          show: { aggregateMode: ['sort'] }
        }
      },
      {
        name: 'sortDirection',
        label: 'Sort Direction',
        type: 'options',
        options: [
          { label: 'Ascending (A-Z, 0-9)', value: 'asc' },
          { label: 'Descending (Z-A, 9-0)', value: 'desc' }
        ],
        default: 'asc',
        displayOptions: {
          show: { aggregateMode: ['sort'] }
        }
      }
    ],
    defaultParameters: {
      aggregateMode: 'allToList',
      destinationFieldName: 'dataList',
      sortField: 'id',
      sortDirection: 'asc'
    }
  },
  {
    type: 'cryptoVault',
    name: 'Crypto',
    category: 'security',
    description: 'Encrypt/decrypt fields with AES-256-GCM, compute SHA-256 hashes, or encode/decode Base64.',
    icon: 'ShieldCheck',
    color: '#E11D48', // rose
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'operation',
        label: 'Operation',
        type: 'options',
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
        supportsExpression: true,
        required: true
      },
      {
        name: 'outputField',
        label: 'Destination Field Name',
        type: 'string',
        default: 'encryptedUserEmail',
        placeholder: 'Name of field to store the result'
      },
      {
        name: 'secretKeyOrPassphrase',
        label: 'Secret Passphrase / Encryption Key',
        type: 'secret',
        default: 's2s-vault-master-key-2026',
        description: 'Passphrase used for the cryptographic transformation.',
        displayOptions: {
          show: { operation: ['encrypt', 'decrypt'] }
        }
      }
    ],
    defaultParameters: {
      operation: 'encrypt',
      targetField: 'user.email',
      outputField: 'encryptedUserEmail',
      secretKeyOrPassphrase: 's2s-vault-master-key-2026'
    }
  },

  // ==========================================
  // 4. ACTION & EXTERNAL INTEGRATIONS
  // ==========================================
  {
    type: 'httpRequest',
    name: 'HTTP Request',
    category: 'action',
    description: 'Calls external REST APIs, webhooks, or internal microservices with complete HTTP control.',
    icon: 'Globe',
    color: '#0284C7', // sky blue
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'method',
        label: 'Method',
        type: 'options',
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
        supportsExpression: true,
        required: true
      },
      {
        name: 'authType',
        label: 'Authentication',
        type: 'options',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Bearer Token', value: 'bearer' },
          { label: 'Basic Auth', value: 'basic' },
          { label: 'Vault Credential', value: 'vault' }
        ],
        default: 'none'
      },
      {
        name: 'authToken',
        label: 'Bearer Token / API Key',
        type: 'secret',
        placeholder: 'Bearer token string',
        displayOptions: {
          show: { authType: ['bearer'] }
        }
      },
      {
        name: 'queryParameters',
        label: 'Query Parameters',
        type: 'fixedCollection',
        collectionFields: [
          { name: 'name', label: 'Parameter Name', type: 'string', placeholder: 'e.g. limit' },
          { name: 'value', label: 'Value', type: 'string', placeholder: 'e.g. 50' }
        ],
        default: []
      },
      {
        name: 'headersCollection',
        label: 'Custom Headers',
        type: 'fixedCollection',
        collectionFields: [
          { name: 'name', label: 'Header Name', type: 'string', placeholder: 'e.g. X-Custom-Header' },
          { name: 'value', label: 'Value', type: 'string', placeholder: 'e.g. custom-value' }
        ],
        default: [
          { name: 'Accept', value: 'application/json' },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      {
        name: 'sendBody',
        label: 'Send Request Body',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: { method: ['POST', 'PUT', 'PATCH'] }
        }
      },
      {
        name: 'bodyContentType',
        label: 'Body Content Type',
        type: 'options',
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Raw / Text', value: 'raw' }
        ],
        default: 'json',
        displayOptions: {
          show: { method: ['POST', 'PUT', 'PATCH'], sendBody: [true] }
        }
      },
      {
        name: 'body',
        label: 'JSON Body',
        type: 'json',
        default: '{\n  "processed": true\n}',
        displayOptions: {
          show: { method: ['POST', 'PUT', 'PATCH'], sendBody: [true] }
        }
      }
    ],
    defaultParameters: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      authType: 'none',
      authToken: '',
      queryParameters: [],
      headersCollection: [
        { name: 'Accept', value: 'application/json' },
        { name: 'Content-Type', value: 'application/json' }
      ],
      sendBody: false,
      bodyContentType: 'json',
      body: '{\n  "processed": true\n}'
    }
  },
  {
    type: 'sqlQuery',
    name: 'Execute a SQL query',
    category: 'action',
    description: 'Execute PostgreSQL or MySQL query locally or against databases with parameterized bindings.',
    icon: 'Database',
    color: '#336791', // PostgreSQL blue
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'operation',
        label: 'Operation',
        type: 'options',
        options: [
          { label: 'Execute Query', value: 'executeQuery' },
          { label: 'Insert Rows', value: 'insert' },
          { label: 'Update Rows', value: 'update' }
        ],
        default: 'executeQuery',
        required: true
      },
      {
        name: 'query',
        label: 'SQL Query',
        type: 'code',
        typeOptions: { language: 'sql', rows: 6 },
        default: 'SELECT * FROM content_models WHERE status = "active" LIMIT 50;',
        description: 'Supports parameters and expressions like {{ $json.userId }}'
      }
    ],
    defaultParameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM content_models WHERE status = "active" LIMIT 50;'
    }
  },
  {
    type: 'respondToWebhook',
    name: 'Respond to Webhook',
    category: 'action',
    description: 'Send custom HTTP response back to the incoming webhook caller.',
    icon: 'Webhook',
    color: '#E11D48', // rose
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'respondWith',
        label: 'Respond With',
        type: 'options',
        options: [
          { label: 'All Incoming Items', value: 'allIncomingItems' },
          { label: 'First Incoming Item', value: 'firstItem' },
          { label: 'Custom JSON', value: 'customJson' },
          { label: 'Custom Text / HTML', value: 'text' }
        ],
        default: 'allIncomingItems',
        required: true
      },
      {
        name: 'responseCode',
        label: 'HTTP Status Code',
        type: 'number',
        default: 200,
        required: true
      },
      {
        name: 'customResponsePayload',
        label: 'Custom Response JSON',
        type: 'json',
        default: '{\n  "success": true,\n  "message": "Processed successfully by S2S"\n}',
        displayOptions: {
          show: { respondWith: ['customJson'] }
        }
      }
    ],
    defaultParameters: {
      respondWith: 'allIncomingItems',
      responseCode: 200,
      customResponsePayload: '{\n  "success": true,\n  "message": "Processed successfully by S2S"\n}'
    }
  },
  {
    type: 'aiAgent',
    name: 'AI Agent / Transform',
    category: 'action',
    description: 'Process, summarize, categorize, or generate structured responses with Gemini AI.',
    icon: 'Sparkles',
    color: '#9333EA', // purple
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'model',
        label: 'Model Selection',
        type: 'options',
        options: [
          { label: 'Gemini 3.8 Flash (Fast & Structured)', value: 'gemini-3.8-flash' },
          { label: 'Gemini 3.1 Pro (Complex Reasoning)', value: 'gemini-3.1-pro-preview' }
        ],
        default: 'gemini-3.8-flash'
      },
      {
        name: 'task',
        label: 'Task Type',
        type: 'options',
        options: [
          { label: 'Customer Support Email Classifier & Auto-Drafter', value: 'email_support' },
          { label: 'Customer Review & Feedback Sentiment Analyzer', value: 'review_sentiment' },
          { label: 'Summarize & Extract Key Takeaways', value: 'summarize' },
          { label: 'Extract Structured JSON Fields', value: 'extract_json' },
          { label: 'Sentiment & Intent Classification', value: 'classify' },
          { label: 'Custom Prompt Transformation', value: 'custom_prompt' }
        ],
        default: 'email_support'
      },
      {
        name: 'promptTemplate',
        label: 'Prompt / Instruction Template',
        type: 'string',
        typeOptions: { rows: 4 },
        default: 'Analyze the following customer email inquiry, classify its category (Technical, Billing, Feature Request, Urgent), detect sentiment, and draft a polite, helpful resolution:\n{{ $json.email_body || $json.content || JSON.stringify($json) }}',
        supportsExpression: true
      },
      {
        name: 'temperature',
        label: 'Temperature (Creativity)',
        type: 'number',
        default: 0.2,
        typeOptions: { minValue: 0, maxValue: 1, step: 0.1 }
      }
    ],
    defaultParameters: {
      model: 'gemini-3.8-flash',
      task: 'email_support',
      promptTemplate: 'Analyze the following customer email inquiry, classify its category (Technical, Billing, Feature Request, Urgent), detect sentiment, and draft a polite, helpful resolution:\n{{ $json.email_body || $json.content || JSON.stringify($json) }}',
      temperature: 0.2
    }
  },
  {
    type: 'emailTrigger',
    name: 'Gmail / Email Trigger',
    category: 'trigger',
    description: 'Triggers when a new customer email or support ticket is received.',
    icon: 'Mail',
    color: '#EA4335', // Gmail red
    isTrigger: true,
    inputs: [],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'inbox',
        label: 'Email Inbox / Account',
        type: 'string',
        default: 'support@acmecorp.com',
        placeholder: 'e.g. support@company.com'
      },
      {
        name: 'filterSubject',
        label: 'Subject Filter (Optional)',
        type: 'string',
        placeholder: 'e.g. Urgent, Support, Billing'
      },
      {
        name: 'mockPayload',
        label: 'Test Email Inbound Payload',
        type: 'json',
        default: '{\n  "from": "sarah.miller@client.com",\n  "subject": "Urgent: Payment failed during subscription renewal",\n  "email_body": "Hi Support, our automated invoice renewal failed this morning with card code 402. Our team is locked out of the enterprise dashboard. Please fix this immediately!",\n  "received_at": "2026-09-11T14:30:00Z"\n}'
      }
    ],
    defaultParameters: {
      inbox: 'support@acmecorp.com',
      filterSubject: '',
      mockPayload: '{\n  "from": "sarah.miller@client.com",\n  "subject": "Urgent: Payment failed during subscription renewal",\n  "email_body": "Hi Support, our automated invoice renewal failed this morning with card code 402. Our team is locked out of the enterprise dashboard. Please fix this immediately!",\n  "received_at": "2026-09-11T14:30:00Z"\n}'
    }
  },
  {
    type: 'slackNode',
    name: 'Slack',
    category: 'action',
    description: 'Send alerts, rich messages, and notifications to Slack channels.',
    icon: 'MessageSquare',
    color: '#4A154B', // Slack aubergine
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'channel',
        label: 'Channel',
        type: 'string',
        default: '#customer-support',
        placeholder: '#alerts or #customer-support'
      },
      {
        name: 'message',
        label: 'Message Text',
        type: 'string',
        typeOptions: { rows: 3 },
        default: ':warning: *Urgent Customer Escalation*\n*From:* {{ $json.from || "Customer" }}\n*Summary:* {{ $json.aiResult?.summary || $json.aiResult || "Action required" }}',
        supportsExpression: true,
        required: true
      },
      {
        name: 'botName',
        label: 'Bot Name',
        type: 'string',
        default: 'Gemini Support Bot'
      },
      {
        name: 'webhookUrl',
        label: 'Slack Webhook URL (Optional)',
        type: 'string',
        placeholder: 'https://hooks.slack.com/services/...'
      }
    ],
    defaultParameters: {
      channel: '#customer-support',
      message: ':warning: *Urgent Customer Escalation*\n*From:* {{ $json.from || "Customer" }}\n*Summary:* {{ $json.aiResult?.summary || $json.aiResult || "Action required" }}',
      botName: 'Gemini Support Bot',
      webhookUrl: 'https://hooks.slack.com/services/mock/slack/webhook'
    }
  },
  {
    type: 'webhookSender',
    name: 'Send Webhook',
    category: 'action',
    description: 'Dispatch workflow outputs to Discord, Slack, or any custom API webhook.',
    icon: 'Send',
    color: '#0D9488', // teal
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'webhookUrl',
        label: 'Destination Webhook URL',
        type: 'string',
        default: 'https://httpbin.org/post',
        placeholder: 'https://discord.com/api/webhooks/... or Slack webhook URL',
        supportsExpression: true,
        required: true
      },
      {
        name: 'format',
        label: 'Payload Format',
        type: 'options',
        options: [
          { label: 'Raw S2S JSON Items', value: 'raw' },
          { label: 'Slack Compatible Message', value: 'slack' },
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
