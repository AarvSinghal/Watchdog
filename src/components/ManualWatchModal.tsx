import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Shield,
  Play,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Tag,
  Laptop,
  Layers,
} from 'lucide-react';
import { AlertRule, FrequencyType, TemplateType, Watch } from '../types';
import { TEMPLATES } from '../services/schemas';

interface ManualWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingWatches: Watch[];
  onCreateWatch: (
    watchData: Omit<Watch, 'id' | 'createdAt' | 'lastChecked' | 'nextCheck' | 'paused' | 'status'>,
    runImmediately: boolean
  ) => void;
  tinyFishConnected?: boolean;
  isSampleMode?: boolean;
}

export const ManualWatchModal: React.FC<ManualWatchModalProps> = ({
  isOpen,
  onClose,
  existingWatches,
  onCreateWatch,
  tinyFishConnected = false,
  isSampleMode = false,
}) => {
  const [template, setTemplate] = useState<TemplateType>('price');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState(TEMPLATES.price.defaultGoal);
  const [frequency, setFrequency] = useState<FrequencyType>('manual');
  const [stealth, setStealth] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentTemplateMeta = TEMPLATES[template] || TEMPLATES.custom;

  const handleSelectTemplate = (t: TemplateType) => {
    setTemplate(t);
    setGoal(TEMPLATES[t]?.defaultGoal || '');
    setRules([]);
  };

  const handleAddRule = () => {
    if (rules.length >= 3) return;
    const defaultField = currentTemplateMeta.fields[0]?.name || 'title';
    setRules([
      ...rules,
      {
        id: `r-${Date.now()}`,
        field: defaultField,
        op: defaultField === 'price' ? 'below' : 'contains',
        value: defaultField === 'price' ? 50000 : '',
      },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleRuleChange = (id: string, updates: Partial<AlertRule>) => {
    setRules(
      rules.map((r) => {
        if (r.id !== id) return r;
        return { ...r, ...updates };
      })
    );
  };

  const validateAndSubmit = (runImmediately: boolean) => {
    setErrorMsg('');
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 80) {
      setErrorMsg('Name must be between 1 and 80 characters.');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMsg('URL is required.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setErrorMsg('URL must begin with http:// or https://');
      return;
    }

    const trimmedGoal = goal.trim();
    if (!trimmedGoal || trimmedGoal.length > 500) {
      setErrorMsg('Goal must be between 1 and 500 characters.');
      return;
    }

    // Check duplicate URL + goal
    const isDuplicate = existingWatches.some(
      (w) =>
        w.url.toLowerCase() === trimmedUrl.toLowerCase() &&
        w.goal.toLowerCase() === trimmedGoal.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg('A tracker with the exact same URL and goal already exists.');
      return;
    }

    onCreateWatch(
      {
        name: trimmedName,
        url: trimmedUrl,
        template,
        goal: trimmedGoal,
        rules: rules.slice(0, 3),
        frequency,
        stealth,
      },
      runImmediately
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#131B3A] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E2D8] dark:border-[#24305E] flex items-center justify-between bg-[#FAF8F4] dark:bg-[#1A234A]">
          <h2 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
            Create New Tracker
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {!tinyFishConnected && !isSampleMode && (
            <div className="p-3 rounded-xl bg-[#FEF3C7] dark:bg-[#C77700]/20 border border-[#C77700]/40 flex items-start gap-2.5 text-xs text-[#92400E] dark:text-[#FBBF24]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">TinyFish API key not connected yet.</span>
                <p className="mt-0.5 text-[11px] opacity-90">
                  You can click <strong>&quot;Save Watch&quot;</strong> to save this tracker now. Live agent checks run once you add your TinyFish key in Settings.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDE8E8] dark:bg-[#C0392B]/20 border border-[#C0392B]/30 flex items-center gap-2 text-xs text-[#C0392B] dark:text-[#F87171]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Template Selector Chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-2">
              Select Tracker Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'price', label: 'Price & Stock', icon: Laptop },
                { id: 'internship', label: 'Internships', icon: Briefcase },
                { id: 'job', label: 'Jobs', icon: Tag },
                { id: 'scholarship', label: 'Scholarships', icon: GraduationCap },
                { id: 'custom', label: 'Custom', icon: Layers },
              ].map((t) => {
                const Icon = t.icon;
                const isSel = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs ${
                      isSel
                        ? 'border-[#0E9AA7] bg-[#CFEDEF]/30 dark:bg-[#0E9AA7]/20 text-[#0E9AA7] dark:text-[#76E4EC] font-bold shadow-2xs'
                        : 'border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#475569] dark:text-[#94A3B8] hover:border-[#0E9AA7]/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              Tracker Name (1-80 chars) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony WH-1000XM5 Price Watch"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              Page URL to Watch *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page-to-track"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white font-mono"
            />
          </div>

          {/* Agent Goal Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              TinyFish Agent Goal (1-500 chars) *
            </label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            />
          </div>

          {/* Frequency Cadence */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              Check Cadence
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            >
              <option value="manual">Manual only (default)</option>
              <option value="hourly">Hourly</option>
              <option value="6h">Every 6 hours</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Automatic checks run while Watchdog is open.
            </p>
          </div>

          {/* Rules Builder */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#1A234A] border border-[#E7E2D8] dark:border-[#24305E] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2A5A] dark:text-white">
                  Smart Alert Rules ({rules.length}/3)
                </h4>
                <p className="text-[11px] text-[#94A3B8]">
                  Alerts fire when an item newly matches these conditions (AND logic)
                </p>
              </div>
              {rules.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#0E9AA7] bg-[#CFEDEF]/50 dark:bg-[#0E9AA7]/20 hover:bg-[#CFEDEF]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              )}
            </div>

            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#131B3A] border border-[#E7E2D8] dark:border-[#24305E]"
              >
                <select
                  value={rule.field}
                  onChange={(e) => handleRuleChange(rule.id, { field: e.target.value })}
                  className="px-2 py-1 text-xs rounded border border-[#E7E2D8] dark:border-[#24305E] bg-transparent text-[#1E2A5A] dark:text-white"
                >
                  {currentTemplateMeta.fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={rule.op}
                  onChange={(e) => handleRuleChange(rule.id, { op: e.target.value as any })}
                  className="px-2 py-1 text-xs rounded border border-[#E7E2D8] dark:border-[#24305E] bg-transparent text-[#1E2A5A] dark:text-white"
                >
                  <option value="below">is below (&lt;)</option>
                  <option value="above">is above (&gt;)</option>
                  <option value="contains">contains</option>
                  <option value="does_not_contain">does not contain</option>
                  <option value="equals">equals</option>
                  <option value="within_days">within N days</option>
                  <option value="is_true">is true</option>
                  <option value="is_false">is false</option>
                </select>

                {!['is_true', 'is_false'].includes(rule.op) && (
                  <input
                    type={['below', 'above', 'within_days'].includes(rule.op) ? 'number' : 'text'}
                    value={rule.value}
                    onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                    placeholder="Value..."
                    className="px-2 py-1 text-xs rounded border border-[#E7E2D8] dark:border-[#24305E] bg-transparent text-[#1E2A5A] dark:text-white flex-1 min-w-[100px]"
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="p-1 text-[#94A3B8] hover:text-[#C0392B]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Stealth Profile */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0E9AA7]" />
              <div>
                <p className="text-xs font-semibold text-[#1E2A5A] dark:text-white">
                  Stealth Profile & Residential Proxy
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Route through Indian proxy node to bypass bot detection.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={stealth}
              onChange={(e) => setStealth(e.target.checked)}
              className="w-4 h-4 text-[#0E9AA7] rounded"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E7E2D8] dark:border-[#24305E] bg-[#FAF8F4] dark:bg-[#1A234A] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#94A3B8] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => validateAndSubmit(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border border-[#0E9AA7] text-[#0E9AA7] hover:bg-[#CFEDEF]/30 transition-colors"
          >
            Save Watch
          </button>
          <button
            type="button"
            onClick={() => validateAndSubmit(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Save & Run Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
