import test from 'node:test';
import assert from 'node:assert/strict';
import { RiverGame, COLS, CELL, neighbors } from '../docs/cabane/river/engine.mjs';
import { squirrelPosition } from '../docs/cabane/river/art.mjs';
import { levels } from '../docs/cabane/river/levels.mjs';
import { landscapePoint, attachInput } from '../docs/cabane/river/input.mjs';

const at = (x, y) => Math.floor(y / CELL) * COLS + Math.floor(x / CELL);
const point = i => [(i % COLS + .5) * CELL, (Math.floor(i / COLS) + .5) * CELL];
function solution(game, destination) {
  const parent = new Int32Array(game.open.length).fill(-1);
  const queue = [...game.terrain.seeds];
  for (const i of queue) parent[i] = i;
  const goal = at(destination.x, destination.y);
  for (let head = 0; head < queue.length && parent[goal] < 0; head++) {
    const i = queue[head];
    const adjacent = neighbors(i);
    if (game.tunnelLinks.has(i)) adjacent.push(game.tunnelLinks.get(i));
    for (const j of adjacent) if (game.terrain.land[j] && parent[j] < 0) {
      parent[j] = queue[head]; queue.push(j);
    }
  }
  assert.ok(parent[goal] >= 0, 'destination has a real route through soft ground');
  const route = [goal];
  while (parent[route.at(-1)] !== route.at(-1)) route.push(parent[route.at(-1)]);
  return route.reverse().map(point);
}
function dig(game, route, radius) {
  route.forEach((p, i) => game.scratch(route[Math.max(0, i - 1)], p, radius));
}

test('every landscape starts unsolved and is solvable with a finger-sized brush', () => {
  for (const level of levels) {
    const game = new RiverGame(level); game.update(20);
    assert.equal(game.solved, false, level.id);
    assert.ok(game.fills.every(fill => fill === 0), 'all destination ponds begin dry');
    for (const pond of level.ponds) dig(game, solution(game, pond));
    game.update(0);
    assert.equal(game.solved, false, 'water must travel, even after completing the excavation');
    for (let step = 0; step < 600; step++) game.update(.05);
    assert.equal(game.solved, true, level.id);
  }
});

test('scratching is local and an isolated excavation remains dry indefinitely', () => {
  const game = new RiverGame(levels[1]); game.update(10);
  const before = game.open.reduce((a, b) => a + b, 0);
  assert.ok(game.scratch([260, 380]) > 0);
  const after = game.open.reduce((a, b) => a + b, 0);
  assert.ok(after - before < 140, 'one tap does not erase a whole obstacle');
  game.update(100);
  assert.equal(game.wetAt(260, 380), false);
  assert.equal(game.fills[0], 0);
});

test('water follows the opening progressively and never enters unexcavated ground', () => {
  const game = new RiverGame(levels[1]); game.update(10);
  dig(game, solution(game, levels[1].ponds[0]), 12);
  game.update(0);
  assert.equal(game.wetAt(175, 490), false, 'downstream is not instantly blue');
  game.update(.5);
  assert.ok(game.arrival.some(t => t <= game.time && t > 10));
  assert.equal(game.fills[0], 0);
  game.update(10);
  assert.ok(game.fills[0] > .97);
  for (let i = 0; i < game.open.length; i++) if (!game.open[i]) assert.equal(game.arrival[i], Infinity);
});

test('fixed rocks and banks cannot be scratched away', () => {
  const game = new RiverGame(levels[2]);
  game.scratch([210, 100], [210, 490], 80);
  game.update(10);
  assert.equal(game.open[at(210, 283)], 0);
  assert.equal(game.wetAt(210, 283), false);
  assert.equal(game.scratch([5, 5]), 0);
});

test('opening one branch does not water the other branch', () => {
  const game = new RiverGame(levels[3]);
  dig(game, solution(game, levels[3].ponds[0])); game.update(10);
  assert.ok(game.fills[0] > .97);
  assert.equal(game.fills[1], 0);
  assert.equal(game.solved, false);
});

