/**
 * Minimal iCal (RFC 5545) generator and parser.
 * No external dependencies needed for basic VCALENDAR/VEVENT support.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend: Date;
  dtstamp?: Date;
  organizer?: { name: string; email: string };
  attendee?: { name: string; email: string };
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  url?: string;
}

export interface ParsedICalEvent {
  uid?: string;
  summary?: string;
  description?: string;
  dtstart?: Date;
  dtend?: Date;
  location?: string;
  status?: string;
}

// ── Formatting helpers ─────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  // RFC 5545: fold lines longer than 75 octets
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  chunks.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateICalFeed(events: ICalEvent[], calName = 'OBP Calendar'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenBooking Protocol//OBP//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${formatDate(event.dtstamp ?? new Date())}`);
    lines.push(`DTSTART:${formatDate(event.dtstart)}`);
    lines.push(`DTEND:${formatDate(event.dtend)}`);
    lines.push(foldLine(`SUMMARY:${escapeText(event.summary)}`));

    if (event.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(event.description)}`));
    }
    if (event.location) {
      lines.push(foldLine(`LOCATION:${escapeText(event.location)}`));
    }
    if (event.status) {
      lines.push(`STATUS:${event.status}`);
    }
    if (event.url) {
      lines.push(foldLine(`URL:${event.url}`));
    }
    if (event.organizer) {
      lines.push(foldLine(
        `ORGANIZER;CN=${escapeText(event.organizer.name)}:mailto:${event.organizer.email}`
      ));
    }
    if (event.attendee) {
      lines.push(foldLine(
        `ATTENDEE;CN=${escapeText(event.attendee.name)};RSVP=TRUE:mailto:${event.attendee.email}`
      ));
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseICalDate(value: string): Date | undefined {
  // Handle both TZID params (ignore) and pure UTC values
  const clean = value.replace(/[TZ]/g, (c, i, s) => {
    if (c === 'T') return 'T';
    if (c === 'Z') return 'Z';
    return c;
  });

  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return undefined;

  const [, yr, mo, dy, hh, mm, ss, utc] = match;
  const iso = `${yr}-${mo}-${dy}T${hh}:${mm}:${ss}${utc ? 'Z' : 'Z'}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function unfoldLines(raw: string): string[] {
  // RFC 5545 unfolding: CRLF + SPACE/TAB continuation
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r\n|\n/)
    .filter((l) => l.length > 0);
}

export function parseICalFeed(raw: string): ParsedICalEvent[] {
  const lines = unfoldLines(raw);
  const events: ParsedICalEvent[] = [];
  let current: ParsedICalEvent | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }

    if (!current) continue;

    // Split on first colon (params use semicolons before colon)
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;

    const rawKey = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    // Strip parameters (e.g., DTSTART;TZID=Europe/Belgrade)
    const key = rawKey.split(';')[0]?.toUpperCase() ?? '';

    switch (key) {
      case 'UID':
        current.uid = value;
        break;
      case 'SUMMARY':
        current.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
        break;
      case 'DESCRIPTION':
        current.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
        break;
      case 'LOCATION':
        current.location = value;
        break;
      case 'STATUS':
        current.status = value;
        break;
      case 'DTSTART': {
        const d = parseICalDate(value);
        if (d) current.dtstart = d;
        break;
      }
      case 'DTEND': {
        const d = parseICalDate(value);
        if (d) current.dtend = d;
        break;
      }
    }
  }

  return events;
}
