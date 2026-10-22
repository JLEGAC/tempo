import assert from 'node:assert/strict';
import { defaults, migrate, validateSettings, issues } from '../dist/domain/settings.mjs';
import { fresh, total, minutes, worked } from '../dist/domain/time.mjs';
import { balance } from '../dist/domain/balance.mjs';
import { departureAvailability } from '../dist/domain/departure.mjs';
import { parseText } from '../dist/parser.mjs';

const start = '2099-01-05', now = new Date('2099-01-01T08:00:00');
let p = defaults(), rows = fresh(p);
assert.equal(total(rows), 2310);
let result = balance(rows, p, start, now);
assert.equal(total(result), 2280);
assert.equal(result[4].times[3], '16:00');
assert(result.every(r => minutes(r.times[3]) >= 960 && minutes(r.times[3]) <= 1080));
assert.deepEqual(rows, fresh(p));

p.target = 1800;
result = balance(rows, p, start, now);
assert.equal(total(result), 1800);
assert(result.some(r => r.times[1] !== '13:00' || r.times[2] !== '13:30'));
assert(result.every(r => minutes(r.times[2]) - minutes(r.times[1]) >= 30));

p = defaults();
p.mode = 'arrival'; p.priorities = ['arrival', 'departure', 'lunch'];
rows = fresh(p);
rows.forEach(r => { r.times[0] = '08:00'; });
p.target = total(rows) - 50;
result = balance(rows, p, start, now);
assert.equal(total(result), p.target);
assert(result.every(r => r.times[0] === '08:10'));
assert.equal(result[0].times[3], '17:30');

p = defaults();
p.mode = 'lunch'; p.priorities = ['lunch', 'departure', 'arrival'];
rows = fresh(p);
p.target = total(rows) - 50;
result = balance(rows, p, start, now);
assert.equal(result[0].times[2], '13:40');
assert.equal(result[0].times[3], '17:30');

p = defaults();
rows = fresh(p);
rows[0].locks = [true, true, true, true];
rows[1].real = [true, true, true, true];
result = balance(rows, p, start, now);
assert.deepEqual(result[0], rows[0]);
assert.deepEqual(result[1], rows[1]);
rows.forEach(r => { r.locks = [true, true, true, true]; });
assert.throws(() => balance(rows, p, start, now), /inaccessible/);
p.target = 10000;
assert.throws(() => balance(fresh(p), p, start, now), /inaccessible/);

p = defaults();
p.rules.minBreak = 0;
p.comfort.maxBreak = 120;
assert(validateSettings(p));
assert.equal(migrate({ ...defaults(), version: 1 }).rules.departureMax, 1080);
assert(!validateSettings({ ...defaults(), kelioUrl: 'javascript:alert(1)' }));
assert(issues({ times: ['09:00', '13:00', '13:30', '18:01'], real: [] }, defaults()).length);
assert.equal(worked({ times: ['09:00', '13:00', '13:30', '16:00'] }), 390);

rows = fresh(defaults());
assert.throws(() => balance(rows, defaults(), '2026-10-19', new Date('2026-10-22T09:00:00')), /passés incomplets/);
rows = fresh(defaults());
const thursday = new Date('2099-01-08T15:00:00');
rows.slice(0, 3).forEach(r => { r.real = [true, true, true, true]; });
rows[3].real[0] = true;
result = balance(rows, defaults(), start, thursday);
assert.equal(result[3].times[1], '13:00');
assert.equal(result[3].times[2], '13:30');

assert.deepEqual(parseText('19/10/2026\n08:00\n12:00\n13:00\n17:00\n20/10/2026\n09:00').map(r => r.times), [
  ['08:00', '12:00', '13:00', '17:00'], ['09:00'],
]);
console.log('Tests OK : modes, plages, pause, réel, cadenas, limites, migration, import et horaires passés.');

rows = fresh(defaults());
assert(departureAvailability(rows, '2026-10-19', new Date('2026-10-22T10:00:00')).reason);
assert.equal(departureAvailability(rows, '2026-10-19', new Date('2026-10-22T13:30:00')).reason, '');
rows[3].real[3] = true;
assert(departureAvailability(rows, '2026-10-19', new Date('2026-10-22T14:00:00')).reason);
assert(departureAvailability(rows, '2026-10-19', new Date('2026-10-24T14:00:00')).reason);
console.log('Disponibilité du bouton : avant reprise, à la reprise, départ réel et autre semaine : OK.');
