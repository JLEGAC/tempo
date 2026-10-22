import { days, minutes, clock, duration, total, weekDate, localDate, dateAt, fresh } from './domain/time.mjs';
import { defaults, migrate } from './domain/settings.mjs';
import { departureAvailability } from './domain/departure.mjs';
import { balance } from './domain/balance.mjs';
import { renderTable, updateTable } from './views/table.mjs';
import { setupSettings } from './views/settings.mjs';
import { setupImport } from './services/import.mjs';
import { settingsStore, readWeeks, saveWeek } from './storage.mjs';
import { realWeek, validWeek } from './domain/history.mjs';
import { setupStatistics } from './views/statistics.mjs';
import { renderGauge } from './views/gauge.mjs';
import { setupHistoryImport } from './services/history-import.mjs';
import { setupBackup } from './services/backup.mjs';

const $ = id => document.getElementById(id);
let profile = defaults(), start = weekDate(), rows, undo = null, lastTotal = null, weeks = [];
function message(text) { $('message').textContent = text; }
try {
  const saved = await settingsStore();
  if (saved) profile = migrate(saved);
} catch { message('Stockage indisponible ou réglages illisibles. Les réglages par défaut sont utilisés.'); }
try { weeks = await readWeeks(); } catch { message('Historique local indisponible.'); }
rows = fresh(profile);
$('weekDate').value = start;

function applyTheme() {
  const dark = profile.theme === 'dark', button = $('themeToggle');
  document.documentElement.dataset.theme = profile.theme;
  document.querySelector('meta[name=theme-color]').content = dark ? '#212830' : '#526e7f';
  button.textContent = dark ? '☀' : '☾';
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', dark ? 'Activer le thème clair' : 'Activer le thème sombre');
  button.title = button.getAttribute('aria-label');
  $('theme').value = profile.theme;
}
async function saveProfile(value) {
  await settingsStore(value);
  profile = value;
  undo = null;
  applyTheme();
  render();
}
async function changeTheme(theme) {
  profile.theme = theme;
  applyTheme();
  try { await settingsStore(profile); } catch { message('Thème appliqué pour cette session.'); }
}
const settings = setupSettings(() => profile, saveProfile, message, changeTheme);
const statistics = setupStatistics(() => weeks);
setupBackup(() => profile, () => weeks, async value => {
  profile = value;
  weeks = await readWeeks();
  undo = null;
  applyTheme();
  render();
  settings.render();
  statistics.render();
}, message);
$('themeToggle').onclick = () => changeTheme(profile.theme === 'dark' ? 'light' : 'dark');

setupHistoryImport(() => profile, () => weeks, async () => {
  weeks = await readWeeks(); statistics.render(); updateCountdown();
}, message);

