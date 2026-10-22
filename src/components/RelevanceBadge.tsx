import React, { useState } from 'react';
import { RelevanceScore } from '../types';

interface RelevanceBadgeProps {
  scoreObj?: RelevanceScore;
  showReasonInline?: boolean;
}

export const RelevanceBadge: React.FC<RelevanceBadgeProps> = ({ scoreObj, showReasonInline }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!scoreObj) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-[#94A3B8] bg-[#FAF8F4] dark:bg-[#1E2A5A]">
        --
      </span>
    );
  }

  const { score, reason } = scoreObj;

  let colorClasses = 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1]';
  if (score >= 70) {
    colorClasses = 'bg-[#E0EFE8] dark:bg-[#1B8A5A]/25 text-[#1B8A5A] dark:text-[#4ADE80] border-[#1B8A5A]/30';
  } else if (score >= 40) {
    colorClasses = 'bg-[#FEF3C7] dark:bg-[#C77700]/25 text-[#92400E] dark:text-[#FBBF24] border-[#C77700]/30';
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px] border shadow-2xs cursor-help transition-transform hover:scale-105 ${colorClasses}`}
        title={reason}
      >
        {score}
      </button>

      {showReasonInline && reason && (
        <span className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate max-w-[200px]" title={reason}>
          {reason}
        </span>
      )}

      {showTooltip && reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 rounded-lg bg-[#0F1733] text-white text-[11px] leading-tight shadow-xl z-30 pointer-events-none">
          <p className="font-semibold text-[#0E9AA7] mb-0.5">Fit Score: {score}/100</p>
          <p className="text-[#CBD5E1]">{reason}</p>
        </div>
      )}
    </div>
  );
};
