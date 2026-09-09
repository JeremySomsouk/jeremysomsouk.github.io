import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdjacent, advancePath, canEnterCell, getExpectedCheckpoint, isPuzzleCompleted, validatePuzzle, validateSolution } from '../docs/cabane/chemin/domain.mjs';
import { generatePuzzle, generateHamiltonianPath } from '../docs/cabane/chemin/generator.mjs';
import { PathGame, formatTime } from '../docs/cabane/chemin/state.mjs';
import { cellsBetween, cellFromPoint, enterCells } from '../docs/cabane/chemin/input.mjs';
const cell = (row, col) => ({ row, col });
const solution = [cell(0, 0), cell(0, 1), cell(0, 2), cell(1, 2), cell(1, 1), cell(1, 0)];
const puzzle = { rows: 2, cols: 3, solution, checkpoints: [ { ...solution[0], value: 1 }, { ...solution[3], value: 2 }, { ...solution[5], value: 3 } ] };

test('only orthogonal neighbors are adjacent', () => {
  assert.ok(isAdjacent(cell(1, 1), cell(1, 2)));
  assert.ok(isAdjacent(cell(1, 1), cell(0, 1)));
  for (const other of [cell(2, 2), cell(1, 3), cell(1, 1)]) assert.equal(isAdjacent(cell(1, 1), other), false);
});
test('start, movement, checkpoint order and immediate undo preserve the path', () => {
  assert.equal(canEnterCell(puzzle, [], solution[1]), false);
  let path = advancePath(puzzle, [], solution[0]);
  assert.equal(advancePath(puzzle, path, solution[5]), path);
  assert.equal(advancePath(puzzle, path, solution[2]), path);
  path = advancePath(puzzle, path, solution[1]);
  assert.equal(advancePath(puzzle, path, cell(1, 2)), path);
  path = advancePath(puzzle, path, solution[2]);
  path = advancePath(puzzle, path, solution[3]);
  assert.equal(getExpectedCheckpoint(puzzle, path), 3);
  assert.equal(advancePath(puzzle, path, solution[0]), path);
  path = advancePath(puzzle, path, solution[2]);
  assert.equal(getExpectedCheckpoint(puzzle, path), 2);
  path = advancePath(puzzle, path, solution[3]);
  assert.equal(getExpectedCheckpoint(puzzle, path), 3);
  assert.equal(canEnterCell(puzzle, path, cell(-1, 0)), false);
  path = advancePath(puzzle, path, solution[4]);
  assert.equal(advancePath(puzzle, path, solution[1]), path);
});
test('completion requires full coverage in order, not merely the final checkpoint', () => {
  const early = { ...puzzle, checkpoints: [{ ...solution[0], value: 1 }, { ...solution[1], value: 2 }] };
  assert.equal(isPuzzleCompleted(early, solution.slice(0, 2)), false);
  assert.equal(isPuzzleCompleted(early, solution), true);
  assert.equal(isPuzzleCompleted(puzzle, solution), true);
  assert.equal(isPuzzleCompleted(puzzle, [...solution].reverse()), false);
  assert.equal(validateSolution(puzzle, [null, ...solution.slice(1)]), false);
  assert.equal(validateSolution(puzzle, [...solution.slice(0, -1), solution[0]]), false);
  assert.equal(validatePuzzle({ ...puzzle, checkpoints: [{ ...solution[0], value: 2 }] }), false);
});
test('500 seeded boards across dimensions and difficulties are valid and varied', () => {
  const distinct = new Set();
  for (let seed = 0; seed < 500; seed++) {
    const size = 4 + seed % 4;
    const generated = generatePuzzle({ seed, rows: size, cols: size + seed % 2, difficulty: ['easy', 'medium', 'hard'][seed % 3] });
    assert.ok(validatePuzzle(generated), `seed ${seed}`);
    assert.deepEqual(generated, generatePuzzle({ seed, rows: size, cols: size + seed % 2, difficulty: generated.difficulty }));
    assert.deepEqual(generated.checkpoints.at(-1), { ...generated.solution.at(-1), value: generated.checkpoints.length });
    distinct.add(JSON.stringify(generated.solution));
  }
  assert.ok(distinct.size > 450);
  for (const [rows, cols] of [[1, 1], [1, 7], [7, 1], [2, 2]]) assert.ok(validatePuzzle(generatePuzzle({ seed: 1, rows, cols })));
  assert.throws(() => generateHamiltonianPath(0, 5), RangeError);
  assert.throws(() => generateHamiltonianPath(5, 21), RangeError);
});
test('timer starts on 1, keeps running during undo, freezes on completion and resets', () => {
  let now = 100;
  const game = new PathGame(puzzle, () => now);
  assert.equal(game.enter(solution[1]), false);
  assert.equal(game.status, 'idle');
  game.enter(solution[0]);
  now += 1200;
  game.enter(solution[1]);
  game.enter(solution[0]);
  assert.equal(game.timer.elapsed(), 1200);
  solution.slice(1).forEach(point => game.enter(point));
  assert.equal(game.status, 'completed');
  now += 5000;
  assert.equal(game.timer.elapsed(), 1200);
  assert.equal(game.enter(solution.at(-2)), false);
  game.restart();
  assert.equal(game.status, 'idle');
  assert.equal(game.timer.elapsed(), 0);
  assert.deepEqual(game.path, []);
  assert.equal(game.puzzle, puzzle);
  assert.equal(formatTime(72000), '1:12');
});
test('fast straight pointer movement visits intermediate cells and diagonals never invent a turn', () => {
  assert.deepEqual(cellsBetween(cell(0, 0), cell(0, 3)), [cell(0, 1), cell(0, 2), cell(0, 3)]);
  assert.deepEqual(cellsBetween(cell(3, 1), cell(0, 1)), [cell(2, 1), cell(1, 1), cell(0, 1)]);
  assert.deepEqual(cellsBetween(cell(0, 0), cell(2, 2)), []);
  assert.deepEqual(cellsBetween(cell(0, 0), cell(0, 0)), []);
  const rect = { left: 10, top: 20, right: 310, bottom: 320, width: 300, height: 300 };
  assert.deepEqual(cellFromPoint(71, 81, rect, 5, 5), cell(1, 1));
  assert.equal(cellFromPoint(310, 50, rect, 5, 5), null);
  assert.equal(cellFromPoint(0, 50, rect, 5, 5), null);
});

test('quick backtracking after a rejected checkpoint passes over the current endpoint', () => {
  const game = new PathGame({ ...puzzle, checkpoints: [
    { ...solution[0], value: 1 }, { ...solution[4], value: 2 }, { ...solution[2], value: 3 },
  ] });
  game.enter(solution[0]);
  game.enter(solution[1]);
  assert.equal(game.enter(solution[2]), false);
  assert.equal(enterCells(game, cellsBetween(solution[2], solution[0])), true);
  assert.deepEqual(game.path, [solution[0]]);
});
