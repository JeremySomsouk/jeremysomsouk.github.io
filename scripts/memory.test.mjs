import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { instance } = await WebAssembly.instantiate(await readFile(new URL('../docs/cabane/memory/game.wasm', import.meta.url)));
const engine = instance.exports;

test('published Memory Wasm supports and completes every grid from 3 to 8 pairs', () => {
  for (let pairs = 3; pairs <= 8; pairs++) for (let seed = 1; seed <= 10; seed++) {
    const symbols = [];
    for (let i = 0; i < pairs * 2; i++) {
      engine.start(pairs, seed);
      assert.equal(engine.flip(i), 1);
      symbols.push(engine.card(i));
    }
    assert.equal(new Set(symbols).size, pairs);
    for (const symbol of symbols) {
      assert.ok(symbol >= 1 && symbol <= 8);
      assert.equal(symbols.filter(value => value === symbol).length, 2);
    }
    engine.start(pairs, seed);
    let matched = 0;
    for (let i = 0; i < symbols.length; i++) {
      if (engine.is_matched(i)) continue;
      const j = symbols.findIndex((symbol, index) => index !== i && symbol === symbols[i]);
      assert.equal(engine.flip(i), 1);
      assert.equal(engine.flip(i), 0);
      assert.equal(engine.flip(j), ++matched === pairs ? 4 : 3);
    }
    engine.start(3, seed);
    assert.equal(engine.card(0), 0);
    assert.equal(engine.is_matched(0), 0);
    assert.equal(engine.flip(6), 0);
  }
});
