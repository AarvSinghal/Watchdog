import React, { Component, ErrorInfo, ReactNode, useEffect, useRef, useState } from 'react';
import { AppSettings, HealthStatus, RunRecord, StepLog, TemplateType, Watch, WatchAlert } from './types';
import {
  clearSampleData,
  generateInitialSampleData,
  loadAppData,
  loadSettings,
  saveAppData,
  saveSettings,
} from './services/storage';
import {
  fetchHealth,
  parseNaturalWatch,
  runAgentStream,
  scoreWatchItems,
  cancelAgentRun,
} from './services/agentClient';
import { computeWatchDiff } from './services/diffEngine';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LiveAgentDrawer } from './components/LiveAgentDrawer';
import { ReviewModal } from './components/ReviewModal';
import { ManualWatchModal } from './components/ManualWatchModal';

import { Dashboard } from './pages/Dashboard';
import { WatchDetailPage } from './pages/WatchDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

// Simple Hash Router Hook
function useHashRoute() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    return hash || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      setRoute(hash || 'dashboard');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newRoute: string) => {
    window.location.hash = `#/${newRoute}`;
  };

  return { route, navigate };
}

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Watchdog encountered an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#0F1733] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] shadow-xl">
            <h2 className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-[#94A3B8] mb-6">
              Watchdog caught an unexpected rendering issue. Your data in local storage is completely safe.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/dashboard';
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0E9AA7] text-white hover:bg-[#0B7F8A] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { route, navigate } = useHashRoute();

  // State
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [watches, setWatches] = useState<Watch[]>([]);
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);
  const [health, setHealth] = useState<HealthStatus>({
    tinyfishServerKey: false,
    llm: 'none',
    accessCodeRequired: false,
  });

  // Active check / Live view state
  const [activeLiveWatch, setActiveLiveWatch] = useState<Watch | null>(null);
  const [liveDrawerOpen, setLiveDrawerOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<
    'IDLE' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  >('IDLE');
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [liveSteps, setLiveSteps] = useState<StepLog[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null);

  const activeAbortController = useRef<AbortController | null>(null);
  const currentRunId = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  // Parallel checking tracking
  const [checkingWatchIds, setCheckingWatchIds] = useState<Set<string>>(new Set());
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  // Modals state
  const [reviewDraft, setReviewDraft] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Synchronized refs to avoid stale closures during async runs
  const watchesRef = useRef<Watch[]>(watches);
  useEffect(() => {
    watchesRef.current = watches;
  }, [watches]);

  const alertsRef = useRef<WatchAlert[]>(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Load health check on boot
  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
  }, []);

  // Load app data whenever sample mode changes or on mount
  useEffect(() => {
    const data = loadAppData(settings.isSampleMode);
    if (data.corrupted) {
      showToast('Corrupted storage reset cleanly.');
    }
    setWatches(data.watches);
    setAlerts(data.alerts);
  }, [settings.isSampleMode]);

  // Save app data whenever watches or alerts change
  const saveState = (newWatches: Watch[], newAlerts: WatchAlert[]) => {
    setWatches(newWatches);
    setAlerts(newAlerts);
    const res = saveAppData(newWatches, newAlerts, settings.isSampleMode);
    if (!res.success && res.error) {
      showToast(res.error);
    }
  };

  // TinyFish Connected check (either server env has key or user entered key)
  const isTinyFishConnected = Boolean(
    health.tinyfishServerKey || (settings.tinyFishApiKey && settings.tinyFishApiKey.trim())
  );

  // SCHEDULER: Check due watches every 30 seconds while open, max 2 concurrent runs
  useEffect(() => {
    if (!settings.autoCheckEnabled) return;

    const interval = setInterval(() => {
      runDueWatches();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runDueWatches();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [watches, settings.autoCheckEnabled, checkingWatchIds]);

  const runDueWatches = () => {
    const now = Date.now();
    const frequencyMs: Record<string, number> = {
      hourly: 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const due = watches.filter((w) => {
      if (w.paused || w.frequency === 'manual' || checkingWatchIds.has(w.id)) {
        return false;
      }
      const interval = frequencyMs[w.frequency] || Infinity;
      if (!w.lastChecked) return true;
      return now - w.lastChecked >= interval;
    });

    // Run up to 2 due watches at a time
    const batch = due.slice(0, 2);
    for (const w of batch) {
      executeWatchRun(w, false);
    }
  };

  // Generate realistic sample items when in sample mode
  const generateSampleItemsForTemplate = (template: TemplateType, name: string, url: string): any[] => {
    const now = Date.now();
    if (template === 'price') {
      const basePrice = Math.floor(Math.random() * 15000) + 45000;
      return [
        { name: name || 'Product Item Alpha', price: basePrice - 1200, in_stock: true, link: url },
        { name: (name || 'Product') + ' (Midnight Black)', price: basePrice + 2500, in_stock: true, link: url },
        { name: (name || 'Product') + ' (Pro Model)', price: basePrice + 9000, in_stock: false, link: url },
      ];
    }
    if (template === 'internship' || template === 'job') {
      const d1 = new Date(now + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const d2 = new Date(now + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      return [
        { title: 'Software Engineering Intern, Summer 2026', location: 'Bengaluru / Remote', deadline: d1, status: 'Actively Hiring', link: url },
        { title: 'Fullstack Platform Engineer', location: 'Delhi / Hybrid', deadline: d2, status: 'Open', link: url },
        { title: 'AI & Machine Learning Research Intern', location: 'Remote', deadline: null, status: 'Reviewing', link: url },
      ];
    }
    if (template === 'scholarship') {
      const d1 = new Date(now + 6 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      return [
        { name: name || 'National Tech Merit Fellowship', amount: '₹1,00,000 / year', eligibility: 'Engineering students with 8.0+ CGPA', deadline: d1, link: url },
        { name: 'Women in STEM Higher Education Grant', amount: '₹60,000 one-time', eligibility: 'Undergrad STEM students', deadline: '2026-11-20', link: url },
      ];
    }
    return [
      { title: name || 'Featured Page Item', value: '42 updates', details: 'Extracted directly from page structure', link: url },
      { title: 'Announcement Post #2', value: 'Active', details: 'Regular monitoring active', link: url },
    ];
  };

  // Single Watch Execution (Background or Foreground Live View)
  const executeWatchRun = async (watchToRun: Watch, isForeground: boolean) => {
    if (checkingWatchIds.has(watchToRun.id)) return;

    // Add to checking set
    setCheckingWatchIds((prev) => new Set(prev).add(watchToRun.id));

    if (isForeground) {
      setActiveLiveWatch(watchToRun);
      setLiveDrawerOpen(true);
      setLiveStatus('STARTING');
      setStreamingUrl(null);
      setLiveSteps([]);
      setElapsedSeconds(0);
      setResultSummary(null);
      setLiveErrorMessage(null);

      // Start elapsed seconds counter
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }

    const abortCtrl = new AbortController();
    activeAbortController.current = abortCtrl;
    const startTime = Date.now();
    const recordedSteps: StepLog[] = [];
    currentRunId.current = null;

    let finalStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WARNING' = 'COMPLETED';
    let finalResultData: any = null;
    let finalErrorMsg: string | null = null;
    let rawItems: any[] = [];
    let shapeValid = false;

    if (settings.isSampleMode || !isTinyFishConnected) {
      // Run realistic simulated agent check (Sample Mode or Demo Mode without external API key)
      if (isForeground) {
        setLiveStatus('RUNNING');
        const simSteps = [
          'Accessing page session',
          'Evaluating page DOM and interactive elements',
          'Parsing items against schema template',
          'Normalizing structured snapshot data',
        ];
        for (let i = 0; i < simSteps.length; i++) {
          await new Promise((r) => setTimeout(r, 600));
          recordedSteps.push({ purpose: simSteps[i], timestamp: Date.now() });
          if (isForeground) {
            setLiveSteps([...recordedSteps]);
          }
        }
      }
      rawItems = generateSampleItemsForTemplate(watchToRun.template, watchToRun.name, watchToRun.url);
      shapeValid = true;
      finalStatus = 'COMPLETED';
    } else {
      // Live Run against TinyFish Web Agent API
      try {
        await runAgentStream(
          {
            url: watchToRun.url,
            goal: watchToRun.goal,
            template: watchToRun.template,
            stealth: watchToRun.stealth,
            tinyFishApiKey: settings.tinyFishApiKey,
            accessCode: settings.accessCode,
          },
          {
            onStarted: (runId) => {
              currentRunId.current = runId;
              if (isForeground) setLiveStatus('RUNNING');
            },
            onStream: (streamUrl) => {
              if (isForeground) setStreamingUrl(streamUrl);
            },
            onProgress: (purpose, ts) => {
              recordedSteps.push({ purpose, timestamp: ts });
              if (isForeground) {
                setLiveSteps([...recordedSteps]);
              }
            },
            onHeartbeat: () => {
              // keep alive passed through
            },
            onComplete: (status, result, error) => {
              if (status === 'COMPLETED') {
                finalResultData = result;
              } else {
                finalStatus = 'FAILED';
                finalErrorMsg = error?.message || 'Agent failed to complete task';
              }
            },
            onError: (err) => {
              finalStatus = 'FAILED';
              finalErrorMsg = err.message || 'Stream connection error';
            },
          },
          abortCtrl.signal
        );
      } catch (err: any) {
        finalStatus = 'FAILED';
        finalErrorMsg = err.message || 'Run interrupted';
      } finally {
        if (timerRef.current) clearInterval(timerRef.current);
      }

      if (finalStatus === 'COMPLETED' && finalResultData) {
        if (Array.isArray(finalResultData)) {
          rawItems = finalResultData;
          shapeValid = true;
        } else if (Array.isArray(finalResultData.items)) {
          rawItems = finalResultData.items;
          shapeValid = true;
        } else if (Array.isArray(finalResultData.result)) {
          rawItems = finalResultData.result;
          shapeValid = true;
        } else if (typeof finalResultData === 'object' && finalResultData !== null) {
          const arrayVal =
            finalResultData.items ||
            finalResultData.result ||
            finalResultData.data ||
            finalResultData.products ||
            finalResultData.listings ||
            finalResultData.jobs ||
            finalResultData.scholarships ||
            Object.values(finalResultData).find((v) => Array.isArray(v));

          if (Array.isArray(arrayVal)) {
            rawItems = arrayVal;
            shapeValid = true;
          } else if (finalResultData.name || finalResultData.title || finalResultData.price) {
            rawItems = [finalResultData];
            shapeValid = true;
          } else {
            finalStatus = 'FAILED';
            finalErrorMsg =
              'The agent returned data in an unexpected shape. Check Live Agent View for details.';
          }
        } else {
          finalStatus = 'FAILED';
          finalErrorMsg =
            'The agent returned data in an unexpected shape (expected an items array).';
        }
      }

      if (!shapeValid && !finalErrorMsg) {
        if (!isTinyFishConnected) {
          finalErrorMsg = 'TinyFish API key missing. Please configure your key in Settings.';
        } else {
          finalErrorMsg = 'Check failed. The target page could not be read or blocked the agent. Try Stealth mode.';
        }
      }
    }

    const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Process snapshot & diff if result shape was valid
    let newAlertsGenerated: WatchAlert[] = [];
    let updatedWatch: Watch = { ...watchToRun };

    if (shapeValid) {
      const diff = computeWatchDiff(watchToRun, rawItems, settings.currency);
      newAlertsGenerated = diff.alerts;

      // Update price history if price template
      let updatedPriceHistory = { ...(watchToRun.priceHistory || {}) };
      if (watchToRun.template === 'price' && diff.status === 'SUCCESS') {
        const nowTs = Date.now();
        for (const it of diff.newSnapshot.items) {
          const itemKey = it.name || it.title;
          const numPrice = Number(it.price);
          if (itemKey && !isNaN(numPrice)) {
            const history = [...(updatedPriceHistory[itemKey] || [])];
            history.push({ time: nowTs, price: numPrice });
            // keep up to 200 points
            if (history.length > 200) history.shift();
            updatedPriceHistory[itemKey] = history;
          }
        }
      }

      // Compute relevance scores if user profile is present
      if (settings.profile && diff.status === 'SUCCESS' && diff.newSnapshot.items.length > 0) {
        try {
          const itemsToScore = diff.newSnapshot.items.slice(0, 25).map((it) => ({
            key: it.title || it.name || '',
            text: Object.entries(it)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' '),
          }));
          const scores = await scoreWatchItems(
            {
              profile: settings.profile,
              goal: watchToRun.goal,
              items: itemsToScore,
            },
            settings.tinyFishApiKey,
            settings.accessCode
          );
          if (scores.length > 0) {
            const scoreMap: Record<string, { score: number; reason: string }> = {
              ...(diff.newSnapshot.scores || {}),
            };
            for (const s of scores) {
              scoreMap[s.key] = { score: s.score, reason: s.reason };
            }
            diff.newSnapshot.scores = scoreMap;
          }
        } catch {
          // ignore scoring errors
        }
      }

      const runRecord: RunRecord = {
        id: `run-${Date.now()}`,
        startedAt: startTime,
        durationSeconds: duration,
        status: diff.status === 'WARNING' ? 'WARNING' : 'COMPLETED',
        itemCount: diff.newSnapshot.itemCount,
        newAlertCount: newAlertsGenerated.length,
        steps: recordedSteps.slice(0, 50),
        rawResultPreview: JSON.stringify(finalResultData || { items: rawItems }, null, 2),
      };

      const runsHistory = [runRecord, ...(watchToRun.runs || [])].slice(0, 10);

      updatedWatch = {
        ...watchToRun,
        snapshot: diff.newSnapshot,
        lastChecked: Date.now(),
        status: diff.status,
        lastStatusMessage: diff.statusMessage,
        priceHistory: updatedPriceHistory,
        runs: runsHistory,
      };

      if (isForeground) {
        setLiveStatus(diff.status === 'WARNING' ? 'COMPLETED' : 'COMPLETED');
        setResultSummary(
          `Found ${diff.newSnapshot.itemCount} items · ${newAlertsGenerated.length} new alerts`
        );
      }
    } else {
      // Run failed
      const runRecord: RunRecord = {
        id: `run-${Date.now()}`,
        startedAt: startTime,
        durationSeconds: duration,
        status: 'FAILED',
        itemCount: watchToRun.snapshot?.itemCount || 0,
        newAlertCount: 0,
        steps: recordedSteps.slice(0, 50),
        error: finalErrorMsg || 'Run failed',
      };

      updatedWatch = {
        ...watchToRun,
        status: 'FAILED',
        lastStatusMessage: finalErrorMsg || 'Check failed',
        runs: [runRecord, ...(watchToRun.runs || [])].slice(0, 10),
      };

      if (isForeground) {
        setLiveStatus('FAILED');
        setLiveErrorMessage(finalErrorMsg || 'Check failed');
      }
    }

    // Update global state using current ref to prevent dropping newly added watches
    const currentList = watchesRef.current;
    const exists = currentList.some((w) => w.id === updatedWatch.id);
    const nextWatches = exists
      ? currentList.map((w) => (w.id === updatedWatch.id ? updatedWatch : w))
      : [updatedWatch, ...currentList];
    const nextAlerts = [...newAlertsGenerated, ...alertsRef.current];
    saveState(nextWatches, nextAlerts);

    if (newAlertsGenerated.length > 0) {
      showToast(`${newAlertsGenerated.length} new alert(s) on "${watchToRun.name}"!`);
    }

    // Remove from checking set
    setCheckingWatchIds((prev) => {
      const next = new Set(prev);
      next.delete(watchToRun.id);
      return next;
    });
  };

  // Cancel running agent
  const handleCancelLiveRun = async () => {
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    if (currentRunId.current) {
      await cancelAgentRun(
        currentRunId.current,
        settings.tinyFishApiKey,
        settings.accessCode
      );
    }
    setLiveStatus('CANCELLED');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Check all watches (up to 3 parallel)
  const handleCheckAll = async () => {
    if (isCheckingAll || watches.length === 0) return;
    setIsCheckingAll(true);
    showToast('Running checks for all trackers...');

    const activeList = watches.filter((w) => !w.paused);
    for (let i = 0; i < activeList.length; i += 3) {
      const batch = activeList.slice(i, i + 3);
      await Promise.all(batch.map((w) => executeWatchRun(w, false)));
    }

    setIsCheckingAll(false);
    showToast('All checks finished!');
  };

  // Natural Language Prompt Handler (F2)
  const handleSubmitPrompt = async (text: string) => {
    setIsLoadingPrompt(true);
    try {
      const draft = await parseNaturalWatch(
        text,
        settings.tinyFishApiKey,
        settings.accessCode
      );
      setReviewDraft(draft);
      setReviewModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Could not parse tracker instruction');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleConfirmWatch = (
    draftData: Omit<Watch, 'id' | 'createdAt' | 'lastChecked' | 'nextCheck' | 'paused' | 'status'>,
    runImmediately: boolean
  ) => {
    const newWatch: Watch = {
      ...draftData,
      id: `watch-${Date.now()}`,
      createdAt: Date.now(),
      lastChecked: null,
      nextCheck: null,
      paused: false,
      status: 'IDLE',
      isSample: settings.isSampleMode,
    };

    const nextWatches = [newWatch, ...watchesRef.current];
    saveState(nextWatches, alertsRef.current);
    setReviewModalOpen(false);
    setManualModalOpen(false);

    if (runImmediately) {
      showToast(`Created "${newWatch.name}"! Starting initial check...`);
      executeWatchRun(newWatch, true);
    } else {
      showToast(`Created "${newWatch.name}"!`);
    }
  };

  // Sample data controls
  const handleTrySampleData = () => {
    const sample = generateInitialSampleData();
    saveAppData(sample.watches, sample.alerts, true);
    setSettings((s) => {
      const updated = { ...s, isSampleMode: true };
      saveSettings(updated);
      return updated;
    });
    setWatches(sample.watches);
    setAlerts(sample.alerts);
    showToast('Sample data loaded! Clearly badged SAMPLE.');
  };

  const handleExitSampleMode = () => {
    setSettings((s) => {
      const updated = { ...s, isSampleMode: false };
      saveSettings(updated);
      return updated;
    });
    showToast('Switched back to Live data namespace.');
  };

  const handleClearSampleData = () => {
    clearSampleData();
    if (settings.isSampleMode) {
      setWatches([]);
      setAlerts([]);
    }
    showToast('Sample data namespace cleared.');
  };

  // Watch detail page lookup
  const currentWatchId = route.startsWith('watch/') ? route.replace('watch/', '') : null;
  const currentWatch = currentWatchId
    ? watches.find((w) => w.id === currentWatchId) || null
    : null;

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FAF8F4] dark:bg-[#0E152E] text-[#475569] dark:text-[#CBD5E1] transition-colors duration-200">
        {/* Navbar */}
        <Navbar
          currentRoute={route}
          onNavigate={(target) => navigate(target)}
          unreadAlertCount={unreadAlertCount}
          tinyFishConnected={isTinyFishConnected}
          isSampleMode={settings.isSampleMode}
          onExitSampleMode={handleExitSampleMode}
          darkMode={settings.darkMode}
          onToggleDarkMode={() => {
            const updated = { ...settings, darkMode: !settings.darkMode };
            setSettings(updated);
            saveSettings(updated);
          }}
        />

        {/* Toast Alert Notification */}
        {toastMsg && (
          <div
            className="fixed bottom-16 sm:bottom-8 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-[#0F1733] text-white text-xs font-semibold shadow-2xl border border-[#1E2A5A] flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200"
            role="status"
            aria-live="polite"
          >
            <span className="w-2 h-2 rounded-full bg-[#0E9AA7] animate-ping" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 pb-16 sm:pb-8">
          {route === 'dashboard' && (
            <Dashboard
              watches={watches}
              alerts={alerts}
              settings={settings}
              onNavigate={navigate}
              onOpenWatch={(w) => navigate(`watch/${w.id}`)}
              onCheckWatch={(w) => executeWatchRun(w, true)}
              onCheckAll={handleCheckAll}
              isCheckingAll={isCheckingAll}
              onEditWatch={(w) => navigate(`watch/${w.id}`)}
              onTogglePause={(w) => {
                const next = watches.map((it) =>
                  it.id === w.id ? { ...it, paused: !it.paused } : it
                );
                saveState(next, alerts);
                showToast(w.paused ? 'Tracker resumed' : 'Tracker paused');
              }}
              onDeleteWatch={(w) => {
                if (window.confirm(`Are you sure you want to delete tracker "${w.name}"?`)) {
                  const nextWatches = watches.filter((it) => it.id !== w.id);
                  const nextAlerts = alerts.filter((a) => a.watchId !== w.id);
                  saveState(nextWatches, nextAlerts);
                  showToast('Tracker deleted.');
                }
              }}
              onSubmitPrompt={handleSubmitPrompt}
              isLoadingPrompt={isLoadingPrompt}
              onOpenManualModal={() => setManualModalOpen(true)}
              onTrySampleData={handleTrySampleData}
              checkingWatchIds={checkingWatchIds}
            />
          )}

          {route.startsWith('watch/') && currentWatch && (
            <WatchDetailPage
              watch={currentWatch}
              onBack={() => navigate('dashboard')}
              onCheckNow={(w) => executeWatchRun(w, true)}
              onUpdateWatch={(updated) => {
                const next = watches.map((w) => (w.id === updated.id ? updated : w));
                saveState(next, alerts);
                showToast('Tracker updated.');
              }}
              currencySymbol={settings.currency}
              isChecking={checkingWatchIds.has(currentWatch.id)}
            />
          )}

          {route === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              onMarkAllRead={() => {
                const next = alerts.map((a) => ({ ...a, read: true }));
                saveState(watches, next);
                showToast('All alerts marked read.');
              }}
              onClearAlerts={() => {
                if (window.confirm('Clear all alerts?')) {
                  saveState(watches, []);
                  showToast('Alerts cleared.');
                }
              }}
              onNavigateToWatch={(watchId) => navigate(`watch/${watchId}`)}
            />
          )}

          {route === 'calendar' && <CalendarPage watches={watches} />}

          {route === 'settings' && (
            <SettingsPage
              settings={settings}
              health={health}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                saveSettings(newSettings);
              }}
              onTestTinyFish={async (keyToTest) => {
                try {
                  const res = await fetch('/api/agent/test-connection', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(keyToTest ? { 'x-tinyfish-key': keyToTest } : {}),
                      ...(settings.accessCode ? { 'x-access-code': settings.accessCode } : {}),
                    },
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    return { success: false, message: data.error?.message || 'Connection failed' };
                  }
                  return { success: true, message: data.message || 'Connected to TinyFish!' };
                } catch (err: any) {
                  return { success: false, message: err.message || 'Network error' };
                }
              }}
              onLoadSampleData={handleTrySampleData}
              onClearSampleData={handleClearSampleData}
              onBackupImported={() => {
                const data = loadAppData(settings.isSampleMode);
                setWatches(data.watches);
                setAlerts(data.alerts);
              }}
            />
          )}

          {route === 'about' && <AboutPage />}
        </main>

        {/* Live Agent View Drawer (F1) */}
        <LiveAgentDrawer
          isOpen={liveDrawerOpen}
          onClose={() => setLiveDrawerOpen(false)}
          watch={activeLiveWatch}
          runStatus={liveStatus}
          streamingUrl={streamingUrl}
          steps={liveSteps}
          elapsedSeconds={elapsedSeconds}
          resultSummary={resultSummary}
          errorMessage={liveErrorMessage}
          onCancel={handleCancelLiveRun}
          onViewResults={() => {
            setLiveDrawerOpen(false);
            if (activeLiveWatch) {
              navigate(`watch/${activeLiveWatch.id}`);
            }
          }}
        />

        {/* Review Draft Modal (F2) */}
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          draft={reviewDraft}
          onConfirm={handleConfirmWatch}
          tinyFishConnected={isTinyFishConnected}
          isSampleMode={settings.isSampleMode}
        />

        {/* Manual Watch Modal */}
        <ManualWatchModal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          existingWatches={watches}
          onCreateWatch={handleConfirmWatch}
          tinyFishConnected={isTinyFishConnected}
          isSampleMode={settings.isSampleMode}
        />

        {/* Compact Footer (Section 9) */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
