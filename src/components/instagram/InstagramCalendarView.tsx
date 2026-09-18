import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Edit2,
  CheckCircle2,
  Layers,
  Video,
  ExternalLink,
  List,
  CalendarDays,
  X,
  Check
} from 'lucide-react';
import { CalendarPost, InstagramAccount, ScriptItem } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { useTheme } from '../../context/ThemeContext';

interface InstagramCalendarViewProps {
  account: InstagramAccount;
  calendar: CalendarPost[];
  scripts?: ScriptItem[];
  onOpenScript: (scriptId?: string) => void;
  onNavigateToScripts?: () => void;
  onPostUpdated?: () => void;
}

export const InstagramCalendarView: React.FC<InstagramCalendarViewProps> = ({
  account,
  calendar,
  scripts = [],
  onOpenScript,
  onNavigateToCalendar,
  onNavigateToScripts,
  onPostUpdated
}: any) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'draft' | 'published'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Reel' | 'Carousel' | 'Image'>('all');

  // Reschedule Modal
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Add Post Modal
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<'Reel' | 'Carousel'>('Reel');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('18:00');
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');

  const filteredPosts = calendar.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (formatFilter !== 'all' && p.format !== formatFilter) return false;
    return true;
  });

  const handleOpenReschedule = (post: CalendarPost) => {
    setEditingPost(post);
    setEditDate(post.scheduledDate);
    setEditTime(post.scheduledTime || '18:00');
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setIsSavingSchedule(true);
    try {
      await instagramApi.updateCalendarPost(editingPost.id, {
        scheduledDate: editDate,
        scheduledTime: editTime
      });
      setEditingPost(null);
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message}`);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleMarkPublished = async (post: CalendarPost) => {
    try {
      await instagramApi.updateCalendarPost(post.id, {
        status: 'published'
      });
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await instagramApi.scheduleScript({
        scriptId: selectedScriptId || undefined,
        title: newTitle,
        format: newFormat,
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'scheduled'
      });
      setIsAddPostOpen(false);
      setNewTitle('');
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      alert(`Failed to add post: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              <CalendarIcon className="w-3.5 h-3.5 text-orange-500" /> Editorial Publishing Calendar
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Account: <strong className={isDark ? 'text-white' : 'text-gray-900'}>@{account.username}</strong>
            </span>
          </div>
          <h1 className={`text-xl font-bold mt-1.5 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Content Scheduling & Distribution
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Plan publishing dates, optimize for algorithm drop-off windows, and track status.
          </p>
        </div>

        <button
          id="btn-add-calendar-post"
          type="button"
          onClick={() => setIsAddPostOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Post / Schedule Script</span>
        </button>
      </div>

      {/* Controls & Filters (Section 28 & 29) */}
      <div className={`border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Status Filter */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border ${
            isDark ? 'bg-[#121217] border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            {(['all', 'scheduled', 'draft', 'published'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? isDark ? 'bg-gray-800 text-white shadow-xs border border-gray-700' : 'bg-white text-gray-900 shadow-xs border border-gray-200'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className={`border text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none cursor-pointer ${
              isDark ? 'bg-[#121217] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
            }`}
          >
            <option value="all" className={isDark ? 'bg-[#181820]' : ''}>All Formats</option>
            <option value="Reel" className={isDark ? 'bg-[#181820]' : ''}>Reels</option>
            <option value="Carousel" className={isDark ? 'bg-[#181820]' : ''}>Carousels</option>
            <option value="Image" className={isDark ? 'bg-[#181820]' : ''}>Images</option>
          </select>
        </div>

        {/* View Mode Switcher: List vs Week vs Month */}
        <div className={`inline-flex rounded-lg border p-1 text-xs font-semibold ${
          isDark ? 'border-gray-700 bg-[#121217]' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'list'
                ? isDark ? 'bg-gray-800 text-white shadow-xs border border-gray-700' : 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'week'
                ? isDark ? 'bg-gray-800 text-white shadow-xs border border-gray-700' : 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Week</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'month'
                ? isDark ? 'bg-gray-800 text-white shadow-xs border border-gray-700' : 'bg-white text-gray-900 shadow-xs border border-gray-200'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Month</span>
          </button>
        </div>
      </div>

      {/* Calendar List View (Section 30) */}
      {filteredPosts.length === 0 ? (
        <div className={`border rounded-2xl p-12 text-center shadow-sm space-y-4 ${
          isDark ? 'bg-[#181820] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <CalendarIcon className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Content Calendar Is Empty</h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              You haven't scheduled any posts yet. Schedule ready scripts or add posts to maintain weekly consistency.
            </p>
          </div>
          {/* Section 32: The Next Obvious Step */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddPostOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Add Post
            </button>
            {onNavigateToScripts && (
              <button
                type="button"
                onClick={onNavigateToScripts}
                className={`px-4 py-2 font-semibold text-xs rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Schedule Script from Studio
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const linkedScript = scripts?.find((s) => s.id === post.scriptId);
            return (
              <div
                key={post.id}
                id={`calendar-card-${post.id}`}
                className={`p-5 rounded-xl border shadow-sm transition-all flex flex-col justify-between text-xs space-y-4 group ${
                  isDark
                    ? 'bg-[#181820] border-gray-800 hover:border-orange-500/60 text-white'
                    : 'bg-white border-gray-200 hover:border-orange-300 text-gray-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                        post.format === 'Reel'
                          ? isDark ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' : 'bg-purple-50 text-purple-700 border-purple-200'
                          : isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {post.format === 'Reel' ? <Video className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                      {post.format}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        post.status === 'published'
                          ? isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : post.status === 'scheduled'
                          ? isDark ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'
                          : isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <h3 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.title}</h3>

                  {linkedScript?.hook && (
                    <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed italic ${
                      isDark ? 'bg-orange-950/20 text-orange-200/90 border-orange-900/40' : 'bg-orange-50/70 text-orange-900 border-orange-200/70'
                    }`}>
                      <span className="font-bold not-italic text-[10px] uppercase tracking-wider block text-orange-500 mb-0.5">Linked Hook Angle:</span>
                      "{linkedScript.hook}"
                    </div>
                  )}

                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#141419] border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        {post.scheduledDate} at {post.scheduledTime || '18:00'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(post)}
                      title="Reschedule post"
                      className="text-[11px] font-semibold text-orange-500 hover:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Reschedule
                    </button>
                  </div>
                </div>

              {/* Bottom Actions (Section 31) */}
              <div className={`pt-3 border-t flex items-center justify-between ${
                isDark ? 'border-gray-800' : 'border-gray-100'
              }`}>
                {post.scriptId ? (
                  <button
                    type="button"
                    onClick={() => onOpenScript(post.scriptId)}
                    className="text-xs text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Script</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Manual Entry</span>
                )}

                {post.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => handleMarkPublished(post)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 border cursor-pointer ${
                      isDark
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <Check className="w-3 h-3" /> Mark Published
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Reschedule Modal (Section 31) */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-sm p-6 shadow-2xl text-xs ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Reschedule Post</h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className={`cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="mt-4 space-y-4">
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{editingPost.title}</p>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Scheduled Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Scheduled Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  {isSavingSchedule ? 'Saving...' : 'Save Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {isAddPostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs ${
            isDark ? 'bg-[#181820] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Post to Calendar</h3>
              <button
                type="button"
                onClick={() => setIsAddPostOpen(false)}
                className={`cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Post Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Simple Ways to Pay Off Credit Cards Faster"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              {scripts.length > 0 && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Link Existing Script (Optional)
                  </label>
                  <select
                    value={selectedScriptId}
                    onChange={(e) => {
                      setSelectedScriptId(e.target.value);
                      const s = scripts.find((x) => x.id === e.target.value);
                      if (s) {
                        setNewTitle(s.title);
                        setNewFormat(s.format as any);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="" className={isDark ? 'bg-[#181820]' : ''}>-- No linked script --</option>
                    {scripts.map((s) => (
                      <option key={s.id} value={s.id} className={isDark ? 'bg-[#181820]' : ''}>
                        {s.title} ({s.format})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Reel" className={isDark ? 'bg-[#181820]' : ''}>Reel</option>
                    <option value="Carousel" className={isDark ? 'bg-[#181820]' : ''}>Carousel</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddPostOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Schedule Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
