import { AlertRule, Watch, WatchAlert, WatchItem, WatchSnapshot } from '../types';
import { getKeyFieldForTemplate } from './schemas';

// Normalize key for case-insensitive, trimmed matching
export function normalizeKey(keyVal: any): string {
  if (keyVal === null || keyVal === undefined) return '';
  return String(keyVal).trim().toLowerCase();
}

// Evaluate single condition
export function evaluateCondition(item: WatchItem, rule: AlertRule): boolean {
  const itemVal = item[rule.field];

  switch (rule.op) {
    case 'below': {
      const num = Number(itemVal);
      const target = Number(rule.value);
      return !isNaN(num) && !isNaN(target) && num < target;
    }
    case 'above': {
      const num = Number(itemVal);
      const target = Number(rule.value);
      return !isNaN(num) && !isNaN(target) && num > target;
    }
    case 'equals': {
      if (typeof rule.value === 'number') {
        return Number(itemVal) === Number(rule.value);
      }
      return String(itemVal ?? '').trim().toLowerCase() === String(rule.value ?? '').trim().toLowerCase();
    }
    case 'contains': {
      const str = String(itemVal ?? '').toLowerCase();
      const needle = String(rule.value ?? '').toLowerCase();
      return needle.length > 0 && str.includes(needle);
    }
    case 'does_not_contain': {
      const str = String(itemVal ?? '').toLowerCase();
      const needle = String(rule.value ?? '').toLowerCase();
      return needle.length > 0 && !str.includes(needle);
    }
    case 'is_true': {
      return itemVal === true || String(itemVal).toLowerCase() === 'true' || String(itemVal).toLowerCase() === 'yes';
    }
    case 'is_false': {
      return itemVal === false || String(itemVal).toLowerCase() === 'false' || String(itemVal).toLowerCase() === 'no';
    }
    case 'within_days': {
      if (!itemVal) return false;
      const targetDays = Number(rule.value) || 7;
      const parsedDate = parseAnyDate(itemVal);
      if (!parsedDate) return false;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffMs = parsedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= targetDays;
    }
    default:
      return false;
  }
}

// Item matches all rules (AND condition)
export function itemMatchesRules(item: WatchItem, rules: AlertRule[]): boolean {
  if (!rules || rules.length === 0) return false;
  return rules.every(rule => evaluateCondition(item, rule));
}

// Parse various date formats: YYYY-MM-DD, 30 Nov 2026, Nov 30 2026, 30/11/2026, 30-11-2026
export function parseAnyDate(val: any): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // 1. ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Day first (DD/MM/YYYY or DD-MM-YYYY)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Textual dates like "30 Nov 2026", "Nov 30, 2026"
  const standardParsed = new Date(str);
  if (!isNaN(standardParsed.getTime())) {
    return standardParsed;
  }

  return null;
}

export interface DiffResult {
  newSnapshot: WatchSnapshot;
  alerts: WatchAlert[];
  isSuspicious: boolean;
  status: 'SUCCESS' | 'WARNING';
  statusMessage?: string;
}

