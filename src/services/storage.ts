import { Watch, WatchAlert, AppSettings } from '../types';

const STORAGE_VERSION = 2;
const STORAGE_KEY_LIVE = 'watchdog:v2:live';
const STORAGE_KEY_SAMPLE = 'watchdog:v2:sample';
const SETTINGS_KEY = 'watchdog:v2:settings';

interface StoredPayload {
  version: number;
  watches: Watch[];
  alerts: WatchAlert[];
}

const DEFAULT_SETTINGS: AppSettings = {
  tinyFishApiKey: '',
  accessCode: '',
  profile: '2nd-year CS student, Python, Delhi, interested in AI/ML & web development',
  currency: '₹',
  autoCheckEnabled: true,
  darkMode: false,
  isSampleMode: false,
};

// Safe helper for localStorage
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.error('LocalStorage read error:', err);
    return null;
  }
}

function safeSetItem(key: string, value: string): { success: boolean; isQuotaError?: boolean } {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (err: any) {
    console.error('LocalStorage write error:', err);
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED';
    return { success: false, isQuotaError: isQuota };
  }
}

export function loadSettings(): AppSettings {
  const raw = safeGetItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): { success: boolean; error?: string } {
  const res = safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
  if (!res.success) {
    return {
      success: false,
      error: res.isQuotaError
        ? 'Browser storage is full. Please clear some history or export a backup.'
        : 'Failed to save settings to localStorage.',
    };
  }
  return { success: true };
}

function getActiveStorageKey(isSampleMode: boolean): string {
  return isSampleMode ? STORAGE_KEY_SAMPLE : STORAGE_KEY_LIVE;
}

export function loadAppData(isSampleMode: boolean): { watches: Watch[]; alerts: WatchAlert[]; corrupted?: boolean } {
  const key = getActiveStorageKey(isSampleMode);
  const raw = safeGetItem(key);
  if (!raw) {
    if (isSampleMode) {
      // Initialize sample data on demand
      const sample = generateInitialSampleData();
      saveAppData(sample.watches, sample.alerts, true);
      return sample;
    }
    return { watches: [], alerts: [] };
  }

  try {
    const payload: StoredPayload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || payload.version !== STORAGE_VERSION) {
      // version mismatch or invalid shape
      return { watches: [], alerts: [], corrupted: true };
    }
    return {
      watches: Array.isArray(payload.watches) ? payload.watches : [],
      alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
    };
  } catch (err) {
    console.warn('Corrupted storage detected, resetting namespace cleanly:', key, err);
    return { watches: [], alerts: [], corrupted: true };
  }
}

export function saveAppData(
  watches: Watch[],
  alerts: WatchAlert[],
  isSampleMode: boolean
): { success: boolean; error?: string } {
  const key = getActiveStorageKey(isSampleMode);
  const payload: StoredPayload = {
    version: STORAGE_VERSION,
    watches,
    alerts,
  };
  const res = safeSetItem(key, JSON.stringify(payload));
  if (!res.success) {
    return {
      success: false,
      error: res.isQuotaError
        ? 'Storage quota exceeded. Export a backup in Settings and clear old runs.'
        : 'Storage write failed.',
    };
  }
  return { success: true };
}

export function exportBackup(isSampleMode: boolean): string {
  const settings = loadSettings();
  const { watches, alerts } = loadAppData(isSampleMode);
  // Do NOT export the raw api key into backup for security, or keep it optional
  const backup = {
    appName: 'Watchdog',
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    isSampleMode,
    settings: {
      profile: settings.profile,
      currency: settings.currency,
      autoCheckEnabled: settings.autoCheckEnabled,
      darkMode: settings.darkMode,
    },
    watches,
    alerts,
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackup(
  jsonString: string,
  isSampleMode: boolean
): { success: boolean; watchCount?: number; alertCount?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.watches)) {
      return { success: false, error: 'Invalid backup file format: missing watches array.' };
    }

    const watches: Watch[] = parsed.watches;
    const alerts: WatchAlert[] = Array.isArray(parsed.alerts) ? parsed.alerts : [];

    const saveRes = saveAppData(watches, alerts, isSampleMode);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error };
    }

    if (parsed.settings) {
      const current = loadSettings();
      saveSettings({
        ...current,
        profile: parsed.settings.profile || current.profile,
        currency: parsed.settings.currency || current.currency,
      });
    }

    return { success: true, watchCount: watches.length, alertCount: alerts.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse JSON backup file.' };
  }
}

export function clearSampleData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SAMPLE);
  } catch {
    // ignore
  }
}

