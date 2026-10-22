export type TemplateType = 'internship' | 'job' | 'price' | 'scholarship' | 'custom';

export type FrequencyType = 'manual' | 'hourly' | '6h' | 'daily' | 'weekly';

export type RuleOp =
  | 'below'
  | 'above'
  | 'equals'
  | 'contains'
  | 'does_not_contain'
  | 'within_days'
  | 'is_true'
  | 'is_false';

export interface AlertRule {
  id: string;
  field: string;
  op: RuleOp;
  value: any;
}

export interface WatchItem {
  [key: string]: any;
}

export interface RelevanceScore {
  score: number; // 0-100
  reason: string;
}

export interface WatchSnapshot {
  timestamp: number;
  items: WatchItem[];
  itemCount: number;
  scores?: Record<string, RelevanceScore>; // keyed by itemKey
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface StepLog {
  timestamp: number;
  purpose: string;
}

export interface RunRecord {
  id: string;
  startedAt: number;
  durationSeconds: number;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WARNING';
  itemCount: number;
  newAlertCount: number;
  steps: StepLog[];
  error?: string;
  rawResultPreview?: string;
}

export interface Watch {
  id: string;
  name: string;
  url: string;
  goal: string;
  template: TemplateType;
  frequency: FrequencyType;
  stealth: boolean;
  rules: AlertRule[];
  createdAt: number;
  lastChecked: number | null;
  nextCheck: number | null;
  paused: boolean;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  lastStatusMessage?: string;
  snapshot?: WatchSnapshot | null;
  priceHistory?: Record<string, PricePoint[]>; // itemKey -> points (up to 200 points)
  runs?: RunRecord[]; // latest 10 runs
  isSample?: boolean;
}

export type AlertKind = 'MATCH' | 'NEW' | 'UPDATED' | 'DEADLINE' | 'REMOVED';

export interface WatchAlert {
  id: string;
  watchId: string;
  watchName: string;
  itemKey: string;
  kind: AlertKind;
  message: string;
  timestamp: number;
  read: boolean;
  itemSnapshot: WatchItem;
  score?: RelevanceScore;
  isSample?: boolean;
}

export interface AppSettings {
  tinyFishApiKey: string;
  accessCode: string;
  profile: string;
  currency: '₹' | '$' | '€' | '£';
  autoCheckEnabled: boolean;
  darkMode: boolean;
  isSampleMode: boolean;
}

export interface HealthStatus {
  tinyfishServerKey: boolean;
  llm: 'gemini' | 'claude' | 'none';
  accessCodeRequired: boolean;
}
