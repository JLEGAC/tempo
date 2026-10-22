import { parsePaste } from '../parser.mjs';
const $ = id => document.getElementById(id);
export function setupImport(getProfile, accept, notify) {
  function help(text) {
    const box = $('importHelp');
    box.hidden = false;
    $('importHelpText').textContent = text;
    const link = $('kelioLink');
    link.href = getProfile().kelioUrl;
    if (!$('pasteDialog').open) $('pasteDialog').showModal();
  }
  async function parse(html, text) {
    const records = parsePaste(html, text);
    if (!records.length) {
      help('Aucun badgeage reconnu. Ouvrez votre portail de pointage, copiez le tableau de présence puis cliquez à nouveau sur « Coller mes badgeages ».');
      return false;
    }
    try { await accept(records); } catch (error) { help(error.message); return false; }
    $('importHelp').hidden = true;
    if ($('pasteDialog').open) $('pasteDialog').close();
    notify('Badgeages importés. Les heures réelles et simulées sont distinguées dans le tableau.');
    return true;
  }
  $('importBtn').onclick = async () => {
    try {
      let html = '', text = '';
      if (navigator.clipboard?.read) {
        for (const item of await navigator.clipboard.read()) {
          if (item.types.includes('text/html')) html = await (await item.getType('text/html')).text();
          if (item.types.includes('text/plain')) text = await (await item.getType('text/plain')).text();
        }
      } else text = await navigator.clipboard.readText();
      await parse(html, text);
    } catch {
      help('Le navigateur n’a pas permis la lecture automatique. Collez directement ci-dessous avec Ctrl + V.');
    }
  };
  $('retryImport').onclick = () => $('importBtn').onclick();
  $('paste').onpaste = event => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    $('paste').value = text;
    parse(event.clipboardData.getData('text/html'), text);
  };
  $('analyze').onclick = () => parse('', $('paste').value);
}