function updateCountdown() {
  renderGauge($('liveGauge'), weeks, profile.target);
  const availability = departureAvailability(rows, start);
  $('nowBtn').disabled = !!availability.reason;
  $('nowBtn').title = availability.reason || 'Remplacer le départ simulé par l’heure actuelle';
  const now = new Date(), index = rows.findIndex((_, i) => dateAt(start, i) === localDate(now));
  if (index < 0) { $('countdown').textContent = 'Aucune journée en cours dans cette semaine.'; return; }
  const row = rows[index], end = minutes(row.times[3]);
  if (end === null) { $('countdown').textContent = 'Renseignez le départ prévu aujourd’hui.'; return; }
  if (row.real[3]) { $('countdown').textContent = `Départ badgé aujourd’hui à ${row.times[3]}.`; return; }
  const remaining = end - (now.getHours() * 60 + now.getMinutes());
  $('countdown').textContent = remaining > 0
    ? `Aujourd’hui : départ prévu à ${row.times[3]} · reste ${duration(remaining)}`
    : `Aujourd’hui : départ prévu à ${row.times[3]} · horaire atteint`;
}
function update() {
  const sum = total(rows);
  $('target').textContent = duration(profile.target);
  $('total').textContent = sum === null ? 'À compléter' : duration(sum);
  $('balance').textContent = sum === null ? '—' : (sum > profile.target ? '+' : '') + duration(sum - profile.target);
  $('balanceText').textContent = sum === null ? 'Vérifiez les horaires' : sum === profile.target ? 'Semaine à l’équilibre' : sum < profile.target ? 'à prévoir pour atteindre l’objectif' : 'au-delà de l’objectif';
  updateTable(rows, start, profile);
  if (sum !== null && lastTotal !== null && sum !== lastTotal) {
    $('impact').textContent = `Dernier changement : ${sum > lastTotal ? '+' : ''}${duration(sum - lastTotal)}`;
  }
  lastTotal = sum;
  $('undoBtn').disabled = !undo;
  updateCountdown();
}
function changed() { undo = null; update(); }
function render() {
  renderTable($('rows'), rows, start, profile, changed);
  update();
}
function route() {
  const active = location.hash === '#parametres' ? 'settings' : location.hash === '#statistiques' ? 'stats' : 'week';
  for (const [key, view, nav] of [['week', 'weekView', 'weekNav'], ['settings', 'settingsView', 'settingsNav'], ['stats', 'statsView', 'statsNav']]) {
    $(view).hidden = active !== key;
    $(nav).classList.toggle('active', active === key);
  }
  if (active === 'settings') settings.render();
  if (active === 'stats') statistics.render();
}
function navigate(hash) { history.pushState({}, '', hash || location.pathname); route(); }
$('weekNav').onclick = () => navigate('');
$('settingsNav').onclick = () => navigate('#parametres');
$('statsNav').onclick = () => navigate('#statistiques');
window.onpopstate = route;
$('weekDate').onchange = () => {
  const date = new Date($('weekDate').value + 'T12:00:00');
  if (Number.isNaN(+date) || date.getDay() !== 1) {
    $('weekDate').value = start;
    return message('Sélectionnez le lundi de la semaine.');
  }
  start = $('weekDate').value;
  rows = fresh(profile);
  undo = null;
  lastTotal = null;
  render();
};
$('balanceBtn').onclick = () => {
  try {
    const result = balance(rows, profile, start);
    undo = structuredClone(rows);
    rows = result;
    render();
    message('Semaine équilibrée selon la préférence choisie et les horaires verrouillés.');
  } catch (error) { message(error.message); }
};
$('undoBtn').onclick = () => {
  if (!undo) return;
  rows = undo;
  undo = null;
  render();
  message('Dernier équilibrage annulé.');
};
$('nowBtn').onclick = () => {
  const now = new Date(), availability = departureAvailability(rows, start, now);
  if (availability.reason) return message(availability.reason);
  const i = availability.index, current = now.getHours() * 60 + now.getMinutes();
  rows[i].times[3] = clock(current);
  changed();
  render();
  message('Départ simulé remplacé par l’heure actuelle. Tout écart aux plages apparaît dans le tableau.');
};
setupImport(() => profile, async records => {
  const dated = records.find(row => row.date);
  if (dated) {
    const date = new Date(dated.date + 'T12:00:00');
    date.setDate(date.getDate() - dated.day);
    start = localDate(date);
  }
  const next = fresh(profile);
  records.forEach(record => {
    if (record.date && record.date !== dateAt(start, record.day)) return;
    record.times.forEach((time, j) => { next[record.day].times[j] = time; next[record.day].real[j] = true; });
  });
  const week = realWeek(next, start, profile.target, weeks.find(w => w.start === start));
  if (!validWeek(week)) throw Error('Les badgeages reconnus ne sont pas dans un ordre chronologique valide. Vérifiez le contenu copié.');
  try { await saveWeek(week); weeks = await readWeeks(); }
  catch { throw Error('Badgeages reconnus mais enregistrement local impossible. Vérifiez le stockage puis réessayez.'); }
  rows = next;
  undo = null;
  lastTotal = null;
  $('weekDate').value = start;
  render();
}, message);
let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  $('install').hidden = false;
});
$('install').onclick = async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  $('install').hidden = true;
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
setInterval(updateCountdown, 15000);
applyTheme();
render();
route();
