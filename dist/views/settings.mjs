import { days, clock } from '../domain/time.mjs';
import { defaults, migrate, modes } from '../domain/settings.mjs';
import { timeCell } from './table.mjs';

const $ = id => document.getElementById(id);
const fields = [
  ['arrivalMin', 'Arrivée au plus tôt', 'time'],
  ['arrivalMax', 'Arrivée au plus tard', 'time'],
  ['lunchStart', 'Début de la plage déjeuner', 'time'],
  ['lunchEnd', 'Fin de la plage déjeuner', 'time'],
  ['minBreak', 'Pause minimale (minutes)', 'number'],
  ['departureMin', 'Départ au plus tôt', 'time'],
  ['departureMax', 'Départ au plus tard', 'time'],
];
export function setupSettings(getProfile, save, notify, setTheme) {
  let draft;
  function render() {
    draft = structuredClone(getProfile());
    $('goal').value = clock(draft.target);
    $('theme').value = draft.theme;
    $('kelioUrl').value = draft.kelioUrl;
    renderOrder();
    $('rulesFields').replaceChildren();
    fields.forEach(([key, title, type]) => addField(key, title, type, draft.rules[key]));
    addField('latestDeparture', 'Confort : départ souhaité au plus tard', 'time', draft.comfort.latestDeparture);
    addField('maxBreak', 'Confort : pause maximale (minutes)', 'number', draft.comfort.maxBreak);
    $('schedule').replaceChildren();
    draft.schedule.forEach((row, i) => {
      const tr = document.createElement('tr'), name = document.createElement('td');
      name.textContent = days[i];
      tr.append(name);
      row.times.forEach((_, j) => {
        const cell = document.createElement('td');
        cell.append(timeCell(row, i, j, draft, () => {}, true));
        tr.append(cell);
      });
      $('schedule').append(tr);
    });
  }
  function renderOrder() {
    const container = $('priorityOrder');
    container.replaceChildren();
    draft.priorities.forEach((key, index) => {
      const row = document.createElement('div');
      row.className = 'priorityRow';
      const name = document.createElement('span');
      name.textContent = `${index + 1}. ${modes[key].name.replace(' en priorité', '')}`;
      row.append(name);
      for (const [delta, symbol, verb] of [[-1, '↑', 'Monter'], [1, '↓', 'Descendre']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = symbol;
        button.disabled = index + delta < 0 || index + delta > 2;
        button.setAttribute('aria-label', `${verb} ${name.textContent}`);
        button.onclick = () => {
          const target = index + delta;
          [draft.priorities[index], draft.priorities[target]] = [draft.priorities[target], draft.priorities[index]];
          renderOrder();
        };
        row.append(button);
      }
      container.append(row);
    });
  }
  function addField(key, title, type, value) {
    const label = document.createElement('label'), input = document.createElement('input');
    label.textContent = title;
    input.id = 'rule-' + key;
    input.type = type;
    input.value = type === 'time' ? clock(value) : value;
    if (type === 'number') { input.min = '0'; input.max = '1439'; input.step = '1'; }
    label.append(input);
    $('rulesFields').append(label);
  }
  function readValue(key, type) {
    const value = $('rule-' + key).value;
    if (type === 'time') {
      if (!/^\d{2}:\d{2}$/.test(value)) throw Error('Complétez toutes les plages horaires.');
      const [h, m] = value.split(':').map(Number);
      return h * 60 + m;
    }
    if (!value) throw Error('Complétez toutes les durées.');
    return Number(value);
  }
  $('saveSettings').onclick = async () => {
    try {
      const goal = $('goal').value.match(/^(\d{1,3}):([0-5]\d)$/);
      if (!goal) throw Error('Objectif attendu au format heures:minutes.');
      draft.target = Number(goal[1]) * 60 + Number(goal[2]);
      draft.mode = draft.priorities[0];
      draft.theme = getProfile().theme;
      draft.kelioUrl = $('kelioUrl').value.trim();
      fields.forEach(([key, , type]) => { draft.rules[key] = readValue(key, type); });
      draft.comfort.latestDeparture = readValue('latestDeparture', 'time');
      draft.comfort.maxBreak = readValue('maxBreak', 'number');
      const profile = migrate(draft);
      await save(profile);
      notify('Réglages enregistrés. Plages et objectif appliqués ; semaine type utilisée au prochain collage.');
    } catch (error) { notify(error.message + ' Vérifiez aussi que les limites de confort restent dans les plages autorisées.'); }
  };
  $('theme').onchange = () => setTheme($('theme').value);
  return { render };
}
