import test from 'node:test';
import assert from 'node:assert/strict';
import { attachInput, cellFromPoint } from '../docs/cabane/lumiere/input.mjs';
import { createGame } from '../docs/cabane/lumiere/state.mjs';
import { levels } from '../docs/cabane/lumiere/levels.mjs';

const rect = { left: 10, top: 20, right: 310, bottom: 320, width: 300, height: 300 };
test('pointer coordinates map to cells at mobile sizes and exclude outside edges', () => {
  assert.deepEqual(cellFromPoint(11, 21, rect, levels[0]), { x: 0, y: 0 });
  assert.deepEqual(cellFromPoint(309, 319, rect, levels[0]), { x: 3, y: 3 });
  assert.deepEqual(cellFromPoint(160, 170, rect, levels[4]), { x: 2, y: 2 });
  for (const [x, y] of [[9, 30], [310, 30], [20, 19], [20, 320]]) assert.equal(cellFromPoint(x, y, rect, levels[0]), null);
});

function harness(t) {
  const handlers = {};
  const captures = new Set();
  const globalHandlers = {};
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = { addEventListener() {} };
  globalThis.document = { addEventListener() {} };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
  });
  t.mock.method(globalThis.window, 'addEventListener', (type, fn) => { globalHandlers[type] = fn; });
  t.mock.method(globalThis.document, 'addEventListener', (type, fn) => { globalHandlers[type] = fn; });
  const classes = { toggle() {}, remove() {} };
  const board = { getBoundingClientRect: () => rect, querySelectorAll: () => [] };
  const supply = { focus() {} };
  const inventory = { getBoundingClientRect: () => ({ left: 10, right: 310, top: 340, bottom: 420 }), classList: classes };
  const preview = { hidden: true, style: {} };
  const game = createGame(levels[2]);
  const calls = [];
  const area = { addEventListener: (name, fn) => { handlers[name] = fn; },
    hasPointerCapture: id => captures.has(id), setPointerCapture: id => captures.add(id), releasePointerCapture: id => captures.delete(id) };
  const input = attachInput({ area, board, supply, inventory, preview, getGame: () => game,
    tap: target => calls.push(['tap', target]), drop: (...args) => calls.push(['drop', ...args]), describePiece: () => '<svg/>' });
  const event = (extra = {}) => ({ pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 50, clientY: 370,
    preventDefault() {}, target: { closest: () => supply }, ...extra });
  return { handlers, captures, globalHandlers, preview, calls, event, input, supply };
}

// Small DOM boundary doubles exercise the actual pointer handlers, including touch cancellation.
test('touch, mouse, and stylus gestures commit once, ignore secondary pointers, and distinguish taps', t => {
  const h = harness(t);
  for (const pointerType of ['touch', 'mouse', 'pen']) {
    h.handlers.pointerdown(h.event({ pointerType }));
    h.handlers.pointerdown(h.event({ pointerId: 2, isPrimary: false }));
    h.handlers.pointerup(h.event({ pointerId: 2, clientX: 130, clientY: 130 }));
    assert.equal(h.captures.size, 1);
    h.handlers.pointermove(h.event({ clientX: 130, clientY: 130 }));
    assert.equal(h.preview.hidden, false);
    h.handlers.pointerup(h.event({ clientX: 130, clientY: 130 }));
    assert.deepEqual(h.calls.at(-1), ['drop', 'supply', { x: 1, y: 1 }, false]);
    assert.equal(h.captures.size, 0);
    assert.equal(h.preview.hidden, true);
    const count = h.calls.length;
    h.handlers.click(h.event({ detail: 1 }));
    assert.equal(h.calls.length, count);
  }
  h.handlers.pointerdown(h.event());
  h.handlers.pointerup(h.event({ clientX: 54 }));
  assert.deepEqual(h.calls.at(-1), ['tap', h.supply]);
  h.handlers.click(h.event({ detail: 0 }));
  assert.deepEqual(h.calls.at(-1), ['tap', h.supply]);
});

test('cancel, capture loss, reset cancellation, blur, resize and Escape never drop a piece', t => {
  const h = harness(t);
  for (const cancel of [() => h.handlers.pointercancel(h.event()), () => h.handlers.lostpointercapture(h.event()),
    () => h.input.cancel(), () => h.globalHandlers.blur(), () => h.globalHandlers.resize(), () => h.globalHandlers.keydown({ key: 'Escape' })]) {
    h.handlers.pointerdown(h.event());
    h.handlers.pointermove(h.event({ clientX: 130, clientY: 130 }));
    cancel();
    h.handlers.pointerup(h.event({ clientX: 130, clientY: 130 }));
    assert.equal(h.calls.length, 0);
    assert.equal(h.captures.size, 0);
    assert.equal(h.preview.hidden, true);
  }
});

test('release without a move sample remains a drag; returning an existing mirror targets inventory', t => {
  const h = harness(t);
  h.handlers.pointerdown(h.event());
  h.handlers.pointerup(h.event({ clientX: 130, clientY: 130 }));
  assert.equal(h.calls[0][0], 'drop');
  const mirror = { dataset: { piece: 'mirror-0' }, focus() {} };
  h.handlers.pointerdown(h.event({ clientX: 130, clientY: 130, target: { closest: () => mirror } }));
  h.handlers.pointerup(h.event());
  assert.deepEqual(h.calls.at(-1), ['drop', 'mirror-0', null, true]);
});
