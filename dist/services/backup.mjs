import { backup, decodeBackup } from '../domain/history.mjs';
import { restoreData } from '../storage.mjs';
const $ = id => document.getElementById(id);
export function setupBackup(getProfile, getWeeks, restored, notify) {
  $('export').onclick = () => {
    const data = backup(getProfile(), getWeeks());
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tempo-sauvegarde.json';
    link.click();
    URL.revokeObjectURL(url);
    notify('Sauvegarde complète exportée : réglages et badgeages réels enregistrés.');
  };
  $('importSettings').onclick = () => $('settingsFile').click();
  $('settingsFile').onchange = async event => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) throw Error('Sauvegarde trop volumineuse (maximum 10 Mo).');
      const data = decodeBackup(JSON.parse(await file.text()));
      await restoreData(data);
      await restored(data.profile);
      notify(`Sauvegarde restaurée : ${data.weeks.length} semaines. Les mêmes dates sont remplacées, les autres semaines conservées.`);
    } catch (error) { notify('Import refusé : ' + error.message); }
    event.target.value = '';
  };
}