test('widening the same passage wets a larger area without removing distant earth', () => {
  const other = new RiverGame(levels[3]);
  const branch = solution(other, levels[3].ponds[0]);
  dig(other, branch, 8); other.update(10);
  const before = other.arrival.filter(t => t <= other.time).length;
  dig(other, branch, 27); other.update(10);
  assert.ok(other.arrival.filter(t => t <= other.time).length > before + 100);
});

test('restarting reconstructs the original earth and water state', () => {
  const first = new RiverGame(levels[0]); first.scratch([199, 210], [224, 312]); first.update(10);
  assert.equal(first.solved, true);
  const restarted = new RiverGame(levels[0]);
  assert.equal(restarted.scratched, false);
  assert.equal(restarted.solved, false);
  assert.deepEqual(restarted.open, restarted.terrain.initial);
});

test('pointer coordinates scale to a narrow mobile canvas and reject outside positions', () => {
  const rect = { left: 12, top: 180, right: 306, bottom: 600, width: 294, height: 420 };
  assert.deepEqual(landscapePoint({ clientX: 159, clientY: 390 }, rect), [210, 300]);
  assert.equal(landscapePoint({ clientX: 5, clientY: 390 }, rect), null);
});

class Surface extends EventTarget {
  captured = null;
  getBoundingClientRect() { return { left: 0, top: 0, right: 420, bottom: 600, width: 420, height: 600 }; }
  focus() {}
  setPointerCapture(id) { this.captured = id; }
  hasPointerCapture(id) { return this.captured === id; }
  releasePointerCapture() { this.captured = null; }
}
function gestureSetup() {
  globalThis.window = new EventTarget();
  const canvas = new Surface(), scratches = [];
  const input = attachInput(canvas, { scratch: (a, b) => scratches.push([a, b]), cursor() {} });
  const send = (name, x, y, extra = {}) => {
    const event = new Event(name, { cancelable: true });
    Object.assign(event, { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, ...extra });
    canvas.dispatchEvent(event);
  };
  return { canvas, scratches, input, send };
}

test('fast drags include their release point; a second finger does not interrupt the stroke', () => {
  const { scratches, send, input, canvas } = gestureSetup();
  send('pointerdown', 100, 100); send('pointerdown', 300, 400, { pointerId: 2, isPrimary: false });
  send('pointerup', 100, 300);
  assert.deepEqual(scratches, [[[100, 100], [100, 100]], [[100, 100], [100, 300]]]);
  assert.equal(canvas.captured, null); input.destroy();
});

test('leaving the canvas or cancelling a touch never digs a connecting chord on return', () => {
  const { scratches, send, input } = gestureSetup();
  send('pointerdown', 100, 100); send('pointermove', -5, 200); send('pointermove', 200, 300);
  assert.deepEqual(scratches.at(-1), [[200, 300], [200, 300]]);
  send('pointercancel', 200, 300); send('pointermove', 200, 450);
  assert.equal(scratches.length, 2); input.destroy();
});

test('a locked sluice blocks scratching and water until its matching pond blooms', () => {
  const level = levels.find(level => level.id === 'premiere-ecluse');
  const game = new RiverGame(level);
  dig(game, solution(game, level.ponds[1]));
  game.update(30);
  assert.equal(game.gates[0].unlocked, false);
  assert.equal(game.fills[1], 0);
  assert.equal(game.scratch([210, 350], [210, 350], 8), 0);
  assert.equal(game.wetAt(210, 350), false);
  dig(game, solution(game, level.ponds[0]));
  game.update(10);
  assert.equal(game.gates[0].unlocked, true);
  assert.equal(game.wetAt(210, 350), false, 'opening does not teleport water');
  game.update(10);
  assert.equal(game.solved, true);
  const restarted = new RiverGame(level);
  assert.equal(restarted.gates[0].unlocked, false);
  assert.ok(restarted.gates[0].cells.every(i => restarted.open[i] === 0));
});

test('cascaded sluices unlock in sequence even when every downstream route is pre-dug', () => {
  const level = levels.find(level => level.id === 'ecluses-en-cascade');
  const game = new RiverGame(level);
  for (const pond of level.ponds) dig(game, solution(game, pond));
  game.update(20);
  assert.deepEqual(game.gates.map(g => g.unlocked), [true, false]);
  assert.equal(game.fills[2], 0);
  game.update(20);
  assert.deepEqual(game.gates.map(g => g.unlocked), [true, true]);
  assert.equal(game.solved, false);
  game.update(20);
  assert.equal(game.solved, true);
});

