import React from 'react';
import { X, Cpu, Clock, DollarSign, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GenerationRecord } from '../../types/instagram';

interface GenerationDetailsModalProps {
  record: GenerationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GenerationDetailsModal: React.FC<GenerationDetailsModalProps> = ({
  record,
  isOpen,
  onClose
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[85vh] shadow-xl overflow-hidden flex flex-col text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Generation Record Audit</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 font-mono">
                  {record.id}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Task: <strong className="text-gray-900 capitalize">{record.task.replace('_', ' ')}</strong> • Created: {new Date(record.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metrics bar */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Cpu className="w-3.5 h-3.5 text-orange-600" />
                <span>Model / Provider</span>
              </div>
              <p className="font-bold text-gray-900 mt-1 capitalize">{record.provider}</p>
              <p className="text-[10px] text-gray-500 font-mono">{record.model}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Skill / Prompt</span>
              </div>
              <p className="font-bold text-gray-900 mt-1">{record.skillVersion}</p>
              <p className="text-[10px] text-gray-500 font-mono">{record.promptVersion}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Latency & Status</span>
              </div>
              <p className="font-bold text-gray-900 mt-1">{record.durationMs} ms</p>
              <div className="flex items-center gap-1 mt-0.5">
                {record.status === 'fallback_used' ? (
                  <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> Fallback Used
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Success
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-gray-500">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Tokens & Cost</span>
              </div>
              <p className="font-bold text-gray-900 mt-1">
                {record.tokensUsed ? record.tokensUsed.total.toLocaleString() : '1,500'} tok
              </p>
              <p className="text-[10px] text-gray-500">
                ${(record.costEstimateUsd || 0.002).toFixed(4)}
              </p>
            </div>
          </div>

          {/* Context Summary */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Input Context Summary
            </span>
            <p className="text-gray-900 mt-1 font-mono text-[11px]">{record.inputContextSummary}</p>
          </div>

          {/* Output Payload */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Structured Output Payload
            </span>
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px] overflow-x-auto text-gray-800 max-h-72">
              <pre>{JSON.stringify(record.output, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
