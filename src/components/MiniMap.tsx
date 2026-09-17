import React, { useRef, useState, useCallback, useEffect } from 'react';
import { WorkflowNode, WorkflowConnection, NodeDefinition } from '../types';
import { ChevronDown, ChevronUp, Maximize2, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MiniMapProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  nodeDefinitions: Record<string, NodeDefinition>;
  pan: { x: number; y: number };
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onPanChange: (newPan: { x: number; y: number }) => void;
  onFitToScreen: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  trigger: '#10B981', // emerald
  action: '#0EA5E9',  // sky blue
  transform: '#F59E0B',// amber
  logic: '#A855F7',   // purple
  security: '#F43F5E', // rose
  plugin: '#14B8A6'   // teal
};

export const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  connections,
  nodeDefinitions,
  pan,
  zoom,
  containerWidth,
  containerHeight,
  onPanChange,
  onFitToScreen,
  isCollapsed: externalCollapsed,
  onToggleCollapse
}) => {
  const { isDark } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const mapWidth = 200;
  const mapHeight = 125;
  const padding = 120; // world coordinate padding around nodes

  // 1. Calculate world bounding box enclosing all nodes
  const bounds = React.useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 1000, height: 700 };
    }

    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);

    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding;
    const maxX = Math.max(...xs) + 96 + padding;
    const maxY = Math.max(...ys) + 84 + padding;

    const width = Math.max(maxX - minX, 600);
    const height = Math.max(maxY - minY, 400);

    return { minX, minY, width, height };
  }, [nodes]);

  // Scale factors from world coordinates to minimap coordinates
  const scaleX = mapWidth / bounds.width;
  const scaleY = mapHeight / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (mapWidth - bounds.width * scale) / 2;
  const offsetY = (mapHeight - bounds.height * scale) / 2;

  // Convert World Coord -> Minimap Coord
  const worldToMap = useCallback(
    (wx: number, wy: number) => ({
      x: offsetX + (wx - bounds.minX) * scale,
      y: offsetY + (wy - bounds.minY) * scale
    }),
    [bounds, scale, offsetX, offsetY]
  );

  // Convert Minimap Coord -> World Coord
  const mapToWorld = useCallback(
    (mx: number, my: number) => ({
      x: bounds.minX + (mx - offsetX) / scale,
      y: bounds.minY + (my - offsetY) / scale
    }),
    [bounds, scale, offsetX, offsetY]
  );

  // Viewport in world coordinates:
  // Visible area top-left is (-pan.x / zoom), (-pan.y / zoom)
  // Visible width is (containerWidth / zoom), visible height is (containerHeight / zoom)
  const viewportWorld = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width: containerWidth / zoom,
    height: containerHeight / zoom
  };

  const viewportMapTopLeft = worldToMap(viewportWorld.x, viewportWorld.y);
  const viewportMapWidth = Math.max(viewportWorld.width * scale, 12);
  const viewportMapHeight = Math.max(viewportWorld.height * scale, 10);

  // Center pan on specified world point
  const centerWorldPoint = useCallback(
    (worldX: number, worldY: number) => {
      const newPanX = containerWidth / 2 - worldX * zoom;
      const newPanY = containerHeight / 2 - worldY * zoom;
      onPanChange({ x: newPanX, y: newPanY });
    },
    [containerWidth, containerHeight, zoom, onPanChange]
  );

  // Click on minimap to jump camera
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mapClickX = e.clientX - rect.left;
    const mapClickY = e.clientY - rect.top;

    const targetWorld = mapToWorld(mapClickX, mapClickY);
    centerWorldPoint(targetWorld.x, targetWorld.y);
  };

  // Dragging the viewport inside minimap
  const handleViewportMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingViewport(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingViewport || !mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const mapX = e.clientX - rect.left;
      const mapY = e.clientY - rect.top;

      const targetWorld = mapToWorld(mapX, mapY);
      centerWorldPoint(targetWorld.x, targetWorld.y);
    },
    [isDraggingViewport, mapToWorld, centerWorldPoint]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingViewport(false);
  }, []);

  useEffect(() => {
    if (isDraggingViewport) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingViewport, handleMouseMove, handleMouseUp]);

  return (
    <div
      id="canvas-minimap"
      className={`relative z-40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col select-none transition-all duration-200 pointer-events-auto border ${
        isDark
          ? 'bg-[#18181c]/95 border-[#28282e] text-[#a1a1aa]'
          : 'bg-white/95 border-slate-200 text-slate-700'
      }`}
      style={{ width: mapWidth + 2 }}
    >
      {/* MiniMap Header */}
      <div
        className={`px-2.5 py-1.5 border-b flex items-center justify-between text-[11px] font-semibold ${
          isDark
            ? 'bg-[#141418] border-[#28282e] text-[#a1a1aa]'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span>Mini-map</span>
          <span className={`text-[10px] font-normal ${isDark ? 'text-[#71717a]' : 'text-slate-400'}`}>
            ({nodes.length} {nodes.length === 1 ? 'node' : 'nodes'})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-minimap-fit"
            type="button"
            onClick={onFitToScreen}
            title="Fit to Screen"
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            id="btn-minimap-toggle"
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Mini-map' : 'Collapse Mini-map'}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262c] text-[#a1a1aa] hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* MiniMap Canvas Area */}
      {!isCollapsed && (
        <div
          ref={mapRef}
          onClick={handleMapClick}
          className="relative bg-[#0d0d10] cursor-crosshair overflow-hidden"
          style={{ width: mapWidth, height: mapHeight }}
        >
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Render miniature connections */}
            {connections.map((conn) => {
              const srcNode = nodes.find((n) => n.id === conn.sourceNodeId);
              const tgtNode = nodes.find((n) => n.id === conn.targetNodeId);
              if (!srcNode || !tgtNode) return null;

              const srcP = worldToMap(srcNode.position.x + 96, srcNode.position.y + 42);
              const tgtP = worldToMap(tgtNode.position.x, tgtNode.position.y + 42);

              const dx = (tgtP.x - srcP.x) / 2;
              const path = `M ${srcP.x} ${srcP.y} C ${srcP.x + dx} ${srcP.y}, ${tgtP.x - dx} ${tgtP.y}, ${tgtP.x} ${tgtP.y}`;

              return (
                <path
                  key={conn.id}
                  d={path}
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                />
              );
            })}

            {/* Render miniature nodes */}
            {nodes.map((node) => {
              const pos = worldToMap(node.position.x, node.position.y);
              const nodeW = Math.max(96 * scale, 6);
              const nodeH = Math.max(84 * scale, 5);

              const def = nodeDefinitions[node.type];
              const categoryColor =
                def?.category && CATEGORY_COLORS[def.category]
                  ? CATEGORY_COLORS[def.category]
                  : node.color || '#6366F1';

              return (
                <rect
                  key={node.id}
                  x={pos.x}
                  y={pos.y}
                  width={nodeW}
                  height={nodeH}
                  rx="1.5"
                  fill={categoryColor}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                  strokeOpacity="0.4"
                />
              );
            })}
          </svg>

          {/* Interactive Viewport Box */}
          <div
            id="minimap-viewport-box"
            onMouseDown={handleViewportMouseDown}
            style={{
              transform: `translate3d(${viewportMapTopLeft.x}px, ${viewportMapTopLeft.y}px, 0)`,
              width: `${viewportMapWidth}px`,
              height: `${viewportMapHeight}px`
            }}
            className={`absolute top-0 left-0 border border-indigo-400 bg-indigo-500/20 rounded shadow-sm cursor-grab active:cursor-grabbing hover:bg-indigo-500/30 transition-colors ${
              isDraggingViewport ? 'ring-1 ring-indigo-400' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};
