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
  HelpCircle,
  Database,
  Plus,
  Repeat,
  Filter,
  GitMerge,
  Boxes,
  Sparkles,
  AlertOctagon,
  Mail,
  MessageSquare
} from 'lucide-react';
import { WorkflowNode as IWorkflowNode, NodeDefinition, SingleNodeExecution } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  node: IWorkflowNode;
  definition: NodeDefinition;
  isSelected: boolean;
  executionState?: SingleNodeExecution;
  onSelect: (nodeId: string) => void;
  onStartDrag: (e: React.MouseEvent, nodeId: string) => void;
  onStartConnecting: (e: React.MouseEvent, nodeId: string, portId: string, isOutput: boolean) => void;
  onEndConnecting?: (targetNodeId: string, targetPortId: string, isOutput: boolean) => void;
  onQuickAddNextNode?: (sourceNodeId: string, portId: string) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (node: IWorkflowNode) => void;
  onOpenDrawer: (node: IWorkflowNode) => void;
  scale: number;
  isAnimatingLayout?: boolean;
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
  Database,
  Repeat,
  Filter,
  GitMerge,
  Boxes,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Mail,
  MessageSquare
};

export const WorkflowNode: React.FC<Props> = ({
  node,
  definition,
  isSelected,
  executionState,
  onSelect,
  onStartDrag,
  onStartConnecting,
  onEndConnecting,
  onQuickAddNextNode,
  onDelete,
  onDuplicate,
  onOpenDrawer,
  isAnimatingLayout = false
}) => {
  const { isDark } = useTheme();
  const IconComponent = ICON_MAP[definition?.icon] || HelpCircle;
  const status = executionState?.status || 'idle';
  const hasOutputs = (definition?.outputs && definition.outputs.length > 0);
  const hasInputs = (definition?.inputs && definition.inputs.length > 0);

  const category =
    definition?.category ||
    (node.type.toLowerCase().includes('trigger')
      ? 'trigger'
      : node.type.toLowerCase().includes('branch') || node.type.toLowerCase().includes('if')
      ? 'logic'
      : 'action');

  const catStyle = {
    trigger: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#45D9A6',
      badgeBg: 'bg-[#45D9A6] text-[#111111]',
      badgeLabel: 'TRIGGER'
    },
    action: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#7CC7FF',
      badgeBg: 'bg-[#7CC7FF] text-[#111111]',
      badgeLabel: 'ACTION'
    },
    transform: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#FFD66B',
      badgeBg: 'bg-[#FFD66B] text-[#111111]',
      badgeLabel: 'TRANSFORM'
    },
    logic: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#B9A7FF',
      badgeBg: 'bg-[#B9A7FF] text-[#111111]',
      badgeLabel: 'LOGIC'
    },
    security: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#FF4D5A',
      badgeBg: 'bg-[#FF4D5A] text-white',
      badgeLabel: 'SECURITY'
    },
    plugin: {
      border: 'border-[#171717] dark:border-[#383844]',
      hoverBorder: 'hover:border-[#111111]',
      accent: '#45D9A6',
      badgeBg: 'bg-[#45D9A6] text-[#111111]',
      badgeLabel: 'PLUGIN'
    }
  }[category] || {
    border: 'border-[#171717] dark:border-[#383844]',
    hoverBorder: 'hover:border-[#111111]',
    accent: '#7CC7FF',
    badgeBg: 'bg-[#7CC7FF] text-[#111111]',
    badgeLabel: 'ACTION'
  };

  // Special rendering for n8n iconic nodes (like Webhook, SQL query, Respond to Webhook)
  const isN8nWebhook = node.type === 'webhookTrigger' || node.type === 'respondToWebhook';
  const isSqlQuery = node.type === 'sqlQuery';

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
        width: 104
      }}
      className={`absolute select-none group cursor-pointer ${
        isAnimatingLayout
          ? 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
          : ''
      } ${
        node.disabled ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Quick Action Buttons (Floating above on hover) */}
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 rounded-md px-1.5 py-0.5 z-30 transition-colors border-2 border-[#171717] bg-white dark:bg-[#1A1A22] shadow-[2px_2px_0_#111111]"
      >
        <button
          id={`btn-config-${node.id}`}
          type="button"
          title="Configure Node"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDrawer(node);
          }}
          className="p-1 rounded hover:bg-[#F8F5EE] dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-200"
        >
          <Settings className="w-3 h-3" />
        </button>
        <button
          id={`btn-dup-${node.id}`}
          type="button"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(node);
          }}
          className="p-1 rounded hover:bg-[#F8F5EE] dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-200"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          id={`btn-del-${node.id}`}
          type="button"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Main Node Card Body (Drag Handle) */}
      <div
        onMouseDown={(e) => onStartDrag(e, node.id)}
        className={`relative w-26 h-22 rounded-2xl border-2 border-[#171717] dark:border-[#383844] flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing shadow-[3px_3px_0_#111111] dark:shadow-[3px_3px_0_#383844] ${
          isDark ? 'bg-[#181820]' : 'bg-[#FFFDF9]'
        } ${
          isSelected
            ? 'ring-2 ring-[#111111] dark:ring-white shadow-[4px_4px_0_#111111]'
            : 'hover:translate-x-0.5 hover:translate-y-0.5'
        }`}
      >
        {/* Category Accent Badge */}
        <div
          className={`absolute -top-2.5 left-2 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border border-[#171717] ${catStyle.badgeBg}`}
          title={`Category: ${category}`}
        >
          {catStyle.badgeLabel}
        </div>
        {/* Node Icon Graphic */}
        {isN8nWebhook ? (
          // Distinct n8n 3-connected-nodes pink logo
          <div className="flex items-center justify-center text-[#F43F5E]">
            <svg
              className="w-8 h-8 fill-current"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="5" cy="12" r="3" fill="#F43F5E" />
              <circle cx="19" cy="6" r="3" fill="#F43F5E" />
              <circle cx="19" cy="18" r="3" fill="#F43F5E" />
              <path
                d="M5 12C9 12 11 6 19 6M5 12C9 12 11 18 19 18"
                stroke="#F43F5E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : isSqlQuery ? (
          // PostgreSQL Elephant / Database Icon in Blue
          <div className="w-9 h-9 rounded-xl bg-[#336791]/15 text-[#38bdf8] flex items-center justify-center">
            <Database className="w-6 h-6 text-[#38bdf8]" />
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${definition?.color || '#6366F1'}20`,
              color: definition?.color || '#6366F1',
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
        )}

        {/* Small Status Indicator Dot (Green for success, Red for error, Yellow for running, Subtle slate for idle) */}
        <div
          id={`status-indicator-${node.id}`}
          className={`absolute -top-1.5 -right-1.5 z-30 p-0.5 rounded-full border shadow-md flex items-center justify-center cursor-help transition-transform hover:scale-125 ${
            isDark ? 'bg-[#18181c] border-[#2e2e34]' : 'bg-white border-slate-300'
          }`}
          title={
            status === 'success'
              ? `Last run: Succeeded${executionState?.durationMs ? ` (${executionState.durationMs}ms)` : ''}`
              : status === 'error'
              ? `Last run: Error (${executionState?.error || 'Encountered error in execution'})`
              : status === 'running'
              ? 'Status: Executing...'
              : 'Last run: Not executed'
          }
        >
          {status === 'success' && (
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] ring-1 ring-emerald-300" />
            </span>
          )}
          {status === 'error' && (
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" style={{ animationDuration: '2s' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] ring-1 ring-rose-300" />
            </span>
          )}
          {status === 'running' && (
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] ring-1 ring-amber-200" />
            </span>
          )}
          {status === 'idle' && (
            <span
              className={`inline-flex rounded-full h-2 w-2 ${
                isDark ? 'bg-zinc-600 border border-zinc-500/60' : 'bg-slate-300 border border-slate-400'
              }`}
            />
          )}
        </div>

        {/* Input Port (Left Side) */}
        {hasInputs &&
          (definition?.inputs || []).map((port, idx) => {
            const count = definition.inputs.length;
            const topPercent = count === 1 ? 50 : ((idx + 1) / (count + 1)) * 100;
            return (
              <div
                key={`in-${port.id}-${idx}`}
                id={`port-in-${node.id}-${port.id}`}
                title={`Input: ${port.label}`}
                style={{ top: `${topPercent}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartConnecting(e, node.id, port.id, false);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onEndConnecting?.(node.id, port.id, false);
                }}
                className={`absolute -left-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 hover:border-[#EA580C] hover:scale-125 cursor-crosshair transition-all flex items-center justify-center z-30 ${
                  isDark ? 'bg-[#202024] border-[#71717a]' : 'bg-slate-100 border-slate-400'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#d4d4d8]' : 'bg-slate-600'}`} />
              </div>
            );
          })}

        {/* Output Port (Right Side) */}
        {hasOutputs &&
          (definition?.outputs || []).map((port, idx) => {
            const count = definition.outputs.length;
            const topPercent = count === 1 ? 50 : ((idx + 1) / (count + 1)) * 100;
            return (
              <div
                key={`out-${port.id}-${idx}`}
                id={`port-out-${node.id}-${port.id}`}
                title={`Output: ${port.label}`}
                style={{ top: `${topPercent}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartConnecting(e, node.id, port.id, true);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onEndConnecting?.(node.id, port.id, true);
                }}
                className={`absolute -right-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 hover:border-[#EA580C] hover:scale-125 cursor-crosshair transition-all flex items-center justify-center z-30 ${
                  isDark ? 'bg-[#202024] border-[#71717a]' : 'bg-slate-100 border-slate-400'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#d4d4d8]' : 'bg-slate-600'}`} />
              </div>
            );
          })}

        {/* Circular '+' Quick Add Button on Output */}
        {hasOutputs && (
          <button
            id={`btn-quick-add-${node.id}`}
            type="button"
            title="Connect next step (+)"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickAddNextNode) {
                onQuickAddNextNode(node.id, definition.outputs[0]?.id || 'main');
              } else {
                onOpenDrawer(node);
              }
            }}
            className={`absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border hover:text-white hover:bg-[#EA580C] hover:border-[#EA580C] flex items-center justify-center transition-colors z-20 shadow-md ${
              isDark
                ? 'bg-[#28282e] border-[#3e3e46] text-[#a1a1aa]'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Node Labels (Below the card) */}
      <div className="mt-2 text-center pointer-events-none flex flex-col items-center">
        <div
          className={`text-xs font-semibold leading-tight tracking-tight whitespace-nowrap max-w-[150px] truncate ${
            isDark ? 'text-[#f4f4f5]' : 'text-slate-800'
          }`}
        >
          {node.name || definition?.name}
        </div>
        {(node.subtitle || (node.parameters && node.parameters.operation)) && (
          <div
            className={`text-[11px] leading-tight mt-0.5 whitespace-nowrap max-w-[150px] truncate ${
              isDark ? 'text-[#a1a1aa]' : 'text-slate-500'
            }`}
          >
            {node.subtitle || node.parameters?.operation}
          </div>
        )}
      </div>
    </div>
  );
};
