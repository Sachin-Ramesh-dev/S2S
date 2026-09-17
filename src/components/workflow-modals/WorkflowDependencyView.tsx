import React, { useMemo, useState } from 'react';
import {
  GitBranch,
  ArrowRight,
  Database,
  Sparkles,
  Globe,
  Key,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Zap,
  Info
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  workflow: Workflow;
}

interface ServiceDependency {
  id: string;
  name: string;
  type: string;
  icon: any;
  requiredCredential?: string;
  nodes: { id: string; name: string }[];
  status: 'configured' | 'pending' | 'system';
}

export const WorkflowDependencyView: React.FC<Props> = ({ workflow }) => {
  const { isDark } = useTheme();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodes = workflow.nodes || [];
  const connections = workflow.connections || [];

  // Compute dependency graph & topological execution levels
  const { levels, inDegree, outEdges, inEdges, hasCycle, isolatedNodes } = useMemo(() => {
    const adjList = new Map<string, string[]>();
    const revAdjList = new Map<string, string[]>();
    const inDeg = new Map<string, number>();

    nodes.forEach((n) => {
      adjList.set(n.id, []);
      revAdjList.set(n.id, []);
      inDeg.set(n.id, 0);
    });

    connections.forEach((c) => {
      if (adjList.has(c.sourceNodeId) && adjList.has(c.targetNodeId)) {
        adjList.get(c.sourceNodeId)!.push(c.targetNodeId);
        revAdjList.get(c.targetNodeId)!.push(c.sourceNodeId);
        inDeg.set(c.targetNodeId, (inDeg.get(c.targetNodeId) || 0) + 1);
      }
    });

    // Kahn's algorithm for topological levels
    const queue: { id: string; level: number }[] = [];
    const nodeLevel = new Map<string, number>();
    const tempInDeg = new Map(inDeg);

    nodes.forEach((n) => {
      if ((tempInDeg.get(n.id) || 0) === 0) {
        queue.push({ id: n.id, level: 0 });
        nodeLevel.set(n.id, 0);
      }
    });

    let visitedCount = 0;
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      visitedCount++;

      const neighbors = adjList.get(id) || [];
      neighbors.forEach((nbr) => {
        const curDeg = tempInDeg.get(nbr)! - 1;
        tempInDeg.set(nbr, curDeg);
        const nextLevel = Math.max(nodeLevel.get(nbr) || 0, level + 1);
        nodeLevel.set(nbr, nextLevel);
        if (curDeg === 0) {
          queue.push({ id: nbr, level: nextLevel });
        }
      });
    }

    const hasLoop = visitedCount < nodes.length;

    // Group nodes by level
    const maxLevel = Math.max(0, ...Array.from(nodeLevel.values()));
    const groupedLevels: WorkflowNode[][] = Array.from({ length: maxLevel + 1 }, () => []);

    const isolated: WorkflowNode[] = [];

    nodes.forEach((n) => {
      const isIso = (adjList.get(n.id)?.length || 0) === 0 && (revAdjList.get(n.id)?.length || 0) === 0;
      if (isIso) {
        isolated.push(n);
      }
      const lvl = nodeLevel.get(n.id) ?? 0;
      if (groupedLevels[lvl]) {
        groupedLevels[lvl].push(n);
      } else {
        groupedLevels[0].push(n);
      }
    });

    return {
      levels: groupedLevels,
      inDegree: inDeg,
      outEdges: adjList,
      inEdges: revAdjList,
      hasCycle: hasLoop,
      isolatedNodes: isolated
    };
  }, [nodes, connections]);

  // Compute external service dependencies from node types and parameters
  const serviceDependencies = useMemo<ServiceDependency[]>(() => {
    const services: Record<string, ServiceDependency> = {};

    nodes.forEach((node) => {
      const type = node.type.toLowerCase();

      if (type.includes('gemini') || type.includes('ai') || type.includes('llm')) {
        if (!services['gemini']) {
          services['gemini'] = {
            id: 'gemini',
            name: 'Google Gemini AI',
            type: 'AI / Model Inference',
            icon: Sparkles,
            requiredCredential: 'GEMINI_API_KEY (Server-side)',
            nodes: [],
            status: 'configured'
          };
        }
        services['gemini'].nodes.push({ id: node.id, name: node.name });
      }

      if (type.includes('postgres') || type.includes('sql') || type.includes('database')) {
        if (!services['postgres']) {
          services['postgres'] = {
            id: 'postgres',
            name: 'PostgreSQL Database',
            type: 'Relational Database',
            icon: Database,
            requiredCredential: 'POSTGRES_URL / Connection Pool',
            nodes: [],
            status: 'configured'
          };
        }
        services['postgres'].nodes.push({ id: node.id, name: node.name });
      }

      if (type.includes('httprequest') || type.includes('fetch') || type.includes('api')) {
        if (!services['http']) {
          services['http'] = {
            id: 'http',
            name: 'External HTTP / REST Endpoints',
            type: 'Web Service Integration',
            icon: Globe,
            requiredCredential: 'Authorization Bearer / API Key',
            nodes: [],
            status: 'configured'
          };
        }
        services['http'].nodes.push({ id: node.id, name: node.name });
      }

      if (type.includes('webhook') || type.includes('listener')) {
        if (!services['webhook']) {
          services['webhook'] = {
            id: 'webhook',
            name: 'Inbound Webhook Gateway',
            type: 'Event Ingestion Endpoint',
            icon: Zap,
            requiredCredential: 'Secret Webhook Token',
            nodes: [],
            status: 'configured'
          };
        }
        services['webhook'].nodes.push({ id: node.id, name: node.name });
      }

      if (type.includes('schedule') || type.includes('cron')) {
        if (!services['cron']) {
          services['cron'] = {
            id: 'cron',
            name: 'Cron / Timer Scheduler',
            type: 'Internal Engine Service',
            icon: Clock,
            nodes: [],
            status: 'system'
          };
        }
        services['cron'].nodes.push({ id: node.id, name: node.name });
      }
    });

    return Object.values(services);
  }, [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
          hasCycle
            ? isDark
              ? 'bg-rose-950/20 border-rose-800/50 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-800'
            : isDark
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {hasCycle ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <div>
            <div className="text-xs font-semibold">
              {hasCycle
                ? 'Circular Dependency Detected'
                : 'Valid Directed Acyclic Graph (DAG)'}
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                isDark ? 'text-neutral-400' : 'text-slate-600'
              }`}
            >
              {hasCycle
                ? 'A loop was detected in connection wires. Downstream nodes cannot resolve in strict order.'
                : `Topological execution order is verified across ${levels.length} execution stages.`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] px-2.5 py-1 rounded-md font-mono border font-medium ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {nodes.length} nodes • {connections.length} edges
          </span>
        </div>
      </div>

      {/* 1. Execution Order Timeline / Stages */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4
            className={`text-xs font-semibold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-[#EA580C]" />
            Execution Order Stages (Topological Levels)
          </h4>
          <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Stage 1 runs first → Stage {levels.length} runs last
          </span>
        </div>

        <div className="space-y-2">
          {levels.map((stageNodes, stageIdx) => (
            <div
              key={stageIdx}
              className={`p-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] text-[11px] font-bold flex items-center justify-center font-mono">
                  {stageIdx + 1}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-neutral-200' : 'text-slate-800'
                  }`}
                >
                  {stageIdx === 0
                    ? 'Initial Stage (Trigger / Roots)'
                    : stageIdx === levels.length - 1
                    ? 'Terminal Stage (Outputs / Sinks)'
                    : `Intermediate Stage ${stageIdx + 1}`}
                </span>
                <span className={`text-[10px] ml-auto font-mono ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  {stageNodes.length} {stageNodes.length === 1 ? 'node' : 'nodes'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {stageNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all text-left ${
                        isSelected
                          ? 'border-[#EA580C] bg-[#EA580C]/15 font-semibold text-[#EA580C]'
                          : isDark
                          ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:border-neutral-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                      <span className="truncate max-w-[140px]">{node.name}</span>
                      <span className={`text-[10px] opacity-60 font-mono`}>({node.type})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Selected Node Dependency Matrix Details */}
      {selectedNode && (
        <div
          className={`p-4 rounded-xl border animate-in fade-in transition-colors ${
            isDark
              ? 'bg-neutral-900 border-[#EA580C]/40 text-neutral-200'
              : 'bg-orange-50/50 border-orange-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#EA580C]" />
              <span className="text-xs font-semibold">{selectedNode.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {selectedNode.type}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="text-[11px] text-[#EA580C] hover:underline"
            >
              Clear selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Upstream dependencies */}
            <div
              className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-black/30 border-neutral-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 rotate-180 text-sky-400" />
                Upstream Dependencies ({inEdges.get(selectedNode.id)?.length || 0})
              </div>
              {(inEdges.get(selectedNode.id)?.length || 0) === 0 ? (
                <div className="text-[11px] text-neutral-500 italic">
                  Root node (no upstream inputs)
                </div>
              ) : (
                <ul className="space-y-1">
                  {inEdges.get(selectedNode.id)?.map((srcId) => {
                    const src = nodes.find((n) => n.id === srcId);
                    return (
                      <li
                        key={srcId}
                        className="text-[11px] flex items-center justify-between"
                      >
                        <span className="font-medium text-sky-400">
                          {src?.name || srcId}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {src?.type}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Downstream dependants */}
            <div
              className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-black/30 border-neutral-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                Downstream Dependants ({outEdges.get(selectedNode.id)?.length || 0})
              </div>
              {(outEdges.get(selectedNode.id)?.length || 0) === 0 ? (
                <div className="text-[11px] text-neutral-500 italic">
                  Leaf node (no downstream outputs)
                </div>
              ) : (
                <ul className="space-y-1">
                  {outEdges.get(selectedNode.id)?.map((tgtId) => {
                    const tgt = nodes.find((n) => n.id === tgtId);
                    return (
                      <li
                        key={tgtId}
                        className="text-[11px] flex items-center justify-between"
                      >
                        <span className="font-medium text-emerald-400">
                          {tgt?.name || tgtId}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {tgt?.type}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. External Service & Resource Dependencies */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4
            className={`text-xs font-semibold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Key className="w-4 h-4 text-[#EA580C]" />
            External Service & Resource Dependencies
          </h4>
          <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            {serviceDependencies.length} services identified
          </span>
        </div>

        {serviceDependencies.length === 0 ? (
          <div
            className={`p-4 rounded-xl border text-center text-xs ${
              isDark
                ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            No external API keys or database connections required by current nodes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {serviceDependencies.map((svc) => {
              const IconComp = svc.icon;
              return (
                <div
                  key={svc.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-[#EA580C]/10 text-[#EA580C] shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          className={`text-xs font-semibold truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {svc.name}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            svc.status === 'configured'
                              ? isDark
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDark
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {svc.status === 'configured' ? 'Configured' : 'System Engine'}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        {svc.type}
                      </div>
                      {svc.requiredCredential && (
                        <div
                          className={`text-[10px] font-mono mt-1.5 px-2 py-1 rounded border inline-block ${
                            isDark
                              ? 'bg-neutral-950 border-neutral-800 text-amber-300'
                              : 'bg-slate-100 border-slate-200 text-amber-800'
                          }`}
                        >
                          Requires: {svc.requiredCredential}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                    <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                      Used by {svc.nodes.length} {svc.nodes.length === 1 ? 'node' : 'nodes'}:
                    </span>
                    <div className="flex items-center gap-1">
                      {svc.nodes.map((n) => (
                        <span
                          key={n.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {n.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Isolated Nodes Notice if any */}
      {isolatedNodes.length > 0 && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            isDark
              ? 'bg-amber-950/20 border-amber-800/30 text-amber-200'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isolatedNodes.length} disconnected node{isolatedNodes.length > 1 ? 's' : ''} (
            {isolatedNodes.map((n) => n.name).join(', ')}) will not receive inputs or trigger actions until connected.
          </span>
        </div>
      )}
    </div>
  );
};
