import fs from 'node:fs';
import path from 'node:path';
function check(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) check(file);
    else if (/\.(mjs|js|css|html|md|json|webmanifest)$/.test(file)) {
      const count = fs.readFileSync(file, 'utf8').trimEnd().split('\n').length;
      if (count >= 400) throw Error(`${file} : ${count} lignes (maximum 399)`);
      console.log(`${file} : ${count} lignes`);
    }
  }
}
check('dist');
check('scripts');
check('tests');
