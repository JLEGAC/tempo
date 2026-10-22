import { minutes, dateAt, clock } from './time.mjs';
import { migrate } from './settings.mjs';

export function realWeek(rows, start, target, previous = null, now = new Date()) {
  return {
    start, target: previous?.target ?? target, updatedAt: now.toISOString(),
    days: rows.map((row, i) => ({
      date: dateAt(start, i),
      times: row.times.map((time, j) => row.real[j] ? time : null),
    })),
  };
}
export function dayStats(day) {
  const values = day.times.map(minutes);
  const ordered = values.filter(value => value !== null);
  const valid = ordered.every((value, i) => !i || value >= ordered[i - 1]);
  if (!valid) return { minutes: 0, complete: false, invalid: true };
  const interval = (a, b) => values[a] !== null && values[b] !== null ? values[b] - values[a] : 0;
  return { minutes: interval(0, 1) + interval(2, 3), complete: values.every(v => v !== null), invalid: false };
}
export function weekStats(week) {
  const days = week.days.map(dayStats);
  return { minutes: days.reduce((sum, d) => sum + d.minutes, 0), complete: days.every(d => d.complete), days };
}
export function habits(week) {
  const complete = week.days.filter(day => dayStats(day).complete);
  if (!complete.length) return null;
  const average = getter => Math.round(complete.reduce((sum, d) => sum + getter(d), 0) / complete.length);
  return {
    count: complete.length,
    arrival: average(d => minutes(d.times[0])),
    departure: average(d => minutes(d.times[3])),
    lunch: average(d => minutes(d.times[2]) - minutes(d.times[1])),
  };
}
export function validWeek(week) {
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week.start || '')) return false;
  const date = new Date(week.start + 'T12:00:00');
  if (Number.isNaN(+date) || date.getDay() !== 1 || dateAt(week.start, 0) !== week.start) return false;
  if (!Number.isInteger(week.target) || week.target < 1 || week.target > 10080) return false;
  if (typeof week.updatedAt !== 'string' || Number.isNaN(Date.parse(week.updatedAt))) return false;
  return Array.isArray(week.days) && week.days.length === 5 && week.days.every((day, i) =>
    day.date === dateAt(week.start, i) && Array.isArray(day.times) && day.times.length === 4 &&
    day.times.every(t => t === null || typeof t === 'string' && minutes(t) !== null) && !dayStats(day).invalid,
  );
}
export function backup(profile, weeks) {
  return { type: 'tempo-backup', version: 1, exportedAt: new Date().toISOString(), profile, weeks };
}
export function decodeBackup(value) {
  if (value?.type !== 'tempo-backup') return { profile: migrate(value), weeks: [] };
  if (value.version !== 1 || !Array.isArray(value.weeks) || !value.weeks.every(validWeek)) throw Error('Sauvegarde invalide.');
  if (new Set(value.weeks.map(w => w.start)).size !== value.weeks.length) throw Error('Semaines en doublon.');
  return { profile: migrate(value.profile), weeks: structuredClone(value.weeks) };
}