export function computeWatchDiff(
  watch: Watch,
  rawItems: WatchItem[],
  currencySymbol: string = '₹'
): DiffResult {
  const keyField = getKeyFieldForTemplate(watch.template);
  const now = Date.now();
  const prevSnapshot = watch.snapshot;

  // Suspicious result check: 0 items returned when previous snapshot had items
  if ((!rawItems || rawItems.length === 0) && prevSnapshot && prevSnapshot.items.length > 0) {
    return {
      newSnapshot: prevSnapshot, // Keep old snapshot
      alerts: [], // Create NO removed alerts
      isSuspicious: true,
      status: 'WARNING',
      statusMessage:
        'The agent found nothing this time. The page may have changed or blocked the agent. Try again or turn on stealth mode.',
    };
  }

  const validItems = (rawItems || [])
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const cloned = { ...item };
      if (!cloned[keyField]) {
        cloned[keyField] = cloned.title || cloned.name || cloned.product || cloned.role || 'Item';
      }
      if (!cloned.name && cloned.title) cloned.name = cloned.title;
      if (!cloned.title && cloned.name) cloned.title = cloned.name;
      return cloned;
    })
    .filter((item): item is WatchItem => Boolean(item && item[keyField]));
  const newSnapshot: WatchSnapshot = {
    timestamp: now,
    items: validItems,
    itemCount: validItems.length,
    scores: prevSnapshot?.scores ? { ...prevSnapshot.scores } : {},
  };

  const alerts: WatchAlert[] = [];
  const hasRules = watch.rules && watch.rules.length > 0;

  // Map previous items by normalized key
  const prevMap = new Map<string, WatchItem>();
  if (prevSnapshot && prevSnapshot.items) {
    for (const item of prevSnapshot.items) {
      const k = normalizeKey(item[keyField]);
      if (k) prevMap.set(k, item);
    }
  }

  // Case 1: Watch has rules defined
  if (hasRules) {
    for (const item of validItems) {
      const itemKey = String(item[keyField] || '');
      const normKey = normalizeKey(itemKey);
      const matchesNow = itemMatchesRules(item, watch.rules);

      if (matchesNow) {
        // If first check (no prevSnapshot), item matches baseline -> raise alert once
        if (!prevSnapshot) {
          alerts.push({
            id: `alert-${watch.id}-${normKey}-${now}`,
            watchId: watch.id,
            watchName: watch.name,
            itemKey,
            kind: 'MATCH',
            message: `Matched alert rule: ${describeItemMatch(item, watch.rules)}`,
            timestamp: now,
            read: false,
            itemSnapshot: item,
            isSample: watch.isSample,
          });
        } else {
          // If later check, check if it was previously NOT matching (or was not in prevMap)
          const prevItem = prevMap.get(normKey);
          const wasMatching = prevItem ? itemMatchesRules(prevItem, watch.rules) : false;
          if (!wasMatching) {
            alerts.push({
              id: `alert-${watch.id}-${normKey}-${now}`,
              watchId: watch.id,
              watchName: watch.name,
              itemKey,
              kind: 'MATCH',
              message: `Newly matched alert rule: ${describeItemMatch(item, watch.rules)}`,
              timestamp: now,
              read: false,
              itemSnapshot: item,
              isSample: watch.isSample,
            });
          }
        }
      }
    }

    return {
      newSnapshot,
      alerts,
      isSuspicious: false,
      status: 'SUCCESS',
      statusMessage: `Checked successfully · Found ${validItems.length} items (${alerts.length} new matches)`,
    };
  }

  // Case 2: Watch has NO rules
  if (!prevSnapshot) {
    // First check saves baseline with NO alerts
    return {
      newSnapshot,
      alerts: [],
      isSuspicious: false,
      status: 'SUCCESS',
      statusMessage: `Initial baseline captured with ${validItems.length} items`,
    };
  }

  // Later checks without rules
  const currentKeySet = new Set<string>();

  for (const item of validItems) {
    const itemKey = String(item[keyField] || '');
    const normKey = normalizeKey(itemKey);
    currentKeySet.add(normKey);

    const prevItem = prevMap.get(normKey);
    if (!prevItem) {
      // NEW item
      alerts.push({
        id: `alert-${watch.id}-${normKey}-${now}`,
        watchId: watch.id,
        watchName: watch.name,
        itemKey,
        kind: 'NEW',
        message: `New item detected: "${itemKey}"`,
        timestamp: now,
        read: false,
        itemSnapshot: item,
        isSample: watch.isSample,
      });
    } else {
      // Check for UPDATED fields
      const changes = detectFieldChanges(prevItem, item, currencySymbol);
      if (changes.length > 0) {
        alerts.push({
          id: `alert-${watch.id}-${normKey}-${now}`,
          watchId: watch.id,
          watchName: watch.name,
          itemKey,
          kind: 'UPDATED',
          message: `${itemKey}: ${changes.join(', ')}`,
          timestamp: now,
          read: false,
          itemSnapshot: item,
          isSample: watch.isSample,
        });
      }

      // Check DEADLINE (if item's deadline enters the next 7 days, fired once)
      if (item.deadline) {
        const parsedD = parseAnyDate(item.deadline);
        const prevParsedD = parseAnyDate(prevItem.deadline);
        if (parsedD) {
          const daysLeft = Math.ceil((parsedD.getTime() - now) / (1000 * 60 * 60 * 24));
          const prevDaysLeft = prevParsedD
            ? Math.ceil((prevParsedD.getTime() - prevSnapshot.timestamp) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysLeft >= 0 && daysLeft <= 7 && prevDaysLeft > 7) {
            alerts.push({
              id: `alert-dl-${watch.id}-${normKey}-${now}`,
              watchId: watch.id,
              watchName: watch.name,
              itemKey,
              kind: 'DEADLINE',
              message: `Deadline approaching: "${itemKey}" is due in ${daysLeft === 0 ? 'today' : `${daysLeft} days`} (${item.deadline})`,
              timestamp: now,
              read: false,
              itemSnapshot: item,
              isSample: watch.isSample,
            });
          }
        }
      }
    }
  }

  // Check for REMOVED items (only if not suspicious)
  for (const [prevNormKey, prevItem] of prevMap.entries()) {
    if (!currentKeySet.has(prevNormKey)) {
      alerts.push({
        id: `alert-rm-${watch.id}-${prevNormKey}-${now}`,
        watchId: watch.id,
        watchName: watch.name,
        itemKey: String(prevItem[keyField] || prevNormKey),
        kind: 'REMOVED',
        message: `Item removed from page: "${prevItem[keyField] || prevNormKey}"`,
        timestamp: now,
        read: false,
        itemSnapshot: prevItem,
        isSample: watch.isSample,
      });
    }
  }

  return {
    newSnapshot,
    alerts,
    isSuspicious: false,
    status: 'SUCCESS',
    statusMessage: `Checked · Found ${validItems.length} items (${alerts.length} new alerts)`,
  };
}

function describeItemMatch(item: WatchItem, rules: AlertRule[]): string {
  const parts = rules.map(r => {
    const val = item[r.field];
    return `${r.field} (${val}) ${r.op} ${r.value}`;
  });
  return parts.join(' AND ');
}

function detectFieldChanges(prev: WatchItem, current: WatchItem, currency: string): string[] {
  const changes: string[] = [];
  const fields = Object.keys({ ...prev, ...current });

  for (const field of fields) {
    if (field === 'link' || field.startsWith('_')) continue;
    const oldV = prev[field];
    const newV = current[field];

    if (oldV !== newV && oldV !== undefined && newV !== undefined) {
      if (field === 'price' && typeof oldV === 'number' && typeof newV === 'number') {
        const diff = newV - oldV;
        if (diff < 0) {
          changes.push(`Price dropped by ${currency}${Math.abs(diff).toLocaleString('en-IN')}`);
        } else if (diff > 0) {
          changes.push(`Price rose by ${currency}${diff.toLocaleString('en-IN')}`);
        }
      } else if (field === 'in_stock') {
        changes.push(newV ? 'Now in stock' : 'Out of stock');
      } else {
        changes.push(`${field} changed to "${newV}"`);
      }
    }
  }

  return changes;
}