test('sluices span the whole channel and cannot be bypassed by digging along a bank', () => {
  for (const level of levels.filter(level => level.gates?.length)) {
    const game = new RiverGame(level);
    for (let stage = 0; stage < game.gates.length; stage++) {
      const reached = new Set(game.terrain.seeds), queue = [...reached];
      for (let head = 0; head < queue.length; head++) {
        const i = queue[head];
        const adjacent = neighbors(i);
        if (game.tunnelLinks.has(i)) adjacent.push(game.tunnelLinks.get(i));
        for (const j of adjacent) {
          if (!game.terrain.land[j] || reached.has(j) || game.gateAt[j] >= stage) continue;
          reached.add(j); queue.push(j);
        }
      }
      assert.ok(reached.has(at(level.ponds[stage].x, level.ponds[stage].y)), `${level.id}: key pond ${stage + 1} is reachable`);
      const next = level.ponds[stage + 1];
      assert.equal(reached.has(at(next.x, next.y)), false, `${level.id}: no bypass around sluice ${stage + 1}`);
    }
  }
});


const tunnelLevel = {
  source: [70, 60],
  paths: [{ points: [[70, 60], [70, 180]], width: 60 }, { points: [[300, 320], [300, 490]], width: 60 }],
  ponds: [{ x: 300, y: 490, r: 25 }], rocks: [], exposed: [],
  tunnels: [{ from: [70, 180], to: [300, 320], label: 'A' }],
};

test('tunnels need both mouths uncovered and carry water with a travel delay', () => {
  const game = new RiverGame(tunnelLevel);
  game.scratch([70, 60], [70, 180]);
  game.update(10);
  assert.equal(game.wetAt(70, 180), true);
  assert.equal(game.wetAt(300, 320), false);
  assert.equal(game.fills[0], 0);
  game.scratch([300, 320], [300, 490]);
  game.update(0);
  assert.equal(game.wetAt(300, 320), false);
  game.update(.34);
  assert.equal(game.wetAt(300, 320), false);
  game.update(.02);
  assert.equal(game.wetAt(300, 320), true);
  assert.equal(game.fills[0], 0);
  game.update(10);
  assert.equal(game.solved, true);
  assert.equal(game.wetAt(180, 250), false, 'the underground link does not flood the bank');
  const restarted = new RiverGame(tunnelLevel);
  assert.equal(restarted.wetAt(300, 320), false);
  assert.equal(restarted.open[at(70, 180)], 0);
  assert.equal(restarted.open[at(300, 320)], 0);
});

test('an uncovered tunnel exit remains dry until the entrance is connected to the source', () => {
  const game = new RiverGame(tunnelLevel);
  game.scratch([70, 180]);
  game.scratch([300, 320], [300, 490]);
  game.update(100);
  assert.equal(game.wetAt(300, 320), false);
  game.scratch([70, 60], [70, 180]);
  game.update(10);
  assert.equal(game.solved, true);
});

test('tunnel pairs conduct in either direction without recursion through cycles', () => {
  const reversed = { ...tunnelLevel, tunnels: [{ from: [300, 320], to: [70, 180], label: 'A' }] };
  const game = new RiverGame(reversed);
  game.scratch([70, 60], [70, 180]);
  game.scratch([300, 320], [300, 490]);
  game.update(10);
  assert.equal(game.solved, true);
  assert.ok(game.arrival.every(value => value >= 0));
});


test('the squirrel stays entirely on firm ground in every landscape', () => {
  for (const level of levels) {
    const game = new RiverGame(level);
    const spot = squirrelPosition(game);
    assert.ok(spot, `${level.id}: room for the squirrel`);
    const [x, y] = spot;
    for (let py = y - 45; py <= y + 25; py += CELL) {
      for (let px = x - 40; px <= x + 30; px += CELL) {
        assert.equal(game.terrain.land[at(px, py)], 0, `${level.id}: squirrel overlaps diggable ground`);
      }
    }
    if (level.id === 'jardin-des-galets') assert.notDeepEqual(spot, [62, 259]);
  }
});
