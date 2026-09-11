import React, { useState } from 'react';
import { ExecutionRecord, SingleNodeExecution } from '../types';
import {
  X,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Database,
  Terminal,
  RefreshCw,
  Copy
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  executions: ExecutionRecord[];
  onRefresh: () => void;
}

export const ExecutionHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  executions,
  onRefresh
}) => {
  const [selectedExec, setSelectedExec] = useState<ExecutionRecord | null>(
    executions.length > 0 ? executions[0] : null
  );
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentExec = selectedExec || (executions.length > 0 ? executions[0] : null);
  const nodeExecutions: SingleNodeExecution[] = currentExec ? (Object.values(currentExec.nodeExecutions || {}) as SingleNodeExecution[]) : [];
  const activeNodeExec = selectedNodeKey
    ? nodeExecutions.find(n => n.nodeId === selectedNodeKey)
    : nodeExecutions[0];

  return (
    <div
      id="modal-execution-history"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Workflow Execution Audit Log
              </h2>
              <p className="text-xs text-neutral-400">
                Inspect past runs, node-level payload data, timings, and error stack traces stored in local database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-executions"
              type="button"
              onClick={onRefresh}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              id="btn-close-history-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left List + Right Detail Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Executions List */}
          <div className="w-80 border-r border-neutral-800 bg-neutral-950/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-neutral-800/60 text-xs font-semibold text-neutral-400">
              PAST EXECUTIONS ({executions.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  id={`exec-item-${exec.id}`}
                  onClick={() => {
                    setSelectedExec(exec);
                    setSelectedNodeKey(null);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    currentExec?.id === exec.id
                      ? 'bg-neutral-800 border-indigo-500/50 shadow-sm text-white'
                      : 'hover:bg-neutral-900/80 border-transparent text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">
                      {exec.workflowName || 'Workflow'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                        exec.status === 'success'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : exec.status === 'error'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          : 'bg-amber-950/60 text-amber-400'
                      }`}
                    >
                      {exec.status === 'success' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {exec.status === 'error' && <AlertTriangle className="w-2.5 h-2.5" />}
                      {exec.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                    <span className="font-mono">
                      {new Date(exec.startedAt).toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-neutral-500">
                      {exec.durationMs !== undefined ? `${exec.durationMs}ms` : ''}
                    </span>
                  </div>
                </div>
              ))}

              {executions.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No workflow executions recorded yet. Run a workflow to view execution audit details.
                </div>
              )}
            </div>
          </div>

          {/* Right Inspector */}
          {currentExec ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
              {/* Exec Summary Bar */}
              <div className="p-4 border-b border-neutral-800 bg-neutral-950/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-neutral-100 text-sm">{currentExec.workflowName}</span>
                  <span className="text-neutral-400 font-mono text-[11px]">{currentExec.id}</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                    Trigger: {currentExec.triggerType.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Total Duration: {currentExec.durationMs || 0}ms</span>
                </div>
              </div>

              {/* Steps pills */}
              <div className="p-3 border-b border-neutral-800 bg-neutral-950/60 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-neutral-500 font-semibold px-1">STEPS:</span>
                {nodeExecutions.map((n) => (
                  <button
                    key={n.nodeId}
                    type="button"
                    onClick={() => setSelectedNodeKey(n.nodeId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      (activeNodeExec?.nodeId === n.nodeId)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {n.status === 'success' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{n.nodeName}</span>
                    {n.durationMs !== undefined && (
                      <span className="text-[10px] opacity-70 font-mono">({n.durationMs}ms)</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Node Inspector Payload */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {activeNodeExec ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-200">
                        Step: {activeNodeExec.nodeName} ({activeNodeExec.status.toUpperCase()})
                      </span>
                      <span className="font-mono text-neutral-400">
                        Runtime: {activeNodeExec.durationMs ?? 0}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Input */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-neutral-400 uppercase">
                          Input Payload
                        </div>
                        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 max-h-72 overflow-auto">
                          <pre>{JSON.stringify(activeNodeExec.inputData, null, 2)}</pre>
                        </div>
                      </div>

                      {/* Output */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-emerald-400 uppercase flex items-center justify-between">
                          <span>Output Payload</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(activeNodeExec.outputData, null, 2))}
                            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-300 max-h-72 overflow-auto">
                          <pre>{JSON.stringify(activeNodeExec.outputData || activeNodeExec.error, null, 2)}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Step Logs */}
                    {activeNodeExec.logs && activeNodeExec.logs.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          Step Telemetry & Debug Logs
                        </div>
                        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-400 space-y-1 max-h-36 overflow-auto">
                          {activeNodeExec.logs.map((log, idx) => (
                            <div key={idx}>{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-neutral-500 text-xs text-center py-12">
                    Select a step above to inspect execution data.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
              Select an execution from the left list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
