import React from 'react';
import {
  Play,
  Webhook,
  Clock,
  Globe,
  Code2,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Send,
  BellRing,
  FileSpreadsheet,
  Settings,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Circle,
  HelpCircle
} from 'lucide-react';
import { WorkflowNode as IWorkflowNode, NodeDefinition, SingleNodeExecution } from '../types';

interface Props {
  node: IWorkflowNode;
  definition: NodeDefinition;
  isSelected: boolean;
  executionState?: SingleNodeExecution;
  onSelect: (nodeId: string) => void;
  onStartDrag: (e: React.MouseEvent, nodeId: string) => void;
  onStartConnecting: (e: React.MouseEvent, nodeId: string, portId: string, isOutput: boolean) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (node: IWorkflowNode) => void;
  onOpenDrawer: (node: IWorkflowNode) => void;
  scale: number;
}

const ICON_MAP: Record<string, any> = {
  Play,
  Webhook,
  Clock,
  Globe,
  Code2,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Send,
  BellRing,
  FileSpreadsheet,
};

export const WorkflowNode: React.FC<Props> = ({
  node,
  definition,
  isSelected,
  executionState,
  onSelect,
  onStartDrag,
  onStartConnecting,
  onDelete,
  onDuplicate,
  onOpenDrawer
}) => {
  const IconComponent = ICON_MAP[definition?.icon] || HelpCircle;
  const status = executionState?.status || 'idle';

  return (
    <div
      id={`node-${node.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenDrawer(node);
      }}
      style={{
        transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`,
        width: 250,
      }}
      className={`absolute select-none cursor-move rounded-xl bg-neutral-900 border transition-shadow ${
        isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40 z-20'
          : 'border-neutral-800 hover:border-neutral-700 shadow-md z-10'
      } ${node.disabled ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Category accent line */}
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{ backgroundColor: definition?.color || '#6366F1' }}
      />

      {/* Main Node Header / Drag Handle */}
      <div
        onMouseDown={(e) => onStartDrag(e, node.id)}
        className="p-3.5 flex items-start justify-between gap-2.5 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
            style={{
              backgroundColor: `${definition?.color || '#6366F1'}20`,
              color: definition?.color || '#6366F1',
            }}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-100 truncate flex items-center gap-1.5">
              {node.name || definition?.name}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {definition?.name}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
          <button
            id={`btn-config-${node.id}`}
            type="button"
            title="Configure Node"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer(node);
            }}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-dup-${node.id}`}
            type="button"
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node);
            }}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-del-${node.id}`}
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 rounded hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Info / Status Footer */}
      <div className="px-3.5 pb-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-2">
        <div className="flex items-center gap-1.5">
          {status === 'idle' && (
            <span className="flex items-center gap-1 text-neutral-400">
              <Circle className="w-2.5 h-2.5 text-neutral-500 fill-neutral-500" />
              Ready
            </span>
          )}
          {status === 'running' && (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              Running...
            </span>
          )}
          {status === 'success' && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {executionState?.durationMs !== undefined ? `${executionState.durationMs}ms` : 'Success'}
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Error
            </span>
          )}
        </div>

        {definition?.isPlugin && (
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 text-[10px] font-mono border border-indigo-800/40">
            PLUGIN
          </span>
        )}
      </div>

      {/* Input Ports (Left Side) */}
      {(definition?.inputs || []).map((port, idx) => (
        <div
          key={`in-${port.id}-${idx}`}
          id={`port-in-${node.id}-${port.id}`}
          title={`Input: ${port.label}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnecting(e, node.id, port.id, false);
          }}
          className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-400 hover:border-indigo-400 hover:scale-125 cursor-crosshair transition-all flex items-center justify-center z-30"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
        </div>
      ))}

      {/* Output Ports (Right Side) */}
      {(definition?.outputs || []).map((port, idx) => {
        const totalOutputs = definition.outputs.length;
        // Calculate vertical distribution for multiple outputs (e.g. True / False)
        let topOffset = '50%';
        if (totalOutputs > 1) {
          const step = 60 / (totalOutputs - 1);
          topOffset = `${20 + idx * step}%`;
        }

        const isTrueBranch = port.type === 'true';
        const isFalseBranch = port.type === 'false';

        return (
          <div
            key={`out-${port.id}-${idx}`}
            id={`port-out-${node.id}-${port.id}`}
            title={`Output: ${port.label}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnecting(e, node.id, port.id, true);
            }}
            style={{ top: topOffset }}
            className={`absolute -right-2.5 -translate-y-1/2 w-4 h-4 rounded-full border-2 hover:scale-125 cursor-crosshair transition-all flex items-center justify-center z-30 ${
              isTrueBranch
                ? 'bg-emerald-950 border-emerald-400'
                : isFalseBranch
                ? 'bg-rose-950 border-rose-400'
                : 'bg-neutral-800 border-neutral-400 hover:border-indigo-400'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isTrueBranch
                  ? 'bg-emerald-300'
                  : isFalseBranch
                  ? 'bg-rose-300'
                  : 'bg-neutral-300'
              }`}
            />
            {totalOutputs > 1 && (
              <span
                className={`absolute left-5 text-[10px] font-mono px-1 rounded whitespace-nowrap pointer-events-none ${
                  isTrueBranch
                    ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/50'
                    : isFalseBranch
                    ? 'text-rose-400 bg-rose-950/80 border border-rose-800/50'
                    : 'text-neutral-400 bg-neutral-800'
                }`}
              >
                {port.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
