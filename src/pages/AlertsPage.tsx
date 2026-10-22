import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AlertKind, WatchAlert } from '../types';
import { RelevanceBadge } from '../components/RelevanceBadge';

interface AlertsPageProps {
  alerts: WatchAlert[];
  onMarkAllRead: () => void;
  onClearAlerts: () => void;
  onNavigateToWatch: (watchId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onMarkAllRead,
  onClearAlerts,
  onNavigateToWatch,
}) => {
  const [filter, setFilter] = useState<'ALL' | AlertKind | 'UNREAD'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !a.read;
    return a.kind === filter;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  const getKindBadge = (kind: AlertKind) => {
    switch (kind) {
      case 'MATCH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0EFE8] text-[#1B8A5A] dark:bg-[#1B8A5A]/20 dark:text-[#4ADE80]">
            MATCH
          </span>
        );
      case 'NEW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#CFEDEF] text-[#0E9AA7] dark:bg-[#0E9AA7]/20 dark:text-[#76E4EC]">
            NEW
          </span>
        );
      case 'UPDATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#92400E] dark:bg-[#C77700]/20 dark:text-[#FBBF24]">
            UPDATED
          </span>
        );
      case 'DEADLINE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FDE8E8] text-[#C0392B] dark:bg-[#C0392B]/20 dark:text-[#F87171]">
            DEADLINE
          </span>
        );
      case 'REMOVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F1F5F9] text-[#64748B] dark:bg-[#334155] dark:text-[#94A3B8]">
            REMOVED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8] dark:border-[#24305E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8734A]/10 text-[#E8734A] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
              Alerts & Notifications
            </h1>
            <p className="text-xs text-[#94A3B8]">
              {unreadCount} unread · {alerts.length} total notifications recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white hover:bg-[#FAF8F4] dark:hover:bg-[#131B3A] transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-[#1B8A5A]" />
              <span>Mark all read</span>
            </button>
          )}

          {alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#C0392B] hover:bg-[#FDE8E8]/40 dark:hover:bg-[#C0392B]/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'MATCH', label: 'Rule Matches' },
          { id: 'NEW', label: 'New Items' },
          { id: 'UPDATED', label: 'Updates' },
          { id: 'DEADLINE', label: 'Deadlines' },
          { id: 'REMOVED', label: 'Removed' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-[#0E9AA7] text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E]">
          <Bell className="w-10 h-10 mx-auto text-[#94A3B8] mb-3 opacity-40" />
          <h3 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white mb-1">
            No alerts found
          </h3>
          <p className="text-xs text-[#94A3B8]">
            {filter === 'ALL'
              ? 'Watchdog will alert you whenever tracked websites detect new items or rule crosses.'
              : `No alerts currently match the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                !al.read
                  ? 'bg-white dark:bg-[#1A234A] border-[#0E9AA7]/40 shadow-xs ring-1 ring-[#0E9AA7]/20'
                  : 'bg-white/80 dark:bg-[#172147] border-[#E7E2D8] dark:border-[#24305E]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getKindBadge(al.kind)}
                  <button
                    onClick={() => onNavigateToWatch(al.watchId)}
                    className="text-xs font-semibold text-[#0E9AA7] hover:underline"
                  >
                    {al.watchName}
                  </button>
                  <span className="text-[#94A3B8] text-xs">·</span>
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    {new Date(al.timestamp).toLocaleString()}
                  </span>
                </div>

                {al.score && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] text-[#94A3B8]">Fit:</span>
                    <RelevanceBadge scoreObj={al.score} showReasonInline />
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold text-[#1E2A5A] dark:text-white mb-1">
                {al.message}
              </p>

              {/* Snapshot item preview */}
              {al.itemSnapshot && (
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8F4] dark:bg-[#131B3A] border border-[#E7E2D8]/60 dark:border-[#24305E] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-mono text-[#475569] dark:text-[#94A3B8] truncate max-w-md">
                    {al.itemKey}
                  </div>
                  <div className="flex items-center gap-3">
                    {al.itemSnapshot.link && (
                      <a
                        href={al.itemSnapshot.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0E9AA7] hover:underline flex items-center gap-1"
                      >
                        <span>Open item</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onNavigateToWatch(al.watchId)}
                      className="text-xs text-[#1E2A5A] dark:text-white font-medium hover:underline flex items-center gap-0.5"
                    >
                      <span>View in tracker</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
