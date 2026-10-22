import { days, minutes, worked } from './time.mjs';

export const modes = {
  departure: { name: 'Partir plus tôt en priorité', order: [3, 2, 1, 0] },
  lunch: { name: 'Allonger le déjeuner en priorité', order: [2, 1, 3, 0] },
  arrival: { name: 'Arriver plus tard en priorité', order: [0, 3, 2, 1] },
};
export function defaults() {
  return {
    version: 3, theme: 'light', target: 2280, mode: 'departure', priorities: ['departure', 'lunch', 'arrival'],
    kelioUrl: 'https://groupe-installux.kelio.io/open/bwt/portail.jsp#resultats_personnels',
    rules: { arrivalMin: 0, arrivalMax: 540, lunchStart: 720, lunchEnd: 840, minBreak: 30, departureMin: 960, departureMax: 1080 },
    comfort: { latestDeparture: 1080, maxBreak: 120 },
    schedule: days.map((_, i) => ({
      times: ['09:00', '13:00', '13:30', i === 4 ? '16:00' : '17:30'],
      locks: [false, false, false, i === 4],
    })),
  };
}
export function safeUrl(value) {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}
export function validateSettings(p) {
  if (!p || ![1, 2, 3].includes(p.version) || !['light', 'dark'].includes(p.theme || 'light')) return false;
  if (!Number.isInteger(p.target) || p.target < 1 || p.target > 10080) return false;
  if (!Array.isArray(p.schedule) || p.schedule.length !== 5) return false;
  if (!p.schedule.every(r => r.times?.length === 4 && r.times.every(t => minutes(t) !== null) && worked(r) !== null && r.locks?.length === 4 && r.locks.every(t => typeof t === 'boolean'))) return false;
  if (p.version === 1) return true;
  if (!modes[p.mode] || !safeUrl(p.kelioUrl)) return false;
  if (p.version === 3 && (!Array.isArray(p.priorities) || p.priorities.length !== 3 || new Set(p.priorities).size !== 3 || !p.priorities.every(k => modes[k]))) return false;
  const r = p.rules, c = p.comfort;
  if (!r || !c || !Object.values(r).every(v => Number.isInteger(v) && v >= 0 && v < 1440)) return false;
  return r.arrivalMin <= r.arrivalMax && r.arrivalMax <= r.lunchStart && r.lunchStart <= r.lunchEnd &&
    r.lunchEnd <= r.departureMin && r.departureMin <= r.departureMax && r.minBreak <= r.lunchEnd - r.lunchStart &&
    Number.isInteger(c.latestDeparture) && c.latestDeparture >= r.departureMin && c.latestDeparture <= r.departureMax &&
    Number.isInteger(c.maxBreak) && c.maxBreak >= r.minBreak && c.maxBreak <= r.lunchEnd - r.lunchStart;
}
export function migrate(value) {
  if (!validateSettings(value)) throw Error('Réglages invalides.');
  if (value.version === 3) return structuredClone(value);
  const profile = value.version === 1 ? { ...defaults(), ...value } : structuredClone(value);
  const mode = profile.mode || 'departure';
  const priorities = mode === 'arrival' ? ['arrival', 'departure', 'lunch'] : mode === 'lunch' ? ['lunch', 'departure', 'arrival'] : ['departure', 'lunch', 'arrival'];
  return { ...profile, theme: profile.theme || 'light', version: 3, priorities };
}
export function limits(profile) {
  const r = profile.rules;
  return [
    { min: r.arrivalMin, max: r.arrivalMax },
    { min: r.lunchStart, max: r.lunchEnd },
    { min: r.lunchStart, max: r.lunchEnd },
    { min: r.departureMin, max: r.departureMax },
  ];
}
export function issues(row, profile) {
  if (worked(row) === null) return ['Horaires incomplets ou dans le mauvais ordre'];
  const bounds = limits(profile), result = [];
  row.times.forEach((time, j) => {
    if (row.real?.[j]) return;
    const n = minutes(time);
    if (n < bounds[j].min || n > bounds[j].max) result.push('Horaire simulé hors plage');
  });
  const pause = minutes(row.times[2]) - minutes(row.times[1]);
  if (!(row.real?.[1] && row.real?.[2]) && pause < profile.rules.minBreak) result.push('Pause simulée trop courte');
  return [...new Set(result)];
}
