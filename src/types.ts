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

export type NodeParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'multiOptions'
  | 'dateTime'
  | 'color'
  | 'json'
  | 'code'
  | 'secret'
  | 'collection'
  | 'fixedCollection'
  | 'resourceMapper'
  | 'notice'
  | 'select'
  | 'headers';

export interface NodeParameterOption {
  label: string;
  value: any;
  description?: string;
}

export interface CollectionField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'options';
  placeholder?: string;
  default?: any;
  options?: NodeParameterOption[];
}

export interface NodeParameterSchema {
  name: string;
  label: string;
  type: NodeParameterType;
  default?: any;
  options?: NodeParameterOption[];
  description?: string;
  placeholder?: string;
  required?: boolean;
  typeOptions?: {
    rows?: number;
    language?: 'javascript' | 'python' | 'json' | 'sql';
    minValue?: number;
    maxValue?: number;
    step?: number;
    multipleValues?: boolean;
  };
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  noticeType?: 'info' | 'warning' | 'error' | 'success';
  noticeText?: string;
  collectionFields?: CollectionField[];
  supportsExpression?: boolean;
}

export interface NodeConfigExample {
  title: string;
  description: string;
  config: Record<string, any>;
  sampleOutput?: any;
}

export interface NodeDocumentation {
  overview?: string;
  usageGuide?: string;
  inputRequirements?: string;
  outputDescription?: string;
  configurationExamples?: NodeConfigExample[];
  tips?: string[];
  externalDocsUrl?: string;
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
  documentation?: NodeDocumentation;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  subtitle?: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  parameterModes?: Record<string, 'fixed' | 'expression'>;
  credentialsRef?: string;
  disabled?: boolean;
  pinnedData?: any;
  notes?: string;
  pluginId?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  label?: string;
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
  isFavorite?: boolean;
  isArchived?: boolean;
  scope?: string;
  folder?: string;
  published?: boolean;
  triggerCount?: number;
  settings?: {
    executionOrder?: 'v1';
    binaryMode?: 'separate';
    availableInMCP?: boolean;
    saveExecutionData?: 'all' | 'none' | 'errors';
    timeoutMinutes?: number;
    errorWorkflowId?: string;
  };
  versionHistory?: Array<{
    id: string;
    version: number;
    name: string;
    savedAt: string;
    author: string;
    nodeCount: number;
  }>;
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
