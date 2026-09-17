import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow,
  WorkflowNode as IWorkflowNode,
  WorkflowConnection,
  NodeDefinition,
  SingleNodeExecution
} from '../types';
import { WorkflowNode } from './WorkflowNode';
import { MiniMap } from './MiniMap';
import { SelectionContextMenu } from './SelectionContextMenu';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  LayoutGrid,
  Plus,
  Search,
  StickyNote,
  Columns,
  Sparkles,
  FlaskConical,
  ChevronUp,
  ExternalLink,
  Wand2,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowDown,
  Undo2,
  Redo2,
  Keyboard,
  Camera,
  Loader2
} from 'lucide-react';
import { autoArrangeWorkflow, LayoutOptions } from '../utils/layoutAlgorithm';
import { exportCanvasSnapshot } from '../utils/canvasSnapshot';
import { useTheme } from '../context/ThemeContext';

interface Props {
  workflow: Workflow;
  nodeDefinitions: Record<string, NodeDefinition>;
  executionResults?: Record<string, SingleNodeExecution>;
  isExecuting?: boolean;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodes: (nodes: IWorkflowNode[]) => void;
  onUpdateConnections: (connections: WorkflowConnection[]) => void;
  onOpenDrawer: (node: IWorkflowNode) => void;
  onOpenPalette: () => void;
  onQuickConnectNode?: (sourceNodeId: string, portId: string, targetPos?: { x: number; y: number }) => void;
  onExecuteWorkflow?: () => void;
  onOpenShortcuts?: () => void;
}

