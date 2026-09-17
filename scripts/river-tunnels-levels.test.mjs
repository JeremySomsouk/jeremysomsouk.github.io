import test from 'node:test';
import assert from 'node:assert/strict';
import { RiverGame, curve, CELL, COLS } from '../docs/cabane/river/engine.mjs';
import { levels } from '../docs/cabane/river/levels.mjs';

const index = ([x, y]) => Math.floor(y / CELL) * COLS + Math.floor(x / CELL);
const settle = game => { for (let step = 0; step < 600; step++) game.update(.05); };
function tracePaths(game) {
  for (const path of game.level.paths) {
    const samples = curve(path.points);
    samples.forEach((point, i) => game.scratch(samples[Math.max(0, i - 1)], point));
  }
  for (const tunnel of game.level.tunnels) {
    game.scratch(tunnel.from);
    game.scratch(tunnel.to);
  }
}

test('levels 20 to 30 introduce tunnels gradually and start with covered mouths', () => {
  assert.equal(levels[19].tunnels.length, 1);
  assert.equal(levels[29].tunnels.length, 3);
  for (const level of levels.slice(19)) {
    const game = new RiverGame(level);
    game.update(30);
    assert.equal(game.solved, false, level.id);
    assert.ok(game.fills.every(fill => fill === 0), `${level.id}: ponds start dry`);
    assert.equal(new Set(level.tunnels.map(t => t.label)).size, level.tunnels.length);
    for (const tunnel of level.tunnels) for (const mouth of [tunnel.from, tunnel.to]) {
      assert.equal(game.open[index(mouth)], 0, `${level.id}: mouth ${tunnel.label} must be dug`);
    }
  }
});

test('every tunnel landscape is solvable by following its paths with the normal finger brush', () => {
  for (const level of levels.slice(19)) {
    const game = new RiverGame(level);
    tracePaths(game);
    settle(game);
    assert.ok(game.fills.every(fill => fill >= .97), `${level.id}: ${game.fills}`);
    assert.equal(game.solved, true, level.id);
  }
});

test('each tunnel is essential even if every patch of surface earth is excavated', () => {
  for (const level of levels.slice(19)) for (const tunnel of level.tunnels) {
    const game = new RiverGame(level);
    game.tunnelLinks.delete(index(tunnel.from));
    game.tunnelLinks.delete(index(tunnel.to));
    game.scratch([210, 300], [210, 300], 1000);
    settle(game);
    assert.equal(game.solved, false, `${level.id}: ${tunnel.label} cannot be bypassed over land`);
  }
});
