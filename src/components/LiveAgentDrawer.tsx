import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Eye,
  Terminal,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { StepLog, Watch } from '../types';

interface LiveAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watch: Watch | null;
  runStatus: 'IDLE' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  streamingUrl: string | null;
  steps: StepLog[];
  elapsedSeconds: number;
  resultSummary: string | null;
  errorMessage: string | null;
  onCancel: () => void;
  onViewResults: () => void;
}

export const LiveAgentDrawer: React.FC<LiveAgentDrawerProps> = ({
  isOpen,
  onClose,
  watch,
  runStatus,
  streamingUrl,
  steps,
  elapsedSeconds,
  resultSummary,
  errorMessage,
  onCancel,
  onViewResults,
}) => {
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps.length]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [streamingUrl]);

  if (!isOpen || !watch) return null;

  const isFinished = runStatus === 'COMPLETED' || runStatus === 'FAILED' || runStatus === 'CANCELLED';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (runStatus) {
      case 'STARTING':
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#CFEDEF] text-[#0E9AA7] dark:bg-[#0E9AA7]/20 dark:text-[#76E4EC]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{runStatus === 'STARTING' ? 'Starting...' : 'Agent Working...'}</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0EFE8] text-[#1B8A5A] dark:bg-[#1B8A5A]/20 dark:text-[#4ADE80]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FDE8E8] text-[#C0392B] dark:bg-[#C0392B]/20 dark:text-[#F87171]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#64748B] dark:bg-[#334155] dark:text-[#94A3B8]">
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full lg:w-[92%] xl:w-[86%] h-full bg-[#FFFFFF] dark:bg-[#131B3A] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-agent-title"
      >
        {/* Header Bar */}
        <div className="h-16 px-6 border-b border-[#E7E2D8] dark:border-[#24305E] flex items-center justify-between gap-4 bg-[#FAF8F4]/50 dark:bg-[#1A234A]/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0E9AA7]/10 dark:bg-[#0E9AA7]/20 text-[#0E9AA7] flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="live-agent-title" className="font-display font-semibold text-base sm:text-lg text-[#1E2A5A] dark:text-white truncate">
                  {watch.name}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-[#94A3B8] truncate">{watch.url}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Elapsed Timer */}
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E2A5A] px-2.5 py-1 rounded-md border border-[#E7E2D8] dark:border-[#24305E]">
              <Clock className="w-3.5 h-3.5 text-[#0E9AA7]" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {!isFinished ? (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#C0392B] hover:bg-[#FDE8E8] dark:hover:bg-[#C0392B]/20 border border-[#C0392B]/30 transition-colors"
              >
                Cancel Run
              </button>
            ) : (
              <button
                onClick={onViewResults}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-xs transition-colors"
              >
                <span>View Results</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Completion Banner (if finished) */}
        {resultSummary && (
          <div className="bg-[#E0EFE8] dark:bg-[#1B8A5A]/25 border-b border-[#1B8A5A]/30 px-6 py-2.5 flex items-center justify-between text-xs text-[#1B8A5A] dark:text-[#4ADE80] font-medium shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resultSummary}</span>
            </div>
            <button
              onClick={onViewResults}
              className="underline hover:text-[#0B7F8A] font-semibold"
            >
              Inspect items & alerts →
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-[#FDE8E8] dark:bg-[#C0392B]/25 border-b border-[#C0392B]/30 px-6 py-2.5 flex items-center gap-2 text-xs text-[#C0392B] dark:text-[#F87171] font-medium shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Split Container: Left Browser Frame, Right Step Log */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Browser Window Mock Frame */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 bg-[#FAF8F4]/70 dark:bg-[#0E152E]/60 border-b lg:border-b-0 lg:border-r border-[#E7E2D8] dark:border-[#24305E] overflow-hidden">
            <div className="flex-1 flex flex-col rounded-xl border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#172147] shadow-sm overflow-hidden">
              {/* Browser chrome header */}
              <div className="h-10 px-4 bg-[#F8FAFC] dark:bg-[#1E2A5A] border-b border-[#E7E2D8] dark:border-[#24305E] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>

                {/* URL Bar */}
                <div className="flex-1 max-w-xl mx-2 px-3 py-1 bg-white dark:bg-[#131B3A] border border-[#E2E8F0] dark:border-[#2A396E] rounded-md flex items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <span className="truncate font-mono">{watch.url}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#E8734A] animate-ping" />
                    <span className="text-[10px] font-bold tracking-wider text-[#E8734A] uppercase">
                      LIVE
                    </span>
                  </div>
                </div>

                {streamingUrl && (
                  <a
                    href={streamingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#0E9AA7] dark:text-[#76E4EC] hover:underline flex items-center gap-1 shrink-0"
                    title="Open live view in new tab"
                  >
                    <span className="hidden sm:inline">New tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Browser Body / Iframe */}
              <div className="relative flex-1 bg-white dark:bg-[#0B1024] overflow-hidden flex items-center justify-center">
                {streamingUrl ? (
                  <>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#FAF8F4]/80 dark:bg-[#131B3A]/80 z-10">
                        <div className="w-12 h-12 rounded-full border-2 border-[#0E9AA7]/20 border-t-[#0E9AA7] animate-spin" />
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                          Connecting agent video stream...
                        </p>
                      </div>
                    )}
                    <iframe
                      src={streamingUrl}
                      title="TinyFish Live Browser View"
                      className="w-full h-full border-0"
                      referrerPolicy="no-referrer"
                      allow="fullscreen"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#CFEDEF]/50 dark:bg-[#0E9AA7]/10 flex items-center justify-center mb-4 text-[#0E9AA7]">
                      <Radio className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="font-display font-medium text-lg text-[#1E2A5A] dark:text-white mb-1">
                      {runStatus === 'STARTING'
                        ? 'Booting Headless Browser Session'
                        : 'Autonomous Web Agent Active'}
                    </h3>
                    <p className="text-xs text-[#94A3B8] max-w-sm mb-4">
                      {watch.stealth
                        ? 'Stealth profile enabled. Connecting through Indian residential proxy to bypass bot-detection.'
                        : 'The agent will stream its live view directly here once the browser pipeline connects.'}
                    </p>
                    <div className="w-48 h-2 bg-[#E2E8F0] dark:bg-[#24305E] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0E9AA7] rounded-full animate-pulse-subtle w-3/4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Step Log Timeline */}
          <div className="w-full lg:w-96 xl:w-[420px] flex flex-col bg-white dark:bg-[#131B3A] overflow-hidden shrink-0">
            <div className="px-5 py-3 border-b border-[#E7E2D8] dark:border-[#24305E] flex items-center justify-between bg-[#FAF8F4]/40 dark:bg-[#172147]/40 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#0E9AA7]" />
                <h3 className="text-xs font-semibold tracking-wider uppercase text-[#1E2A5A] dark:text-white">
                  Agent Step Log
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#94A3B8]">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>

            {/* Scrollable Timeline */}
            <div
              className="flex-1 p-5 overflow-y-auto space-y-3 font-sans text-xs"
              aria-live="polite"
              aria-relevant="additions"
            >
              {steps.length === 0 ? (
                <div className="py-12 text-center text-[#94A3B8]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0E9AA7]" />
                  <p>Awaiting first agent action...</p>
                </div>
              ) : (
                steps.map((st, idx) => {
                  const isLatest = idx === steps.length - 1 && !isFinished;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                        isLatest
                          ? 'bg-[#CFEDEF]/20 dark:bg-[#0E9AA7]/10 border-[#0E9AA7]/30 text-[#1E2A5A] dark:text-white'
                          : 'bg-[#FAF8F4]/40 dark:bg-[#1A234A]/40 border-[#E7E2D8]/60 dark:border-[#24305E]/60 text-[#475569] dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isLatest ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0E9AA7] border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#1B8A5A] text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium break-words">{st.purpose}</p>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          {new Date(st.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={stepsEndRef} />
            </div>

            {/* Footer Summary / Actions */}
            <div className="p-4 border-t border-[#E7E2D8] dark:border-[#24305E] bg-[#FAF8F4]/50 dark:bg-[#172147]/50 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {isFinished ? 'Execution ended' : 'Running autonomous check'}
              </span>
              {isFinished && (
                <button
                  onClick={onViewResults}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white transition-colors"
                >
                  View Snapshot
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
