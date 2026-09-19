import React, { useState } from 'react';
import { WorkflowsSubView } from '../../types/navigation';
import { Workflow, WorkflowNode, WorkflowConnection, NodeDefinition, CustomPluginNode } from '../../types';
import { Canvas } from '../Canvas';
import {
  Workflow as WorkflowIcon,
  BookOpen,
  Play,
  History,
  Zap,
  Plus,
  ArrowRight,
  CheckCircle2,
  Settings,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface WorkflowsWorkspaceProps {
  activeSubView: WorkflowsSubView;
  onSubViewChange: (sub: WorkflowsSubView) => void;
  workflow: Workflow;
  nodeDefinitions: Record<string, NodeDefinition> | NodeDefinition[];
  customPlugins?: CustomPluginNode[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect?: (node: WorkflowNode) => void;
  selectedNode?: WorkflowNode | null;
  selectedNodeId?: string | null;
  onSelectNodeId?: (nodeId: string | null) => void;
  onOpenDrawer?: (node: WorkflowNode) => void;
  onOpenPalette?: () => void;
  onQuickConnectNode?: (sourceNodeId: string, portId: string, targetPos?: { x: number; y: number }) => void;
  onOpenShortcuts?: () => void;
  executionResults?: Record<string, any>;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenAiBuilder: () => void;
  onExecuteWorkflow: () => void;
  isExecuting?: boolean;
  onSelectTemplate?: (template: Workflow) => void;
}

const TEMPLATE_WORKFLOWS: Record<string, Partial<Workflow>> = {
  'Instagram Profile Audit to 4-Act Scripts': {
    name: 'Instagram Profile Audit to 4-Act Scripts',
    description: 'Runs profile audit, extracts pillar deficit, and prompts Gemini to draft 3 viral scripts.',
    nodes: [
      { id: 'node-audit-1', type: 'instagram_audit', label: 'Instagram Audit', position: { x: 100, y: 150 }, config: { username: 'bajajfinserv' } },
      { id: 'node-deficit-2', type: 'pillar_deficit', label: 'Pillar Deficit Analyzer', position: { x: 380, y: 150 }, config: {} },
      { id: 'node-script-3', type: 'gemini_generate', label: 'Gemini 4-Act Scriptwriter', position: { x: 660, y: 150 }, config: { format: 'reels' } },
    ],
    connections: [
      { id: 'c1', fromNodeId: 'node-audit-1', fromPortId: 'out', toNodeId: 'node-deficit-2', toPortId: 'in' },
      { id: 'c2', fromNodeId: 'node-deficit-2', fromPortId: 'out', toNodeId: 'node-script-3', toPortId: 'in' },
    ]
  },
  'Competitor Hook Scraping & Repurposing': {
    name: 'Competitor Hook Scraping & Repurposing',
    description: 'Monitors competitor handles, parses top performing reels, and extracts viral pattern hooks.',
    nodes: [
      { id: 'node-comp-1', type: 'competitor_scraper', label: 'Competitor Monitor', position: { x: 100, y: 150 }, config: {} },
      { id: 'node-hook-2', type: 'hook_extractor', label: 'Viral Hook Extractor', position: { x: 380, y: 150 }, config: {} },
      { id: 'node-repurpose-3', type: 'gemini_generate', label: 'Script Repurposer', position: { x: 660, y: 150 }, config: {} },
    ],
    connections: [
      { id: 'c3', fromNodeId: 'node-comp-1', fromPortId: 'out', toNodeId: 'node-hook-2', toPortId: 'in' },
      { id: 'c4', fromNodeId: 'node-hook-2', fromPortId: 'out', toNodeId: 'node-repurpose-3', toPortId: 'in' },
    ]
  },
  'Peak 18:30 Auto-Scheduler & Approval': {
    name: 'Peak 18:30 Auto-Scheduler & Approval',
    description: 'Sends approved scripts to Content Calendar and notifies team in Slack/Teams.',
    nodes: [
      { id: 'node-trig-1', type: 'webhook_trigger', label: 'Approval Webhook', position: { x: 100, y: 150 }, config: {} },
      { id: 'node-sched-2', type: 'scheduler_peak', label: '18:30 Peak Slot Booking', position: { x: 380, y: 150 }, config: { time: '18:30' } },
      { id: 'node-notif-3', type: 'slack_notify', label: 'Team Notification', position: { x: 660, y: 150 }, config: {} },
    ],
    connections: [
      { id: 'c5', fromNodeId: 'node-trig-1', fromPortId: 'out', toNodeId: 'node-sched-2', toPortId: 'in' },
      { id: 'c6', fromNodeId: 'node-sched-2', fromPortId: 'out', toNodeId: 'node-notif-3', toPortId: 'in' },
    ]
  }
};

export const WorkflowsWorkspace: React.FC<WorkflowsWorkspaceProps> = ({
  activeSubView,
  onSubViewChange,
  workflow,
  nodeDefinitions,
  customPlugins = [],
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNode,
  selectedNodeId,
  onSelectNodeId,
  onOpenDrawer,
  onOpenPalette,
  onQuickConnectNode,
  onOpenShortcuts,
  executionResults = {},
  onOpenTemplates,
  onOpenHistory,
  onOpenAiBuilder,
  onExecuteWorkflow,
  isExecuting = false,
  onSelectTemplate
}) => {
  const { isDark } = useTheme();

  const handleLoadTemplate = (title: string) => {
    const tplData = TEMPLATE_WORKFLOWS[title];
    if (tplData && onSelectTemplate) {
      const fullTemplate: Workflow = {
        id: `tpl_${Date.now()}`,
        name: tplData.name || title,
        description: tplData.description || '',
        nodes: tplData.nodes || [],
        connections: tplData.connections || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSelectTemplate(fullTemplate);
    }
    onSubViewChange('builder');
  };

  const nodeDefsMap: Record<string, NodeDefinition> = Array.isArray(nodeDefinitions)
    ? nodeDefinitions.reduce((acc, n) => ({ ...acc, [n.type]: n }), {})
    : (nodeDefinitions || {});

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Workflows Sub-Navigation Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark ? 'bg-[#14141c] border-[#252534]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Workflows Domain</span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
            isDark ? 'bg-[#20202e] text-zinc-400' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeSubView.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-zinc-700/30 overflow-x-auto">
          <button
            id="subnav-workflows-builder"
            type="button"
            onClick={() => onSubViewChange('builder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'builder'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <WorkflowIcon className="w-3.5 h-3.5" />
            <span>Workflow Builder</span>
          </button>

          <button
            id="subnav-workflows-templates"
            type="button"
            onClick={() => onSubViewChange('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'templates'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>

          <button
            id="subnav-workflows-active"
            type="button"
            onClick={() => onSubViewChange('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'active'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Active Workflows</span>
          </button>

          <button
            id="subnav-workflows-runs"
            type="button"
            onClick={() => onSubViewChange('runs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'runs'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Workflow Runs</span>
          </button>

          <button
            id="subnav-workflows-automations"
            type="button"
            onClick={() => onSubViewChange('automations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubView === 'automations'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Automations</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <div className="flex-1 min-h-0 relative">
        {activeSubView === 'builder' && (
          <div className="w-full h-full relative">
            <Canvas
              workflow={workflow}
              nodeDefinitions={nodeDefsMap}
              executionResults={executionResults}
              isExecuting={isExecuting}
              selectedNodeId={selectedNodeId || (selectedNode?.id || null)}
              onSelectNode={(nodeId) => {
                if (onSelectNodeId) onSelectNodeId(nodeId);
                const n = workflow.nodes.find(node => node.id === nodeId);
                if (n && onNodeSelect) onNodeSelect(n);
              }}
              onUpdateNodes={onNodesChange}
              onUpdateConnections={onConnectionsChange}
              onOpenDrawer={(node) => {
                if (onOpenDrawer) onOpenDrawer(node);
                else if (onNodeSelect) onNodeSelect(node);
              }}
              onOpenPalette={onOpenPalette || (() => {})}
              onQuickConnectNode={onQuickConnectNode}
              onExecuteWorkflow={onExecuteWorkflow}
              onOpenShortcuts={onOpenShortcuts}
            />
          </div>
        )}

        {activeSubView === 'templates' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Template Library</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Deploy ready-to-run blueprints for Instagram automated audits, viral topic generation, and publishing.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenTemplates}
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Browse All Templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Instagram Profile Audit to 4-Act Scripts', desc: 'Runs profile audit, extracts pillar deficit, and prompts Gemini to draft 3 viral scripts.', nodes: 5, category: 'Strategy ➔ Content' },
                { title: 'Competitor Hook Scraping & Repurposing', desc: 'Monitors competitor handles, parses top performing reels, and extracts viral pattern hooks.', nodes: 4, category: 'Intelligence' },
                { title: 'Peak 18:30 Auto-Scheduler & Approval', desc: 'Sends approved scripts to Content Calendar and notifies team in Slack/Teams.', nodes: 6, category: 'Publishing' }
              ].map((t, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      {t.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1.5">{t.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">{t.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs">
                    <span className="text-slate-500 dark:text-zinc-500 font-mono">{t.nodes} Nodes</span>
                    <button
                      type="button"
                      onClick={() => handleLoadTemplate(t.title)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Load into Builder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'active' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Active Running Workflows</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Workflows actively listening to triggers, scheduled cron jobs, and webhook listeners.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Instagram Daily Insights Sync', trigger: 'Cron: Everyday at 06:00 UTC', status: 'Running', health: '100% OK' },
                { name: 'Approved Topic Auto-Script Generator', trigger: 'Event: Topic Approved', status: 'Listening', health: '100% OK' },
                { name: 'Competitor Benchmark Alert', trigger: 'Cron: Weekly on Monday', status: 'Active', health: '100% OK' }
              ].map((w, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{w.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{w.trigger}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400 font-semibold">{w.health}</span>
                    <button
                      type="button"
                      onClick={() => onSubViewChange('builder')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white text-xs font-semibold cursor-pointer"
                    >
                      Open Graph
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubView === 'runs' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Execution History &amp; Logs</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Inspect past workflow runs, execution durations, node payloads, and error traces.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenHistory}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Open Full History Modal</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
              <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">● RUN #1042 — SUCCESS</span>
                  <span>142ms • 6 Nodes Executed</span>
                  <span className="text-slate-400 dark:text-zinc-500">2026-09-18 14:30:12</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">● RUN #1041 — SUCCESS</span>
                  <span>98ms • 4 Nodes Executed</span>
                  <span className="text-slate-400 dark:text-zinc-500">2026-09-18 12:15:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">● RUN #1040 — SUCCESS</span>
                  <span>110ms • 5 Nodes Executed</span>
                  <span className="text-slate-400 dark:text-zinc-500">2026-09-18 09:00:00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'automations' && (
          <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Event-Driven Automation Rules</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Autonomous pipeline triggers connecting audit findings directly to topic ideation and calendar booking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">ENABLED</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Auto-Generate Topics on Pillar Deficit</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Whenever an audit reveals a pillar with &gt;10% deficit, automatically generate 5 topic angles.</p>
              </div>

              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">ENABLED</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Auto-Schedule on Script Approval</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">When an editor approves a 4-act script, automatically book the next open 18:30 peak slot in Calendar.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
