function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tempo-settings', 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('settings')) request.result.createObjectStore('settings');
      if (!request.result.objectStoreNames.contains('weeks')) request.result.createObjectStore('weeks', { keyPath: 'start' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('Fermez les autres onglets Tempo pour mettre à jour le stockage.'));
  });
}
async function transact(names, mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(names, mode);
    let result;
    action(transaction, value => { result = value; });
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error || Error('Échec du stockage local.')); };
  });
}
export function settingsStore(value) {
  return transact(['settings'], value ? 'readwrite' : 'readonly', (tx, done) => {
    const store = tx.objectStore('settings');
    const request = value ? store.put(value, 'profile') : store.get('profile');
    request.onsuccess = () => done(request.result);
  });
}
export function readWeeks() {
  return transact(['weeks'], 'readonly', (tx, done) => {
    tx.objectStore('weeks').getAll().onsuccess = event => done(event.target.result);
  });
}
export function saveWeek(week) {
  return transact(['weeks'], 'readwrite', tx => tx.objectStore('weeks').put(week));
}
// L’import remplace les semaines portant les mêmes dates et conserve les autres.
export function restoreData(data) {
  return transact(['settings', 'weeks'], 'readwrite', tx => {
    tx.objectStore('settings').put(data.profile, 'profile');
    data.weeks.forEach(week => tx.objectStore('weeks').put(week));
  });
}
// Validation réalisée avant cet appel ; toutes les semaines sont écrites ensemble.
export function saveWeeks(weeks) {
  return transact(['weeks'], 'readwrite', tx => {
    weeks.forEach(week => tx.objectStore('weeks').put(week));
  });
}
