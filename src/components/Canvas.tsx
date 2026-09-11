import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow,
  WorkflowNode as IWorkflowNode,
  WorkflowConnection,
  NodeDefinition,
  SingleNodeExecution
} from '../types';
import { WorkflowNode } from './WorkflowNode';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  RotateCcw,
  LayoutGrid
} from 'lucide-react';

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
  onOpenPalette
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 80 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Hovered connection wire
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  // Pan handlers
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click on background
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  // Node Drag start
  const handleStartDragNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);

    // Calculate mouse position relative to node top-left in canvas coordinates
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;
    setDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y
    });
  };

  // Connecting start
  const handleStartConnecting = (
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isOutput: boolean
  ) => {
    e.stopPropagation();
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;
    setConnectingSource({ nodeId, portId, isOutput });
    setMousePos({ x: canvasX, y: canvasY });
  };

  // Mouse Move listener on window for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        });
      } else if (draggingNodeId) {
        const canvasX = (e.clientX - pan.x) / zoom;
        const canvasY = (e.clientY - pan.y) / zoom;

        // Snap to 10px grid
        const newX = Math.round((canvasX - dragOffset.x) / 10) * 10;
        const newY = Math.round((canvasY - dragOffset.y) / 10) * 10;

        onUpdateNodes(
          workflow.nodes.map(n =>
            n.id === draggingNodeId
              ? { ...n, position: { x: newX, y: newY } }
              : n
          )
        );
      } else if (connectingSource) {
        const canvasX = (e.clientX - pan.x) / zoom;
        const canvasY = (e.clientY - pan.y) / zoom;
        setMousePos({ x: canvasX, y: canvasY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) setIsPanning(false);
      if (draggingNodeId) setDraggingNodeId(null);

      if (connectingSource) {
        // Detect if released over a target port
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const portElem = target?.closest('[id^="port-"]');
        if (portElem) {
          const portIdFull = portElem.id;
          // Format: port-in-nodeId-portId or port-out-nodeId-portId
          const parts = portIdFull.split('-');
          if (parts.length >= 4) {
            const isTargetIn = parts[1] === 'in';
            const targetNodeId = parts[2];
            const targetPortId = parts.slice(3).join('-');

            // Only connect output -> input or input -> output between distinct nodes
            if (
              connectingSource.nodeId !== targetNodeId &&
              connectingSource.isOutput !== isTargetIn
            ) {
              const sourceNodeId = connectingSource.isOutput
                ? connectingSource.nodeId
                : targetNodeId;
              const sourcePortId = connectingSource.isOutput
                ? connectingSource.portId
                : targetPortId;
              const destNodeId = connectingSource.isOutput
                ? targetNodeId
                : connectingSource.nodeId;
              const destPortId = connectingSource.isOutput
                ? targetPortId
                : connectingSource.portId;

              // Check if connection already exists
              const exists = workflow.connections.some(
                c =>
                  c.sourceNodeId === sourceNodeId &&
                  c.sourcePortId === sourcePortId &&
                  c.targetNodeId === destNodeId &&
                  c.targetPortId === destPortId
              );

              if (!exists) {
                const newConn: WorkflowConnection = {
                  id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  sourceNodeId,
                  sourcePortId,
                  targetNodeId: destNodeId,
                  targetPortId: destPortId
                };
                onUpdateConnections([...workflow.connections, newConn]);
              }
            }
          }
        }
        setConnectingSource(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPanning,
    startPan,
    draggingNodeId,
    dragOffset,
    connectingSource,
    pan,
    zoom,
    workflow,
    onUpdateNodes,
    onUpdateConnections
  ]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.2);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Node operations
  const handleDeleteNode = (nodeId: string) => {
    onUpdateNodes(workflow.nodes.filter(n => n.id !== nodeId));
    onUpdateConnections(
      workflow.connections.filter(
        c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      )
    );
    if (selectedNodeId === nodeId) onSelectNode(null);
  };

  const handleDuplicateNode = (node: IWorkflowNode) => {
    const newNode: IWorkflowNode = {
      ...node,
      id: `node-${Date.now()}`,
      name: `${node.name} (Copy)`,
      position: { x: node.position.x + 40, y: node.position.y + 40 }
    };
    onUpdateNodes([...workflow.nodes, newNode]);
    onSelectNode(newNode.id);
  };

  const handleDeleteConnection = (connId: string) => {
    onUpdateConnections(workflow.connections.filter(c => c.id !== connId));
  };

  // Calculate coordinates for ports
  const getPortCoordinates = useCallback(
    (nodeId: string, portId: string, isOutput: boolean): { x: number; y: number } => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      const def = nodeDefinitions[node.type] || nodeDefinitions[node.pluginId || ''];
      const nodeWidth = 250;
      const nodeHeight = 85;

      if (!isOutput) {
        // Input is on left
        return {
          x: node.position.x,
          y: node.position.y + nodeHeight / 2
        };
      }

      // Output is on right
      const outputs = def?.outputs || [{ id: 'main', label: 'Output' }];
      const idx = outputs.findIndex(p => p.id === portId);
      const count = outputs.length;

      let yOffset = nodeHeight / 2;
      if (count > 1 && idx >= 0) {
        const step = (nodeHeight * 0.6) / (count - 1);
        yOffset = nodeHeight * 0.2 + idx * step;
      }

      return {
        x: node.position.x + nodeWidth,
        y: node.position.y + yOffset
      };
    },
    [workflow.nodes, nodeDefinitions]
  );

  // Fit all nodes on screen
  const handleFitToScreen = () => {
    if (workflow.nodes.length === 0) {
      setPan({ x: 80, y: 80 });
      setZoom(1);
      return;
    }

    const minX = Math.min(...workflow.nodes.map(n => n.position.x));
    const maxX = Math.max(...workflow.nodes.map(n => n.position.x + 250));
    const minY = Math.min(...workflow.nodes.map(n => n.position.y));
    const maxY = Math.max(...workflow.nodes.map(n => n.position.y + 120));

    const width = maxX - minX;
    const height = maxY - minY;

    const containerW = containerRef.current?.clientWidth || 1000;
    const containerH = containerRef.current?.clientHeight || 700;

    const fitZoom = Math.min(
      Math.max(Math.min((containerW - 160) / width, (containerH - 160) / height), 0.4),
      1.2
    );

    const fitPanX = (containerW - width * fitZoom) / 2 - minX * fitZoom;
    const fitPanY = (containerH - height * fitZoom) / 2 - minY * fitZoom;

    setZoom(fitZoom);
    setPan({ x: fitPanX, y: fitPanY });
  };

  // Auto-arrange nodes in clean workflow layout
  const handleAutoArrange = () => {
    if (workflow.nodes.length === 0) return;

    // Simple left-to-right layering
    const arrangedNodes = [...workflow.nodes];
    const incomingCount: Record<string, number> = {};
    arrangedNodes.forEach(n => (incomingCount[n.id] = 0));
    workflow.connections.forEach(c => {
      incomingCount[c.targetNodeId] = (incomingCount[c.targetNodeId] || 0) + 1;
    });

    const layers: string[][] = [];
    let currentLayer = arrangedNodes
      .filter(n => incomingCount[n.id] === 0)
      .map(n => n.id);

    if (currentLayer.length === 0 && arrangedNodes.length > 0) {
      currentLayer = [arrangedNodes[0].id];
    }

    const placed = new Set<string>();
    while (currentLayer.length > 0) {
      layers.push(currentLayer);
      currentLayer.forEach(id => placed.add(id));

      const nextLayerSet = new Set<string>();
      currentLayer.forEach(srcId => {
        workflow.connections
          .filter(c => c.sourceNodeId === srcId)
          .forEach(c => {
            if (!placed.has(c.targetNodeId)) {
              nextLayerSet.add(c.targetNodeId);
            }
          });
      });
      currentLayer = Array.from(nextLayerSet);
    }

    // Add remaining unattached nodes
    const unplaced = arrangedNodes.filter(n => !placed.has(n.id)).map(n => n.id);
    if (unplaced.length > 0) {
      layers.push(unplaced);
    }

    const updated = arrangedNodes.map(n => {
      let layerIdx = layers.findIndex(l => l.includes(n.id));
      if (layerIdx === -1) layerIdx = 0;
      const indexInLayer = layers[layerIdx].indexOf(n.id);

      return {
        ...n,
        position: {
          x: 100 + layerIdx * 340,
          y: 120 + indexInLayer * 160
        }
      };
    });

    onUpdateNodes(updated);
    setTimeout(handleFitToScreen, 50);
  };

  return (
    <div
      ref={containerRef}
      id="workflow-canvas-container"
      onMouseDown={handleMouseDownBackground}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden bg-neutral-950 select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: `radial-gradient(#262626 1.5px, transparent 1.5px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Canvas Transform Layer */}
      <div
        id="canvas-transform-layer"
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Connection Lines */}
        <svg
          className="absolute overflow-visible w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <defs>
            <linearGradient id="conn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366F1" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Existing Connections */}
          {workflow.connections.map((conn) => {
            const start = getPortCoordinates(conn.sourceNodeId, conn.sourcePortId, true);
            const end = getPortCoordinates(conn.targetNodeId, conn.targetPortId, false);

            const dx = Math.max(Math.abs(end.x - start.x) * 0.5, 40);
            const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

            const isHovered = hoveredConnId === conn.id;
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            const isRunningActive = isExecuting && (
              executionResults[conn.sourceNodeId]?.status === 'running' ||
              executionResults[conn.targetNodeId]?.status === 'running'
            );

            return (
              <g
                key={conn.id}
                className="pointer-events-auto cursor-pointer group"
                onMouseEnter={() => setHoveredConnId(conn.id)}
                onMouseLeave={() => setHoveredConnId(null)}
              >
                {/* Invisible wide hit-box line */}
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
                  stroke={isHovered ? '#F43F5E' : isRunningActive ? '#A855F7' : '#525252'}
                  strokeWidth={isHovered || isRunningActive ? 3.5 : 2.5}
                  strokeDasharray={isRunningActive ? '8 4' : undefined}
                  className={isRunningActive ? 'animate-pulse' : ''}
                  filter={isRunningActive ? 'url(#wire-glow)' : undefined}
                />

                {/* Delete button on hover */}
                {isHovered && (
                  <g
                    transform={`translate(${midX - 12}, ${midY - 12})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConnection(conn.id);
                    }}
                    className="cursor-pointer hover:scale-125 transition-transform"
                  >
                    <circle cx="12" cy="12" r="12" fill="#E11D48" />
                    <line x1="8" y1="8" x2="16" y2="16" stroke="#ffffff" strokeWidth="2" />
                    <line x1="16" y1="8" x2="8" y2="16" stroke="#ffffff" strokeWidth="2" />
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
              const dx = Math.max(Math.abs(end.x - start.x) * 0.5, 40);
              const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

              return (
                <path
                  d={path}
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth={3}
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
                isSelected={selectedNodeId === node.id}
                executionState={executionResults[node.id]}
                onSelect={onSelectNode}
                onStartDrag={handleStartDragNode}
                onStartConnecting={handleStartConnecting}
                onDelete={handleDeleteNode}
                onDuplicate={handleDuplicateNode}
                onOpenDrawer={onOpenDrawer}
                scale={zoom}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Controls Toolbar */}
      <div
        id="canvas-toolbar"
        className="absolute bottom-6 left-6 z-40 flex items-center gap-1.5 p-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-xl text-neutral-300"
      >
        <button
          id="btn-zoom-in"
          type="button"
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.2))}
          className="p-2 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          type="button"
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.35))}
          className="p-2 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-fit-screen"
          type="button"
          title="Fit to Screen"
          onClick={handleFitToScreen}
          className="p-2 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-view"
          type="button"
          title="Reset Zoom & Pan"
          onClick={() => {
            setZoom(1);
            setPan({ x: 80, y: 80 });
          }}
          className="p-2 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-neutral-800 mx-1" />
        <button
          id="btn-auto-arrange"
          type="button"
          title="Auto-Arrange Nodes"
          onClick={handleAutoArrange}
          className="p-2 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline font-mono">Clean</span>
        </button>
        <div className="w-px h-5 bg-neutral-800 mx-1" />
        <button
          id="btn-canvas-add-node"
          type="button"
          title="Add Node"
          onClick={onOpenPalette}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm flex items-center gap-1.5 text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Node</span>
        </button>
      </div>

      {/* Minimap (Bottom Right) */}
      <div
        id="canvas-minimap"
        className="absolute bottom-6 right-6 z-40 hidden md:block w-44 h-28 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden p-2 shadow-xl"
      >
        <div className="relative w-full h-full bg-neutral-950/80 rounded border border-neutral-800/60 overflow-hidden">
          {workflow.nodes.map((n) => {
            const mmScale = 0.05;
            const def = nodeDefinitions[n.type];
            return (
              <div
                key={n.id}
                style={{
                  left: `${(n.position.x * mmScale) % 150 + 10}px`,
                  top: `${(n.position.y * mmScale) % 90 + 10}px`,
                  backgroundColor: def?.color || '#818CF8'
                }}
                className="absolute w-3 h-1.5 rounded-sm opacity-80"
              />
            );
          })}
          <div className="absolute bottom-1 right-1 text-[9px] font-mono text-neutral-500 uppercase">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};
