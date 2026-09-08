import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../docs/cabane/share.mjs', import.meta.url), 'utf8')).replace('export function', 'function');
function fixture(navigator) {
  const button = { addEventListener(_, handler) { this.click = handler; } };
  const status = { replaceChildren(child) { this.child = child; }, append(input) { this.input = input; } };
  const document = {
    title: 'Cabane',
    querySelector: selector => selector === '#share' ? button : selector === '#share-status' ? status : null,
    createTextNode: text => text,
    createElement: () => ({ setAttribute() {}, focus() {}, select() {}, addEventListener(_, handler) { this.click = handler; } }),
  };
  const location = { href: 'https://www.somsouk.fr/cabane/lecture/?text=bateau-v1' };
  vm.runInNewContext(source, { document, navigator, location });
  return { button, status, location };
}

test('native sharing uses the URL at click time and cancellation keeps sharing available', async () => {
  let payload;
  const f = fixture({ share: async data => { payload = data; } });
  f.location.href = 'https://www.somsouk.fr/cabane/lecture/?text=jardin-v1';
  await f.button.click();
  assert.equal(payload.url, f.location.href);
  assert.equal(f.button.disabled, false);
  const cancelled = fixture({ share: async () => { throw { name: 'AbortError' }; } });
  await cancelled.button.click();
  assert.equal(cancelled.button.textContent, 'Partager');
  assert.equal(cancelled.status.hidden, false);
});

test('unavailable native sharing copies the selected link', async () => {
  let copied;
  const f = fixture({ clipboard: { writeText: async url => { copied = url; } } });
  assert.equal(f.button.textContent, 'Copier le lien');
  await f.button.click();
  assert.equal(copied, f.location.href);
  assert.equal(f.status.textContent, 'Lien copié !');
});

test('native failure immediately exposes a manual link when clipboard is denied', async () => {
  const f = fixture({ share: async () => { throw { name: 'NotAllowedError' }; } });
  await f.button.click();
  assert.equal(f.status.input.value, f.location.href);
  assert.equal(f.status.hidden, false);
  assert.equal(f.button.disabled, false);
});


test('canShare rejection copies without calling native sharing', async () => {
  let copied;
  const f = fixture({ canShare: () => false, share: async () => { assert.fail('Native sharing must not run'); }, clipboard: { writeText: async url => { copied = url; } } });
  await f.button.click();
  assert.equal(copied, f.location.href);
});


test('copy remains usable when the native share promise never settles', async () => {
  let copied;
  const f = fixture({ share: () => new Promise(() => {}), clipboard: { writeText: async url => { copied = url; } } });
  f.button.click();
  assert.equal(f.status.child.textContent, 'Copier le lien');
  f.location.href = 'https://www.somsouk.fr/cabane/lecture/?text=jardin-v1';
  await f.status.child.click();
  assert.equal(copied, f.location.href);
});
