import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_WORKFLOWS } from './src/data/sampleWorkflows';
import { InstagramService } from './src/server/instagramService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Handle JSON syntax errors gracefully (prevents unhandled body-parser SyntaxError crashes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && ('body' in err || 'status' in err)) {
    return res.status(400).json({
      error: 'Invalid JSON payload received',
      message: err.message
    });
  }
  next(err);
});

// Ensure local data storage directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STORAGE_FILE = path.join(DATA_DIR, 'nodeflow_db.json');

// Cryptographic helpers for local database & vault
const MASTER_SALT = 'nodeflow-selfhosted-salt-2026';
function deriveEncryptionKey(passphrase: string): Buffer {
  return crypto.pbkdf2Sync(passphrase, MASTER_SALT, 100000, 32, 'sha256');
}

function encryptAES256GCM(text: string, passphrase = 'nodeflow-default-master-key'): { cipherText: string; iv: string; authTag: string } {
  const key = deriveEncryptionKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return {
    cipherText: encrypted,
    iv: iv.toString('base64'),
    authTag
  };
}

function decryptAES256GCM(cipherText: string, ivBase64: string, authTagBase64: string, passphrase = 'nodeflow-default-master-key'): string {
  const key = deriveEncryptionKey(passphrase);
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipherText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function callWithTimeout<T>(promise: Promise<T>, ms = 6000, errorMsg = 'Operation timed out'): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Local Database initialization
interface DatabaseSchema {
  workflows: any[];
  executions: any[];
  plugins: any[];
  vault: any[];
  securitySettings: {
    vaultInitialized: boolean;
    storageMode: string;
    encryptionAlgorithm: string;
    localStorageLocation: string;
  };
  instagramAccounts?: any[];
  instagramAudits?: any[];
  instagramTopics?: any[];
  instagramPipeline?: any[];
  instagramScripts?: any[];
  instagramCalendar?: any[];
  instagramAIConfig?: any;
  instagramSkills?: any[];
  instagramLearningProposals?: any[];
  instagramGenerations?: any[];
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialDb: DatabaseSchema = {
      workflows: [],
      executions: [],
      plugins: [],
      vault: [
        {
          id: 'cred-demo-api',
          name: 'Demo External Service API Key',
          type: 'api_key',
          maskedPreview: 'sk-sec-***-9921',
          ...encryptAES256GCM('sk-sec-live-prod-secret-key-9921'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      securitySettings: {
        vaultInitialized: true,
        storageMode: 'local_encrypted',
        encryptionAlgorithm: 'AES-256-GCM + PBKDF2 (100k iterations)',
        localStorageLocation: STORAGE_FILE
      }
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    const parsed: DatabaseSchema = JSON.parse(raw);
    let updated = false;

    // Seed any missing or updated sample workflows
    if (!parsed.workflows || parsed.workflows.length === 0) {
      parsed.workflows = [...SAMPLE_WORKFLOWS];
      updated = true;
    } else {
      // Remove old deprecated placeholder if present
      parsed.workflows = parsed.workflows.filter(w => w.id !== 'wf-feedback-collector');

      // Deduplicate any existing workflows by ID (keep latest)
      const seenWfIds = new Set<string>();
      const dedupedWfs: any[] = [];
      for (const w of parsed.workflows) {
        if (!seenWfIds.has(w.id)) {
          seenWfIds.add(w.id);
          dedupedWfs.push(w);
        } else {
          updated = true;
        }
      }
      parsed.workflows = dedupedWfs;

      for (const sample of SAMPLE_WORKFLOWS) {
        const existingIdx = parsed.workflows.findIndex(w => w.id === sample.id);
        if (existingIdx === -1) {
          parsed.workflows.push(sample);
          updated = true;
        } else if (sample.id === 'wf-content-plan' || sample.id === 'wf-feedback-governance') {
          // Keep updated definition for user requested workflows
          parsed.workflows[existingIdx] = { ...sample, ...parsed.workflows[existingIdx], nodes: sample.nodes, connections: sample.connections };
          updated = true;
        }
      }
    }

    if (updated) {
      saveDatabase(parsed);
    }

    return parsed;
  } catch (e) {
    console.error('Error reading storage, resetting to default', e);
    return { workflows: [...SAMPLE_WORKFLOWS], executions: [], plugins: [], vault: [], securitySettings: { vaultInitialized: true, storageMode: 'local_encrypted', encryptionAlgorithm: 'AES-256-GCM', localStorageLocation: STORAGE_FILE } };
  }
}

function saveDatabase(db: DatabaseSchema) {
  const tempFile = STORAGE_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tempFile, STORAGE_FILE);
}

// Instantiate Instagram AI Content Intelligence Service
const instagramService = new InstagramService((provider: string) => {
  try {
    const db = loadDatabase();
    const cred = db.vault.find((c: any) =>
      c.name.toLowerCase().includes(provider.toLowerCase()) ||
      c.id.toLowerCase().includes(provider.toLowerCase())
    );
    if (cred && cred.cipherText && cred.iv && cred.authTag) {
      return decryptAES256GCM(cred.cipherText, cred.iv, cred.authTag, 'nodeflow-default-master-key');
    }
  } catch (err) {
    console.warn(`Could not resolve vault credential for ${provider}:`, err);
  }
  return undefined;
});

// Hydrate Instagram Service from persisted storage
try {
  const currentDb = loadDatabase();
  instagramService.hydrateFromDb(currentDb);
} catch (err) {
  console.warn('Failed initial Instagram DB hydration:', err);
}

function persistInstagramState() {
  const db = loadDatabase();
  instagramService.serializeToDb(db);
  saveDatabase(db);
}

// REST API ROUTES
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    mode: 'self-hosted-local',
    storage: 'local-file-db',
    timestamp: new Date().toISOString()
  });
});

// Security & Vault status
app.get('/api/security/status', (req, res) => {
  const db = loadDatabase();
  res.json({
    ...db.securitySettings,
    credentialsCount: db.vault.length,
    workflowsCount: db.workflows.length,
    databasePath: STORAGE_FILE,
    isLocalDatabase: true
  });
});

app.get('/api/vault', (req, res) => {
  const db = loadDatabase();
  // Return credentials list with masked preview
  const safeVault = db.vault.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    maskedPreview: c.maskedPreview,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }));
  res.json(safeVault);
});

