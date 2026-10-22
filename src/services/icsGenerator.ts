import { parseAnyDate } from './diffEngine';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcsDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatUtcTimestamp(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

// Fold lines longer than 75 bytes per RFC 5545
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  let first = true;

  while (remaining.length > 0) {
    const limit = first ? 75 : 74;
    parts.push((first ? '' : ' ') + remaining.slice(0, limit));
    remaining = remaining.slice(limit);
    first = false;
  }
  return parts.join('\r\n');
}

export interface DeadlineEventItem {
  watchId: string;
  watchName: string;
  itemTitle: string;
  rawDate: string;
  parsedDate: Date;
  link?: string;
  details?: string;
}

export function generateIcsCalendar(events: DeadlineEventItem[]): string {
  const now = new Date();
  const dtStamp = formatUtcTimestamp(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Watchdog//Tech Spartans//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    const uid = `${ev.watchId}-${simpleHash(ev.itemTitle)}-${formatIcsDate(ev.parsedDate)}@watchdog`;
    const startDateStr = formatIcsDate(ev.parsedDate);

    // DTEND is exclusive for all-day events: next calendar day
    const nextDay = new Date(ev.parsedDate.getTime() + 24 * 60 * 60 * 1000);
    const endDateStr = formatIcsDate(nextDay);

    const summary = escapeIcsText(`[Watchdog] ${ev.itemTitle}`);
    const description = escapeIcsText(
      `Watch: ${ev.watchName}\nDeadline: ${ev.rawDate}${ev.details ? `\nDetails: ${ev.details}` : ''}${
        ev.link ? `\nURL: ${ev.link}` : ''
      }`
    );

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startDateStr}`);
    lines.push(`DTEND;VALUE=DATE:${endDateStr}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    if (ev.link) {
      lines.push(`URL:${ev.link}`);
    }
    // 1-day advance reminder
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:Watchdog deadline reminder');
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildGoogleCalendarUrl(event: DeadlineEventItem): string {
  const startDateStr = formatIcsDate(event.parsedDate);
  const nextDay = new Date(event.parsedDate.getTime() + 24 * 60 * 60 * 1000);
  const endDateStr = formatIcsDate(nextDay);

  const title = encodeURIComponent(`[Watchdog] ${event.itemTitle}`);
  const details = encodeURIComponent(
    `Tracker: ${event.watchName}\nOriginal Deadline: ${event.rawDate}${
      event.details ? `\nDetails: ${event.details}` : ''
    }${event.link ? `\nLink: ${event.link}` : ''}\n\nTracked with Watchdog.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}`;
}
