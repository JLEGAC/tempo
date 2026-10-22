import { days, labels, minutes, clock, worked, duration, dateAt, localDate } from '../domain/time.mjs';
import { limits, issues } from '../domain/settings.mjs';

export function timeCell(row, i, j, profile, onChange, settings = false) {
  const box = document.createElement('div');
  box.className = 'timebox';
  const input = document.createElement('input');
  input.type = 'time';
  input.value = row.times[j];
  input.setAttribute('aria-label', `${days[i]} ${labels[j].toLowerCase()}`);
  input.readOnly = !settings && row.real[j];
  const range = limits(profile)[j];
  input.min = clock(range.min);
  input.max = clock(range.max);
  if (input.readOnly) input.className = 'real';
  input.onchange = () => { row.times[j] = input.value; onChange(); };
  box.append(input);
  if (settings || !row.real[j]) {
    const lock = document.createElement('button');
    lock.type = 'button';
    lock.className = 'lock';
    const update = () => {
      lock.textContent = row.locks[j] ? '🔒' : '○';
      lock.setAttribute('aria-pressed', String(row.locks[j]));
    };
    lock.setAttribute('aria-label', `Verrouiller ${days[i]} ${labels[j].toLowerCase()}`);
    lock.onclick = () => { row.locks[j] = !row.locks[j]; update(); onChange(); };
    update();
    box.append(lock);
  }
  return box;
}
export function renderTable(body, rows, start, profile, onChange) {
  body.replaceChildren();
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    if (dateAt(start, i) === localDate(new Date())) tr.className = 'today';
    const name = document.createElement('td');
    const label = document.createElement('strong');
    label.textContent = days[i];
    const date = document.createElement('small');
    date.textContent = new Date(dateAt(start, i) + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const status = document.createElement('small');
    status.id = 'status' + i;
    name.append(label, date, status);
    tr.append(name);
    row.times.forEach((_, j) => {
      const cell = document.createElement('td');
      cell.append(timeCell(row, i, j, profile, onChange));
      tr.append(cell);
    });
    for (const prefix of ['pause', 'effect', 'cumul']) {
      const cell = document.createElement('td');
      cell.id = prefix + i;
      tr.append(cell);
    }
    body.append(tr);
  });
}
export function updateTable(rows, start, profile) {
  let cumulative = 0;
  const today = localDate(new Date());
  rows.forEach((row, i) => {
    const value = worked(row), date = dateAt(start, i);
    cumulative = value === null || cumulative === null ? null : cumulative + value;
    const pause = minutes(row.times[2]) !== null && minutes(row.times[1]) !== null ? minutes(row.times[2]) - minutes(row.times[1]) : null;
    document.getElementById('pause' + i).textContent = pause === null || pause < 0 ? '—' : duration(pause);
    document.getElementById('effect' + i).textContent = value === null ? '—' : duration(value);
    document.getElementById('cumul' + i).textContent = cumulative === null ? '—' : duration(cumulative);
    const count = row.real.filter(Boolean).length;
    const state = count === 4 ? 'Réel complet' : date < today ? 'Badgeages manquants · simulation' : date === today ? 'Journée en cours · prévision' : 'Simulation';
    const errors = issues(row, profile);
    const status = document.getElementById('status' + i);
    status.textContent = errors.length ? `${state} · ${errors.join(', ')}` : state;
    status.className = errors.length || date < today && count < 4 ? 'warning' : '';
  });
}