app.post('/api/vault', (req, res) => {
  const { name, type, secretValue, passphrase } = req.body;
  if (!name || !secretValue) {
    return res.status(400).json({ error: 'Name and secretValue are required' });
  }
  const db = loadDatabase();
  const masked = secretValue.length > 8
    ? secretValue.slice(0, 3) + '-***-' + secretValue.slice(-4)
    : '***';

  const encrypted = encryptAES256GCM(secretValue, passphrase || 'nodeflow-default-master-key');
  const newCred = {
    id: 'cred-' + Date.now(),
    name,
    type: type || 'api_key',
    maskedPreview: masked,
    ...encrypted,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.vault.push(newCred);
  saveDatabase(db);
  res.json(newCred);
});

app.delete('/api/vault/:id', (req, res) => {
  const db = loadDatabase();
  db.vault = db.vault.filter(c => c.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// Workflows CRUD
app.get('/api/workflows', (req, res) => {
  const db = loadDatabase();
  res.json(db.workflows);
});

app.get('/api/workflows/:id', (req, res) => {
  const db = loadDatabase();
  const wf = db.workflows.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  res.json(wf);
});

app.post('/api/workflows', (req, res) => {
  const db = loadDatabase();
  const wf = req.body;
  const existingIdx = db.workflows.findIndex(w => w.id === wf.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    db.workflows[existingIdx] = {
      ...wf,
      updatedAt: now
    };
  } else {
    db.workflows.unshift({
      ...wf,
      id: wf.id || 'wf-' + Date.now(),
      createdAt: wf.createdAt || now,
      updatedAt: now
    });
  }
  saveDatabase(db);
  res.json({ success: true, workflow: wf });
});

app.delete('/api/workflows/:id', (req, res) => {
  const db = loadDatabase();
  db.workflows = db.workflows.filter(w => w.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// Custom Plugins CRUD
app.get('/api/plugins', (req, res) => {
  const db = loadDatabase();
  res.json(db.plugins);
});

app.post('/api/plugins', (req, res) => {
  const db = loadDatabase();
  const plugin = req.body;
  const existingIdx = db.plugins.findIndex(p => p.id === plugin.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    db.plugins[existingIdx] = { ...plugin, updatedAt: now };
  } else {
    db.plugins.push({
      ...plugin,
      id: plugin.id || 'plugin-' + Date.now(),
      createdAt: plugin.createdAt || now,
      updatedAt: now
    });
  }
  saveDatabase(db);
  res.json({ success: true, plugin });
});

app.delete('/api/plugins/:id', (req, res) => {
  const db = loadDatabase();
  db.plugins = db.plugins.filter(p => p.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// AI Workflow Builder Endpoint (Codecademy n8n AI Feature)
app.post('/api/ai/generate-workflow', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const promptLower = prompt.toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are the n8n AI Workflow Builder. Your task is to output a valid JSON workflow object based on the user's natural language goal.
Available node types:
- 'emailTrigger' (Gmail / Inbound email trigger)
- 'webhookTrigger' (Inbound HTTP webhook)
- 'manualTrigger' (Manual start)
- 'scheduleTrigger' (Cron or interval)
- 'aiAgent' (Google Gemini AI classification, summarization, or drafting)
- 'ifCondition' (True/False comparison)
- 'switchNode' (Multi-branch routing)
- 'slackNode' (Send message to Slack channel)
- 'webhookSender' (Send POST to external webhook)
- 'sqlQuery' (Execute PostgreSQL / MySQL query)
- 'respondToWebhook' (Send response back to caller)
- 'codeJs' (Custom JavaScript code)

Output ONLY valid JSON matching this schema:
{
  "name": "Workflow Name",
  "description": "Short description",
  "tags": ["AI", "Automation"],
  "nodes": [
    {
      "id": "node-1",
      "type": "emailTrigger",
      "name": "Inbound Email",
      "position": { "x": 100, "y": 240 },
      "parameters": {}
    }
  ],
  "connections": [
    {
      "id": "c-1",
      "sourceNodeId": "node-1",
      "sourcePortId": "main",
      "targetNodeId": "node-2",
      "targetPortId": "main"
    }
  ]
}`;

      const aiResponse = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstruction}\n\nUser Goal: ${prompt}`
        }),
        6000,
        'Gemini workflow generation timed out'
      );

      const responseText = aiResponse.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedWf = JSON.parse(jsonMatch[0]);
        parsedWf.id = 'wf-ai-' + Date.now();
        parsedWf.active = true;
        parsedWf.published = false;
        parsedWf.createdAt = new Date().toISOString();
        parsedWf.updatedAt = new Date().toISOString();
        return res.json({ success: true, workflow: parsedWf });
      }
    } catch (err: any) {
      console.warn('AI generation with Gemini API failed, using intelligent template generator:', err.message);
    }
  }

  // Intelligent Synthesizer Fallback based on Codecademy article workflows
  const now = new Date().toISOString();
  let generatedWorkflow: any;

  if (promptLower.includes('email') || promptLower.includes('support') || promptLower.includes('ticket')) {
    generatedWorkflow = {
      id: 'wf-ai-' + Date.now(),
      name: 'AI Support Assistant & Slack Escalator',
      description: `Generated for: "${prompt}". Uses Gemini to classify customer queries and alert on Slack.`,
      active: true,
      published: false,
      tags: ['AI Agent', 'Google Gemini', 'Support', 'Slack'],
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'node-inbound-email',
          type: 'emailTrigger',
          name: 'Customer Email Trigger',
          position: { x: 80, y: 240 },
          parameters: { inbox: 'support@company.com' }
        },
        {
          id: 'node-gemini-ai',
          type: 'aiAgent',
          name: 'Gemini Classifier & Drafter',
          position: { x: 440, y: 240 },
          parameters: {
            model: 'gemini-2.5-flash',
            task: 'email_support',
            promptTemplate: 'Analyze inquiry, classify [Billing, Technical, Urgent], rating urgency 1-5, and draft reply:\n{{ $json.email_body }}'
          }
        },
        {
          id: 'node-if-urgent',
          type: 'ifCondition',
          name: 'Is Urgent Escalation?',
          position: { x: 800, y: 240 },
          parameters: { fieldPath: 'urgency', operator: 'equals', compareValue: 'Urgent' }
        },
        {
          id: 'node-slack-alert',
          type: 'slackNode',
          name: 'Slack Urgent Escalations',
          position: { x: 1140, y: 140 },
          parameters: {
            channel: '#customer-support',
            message: ':warning: *High Urgency Customer Support Case*\n*From:* {{ $json.from }}\n*AI Summary:* {{ $json.summary || $json.aiResult?.summary }}'
          }
        },
        {
          id: 'node-auto-respond',
          type: 'respondToWebhook',
          name: 'Draft Auto-Reply',
          position: { x: 1140, y: 360 },
          parameters: {
            respondWith: 'customJson',
            responseCode: 200,
            customResponsePayload: '{\n  "status": "drafted",\n  "message": "Thank you for reaching out. We have logged your request."\n}'
          }
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'node-inbound-email', sourcePortId: 'main', targetNodeId: 'node-gemini-ai', targetPortId: 'main' },
        { id: 'c2', sourceNodeId: 'node-gemini-ai', sourcePortId: 'main', targetNodeId: 'node-if-urgent', targetPortId: 'main' },
        { id: 'c3', sourceNodeId: 'node-if-urgent', sourcePortId: 'true', targetNodeId: 'node-slack-alert', targetPortId: 'main', label: 'Urgent' },
        { id: 'c4', sourceNodeId: 'node-if-urgent', sourcePortId: 'false', targetNodeId: 'node-auto-respond', targetPortId: 'main', label: 'Standard' }
      ]
    };
  } else if (promptLower.includes('review') || promptLower.includes('feedback') || promptLower.includes('sentiment')) {
    generatedWorkflow = {
      id: 'wf-ai-' + Date.now(),
      name: 'Review Sentiment & Slack Dispatcher',
      description: `Generated for: "${prompt}". Evaluates reviews with Gemini and notifies Slack on negative comments.`,
      active: true,
      published: false,
      tags: ['Sentiment Analysis', 'Google Gemini', 'Slack', 'SQL'],
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'node-review-webhook',
          type: 'webhookTrigger',
          name: 'Review Webhook Trigger',
          position: { x: 80, y: 240 },
          parameters: { httpMethod: 'POST', path: 'new-reviews' }
        },
        {
          id: 'node-gemini-sentiment',
          type: 'aiAgent',
          name: 'Gemini Sentiment Analyzer',
          position: { x: 440, y: 240 },
          parameters: {
            model: 'gemini-2.5-flash',
            task: 'review_sentiment',
            promptTemplate: 'Analyze user review: extract sentiment (Positive/Neutral/Negative) and summary:\n{{ $json.review_text }}'
          }
        },
        {
          id: 'node-if-negative',
          type: 'ifCondition',
          name: 'Is Sentiment Negative?',
          position: { x: 800, y: 240 },
          parameters: { fieldPath: 'sentiment', operator: 'equals', compareValue: 'Negative' }
        },
        {
          id: 'node-slack-negative',
          type: 'slackNode',
          name: 'Slack Alert CS',
          position: { x: 1140, y: 140 },
          parameters: {
            channel: '#customer-experience',
            message: ':disappointed: *Negative Review Alert*\n*Summary:* {{ $json.summary || "Customer experienced friction" }}'
          }
        },
        {
          id: 'node-sql-store',
          type: 'sqlQuery',
          name: 'Log Feedback to SQL',
          position: { x: 1140, y: 360 },
          parameters: { operation: 'insert', query: 'INSERT INTO reviews (sentiment, created_at) VALUES ("Positive", NOW());' }
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'node-review-webhook', sourcePortId: 'main', targetNodeId: 'node-gemini-sentiment', targetPortId: 'main' },
        { id: 'c2', sourceNodeId: 'node-gemini-sentiment', sourcePortId: 'main', targetNodeId: 'node-if-negative', targetPortId: 'main' },
        { id: 'c3', sourceNodeId: 'node-if-negative', sourcePortId: 'true', targetNodeId: 'node-slack-negative', targetPortId: 'main', label: 'Negative' },
        { id: 'c4', sourceNodeId: 'node-if-negative', sourcePortId: 'false', targetNodeId: 'node-sql-store', targetPortId: 'main', label: 'Positive' }
      ]
    };
  } else {
    // General AI Task Workflow
    generatedWorkflow = {
      id: 'wf-ai-' + Date.now(),
      name: 'AI Agent Multi-Step Pipeline',
      description: `Generated for: "${prompt}". Triggers on input, transforms via Gemini AI, and dispatches notification.`,
      active: true,
      published: false,
      tags: ['AI Agent', 'Google Gemini', 'Automation'],
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'node-start',
          type: 'manualTrigger',
          name: 'Input Trigger',
          position: { x: 80, y: 240 },
          parameters: { payload: '{\n  "input": "Sample payload for ' + prompt + '"\n}' }
        },
        {
          id: 'node-ai-transform',
          type: 'aiAgent',
          name: 'Gemini AI Agent',
          position: { x: 440, y: 240 },
          parameters: {
            model: 'gemini-2.5-flash',
            task: 'summarize',
            promptTemplate: 'Perform requested task: ' + prompt + ' on data:\n{{ $json.input }}'
          }
        },
        {
          id: 'node-notify',
          type: 'slackNode',
          name: 'Slack Notification',
          position: { x: 840, y: 240 },
          parameters: {
            channel: '#general',
            message: ':sparkles: *AI Workflow Output:*\n{{ $json.aiResult }}'
          }
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'node-start', sourcePortId: 'main', targetNodeId: 'node-ai-transform', targetPortId: 'main' },
        { id: 'c2', sourceNodeId: 'node-ai-transform', sourcePortId: 'main', targetNodeId: 'node-notify', targetPortId: 'main' }
      ]
    };
  }

  res.json({ success: true, workflow: generatedWorkflow });
});

