import { WorkflowNode, WorkflowConnection } from '../types';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  spacing?: 'compact' | 'normal' | 'spacious';
  nodeWidth?: number;
  nodeHeight?: number;
  startX?: number;
  startY?: number;
}

export interface LayoutResult {
  nodes: WorkflowNode[];
  stats: {
    nodeCount: number;
    layerCount: number;
    componentCount: number;
    isolatedCount: number;
  };
}

/**
 * High-performance, Sugiyama-inspired DAG layout algorithm for workflow pipelines.
 * Organizes nodes neatly into hierarchical layers, minimizing edge crossings,
 * aligning linear sequences, balancing branches, and cleanly stacking disconnected components.
 */
export function autoArrangeWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  options: LayoutOptions = {}
): LayoutResult {
  if (nodes.length === 0) {
    return {
      nodes: [],
      stats: { nodeCount: 0, layerCount: 0, componentCount: 0, isolatedCount: 0 }
    };
  }

  const direction = options.direction || 'LR';
  const spacingMode = options.spacing || 'normal';

  // Sizing parameters
  const nodeW = options.nodeWidth || 96;
  const nodeH = options.nodeHeight || 84;

  let layerGapX = 240; // horizontal distance between layer centers
  let layerGapY = 140; // vertical distance between nodes in the same layer

  if (spacingMode === 'compact') {
    layerGapX = 190;
    layerGapY = 115;
  } else if (spacingMode === 'spacious') {
    layerGapX = 290;
    layerGapY = 165;
  }

  const startX = options.startX ?? 160;
  const startY = options.startY ?? 140;

  // 1. Build adjacency maps and degree counters
  const nodeMap = new Map<string, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach((n) => {
    childrenMap.set(n.id, []);
    parentsMap.set(n.id, []);
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  // Valid connections between existing nodes
  const validConnections = connections.filter(
    (c) => nodeMap.has(c.sourceNodeId) && nodeMap.has(c.targetNodeId)
  );

  validConnections.forEach((c) => {
    childrenMap.get(c.sourceNodeId)?.push(c.targetNodeId);
    parentsMap.get(c.targetNodeId)?.push(c.sourceNodeId);
    outDegree.set(c.sourceNodeId, (outDegree.get(c.sourceNodeId) || 0) + 1);
    inDegree.set(c.targetNodeId, (inDegree.get(c.targetNodeId) || 0) + 1);
  });

  // 2. Identify Weakly Connected Components
  const visitedForComponents = new Set<string>();
  const components: string[][] = [];

  nodes.forEach((node) => {
    if (visitedForComponents.has(node.id)) return;

    const currentComponent: string[] = [];
    const queue = [node.id];
    visitedForComponents.add(node.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      currentComponent.push(curr);

      const neighbors = [
        ...(childrenMap.get(curr) || []),
        ...(parentsMap.get(curr) || [])
      ];

      for (const neighbor of neighbors) {
        if (!visitedForComponents.has(neighbor)) {
          visitedForComponents.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(currentComponent);
  });

  // Separate components with multiple nodes vs isolated singletons
  const connectedComponents = components.filter(
    (comp) => comp.length > 1 || (comp.length === 1 && (outDegree.get(comp[0])! > 0 || inDegree.get(comp[0])! > 0))
  );
  const isolatedNodes = components
    .filter((comp) => comp.length === 1 && outDegree.get(comp[0]) === 0 && inDegree.get(comp[0]) === 0)
    .map((comp) => comp[0]);

  // Sort connected components by total nodes descending
  connectedComponents.sort((a, b) => b.length - a.length);

  const newPositions = new Map<string, { x: number; y: number }>();
  let currentComponentY = startY;
  let maxGlobalLayerCount = 0;

  // 3. Layout each connected component
  for (const compNodes of connectedComponents) {
    const compNodeSet = new Set(compNodes);

    // Break cycles using DFS topological sort
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const acyclicChildren = new Map<string, string[]>();
    const acyclicParents = new Map<string, string[]>();

    compNodes.forEach((id) => {
      acyclicChildren.set(id, []);
      acyclicParents.set(id, []);
    });

    const dfsCycleBreak = (u: string) => {
      visiting.add(u);
      visited.add(u);

      const allChildren = childrenMap.get(u) || [];
      for (const v of allChildren) {
        if (!compNodeSet.has(v)) continue;
        if (visiting.has(v)) {
          // Back-edge detected! Skip to prevent infinite loop in rank assignment
          continue;
        }
        acyclicChildren.get(u)?.push(v);
        acyclicParents.get(v)?.push(u);

        if (!visited.has(v)) {
          dfsCycleBreak(v);
        }
      }
      visiting.delete(u);
    };

    // Start DFS from nodes with in-degree 0, or arbitrary if pure cycle
    const roots = compNodes.filter((id) => (parentsMap.get(id)?.length || 0) === 0);
    const startNodes = roots.length > 0 ? roots : [compNodes[0]];

    startNodes.forEach((root) => {
      if (!visited.has(root)) dfsCycleBreak(root);
    });
    // Ensure all nodes visited
    compNodes.forEach((id) => {
      if (!visited.has(id)) dfsCycleBreak(id);
    });

    // 4. Compute Ranks (Longest Path Layering)
    const ranks = new Map<string, number>();
    compNodes.forEach((id) => ranks.set(id, 0));

    // Topological order processing
    const compInDegree = new Map<string, number>();
    compNodes.forEach((id) => {
      compInDegree.set(id, acyclicParents.get(id)?.length || 0);
    });

    const queue: string[] = compNodes.filter((id) => compInDegree.get(id) === 0);
    if (queue.length === 0 && compNodes.length > 0) {
      queue.push(compNodes[0]);
    }

    const topoOrder: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      topoOrder.push(u);

      const nextNodes = acyclicChildren.get(u) || [];
      for (const v of nextNodes) {
        ranks.set(v, Math.max(ranks.get(v) || 0, (ranks.get(u) || 0) + 1));
        const rem = (compInDegree.get(v) || 1) - 1;
        compInDegree.set(v, rem);
        if (rem === 0) {
          queue.push(v);
        }
      }
    }

    // Assign any remaining unplaced nodes
    compNodes.forEach((id) => {
      if (!topoOrder.includes(id)) {
        ranks.set(id, 0);
      }
    });

    // Group into layers
    const layerCount = Math.max(...Array.from(ranks.values()), 0) + 1;
    maxGlobalLayerCount = Math.max(maxGlobalLayerCount, layerCount);

    const layers: string[][] = Array.from({ length: layerCount }, () => []);
    compNodes.forEach((id) => {
      const r = ranks.get(id) || 0;
      layers[r].push(id);
    });

    // 5. Barycenter Vertex Ordering to Minimize Crossings
    // Order roots by initial Y coordinate
    layers[0].sort((a, b) => (nodeMap.get(a)?.position.y || 0) - (nodeMap.get(b)?.position.y || 0));

    // Forward sweep
    for (let l = 1; l < layerCount; l++) {
      const prevLayer = layers[l - 1];
      const prevPosMap = new Map<string, number>();
      prevLayer.forEach((id, idx) => prevPosMap.set(id, idx));

      layers[l].sort((a, b) => {
        const parentsA = acyclicParents.get(a) || [];
        const parentsB = acyclicParents.get(b) || [];

        const baryA =
          parentsA.length > 0
            ? parentsA.reduce((sum, p) => sum + (prevPosMap.get(p) ?? 0), 0) / parentsA.length
            : 0;
        const baryB =
          parentsB.length > 0
            ? parentsB.reduce((sum, p) => sum + (prevPosMap.get(p) ?? 0), 0) / parentsB.length
            : 0;

        return baryA - baryB;
      });
    }

    // Backward sweep
    for (let l = layerCount - 2; l >= 0; l--) {
      const nextLayer = layers[l + 1];
      const nextPosMap = new Map<string, number>();
      nextLayer.forEach((id, idx) => nextPosMap.set(id, idx));

      layers[l].sort((a, b) => {
        const childrenA = acyclicChildren.get(a) || [];
        const childrenB = acyclicChildren.get(b) || [];

        if (childrenA.length === 0 && childrenB.length === 0) return 0;
        if (childrenA.length === 0) return 1;
        if (childrenB.length === 0) return -1;

        const baryA =
          childrenA.reduce((sum, c) => sum + (nextPosMap.get(c) ?? 0), 0) / childrenA.length;
        const baryB =
          childrenB.reduce((sum, c) => sum + (nextPosMap.get(c) ?? 0), 0) / childrenB.length;

        return baryA - baryB;
      });
    }

    // 6. Coordinate Assignment with Symmetry and Vertical Centering
    const maxNodesInAnyLayer = Math.max(...layers.map((l) => l.length), 1);
    const componentHeight = (maxNodesInAnyLayer - 1) * layerGapY + nodeH;
    const componentCenterY = currentComponentY + componentHeight / 2;

    layers.forEach((layerNodes, lIdx) => {
      const layerSize = layerNodes.length;
      const layerHeight = (layerSize - 1) * layerGapY;
      const layerStartY = componentCenterY - layerHeight / 2;

      layerNodes.forEach((nodeId, nIdx) => {
        let posX = startX + lIdx * layerGapX;
        let posY = layerStartY + nIdx * layerGapY;

        // If direction is Top-to-Bottom, swap X and Y
        if (direction === 'TB') {
          posX = startX + (layerStartY - currentComponentY + nIdx * layerGapY);
          posY = currentComponentY + lIdx * layerGapX;
        }

        newPositions.set(nodeId, {
          x: Math.round(posX),
          y: Math.round(posY)
        });
      });
    });

    // Advance Y baseline for next component
    currentComponentY += componentHeight + 140; // 140px clean separation between distinct workflows
  }

  // 7. Place Isolated / Standalone Nodes neatly
  if (isolatedNodes.length > 0) {
    const isolatedCols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(isolatedNodes.length))));
    const isolatedGapX = layerGapX * 0.8;
    const isolatedGapY = layerGapY * 0.85;

    isolatedNodes.forEach((nodeId, idx) => {
      const col = idx % isolatedCols;
      const row = Math.floor(idx / isolatedCols);

      const posX = startX + col * isolatedGapX;
      const posY = currentComponentY + row * isolatedGapY;

      newPositions.set(nodeId, {
        x: Math.round(posX),
        y: Math.round(posY)
      });
    });
  }

  // 8. Construct final arranged nodes
  const arrangedNodes = nodes.map((node) => {
    const pos = newPositions.get(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: pos
    };
  });

  return {
    nodes: arrangedNodes,
    stats: {
      nodeCount: nodes.length,
      layerCount: maxGlobalLayerCount,
      componentCount: connectedComponents.length,
      isolatedCount: isolatedNodes.length
    }
  };
}
