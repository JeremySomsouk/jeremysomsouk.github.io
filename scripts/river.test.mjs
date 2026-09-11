import test from 'node:test';
import assert from 'node:assert/strict';
import { createRiverGame } from '../docs/cabane/river/state.mjs';
import { createBoard } from '../docs/cabane/river/board.mjs';
import { createRiverApp } from '../docs/cabane/river/app.mjs';
import { loadEngine } from '../docs/cabane/river/engine.mjs';
import { startRiverPage } from '../docs/cabane/river/game.mjs';
import { readFileSync } from 'node:fs';

function createEngine({ tapResult = true, undoResult = true } = {}) {
  let tapCalls = [];
  let undoCalls = 0;
  let moves = 0;
  let solved = false;
  return {
    level_count: () => 20,
    start: level => {
      if (level >= 20) return 0;
      moves = 0;
      solved = false;
      return 1;
    },
    rows: () => 2,
    cols: () => 3,
    tile: (row, col) => (row === 0 && col === 0 ? 1 : row === 1 && col === 2 ? 5 : 3),
    is_wet: (row, col) => row === 0 && col === 0 ? 1 : 0,
    is_watered: (row, col) => solved && row === 1 && col === 2 ? 1 : 0,
    tap: (row, col) => {
      tapCalls.push([row, col]);
      if (!tapResult) return 0;
      moves += 1;
      solved = true;
      return 1;
    },
    undo: () => {
      undoCalls += 1;
      if (!undoResult) return 0;
      if (moves > 0) moves -= 1;
      solved = false;
      return 1;
    },
    is_solved: () => solved ? 1 : 0,
    move_count: () => moves,
    getTapCalls: () => tapCalls,
    getUndoCalls: () => undoCalls,
  };
}

test('river state loads a level, renders progress, and tracks a successful turn', () => {
  const engine = createEngine({ tapResult: true });
  const game = createRiverGame(engine);

  assert.equal(game.levelIndex, 0);
  assert.equal(game.rows, 2);
  assert.equal(game.cols, 3);
  assert.equal(game.progress, '0 / 1 plantes arrosées');
  assert.equal(game.moveCount, 0);
  assert.equal(game.isSolved, false);

  assert.equal(game.tap(0, 2), true);
  assert.deepEqual(engine.getTapCalls(), [[0, 2]]);
  assert.equal(game.moveCount, 1);
  assert.equal(game.isSolved, true);
  assert.equal(game.progress, '1 / 1 plantes arrosées');

  assert.equal(game.undo(), true);
  assert.equal(engine.getUndoCalls(), 1);
  assert.equal(game.moveCount, 0);
  assert.equal(game.isSolved, false);
  assert.equal(game.progress, '0 / 1 plantes arrosées');
});

test('river state ignores rejected turns and refuses undo or invalid levels', () => {
  const engine = createEngine({ tapResult: false, undoResult: false });
  const game = createRiverGame(engine);

  assert.equal(game.tap(9, 9), false);
  assert.equal(game.moveCount, 0);
  assert.equal(game.undo(), false);
  assert.equal(game.start(20), false);
  assert.equal(game.levelIndex, 0);
});

test('river state cycles through levels and celebrates completion once', () => {
  const engine = createEngine();
  const celebrations = [];
  const game = createRiverGame(engine, { celebrate: origin => celebrations.push(origin) });

  assert.equal(game.tap(0, 2), true);
  assert.equal(game.celebrate(), 'result');
  assert.equal(game.celebrate(), false);
  assert.deepEqual(celebrations, ['result']);

  assert.equal(game.next(), true);
  assert.equal(game.levelIndex, 1);
  assert.equal(game.celebrated, false);
  assert.equal(game.celebrate(), false);
  assert.deepEqual(celebrations, ['result']);
});


class TestElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = { properties: new Map(), setProperty(name, value) { this.properties.set(name, String(value)); } };
  }
  append(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  setAttribute(name, value) { this[`attr_${name}`] = String(value); }
  getAttribute(name) { return this[`attr_${name}`] ?? null; }
  addEventListener(type, listener) { this.listeners ??= new Map(); this.listeners.set(type, listener); }
  click() { this.listeners.get('click')(); }
  focus() { this.focusCount = (this.focusCount ?? 0) + 1; }
}

test('the river board creates accessible cells and forwards channel taps', () => {
  const engine = createEngine();
  const game = createRiverGame(engine);
  const board = new TestElement('div');
  const taps = [];
  const render = createBoard(board, game, (row, col) => taps.push([row, col]), { createElement: tag => new TestElement(tag) });

  assert.equal(board.children.length, 6);
  const spring = board.children[0];
  const channel = board.children[1];
  const plant = board.children[5];
  assert.equal(spring.dataset.row, '0');
  assert.equal(spring.dataset.col, '0');
  assert.equal(spring.type, 'button');
  render();
  assert.equal(spring.getAttribute('aria-label'), 'Source, eau');
  assert.equal(spring.className, 'cell spring wet');
  assert.equal(channel.className, 'cell channel horizontal');
  assert.equal(channel.disabled, false);
  assert.equal(plant.className, 'cell plant');
  assert.equal(plant.getAttribute('aria-label'), 'Plante assoiffée');
  assert.equal(plant.disabled, true);

  channel.click();
  assert.deepEqual(taps, [[0, 1]]);
});


