import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Plus,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Share2,
} from 'lucide-react';
import { Watch } from '../types';
import { parseAnyDate } from '../services/diffEngine';
import {
  buildGoogleCalendarUrl,
  DeadlineEventItem,
  downloadIcsFile,
  generateIcsCalendar,
} from '../services/icsGenerator';

interface CalendarPageProps {
  watches: Watch[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ watches }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Collect all items with deadline field
  const validEvents: DeadlineEventItem[] = [];
  const unparseableDeadlines: Array<{
    watchName: string;
    itemTitle: string;
    rawDate: string;
  }> = [];

  for (const w of watches) {
    if (w.snapshot && w.snapshot.items) {
      for (const item of w.snapshot.items) {
        if (item.deadline) {
          const raw = String(item.deadline).trim();
          const parsed = parseAnyDate(raw);
          const title = item.title || item.name || 'Untitled item';
          if (parsed) {
            validEvents.push({
              watchId: w.id,
              watchName: w.name,
              itemTitle: title,
              rawDate: raw,
              parsedDate: parsed,
              link: item.link || w.url,
              details: item.details || item.eligibility || item.location,
            });
          } else {
            unparseableDeadlines.push({
              watchName: w.name,
              itemTitle: title,
              rawDate: raw,
            });
          }
        }
      }
    }
  }

  // Sort upcoming
  validEvents.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Month grid helpers
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const monthName = currentMonthDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Urgency indicator for an event
  const getUrgencyColor = (date: Date) => {
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'bg-[#C0392B]'; // red
    if (diffDays <= 7) return 'bg-[#C77700]'; // amber
    return 'bg-[#0E9AA7]'; // teal
  };

  const formatDaysLeft = (date: Date) => {
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    return `${diffDays} days left`;
  };

  // Filter events by selected day or showPast
  const displayedEvents = validEvents.filter((ev) => {
    const evDate = new Date(ev.parsedDate);
    evDate.setHours(0, 0, 0, 0);

    if (!showPast && evDate.getTime() < today.getTime()) {
      return false;
    }

    if (selectedDay !== null) {
      return (
        evDate.getFullYear() === year &&
        evDate.getMonth() === month &&
        evDate.getDate() === selectedDay
      );
    }

    return true;
  });

