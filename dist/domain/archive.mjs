import { localDate, dateAt, minutes } from './time.mjs';
import { validWeek } from './history.mjs';
// Accepte le texte TSV d’Excel et les tableaux Markdown, sans déplacer
// les cellules vides (notamment une journée encore incomplète).
export function parseArchive(text) {
  const records = [], seen = new Set();
  for (const line of text.replace(/\u00a0/g, ' ').split(/\r?\n/)) {
    if (!/^\s*\|?\s*\d{2}\/\d{2}\/\d{2,4}(?:\s|\||$)/.test(line)) continue;
    const cells = line.includes('|') ? line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|')
      : line.includes('\t') ? line.split('\t') : line.trim().split(/\s+/);
    const [dateText, ...values] = cells.map(s => s.trim());
    const match = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(dateText);
    if (!match) throw Error('Date non reconnue.');
    const [, d, m, y] = match, year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const date = new Date(year, Number(m) - 1, Number(d), 12);
    if (date.getFullYear() !== year || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) throw Error(`Date invalide : ${dateText}`);
    if (![1,2,3,4,5].includes(date.getDay())) throw Error(`Jour hors lundi–vendredi : ${dateText}`);
    const key = localDate(date);
    if (seen.has(key)) throw Error(`Date en doublon : ${dateText}`);
    seen.add(key);
    if (values.length > 4 && values.slice(4).some(Boolean)) throw Error(`Colonnes supplémentaires : ${dateText}`);
    const times = Array.from({ length: 4 }, (_, i) => values[i] || null);
    if (times.some(t => t !== null && minutes(t) === null)) throw Error(`Horaire invalide : ${dateText}`);
    date.setDate(date.getDate() - date.getDay() + 1);
    records.push({ date: key, start: localDate(date), times });
  }
  if (!records.length) throw Error('Aucune ligne datée reconnue. Collez les colonnes Jour, Arrivée, Déjeuner, Reprise, Départ.');
  return records;
}
export function mergeArchive(records, weeks, target, now = new Date()) {
  const merged = new Map();
  for (const record of records) {
    if (!merged.has(record.start)) {
      const previous = weeks.find(w => w.start === record.start);
      merged.set(record.start, previous ? structuredClone(previous) : {
        start: record.start, target, days: Array.from({ length: 5 }, (_, i) => ({date: dateAt(record.start, i), times: [null,null,null,null]})),
      });
    }
    const week = merged.get(record.start);
    week.updatedAt = now.toISOString();
    week.days.find(d => d.date === record.date).times = [...record.times];
  }
  const result = [...merged.values()];
  if (!result.every(validWeek)) throw Error('Des horaires ne respectent pas l’ordre chronologique. Aucun import effectué.');
  return result;
}
