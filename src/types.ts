export type NodeCategory =
  | 'trigger'
  | 'action'
  | 'logic'
  | 'transform'
  | 'security'
  | 'plugin'
  | 'utility';

export interface NodePort {
  id: string;
  label: string;
  type?: 'main' | 'true' | 'false' | 'error' | string;
}

export interface NodeParameterSchema {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'code' | 'secret' | 'headers';
  default?: any;
  options?: { label: string; value: string }[];
  description?: string;
  placeholder?: string;
  required?: boolean;
}

export interface NodeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  icon: string;
  color: string;
  inputs: NodePort[];
  outputs: NodePort[];
  parametersSchema: NodeParameterSchema[];
  defaultParameters: Record<string, any>;
  isTrigger?: boolean;
  isPlugin?: boolean;
  pluginId?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  credentialsRef?: string;
  disabled?: boolean;
  notes?: string;
  pluginId?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isEncrypted?: boolean;
  scope?: string;
  published?: boolean;
  triggerCount?: number;
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'stopped';

export interface SingleNodeExecution {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  inputData?: any;
  outputData?: any;
  error?: string;
  logs?: string[];
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  triggerType: 'manual' | 'webhook' | 'test' | 'schedule';
  nodeExecutions: Record<string, SingleNodeExecution>;
  error?: string;
}

export interface CustomPluginNode {
  id: string;
  type: string;
  name: string;
  icon: string;
  category: NodeCategory;
  description: string;
  version: string;
  author: string;
  inputs: NodePort[];
  outputs: NodePort[];
  parametersSchema: NodeParameterSchema[];
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCredential {
  id: string;
  name: string;
  type: 'api_key' | 'bearer_token' | 'basic_auth' | 'custom_header' | 'secret_key';
  maskedPreview: string;
  encryptedData: string; // Base64 ciphertext
  iv: string; // Base64 IV
  authTag: string; // Base64 GCM auth tag
  createdAt: string;
  updatedAt: string;
}

export interface SecurityStatus {
  vaultInitialized: boolean;
  credentialsCount: number;
  encryptionAlgorithm: string;
  keyDerivation: string;
  storageMode: 'local_encrypted' | 'local_unencrypted';
  localStorageLocation: string;
}