  const handleExportAll = () => {
    if (validEvents.length === 0) return;
    const ics = generateIcsCalendar(validEvents);
    downloadIcsFile('watchdog-deadlines.ics', ics);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8] dark:border-[#24305E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0E9AA7]/10 text-[#0E9AA7] flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
              Deadline Calendar
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Consolidated application dates, cut-offs, and grant deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded text-[#0E9AA7] focus:ring-[#0E9AA7]"
            />
            <span>Show past deadlines</span>
          </label>

          {validEvents.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export all (.ics)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Calendar Month View, Right Upcoming List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Month View (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#1E2A5A] dark:text-white">
                {monthName}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-[#E7E2D8] dark:border-[#24305E] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] text-[#475569] dark:text-[#94A3B8]"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-[#E7E2D8] dark:border-[#24305E] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] text-[#475569] dark:text-[#94A3B8]"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-[#94A3B8] uppercase tracking-wider mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 sm:h-14" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const cellDate = new Date(year, month, dayNum);
                cellDate.setHours(0, 0, 0, 0);

                const isToday = cellDate.getTime() === today.getTime();
                const isSelected = selectedDay === dayNum;

                // Find matching events for this day
                const dayEvents = validEvents.filter((ev) => {
                  const evD = new Date(ev.parsedDate);
                  return (
                    evD.getFullYear() === year &&
                    evD.getMonth() === month &&
                    evD.getDate() === dayNum
                  );
                });

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(isSelected ? null : dayNum)}
                    className={`h-12 sm:h-14 p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[#0E9AA7] bg-[#CFEDEF]/30 dark:bg-[#0E9AA7]/20'
                        : isToday
                        ? 'border-[#0E9AA7] bg-[#FAF8F4] dark:bg-[#1E2A5A] font-bold'
                        : 'border-[#E7E2D8]/50 dark:border-[#24305E]/50 hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A]/50'
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isToday
                          ? 'text-[#0E9AA7] font-bold'
                          : 'text-[#1E2A5A] dark:text-[#CBD5E1]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Urgency Dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${getUrgencyColor(ev.parsedDate)}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency Legend */}
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-4 mt-4 border-t border-[#E7E2D8] dark:border-[#24305E]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C0392B]" />
                <span>&le; 3 days</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C77700]" />
                <span>&le; 7 days</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0E9AA7]" />
                <span>Later</span>
              </span>
            </div>
            {selectedDay !== null && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[#0E9AA7] hover:underline"
              >
                Clear date filter
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-[#1E2A5A] dark:text-white">
              {selectedDay !== null
                ? `Deadlines for Day ${selectedDay}`
                : 'Upcoming Deadlines'}
            </h3>
            <span className="text-xs font-mono text-[#94A3B8]">
              {displayedEvents.length} items
            </span>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="flex-1 py-12 text-center text-xs text-[#94A3B8] italic flex flex-col items-center justify-center">
              <CalendarCheck className="w-8 h-8 text-[#94A3B8] mb-2 opacity-50" />
              <p>No deadlines found for this selection.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {displayedEvents.map((ev, idx) => {
                const daysLeft = formatDaysLeft(ev.parsedDate);
                const isUrgent = daysLeft.includes('Today') || daysLeft.includes('1') || daysLeft.includes('2');
                const gcalUrl = buildGoogleCalendarUrl(ev);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAF8F4] dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-[#1E2A5A] dark:text-white line-clamp-2">
                          {ev.itemTitle}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                          {ev.watchName} · {ev.rawDate}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          isUrgent
                            ? 'bg-[#FDE8E8] text-[#C0392B]'
                            : 'bg-[#CFEDEF] text-[#0E9AA7]'
                        }`}
                      >
                        {daysLeft}
                      </span>
                    </div>

                    {/* Actions: Add to Google Cal & Download .ics */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E7E2D8]/60 dark:border-[#24305E]/60 text-xs">
                      {ev.link ? (
                        <a
                          href={ev.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#94A3B8] hover:text-[#0E9AA7] flex items-center gap-1 text-[11px]"
                        >
                          <span>Open link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#475569] dark:text-[#E2E8F0] hover:text-[#0E9AA7] transition-colors"
                          title="Open Google Calendar quick add"
                        >
                          Google Cal
                        </a>
                        <button
                          onClick={() => {
                            const ics = generateIcsCalendar([ev]);
                            downloadIcsFile(`deadline-${ev.itemTitle}.ics`, ics);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#475569] dark:text-[#E2E8F0] hover:text-[#0E9AA7] transition-colors flex items-center gap-1"
                          title="Download .ics event file"
                        >
                          <Download className="w-3 h-3" />
                          <span>.ics</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unparseable dates card */}
      {unparseableDeadlines.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FEF3C7]/40 dark:bg-[#C77700]/10 border border-[#C77700]/30 text-xs">
          <div className="flex items-center gap-2 text-[#92400E] dark:text-[#FBBF24] font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Couldn&apos;t read this date ({unparseableDeadlines.length} items)</span>
          </div>
          <p className="text-[#94A3B8] mb-2">
            The following items contained text in deadline fields that did not resolve to standard dates:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {unparseableDeadlines.map((u, i) => (
              <div
                key={i}
                className="p-2 rounded-xl bg-white dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E]"
              >
                <p className="font-medium text-[#1E2A5A] dark:text-white truncate">{u.itemTitle}</p>
                <p className="font-mono text-[#E8734A] text-[11px] truncate">&quot;{u.rawDate}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
