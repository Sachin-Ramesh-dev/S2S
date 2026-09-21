import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Video,
  Layers,
  Image as ImageIcon,
  List,
  CalendarDays,
  X,
  Check,
  Eye,
  AlertCircle,
  Info
} from 'lucide-react';
import { CalendarPost, InstagramAccount, PublicationSnapshot } from '../../types/instagram';
import { instagramApi } from '../../services/instagramApi';
import { useTheme } from '../../context/ThemeContext';

interface PublishingCalendarViewProps {
  account: InstagramAccount;
  calendar: CalendarPost[];
  snapshots: PublicationSnapshot[];
  onOpenRecord: (post: CalendarPost, snapshot: PublicationSnapshot | null) => void;
  onPostUpdated?: () => void;
}

export const PublishingCalendarView: React.FC<PublishingCalendarViewProps> = ({
  account,
  calendar,
  snapshots,
  onOpenRecord,
  onPostUpdated
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'draft' | 'published'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Reel' | 'Carousel' | 'Image'>('all');

  // Month navigation: default to currently selected date in calendar or current date
  const [currentDate, setCurrentDate] = useState(() => {
    if (calendar.length > 0 && calendar[0].scheduledDate) {
      const parts = calendar[0].scheduledDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  });

  // Reschedule Modal State
  const [reschedulePost, setReschedulePost] = useState<CalendarPost | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Add Post Modal
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<'Reel' | 'Carousel' | 'Image'>('Reel');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('18:30');

  // Filter posts based on status and format
  const filteredPosts = useMemo(() => {
    return calendar.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (formatFilter !== 'all' && p.format !== formatFilter) return false;
      return true;
    });
  }, [calendar, statusFilter, formatFilter]);

  // Handle Reschedule
  const handleOpenReschedule = (post: CalendarPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReschedulePost(post);
    setEditDate(post.scheduledDate);
    setEditTime(post.scheduledTime || '18:30');
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulePost) return;
    setIsSavingSchedule(true);
    try {
      // Updates the calendar delivery slot WITHOUT mutating the immutable PublicationSnapshot
      await instagramApi.updateCalendarPost(reschedulePost.id, {
        scheduledDate: editDate,
        scheduledTime: editTime
      });
      setReschedulePost(null);
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message}`);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await instagramApi.scheduleScript({
        title: newTitle,
        format: newFormat,
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'scheduled',
        accountId: account.id
      });
      setIsAddPostOpen(false);
      setNewTitle('');
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      alert(`Failed to add post: ${err.message}`);
    }
  };

  // Helper to find snapshot for a calendar post
  const getSnapshotForPost = (post: CalendarPost) => {
    return snapshots.find(s => s.id === post.publicationSnapshotId) || post.snapshot || null;
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid generation
  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Days array for month grid
  const monthDays = useMemo(() => {
    const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  // Today string for comparison
  const todayStr = new Date().toISOString().split('T')[0];

  // Group filtered posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    filteredPosts.forEach((post) => {
      const d = post.scheduledDate;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(post);
    });
    return map;
  }, [filteredPosts]);

  // Week view calculation: 7 days around currentDate
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 = Sun, 1 = Mon, ...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
    const monday = new Date(curr.setDate(diff));

    const days: Array<{ date: Date; dateStr: string; label: string; dayNum: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        label: d.toLocaleDateString('default', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return days;
  }, [currentDate]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="neo-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge neo-badge-lavender flex items-center gap-1.5 font-black">
              <CalendarIcon className="w-3.5 h-3.5" /> EDITORIAL DISPATCH CALENDAR
            </span>
            <span className="text-xs font-mono font-bold text-[#4B5563] dark:text-[#A1A1AA]">
              @{account.username}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111] dark:text-[#F5F3EC] font-display">
            PUBLISHING CALENDAR
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
            Plan publishing dates, optimize for algorithm drop-off windows, and inspect frozen publication snapshots.
          </p>
        </div>

        <button
          id="btn-add-calendar-post"
          type="button"
          onClick={() => setIsAddPostOpen(true)}
          className="neo-btn neo-btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Post / Schedule Slot</span>
        </button>
      </div>

      {/* Controls & Filters Bar */}
      <div className="neo-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border-2 border-[#171717] bg-[#F8F5EE] dark:bg-[#1A1A22] shadow-[2px_2px_0_#111111]">
            {(['all', 'scheduled', 'draft', 'published'] as const).map((st) => (
              <button
                key={st}
                id={`filter-calendar-${st}`}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize font-black transition-all cursor-pointer text-xs ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <select
            id="select-calendar-format"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className="neo-input px-3 py-2 text-xs font-bold"
          >
            <option value="all">All Formats</option>
            <option value="Reel">Reels</option>
            <option value="Carousel">Carousels</option>
            <option value="Image">Images</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl border-2 border-[#171717] bg-[#F8F5EE] dark:bg-[#1A1A22] shadow-[2px_2px_0_#111111]">
            <button
              id="btn-calendar-view-month"
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs ${
                viewMode === 'month'
                  ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                  : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              id="btn-calendar-view-week"
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs ${
                viewMode === 'week'
                  ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                  : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              id="btn-calendar-view-list"
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs ${
                viewMode === 'list'
                  ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                  : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111111]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTH VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div id="calendar-month-view" className="neo-card overflow-hidden">
          {/* Month Header Navigation */}
          <div className="p-4 border-b-2 border-[#171717] dark:border-[#383844] flex items-center justify-between bg-[#F8F5EE] dark:bg-[#1A1A22]">
            <div className="flex items-center gap-3">
              <h2 id="calendar-month-title" className="text-lg font-black uppercase text-[#111111] dark:text-white font-display">
                {monthYearStr}
              </h2>
              <button
                id="btn-calendar-today"
                type="button"
                onClick={handleToday}
                className="neo-btn neo-btn-secondary py-1 px-3 text-xs font-black"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-calendar-prev-month"
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="neo-btn neo-btn-secondary p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-calendar-next-month"
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="neo-btn neo-btn-secondary p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Column Days of Week Header */}
          <div className="grid grid-cols-7 border-b-2 border-[#171717] dark:border-[#383844] text-center text-[10px] uppercase font-black tracking-wider py-2 bg-[#F8F5EE] dark:bg-[#1A1A22] text-[#111111] dark:text-zinc-300">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* 7-Column Date Cells Grid: Strong Day Blocks */}
          <div className="grid grid-cols-7 divide-x-2 divide-y-2 divide-[#171717] dark:divide-[#383844] min-h-[560px]">
            {monthDays.map((cell, idx) => {
              const postsOnThisDay = postsByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  id={`calendar-cell-${cell.dateStr}`}
                  className={`min-h-[110px] p-2.5 flex flex-col justify-between transition-colors ${
                    !cell.isCurrentMonth
                      ? 'bg-black/5 dark:bg-black/30 text-zinc-400'
                      : isToday
                      ? 'bg-[#FFD66B]/20 dark:bg-[#FFD66B]/10'
                      : 'bg-white dark:bg-[#15151B]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-black w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isToday
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111]'
                          : cell.isCurrentMonth
                          ? 'border-transparent text-[#111111] dark:text-zinc-200'
                          : 'border-transparent text-zinc-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {postsOnThisDay.length > 0 && (
                      <span className="neo-badge neo-badge-lavender text-[9px] px-1.5 py-0.2">
                        {postsOnThisDay.length}
                      </span>
                    )}
                  </div>

                  {/* Post Chips inside Date Cell */}
                  <div className="space-y-1.5 overflow-y-auto max-h-24">
                    {postsOnThisDay.map((post) => {
                      const snapshot = getSnapshotForPost(post);

                      return (
                        <div
                          key={post.id}
                          id={`calendar-chip-${post.id}`}
                          onClick={() => onOpenRecord(post, snapshot)}
                          title={`${post.title} (${post.format} • ${post.scheduledTime || '18:30'}) - Click to inspect Publication Record`}
                          className="p-1.5 rounded-lg border-2 border-[#171717] text-[11px] font-black flex items-center justify-between gap-1 shadow-[2px_2px_0_#111111] transition-all cursor-pointer group bg-[#F8F5EE] dark:bg-[#1A1A22] hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="neo-badge neo-badge-sky text-[8px] px-1 py-0.2 shrink-0">
                              {post.format === 'Reel' ? 'REEL' : post.format === 'Carousel' ? 'CAR' : 'IMG'}
                            </span>
                            <span className="truncate leading-tight text-[#111111] dark:text-white font-bold">{post.title}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#FFD66B] text-[#111111] border border-[#171717]">
                              {post.scheduledTime || '18:30'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenReschedule(post, e)}
                              title="Reschedule"
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-orange-500 cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div id="calendar-week-view" className={`border rounded-2xl overflow-hidden shadow-sm ${
          isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
        }`}>
          {/* Week Header Navigation */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#262638] bg-[#14141c]' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex items-center gap-3">
              <h2 id="calendar-week-title" className="text-base font-bold text-slate-900 dark:text-white">
                Week of {weekDays[0].dateStr} – {weekDays[6].dateStr}
              </h2>
              <button
                type="button"
                onClick={handleToday}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                Current Week
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-calendar-prev-week"
                type="button"
                onClick={handlePrevWeek}
                title="Previous Week"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-calendar-next-week"
                type="button"
                onClick={handleNextWeek}
                title="Next Week"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Columns */}
          <div className="grid grid-cols-7 divide-x divide-zinc-800/40 dark:divide-zinc-800/40 min-h-[480px]">
            {weekDays.map((day, idx) => {
              const postsOnThisDay = postsByDate.get(day.dateStr) || [];
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  id={`week-col-${day.dateStr}`}
                  className={`p-3 flex flex-col space-y-3 ${
                    isToday ? (isDark ? 'bg-orange-950/10' : 'bg-orange-50/40') : ''
                  }`}
                >
                  <div className="text-center pb-2 border-b border-zinc-800/40">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">{day.label}</span>
                    <span
                      className={`text-sm font-bold font-mono w-7 h-7 mx-auto mt-0.5 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-[#EA580C] text-white' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>

                  {/* Scheduled Posts in this Day */}
                  <div className="space-y-2 flex-1">
                    {postsOnThisDay.map((post) => {
                      const snapshot = getSnapshotForPost(post);
                      return (
                        <div
                          key={post.id}
                          id={`week-card-${post.id}`}
                          onClick={() => onOpenRecord(post, snapshot)}
                          className={`p-2.5 rounded-xl border text-xs space-y-2 shadow-2xs transition-all cursor-pointer group ${
                            post.format === 'Reel'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-400'
                              : post.format === 'Carousel'
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:border-blue-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                              {post.format === 'Reel' && <Video className="w-3 h-3" />}
                              {post.format === 'Carousel' && <Layers className="w-3 h-3" />}
                              {post.format === 'Image' && <ImageIcon className="w-3 h-3" />}
                              <span>{post.format}</span>
                            </span>
                            <span className="font-mono font-bold">{post.scheduledTime || '18:30'}</span>
                          </div>

                          <p className="font-semibold text-xs leading-snug line-clamp-2 text-slate-900 dark:text-white">
                            {post.title}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[10px]">
                            <span className="text-zinc-400 font-mono">{post.timezone || 'Asia/Kolkata'}</span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenReschedule(post, e)}
                              className="text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Reschedule</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {postsOnThisDay.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[11px] text-zinc-600 dark:text-zinc-500 italic py-6">
                        No posts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIST VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div id="calendar-list-view" className={`border rounded-2xl overflow-hidden shadow-sm ${
          isDark ? 'bg-[#181824] border-[#2b2b3c]' : 'bg-white border-slate-200'
        }`}>
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-zinc-500" />
              <h3 className="font-bold text-sm text-zinc-300">No Scheduled Publications</h3>
              <p className="text-xs">No posts matching the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'border-[#262638] bg-[#14141c] text-zinc-400' : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Title &amp; Pillar</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Schedule Status</th>
                    <th className="py-3 px-4">Execution Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 dark:divide-zinc-800/40">
                  {filteredPosts.map((post) => {
                    const snapshot = getSnapshotForPost(post);
                    const executionStatus = snapshot?.executionStatus || (post.status === 'published' ? 'published' : 'idle');

                    return (
                      <tr
                        key={post.id}
                        id={`calendar-row-${post.id}`}
                        onClick={() => onOpenRecord(post, snapshot)}
                        className={`group transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#1f1f2e]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900 dark:text-white">{post.scheduledDate}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span>{post.scheduledTime || '18:30'}</span>
                            <span>({post.timezone || 'Asia/Kolkata'})</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              post.format === 'Reel'
                                ? 'bg-purple-500/20 text-purple-400'
                                : post.format === 'Carousel'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {post.format === 'Reel' && <Video className="w-3 h-3" />}
                            {post.format === 'Carousel' && <Layers className="w-3 h-3" />}
                            {post.format === 'Image' && <ImageIcon className="w-3 h-3" />}
                            <span>{post.format}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
                            {post.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">{post.pillar}</div>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-300 font-medium">
                          @{account.username}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 inline-block capitalize">
                            {post.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-700/40 text-zinc-300 border border-zinc-600/40 inline-block capitalize">
                            {executionStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-calendar-inspect-${post.id}`}
                              type="button"
                              onClick={() => onOpenRecord(post, snapshot)}
                              title="Inspect Publication Record"
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-calendar-reschedule-${post.id}`}
                              type="button"
                              onClick={(e) => handleOpenReschedule(post, e)}
                              title="Reschedule Slot"
                              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESCHEDULE MODAL */}
      {/* ========================================================================= */}
      {reschedulePost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="modal-reschedule-post"
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4 ${
              isDark ? 'bg-[#181820] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold">Reschedule Publication Slot</h3>
                <span className="text-[11px] text-zinc-400 font-mono">Format: {reschedulePost.format}</span>
              </div>
              <button
                id="btn-close-reschedule-modal"
                type="button"
                onClick={() => setReschedulePost(null)}
                className="cursor-pointer text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Immutability Callout */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Immutable Creative Protection:</span>
                <span className="text-[11px] leading-relaxed">
                  Rescheduling updates the delivery calendar. The approved PublicationSnapshot copy, slide order, and rendered media remain strictly immutable and frozen.
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Post Title:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{reschedulePost.title}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">
                  New Scheduled Date:
                </label>
                <input
                  id="input-reschedule-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 font-mono ${
                    isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">
                  New Scheduled Time:
                </label>
                <input
                  id="input-reschedule-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 font-mono ${
                    isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                  }`}
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Timezone: {reschedulePost.timezone || 'Asia/Kolkata'}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReschedulePost(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-reschedule"
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingSchedule ? 'Saving...' : 'Save New Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD POST MODAL */}
      {/* ========================================================================= */}
      {isAddPostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4 ${
            isDark ? 'bg-[#181820] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h3 className="text-sm font-bold">Add Editorial Post to Calendar</h3>
              <button
                type="button"
                onClick={() => setIsAddPostOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">Post Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Common Wealth Pitfalls to Avoid"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Reel">Reel</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Image">Image</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-300">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-[#121217] border-zinc-700 text-white' : 'border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddPostOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold cursor-pointer"
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
