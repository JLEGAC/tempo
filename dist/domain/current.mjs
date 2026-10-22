import { localDate, minutes } from './time.mjs';
// Seuls les intervalles réels sont additionnés. Un intervalle ouvert est
// prolongé jusqu’à maintenant uniquement pour la date du jour.
export function currentWorked(week, now = new Date()) {
  const today = localDate(now), current = now.getHours() * 60 + now.getMinutes();
  let total = 0;
  for (const day of week?.days ?? []) {
    if (day.date > today) continue;
    const t = day.times.map(minutes);
    for (const [a, b] of [[0, 1], [2, 3]]) {
      if (t[a] === null) continue;
      const end = t[b] ?? (day.date === today ? current : null);
      if (end !== null) total += Math.max(0, (day.date === today ? Math.min(end, current) : end) - t[a]);
    }
  }
  return total;
}
