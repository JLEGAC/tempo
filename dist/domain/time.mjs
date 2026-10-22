export const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
export const labels = ['Arrivée', 'Déjeuner', 'Reprise', 'Départ'];

export function minutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
  const [hours, mins] = value.split(':').map(Number);
  return hours < 24 && mins < 60 ? hours * 60 + mins : null;
}
export function clock(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function duration(value) {
  return `${value < 0 ? '−' : ''}${Math.floor(Math.abs(value) / 60)} h ${String(Math.abs(value) % 60).padStart(2, '0')}`;
}
export function worked(row) {
  const times = row.times.map(minutes);
  if (times.some(t => t === null) || times.some((t, i) => i && t < times[i - 1])) return null;
  return times[1] - times[0] + times[3] - times[2];
}
export function total(rows) {
  const values = rows.map(worked);
  return values.includes(null) ? null : values.reduce((sum, t) => sum + t, 0);
}
export function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateAt(start, offset) {
  const date = new Date(start + 'T12:00:00');
  date.setDate(date.getDate() + offset);
  return localDate(date);
}
export function weekDate() {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDate(date);
}
export function fresh(profile) {
  return profile.schedule.map(row => ({
    times: [...row.times], locks: [...row.locks], real: [false, false, false, false],
  }));
}
