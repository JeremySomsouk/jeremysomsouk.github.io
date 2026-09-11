import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const menuPath = new URL('../docs/cabane/index.html', import.meta.url);

test('all Cabane activity cards use published preview images', () => {
  const menu = readFileSync(menuPath, 'utf8');
  const previews = ['fluence', 'memory', 'chemin', 'calculs', 'lumiere', 'riviere'];

  for (const name of previews) {
    const src = `./images/${name}-preview.webp`;
    assert.match(menu, new RegExp(`src="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${src} is missing from the menu`);
  }
});
