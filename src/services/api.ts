import {
  Workflow,
  ExecutionRecord,
  CustomPluginNode,
  VaultCredential,
  SecurityStatus,
  WorkflowNode
} from '../types';
import { SAMPLE_WORKFLOWS } from '../data/sampleWorkflows';
import { DEFAULT_PLUGINS } from '../data/defaultPlugins';

const API_BASE = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (e) {
    return { status: 'offline', error: String(e) };
  }
}

export async function fetchSecurityStatus(): Promise<SecurityStatus> {
  try {
    const res = await fetch(`${API_BASE}/security/status`);
    if (!res.ok) throw new Error('Failed to fetch security status');
    return await res.json();
  } catch (e) {
    return {
      vaultInitialized: true,
      credentialsCount: 1,
      encryptionAlgorithm: 'AES-256-GCM + PBKDF2',
      keyDerivation: 'PBKDF2-SHA256 (100,000 iterations)',
      storageMode: 'local_encrypted',
      localStorageLocation: 'data/nodeflow_db.json'
    };
  }
}

export async function fetchVaultCredentials(): Promise<VaultCredential[]> {
  try {
    const res = await fetch(`${API_BASE}/vault`);
    if (!res.ok) throw new Error('Failed to fetch vault');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function addVaultCredential(
  name: string,
  type: string,
  secretValue: string,
  passphrase?: string
): Promise<VaultCredential> {
  const res = await fetch(`${API_BASE}/vault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, secretValue, passphrase })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save credential');
  }
  return await res.json();
}

export async function deleteVaultCredential(id: string): Promise<void> {
  await fetch(`${API_BASE}/vault/${id}`, { method: 'DELETE' });
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    const res = await fetch(`${API_BASE}/workflows`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {}

  // Fallback to sample workflows and sync them to server
  for (const wf of SAMPLE_WORKFLOWS) {
    try {
      await saveWorkflow(wf);
    } catch (e) {}
  }
  return SAMPLE_WORKFLOWS;
}

export async function saveWorkflow(workflow: Workflow): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  });
  if (!res.ok) {
    throw new Error('Failed to save workflow');
  }
  return workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workflow');
}

export async function executeWorkflow(
  workflowId: string,
  workflow: Workflow,
  initialData?: any,
  startNodeId?: string
): Promise<ExecutionRecord> {
  const res = await fetch(`${API_BASE}/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow, initialData, startNodeId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Execution failed');
  }
  return await res.json();
}

export async function testNodeExecution(node: WorkflowNode, inputData: any) {
  const res = await fetch(`${API_BASE}/workflows/test/test-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node, inputData })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Test node failed');
  }
  return await res.json();
}

export async function fetchExecutions(): Promise<ExecutionRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/executions?limit=30`);
    if (!res.ok) throw new Error('Failed to fetch executions');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function fetchPlugins(): Promise<CustomPluginNode[]> {
  try {
    const res = await fetch(`${API_BASE}/plugins`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {}

  // Sync default plugins to server
  for (const p of DEFAULT_PLUGINS) {
    try {
      await savePlugin(p);
    } catch (e) {}
  }
  return DEFAULT_PLUGINS;
}

export async function savePlugin(plugin: CustomPluginNode): Promise<CustomPluginNode> {
  const res = await fetch(`${API_BASE}/plugins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plugin)
  });
  if (!res.ok) throw new Error('Failed to save plugin');
  return plugin;
}

export async function deletePlugin(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/plugins/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete plugin');
}

export async function exportWorkflow(
  workflowId: string,
  passphrase?: string,
  sanitizeCredentials = true
): Promise<any> {
  const res = await fetch(`${API_BASE}/workflows/${workflowId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase, sanitizeCredentials })
  });
  if (!res.ok) throw new Error('Export failed');
  return await res.json();
}

export async function importWorkflow(importPayload: any, passphrase?: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ importPayload, passphrase })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Import failed');
  }
  const data = await res.json();
  return data.workflow;
}
