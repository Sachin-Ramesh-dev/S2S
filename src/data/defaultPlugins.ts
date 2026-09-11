import { CustomPluginNode } from '../types';

export const DEFAULT_PLUGINS: CustomPluginNode[] = [
  {
    id: 'plugin-pii-masker',
    type: 'piiMaskerPlugin',
    name: 'PII Sanitizer & Masker',
    icon: 'ShieldAlert',
    category: 'plugin',
    description: 'Scans data payloads and redacts or masks sensitive personally identifiable information (emails, credit cards, phones, SSNs) before export or dispatch.',
    version: '1.2.0',
    author: 'NodeFlow Core Security',
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Sanitized Output', type: 'main' }],
    parametersSchema: [
      {
        name: 'maskEmails',
        label: 'Mask Email Addresses',
        type: 'boolean',
        default: true,
        description: 'Transforms "jane.doe@example.com" into "j***e@example.com"'
      },
      {
        name: 'maskPhones',
        label: 'Mask Phone Numbers',
        type: 'boolean',
        default: true,
        description: 'Redacts phone numbers to "+1 (***) ***-1234"'
      },
      {
        name: 'redactKeys',
        label: 'Redact Specific Object Keys (Comma separated)',
        type: 'string',
        default: 'password, secret, token, ssn, apiKey',
        description: 'Any matching nested property will be replaced with "[REDACTED]"'
      }
    ],
    code: `// Plugin Execution Handler
// inputs: incoming array/object data
// params: configured node parameters
// helpers: { fetch, crypto, log }

function maskEmail(email) {
  if (typeof email !== 'string') return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  if (name.length <= 2) return name[0] + '***@' + parts[1];
  return name[0] + '***' + name[name.length - 1] + '@' + parts[1];
}

function sanitizeObject(obj, keysToRedact, maskEmailsFlag) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item, keysToRedact, maskEmailsFlag));
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const isRedactKey = keysToRedact.some(k => k.toLowerCase() === key.toLowerCase());
    if (isRedactKey) {
      result[key] = '[REDACTED_BY_PII_GUARD]';
    } else if (maskEmailsFlag && typeof value === 'string' && value.includes('@') && value.includes('.')) {
      result[key] = maskEmail(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value, keysToRedact, maskEmailsFlag);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const keys = (params.redactKeys || '').split(',').map(s => s.trim()).filter(Boolean);
const rawData = Array.isArray(inputs) ? inputs : [inputs];

const sanitized = rawData.map(item => {
  const clean = sanitizeObject(item, keys, params.maskEmails !== false);
  return {
    ...clean,
    _piiSanitized: true,
    _sanitizedTimestamp: new Date().toISOString()
  };
});

helpers.log(\`PII Guard successfully inspected \${sanitized.length} record(s)\`);
return sanitized;
`,
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z'
  },
  {
    id: 'plugin-discord-slack',
    type: 'notificationDispatcherPlugin',
    name: 'Unified Notification Dispatcher',
    icon: 'BellRing',
    category: 'plugin',
    description: 'Formats and delivers status updates and alert summaries to custom endpoints or webhooks with custom styling.',
    version: '2.0.0',
    author: 'Dev Community',
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Result', type: 'main' }],
    parametersSchema: [
      {
        name: 'alertTitle',
        label: 'Alert Title',
        type: 'string',
        default: 'NodeFlow Workflow Execution Update',
        required: true
      },
      {
        name: 'severity',
        label: 'Severity Level',
        type: 'select',
        options: [
          { label: 'Info (Green/Blue)', value: 'info' },
          { label: 'Warning (Amber)', value: 'warning' },
          { label: 'Critical (Red)', value: 'critical' }
        ],
        default: 'info'
      },
      {
        name: 'channelWebhook',
        label: 'Destination Webhook URL',
        type: 'string',
        default: 'https://httpbin.org/post',
        placeholder: 'https://discord.com/api/webhooks/... or Slack webhook'
      }
    ],
    code: `// Unified Notification Dispatcher
const firstItem = Array.isArray(inputs) ? inputs[0] : inputs;
const severityColors = {
  info: 0x3498db,
  warning: 0xf39c12,
  critical: 0xe74c3c
};

const payload = {
  title: params.alertTitle || 'Workflow Notice',
  severity: params.severity || 'info',
  colorHex: severityColors[params.severity] || 0x2ecc71,
  timestamp: new Date().toISOString(),
  itemSummary: typeof firstItem === 'object' ? JSON.stringify(firstItem).slice(0, 180) + '...' : String(firstItem),
  deliveryStatus: 'queued_locally'
};

helpers.log(\`Prepared notification with severity: \${params.severity}\`);

if (params.channelWebhook && params.channelWebhook.startsWith('http')) {
  try {
    const res = await helpers.fetch(params.channelWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: \`🔔 **\${params.alertTitle}** (\${params.severity.toUpperCase()})\`,
        embeds: [{
          title: params.alertTitle,
          description: \`Payload snapshot:\n\\\`\\\`\\\`json\\n\${payload.itemSummary}\\n\\\`\\\`\\\`\`,
          color: payload.colorHex
        }]
      })
    });
    payload.httpStatus = res.status;
    payload.httpSuccess = res.ok;
  } catch (err) {
    payload.httpError = err.message;
    helpers.log('Webhook dispatch error: ' + err.message);
  }
}

return [payload];
`,
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z'
  },
  {
    id: 'plugin-csv-parser',
    type: 'csvParserPlugin',
    name: 'CSV to JSON Transformer',
    icon: 'FileSpreadsheet',
    category: 'plugin',
    description: 'Parses raw CSV string or file content into clean JSON records with typed numbers and booleans.',
    version: '1.0.0',
    author: 'Data Tools',
    inputs: [{ id: 'main', label: 'Input', type: 'main' }],
    outputs: [{ id: 'main', label: 'Records', type: 'main' }],
    parametersSchema: [
      {
        name: 'delimiter',
        label: 'CSV Delimiter',
        type: 'select',
        options: [
          { label: 'Comma (,)', value: ',' },
          { label: 'Semicolon (;)', value: ';' },
          { label: 'Tab (\\t)', value: '\t' }
        ],
        default: ','
      },
      {
        name: 'trimWhitespace',
        label: 'Trim Header & Cell Whitespace',
        type: 'boolean',
        default: true
      }
    ],
    code: `// CSV to JSON Transformer
const firstItem = Array.isArray(inputs) ? inputs[0] : inputs;
const rawCsv = firstItem?.csv || firstItem?.rawContent || (typeof firstItem === 'string' ? firstItem : 'id,name,role,active\\n1,Alice,Engineer,true\\n2,Bob,Architect,true');

const lines = rawCsv.split(/\\r?\\n/).filter(line => line.trim().length > 0);
if (lines.length === 0) return [];

const delimiter = params.delimiter || ',';
const headers = lines[0].split(delimiter).map(h => params.trimWhitespace ? h.trim() : h);

const records = lines.slice(1).map((line, idx) => {
  const cells = line.split(delimiter).map(c => params.trimWhitespace ? c.trim() : c);
  const row = { _rowNumber: idx + 1 };
  headers.forEach((h, i) => {
    let val = cells[i] || '';
    if (/^\\d+$/.test(val)) val = parseInt(val, 10);
    else if (/^\\d+\\.\\d+$/.test(val)) val = parseFloat(val);
    else if (val.toLowerCase() === 'true') val = true;
    else if (val.toLowerCase() === 'false') val = false;
    row[h] = val;
  });
  return row;
});

helpers.log(\`Parsed \${records.length} records from CSV content\`);
return records;
`,
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z'
  }
];
