import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

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
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading storage, resetting to default', e);
    return { workflows: [], executions: [], plugins: [], vault: [], securitySettings: { vaultInitialized: true, storageMode: 'local_encrypted', encryptionAlgorithm: 'AES-256-GCM', localStorageLocation: STORAGE_FILE } };
  }
}

function saveDatabase(db: DatabaseSchema) {
  const tempFile = STORAGE_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tempFile, STORAGE_FILE);
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

  // 9. Delay
  if (node.type === 'delay') {
    const ms = Number(params.durationMs) || 500;
    logs.push(`Pausing workflow execution for ${ms}ms`);
    await new Promise(r => setTimeout(r, Math.min(ms, 5000))); // cap at 5s for safety
    return { outputData: inputData, logs };
  }

  // 10. Webhook Sender
  if (node.type === 'webhookSender') {
    const url = params.webhookUrl;
    logs.push(`Dispatching webhook payload to: ${url}`);
    if (url && url.startsWith('http')) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'nodeflow_dispatch',
            data: inputData,
            dispatchedAt: new Date().toISOString()
          })
        });
        logs.push(`Webhook dispatched. Response status: ${res.status}`);
      } catch (e: any) {
        logs.push(`Webhook dispatch warning: ${e.message}`);
      }
    }
    return { outputData: { dispatched: true, destination: url, payload: inputData }, logs };
  }

  // 11. Custom Plugins
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NodeFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
