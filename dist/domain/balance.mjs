import { days, minutes, clock, worked, total, dateAt, localDate, duration } from './time.mjs';
import { modes, limits, issues } from './settings.mjs';

// Les réglages du mode définissent l’ordre ; la répartition se fait à la minute entre les jours.
export function balance(rows, profile, start, now = new Date()) {
  const today = localDate(now), current = now.getHours() * 60 + now.getMinutes();
  if (rows.some(r => worked(r) === null)) throw Error('Complétez les horaires dans l’ordre avant d’équilibrer.');
  rows.forEach((row, i) => {
    if (dateAt(start, i) < today && !row.real.every(Boolean)) {
      throw Error(`${days[i]} : badgeages passés incomplets. Collez une semaine complète avant d’équilibrer.`);
    }
  });
  const result = structuredClone(rows), bounds = limits(profile);
  const editable = (i, j) => {
    const row = result[i], date = dateAt(start, i);
    return date >= today && !row.real[j] && !row.locks[j] &&
      (date > today || minutes(rows[i].times[j]) >= current);
  };
  const valid = (row, i) => {
    if (worked(row) === null) return false;
    for (let j = 0; j < 4; j++) {
      const value = minutes(row.times[j]);
      if (editable(i, j) && (value < bounds[j].min || value > bounds[j].max)) return false;
      if (editable(i, j) && dateAt(start, i) === today && value < current) return false;
    }
    const pause = minutes(row.times[2]) - minutes(row.times[1]);
    if (editable(i, 1) || editable(i, 2)) {
      if (pause < profile.rules.minBreak || pause > profile.comfort.maxBreak) return false;
    }
    if (editable(i, 3) && minutes(row.times[3]) > profile.comfort.latestDeparture) return false;
    return true;
  };
  // Une saisie invalide n’est pas corrigée silencieusement par le moteur.
  result.forEach((row, i) => {
    if (dateAt(start, i) >= today && issues(row, profile).length) {
      throw Error(`${days[i]} : ${issues(row, profile).join(', ')}. Corrigez la simulation avant d’équilibrer.`);
    }
  });
  let delta = profile.target - total(result);
  const sign = Math.sign(delta);
  const group = { departure: [3], lunch: [2, 1], arrival: [0] };
  const order = profile.version === 3 ? profile.priorities.flatMap(key => group[key]) : modes[profile.mode].order;
  for (const j of order) {
    // Une arrivée/reprise retardée réduit l’effectif ; les deux sorties font l’inverse.
    const direction = sign * (j === 0 || j === 2 ? -1 : 1);
    let progress = true;
    while (delta && progress) {
      progress = false;
      for (let i = 0; i < result.length && delta; i++) {
        if (!editable(i, j)) continue;
        const old = result[i].times[j], next = minutes(old) + direction;
        if (next < 0 || next > 1439) continue;
        result[i].times[j] = clock(next);
        if (!valid(result[i], i)) { result[i].times[j] = old; continue; }
        delta -= sign;
        progress = true;
      }
    }
    if (!delta) break;
  }
  if (delta) {
    throw Error(`Objectif inaccessible avec les cadenas et les limites. Meilleur total : ${duration(total(result))} (${duration(Math.abs(delta))} ${delta < 0 ? 'en trop' : 'manquantes'}). Aucun changement appliqué.`);
  }
  return result;
}