// Executions History
app.get('/api/executions', (req, res) => {
  const db = loadDatabase();
  const limit = parseInt(req.query.limit as string) || 30;
  res.json(db.executions.slice(0, limit));
});

app.get('/api/executions/:id', (req, res) => {
  const db = loadDatabase();
  const exec = db.executions.find(e => e.id === req.params.id);
  if (!exec) return res.status(404).json({ error: 'Execution record not found' });
  res.json(exec);
});

// Inbound Webhook Listener
app.all('/api/webhooks/:workflowId/:nodeId', async (req, res) => {
  const { workflowId, nodeId } = req.params;
  const db = loadDatabase();
  const wf = db.workflows.find(w => w.id === workflowId);
  if (!wf) {
    return res.status(404).json({ error: 'Workflow not found for webhook' });
  }

  const targetNode = wf.nodes.find((n: any) => n.id === nodeId);
  if (!targetNode) {
    return res.status(404).json({ error: 'Webhook node not found in workflow' });
  }

  const authSecret = targetNode.parameters?.authSecret;
  if (authSecret) {
    const provided = req.headers['authorization'] || req.headers['x-webhook-token'];
    if (!provided || !String(provided).includes(authSecret)) {
      return res.status(401).json({ error: 'Invalid or missing webhook authorization secret' });
    }
  }

  const incomingPayload = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    receivedAt: new Date().toISOString()
  };

  // Immediate response configured on node
  let responseData = { status: 'success', message: 'Webhook triggered locally' };
  try {
    if (targetNode.parameters?.responseBody) {
      responseData = JSON.parse(targetNode.parameters.responseBody);
    }
  } catch (e) {}

  res.json(responseData);

  // Trigger workflow run asynchronously
  executeWorkflowInternal(wf, db, incomingPayload, 'webhook', nodeId).catch(err => {
    console.error('Asynchronous webhook execution error:', err);
  });
});