// Rich Initial Sample Data
export function generateInitialSampleData(): { watches: Watch[]; alerts: WatchAlert[] } {
  const now = Date.now();
  const oneHour = 3600 * 1000;
  const oneDay = 24 * 3600 * 1000;

  // 1. Laptop Price Tracker
  const watchPrice: Watch = {
    id: 'sample-watch-price-1',
    name: 'MacBook Air M2 13-inch (Space Grey)',
    url: 'https://amazon.in/dp/B0B3CZZV8N',
    goal: 'Extract product name, price, stock availability, and link.',
    template: 'price',
    frequency: 'hourly',
    stealth: true,
    rules: [
      { id: 'r1', field: 'price', op: 'below', value: 85000 },
      { id: 'r2', field: 'in_stock', op: 'is_true', value: true },
    ],
    createdAt: now - 3 * oneDay,
    lastChecked: now - 15 * 60 * 1000,
    nextCheck: now + 45 * 60 * 1000,
    paused: false,
    status: 'SUCCESS',
    isSample: true,
    snapshot: {
      timestamp: now - 15 * 60 * 1000,
      itemCount: 3,
      items: [
        {
          name: 'Apple MacBook Air M2 13.6" 8GB/256GB - Space Grey',
          price: 82990,
          in_stock: true,
          link: 'https://amazon.in/dp/B0B3CZZV8N',
        },
        {
          name: 'Apple MacBook Air M2 13.6" 8GB/512GB - Midnight',
          price: 104990,
          in_stock: true,
          link: 'https://amazon.in/dp/B0B3CZZV8N',
        },
        {
          name: 'Apple MacBook Air M3 13.6" 8GB/256GB - Starlight',
          price: 109900,
          in_stock: false,
          link: 'https://amazon.in/dp/B0CX21C2B8',
        },
      ],
      scores: {
        'Apple MacBook Air M2 13.6" 8GB/256GB - Space Grey': {
          score: 94,
          reason: 'Meets target budget and matched price drop rule',
        },
      },
    },
    priceHistory: {
      'Apple MacBook Air M2 13.6" 8GB/256GB - Space Grey': [
        { time: now - 3 * oneDay, price: 89900 },
        { time: now - 2 * oneDay, price: 88500 },
        { time: now - 1 * oneDay, price: 86900 },
        { time: now - 8 * oneHour, price: 84990 },
        { time: now - 15 * 60 * 1000, price: 82990 },
      ],
    },
    runs: [
      {
        id: 'run-p-1',
        startedAt: now - 15 * 60 * 1000,
        durationSeconds: 14,
        status: 'COMPLETED',
        itemCount: 3,
        newAlertCount: 1,
        steps: [
          { timestamp: now - 15 * 60 * 1000, purpose: 'Navigating to product page' },
          { timestamp: now - 15 * 60 * 1000 + 4000, purpose: 'Rendering Amazon product grid' },
          { timestamp: now - 15 * 60 * 1000 + 9000, purpose: 'Extracting price variants and stock badges' },
          { timestamp: now - 15 * 60 * 1000 + 14000, purpose: 'Schema validation completed' },
        ],
      },
    ],
  };

  // 2. Internship Tracker
  const watchIntern: Watch = {
    id: 'sample-watch-intern-2',
    name: 'Google & Microsoft Summer Internships 2026',
    url: 'https://careers.google.com/jobs/results/?q=intern',
    goal: "Find all internship roles with 'software' in the title.",
    template: 'internship',
    frequency: '6h',
    stealth: false,
    rules: [
      { id: 'r3', field: 'title', op: 'contains', value: 'Software' },
      { id: 'r4', field: 'deadline', op: 'within_days', value: 14 },
    ],
    createdAt: now - 5 * oneDay,
    lastChecked: now - 45 * 60 * 1000,
    nextCheck: now + 5 * oneHour,
    paused: false,
    status: 'SUCCESS',
    isSample: true,
    snapshot: {
      timestamp: now - 45 * 60 * 1000,
      itemCount: 4,
      items: [
        {
          title: 'Software Engineering Intern, Summer 2026',
          location: 'Bengaluru / Hyderabad, India',
          deadline: '2026-10-25',
          status: 'Actively Hiring',
          link: 'https://careers.google.com/jobs/results/1',
        },
        {
          title: 'Machine Learning Research Intern',
          location: 'Remote, India',
          deadline: '2026-10-28',
          status: 'Open',
          link: 'https://careers.google.com/jobs/results/2',
        },
        {
          title: 'Hardware Systems Engineer Intern',
          location: 'Bengaluru',
          deadline: '2026-11-15',
          status: 'Open',
          link: 'https://careers.google.com/jobs/results/3',
        },
        {
          title: 'Data Science & Analytics Intern',
          location: 'Gurugram / Remote',
          deadline: '2026-11-30',
          status: 'Screening Candidates',
          link: 'https://careers.google.com/jobs/results/4',
        },
      ],
      scores: {
        'Software Engineering Intern, Summer 2026': {
          score: 95,
          reason: 'Perfect fit for CS student looking for software roles in India',
        },
        'Machine Learning Research Intern': {
          score: 91,
          reason: 'Strong alignment with AI/ML interests and Python proficiency',
        },
      },
    },
    runs: [
      {
        id: 'run-i-1',
        startedAt: now - 45 * 60 * 1000,
        durationSeconds: 18,
        status: 'COMPLETED',
        itemCount: 4,
        newAlertCount: 1,
        steps: [
          { timestamp: now - 45 * 60 * 1000, purpose: 'Accessing career portal' },
          { timestamp: now - 45 * 60 * 1000 + 6000, purpose: 'Filtering for active software roles' },
          { timestamp: now - 45 * 60 * 1000 + 13000, purpose: 'Parsing deadlines and application links' },
          { timestamp: now - 45 * 60 * 1000 + 18000, purpose: 'Extracted 4 matching internships' },
        ],
      },
    ],
  };

  // 3. Scholarship Tracker
  const watchScholar: Watch = {
    id: 'sample-watch-scholar-3',
    name: 'National STEM Merit Scholarships 2026',
    url: 'https://scholarships.gov.in',
    goal: 'Extract scholarship names, award amount, eligibility criteria, and deadlines.',
    template: 'scholarship',
    frequency: 'daily',
    stealth: false,
    rules: [{ id: 'r5', field: 'deadline', op: 'within_days', value: 7 }],
    createdAt: now - 7 * oneDay,
    lastChecked: now - 2 * oneHour,
    nextCheck: now + 22 * oneHour,
    paused: false,
    status: 'SUCCESS',
    isSample: true,
    snapshot: {
      timestamp: now - 2 * oneHour,
      itemCount: 3,
      items: [
        {
          name: 'Prime Minister Research Fellowship (PMRF)',
          amount: '₹80,000 / month + ₹2 Lakh grant',
          eligibility: 'B.Tech / M.Tech in CS / Engg with 8.0+ CGPA',
          deadline: '2026-10-24',
          link: 'https://pmrf.in',
        },
        {
          name: 'Women in Tech Higher Education Grant',
          amount: '₹1,50,000 one-time award',
          eligibility: 'Undergrad women in STEM degrees',
          deadline: '2026-10-27',
          link: 'https://scholarships.gov.in/wit',
        },
        {
          name: 'Central Sector Scholarship Scheme for College Students',
          amount: '₹20,000 per annum',
          eligibility: 'Top 20th percentile in Class 12 board exams',
          deadline: '2026-11-20',
          link: 'https://scholarships.gov.in/cs',
        },
      ],
      scores: {
        'Prime Minister Research Fellowship (PMRF)': {
          score: 88,
          reason: 'High stipend research grant matching engineering curriculum',
        },
      },
    },
    runs: [
      {
        id: 'run-s-1',
        startedAt: now - 2 * oneHour,
        durationSeconds: 16,
        status: 'COMPLETED',
        itemCount: 3,
        newAlertCount: 1,
        steps: [
          { timestamp: now - 2 * oneHour, purpose: 'Loading government scholarship portal' },
          { timestamp: now - 2 * oneHour + 8000, purpose: 'Navigating active schemes table' },
          { timestamp: now - 2 * oneHour + 16000, purpose: 'Parsed criteria and closing dates' },
        ],
      },
    ],
  };

  const sampleAlerts: WatchAlert[] = [
    {
      id: 'alert-sample-1',
      watchId: watchPrice.id,
      watchName: watchPrice.name,
      itemKey: 'Apple MacBook Air M2 13.6" 8GB/256GB - Space Grey',
      kind: 'MATCH',
      message: 'Price dropped to ₹82,990 (below ₹85,000 rule threshold)!',
      timestamp: now - 15 * 60 * 1000,
      read: false,
      isSample: true,
      itemSnapshot: watchPrice.snapshot!.items[0],
      score: { score: 94, reason: 'Matched price rule under ₹85,000' },
    },
    {
      id: 'alert-sample-2',
      watchId: watchIntern.id,
      watchName: watchIntern.name,
      itemKey: 'Software Engineering Intern, Summer 2026',
      kind: 'DEADLINE',
      message: 'Application deadline is in 3 days (2026-10-25)',
      timestamp: now - 45 * 60 * 1000,
      read: false,
      isSample: true,
      itemSnapshot: watchIntern.snapshot!.items[0],
      score: { score: 95, reason: 'High urgency deadline for top software role' },
    },
    {
      id: 'alert-sample-3',
      watchId: watchScholar.id,
      watchName: watchScholar.name,
      itemKey: 'Prime Minister Research Fellowship (PMRF)',
      kind: 'DEADLINE',
      message: 'Closing date within 2 days (2026-10-24)',
      timestamp: now - 2 * oneHour,
      read: true,
      isSample: true,
      itemSnapshot: watchScholar.snapshot!.items[0],
      score: { score: 88, reason: 'Closing soon grant' },
    },
  ];

  return {
    watches: [watchPrice, watchIntern, watchScholar],
    alerts: sampleAlerts,
  };
}
