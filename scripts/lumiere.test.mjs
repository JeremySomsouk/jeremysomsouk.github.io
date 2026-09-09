import test from 'node:test';
import assert from 'node:assert/strict';
import { propagate, reflect } from '../docs/cabane/lumiere/engine.mjs';
import { levels } from '../docs/cabane/lumiere/levels.mjs';
import { createGame } from '../docs/cabane/lumiere/state.mjs';

const room = overrides => ({ width: 4, height: 4, lights: [{ id: 'l', x: 0, y: 1, direction: 'E' }],
  ghosts: [{ id: 'g', x: 3, y: 1 }], walls: [], ...overrides });

test('horizontal light reaches ghosts, continues and ends at the room edge', () => {
  const result = propagate(room());
  assert.equal(result.isSolved, true);
  assert.deepEqual(result.illuminatedGhosts, ['g']);
  assert.deepEqual(result.lightPaths[0].points, [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3.5, y: 1 }]);
});
test('vertical propagation works in both directions; west works too', () => {
  for (const [direction, x, y, gx, gy] of [['S', 2, 0, 2, 3], ['N', 2, 3, 2, 0], ['W', 3, 1, 0, 1]]) {
    assert.equal(propagate(room({ lights: [{ x, y, direction }], ghosts: [{ id: 'g', x: gx, y: gy }] })).isSolved, true);
  }
});
test('walls stop light on their near face; unlit ghosts prevent victory', () => {
  const result = propagate(room({ walls: [{ x: 2, y: 1 }] }));
  assert.equal(result.isSolved, false);
  assert.deepEqual(result.illuminatedGhosts, []);
  assert.equal(result.lightPaths[0].stoppedBy, 'wall');
  assert.deepEqual(result.lightPaths[0].points.at(-1), { x: 1.5, y: 1 });
});
test('both mirror orientations reflect all four incident directions', () => {
  for (const [input, slash, backslash] of [['N', 'E', 'W'], ['E', 'N', 'S'], ['S', 'W', 'E'], ['W', 'S', 'N']]) {
    assert.equal(reflect(input, '/'), slash);
    assert.equal(reflect(input, '\\'), backslash);
  }
  for (const [orientation, y] of [['/', 0], ['\\', 3]]) {
    assert.equal(propagate(room({ ghosts: [{ id: 'g', x: 2, y }] }), [{ x: 2, y: 1, orientation }]).isSolved, true);
  }
});
test('multiple sources jointly illuminate all ghosts, without double counting', () => {
  const level = room({ lights: [{ x: 0, y: 1, direction: 'E' }, { x: 3, y: 0, direction: 'S' }],
    ghosts: [{ id: 'a', x: 2, y: 1 }, { id: 'b', x: 3, y: 1 }, { id: 'c', x: 3, y: 3 }] });
  assert.equal(propagate(level).isSolved, true);
  assert.equal(propagate(level).illuminatedGhosts.length, 3);
  assert.equal(propagate({ ...level, lights: level.lights.slice(0, 1) }).isSolved, false);
});
test('a repeated position and direction terminates a closed mirror loop', () => {
  const mirrors = [{ x: 1, y: 1, orientation: '\\' }, { x: 1, y: 2, orientation: '/' },
    { x: 0, y: 2, orientation: '\\' }, { x: 0, y: 1, orientation: '/' }];
  const result = propagate(room(), mirrors);
  assert.equal(result.lightPaths[0].stoppedBy, 'loop');
  assert.equal(result.lightPaths[0].points.length, 5);
  assert.equal(result.isSolved, false);
});
test('empty targets do not win; propagation is deterministic and does not mutate inputs', () => {
  const level = room({ ghosts: [] });
  const before = structuredClone(level);
  assert.equal(propagate(level).isSolved, false);
  assert.deepEqual(propagate(level), propagate(level));
  assert.deepEqual(level, before);
});

