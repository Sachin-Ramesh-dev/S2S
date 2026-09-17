import { Workflow, WorkflowNode, WorkflowConnection } from '../types';

export const NODE_TYPE_MAP: Record<string, string> = {
  'n8n-nodes-base.scheduleTrigger': 'scheduleTrigger',
  'n8n-nodes-base.webhook': 'webhookTrigger',
  'n8n-nodes-base.manualTrigger': 'manualTrigger',
  'n8n-nodes-base.postgres': 'sqlQuery',
  'n8n-nodes-base.httpRequest': 'httpRequest',
  'n8n-nodes-base.wait': 'waitNode',
  'n8n-nodes-base.if': 'ifCondition',
  'n8n-nodes-base.set': 'setFields',
  'n8n-nodes-base.code': 'codeJs',
  '@n8n/n8n-nodes-langchain.googleGemini': 'aiAgent',
  'postgres': 'sqlQuery',
  'httpRequest': 'httpRequest',
  'wait': 'waitNode',
  'if': 'ifCondition',
  'googleGemini': 'aiAgent'
};

export const REVERSE_TYPE_MAP: Record<string, string> = {
  scheduleTrigger: 'n8n-nodes-base.scheduleTrigger',
  webhookTrigger: 'n8n-nodes-base.webhook',
  manualTrigger: 'n8n-nodes-base.manualTrigger',
  sqlQuery: 'n8n-nodes-base.postgres',
  httpRequest: 'n8n-nodes-base.httpRequest',
  waitNode: 'n8n-nodes-base.wait',
  ifCondition: 'n8n-nodes-base.if',
  setFields: 'n8n-nodes-base.set',
  codeJs: 'n8n-nodes-base.code',
  aiAgent: '@n8n/n8n-nodes-langchain.googleGemini'
};

/**
 * Converts a standard n8n JSON workflow into our Workflow format.
 */
export function convertN8nToNodeflow(n8nData: any): Workflow {
  const name = n8nData.name || 'Imported Workflow';
  const id = n8nData.id ? `wf-${n8nData.id}` : `wf-imported-${Date.now()}`;
  const now = new Date().toISOString();

  const nodes: WorkflowNode[] = (n8nData.nodes || []).map((n: any, idx: number) => {
    const rawType = n.type || 'manualTrigger';
    const mappedType = NODE_TYPE_MAP[rawType] || rawType;
    const posX = Array.isArray(n.position) ? n.position[0] : (n.position?.x ?? idx * 260 + 80);
    const posY = Array.isArray(n.position) ? n.position[1] : (n.position?.y ?? 200);

    return {
      id: n.id || `node-${idx}-${Date.now()}`,
      type: mappedType,
      name: n.name || `Node ${idx + 1}`,
      position: { x: posX, y: posY },
      parameters: {
        ...n.parameters,
        ...(n.parameters?.prompt ? { promptTemplate: n.parameters.prompt } : {}),
        ...(n.parameters?.conditions?.conditions?.[0]
          ? {
              fieldPath: n.parameters.conditions.conditions[0].leftValue?.replace(/[{}$\s]/g, '') || 'status',
              compareValue: n.parameters.conditions.conditions[0].rightValue || 'stopped',
              operator: 'equals'
            }
          : {})
      }
    };
  });

  const nodeNameToId: Record<string, string> = {};
  nodes.forEach((n) => {
    nodeNameToId[n.name] = n.id;
  });

  const connections: WorkflowConnection[] = [];
  let connIdx = 1;

  if (n8nData.connections) {
    Object.entries(n8nData.connections).forEach(([sourceName, connGroup]: [string, any]) => {
      const sourceNodeId = nodeNameToId[sourceName] || sourceName;
      if (connGroup.main && Array.isArray(connGroup.main)) {
        connGroup.main.forEach((branchArr: any[], branchIdx: number) => {
          const sourcePortId = branchIdx === 1 ? 'false' : branchIdx === 0 ? (connGroup.main.length > 1 ? 'true' : 'main') : `branch_${branchIdx}`;
          if (Array.isArray(branchArr)) {
            branchArr.forEach((targetObj: any) => {
              const targetNodeId = nodeNameToId[targetObj.node] || targetObj.node;
              connections.push({
                id: `conn-${connIdx++}`,
                sourceNodeId,
                sourcePortId,
                targetNodeId,
                targetPortId: 'main',
                label: sourcePortId === 'true' ? 'True' : sourcePortId === 'false' ? 'False' : undefined
              });
            });
          }
        });
      }
    });
  }

  return {
    id,
    name,
    description: n8nData.description || `Workflow imported from n8n format with ${nodes.length} nodes.`,
    active: n8nData.active ?? true,
    createdAt: n8nData.createdAt || now,
    updatedAt: n8nData.updatedAt || now,
    tags: n8nData.tags || ['n8n', 'Automated'],
    scope: 'Personal / For Teams',
    folder: 'For Teams',
    published: true,
    triggerCount: nodes.filter((n) => ['manualTrigger', 'webhookTrigger', 'scheduleTrigger'].includes(n.type)).length || 1,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
      saveExecutionData: 'all',
      timeoutMinutes: 60,
      availableInMCP: true
    }
  };
}

/**
 * Converts a NodeFlow workflow into standard n8n JSON format for exporting.
 */
export function convertNodeflowToN8n(workflow: Workflow): any {
  const nodeIdToName: Record<string, string> = {};
  workflow.nodes.forEach((n) => {
    nodeIdToName[n.id] = n.name;
  });

  const n8nConnections: Record<string, any> = {};

  workflow.connections.forEach((c) => {
    const sourceName = nodeIdToName[c.sourceNodeId] || c.sourceNodeId;
    const targetName = nodeIdToName[c.targetNodeId] || c.targetNodeId;

    if (!n8nConnections[sourceName]) {
      n8nConnections[sourceName] = { main: [[]] };
    }

    if (c.sourcePortId === 'false') {
      if (!n8nConnections[sourceName].main[1]) {
        n8nConnections[sourceName].main[1] = [];
      }
      n8nConnections[sourceName].main[1].push({
        node: targetName,
        type: 'main',
        index: 0
      });
    } else {
      if (!n8nConnections[sourceName].main[0]) {
        n8nConnections[sourceName].main[0] = [];
      }
      n8nConnections[sourceName].main[0].push({
        node: targetName,
        type: 'main',
        index: 0
      });
    }
  });

  return {
    name: workflow.name,
    nodes: workflow.nodes.map((n) => ({
      parameters: n.parameters || {},
      type: REVERSE_TYPE_MAP[n.type] || n.type,
      typeVersion: 1,
      position: [n.position.x, n.position.y],
      id: n.id,
      name: n.name
    })),
    connections: n8nConnections,
    active: workflow.active,
    settings: {
      executionOrder: workflow.settings?.executionOrder || 'v1'
    },
    versionId: workflow.id,
    id: workflow.id.replace(/^wf-/, ''),
    meta: {
      templateCredsSetupCompleted: true
    },
    tags: (workflow.tags || []).map((t) => ({ name: t }))
  };
}