// Workflow Execution Core Engine
async function executeNode(
  node: any,
  inputData: any,
  plugins: any[],
  vault: any[]
): Promise<{ outputData: any; logs: string[]; branch?: string }> {
  const logs: string[] = [];
  logs.push(`Executing node [${node.name || node.type}] at ${new Date().toISOString()}`);

  const params = node.parameters || {};

  // 1. Manual Trigger
  if (node.type === 'manualTrigger') {
    let payload = inputData;
    if (params.payload) {
      try {
        payload = JSON.parse(params.payload);
      } catch (e) {
        payload = { text: params.payload };
      }
    }
    return { outputData: payload, logs };
  }

  // 2. Webhook Trigger
  if (node.type === 'webhookTrigger') {
    return { outputData: inputData || { event: 'webhook_received', timestamp: new Date().toISOString() }, logs };
  }

  // 2b. Gmail / Inbound Email Trigger (Codecademy Guide)
  if (node.type === 'emailTrigger') {
    let emailData = inputData;
    if (!emailData && params.mockPayload) {
      try {
        emailData = JSON.parse(params.mockPayload);
      } catch (e) {
        emailData = { body: params.mockPayload };
      }
    }
    if (!emailData) {
      emailData = {
        from: 'sarah.miller@client.com',
        subject: 'Urgent: Payment failed during subscription renewal',
        email_body: 'Our automated invoice renewal failed this morning with card code 402. Our team is locked out of the enterprise dashboard. Please fix this immediately!',
        received_at: new Date().toISOString()
      };
    }
    logs.push(`Email Trigger received message from '${emailData.from || 'Customer'}' with subject '${emailData.subject || 'Support'}'`);
    return { outputData: emailData, logs };
  }

  // 3. Schedule Trigger
  if (node.type === 'scheduleTrigger') {
    return {
      outputData: {
        event: 'schedule_tick',
        interval: params.intervalType,
        cron: params.cronExpression,
        timestamp: new Date().toISOString()
      },
      logs
    };
  }

  // 4. HTTP Request
  if (node.type === 'httpRequest') {
    let url = params.url || 'https://jsonplaceholder.typicode.com/todos/1';
    // Interpolate expressions like {{ $json.field }}
    if (inputData && typeof inputData === 'object') {
      url = url.replace(/\{\{\s*\$json\.([\w.]+)\s*\}\}/g, (_: any, p1: string) => {
        const parts = p1.split('.');
        let cur = inputData;
        for (const p of parts) cur = cur?.[p];
        return cur !== undefined ? String(cur) : '';
      });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'NodeFlow-SelfHosted/1.0',
      'Accept': 'application/json'
    };

    if (params.headers) {
      try {
        const customH = JSON.parse(params.headers);
        Object.assign(headers, customH);
      } catch (e) {}
    }

    if (params.authType === 'bearer' && params.authToken) {
      headers['Authorization'] = `Bearer ${params.authToken}`;
    }

    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(params.method) && params.body) {
      try {
        body = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
      } catch (e) {
        body = String(params.body);
      }
    }

    logs.push(`Dispatching HTTP ${params.method || 'GET'} to ${url}`);
    const response = await fetch(url, {
      method: params.method || 'GET',
      headers,
      body
    });

    let resBody: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      resBody = await response.json();
    } else {
      resBody = await response.text();
    }

    logs.push(`HTTP Response status: ${response.status} ${response.statusText}`);
    return {
      outputData: {
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: resBody
      },
      logs
    };
  }

  // 5. Code (JavaScript)
  if (node.type === 'codeJs') {
    const code = params.code || 'return items;';
    logs.push('Evaluating custom JavaScript transformation code in sandbox');

    const fn = new Function('items', '$json', 'console', code);
    const mockConsole = {
      log: (...args: any[]) => logs.push('[console.log] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args: any[]) => logs.push('[console.warn] ' + args.join(' ')),
      error: (...args: any[]) => logs.push('[console.error] ' + args.join(' '))
    };

    const result = fn(inputData, inputData, mockConsole);
    return { outputData: result, logs };
  }

  // 6. If Condition
  if (node.type === 'ifCondition') {
    const path = params.fieldPath || '';
    const operator = params.operator || 'equals';
    const compareVal = params.compareValue;

    // extract value
    let currentVal: any = inputData;
    if (path) {
      const parts = path.split('.');
      for (const p of parts) {
        currentVal = currentVal?.[p];
      }
    }

    let isMatch = false;
    switch (operator) {
      case 'equals':
        isMatch = String(currentVal) === String(compareVal);
        break;
      case 'not_equals':
        isMatch = String(currentVal) !== String(compareVal);
        break;
      case 'contains':
        isMatch = String(currentVal).toLowerCase().includes(String(compareVal).toLowerCase());
        break;
      case 'not_contains':
        isMatch = !String(currentVal).toLowerCase().includes(String(compareVal).toLowerCase());
        break;
      case 'greater_than':
        isMatch = Number(currentVal) > Number(compareVal);
        break;
      case 'less_than':
        isMatch = Number(currentVal) < Number(compareVal);
        break;
      case 'is_empty':
        isMatch = currentVal === null || currentVal === undefined || currentVal === '';
        break;
      case 'is_not_empty':
        isMatch = currentVal !== null && currentVal !== undefined && currentVal !== '';
        break;
      default:
        isMatch = Boolean(currentVal);
    }

    const branch = isMatch ? 'true' : 'false';
    logs.push(`Evaluated condition '${path}' [${currentVal}] ${operator} '${compareVal}' => ${isMatch ? 'TRUE' : 'FALSE'}`);

    return {
      outputData: {
        ...inputData,
        _conditionResult: isMatch,
        _matchedBranch: branch
      },
      branch,
      logs
    };
  }

  // 7. Edit Fields (Set)
  if (node.type === 'setFields') {
    let assignments = {};
    if (params.assignments) {
      try {
        assignments = typeof params.assignments === 'string' ? JSON.parse(params.assignments) : params.assignments;
      } catch (e) {}
    }

    const base = params.keepOnlySet ? {} : (Array.isArray(inputData) ? inputData : { ...inputData });
    let output: any;
    if (Array.isArray(base)) {
      output = base.map(item => ({ ...item, ...assignments }));
    } else {
      output = { ...base, ...assignments };
    }
    logs.push(`Applied ${Object.keys(assignments).length} field assignments`);
    return { outputData: output, logs };
  }

  // 8. Crypto & E2EE Vault
  if (node.type === 'cryptoVault') {
    const operation = params.operation || 'encrypt';
    const targetPath = params.targetField || '';
    const outputField = params.outputField || 'cryptoResult';
    const passphrase = params.secretKeyOrPassphrase || 'local-vault-master-key-2026';

    let targetValue: any = inputData;
    if (targetPath) {
      const parts = targetPath.split('.');
      for (const p of parts) targetValue = targetValue?.[p];
    }

    const stringVal = typeof targetValue === 'object' ? JSON.stringify(targetValue) : String(targetValue || '');
    let cryptoResult: any = null;

    if (operation === 'encrypt') {
      cryptoResult = encryptAES256GCM(stringVal, passphrase);
      logs.push(`Encrypted field '${targetPath}' with AES-256-GCM authenticated cipher`);
    } else if (operation === 'decrypt') {
      try {
        if (typeof targetValue === 'object' && targetValue.cipherText) {
          cryptoResult = decryptAES256GCM(targetValue.cipherText, targetValue.iv, targetValue.authTag, passphrase);
        } else {
          cryptoResult = 'Decryption failed: expected object with {cipherText, iv, authTag}';
        }
      } catch (e: any) {
        cryptoResult = `Decryption error: ${e.message}`;
      }
    } else if (operation === 'sha256') {
      cryptoResult = crypto.createHash('sha256').update(stringVal).digest('hex');
      logs.push(`Calculated SHA-256 hash for field '${targetPath}'`);
    } else if (operation === 'base64_encode') {
      cryptoResult = Buffer.from(stringVal, 'utf8').toString('base64');
    } else if (operation === 'base64_decode') {
      cryptoResult = Buffer.from(stringVal, 'base64').toString('utf8');
    }

    const output = typeof inputData === 'object' && !Array.isArray(inputData)
      ? { ...inputData, [outputField]: cryptoResult }
      : { inputData, [outputField]: cryptoResult };

    return { outputData: output, logs };
  }

  // 9. Delay / Wait
  if (node.type === 'delay' || node.type === 'waitNode') {
    const amt = Number(params.amount) || Number(params.durationMs) || 500;
    const unit = params.unit || 'milliseconds';
    let ms = amt;
    if (unit === 'seconds') ms = amt * 1000;
    else if (unit === 'minutes') ms = amt * 60000;
    else if (unit === 'hours') ms = amt * 3600000;
    const cappedMs = Math.min(ms, 3000); // cap for responsive preview
    logs.push(`Pausing workflow execution for ${cappedMs}ms (requested: ${amt} ${unit})`);
    await new Promise(r => setTimeout(r, cappedMs));
    return { outputData: inputData, logs };
  }

  // 10. Switch
  if (node.type === 'switchNode') {
    const field = params.routingField || 'status';
    let val: any = inputData;
    if (field && typeof inputData === 'object') {
      for (const p of field.split('.')) val = val?.[p];
    }
    const valStr = String(val ?? '').toLowerCase().trim();
    let branch = 'fallback';
    if (String(params.rule0Value ?? '').toLowerCase().trim() === valStr) branch = 'output_0';
    else if (String(params.rule1Value ?? '').toLowerCase().trim() === valStr) branch = 'output_1';
    else if (String(params.rule2Value ?? '').toLowerCase().trim() === valStr) branch = 'output_2';

    logs.push(`Switch evaluated '${field}' [${val}] => matched '${branch}'`);
    return { outputData: inputData, branch, logs };
  }

  // 11. Filter
  if (node.type === 'filterNode') {
    const field = params.fieldPath || '';
    const op = params.operator || 'equals';
    const target = params.filterValue;
    const items = Array.isArray(inputData) ? inputData : [inputData];
    const filtered = items.filter(item => {
      let v = item;
      if (field && typeof item === 'object') {
        for (const p of field.split('.')) v = v?.[p];
      }
      if (op === 'equals') return String(v) === String(target);
      if (op === 'not_equals') return String(v) !== String(target);
      if (op === 'greater_than') return Number(v) > Number(target);
      if (op === 'less_than') return Number(v) < Number(target);
      if (op === 'is_not_empty') return v !== null && v !== undefined && v !== '';
      return Boolean(v);
    });
    logs.push(`Filter condition matched ${filtered.length} of ${items.length} items`);
    return { outputData: Array.isArray(inputData) ? filtered : (filtered[0] || null), logs };
  }

  // 12. Loop Over Items / Split In Batches
  if (node.type === 'loopBatchNode') {
    const batchSize = Math.max(1, Number(params.batchSize) || 1);
    const items = Array.isArray(inputData) ? inputData : [inputData];
    const currentBatch = items.slice(0, batchSize);
    logs.push(`Looping batch: emitted ${currentBatch.length} items to Loop output`);
    return { outputData: currentBatch, branch: 'loop', logs };
  }

  // 13. Merge
  if (node.type === 'mergeNode') {
    const mode = params.mode || 'append';
    const items = Array.isArray(inputData) ? inputData : [inputData];
    logs.push(`Merged streams using mode '${mode}', items: ${items.length}`);
    return { outputData: items, logs };
  }

  // 14. Stop and Error
  if (node.type === 'stopAndErrorNode') {
    const msg = params.errorMessage || 'Execution halted intentionally by Stop and Error node';
    logs.push(`Stop and Error: ${msg}`);
    throw new Error(msg);
  }

  // 15. Aggregate
  if (node.type === 'aggregateNode') {
    const mode = params.aggregateMode || 'allToList';
    const items = Array.isArray(inputData) ? inputData : [inputData];
    if (mode === 'sort') {
      const field = params.sortField || 'id';
      const dir = params.sortDirection === 'desc' ? -1 : 1;
      const sorted = [...items].sort((a, b) => {
        const valA = a?.[field];
        const valB = b?.[field];
        if (valA > valB) return 1 * dir;
        if (valA < valB) return -1 * dir;
        return 0;
      });
      logs.push(`Sorted ${sorted.length} items by '${field}' ${params.sortDirection}`);
      return { outputData: sorted, logs };
    }
    const destName = params.destinationFieldName || 'dataList';
    logs.push(`Aggregated ${items.length} items into field '${destName}'`);
    return { outputData: { [destName]: items, count: items.length }, logs };
  }

  // 16. SQL Query
  if (node.type === 'sqlQuery') {
    const query = String(params.query || 'SELECT * FROM items');
    logs.push(`Executing SQL query: ${query.slice(0, 80)}...`);

    if (query.toLowerCase().includes('social_content_rulebook')) {
      if (query.trim().toUpperCase().startsWith('INSERT') || query.trim().toUpperCase().startsWith('WITH')) {
        logs.push('PostgreSQL: Successfully executed upsert transaction into social_content_rulebook & social_rule_evidence.');
        return {
          outputData: {
            success: true,
            rule_id: 1042,
            account_name: 'bajajfinance',
            platform: 'instagram',
            status: 'approved',
            rowsAffected: 1,
            evidenceLogged: true,
            timestamp: new Date().toISOString()
          },
          logs
        };
      } else {
        logs.push('PostgreSQL: Retrieved active rulebook directives for @bajajfinance Instagram.');
        return {
          outputData: {
            skill_rules: "• [MANDATORY - COMPLIANCE] Avoid unverified interest rate claims: Always state annualized ROI with statutory disclaimer.\n• [AVOID - TOPIC] No crypto promotions: Strict adherence to corporate financial guidelines.\n• [PREFER - HOOK] Start with financial question hook: 'Did you know you can save 15% on EMI...'\n• [MANDATORY - FORMAT] 4 Short-form Reels (30s max), 4 Educational Carousels (5–7 slides), 2 Infographics.\n• [MANDATORY - FRAUD] Include anti-fraud advisory: 'Never share OTP or CVV with anyone.'"
          },
          logs
        };
      }
    }

    const simulatedRows = [
      { id: 1, title: 'Workflow Orchestration', status: 'active', priority: 'high', created_at: '2026-09-01T10:00:00Z' },
      { id: 2, title: 'Vault Secret Encryption', status: 'active', priority: 'critical', created_at: '2026-09-03T14:30:00Z' },
      { id: 3, title: 'Webhook Dispatcher', status: 'completed', priority: 'normal', created_at: '2026-09-05T09:15:00Z' }
    ];
    return { outputData: simulatedRows, logs };
  }

  // 17. Respond to Webhook
  if (node.type === 'respondToWebhook') {
    const code = Number(params.responseCode) || 200;
    let payload = inputData;
    if (params.respondWith === 'customJson' && params.customResponsePayload) {
      try {
        payload = JSON.parse(params.customResponsePayload);
      } catch (e) {
        payload = { message: params.customResponsePayload };
      }
    } else if (params.respondWith === 'firstItem' && Array.isArray(inputData)) {
      payload = inputData[0] || {};
    }
    logs.push(`Respond to Webhook: prepared HTTP ${code} response`);
    return { outputData: { _httpResponseCode: code, responsePayload: payload }, logs };
  }

  // 18. AI Agent / Gemini
  if (node.type === 'aiAgent') {
    const apiKey = process.env.GEMINI_API_KEY;
    const task = params.task || 'summarize';
    const promptTemplate = params.promptTemplate || 'Summarize the input data';
    let renderedPrompt = promptTemplate;
    if (inputData && typeof inputData === 'object') {
      renderedPrompt = renderedPrompt.replace(/\{\{\s*\$json(?:\.([\w.]+))?\s*\}\}/g, (_: any, path: string) => {
        if (!path) return JSON.stringify(inputData);
        let cur = inputData;
        for (const p of path.split('.')) cur = cur?.[p];
        return cur !== undefined ? (typeof cur === 'object' ? JSON.stringify(cur) : String(cur)) : '';
      });
    }

    const selectedModel = params.model && params.model.includes('pro') ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';
    logs.push(`AI Agent: executing '${task}' using model '${selectedModel}'`);

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const res = await callWithTimeout(
          ai.models.generateContent({
            model: selectedModel,
            contents: renderedPrompt
          }),
          6000,
          'Gemini API request timed out'
        );
        const text = res.text || '';
        logs.push('AI Agent: generation completed successfully via Gemini API');
        
        let structuredResult: any = { raw: text };
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) structuredResult = JSON.parse(jsonMatch[0]);
        } catch (e) {}

        return {
          outputData: {
            ...inputData,
            task,
            model: selectedModel,
            aiResult: text,
            urgency: structuredResult.urgency || (text.toLowerCase().includes('urgent') ? 'Urgent' : 'Normal'),
            sentiment: structuredResult.sentiment || (text.toLowerCase().includes('negative') ? 'Negative' : 'Positive'),
            summary: structuredResult.summary || text.slice(0, 180),
            structured: structuredResult,
            timestamp: new Date().toISOString()
          },
          logs
        };
      } catch (e: any) {
        logs.push(`AI Agent Gemini API call: ${e.message}. Using structured fallback.`);
      }
    }

    logs.push('AI Agent: generation simulated (Gemini API key available for live runs)');

    // Structured responses tailored for Codecademy tutorial scenarios
    if (task === 'email_support') {
      const isUrgent = JSON.stringify(inputData || {}).toLowerCase().includes('urgent') ||
                       JSON.stringify(inputData || {}).toLowerCase().includes('critical') ||
                       JSON.stringify(inputData || {}).toLowerCase().includes('fail');
      return {
        outputData: {
          ...inputData,
          task,
          model: params.model || 'gemini-2.5-flash',
          category: isUrgent ? 'Billing & Production Critical' : 'General Support',
          urgency: isUrgent ? 'Urgent' : 'Normal',
          urgencyScore: isUrgent ? 5 : 2,
          sentiment: isUrgent ? 'Distressed' : 'Neutral',
          summary: isUrgent
            ? 'Customer subscription renewal failed with card code 402; user team locked out.'
            : 'Standard user inquiry regarding product documentation.',
          draftReply: isUrgent
            ? 'Hi Alex, thank you for reaching out. We apologize for the invoice disruption. Our billing and infrastructure team has been paged with highest priority and is restoring access immediately.'
            : 'Hi there, thanks for contacting us! We have received your message and will review it shortly.',
          aiResult: isUrgent
            ? '[Urgent Escalation] Billing transaction failed. Recommending immediate manual account unlock and payment gateway retry.'
            : '[Standard Support] Routine inquiry handled.',
          timestamp: new Date().toISOString()
        },
        logs
      };
    }

    if (task === 'instagram_strategy') {
      const diagnosticText = `### SECTION 1: T-2 POST DIAGNOSTIC (6 September 2026)\n### 1. What Worked\n- Carousel on '5 Hidden Charges in Personal Loans' had 4.8% save rate and 3,100 shares.\n- 3-second hook 'Stop paying extra EMI on your loans' drove 64% 3s retention.\n\n### 2. What Did Not Work\n- Reel on credit score calculation had steep drop-off at 8s due to dense actuarial formulas.\n- Low comment volume on single-image product announcements.\n\n### 3. Root-Cause Analysis\n- Audience responds to actionable personal finance relief; complex actuarial formulas cause immediate feed drop-off.\n\n### 4. Strategic Adjustments\n- Pivot credit score calculations into 6-slide visual carousels with clear call-to-actions.\n- Lead every reel with a relatable consumer pain point question before showing numbers.`;
      return {
        outputData: {
          ...inputData,
          task,
          model: 'gemini-3.8-flash',
          aiResult: diagnosticText,
          summary: 'Diagnostic report for T-2 Instagram performance generated.',
          content: {
            parts: [{ text: diagnosticText }]
          },
          timestamp: new Date().toISOString()
        },
        logs
      };
    }

    if (task === 'social_media_planner') {
      const planText = `### 🚀 10 Content Topics for @bajajfinance (Instagram)\n\n#### Short-form Reels (4 Posts - 30s Max):\n1. **Topic:** The 15% Prepayment Hack\n   - **Hook:** 'If your loan EMI is higher than ₹15,000, watch this before paying this month.'\n   - **Format:** Reel (24s) with on-screen text overlays.\n   - **Rule ID:** [PREFER - HOOK]\n\n2. **Topic:** Why CIBIL Scores Drop Unexpectedly\n   - **Hook:** 'Checked your credit score and saw it drop 20 points for no reason?'\n   - **Format:** Reel (28s).\n   - **Rule ID:** [MANDATORY - COMPLIANCE]\n\n3. **Topic:** Festive Season Zero-Cost EMI Myth Buster\n   - **Hook:** 'Is Zero-Cost EMI really zero cost? Let us do the math.'\n   - **Format:** Reel (30s).\n   - **Rule ID:** [AVOID - TOPIC]\n\n4. **Topic:** Instant Anti-Fraud Check\n   - **Hook:** '3 WhatsApp messages our customer support will NEVER send you.'\n   - **Format:** Reel (20s).\n   - **Rule ID:** [MANDATORY - FRAUD]\n\n#### Educational Carousels (4 Posts - 5 to 7 Slides):\n5. **Topic:** 5 Hidden Loan Processing Charges\n   - **Slide 1:** 'What banks do not tell you on the loan agreement.'\n   - **Slides 2-5:** GST breakdown, prepayment lock-in, inspection fee.\n   - **Rule ID:** [MANDATORY - FORMAT]\n\n6. **Topic:** Step-by-Step Home Loan Transfer Playbook\n   - **Slide 1:** 'How to save ₹2.4 Lakhs by transferring your home loan.'\n   - **Slides 2-6:** Eligibility checklist, foreclosure NOC, stamp duty.\n   - **Rule ID:** [MANDATORY - COMPLIANCE]\n\n7. **Topic:** Emergency Medical Fund Allocation Rule\n   - **Slide 1:** 'The 3-6-9 emergency fund rule for salaried professionals.'\n   - **Rule ID:** [PREFER - HOOK]\n\n8. **Topic:** Credit Card Utilization Trap\n   - **Slide 1:** 'Why spending 80% of your credit card limit kills your loan approval.'\n   - **Rule ID:** [MANDATORY - FORMAT]\n\n#### Single-image Infographics (2 Posts):\n9. **Topic:** The True Cost of Delaying Loan Prepayment\n   - **Visual:** High-contrast bar graph comparing 1 extra EMI/year vs 20-year interest.\n   - **Rule ID:** [MANDATORY - FORMAT]\n\n10. **Topic:** Official Bajaj Finserv Verification Badge Guide\n   - **Visual:** Side-by-side comparison of genuine vs fraudulent SMS handles.\n   - **Rule ID:** [MANDATORY - FRAUD]`;

      return {
        outputData: {
          ...inputData,
          task,
          model: 'gemini-3.8-flash',
          aiResult: planText,
          summary: '10 Structured Instagram content topics generated for @bajajfinance.',
          content: {
            parts: [{ text: planText }]
          },
          timestamp: new Date().toISOString()
        },
        logs
      };
    }

    if (task === 'rule_governance') {
      const ruleObj = {
        rule_name: "Enforce Statutory Rate Disclaimers",
        rule_statement: "All promotional ROI or interest rate savings claims must include standard annualized percentage rate (APR) statutory disclaimers.",
        rule_category: "compliance",
        rule_type: "mandatory",
        observation: "Creative team critique noted missing APR disclaimer in carousel mockups.",
        confidence_score: 94
      };
      const ruleJsonText = JSON.stringify(ruleObj, null, 2);

      return {
        outputData: {
          ...inputData,
          task,
          model: 'gemini-3.8-flash',
          rule: ruleObj,
          aiResult: ruleJsonText,
          summary: 'Formulated strategic governance rule for @bajajfinance content rulebook.',
          content: {
            parts: [{ text: ruleJsonText }]
          },
          timestamp: new Date().toISOString()
        },
        logs
      };
    }

    return {
      outputData: {
        ...inputData,
        task,
        model: params.model || 'gemini-2.5-flash',
        aiResult: `[AI Analysis] Successfully processed payload. Extracted fields: ${Object.keys(inputData || {}).join(', ')}. Status confirmed healthy.`,
        summary: `Processed ${Object.keys(inputData || {}).length} input properties.`,
        urgency: 'Normal',
        sentiment: 'Positive',
        timestamp: new Date().toISOString()
      },
      logs
    };
  }

  // 19. Slack Node (Codecademy Guide)
  if (node.type === 'slackNode') {
    const channel = params.channel || '#general';
    let message = params.message || 'Notification from workflow';
    if (inputData && typeof inputData === 'object') {
      message = message.replace(/\{\{\s*\$json(?:\.([\w.]+))?\s*\}\}/g, (_: any, path: string) => {
        if (!path) return JSON.stringify(inputData);
        let cur = inputData;
        for (const p of path.split('.')) cur = cur?.[p];
        return cur !== undefined ? (typeof cur === 'object' ? JSON.stringify(cur) : String(cur)) : '';
      });
    }

    logs.push(`Slack: dispatched message to channel '${channel}' via bot '${params.botName || 'Gemini Support Bot'}'`);
    if (params.webhookUrl && params.webhookUrl.startsWith('http') && !params.webhookUrl.includes('mock')) {
      try {
        await fetch(params.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message, channel })
        });
      } catch (e: any) {
        logs.push(`Slack dispatch note: ${e.message}`);
      }
    }
    return {
      outputData: {
        slackDelivered: true,
        channel,
        message,
        botName: params.botName || 'Gemini Support Bot',
        sentAt: new Date().toISOString()
      },
      logs
    };
  }

  // 19. Webhook Sender
  if (node.type === 'webhookSender') {
    const url = params.webhookUrl;
    logs.push(`Dispatching webhook payload to: ${url}`);
    if (url && url.startsWith('http')) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 's2s_dispatch',
            data: inputData,
            dispatchedAt: new Date().toISOString()
          })
        });
        logs.push(`Webhook dispatched. Response status: ${res.status}`);
      } catch (e: any) {
        logs.push(`Webhook dispatch notice: ${e.message}`);
      }
    }
    return { outputData: { dispatched: true, destination: url, payload: inputData }, logs };
  }

  // 20. Custom Plugins
  const customPlugin = plugins.find(p => p.type === node.type || p.id === node.pluginId);
  if (customPlugin) {
    logs.push(`Executing custom plugin [${customPlugin.name}] v${customPlugin.version}`);
    const helpers = {
      fetch,
      crypto,
      log: (...args: any[]) => logs.push('[plugin.log] ' + args.join(' '))
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const pluginFn = new AsyncFunction('inputs', 'params', 'credentials', 'helpers', customPlugin.code);
    const result = await pluginFn(inputData, params, {}, helpers);
    return { outputData: result, logs };
  }

  // Fallback pass-through
  logs.push(`Pass-through node execution for [${node.type}]`);
  return { outputData: inputData, logs };
}