function createDocument() {
  const ids = ['board', 'status', 'progress', 'moves', 'undo', 'restart', 'next', 'completion', 'result-text', 'engine-status', 'retry'];
  const elements = Object.fromEntries(ids.map(id => {
    const element = new TestElement(id);
    element.id = id;
    return [id, element];
  }));
  return {
    _elements: elements,
    getElementById: id => elements[id],
    createElement: tag => new TestElement(tag),
  };
}

test('the river controller renders turns, completion, undo, and level changes', () => {
  const engine = createEngine();
  const document = createDocument();
  const celebrations = [];
  const app = createRiverApp({ engine, document, celebrate: origin => celebrations.push(origin) });

  assert.equal(document._elements.progress.textContent, '0 / 1 plantes arrosées');
  assert.equal(document._elements.moves.textContent, '0 tour');
  assert.equal(document._elements.completion.hidden, true);
  assert.equal(document._elements.undo.disabled, true);
  assert.equal(document._elements.next.disabled, true);

  app.tap(0, 2);
  assert.equal(document._elements.progress.textContent, '1 / 1 plantes arrosées');
  assert.equal(document._elements.moves.textContent, '1 tour');
  assert.equal(document._elements.completion.hidden, false);
  assert.equal(document._elements.undo.disabled, false);
  assert.equal(document._elements.next.disabled, false);
  assert.equal(document._elements.next.focusCount, 1);
  assert.equal(celebrations.length, 1);

  app.undo();
  assert.equal(document._elements.completion.hidden, true);
  assert.equal(document._elements.moves.textContent, '0 tour');
  assert.equal(document._elements.undo.disabled, true);

  app.tap(0, 2);
  app.next();
  assert.equal(app.game.levelIndex, 1);
  assert.equal(document._elements.progress.textContent, '0 / 1 plantes arrosées');
  assert.equal(document._elements.next.disabled, true);
  assert.deepEqual(celebrations.length, 1);

  app.restart();
  assert.equal(app.game.levelIndex, 1);
  assert.equal(document._elements.moves.textContent, '0 tour');
});


test('the river Wasm loader returns exports and rejects failed responses', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const exports = { start: () => 1 };
  const instantiateCalls = [];
  const engine = await loadEngine({
    url: './game.wasm',
    fetch: async url => {
      assert.equal(url, './game.wasm');
      return { ok: true, arrayBuffer: async () => bytes };
    },
    instantiate: async receivedBytes => {
      instantiateCalls.push(receivedBytes);
      return { instance: { exports } };
    },
  });

  assert.equal(engine, exports);
  assert.equal(instantiateCalls.length, 1);
  assert.equal(instantiateCalls[0], bytes);

  await assert.rejects(
    loadEngine({ url: './game.wasm', fetch: async () => ({ ok: false, status: 500 }), instantiate: async () => ({}) }),
    /HTTP 500/,
  );
});


test('the river page starts after loading Wasm and reports load failures', async () => {
  const successDocument = createDocument();
  const engine = createEngine();
  const apps = [];
  await startRiverPage({
    document: successDocument,
    loadEngine: async () => engine,
    createApp: options => {
      assert.equal(options.engine, engine);
      apps.push(options);
      return { render() {} };
    },
    celebrate: () => {},
  });
  assert.equal(apps.length, 1);
  assert.equal(successDocument._elements['engine-status'].hidden, true);
  assert.equal(successDocument._elements.retry.hidden, true);
  assert.equal(successDocument._elements.board.getAttribute('aria-busy'), 'false');

  const failureDocument = createDocument();
  const errors = [];
  const error = new Error('HTTP 500');
  await startRiverPage({
    document: failureDocument,
    loadEngine: async () => { throw error; },
    createApp: () => { throw new Error('app should not start'); },
    celebrate: () => {},
    console: { error: value => errors.push(value) },
  });
  assert.equal(failureDocument._elements['engine-status'].hidden, false);
  assert.equal(failureDocument._elements['engine-status'].textContent, 'Le jeu n’a pas pu se charger. Recharge la page pour réessayer.');
  assert.equal(failureDocument._elements.retry.hidden, false);
  assert.deepEqual(errors, [`Failed to load La Rivière: ${error.message}`]);
  assert.equal(failureDocument._elements.board.getAttribute('aria-busy'), 'false');
});


test('the published river page contains the tested controls and styles', () => {
  const page = readFileSync(new URL('../docs/cabane/river/index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../docs/cabane/river/style.css', import.meta.url), 'utf8');
  for (const id of ['board', 'status', 'progress', 'moves', 'undo', 'restart', 'next', 'completion', 'result-text', 'engine-status', 'retry']) {
    assert.match(page, new RegExp(`id="${id}"`), `${id} is missing from the page`);
  }
  assert.match(page, /<script type="module" src="\.\/game\.mjs"><\/script>/);
  assert.match(page, /href="\.\/style\.css"/);
  assert.match(css, /\.river-board\s*\{/);
  assert.match(css, /\.cell\.channel::after\s*\{/);
  assert.match(css, /\.cell\.plant\.watered\s*\{/);
});
