// ─── Time formatting via Intl.DateTimeFormat (no external APIs) ──────────────

import { resolveTz } from './settings';

export interface TimeParts {
  hours: string[]; // e.g. ['0','4'] or ['4'] (12h without leading zero)
  minutes: string[]; // ['4','6']
  seconds: string; // '57'
  ampm: string; // 'AM' | 'PM' | ''
  date: string; // 'Sunday, Aug 2'
  tzShort: string; // 'CST' | 'JST' | 'Local'
}

export function getTimeParts(
  now: Date,
  timeZone: string,
  hour12: boolean,
  leadingZero: boolean,
): TimeParts {
  const tz = resolveTz(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: hour12 ? (leadingZero ? '2-digit' : 'numeric') : '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
    timeZone: tz,
  }).formatToParts(now);

  let hour = '';
  let minute = '';
  let second = '';
  let dayPeriod = '';
  for (const p of parts) {
    if (p.type === 'hour') hour = p.value;
    else if (p.type === 'minute') minute = p.value;
    else if (p.type === 'second') second = p.value;
    else if (p.type === 'dayPeriod') dayPeriod = p.value;
  }

  const hourStr = hour12 ? (leadingZero ? hour.padStart(2, '0') : hour) : hour.padStart(2, '0');

  return {
    hours: hourStr.split(''),
    minutes: minute.split(''),
    seconds: second,
    ampm: dayPeriod.toUpperCase(),
    date: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    }).format(now),
    tzShort: tzShortName(now, timeZone),
  };
}

export function tzShortName(now: Date, timeZone: string): string {
  if (timeZone === 'local') return 'Local';
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'short' }).formatToParts(now);
    const t = parts.find((p) => p.type === 'timeZoneName');
    return t ? t.value : timeZone;
  } catch {
    return timeZone;
  }
}

export function tzCityName(timeZone: string): string {
  if (timeZone === 'local') return 'Local';
  const last = timeZone.split('/').pop();
  return last ? last.replace(/_/g, ' ') : timeZone;
}

export function hour24(now: Date, timeZone: string): number {
  const tz = resolveTz(timeZone);
  return parseInt(
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: tz }).format(now),
    10,
  );
}

const FALLBACK_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Manila',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Jakarta',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'Atlantic/Reykjavik',
];

export function buildZoneGroups(): { region: string; zones: string[] }[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = FALLBACK_ZONES;
  }
  if (zones.length === 0) zones = FALLBACK_ZONES;

  const map = new Map<string, string[]>();
  for (const z of zones) {
    const region = z.includes('/') ? z.split('/')[0] : 'Other';
    if (!map.has(region)) map.set(region, []);
    map.get(region)!.push(z);
  }
  const order = ['America', 'Europe', 'Asia', 'Australia', 'Africa', 'Atlantic', 'Pacific', 'Indian', 'Other'];
  return [...map.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0]) === -1 ? 99 : order.indexOf(a[0]);
      const ib = order.indexOf(b[0]) === -1 ? 99 : order.indexOf(b[0]);
      return ia - ib;
    })
    .map(([region, zoneList]) => ({ region, zones: zoneList.sort() }));
}