export const Canvas: React.FC<Props> = ({
  workflow,
  nodeDefinitions,
  executionResults = {},
  isExecuting = false,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onUpdateConnections,
  onOpenDrawer,
  onOpenPalette,
  onQuickConnectNode,
  onExecuteWorkflow,
  onOpenShortcuts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  // Pan & Zoom state persisted in localStorage
  const [pan, setPan] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(`nodeflow_viewport_${workflow.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.pan?.x === 'number' && typeof parsed.pan?.y === 'number') {
          return parsed.pan;
        }
      }
    } catch (e) {}
    return { x: 80, y: 80 };
  });

  const [zoom, setZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`nodeflow_viewport_${workflow.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.zoom === 'number' && !isNaN(parsed.zoom)) {
          return parsed.zoom;
        }
      }
    } catch (e) {}
    return 1;
  });

  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [isMiniMapCollapsed, setIsMiniMapCollapsed] = useState(false);

  // Sync viewport when switching workflows
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nodeflow_viewport_${workflow.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pan && parsed.zoom) {
          setPan(parsed.pan);
          setZoom(parsed.zoom);
          return;
        }
      }
    } catch (e) {}
    // If no saved viewport, auto-fit after brief layout measure
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 60);
    return () => clearTimeout(timer);
  }, [workflow.id]);

  // Persist pan and zoom changes
  useEffect(() => {
    try {
      localStorage.setItem(`nodeflow_viewport_${workflow.id}`, JSON.stringify({ pan, zoom }));
    } catch (e) {}
  }, [pan, zoom, workflow.id]);

  // Export workflow as downloadable PNG snapshot
  const handleTakeSnapshot = async () => {
    setIsTakingSnapshot(true);
    try {
      const filename = await exportCanvasSnapshot(workflow, nodeDefinitions, isDark, executionResults);
      setLayoutNotification(`Workflow snapshot downloaded: ${filename}`);
      setTimeout(() => setLayoutNotification(null), 3500);
    } catch (err: any) {
      console.error('Failed to take snapshot:', err);
      setLayoutNotification('Failed to generate snapshot');
      setTimeout(() => setLayoutNotification(null), 3000);
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connecting state
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    portId: string;
    isOutput: boolean;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover state for connections
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  // Auto-arrange layout state
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [layoutSpacing, setLayoutSpacing] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [isAutoArranging, setIsAutoArranging] = useState(false);
  const [isArrangeMenuOpen, setIsArrangeMenuOpen] = useState(false);
  const [layoutNotification, setLayoutNotification] = useState<string | null>(null);

  // --- UNDO / REDO STATE MANAGEMENT ---
  const historyRef = useRef<{ nodes: IWorkflowNode[]; connections: WorkflowConnection[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Track initial positions when drag starts for delta calculation & history snapshot
  const dragStartSnapshotRef = useRef<{ nodes: IWorkflowNode[]; connections: WorkflowConnection[] } | null>(null);
  const dragInitialPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // --- MULTI-SELECT STATE MANAGEMENT ---
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isSelectingMarquee, setIsSelectingMarquee] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // --- MINIMAP CONTAINER DIMENSIONS ---
  const [containerDimensions, setContainerDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 700
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Initialize history stack on first load
  useEffect(() => {
    if (historyRef.current.length === 0 && workflow.nodes.length > 0) {
      historyRef.current = [
        {
          nodes: JSON.parse(JSON.stringify(workflow.nodes)),
          connections: JSON.parse(JSON.stringify(workflow.connections))
        }
      ];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [workflow.id]);

  // Sync selectedNodeId prop with selectedNodeIds
  useEffect(() => {
    if (selectedNodeId && !selectedNodeIds.includes(selectedNodeId)) {
      setSelectedNodeIds([selectedNodeId]);
    }
  }, [selectedNodeId]);

  // Push a new snapshot to history
  const pushHistory = useCallback(
    (newNodes: IWorkflowNode[], newConnections: WorkflowConnection[]) => {
      const currentIdx = historyIndexRef.current;
      const truncated = historyRef.current.slice(0, currentIdx + 1);

      const nextSnapshot = {
        nodes: JSON.parse(JSON.stringify(newNodes)),
        connections: JSON.parse(JSON.stringify(newConnections))
      };

      // Cap at 45 snapshots
      if (truncated.length >= 45) {
        truncated.shift();
      }

      truncated.push(nextSnapshot);
      historyRef.current = truncated;
      historyIndexRef.current = truncated.length - 1;

      setCanUndo(truncated.length > 1);
      setCanRedo(false);
    },
    []
  );

  // Undo handler (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const targetIdx = historyIndexRef.current - 1;
      historyIndexRef.current = targetIdx;
      const targetState = historyRef.current[targetIdx];
      if (targetState) {
        onUpdateNodes(JSON.parse(JSON.stringify(targetState.nodes)));
        onUpdateConnections(JSON.parse(JSON.stringify(targetState.connections)));
        setCanUndo(targetIdx > 0);
        setCanRedo(true);
        setLayoutNotification('↩ Undo: Reverted last change');
        setTimeout(() => setLayoutNotification(null), 2000);
      }
    }
  }, [onUpdateNodes, onUpdateConnections]);

  // Redo handler (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const targetIdx = historyIndexRef.current + 1;
      historyIndexRef.current = targetIdx;
      const targetState = historyRef.current[targetIdx];
      if (targetState) {
        onUpdateNodes(JSON.parse(JSON.stringify(targetState.nodes)));
        onUpdateConnections(JSON.parse(JSON.stringify(targetState.connections)));
        setCanUndo(true);
        setCanRedo(targetIdx < historyRef.current.length - 1);
        setLayoutNotification('↪ Redo: Restored change');
        setTimeout(() => setLayoutNotification(null), 2000);
      }
    }
  }, [onUpdateNodes, onUpdateConnections]);

  // Convert client mouse coordinates to canvas-space coordinates
  const clientToCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom
      };
    },
    [pan, zoom]
  );

  // Panning & Marquee handlers on Background
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && (e.target as HTMLElement).id !== 'canvas-grid-bg') {
      return;
    }
    const coords = clientToCanvasCoords(e.clientX, e.clientY);

    if (e.shiftKey) {
      // Shift+Drag creates rubber-band selection marquee
      setIsSelectingMarquee(true);
      setMarqueeBox({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y
      });
    } else {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeIds([]);
      onSelectNode(null);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const coords = clientToCanvasCoords(e.clientX, e.clientY);
      setMousePos(coords);

      if (isSelectingMarquee && marqueeBox) {
        setMarqueeBox((prev) => (prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null));
      } else if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        });
      } else if (draggingNodeId) {
        // Dragging a node (or group of selected nodes)
        const newX = coords.x - dragOffset.x;
        const newY = coords.y - dragOffset.y;
        const baseInit = dragInitialPositionsRef.current[draggingNodeId];

        if (baseInit) {
          const deltaX = Math.round(newX / 10) * 10 - baseInit.x;
          const deltaY = Math.round(newY / 10) * 10 - baseInit.y;

          onUpdateNodes(
            workflow.nodes.map((n) => {
              const initPos = dragInitialPositionsRef.current[n.id];
              if (initPos) {
                return {
                  ...n,
                  position: {
                    x: initPos.x + deltaX,
                    y: initPos.y + deltaY
                  }
                };
              }
              return n;
            })
          );
        } else {
          onUpdateNodes(
            workflow.nodes.map((n) =>
              n.id === draggingNodeId
                ? {
                    ...n,
                    position: {
                      x: Math.round(newX / 10) * 10,
                      y: Math.round(newY / 10) * 10
                    }
                  }
                : n
            )
          );
        }
      }
    },
    [
      isSelectingMarquee,
      marqueeBox,
      isPanning,
      startPan,
      draggingNodeId,
      dragOffset,
      clientToCanvasCoords,
      onUpdateNodes,
      workflow.nodes
    ]
  );

  const handleMouseUp = useCallback(() => {
    // If we were selecting marquee, compute intersecting nodes
    if (isSelectingMarquee && marqueeBox) {
      const minX = Math.min(marqueeBox.startX, marqueeBox.currentX);
      const maxX = Math.max(marqueeBox.startX, marqueeBox.currentX);
      const minY = Math.min(marqueeBox.startY, marqueeBox.currentY);
      const maxY = Math.max(marqueeBox.startY, marqueeBox.currentY);

      if (maxX - minX > 5 || maxY - minY > 5) {
        const intersecting = workflow.nodes.filter((n) => {
          const nodeLeft = n.position.x;
          const nodeRight = n.position.x + 96;
          const nodeTop = n.position.y;
          const nodeBottom = n.position.y + 84;
          return nodeLeft < maxX && nodeRight > minX && nodeTop < maxY && nodeBottom > minY;
        });
        const ids = intersecting.map((n) => n.id);
        setSelectedNodeIds(ids);
        if (ids.length === 1) {
          onSelectNode(ids[0]);
        } else {
          onSelectNode(null);
        }
      }
      setIsSelectingMarquee(false);
      setMarqueeBox(null);
    }

    // If node was dragged, push history snapshot if position changed
    if (draggingNodeId && dragStartSnapshotRef.current) {
      const moved = workflow.nodes.some((n) => {
        const old = dragStartSnapshotRef.current?.nodes.find((o) => o.id === n.id);
        return old && (old.position.x !== n.position.x || old.position.y !== n.position.y);
      });
      if (moved) {
        pushHistory(workflow.nodes, workflow.connections);
      }
      dragStartSnapshotRef.current = null;
    }

    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSource(null);
  }, [isSelectingMarquee, marqueeBox, draggingNodeId, workflow.nodes, workflow.connections, onSelectNode, pushHistory]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.min(Math.max(newZoom, 0.35), 2.2);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered on cursor
    const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom);

    setZoom(clampedZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Node Drag start (supports Shift+click multi-select toggle and group drag)
  const handleStartDragNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // Check if Shift is held -> toggle node in selection
    if (e.shiftKey) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
      return;
    }

    // Determine current selection set
    let activeSelection = selectedNodeIds;
    if (!selectedNodeIds.includes(nodeId)) {
      activeSelection = [nodeId];
      setSelectedNodeIds([nodeId]);
      onSelectNode(nodeId);
    }

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: coords.x - node.position.x,
      y: coords.y - node.position.y
    });

    // Capture initial positions of all dragged nodes for synchronous group drag
    const initPositions: Record<string, { x: number; y: number }> = {};
    workflow.nodes.forEach((n) => {
      if (activeSelection.includes(n.id) || n.id === nodeId) {
        initPositions[n.id] = { ...n.position };
      }
    });
    dragInitialPositionsRef.current = initPositions;

    // Snapshot state for undo tracking upon release
    dragStartSnapshotRef.current = {
      nodes: JSON.parse(JSON.stringify(workflow.nodes)),
      connections: JSON.parse(JSON.stringify(workflow.connections))
    };
  };

  // Connection Drag start
  const handleStartConnecting = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isOutput: boolean
  ) => {
    e.stopPropagation();
    setConnectingSource({ nodeId, portId, isOutput });
  };

  // Connection Complete / Drop on Port (n8n Connect Nodes Together)
  const handleEndConnecting = (
    targetNodeId: string,
    targetPortId: string,
    isTargetOutput: boolean
  ) => {
    if (!connectingSource) return;

    // Cannot connect a node to itself
    if (connectingSource.nodeId === targetNodeId) {
      setConnectingSource(null);
      return;
    }

    // Must connect Output to Input (or Input to Output)
    if (connectingSource.isOutput === isTargetOutput) {
      setConnectingSource(null);
      return;
    }

    const sourceNodeId = connectingSource.isOutput ? connectingSource.nodeId : targetNodeId;
    const sourcePortId = connectingSource.isOutput ? connectingSource.portId : targetPortId;
    const targetId = connectingSource.isOutput ? targetNodeId : connectingSource.nodeId;
    const targetPort = connectingSource.isOutput ? targetPortId : connectingSource.portId;

    // Check if connection already exists
    const exists = workflow.connections.some(
      (c) =>
        c.sourceNodeId === sourceNodeId &&
        c.sourcePortId === sourcePortId &&
        c.targetNodeId === targetId &&
        c.targetPortId === targetPort
    );

    if (!exists) {
      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sourceNodeId,
        sourcePortId,
        targetNodeId: targetId,
        targetPortId: targetPort
      };
      const updatedConns = [...workflow.connections, newConnection];
      onUpdateConnections(updatedConns);
      pushHistory(workflow.nodes, updatedConns);
    }

    setConnectingSource(null);
  };

  // Node delete
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
      const updatedConns = workflow.connections.filter(
        (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      );
      onUpdateNodes(updatedNodes);
      onUpdateConnections(updatedConns);
      setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
      if (selectedNodeId === nodeId) onSelectNode(null);
      pushHistory(updatedNodes, updatedConns);
    },
    [workflow.nodes, workflow.connections, selectedNodeId, onUpdateNodes, onUpdateConnections, onSelectNode, pushHistory]
  );

  // Node duplicate
  const handleDuplicateNode = useCallback(
    (node: IWorkflowNode) => {
      const newNode: IWorkflowNode = {
        ...node,
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `${node.name} (Copy)`,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40
        }
      };
      const updatedNodes = [...workflow.nodes, newNode];
      onUpdateNodes(updatedNodes);
      setSelectedNodeIds([newNode.id]);
      onSelectNode(newNode.id);
      pushHistory(updatedNodes, workflow.connections);
    },
    [workflow.nodes, workflow.connections, onUpdateNodes, onSelectNode, pushHistory]
  );

  // Connection delete
  const handleDeleteConnection = useCallback(
    (connId: string) => {
      const updatedConns = workflow.connections.filter((c) => c.id !== connId);
      onUpdateConnections(updatedConns);
      pushHistory(workflow.nodes, updatedConns);
    },
    [workflow.nodes, workflow.connections, onUpdateConnections, pushHistory]
  );

  // --- BATCH SELECTION ACTIONS (Horizontal & Vertical Align, Distribute, Duplicate, Delete) ---
  const handleAlignHorizontal = useCallback(() => {
    const selected = workflow.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selected.length < 2) return;
    const avgY = Math.round(selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length);
    const updated = workflow.nodes.map((n) =>
      selectedNodeIds.includes(n.id) ? { ...n, position: { ...n.position, y: avgY } } : n
    );
    onUpdateNodes(updated);
    pushHistory(updated, workflow.connections);
    setLayoutNotification(`↔ Aligned ${selected.length} nodes horizontally`);
    setTimeout(() => setLayoutNotification(null), 2000);
  }, [workflow.nodes, workflow.connections, selectedNodeIds, onUpdateNodes, pushHistory]);

  const handleAlignVertical = useCallback(() => {
    const selected = workflow.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selected.length < 2) return;
    const avgX = Math.round(selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length);
    const updated = workflow.nodes.map((n) =>
      selectedNodeIds.includes(n.id) ? { ...n, position: { ...n.position, x: avgX } } : n
    );
    onUpdateNodes(updated);
    pushHistory(updated, workflow.connections);
    setLayoutNotification(`↕ Aligned ${selected.length} nodes vertically`);
    setTimeout(() => setLayoutNotification(null), 2000);
  }, [workflow.nodes, workflow.connections, selectedNodeIds, onUpdateNodes, pushHistory]);

  const handleDistributeHorizontal = useCallback(() => {
    const selected = workflow.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selected.length < 3) return;
    const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
    const minX = sorted[0].position.x;
    const maxX = sorted[sorted.length - 1].position.x;
    const step = (maxX - minX) / (sorted.length - 1);

    const posMap: Record<string, number> = {};
    sorted.forEach((n, idx) => {
      posMap[n.id] = Math.round(minX + idx * step);
    });

    const updated = workflow.nodes.map((n) =>
      posMap[n.id] !== undefined ? { ...n, position: { ...n.position, x: posMap[n.id] } } : n
    );
    onUpdateNodes(updated);
    pushHistory(updated, workflow.connections);
    setLayoutNotification(`⋯ Evenly distributed ${selected.length} nodes`);
    setTimeout(() => setLayoutNotification(null), 2000);
  }, [workflow.nodes, workflow.connections, selectedNodeIds, onUpdateNodes, pushHistory]);

  const handleBatchDuplicate = useCallback(() => {
    const selected = workflow.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selected.length === 0) return;
    const duplicates: IWorkflowNode[] = selected.map((n) => ({
      ...n,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${n.name} (Copy)`,
      position: { x: n.position.x + 40, y: n.position.y + 40 }
    }));
    const updated = [...workflow.nodes, ...duplicates];
    onUpdateNodes(updated);
    setSelectedNodeIds(duplicates.map((d) => d.id));
    pushHistory(updated, workflow.connections);
    setLayoutNotification(`📋 Duplicated ${selected.length} nodes`);
    setTimeout(() => setLayoutNotification(null), 2000);
  }, [workflow.nodes, workflow.connections, selectedNodeIds, onUpdateNodes, pushHistory]);

  const handleBatchDelete = useCallback(() => {
    const idsToDelete = new Set(selectedNodeIds);
    if (idsToDelete.size === 0) return;
    const remainingNodes = workflow.nodes.filter((n) => !idsToDelete.has(n.id));
    const remainingConns = workflow.connections.filter(
      (c) => !idsToDelete.has(c.sourceNodeId) && !idsToDelete.has(c.targetNodeId)
    );
    onUpdateNodes(remainingNodes);
    onUpdateConnections(remainingConns);
    setSelectedNodeIds([]);
    onSelectNode(null);
    pushHistory(remainingNodes, remainingConns);
    setLayoutNotification(`🗑 Deleted ${idsToDelete.size} nodes`);
    setTimeout(() => setLayoutNotification(null), 2000);
  }, [workflow.nodes, workflow.connections, selectedNodeIds, onUpdateNodes, onUpdateConnections, onSelectNode, pushHistory]);

  // Calculate coordinates for ports (based on node width = 96, height = 84)
  const getPortCoordinates = useCallback(
    (nodeId: string, portId: string, isOutput: boolean): { x: number; y: number } => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      const nodeWidth = 96;
      const nodeHeight = 84;

      if (!isOutput) {
        // Input is on left
        return {
          x: node.position.x - 2,
          y: node.position.y + nodeHeight / 2
        };
      }

      // Output is on right
      return {
        x: node.position.x + nodeWidth + 2,
        y: node.position.y + nodeHeight / 2
      };
    },
    [workflow.nodes]
  );

  // Fit all nodes on screen with safe clearances around toolbar & minimap
  const handleFitToScreen = useCallback(() => {
    if (workflow.nodes.length === 0) {
      setPan({ x: 80, y: 80 });
      setZoom(1);
      return;
    }

    const minX = Math.min(...workflow.nodes.map((n) => n.position.x));
    const maxX = Math.max(...workflow.nodes.map((n) => n.position.x + 96));
    const minY = Math.min(...workflow.nodes.map((n) => n.position.y));
    const maxY = Math.max(...workflow.nodes.map((n) => n.position.y + 84));

    const width = Math.max(maxX - minX, 100);
    const height = Math.max(maxY - minY, 80);

    const containerW = containerRef.current?.clientWidth || 1000;
    const containerH = containerRef.current?.clientHeight || 700;

    const leftReserved = 60;
    const rightReserved = isMiniMapCollapsed ? 80 : 250;
    const topReserved = 80;
    const bottomReserved = 110;

    const availableW = Math.max(containerW - leftReserved - rightReserved, 200);
    const availableH = Math.max(containerH - topReserved - bottomReserved, 200);

    const fitZoom = Math.min(
      Math.max(Math.min(availableW / width, availableH / height), 0.4),
      1.2
    );

    const fitPanX = leftReserved + (availableW - width * fitZoom) / 2 - minX * fitZoom;
    const fitPanY = topReserved + (availableH - height * fitZoom) / 2 - minY * fitZoom;

    setZoom(Number(fitZoom.toFixed(2)));
    setPan({ x: Math.round(fitPanX), y: Math.round(fitPanY) });
  }, [workflow.nodes, isMiniMapCollapsed]);

  // Reset zoom to 100% and cleanly center nodes in the clear canvas area
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    if (workflow.nodes.length === 0) {
      setPan({ x: 80, y: 80 });
      return;
    }

    const minX = Math.min(...workflow.nodes.map((n) => n.position.x));
    const maxX = Math.max(...workflow.nodes.map((n) => n.position.x + 96));
    const minY = Math.min(...workflow.nodes.map((n) => n.position.y));
    const maxY = Math.max(...workflow.nodes.map((n) => n.position.y + 84));

    const width = maxX - minX;
    const height = maxY - minY;

    const containerW = containerRef.current?.clientWidth || 1000;
    const containerH = containerRef.current?.clientHeight || 700;

    const leftReserved = 60;
    const rightReserved = isMiniMapCollapsed ? 80 : 250;
    const topReserved = 80;
    const bottomReserved = 110;

    const availableW = Math.max(containerW - leftReserved - rightReserved, 200);
    const availableH = Math.max(containerH - topReserved - bottomReserved, 200);

    const fitPanX = leftReserved + (availableW - width) / 2 - minX;
    const fitPanY = topReserved + (availableH - height) / 2 - minY;

    setPan({ x: Math.round(fitPanX), y: Math.round(fitPanY) });
  }, [workflow.nodes, isMiniMapCollapsed]);

  // Auto-arrange nodes using layout algorithm
  const handleAutoArrange = useCallback(
    (customDirection?: 'LR' | 'TB', customSpacing?: 'compact' | 'normal' | 'spacious') => {
      if (workflow.nodes.length === 0) return;

      const dir = customDirection || layoutDirection;
      const spc = customSpacing || layoutSpacing;
      if (customDirection) setLayoutDirection(customDirection);
      if (customSpacing) setLayoutSpacing(customSpacing);
      setIsArrangeMenuOpen(false);

      setIsAutoArranging(true);

      const result = autoArrangeWorkflow(workflow.nodes, workflow.connections, {
        direction: dir,
        spacing: spc,
        nodeWidth: 96,
        nodeHeight: 84,
        startX: 140,
        startY: 140
      });

      onUpdateNodes(result.nodes);
      pushHistory(result.nodes, workflow.connections);

      const modeText = dir === 'LR' ? 'Horizontal pipeline' : 'Vertical flow';
      const spacingText = spc !== 'normal' ? ` (${spc})` : '';
      setLayoutNotification(`✨ Organized ${result.stats.nodeCount} nodes across ${result.stats.layerCount} layers • ${modeText}${spacingText}`);

      // Smoothly re-fit view to screen
      setTimeout(() => {
        handleFitToScreen();
      }, 60);

      setTimeout(() => {
        setIsAutoArranging(false);
      }, 550);
    },
    [workflow.nodes, workflow.connections, layoutDirection, layoutSpacing, onUpdateNodes, pushHistory]
  );

  // Auto-hide layout notification toast after 3.5s
  useEffect(() => {
    if (!layoutNotification) return;
    const timer = setTimeout(() => setLayoutNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [layoutNotification]);

  // Global Keyboard shortcuts: Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z), Auto-Arrange (Alt+A), Delete, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Auto-Arrange: Alt+A or Ctrl+Shift+L
      if (
        (e.altKey && (e.key === 'a' || e.key === 'A')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l'))
      ) {
        e.preventDefault();
        handleAutoArrange();
        return;
      }

      // Delete selected node(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleBatchDelete();
        } else if (selectedNodeId) {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
        return;
      }

      // Escape: Deselect all
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        onSelectNode(null);
        return;
      }

      // Keyboard shortcuts modal: '?' or 'Ctrl+/'
      if (
        (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === '/')
      ) {
        if (onOpenShortcuts) {
          e.preventDefault();
          onOpenShortcuts();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleAutoArrange,
    selectedNodeIds,
    selectedNodeId,
    handleBatchDelete,
    handleDeleteNode,
    onSelectNode,
    onOpenShortcuts
  ]);

  const firstNode = workflow.nodes[0];

  return (
    <div
      ref={containerRef}
      id="workflow-canvas-container"
      onMouseDown={handleMouseDownBackground}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden select-none transition-colors ${
        isDark ? 'bg-[#101013]' : 'bg-slate-100'
      } ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Background Dot Grid */}
      <div
        id="canvas-grid-bg"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle, #27272e 1.2px, transparent 1.2px)'
            : 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Floating Top Left Controls: Prominent Auto-Arrange Button with Layout Options & Feedback */}
      <div
        id="canvas-top-left-controls"
        className="absolute top-4 left-4 z-40 flex items-center gap-2 pointer-events-auto"
      >
        {/* Main Auto-Arrange Split Button */}
        <div className="relative inline-flex items-center rounded-xl shadow-2xl bg-[#18181c] border border-[#28282e] p-1">
          <button
            id="btn-canvas-auto-arrange"
            type="button"
            onClick={() => handleAutoArrange()}
            disabled={isAutoArranging || workflow.nodes.length === 0}
            title="Auto-arrange nodes neatly into hierarchical DAG layout (Alt+A)"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoArranging
                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md active:scale-95'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Wand2 className={`w-3.5 h-3.5 ${isAutoArranging ? 'animate-spin' : ''}`} />
            <span>Auto-Arrange</span>
            <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden sm:inline">Alt+A</span>
          </button>

          <button
            id="btn-canvas-auto-arrange-menu"
            type="button"
            onClick={() => setIsArrangeMenuOpen(!isArrangeMenuOpen)}
            title="Auto-Arrange Layout Options (Direction & Spacing)"
            className={`p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#26262c] rounded-lg transition-colors ${
              isArrangeMenuOpen ? 'bg-[#26262c] text-white' : ''
            }`}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isArrangeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Layout Configuration Dropdown */}
          {isArrangeMenuOpen && (
            <div
              id="menu-auto-arrange-options"
              className="absolute top-full left-0 mt-2 w-64 bg-[#18181c] border border-[#2e2e36] rounded-xl shadow-2xl p-2 z-50 text-xs text-[#d4d4d8] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="text-[10px] font-bold text-[#8e8e93] px-2 py-1 uppercase tracking-wider">
                Flow Direction
              </div>
              <button
                id="btn-layout-dir-lr"
                type="button"
                onClick={() => handleAutoArrange('LR')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#26262c] transition-colors cursor-pointer ${
                  layoutDirection === 'LR' ? 'text-amber-400 font-semibold bg-amber-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                  <span>Horizontal (Left to Right)</span>
                </div>
                {layoutDirection === 'LR' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <button
                id="btn-layout-dir-tb"
                type="button"
                onClick={() => handleAutoArrange('TB')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#26262c] transition-colors cursor-pointer ${
                  layoutDirection === 'TB' ? 'text-amber-400 font-semibold bg-amber-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Vertical (Top to Bottom)</span>
                </div>
                {layoutDirection === 'TB' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <div className="my-1.5 border-t border-[#28282e]" />

              <div className="text-[10px] font-bold text-[#8e8e93] px-2 py-1 uppercase tracking-wider">
                Pipeline Spacing
              </div>
              <button
                id="btn-layout-spacing-compact"
                type="button"
                onClick={() => handleAutoArrange(undefined, 'compact')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#26262c] transition-colors cursor-pointer ${
                  layoutSpacing === 'compact' ? 'text-amber-400 font-semibold bg-amber-500/10' : ''
                }`}
              >
                <span>Compact (Dense pipelines)</span>
                {layoutSpacing === 'compact' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <button
                id="btn-layout-spacing-normal"
                type="button"
                onClick={() => handleAutoArrange(undefined, 'normal')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#26262c] transition-colors cursor-pointer ${
                  layoutSpacing === 'normal' ? 'text-amber-400 font-semibold bg-amber-500/10' : ''
                }`}
              >
                <span>Standard (Balanced layout)</span>
                {layoutSpacing === 'normal' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <button
                id="btn-layout-spacing-spacious"
                type="button"
                onClick={() => handleAutoArrange(undefined, 'spacious')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#26262c] transition-colors cursor-pointer ${
                  layoutSpacing === 'spacious' ? 'text-amber-400 font-semibold bg-amber-500/10' : ''
                }`}
              >
                <span>Spacious (Wide clearances)</span>
                {layoutSpacing === 'spacious' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Fit to screen quick button */}
        <button
          id="btn-canvas-quick-fit"
          type="button"
          onClick={handleFitToScreen}
          title="Fit entire workflow on screen"
          className="p-2 bg-[#18181c] hover:bg-[#26262c] border border-[#28282e] text-[#a1a1aa] hover:text-white rounded-xl shadow-lg transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Canvas Header Snapshot Button */}
        <button
          id="btn-canvas-header-snapshot"
          type="button"
          onClick={handleTakeSnapshot}
          disabled={isTakingSnapshot}
          title="Take Snapshot (Generate downloadable PNG image of workflow)"
          className="px-2.5 py-1.5 bg-[#18181c] hover:bg-[#26262c] border border-[#28282e] text-[#a1a1aa] hover:text-white rounded-xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          {isTakingSnapshot ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-[#EA580C]" />
          )}
          <span>Take Snapshot</span>
        </button>

        {/* Transient Notification Toast */}
        {layoutNotification && (
          <div
            id="canvas-layout-notification"
            className="px-3 py-1.5 bg-[#18181c]/95 border border-amber-500/40 text-amber-300 text-xs font-medium rounded-xl shadow-xl backdrop-blur-sm flex items-center gap-2 animate-in fade-in duration-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span className="truncate max-w-xs">{layoutNotification}</span>
          </div>
        )}
      </div>

      {/* Main Canvas Workspace Transformed by Pan & Zoom */}
      <div
        id="canvas-workspace"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-[6000px] h-[6000px] pointer-events-none overflow-visible">
          <defs>
            <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Render All Existing Connections */}
          {workflow.connections.map((conn) => {
            const start = getPortCoordinates(conn.sourceNodeId, conn.sourcePortId, true);
            const end = getPortCoordinates(conn.targetNodeId, conn.targetPortId, false);

            if (!start.x && !start.y && !end.x && !end.y) return null;

            const dx = Math.max(Math.abs(end.x - start.x) * 0.45, 30);
            const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            const isHovered = hoveredConnId === conn.id;
            const isRunningActive = isExecuting;

            return (
              <g
                key={conn.id}
                id={`connection-${conn.id}`}
                className="pointer-events-auto"
                onMouseEnter={() => setHoveredConnId(conn.id)}
                onMouseLeave={() => setHoveredConnId(null)}
              >
                {/* Thick invisible hit-box for easier clicking/hovering */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  className="cursor-pointer"
                />

                {/* Visible connection path */}
                <path
                  d={path}
                  fill="none"
                  stroke={isHovered ? '#F43F5E' : isRunningActive ? '#EA580C' : '#4b4b52'}
                  strokeWidth={isHovered || isRunningActive ? 3 : 2}
                  strokeDasharray={isRunningActive ? '6 4' : undefined}
                  className={isRunningActive ? 'animate-pulse' : ''}
                />

                {/* Inline Label & Plus Button in the Wire */}
                {conn.label && (
                  <g transform={`translate(${midX}, ${midY})`} className="cursor-pointer">
                    <rect
                      x="-26"
                      y="-11"
                      width="52"
                      height="22"
                      rx="11"
                      fill="#1c1c20"
                      stroke="#383840"
                      strokeWidth="1.5"
                    />
                    <text
                      x="-7"
                      y="4"
                      fill="#f4f4f5"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      className="font-mono select-none"
                    >
                      {conn.label}
                    </text>
                    <circle cx="14" cy="0" r="5.5" fill="#2c2c34" stroke="#484852" strokeWidth="1" />
                    <line x1="11.5" y1="0" x2="16.5" y2="0" stroke="#d4d4d8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="14" y1="-2.5" x2="14" y2="2.5" stroke="#d4d4d8" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}

                {/* Delete button on hover if not label */}
                {isHovered && !conn.label && (
                  <g
                    transform={`translate(${midX - 10}, ${midY - 10})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConnection(conn.id);
                    }}
                    className="cursor-pointer hover:scale-125 transition-transform"
                  >
                    <circle cx="10" cy="10" r="10" fill="#E11D48" />
                    <line x1="7" y1="7" x2="13" y2="13" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="13" y1="7" x2="7" y2="13" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}

          {/* Active In-Progress Drag Connection */}
          {connectingSource && (
            (() => {
              const start = getPortCoordinates(
                connectingSource.nodeId,
                connectingSource.portId,
                connectingSource.isOutput
              );
              const end = mousePos;
              const dx = Math.max(Math.abs(end.x - start.x) * 0.45, 30);
              const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

              return (
                <path
                  d={path}
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                />
              );
            })()
          )}
        </svg>

        {/* Nodes Container */}
        <div className="absolute inset-0 pointer-events-auto">
          {workflow.nodes.map((node) => {
            const def =
              nodeDefinitions[node.type] ||
              nodeDefinitions[node.pluginId || ''] || {
                type: node.type,
                name: node.name,
                category: 'action',
                description: '',
                icon: 'HelpCircle',
                color: '#6366F1',
                inputs: [{ id: 'main', label: 'In' }],
                outputs: [{ id: 'main', label: 'Out' }],
                parametersSchema: [],
                defaultParameters: {}
              };

            return (
              <WorkflowNode
                key={node.id}
                node={node}
                definition={def}
                isSelected={selectedNodeIds.includes(node.id) || selectedNodeId === node.id}
                executionState={executionResults[node.id]}
                onSelect={(id) => {
                  setSelectedNodeIds([id]);
                  onSelectNode(id);
                }}
                onStartDrag={handleStartDragNode}
                onStartConnecting={handleStartConnecting}
                onEndConnecting={handleEndConnecting}
                onQuickAddNextNode={(sourceNodeId, portId) => {
                  const srcNode = workflow.nodes.find((n) => n.id === sourceNodeId);
                  const targetPos = srcNode
                    ? { x: srcNode.position.x + 200, y: srcNode.position.y }
                    : undefined;
                  if (onQuickConnectNode) {
                    onQuickConnectNode(sourceNodeId, portId, targetPos);
                  } else {
                    onOpenPalette();
                  }
                }}
                onDelete={handleDeleteNode}
                onDuplicate={handleDuplicateNode}
                onOpenDrawer={onOpenDrawer}
                scale={zoom}
                isAnimatingLayout={isAutoArranging}
              />
            );
          })}

          {/* Rubber-band Multi-Selection Marquee Box */}
          {marqueeBox && (
            <div
              style={{
                left: Math.min(marqueeBox.startX, marqueeBox.currentX),
                top: Math.min(marqueeBox.startY, marqueeBox.currentY),
                width: Math.abs(marqueeBox.currentX - marqueeBox.startX),
                height: Math.abs(marqueeBox.currentY - marqueeBox.startY)
              }}
              className="absolute border-2 border-indigo-400/80 bg-indigo-500/20 rounded-md pointer-events-none z-30 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            />
          )}


        </div>
      </div>

      {/* Context Menu for Multi-Selected Nodes */}
      {selectedNodeIds.length > 1 && (
        <SelectionContextMenu
          selectedNodeIds={selectedNodeIds}
          nodes={workflow.nodes}
          onAlignHorizontal={handleAlignHorizontal}
          onAlignVertical={handleAlignVertical}
          onDistributeHorizontal={handleDistributeHorizontal}
          onBatchDuplicate={handleBatchDuplicate}
          onBatchDelete={handleBatchDelete}
          onClearSelection={() => {
            setSelectedNodeIds([]);
            onSelectNode(null);
          }}
        />
      )}

      {/* Floating Top Right Vertical Toolbar */}
      <div
        id="canvas-right-toolbar"
        className="absolute top-4 right-4 z-40 bg-[#18181c] border border-[#28282e] rounded-xl shadow-xl p-1 flex flex-col gap-1 text-[#a1a1aa]"
      >
        <button
          id="btn-toolbar-add-node"
          type="button"
          title="Add node"
          onClick={onOpenPalette}
          className="p-2 hover:bg-[#26262c] rounded-lg hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          id="btn-toolbar-search-node"
          type="button"
          title="Search nodes"
          onClick={onOpenPalette}
          className="p-2 hover:bg-[#26262c] rounded-lg hover:text-white transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          id="btn-toolbar-note"
          type="button"
          title="Sticky note"
          onClick={() => {}}
          className="p-2 hover:bg-[#26262c] rounded-lg hover:text-white transition-colors"
        >
          <StickyNote className="w-4 h-4" />
        </button>
        <button
          id="btn-toolbar-layout"
          type="button"
          title="Auto-arrange layout (Alt+A)"
          onClick={() => handleAutoArrange()}
          className="p-2 hover:bg-[#26262c] hover:text-amber-400 rounded-lg transition-colors"
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </div>

      {/* Unified Non-Overlapping Bottom Controls Bar */}
      <div
        id="canvas-bottom-controls-bar"
        className="absolute bottom-9 left-6 right-6 z-40 flex items-end justify-between pointer-events-none gap-4"
      >
        {/* Left Toolbar: Viewport, Zoom %, Undo/Redo, Snapshot, Shortcuts */}
        <div
          id="canvas-bottom-left-toolbar"
          className={`pointer-events-auto rounded-xl shadow-xl p-1 flex items-center gap-1 border transition-colors shrink-0 ${
            isDark
              ? 'bg-[#18181c]/95 border-[#28282e] text-[#a1a1aa] backdrop-blur-md'
              : 'bg-white/95 border-slate-200 text-slate-600 backdrop-blur-md'
          }`}
        >
          <button
            id="btn-fit-screen"
            type="button"
            title="Fit to screen (Shift+1)"
            onClick={handleFitToScreen}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            id="btn-zoom-out"
            type="button"
            title="Zoom out"
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.35))}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {/* Zoom percentage button - Click to reset to 100% and center */}
          <button
            id="btn-zoom-reset"
            type="button"
            title="Reset to 100% Zoom & Center"
            onClick={handleResetZoom}
            className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none ${
              Math.abs(zoom - 1) < 0.05
                ? 'text-[#EA580C] bg-[#EA580C]/10 font-bold'
                : isDark
                ? 'hover:bg-[#26262c] text-[#a1a1aa] hover:text-white'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="btn-zoom-in"
            type="button"
            title="Zoom in"
            onClick={() => setZoom((z) => Math.min(z * 1.2, 2.2))}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className={`w-px h-4 my-auto ${isDark ? 'bg-[#28282e]' : 'bg-slate-200'}`} />
          <button
            id="btn-canvas-undo"
            type="button"
            title="Undo last change (Ctrl+Z)"
            disabled={!canUndo}
            onClick={handleUndo}
            className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] hover:text-white text-[#a1a1aa]' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="btn-canvas-redo"
            type="button"
            title="Redo change (Ctrl+Y)"
            disabled={!canRedo}
            onClick={handleRedo}
            className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] hover:text-white text-[#a1a1aa]' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className={`w-px h-4 my-auto ${isDark ? 'bg-[#28282e]' : 'bg-slate-200'}`} />
          <button
            id="btn-take-snapshot"
            type="button"
            title="Take Snapshot (Save workflow canvas as PNG)"
            disabled={isTakingSnapshot}
            onClick={handleTakeSnapshot}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] text-orange-400' : 'hover:bg-slate-100 text-orange-600'
            }`}
          >
            {isTakingSnapshot ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#EA580C]" />
            ) : (
              <Camera className="w-4 h-4 text-[#EA580C]" />
            )}
          </button>
          {onOpenShortcuts && (
            <>
              <div className={`w-px h-4 my-auto ${isDark ? 'bg-[#28282e]' : 'bg-slate-200'}`} />
              <button
                id="btn-canvas-shortcuts"
                type="button"
                title="Keyboard Shortcuts Cheatsheet (?)"
                onClick={onOpenShortcuts}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#26262c] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Center: Primary Execute Workflow Button */}
        {onExecuteWorkflow && (
          <div className="pointer-events-auto flex items-center justify-center shrink-0">
            <button
              id="btn-floating-execute-workflow"
              type="button"
              onClick={onExecuteWorkflow}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#d94806] active:scale-95 text-white font-semibold rounded-xl shadow-xl shadow-[#EA580C]/30 flex items-center gap-2 text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FlaskConical className="w-4 h-4" />
              )}
              <span>{isExecuting ? 'Executing...' : 'Execute workflow'}</span>
            </button>
          </div>
        )}

        {/* Right: Legend and MiniMap */}
        <div className="pointer-events-auto flex items-end gap-3 shrink-0">
          {/* Category Indicator Legend Pill Strip */}
          <div
            id="canvas-category-legend"
            className={`hidden 2xl:flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] backdrop-blur-md shadow-lg border transition-colors ${
              isDark
                ? 'bg-[#141418]/90 border-[#26262e] text-[#a1a1aa]'
                : 'bg-white/95 border-slate-200 text-slate-700'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>Categories:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
              <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Trigger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.7)]" />
              <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Action</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
              <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Transform</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
              <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Logic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
              <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Security</span>
            </div>
          </div>

          {/* MiniMap in Bottom-Right Corner */}
          <MiniMap
            nodes={workflow.nodes}
            connections={workflow.connections}
            nodeDefinitions={nodeDefinitions}
            pan={pan}
            zoom={zoom}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            onPanChange={setPan}
            onFitToScreen={handleFitToScreen}
            isCollapsed={isMiniMapCollapsed}
            onToggleCollapse={() => setIsMiniMapCollapsed((prev) => !prev)}
          />
        </div>
      </div>

      {/* Bottom Docked Logs Bar (Screenshot 3) */}
      <div
        id="canvas-logs-dock"
        className="absolute bottom-0 left-0 right-0 h-7 bg-[#131316] border-t border-[#222226] px-4 flex items-center justify-between text-xs text-[#a1a1aa] z-30 select-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#f4f4f5]">Logs</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            title="Expand logs"
            className="hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Toggle logs panel"
            className="hover:text-white transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
