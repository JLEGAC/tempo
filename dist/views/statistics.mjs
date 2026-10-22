import { weekStats } from '../domain/history.mjs';
import { days, duration, clock, minutes, dateAt } from '../domain/time.mjs';
import { bars, trend } from './charts.mjs';
const $ = id => document.getElementById(id);
const label = start => new Date(start + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
export function setupStatistics(getWeeks) {
  let selection = null;
  function render() {
    const all = [...getWeeks()].sort((a, b) => a.start.localeCompare(b.start));
    $('statsEmpty').hidden = !!all.length;
    $('statsContent').hidden = !all.length;
    if (!all.length) return;
    const count = Number($('statsRange').value);
    const weeks = count ? all.slice(-count) : all;
    const complete = weeks.filter(w => weekStats(w).complete);
    $('statsInfo').textContent = `${weeks.length} semaine${weeks.length > 1 ? 's' : ''} enregistrée${weeks.length > 1 ? 's' : ''}, dont ${complete.length} complète${complete.length > 1 ? 's' : ''}. Aucun horaire simulé dans les graphiques.`;
    bars($('weeksChart'), 'Heures réelles et objectif par semaine', weeks.map(week => ({
      label: label(week.start), value: weekStats(week).minutes, target: week.target, complete: weekStats(week).complete,
    })), true);
    const options = $('statsWeek');
    if (!all.some(w => w.start === selection)) selection = all.at(-1).start;
    options.replaceChildren();
    [...all].reverse().forEach(week => {
      const option = document.createElement('option');
      option.value = week.start;
      option.textContent = `Semaine du ${new Date(week.start + 'T12:00:00').toLocaleDateString('fr-FR')}`;
      options.append(option);
    });
    options.value = selection;
    const week = all.find(w => w.start === selection), stats = weekStats(week);
    bars($('dailyChart'), 'Temps réel travaillé par jour', stats.days.map((day, i) => ({
      label: days[i], value: day.minutes, complete: day.complete,
    })));
    $('dailyInfo').textContent = `${duration(stats.minutes)} réellement décomptées · ${stats.complete ? 'semaine complète' : 'semaine incomplète, seuls les intervalles entièrement badgés sont comptés'}.`;
    const metric = $('habitMetric').value;
    const names = { arrival: 'Heure d’arrivée', departure: 'Heure de départ', lunch: 'Durée du déjeuner' };
    const recorded = all.flatMap(w => w.days).filter(d => d.times.some(Boolean));
    const end = recorded.map(d => d.date).sort().at(-1);
    const items = Array.from({ length: 7 }, (_, i) => {
      const date = dateAt(end, i - 6), day = recorded.find(d => d.date === date);
      const times = day?.times.map(minutes) ?? [null, null, null, null];
      const value = metric === 'arrival' ? times[0] : metric === 'departure' ? times[3]
        : times[1] !== null && times[2] !== null ? times[2] - times[1] : null;
      return { label: label(date), value, complete: day?.times.every(Boolean) ?? false };
    });
    trend($('habitsChart'), names[metric], items, metric !== 'lunch');
    const last = [...items].reverse().find(item => item.value !== null);
    $('habitsInfo').textContent = last
      ? `7 jours jusqu’au dernier badgeage importé. Dernière valeur : ${metric === 'lunch' ? duration(last.value) : clock(last.value)}. Journées incomplètes incluses selon les badgeages disponibles.`
      : '7 jours jusqu’au dernier badgeage importé. Les valeurs absentes restent vides.';
  }
  $('statsRange').onchange = render;
  $('statsWeek').onchange = () => { selection = $('statsWeek').value; render(); };
  $('habitMetric').onchange = render;
  return { render };
}