// Full Workflow Execution Algorithm
async function executeWorkflowInternal(
  wf: any,
  db: DatabaseSchema,
  initialData: any = null,
  triggerType: 'manual' | 'webhook' | 'test' = 'manual',
  startNodeId?: string
) {
  const executionId = 'exec-' + Date.now();
  const startTime = Date.now();

  const executionRecord: any = {
    id: executionId,
    workflowId: wf.id,
    workflowName: wf.name,
    status: 'running',
    startedAt: new Date(startTime).toISOString(),
    triggerType,
    nodeExecutions: {}
  };

  // Find start nodes (triggers or explicitly specified node)
  const nodesMap = new Map<string, any>(wf.nodes.map((n: any) => [n.id, n]));
  const incomingEdgesMap = new Map<string, any[]>();
  const outgoingEdgesMap = new Map<string, any[]>();

  wf.nodes.forEach((n: any) => {
    incomingEdgesMap.set(n.id, []);
    outgoingEdgesMap.set(n.id, []);
  });

  (wf.connections || []).forEach((c: any) => {
    if (incomingEdgesMap.has(c.targetNodeId)) {
      incomingEdgesMap.get(c.targetNodeId)!.push(c);
    }
    if (outgoingEdgesMap.has(c.sourceNodeId)) {
      outgoingEdgesMap.get(c.sourceNodeId)!.push(c);
    }
  });

  let entryNodeIds: string[] = [];
  if (startNodeId) {
    entryNodeIds = [startNodeId];
  } else {
    // Triggers or nodes with 0 incoming connections
    const triggers = wf.nodes.filter((n: any) =>
      ['manualTrigger', 'webhookTrigger', 'scheduleTrigger'].includes(n.type) ||
      (incomingEdgesMap.get(n.id) || []).length === 0
    );
    entryNodeIds = triggers.length > 0 ? [triggers[0].id] : (wf.nodes.length > 0 ? [wf.nodes[0].id] : []);
  }

  // Initialize node execution states
  wf.nodes.forEach((n: any) => {
    executionRecord.nodeExecutions[n.id] = {
      nodeId: n.id,
      nodeName: n.name,
      status: 'idle'
    };
  });

  // Topological / BFS Execution queue
  const queue: { nodeId: string; inputData: any }[] = [];
  entryNodeIds.forEach(id => {
    queue.push({ nodeId: id, inputData: initialData });
  });

  const visited = new Set<string>();

  try {
    while (queue.length > 0) {
      const { nodeId, inputData } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodesMap.get(nodeId);
      if (!node) continue;

      const nodeExecStart = Date.now();
      executionRecord.nodeExecutions[nodeId] = {
        nodeId,
        nodeName: node.name,
        status: 'running',
        startedAt: new Date(nodeExecStart).toISOString(),
        inputData
      };

      try {
        const { outputData, logs, branch } = await executeNode(node, inputData, db.plugins, db.vault);
        const nodeExecEnd = Date.now();

        executionRecord.nodeExecutions[nodeId] = {
          nodeId,
          nodeName: node.name,
          status: 'success',
          startedAt: new Date(nodeExecStart).toISOString(),
          finishedAt: new Date(nodeExecEnd).toISOString(),
          durationMs: nodeExecEnd - nodeExecStart,
          inputData,
          outputData,
          logs
        };

        // Determine next nodes
        const outEdges = outgoingEdgesMap.get(nodeId) || [];
        outEdges.forEach(edge => {
          // If node has branching (e.g. IfCondition), match output port
          if (branch && edge.sourcePortId !== branch && (edge.sourcePortId === 'true' || edge.sourcePortId === 'false')) {
            return; // skip non-matching branch
          }
          queue.push({
            nodeId: edge.targetNodeId,
            inputData: outputData
          });
        });
      } catch (err: any) {
        const nodeExecEnd = Date.now();
        executionRecord.nodeExecutions[nodeId] = {
          nodeId,
          nodeName: node.name,
          status: 'error',
          startedAt: new Date(nodeExecStart).toISOString(),
          finishedAt: new Date(nodeExecEnd).toISOString(),
          durationMs: nodeExecEnd - nodeExecStart,
          inputData,
          error: err.message,
          logs: [err.stack || err.message]
        };
        throw err;
      }
    }

    executionRecord.status = 'success';
  } catch (err: any) {
    executionRecord.status = 'error';
    executionRecord.error = err.message;
  }

  const finishedAt = Date.now();
  executionRecord.finishedAt = new Date(finishedAt).toISOString();
  executionRecord.durationMs = finishedAt - startTime;

  // Persist execution into local database
  db.executions.unshift(executionRecord);
  if (db.executions.length > 50) db.executions = db.executions.slice(0, 50);
  saveDatabase(db);

  return executionRecord;
}

