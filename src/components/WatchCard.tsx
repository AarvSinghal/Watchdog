import React, { useState } from 'react';
import {
  Globe,
  Play,
  ExternalLink,
  MoreVertical,
  Pause,
  Edit2,
  Trash2,
  Clock,
  Shield,
  Tag,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Loader2,
  Layers,
} from 'lucide-react';
import { PricePoint, Watch } from '../types';

interface WatchCardProps {
  watch: Watch;
  onCheckNow: (watch: Watch) => void;
  onOpenDetails: (watch: Watch) => void;
  onEdit: (watch: Watch) => void;
  onTogglePause: (watch: Watch) => void;
  onDelete: (watch: Watch) => void;
  currencySymbol: string;
  isChecking?: boolean;
}

export const WatchCard: React.FC<WatchCardProps> = ({
  watch,
  onCheckNow,
  onOpenDetails,
  onEdit,
  onTogglePause,
  onDelete,
  currencySymbol,
  isChecking,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Extract domain for favicon
  let domain = '';
  try {
    domain = new URL(watch.url).hostname;
  } catch {
    domain = 'example.com';
  }

  // Calculate relative time
  const getRelativeTime = (ts: number | null) => {
    if (!ts) return 'Never checked';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  // Sparkline data if price template
  const isPrice = watch.template === 'price';
  let pricePoints: PricePoint[] = [];
  let isLowestSeen = false;
  let currentPrice: number | null = null;

  if (isPrice && watch.priceHistory) {
    const keys = Object.keys(watch.priceHistory);
    if (keys.length > 0) {
      pricePoints = watch.priceHistory[keys[0]] || [];
      if (pricePoints.length > 0) {
        currentPrice = pricePoints[pricePoints.length - 1].price;
        const lowest = Math.min(...pricePoints.map((p) => p.price));
        if (currentPrice <= lowest && pricePoints.length > 1) {
          isLowestSeen = true;
        }
      }
    }
  }

  const renderSparkline = () => {
    if (pricePoints.length < 2) return null;
    const prices = pricePoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    const width = 110;
    const height = 28;

    const points = prices.map((pr, idx) => {
      const x = (idx / (prices.length - 1)) * (width - 6) + 3;
      const y = height - ((pr - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return (
      <div className="flex items-center gap-1.5 shrink-0" title={`Price trend (${prices.length} points)`}>
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke="#0E9AA7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.join(' ')}
          />
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3"
            fill="#0E9AA7"
          />
        </svg>
      </div>
    );
  };

  const getStatusChip = () => {
    if (isChecking || watch.status === 'RUNNING') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#CFEDEF] text-[#0E9AA7] dark:bg-[#0E9AA7]/20 dark:text-[#76E4EC]">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Running</span>
        </span>
      );
    }
    if (watch.paused) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#64748B] dark:bg-[#334155] dark:text-[#94A3B8]">
          <Pause className="w-3 h-3" />
          <span>Paused</span>
        </span>
      );
    }
    if (watch.status === 'WARNING') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#FEF3C7] text-[#92400E] dark:bg-[#C77700]/20 dark:text-[#FBBF24]">
          <AlertTriangle className="w-3 h-3" />
          <span>Warning</span>
        </span>
      );
    }
    if (watch.status === 'FAILED') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#FDE8E8] text-[#C0392B] dark:bg-[#C0392B]/20 dark:text-[#F87171]">
          <span>Failed</span>
        </span>
      );
    }
    if (watch.lastChecked) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#E0EFE8] text-[#1B8A5A] dark:bg-[#1B8A5A]/20 dark:text-[#4ADE80]">
          <CheckCircle2 className="w-3 h-3" />
          <span>Healthy</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#FAF8F4] dark:bg-[#1E2A5A] text-[#94A3B8]">
        New
      </span>
    );
  };

  return (
    <div className="relative group bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5">
      {/* Top Bar: Favicon + Domain + Status + Menu */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] flex items-center justify-center overflow-hidden shrink-0">
              {!imgError ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  alt=""
                  onError={() => setImgError(true)}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <Globe className="w-4 h-4 text-[#94A3B8]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-mono text-[#94A3B8] truncate block">
                {domain}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {getStatusChip()}

            {/* Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
                aria-label="Tracker options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E] shadow-xl py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenDetails(watch);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] flex items-center gap-2 text-[#475569] dark:text-[#E2E8F0]"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View details & data</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onTogglePause(watch);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] flex items-center gap-2 text-[#475569] dark:text-[#E2E8F0]"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>{watch.paused ? 'Resume auto-checks' : 'Pause auto-checks'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(watch);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] flex items-center gap-2 text-[#475569] dark:text-[#E2E8F0]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit configuration</span>
                    </button>
                    <div className="h-px bg-[#E7E2D8] dark:bg-[#24305E] my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(watch);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#FDE8E8] dark:hover:bg-[#C0392B]/20 text-[#C0392B] flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete tracker</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Name and Badges */}
        <div
          onClick={() => onOpenDetails(watch)}
          className="cursor-pointer group-hover:text-[#0E9AA7] transition-colors"
        >
          <h3 className="font-display font-semibold text-base text-[#1E2A5A] dark:text-white line-clamp-2 mb-1.5">
            {watch.name}
          </h3>
        </div>

        {/* Lowest price seen badge */}
        {isLowestSeen && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E0EFE8] text-[#1B8A5A] dark:bg-[#1B8A5A]/20 dark:text-[#4ADE80] mb-2">
            <TrendingDown className="w-3 h-3" />
            <span>Lowest price seen!</span>
          </div>
        )}

        {/* Rule Chips */}
        {watch.rules && watch.rules.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 my-2.5">
            {watch.rules.map((rule, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8]"
              >
                {rule.field} {rule.op} {rule.value}
              </span>
            ))}
          </div>
        )}

        {/* Sparkline & Items count */}
        <div className="flex items-center justify-between gap-2 my-2 py-1 border-t border-b border-[#FAF8F4] dark:border-[#1E2A5A]">
          <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            <span className="font-semibold text-[#1E2A5A] dark:text-white">
              {watch.snapshot ? watch.snapshot.itemCount : 0}
            </span>{' '}
            items tracked
          </div>
          {renderSparkline()}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-sans mt-2">
          <span>Checked: {getRelativeTime(watch.lastChecked)}</span>
          <span className="capitalize">{watch.frequency} check</span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E7E2D8] dark:border-[#24305E]">
        <a
          href={watch.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0E9AA7] dark:hover:text-[#76E4EC] transition-colors py-1 px-1.5 rounded"
          title="Open watched website"
        >
          <span>Open link</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDetails(watch)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1E2A5A] dark:text-[#E2E8F0] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onCheckNow(watch)}
            disabled={isChecking || watch.status === 'RUNNING'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white disabled:opacity-50 transition-colors shadow-2xs"
          >
            {isChecking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Check now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
