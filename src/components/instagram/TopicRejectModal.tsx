import React, { useState } from 'react';
import { X, AlertTriangle, Lightbulb } from 'lucide-react';
import { TopicIdea } from '../../types/instagram';

interface TopicRejectModalProps {
  topic: TopicIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicId: string, category: string, feedback: string) => void;
}

export const TopicRejectModal: React.FC<TopicRejectModalProps> = ({
  topic,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [category, setCategory] = useState<'Too Generic' | 'Relevance' | 'Off-Brand' | 'Overdone' | 'Low Value' | 'Other'>('Too Generic');
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !topic) return null;

  const categories = [
    { key: 'Too Generic', label: 'Too Generic / Fluffy', desc: 'Lacks specific depth, math, or actionable mechanics' },
    { key: 'Relevance', label: 'Audience Irrelevant', desc: 'Does not fit target demographic profile' },
    { key: 'Off-Brand', label: 'Off-Brand Tone', desc: 'Violates brand voice or uses hypey/forbidden phrasing' },
    { key: 'Overdone', label: 'Overdone / Saturated', desc: 'Topic has been covered repeatedly by competitors' },
    { key: 'Low Value', label: 'Low Tactical Value', desc: 'Too superficial to trigger saves or shares' },
    { key: 'Other', label: 'Other / Custom', desc: 'Specific compliance, statutory, or editorial concern' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    onSubmit(topic.id, category, feedback.trim());
    setFeedback('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Reject Topic & Train AI Engine</h3>
              <p className="text-xs text-gray-500">Your feedback directly refines future prompts and skill versions</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Rejecting Topic</span>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{topic.title}</p>
            <p className="text-xs text-gray-600 mt-1 line-clamp-1 italic">"{topic.hook}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key as any)}
                  className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                    category === c.key
                      ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-gray-900">{c.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Specific Feedback / Directive
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Avoid generic quotes. We need concrete loan math and actionable steps..."
              rows={3}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2 text-xs">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="leading-relaxed">
              When 3+ rejections share similar feedback, the AI Feedback Loop automatically clusters them and drafts a new skill rule proposal for your approval.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
            >
              Confirm Rejection & Train AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
