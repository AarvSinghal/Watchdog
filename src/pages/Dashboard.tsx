import React from 'react';
import {
  Radio,
  Plus,
  Play,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
  Bell,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { Watch, WatchAlert, AppSettings } from '../types';
import { CommandBar } from '../components/CommandBar';
import { WatchCard } from '../components/WatchCard';
import { RelevanceBadge } from '../components/RelevanceBadge';
import { parseAnyDate } from '../services/diffEngine';

interface DashboardProps {
  watches: Watch[];
  alerts: WatchAlert[];
  settings: AppSettings;
  onNavigate: (route: string) => void;
  onOpenWatch: (watch: Watch) => void;
  onCheckWatch: (watch: Watch) => void;
  onCheckAll: () => void;
  isCheckingAll: boolean;
  onEditWatch: (watch: Watch) => void;
  onTogglePause: (watch: Watch) => void;
  onDeleteWatch: (watch: Watch) => void;
  onSubmitPrompt: (text: string) => Promise<void>;
  isLoadingPrompt: boolean;
  onOpenManualModal: () => void;
  onTrySampleData: () => void;
  checkingWatchIds: Set<string>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  watches,
  alerts,
  settings,
  onNavigate,
  onOpenWatch,
  onCheckWatch,
  onCheckAll,
  isCheckingAll,
  onEditWatch,
  onTogglePause,
  onDeleteWatch,
  onSubmitPrompt,
  isLoadingPrompt,
  onOpenManualModal,
  onTrySampleData,
  checkingWatchIds,
}) => {
  // Compute Stats
  const totalItems = watches.reduce((sum, w) => sum + (w.snapshot?.itemCount || 0), 0);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentAlerts24h = alerts.filter((a) => a.timestamp >= oneDayAgo).length;

  // Find next upcoming deadline across all watches
  const allDeadlines: Array<{
    title: string;
    date: Date;
    rawDate: string;
    watchName: string;
    watchId: string;
  }> = [];

  for (const w of watches) {
    if (w.snapshot && w.snapshot.items) {
      for (const item of w.snapshot.items) {
        if (item.deadline) {
          const parsed = parseAnyDate(item.deadline);
          if (parsed && parsed.getTime() >= Date.now() - 24 * 3600 * 1000) {
            allDeadlines.push({
              title: item.title || item.name || 'Untitled item',
              date: parsed,
              rawDate: item.deadline,
              watchName: w.name,
              watchId: w.id,
            });
          }
        }
      }
    }
  }

  allDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextDeadline = allDeadlines[0];

  // Best matches for you across all watches (Top 5 by fit score)
  const allScoredItems: Array<{
    watchId: string;
    watchName: string;
    itemTitle: string;
    score: number;
    reason: string;
    link?: string;
  }> = [];

  for (const w of watches) {
    if (w.snapshot && w.snapshot.items && w.snapshot.scores) {
      for (const item of w.snapshot.items) {
        const key = item.title || item.name;
        const scoreObj = key ? w.snapshot.scores[key] : null;
        if (scoreObj && scoreObj.score > 0) {
          allScoredItems.push({
            watchId: w.id,
            watchName: w.name,
            itemTitle: key,
            score: scoreObj.score,
            reason: scoreObj.reason,
            link: item.link,
          });
        }
      }
    }
  }

  allScoredItems.sort((a, b) => b.score - a.score);
  const topMatches = allScoredItems.slice(0, 5);

  const formatDaysLeft = (targetDate: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `${diff} days left`;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-200">
      {/* Hero Band with Decorative Wash */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF8F4] via-[#CFEDEF]/30 to-[#ECE9F8]/40 dark:from-[#131B3A] dark:via-[#1A234A] dark:to-[#172147] border border-[#E7E2D8] dark:border-[#24305E] p-6 sm:p-10 shadow-sm">
        {/* Subtle decorative mesh blur */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0E9AA7]/10 via-[#ECE9F8]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-mono font-bold tracking-widest text-[#0E9AA7] dark:text-[#76E4EC] uppercase mb-2 inline-block">
            AUTONOMOUS WEB SURVEILLANCE
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#1E2A5A] dark:text-white tracking-tight leading-tight">
            One tracker for anything on the web.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Turn any URL into a personal tracker with real-time web agents, smart diff alerts, price trend charts, and deadline calendars.
          </p>
        </div>

        {/* Command Bar (F2) */}
        <CommandBar
          onSubmitPrompt={onSubmitPrompt}
          isLoading={isLoadingPrompt}
          onOpenManualModal={onOpenManualModal}
        />
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Watches Count */}
        <div className="bg-white dark:bg-[#172147] p-4 sm:p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] shadow-xs">
          <div className="flex items-center justify-between text-[#94A3B8] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Watches Active</span>
            <Layers className="w-4 h-4 text-[#0E9AA7]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
            {watches.length}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            {watches.filter((w) => !w.paused).length} auto-checking
          </p>
        </div>

        {/* Items Tracked */}
        <div className="bg-white dark:bg-[#172147] p-4 sm:p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] shadow-xs">
          <div className="flex items-center justify-between text-[#94A3B8] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Items Monitored</span>
            <TrendingUp className="w-4 h-4 text-[#0E9AA7]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
            {totalItems}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Live structured items</p>
        </div>

        {/* Alerts in 24h */}
        <div className="bg-white dark:bg-[#172147] p-4 sm:p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] shadow-xs">
          <div className="flex items-center justify-between text-[#94A3B8] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Alerts in 24h</span>
            <Bell className="w-4 h-4 text-[#E8734A]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
            {recentAlerts24h}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Meaningful changes detected</p>
        </div>

        {/* Next Deadline */}
        <div className="bg-white dark:bg-[#172147] p-4 sm:p-5 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] shadow-xs">
          <div className="flex items-center justify-between text-[#94A3B8] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Next Deadline</span>
            <CalendarIcon className="w-4 h-4 text-[#0E9AA7]" />
          </div>
          <div className="font-display text-lg sm:text-xl font-bold text-[#1E2A5A] dark:text-white truncate">
            {nextDeadline ? formatDaysLeft(nextDeadline.date) : 'None'}
          </div>
          <p className="text-[11px] text-[#94A3B8] truncate mt-1">
            {nextDeadline ? nextDeadline.title : 'No upcoming cut-offs'}
          </p>
        </div>
      </div>

      {/* Profile missing friendly prompt (F7) */}
      {!settings.profile && (
        <div className="bg-gradient-to-r from-[#FBE3D6]/40 via-white to-[#FAF8F4] dark:from-[#1E2A5A] dark:to-[#172147] p-4 sm:p-5 rounded-2xl border border-[#E8734A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8734A]/10 text-[#E8734A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-[#1E2A5A] dark:text-white">
                Set up your personal profile for fit scoring
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Add your background (e.g. &quot;2nd-year CS student, Python, Delhi&quot;) to rank items with relevance badges.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#E8734A] hover:bg-[#d6653d] text-white shrink-0 shadow-2xs"
          >
            Configure Profile →
          </button>
        </div>
      )}

      {/* Top Fits & Upcoming Deadlines Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Matches For You (F7) */}
        <div className="bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0E9AA7]" />
              <h3 className="font-display font-semibold text-base text-[#1E2A5A] dark:text-white">
                Best Matches For You
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">AI Fit Ranked</span>
          </div>

          {topMatches.length === 0 ? (
            <div className="flex-1 py-8 text-center text-xs text-[#94A3B8] italic">
              Run checks on watches to see personalized relevance matches scored against your profile.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topMatches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#1E2A5A]/50 border border-[#E7E2D8]/60 dark:border-[#24305E] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs text-[#1E2A5A] dark:text-white truncate">
                      {m.itemTitle}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                      {m.watchName} · {m.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RelevanceBadge scoreObj={{ score: m.score, reason: m.reason }} />
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#94A3B8] hover:text-[#0E9AA7]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines (F9) */}
        <div className="bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#0E9AA7]" />
              <h3 className="font-display font-semibold text-base text-[#1E2A5A] dark:text-white">
                Upcoming Deadlines
              </h3>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-[#0E9AA7] dark:text-[#76E4EC] hover:underline font-medium"
            >
              View calendar →
            </button>
          </div>

          {allDeadlines.length === 0 ? (
            <div className="flex-1 py-8 text-center text-xs text-[#94A3B8] italic">
              No items with upcoming deadlines found. Add an internship or scholarship tracker to populate!
            </div>
          ) : (
            <div className="space-y-2.5">
              {allDeadlines.slice(0, 5).map((dl, idx) => {
                const daysLeftStr = formatDaysLeft(dl.date);
                const isUrgent = daysLeftStr.includes('Today') || daysLeftStr.includes('1') || daysLeftStr.includes('2');
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#1E2A5A]/50 border border-[#E7E2D8]/60 dark:border-[#24305E] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs text-[#1E2A5A] dark:text-white truncate">
                        {dl.title}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                        {dl.watchName} · {dl.rawDate}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold shrink-0 ${
                        isUrgent
                          ? 'bg-[#FDE8E8] text-[#C0392B] dark:bg-[#C0392B]/20 dark:text-[#F87171]'
                          : 'bg-[#CFEDEF] text-[#0E9AA7] dark:bg-[#0E9AA7]/20 dark:text-[#76E4EC]'
                      }`}
                    >
                      {daysLeftStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Watches Grid Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1E2A5A] dark:text-white">
            Active Trackers
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Automated checks running every 30 seconds while Watchdog is open
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {watches.length > 0 && (
            <button
              onClick={onCheckAll}
              disabled={isCheckingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#0E9AA7] text-[#0E9AA7] dark:text-[#76E4EC] hover:bg-[#CFEDEF]/20 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCheckingAll ? 'Checking all...' : 'Check all'}</span>
            </button>
          )}

          <button
            onClick={onOpenManualModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-xs transition-colors ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Tracker</span>
          </button>
        </div>
      </div>

      {/* Watches Grid or Empty State */}
      {watches.length === 0 ? (
        /* Empty State with Radar Eye Illustration */
        <div className="relative rounded-3xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] p-8 sm:p-14 text-center shadow-sm overflow-hidden">
          {/* Animated radar rings and watchdog eye */}
          <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#0E9AA7]/40 animate-slow-spin" />
            {/* Reverse secondary ring */}
            <div className="absolute inset-3 rounded-full border border-[#0E9AA7]/20 animate-reverse-spin" />
            {/* Center radar eye */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#CFEDEF] via-[#FAF8F4] to-[#ECE9F8] dark:from-[#0E9AA7]/20 dark:to-[#1E2A5A] flex items-center justify-center shadow-inner">
              <Radio className="w-8 h-8 text-[#0E9AA7] animate-pulse" />
            </div>
            {/* Radar sweep */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#0E9AA7]/10 to-transparent animate-radar-sweep pointer-events-none" />
          </div>

          <h3 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white mb-2">
            No active trackers yet
          </h3>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
            Describe what you care about in the command bar above, create your first custom watcher, or load sample data to explore price charts and deadline calendars.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenManualModal}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-xs transition-colors"
            >
              Create your first watch
            </button>
            <button
              onClick={onTrySampleData}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-[#E7E2D8] dark:border-[#24305E] text-[#1E2A5A] dark:text-white hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
            >
              Try sample data
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {watches.map((watch) => (
            <WatchCard
              key={watch.id}
              watch={watch}
              onCheckNow={onCheckWatch}
              onOpenDetails={onOpenWatch}
              onEdit={onEditWatch}
              onTogglePause={onTogglePause}
              onDelete={onDeleteWatch}
              currencySymbol={settings.currency}
              isChecking={checkingWatchIds.has(watch.id)}
            />
          ))}
        </div>
      )}

      {/* Recent Alerts Feed preview */}
      {alerts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[#E7E2D8] dark:border-[#24305E]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0E9AA7]" />
              <h3 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
                Recent Alert Activity
              </h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-[#0E9AA7] dark:text-[#76E4EC] hover:underline font-medium"
            >
              View all alerts ({alerts.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 4).map((al) => (
              <div
                key={al.id}
                className="p-3.5 rounded-xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs flex items-start gap-3"
              >
                <span
                  className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                    al.kind === 'MATCH'
                      ? 'bg-[#E0EFE8] text-[#1B8A5A]'
                      : al.kind === 'DEADLINE'
                      ? 'bg-[#FDE8E8] text-[#C0392B]'
                      : al.kind === 'NEW'
                      ? 'bg-[#CFEDEF] text-[#0E9AA7]'
                      : 'bg-[#FAF8F4] text-[#64748B]'
                  }`}
                >
                  {al.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1E2A5A] dark:text-white truncate">
                    {al.message}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                    {al.watchName} · {new Date(al.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
