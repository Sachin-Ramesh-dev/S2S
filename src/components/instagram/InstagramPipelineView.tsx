import React from 'react';
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  Calendar,
  FileText
} from 'lucide-react';
import { ContentPipelineItem, PipelineStage } from '../../types/instagram';

interface InstagramPipelineViewProps {
  pipeline: ContentPipelineItem[];
  onUpdateStage: (itemId: string, stage: PipelineStage) => void;
  onOpenScript: (scriptId?: string, topicId?: string) => void;
  onOpenCalendar: () => void;
}

export const InstagramPipelineView: React.FC<InstagramPipelineViewProps> = ({
  pipeline,
  onUpdateStage,
  onOpenScript,
  onOpenCalendar
}) => {
  const stages: Array<{ key: PipelineStage; label: string; color: string }> = [
    { key: 'approved', label: 'Idea Approved', color: 'border-blue-200 text-blue-700 bg-blue-50' },
    { key: 'scripting', label: 'Scripting', color: 'border-purple-200 text-purple-700 bg-purple-50' },
    { key: 'in_review', label: 'In Review', color: 'border-amber-200 text-amber-800 bg-amber-50' },
    { key: 'ready_to_record', label: 'Ready to Record', color: 'border-orange-200 text-orange-800 bg-orange-50' },
    { key: 'scheduled', label: 'Scheduled', color: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
    { key: 'published', label: 'Published', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' }
  ];

  const stageKeys = stages.map((s) => s.key);

  const getNextStage = (current: PipelineStage): PipelineStage | null => {
    const idx = stageKeys.indexOf(current);
    return idx < stageKeys.length - 1 ? stageKeys[idx + 1] : null;
  };

  const getPrevStage = (current: PipelineStage): PipelineStage | null => {
    const idx = stageKeys.indexOf(current);
    return idx > 0 ? stageKeys[idx - 1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
              <Layers className="w-3 h-3 text-orange-600" /> Lifecycle Workflow
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1.5 tracking-tight">Content Production Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
            Visual kanban board tracking ideas from approval through AI scripting, review, recording, and publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Total In Flight: <strong className="text-gray-900 font-bold">{pipeline.length} items</strong>
          </span>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {stages.map((stage) => {
          const items = pipeline.filter((p) => p.stage === stage.key);
          return (
            <div
              key={stage.key}
              className="bg-white border border-gray-200 rounded-xl p-3 min-h-[450px] flex flex-col shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${stage.color}`}>
                    {items.length}
                  </span>
                  <span className="text-xs font-bold text-gray-900 tracking-tight">{stage.label}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-[11px] border border-dashed border-gray-200 rounded-lg">
                    Empty Stage
                  </div>
                ) : (
                  items.map((item) => {
                    const next = getNextStage(item.stage);
                    const prev = getPrevStage(item.stage);

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              item.format === 'Reel'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {item.format}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[90px]">
                            {item.contentPillar}
                          </span>
                        </div>

                        <h4 className="font-semibold text-gray-900 leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        {item.targetDate && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Target: {item.targetDate}</span>
                          </div>
                        )}

                        {/* Script button */}
                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenScript(item.scriptId, item.topicId)}
                            className="px-2 py-1 text-[10px] font-semibold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-orange-600" />
                            {item.scriptId ? 'View Script' : 'Create Script'}
                          </button>

                          {/* Stage Transition Controls */}
                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                type="button"
                                onClick={() => onUpdateStage(item.id, prev)}
                                title={`Move back to ${prev.replace('_', ' ')}`}
                                className="p-1 rounded bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {next && (
                              <button
                                type="button"
                                onClick={() => onUpdateStage(item.id, next)}
                                title={`Advance to ${next.replace('_', ' ')}`}
                                className="p-1 rounded bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
