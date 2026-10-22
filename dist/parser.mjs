import { minutes, days } from './domain/time.mjs';

// Les nœuds texte sont lus une seule fois, même dans un tableau imbriqué.
export function clipboardText(html, text) {
  if (!html) return (text || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script,style,noscript').forEach(element => element.remove());
  const walker = document.createTreeWalker(document.body, 4);
  const parts = [];
  let node;
  while ((node = walker.nextNode())) parts.push(node.nodeValue);
  return parts.join('\n');
}
export function parseText(source) {
  const records = [];
  let active = null;
  const token = /\b(\d{2})[/.](\d{2})[/.](\d{4})\b|\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b|\b([0-2]?\d)[:h]([0-5]\d)\b/gi;
  for (const match of source.replace(/\u00a0/g, ' ').matchAll(token)) {
    if (match[1]) {
      const iso = `${match[3]}-${match[2]}-${match[1]}`;
      const date = new Date(iso + 'T12:00:00');
      if (Number.isNaN(+date) || date.getDate() !== Number(match[1]) || date.getMonth() + 1 !== Number(match[2])) {
        active = null;
        continue;
      }
      active = { day: (date.getDay() + 6) % 7, date: iso, times: [] };
      records.push(active);
    } else if (match[4]) {
      const day = days.findIndex(value => value.toLowerCase() === match[4].toLowerCase());
      if (!active || active.day !== day) {
        active = { day, date: null, times: [] };
        records.push(active);
      }
    } else if (active && active.times.length < 4) {
      const time = match[5].padStart(2, '0') + ':' + match[6];
      if (minutes(time) !== null) active.times.push(time);
    }
  }
  const seen = new Set();
  return records.filter(row => row.day >= 0 && row.day < 5 && row.times.length).filter(row => {
    const key = row.date || row.day;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function parsePaste(html, text) {
  return parseText(clipboardText(html, text));
}