test('prisms keep the straight beam and add a reflected branch for both orientations', () => {
  for (const [orientation, y] of [['/', 0], ['\\', 3]]) {
    const level = room({ ghosts: [{ id: 'straight', x: 3, y: 1 }, { id: 'split', x: 1, y }] });
    const result = propagate(level, [{ x: 1, y: 1, orientation, type: 'prism' }]);
    assert.equal(result.lightPaths.length, 2);
    assert.equal(result.isSolved, true);
    assert.deepEqual(new Set(result.illuminatedGhosts), new Set(['straight', 'split']));
    assert.equal(propagate(level, [{ x: 1, y: 1, orientation, type: 'mirror' }]).isSolved, false);
  }
});
test('a blocked prism branch does not stop its sibling, and all targets must be lit', () => {
  const level = room({ walls: [{ x: 2, y: 1 }], ghosts: [{ id: 'a', x: 1, y: 0 }, { id: 'b', x: 3, y: 1 }] });
  const result = propagate(level, [{ x: 1, y: 1, orientation: '/', type: 'prism' }]);
  assert.deepEqual(result.illuminatedGhosts, ['a']);
  assert.equal(result.isSolved, false);
  assert.equal(result.lightPaths[0].stoppedBy, 'wall');
});
test('prisms in a feedback loop terminate without exponential branching', () => {
  const pieces = [{ x: 1, y: 1, orientation: '\\' }, { x: 1, y: 2, orientation: '/' },
    { x: 0, y: 2, orientation: '\\' }, { x: 0, y: 1, orientation: '/' }].map(piece => ({ ...piece, type: 'prism' }));
  const result = propagate(room(), pieces);
  assert.ok(result.lightPaths.some(path => path.stoppedBy === 'loop'));
  assert.ok(result.lightPaths.length <= 4 * 4 * 4 + 1);
  assert.equal(result.isSolved, true);
  assert.deepEqual(result, propagate(room(), pieces));
});
test('prism and mirror stocks are separate; moving and returning preserves the piece type', () => {
  const game = createGame(levels[6]);
  assert.equal(game.place({ x: 0, y: 0 }, null, 'prism'), true);
  const id = game.pieces[0].id;
  assert.equal(game.remainingPrisms, 0);
  assert.equal(game.remaining, 1);
  assert.equal(game.place({ x: 2, y: 3 }, null, 'prism'), false);
  assert.equal(game.place({ x: 2, y: 3 }, id), true);
  assert.equal(game.pieces[0].type, 'prism');
  assert.equal(game.place({ x: 0, y: 0 }), true);
  assert.equal(game.remove(id), true);
  assert.equal(game.remainingPrisms, 1);
  assert.equal(game.remaining, 0);
  assert.equal(game.place({ x: 2, y: 3 }, null, 'unknown'), false);
});

const solutions = [
  [[2, 3, '/']],
  [[2, 3, '/']],
  [[1, 3, '/'], [1, 1, '/']],
  [[1, 3, '/'], [1, 1, '/'], [3, 1, '/']],
  [[1, 4, '/'], [1, 1, '/'], [3, 1, '\\']],
  [[2, 4, '/', 'prism']],
  [[1, 4, '/', 'prism'], [2, 4, '/']],
  [[2, 4, '/', 'prism'], [2, 1, '/'], [4, 4, '/']],
  [[1, 4, '/', 'prism'], [1, 1, '/', 'prism']],
  [[1, 4, '/', 'prism'], [1, 1, '/'], [3, 1, '\\', 'prism'], [4, 4, '/']],
];
for (const [index, level] of levels.entries()) {
  test(`${level.id}: legal solution, successive reflections, no initial or premature victory`, () => {
    const game = createGame(level);
    assert.equal(game.result.isSolved, false);
    for (const [x, y, orientation, type = 'mirror'] of solutions[index]) {
      assert.equal(game.result.isSolved, false);
      assert.equal(game.place({ x, y }, null, type), true);
      if (orientation === '/') assert.equal(game.rotate(game.pieces.at(-1).id), true);
    }
    assert.equal(game.result.isSolved, true);
    assert.equal(game.remaining, 0);
    assert.equal(game.remainingPrisms, 0);
    assert.equal(game.rotate(game.pieces[0].id), false);
    game.reset();
    assert.equal(game.result.isSolved, false);
    assert.equal(game.remaining, level.availablePieces);
  });
}
test('inventory, occupied cells, moving, removal and reset respect the level rules', () => {
  const game = createGame(levels[0]);
  for (const cell of [{ x: -1, y: 0 }, { x: 4, y: 0 }, { x: 1.5, y: 1 }, { x: 0, y: 3 }, { x: 2, y: 0 }]) {
    assert.equal(game.place(cell), false);
  }
  assert.equal(game.place({ x: 1, y: 1 }), true);
  assert.equal(game.place({ x: 2, y: 1 }), false);
  const id = game.pieces[0].id;
  assert.equal(game.place({ x: 2, y: 2 }, 'missing'), false);
  assert.equal(game.place({ x: 2, y: 2 }, id), true);
  assert.equal(game.rotate(id), true);
  assert.equal(game.pieces[0].orientation, '/');
  const snapshot = game.pieces;
  snapshot[0].x = 99;
  assert.equal(game.pieces[0].x, 2);
  assert.equal(game.remove(id), true);
  assert.equal(game.remove(id), false);
  assert.equal(game.remaining, 1);
  const blockedGame = createGame(levels[2]);
  assert.equal(blockedGame.place({ x: 2, y: 3 }), false);
  blockedGame.place({ x: 0, y: 0 });
  blockedGame.place({ x: 1, y: 0 });
  assert.equal(blockedGame.place({ x: 1, y: 0 }, blockedGame.pieces[0].id), false);
});
