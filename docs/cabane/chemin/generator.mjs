import { isAdjacent, validatePuzzle } from './domain.mjs';

/** @typedef {'easy' | 'medium' | 'hard'} Difficulty */
export const DIFFICULTIES = Object.freeze({
  easy: { rows: 5, cols: 5, checkpoints: 7 },
  medium: { rows: 6, cols: 6, checkpoints: 7 },
  hard: { rows: 7, cols: 7, checkpoints: 6 },
});

export function seededRandom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateHamiltonianPath(rows, cols, random = Math.random) {
  if (![rows, cols].every(size => Number.isInteger(size) && size >= 1 && size <= 20)) throw new RangeError('Dimensions must be integers between 1 and 20.');
  let path = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    return { row, col: row % 2 ? cols - 1 - index % cols : index % cols };
  });
  // Reversing the prefix reconnects an endpoint to a neighbor without losing any cell.
  for (let step = 0; step < rows * cols * 20; step++) {
    if (random() < 0.5) path.reverse();
    const neighbors = [];
    for (let i = 2; i < path.length; i++) if (isAdjacent(path[0], path[i])) neighbors.push(i);
    if (neighbors.length) {
      const index = neighbors[Math.floor(random() * neighbors.length)];
      path = [...path.slice(0, index).reverse(), ...path.slice(index)];
    }
  }
  return path;
}

export function generatePuzzle({ seed = Math.random().toString(36).slice(2), difficulty = 'easy', rows, cols } = {}) {
  const settings = DIFFICULTIES[difficulty];
  if (!settings) throw new RangeError('Unknown difficulty.');
  rows ??= settings.rows;
  cols ??= settings.cols;
  const solution = generateHamiltonianPath(rows, cols, seededRandom(seed));
  const count = Math.min(settings.checkpoints, solution.length);
  const checkpoints = Array.from({ length: count }, (_, index) => ({
    ...solution[count === 1 ? 0 : Math.round(index * (solution.length - 1) / (count - 1))], value: index + 1,
  }));
  const puzzle = { id: `chemin-v1-${rows}x${cols}-${difficulty}-${seed}`, seed: String(seed), difficulty, rows, cols, checkpoints, solution };
  if (!validatePuzzle(puzzle)) throw new Error('Generated puzzle is invalid.');
  return puzzle;
}
