import { minutes, dateAt, localDate } from './time.mjs';

export function departureAvailability(rows, start, now = new Date()) {
  const index = rows.findIndex((_, i) => dateAt(start, i) === localDate(now));
  if (index < 0) return { index, reason: 'Aujourd’hui ne fait pas partie de cette semaine de travail.' };
  const row = rows[index];
  if (row.real[3]) return { index, reason: 'Le départ d’aujourd’hui est déjà un badgeage réel.' };
  const resume = minutes(row.times[2]);
  if (resume === null) return { index, reason: 'Renseignez l’heure de reprise avant de simuler un départ.' };
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < resume) return { index, reason: 'Disponible à partir de la reprise à ' + row.times[2] + '.' };
  return { index, reason: '' };
}
