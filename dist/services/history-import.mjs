import { parseArchive, mergeArchive } from '../domain/archive.mjs';
import { clock } from '../domain/time.mjs';
import { saveWeeks } from '../storage.mjs';
export function setupHistoryImport(getProfile, getWeeks, accepted, notify) {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `<form method="dialog"><button class="close" aria-label="Fermer">×</button></form>
    <h2>Importer d’anciens badgeages</h2><div class="historyFields">
    <p>Collez un tableau Excel ou Markdown : Jour, Arrivée, Déjeuner, Reprise, Départ. Dates au format JJ/MM/AA ou JJ/MM/AAAA.</p>
    <label>Objectif des nouvelles semaines <input id="archiveTarget" value="38:00" aria-label="Objectif des nouvelles semaines"></label>
    <textarea rows="8" aria-label="Anciens badgeages" placeholder="Jour    Arrivée    Déjeuner    Reprise    Départ"></textarea>
    <button type="button" id="archivePreview">Analyser le tableau</button>
    <p id="archiveInfo" role="status"></p><button type="button" id="archiveConfirm" class="primary" disabled>Enregistrer les badgeages</button></div>`;
  document.body.append(dialog);
  const input = dialog.querySelector('textarea'), target = dialog.querySelector('input');
  const info = dialog.querySelector('#archiveInfo'), confirm = dialog.querySelector('#archiveConfirm');
  let prepared = null;
  const invalidate = () => { prepared = null; confirm.disabled = true; info.textContent = ''; };
  input.oninput = target.oninput = invalidate;
  document.getElementById('historyImport').onclick = () => {
    target.value = clock(getProfile().target); invalidate(); dialog.showModal();
  };
  dialog.querySelector('#archivePreview').onclick = () => {
    invalidate();
    try {
      // L’objectif peut dépasser 24 h, contrairement à une heure de badgeage.
      const match = /^(\d{1,3}):([0-5]\d)$/.exec(target.value.trim());
      const goal = match ? Number(match[1]) * 60 + Number(match[2]) : 0;
      if (goal < 1 || goal > 10080) throw Error('Objectif invalide, utilisez heures:minutes.');
      const records = parseArchive(input.value);
      prepared = mergeArchive(records, getWeeks(), goal);
      const replaced = records.filter(r => getWeeks().some(w => w.days.some(d => d.date === r.date && d.times.some(Boolean)))).length;
      info.textContent = `${records.length} journées · ${prepared.length} semaines · ${records.filter(r => r.times.some(t => t === null)).length} journées incomplètes. ${replaced} journées existantes seront remplacées. Les autres journées et les objectifs déjà enregistrés sont conservés.`;
      confirm.disabled = false;
    } catch (error) { info.textContent = error.message; }
  };
  confirm.onclick = async () => {
    if (!prepared) return;
    confirm.disabled = true;
    try {
      await saveWeeks(prepared); await accepted(); dialog.close();
      notify('Anciens badgeages enregistrés. La simulation ouverte est conservée.');
    } catch (error) { info.textContent = `Enregistrement impossible : ${error.message}`; confirm.disabled = false; }
  };
}