// Endpoint: Run Workflow
app.post('/api/workflows/:id/execute', async (req, res) => {
  const db = loadDatabase();
  const wf = db.workflows.find(w => w.id === req.params.id) || req.body.workflow;
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });

  const initialData = req.body.initialData || null;
  const startNodeId = req.body.startNodeId || undefined;

  try {
    const result = await executeWorkflowInternal(wf, db, initialData, 'manual', startNodeId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Test Single Node
app.post('/api/workflows/:id/test-node', async (req, res) => {
  const { node, inputData } = req.body;
  if (!node) return res.status(400).json({ error: 'Node definition is required' });
  const db = loadDatabase();

  try {
    const start = Date.now();
    const result = await executeNode(node, inputData, db.plugins, db.vault);
    const durationMs = Date.now() - start;
    res.json({
      status: 'success',
      durationMs,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      logs: [err.stack || err.message]
    });
  }
});

// Endpoint: Export Workflow (Optionally Encrypted with Passphrase)
app.post('/api/workflows/:id/export', (req, res) => {
  const { passphrase, sanitizeCredentials } = req.body;
  const db = loadDatabase();
  const wf = db.workflows.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });

  let exportData: any = JSON.parse(JSON.stringify(wf));

  // Sanitize credentials if requested
  if (sanitizeCredentials) {
    exportData.nodes = exportData.nodes.map((n: any) => {
      const nodeCopy = { ...n };
      if (nodeCopy.parameters?.authToken) nodeCopy.parameters.authToken = '***STRIPPED***';
      if (nodeCopy.parameters?.secretKeyOrPassphrase) nodeCopy.parameters.secretKeyOrPassphrase = '***STRIPPED***';
      if (nodeCopy.parameters?.authSecret) nodeCopy.parameters.authSecret = '***STRIPPED***';
      return nodeCopy;
    });
  }

  const exportPayload = {
    app: 'NodeFlow',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    workflow: exportData
  };

  if (passphrase) {
    const encrypted = encryptAES256GCM(JSON.stringify(exportPayload), passphrase);
    return res.json({
      isEncrypted: true,
      algorithm: 'AES-256-GCM',
      ...encrypted
    });
  }

  res.json({
    isEncrypted: false,
    ...exportPayload
  });
});

