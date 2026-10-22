import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  User,
  Coins,
  Download,
  Upload,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, HealthStatus } from '../types';
import { exportBackup, importBackup } from '../services/storage';

interface SettingsPageProps {
  settings: AppSettings;
  health: HealthStatus;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onTestTinyFish: (keyToTest: string) => Promise<{ success: boolean; message: string }>;
  onLoadSampleData: () => void;
  onClearSampleData: () => void;
  onBackupImported: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  health,
  onUpdateSettings,
  onTestTinyFish,
  onLoadSampleData,
  onClearSampleData,
  onBackupImported,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.tinyFishApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [profileInput, setProfileInput] = useState(settings.profile || '');
  const [currencyInput, setCurrencyInput] = useState(settings.currency || '₹');
  const [accessCodeInput, setAccessCodeInput] = useState(settings.accessCode || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [importError, setImportError] = useState('');

  const handleSaveTinyFish = (e?: React.FormEvent) => {
    e?.preventDefault();
    onUpdateSettings({
      ...settings,
      tinyFishApiKey: apiKeyInput.trim(),
    });
    setSaveSuccessMsg('TinyFish key saved!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleRemoveKey = () => {
    setApiKeyInput('');
    onUpdateSettings({
      ...settings,
      tinyFishApiKey: '',
    });
    setTestResult(null);
    setSaveSuccessMsg('TinyFish key removed.');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await onTestTinyFish(apiKeyInput.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      profile: profileInput.slice(0, 400).trim(),
      currency: currencyInput,
      accessCode: accessCodeInput.trim(),
    });
    setSaveSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleExportJson = () => {
    const jsonStr = exportBackup(settings.isSampleMode);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchdog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackup(content, settings.isSampleMode);
      if (res.success) {
        onBackupImported();
        setSaveSuccessMsg(`Backup restored! (${res.watchCount} watches, ${res.alertCount} alerts)`);
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        setImportError(res.error || 'Failed to import backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#E7E2D8] dark:border-[#24305E]">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white">
          Settings & Integrations
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1">
          Configure TinyFish Agent API, target candidate profile, and backup storage
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-[#E0EFE8] text-[#1B8A5A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {importError && (
        <div className="p-3 rounded-xl bg-[#FDE8E8] text-[#C0392B] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{importError}</span>
        </div>
      )}

      {/* SECTION 1: TinyFish API Key Integration */}
      <div className="bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0E9AA7]/10 text-[#0E9AA7] flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
                TinyFish Web Agent Key
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {health.tinyfishServerKey
                  ? 'Server pre-configured with environment key'
                  : 'Client header key required for autonomous browser checks'}
              </p>
            </div>
          </div>

          {health.tinyfishServerKey && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#E0EFE8] text-[#1B8A5A]">
              Server Key Injected
            </span>
          )}
        </div>

        {/* 3 Step Instructions */}
        <div className="p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E] text-xs space-y-2">
          <p className="font-bold text-[#1E2A5A] dark:text-white uppercase tracking-wider text-[11px]">
            How to get your TinyFish Key:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
            <li>
              Open{' '}
              <a
                href="https://agent.tinyfish.ai/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[#0E9AA7] font-semibold underline inline-flex items-center gap-0.5"
              >
                <span>https://agent.tinyfish.ai/api-keys</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Click <strong>&quot;Create API Key&quot;</strong> in your TinyFish dashboard</li>
            <li>Copy it immediately (it is shown only once and kept safe in local memory)</li>
          </ol>
          <p className="text-[11px] text-[#94A3B8] italic pt-1">
            Note: Each check uses TinyFish credits. The server never stores, logs or echoes your key.
          </p>
        </div>

        {/* Key Form */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="tf_live_..."
              className="w-full pl-3.5 pr-20 py-2.5 rounded-xl text-sm font-mono border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveTinyFish}
              disabled={!apiKeyInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Key</span>
            </button>

            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || (!apiKeyInput.trim() && !health.tinyfishServerKey)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white hover:bg-[#FAF8F4] dark:hover:bg-[#131B3A] disabled:opacity-50 transition-colors"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#0E9AA7]" />}
              <span>{isTesting ? 'Testing run...' : 'Test Connection'}</span>
            </button>

            {apiKeyInput && (
              <button
                type="button"
                onClick={handleRemoveKey}
                className="px-3 py-2 rounded-xl text-xs text-[#C0392B] hover:bg-[#FDE8E8] dark:hover:bg-[#C0392B]/20 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-[#E0EFE8] text-[#1B8A5A]'
                  : 'bg-[#FDE8E8] text-[#C0392B]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Profile & Currency */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] p-6 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8734A]/10 text-[#E8734A] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
              Target Candidate & Shopper Profile (F7)
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Used by the relevance engine to rank captured items and show fit score badges (0-100)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
            Your Profile (Max 400 chars)
          </label>
          <textarea
            rows={3}
            maxLength={400}
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            placeholder="e.g. 2nd-year CS student, Python, Delhi, interested in AI/ML & web development"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
          />
          <span className="text-[11px] font-mono text-[#94A3B8] block text-right mt-1">
            {profileInput.length}/400 characters
          </span>
        </div>

        {/* Global Currency Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              Global Currency Symbol
            </label>
            <select
              value={currencyInput}
              onChange={(e) => setCurrencyInput(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            >
              <option value="₹">₹ (Indian Rupee - INR)</option>
              <option value="$">$ (US Dollar - USD)</option>
              <option value="€">€ (Euro - EUR)</option>
              <option value="£">£ (British Pound - GBP)</option>
            </select>
          </div>

          {health.accessCodeRequired && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
                Access Code (Protected Server)
              </label>
              <input
                type="text"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                placeholder="Enter access code..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white font-mono"
              />
            </div>
          )}
        </div>

        {/* Honest scheduler notice */}
        <div className="p-3.5 rounded-xl bg-[#FAF8F4] dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E] flex items-center gap-2.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <Clock className="w-4 h-4 text-[#0E9AA7] shrink-0" />
          <span>
            <strong>Honest scheduler notice:</strong> Automatic checks run every 30 seconds while Watchdog is open in a browser tab.
          </span>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-2xs transition-colors"
        >
          Save Profile & Preferences
        </button>
      </form>

      {/* SECTION 3: Storage, Backup & Sample Data */}
      <div className="bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
            Data Backup & Test Modes
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Watchdog stores zero user data on the server. Everything lives inside your browser localStorage key <code className="font-mono">watchdog:v2</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] bg-[#FAF8F4] dark:bg-[#1A234A] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2A5A] dark:text-white">
              Export / Import Backup
            </h4>
            <p className="text-xs text-[#94A3B8]">
              Download your trackers, alert rules, and run history as a clean JSON file.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#131B3A] text-[#1E2A5A] dark:text-white hover:bg-[#FAF8F4]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export backup (.json)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#131B3A] text-[#1E2A5A] dark:text-white hover:bg-[#FAF8F4] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] bg-[#FAF8F4] dark:bg-[#1A234A] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2A5A] dark:text-white">
              Sample Data Workspace
            </h4>
            <p className="text-xs text-[#94A3B8]">
              Explore pre-loaded mock trackers (MacBook price drop, Google internship, STEM scholarship) in a separate namespace.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onLoadSampleData}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E8734A] text-white hover:bg-[#d6653d]"
              >
                Try sample data
              </button>
              <button
                type="button"
                onClick={onClearSampleData}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-[#C0392B]"
              >
                Clear sample data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