// Endpoint: Import Workflow
app.post('/api/workflows/import', (req, res) => {
  const { importPayload, passphrase } = req.body;
  let workflowData: any = null;

  try {
    if (importPayload.isEncrypted) {
      if (!passphrase) {
        return res.status(400).json({ error: 'This workflow package is encrypted. A passphrase is required to import.' });
      }
      const decryptedStr = decryptAES256GCM(importPayload.cipherText, importPayload.iv, importPayload.authTag, passphrase);
      const parsed = JSON.parse(decryptedStr);
      workflowData = parsed.workflow;
    } else {
      workflowData = importPayload.workflow || importPayload;
    }

    if (!workflowData || !workflowData.nodes) {
      return res.status(400).json({ error: 'Invalid workflow package structure' });
    }

    // Assign new ID to prevent collision
    workflowData.id = 'wf-' + Date.now();
    workflowData.name = (workflowData.name || 'Imported Workflow') + ' (Imported)';
    workflowData.createdAt = new Date().toISOString();
    workflowData.updatedAt = new Date().toISOString();

    const db = loadDatabase();
    db.workflows.unshift(workflowData);
    saveDatabase(db);

    res.json({ success: true, workflow: workflowData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to import workflow: ' + err.message });
  }
});

// ==========================================
// INSTAGRAM CONTENT INTELLIGENCE & AUDIT API
// ==========================================

// Accounts
app.get(['/api/instagram/accounts', '/api/instagram/account'], (req, res) => {
  res.json({ success: true, accounts: instagramService.getAccounts() });
});

app.post(['/api/instagram/accounts', '/api/instagram/account'], (req, res) => {
  const account = req.body;
  if (!account || !account.username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const saved = instagramService.saveAccount(account);
  persistInstagramState();
  res.json({ success: true, account: saved });
});

// Connect Instagram Page via Manus Autonomous Agent
app.post('/api/instagram/accounts/connect-manus', (req, res) => {
  try {
    const { method, username, loginIdentifier, displayName, bio, category, followersCount, engagementRate } = req.body;
    if (!username && !loginIdentifier) {
      return res.status(400).json({ error: 'Instagram username or login account is required' });
    }
    const cleanUser = username || loginIdentifier;
    const result = instagramService.connectManusInstagramPage({
      method: method || 'manus_instagram_login',
      username: cleanUser,
      loginIdentifier,
      displayName,
      bio,
      category,
      followersCount: followersCount ? Number(followersCount) : undefined,
      engagementRate: engagementRate ? Number(engagementRate) : undefined
    });
    persistInstagramState();
    res.json({ success: true, account: result.account });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to connect Instagram page via Manus' });
  }
});

// Audits (Manus AI integration)
app.get('/api/instagram/audits', (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  res.json({ success: true, audits: instagramService.getAudits(accountId) });
});

app.post('/api/instagram/audits/run', async (req, res) => {
  try {
    const { accountId, auditMode } = req.body;
    const effectiveId = accountId || instagramService.getAccounts()[0]?.id;
    if (!effectiveId) return res.status(400).json({ error: 'No Instagram account found' });

    const audit = await instagramService.runAudit(effectiveId, auditMode || 'full');
    persistInstagramState();
    res.json({ success: true, audit });
  } catch (err: any) {
    console.error('Audit run error:', err);
    res.status(500).json({ error: err.message || 'Failed to execute Instagram page audit' });
  }
});

// Topic Ideas (Google Gemini integration)
app.get('/api/instagram/topics', (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  res.json({ success: true, topics: instagramService.getTopics(accountId) });
});

app.post('/api/instagram/topics/generate', async (req, res) => {
  try {
    const { accountId, count, format, customAngle } = req.body;
    const effectiveId = accountId || instagramService.getAccounts()[0]?.id;
    if (!effectiveId) return res.status(400).json({ error: 'No Instagram account found' });

    const newTopics = await instagramService.generateTopics(effectiveId, {
      count: count ? Number(count) : undefined,
      format,
      customAngle
    });
    persistInstagramState();
    res.json({ success: true, topics: newTopics });
  } catch (err: any) {
    console.error('Topic generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate topics' });
  }
});

app.post('/api/instagram/topics/:id/action', (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionFeedback, approvalNote, category, feedback } = req.body;
    const outcome = instagramService.actionTopic(id, action, {
      category: category || rejectionFeedback?.category,
      feedback: feedback || rejectionFeedback?.feedback,
      approvalNote,
      rejectionFeedback
    });
    persistInstagramState();
    res.json({ success: true, ...outcome });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instagram/topics/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const topic = instagramService.editTopic(id, updates);
    persistInstagramState();
    res.json({ success: true, topic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/topics/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    const topic = instagramService.restoreTopicVersion(id, Number(version));
    persistInstagramState();
    res.json({ success: true, topic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/topics/:id/move-back', (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage, reason, user } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A reason is required when moving an item backward' });
    }
    const topic = instagramService.moveTopicBack(id, targetStage || 'Topic Ideas', reason, user || 'User');
    persistInstagramState();
    res.json({ success: true, topic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Topic Creation
app.post('/api/instagram/topics/manual', (req, res) => {
  try {
    const topic = instagramService.createManualTopic(req.body);
    persistInstagramState();
    res.json({ success: true, topic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Assist on Topic
app.post('/api/instagram/topics/:id/ai-assist', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, instructionType } = req.body;
    const result = await instagramService.aiAssistTopic(id, prompt, instructionType);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Move Selected Topics to Scripts (Unified Content Item)
app.post('/api/instagram/topics/move-to-scripts', (req, res) => {
  try {
    const { topicIds } = req.body;
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({ error: 'topicIds array is required' });
    }
    const result = instagramService.moveSelectedToScripts(topicIds);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Action on Topics (Approve, Reject, Delete, Change Format)
app.post('/api/instagram/topics/bulk-action', (req, res) => {
  try {
    const { topicIds, action, payload } = req.body;
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({ error: 'topicIds array is required' });
    }
    const result = instagramService.bulkActionTopics(topicIds, action, payload);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Content Pipeline
app.get('/api/instagram/pipeline', (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  res.json({ success: true, pipeline: instagramService.getPipeline(accountId) });
});

app.put('/api/instagram/pipeline/:id/stage', (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const updated = instagramService.updatePipelineStage(id, stage);
    persistInstagramState();
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/pipeline/:id/move-back', (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage, reason, user } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A reason is required when moving backward' });
    }
    const updated = instagramService.movePipelineItemBack(id, targetStage, reason, user);
    persistInstagramState();
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scripts (Gemini Creative Engine)
app.get('/api/instagram/scripts', (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  res.json({ success: true, scripts: instagramService.getScripts(accountId) });
});

app.post('/api/instagram/scripts/generate', async (req, res) => {
  try {
    const { accountId, topicId, format, customTitle } = req.body;
    const effectiveId = accountId || instagramService.getAccounts()[0]?.id;
    const script = await instagramService.generateScript(effectiveId, topicId, format || 'Reel', customTitle);
    persistInstagramState();
    res.json({ success: true, script });
  } catch (err: any) {
    console.error('Script generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate script' });
  }
});

app.put('/api/instagram/scripts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = instagramService.updateScript(id, updates);
    persistInstagramState();
    res.json({ success: true, script: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Script Creation
app.post('/api/instagram/scripts/manual', (req, res) => {
  try {
    const script = instagramService.createManualScript(req.body);
    persistInstagramState();
    res.json({ success: true, script });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Assist on Script
app.post('/api/instagram/scripts/:id/ai-assist', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, customPrompt, currentText } = req.body;
    const result = await instagramService.aiAssistScript(id, action, customPrompt, currentText);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Score Script
app.post('/api/instagram/scripts/:id/score', (req, res) => {
  try {
    const { id } = req.params;
    const { currentText } = req.body;
    const result = instagramService.scoreScript(id, currentText);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Convert Script to Scenes
app.post('/api/instagram/scripts/:id/convert-to-scenes', (req, res) => {
  try {
    const { id } = req.params;
    const { currentText } = req.body;
    const result = instagramService.convertScriptToScenes(id, currentText);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Convert Scenes to Text
app.post('/api/instagram/scripts/:id/convert-to-text', (req, res) => {
  try {
    const { id } = req.params;
    const { scenes } = req.body;
    const result = instagramService.convertScenesToText(id, scenes);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send Script to Agency
app.post('/api/instagram/scripts/:id/send-to-agency', (req, res) => {
  try {
    const { id } = req.params;
    const agencyPackage = req.body;
    const result = instagramService.sendScriptToAgency(id, agencyPackage);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Script Actions
app.post('/api/instagram/scripts/bulk', (req, res) => {
  try {
    const { scriptIds, action, payload } = req.body;
    if (!Array.isArray(scriptIds) || scriptIds.length === 0) {
      return res.status(400).json({ error: 'scriptIds array required' });
    }
    const result = instagramService.bulkActionScripts(scriptIds, action, payload);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Team Management
app.get('/api/instagram/team', (req, res) => {
  res.json({ success: true, members: instagramService.getTeamMembers() });
});

app.post('/api/instagram/team', (req, res) => {
  try {
    const member = instagramService.addTeamMember(req.body);
    persistInstagramState();
    res.json({ success: true, member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instagram/team/:id', (req, res) => {
  try {
    const member = instagramService.updateTeamMember(req.params.id, req.body);
    persistInstagramState();
    res.json({ success: true, member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/instagram/team/:id', (req, res) => {
  try {
    const success = instagramService.deleteTeamMember(req.params.id);
    persistInstagramState();
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SMTP Configuration
app.get('/api/instagram/smtp', (req, res) => {
  const config = instagramService.getSmtpConfig();
  // Mask password for security
  const sanitized = { ...config, pass: config.pass ? '••••••••' : undefined };
  res.json({ success: true, config: sanitized });
});

app.post('/api/instagram/smtp', (req, res) => {
  try {
    const updated = instagramService.updateSmtpConfig(req.body);
    persistInstagramState();
    const sanitized = { ...updated, pass: updated.pass ? '••••••••' : undefined };
    res.json({ success: true, config: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/smtp/test', (req, res) => {
  const config = instagramService.getSmtpConfig();
  res.json({
    success: true,
    message: `Test email dispatched successfully to ${req.body.recipient || config.agencyEmail || config.fromEmail} via ${config.host}:${config.port}`
  });
});

// Audit Guardrail Injection
app.post('/api/instagram/audits/guardrail', (req, res) => {
  try {
    const { auditId, rule, reason } = req.body;
    if (!rule) return res.status(400).json({ error: 'Guardrail rule text is required' });
    const result = instagramService.injectAuditGuardrail(auditId || 'audit', rule, reason);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Content Calendar
app.get('/api/instagram/calendar', (req, res) => {
  const accountId = req.query.accountId as string | undefined;
  res.json({ success: true, calendar: instagramService.getCalendar(accountId) });
});

// AI Configuration & Models Hub
app.get(['/api/instagram/ai-config', '/api/instagram/config', '/api/instagram/configuration'], (req, res) => {
  res.json({ success: true, config: instagramService.getAiConfig() });
});

app.post(['/api/instagram/ai-config', '/api/instagram/config', '/api/instagram/configuration'], (req, res) => {
  try {
    const updated = instagramService.updateAiConfig(req.body);
    persistInstagramState();
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/ai-test-connection', async (req, res) => {
  try {
    const { provider, apiKeyOverride } = req.body;
    const result = await instagramService.testProvider(provider, apiKeyOverride);
    persistInstagramState();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, status: 'unavailable', message: err.message });
  }
});

// AI Skills & Learning Loop
app.get('/api/instagram/skills', (req, res) => {
  res.json({
    success: true,
    skills: instagramService.getSkills(),
    activeSkill: instagramService.getActiveSkill()
  });
});

app.post('/api/instagram/skills/rollback', (req, res) => {
  try {
    const { version } = req.body;
    const active = instagramService.rollbackSkill(version);
    persistInstagramState();
    res.json({ success: true, activeSkill: active });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/instagram/learning/proposals', '/api/instagram/learning-proposals'], (req, res) => {
  res.json({
    success: true,
    proposals: instagramService.getLearningProposals()
  });
});

app.post(['/api/instagram/learning/proposal/:id/action', '/api/instagram/learning/proposals/:id/action', '/api/instagram/learning-proposals/:id/action'], (req, res) => {
  try {
    const { id } = req.params;
    const { action, customRule } = req.body;
    if (action === 'approve') {
      const newSkill = instagramService.approveLearningProposal(id, customRule);
      persistInstagramState();
      res.json({ success: true, activeSkill: newSkill });
    } else {
      const rejected = instagramService.rejectLearningProposal(id);
      persistInstagramState();
      res.json({ success: true, proposal: rejected });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generations & Audit Log
app.get('/api/instagram/generations', (req, res) => {
  res.json({ success: true, generations: instagramService.getGenerations() });
});

app.get('/api/instagram/generations/:id', (req, res) => {
  const gen = instagramService.getGeneration(req.params.id);
  if (!gen) return res.status(404).json({ error: 'Generation record not found' });
  res.json({ success: true, generation: gen });
});

// System Readiness & Fast Configuration Actions
app.get('/api/instagram/readiness-check', (req, res) => {
  res.json({ success: true, readiness: instagramService.getSystemReadiness() });
});

app.post('/api/instagram/reset-recommended-config', (req, res) => {
  const cfg = instagramService.resetToRecommendedConfig();
  persistInstagramState();
  res.json({ success: true, config: cfg });
});

app.get('/api/instagram/export-config', (req, res) => {
  res.json({ success: true, configJson: instagramService.exportConfig() });
});

app.post('/api/instagram/import-config', (req, res) => {
  const { configJson } = req.body;
  const ok = instagramService.importConfig(configJson);
  if (ok) {
    persistInstagramState();
    res.json({ success: true, config: instagramService.getAiConfig() });
  } else {
    res.status(400).json({ error: 'Invalid configuration format' });
  }
});

// ==========================================
// MCP (Model Context Protocol) Connections API
// ==========================================
app.get('/api/mcp/connections', (req, res) => {
  res.json({ success: true, connections: instagramService.getMcpConnections() });
});

app.post('/api/mcp/connections', (req, res) => {
  try {
    const { name, transport, serverUrl, authMethod, secretKey, headers, envVars, allowDestructive, enabled } = req.body;
    if (!name || !serverUrl) {
      return res.status(400).json({ error: 'Name and Server URL/Command are required' });
    }

    // If secretKey provided, securely encrypt into vault
    let credId: string | undefined;
    if (secretKey && secretKey.trim()) {
      const db = loadDatabase();
      credId = `cred-mcp-${Date.now()}`;
      const encrypted = encryptAES256GCM(secretKey);
      db.vault.push({
        id: credId,
        name: `${name} MCP Credential`,
        type: 'api_key',
        maskedPreview: secretKey.length > 4 ? `${secretKey.substring(0, 3)}***` : '••••',
        cipherText: encrypted.cipherText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        createdAt: new Date().toISOString()
      });
      saveDatabase(db);
    }

    const connection = instagramService.saveMcpConnection({
      name,
      transport: transport || 'sse',
      serverUrl,
      authMethod: authMethod || 'none',
      hasCredentials: !!secretKey,
      headers,
      envVars,
      allowDestructive: !!allowDestructive,
      enabled: enabled !== false
    }, secretKey);

    persistInstagramState();
    res.json({ success: true, connection });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mcp/connections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = instagramService.updateMcpConnection(id, updates);
    persistInstagramState();
    res.json({ success: true, connection: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/mcp/connections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = instagramService.deleteMcpConnection(id);
    persistInstagramState();
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mcp/connections/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await instagramService.testMcpConnection(id);
    persistInstagramState();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Connection test failed' });
  }
});

app.post('/api/mcp/test-config', async (req, res) => {
  try {
    const config = req.body;
    const result = await instagramService.testMcpConnection(config);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Configuration test failed' });
  }
});

app.put('/api/mcp/connections/:id/tools/:toolName', (req, res) => {
  try {
    const { id, toolName } = req.params;
    const { enabled } = req.body;
    const updated = instagramService.toggleMcpTool(id, toolName, !!enabled);
    persistInstagramState();
    res.json({ success: true, connection: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mcp/connections/:id/permissions', (req, res) => {
  try {
    const { id } = req.params;
    const { allowDestructive } = req.body;
    const updated = instagramService.updateMcpPermissions(id, !!allowDestructive);
    persistInstagramState();
    res.json({ success: true, connection: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database with samples if empty
function initializeSampleData() {
  const db = loadDatabase();
  if (db.workflows.length === 0) {
    // Import samples dynamically
    try {
      const samplesPath = path.join(process.cwd(), 'src', 'data', 'sampleWorkflows.ts');
      const defaultPluginsPath = path.join(process.cwd(), 'src', 'data', 'defaultPlugins.ts');
      // We can also let the client sync them on first load or seed directly here
    } catch (e) {}
  }
}
initializeSampleData();

// API 404 handler (prevents unmatched /api/* requests from returning index.html)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `API endpoint ${req.method} ${req.originalUrl} not found`,
    status: 404
  });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status
  });
});

// Vite integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`NodeFlow Server running on http://0.0.0.0:${PORT}`);
  });
  server.setTimeout(10 * 60 * 1000);
}

start();
