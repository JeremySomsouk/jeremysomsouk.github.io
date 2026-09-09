/** @typedef {{row: number, col: number}} Position */
/** @typedef {Position & {value: number}} Checkpoint */
/** @typedef {{id: string, rows: number, cols: number, checkpoints: Checkpoint[], solution: Position[]}} Puzzle */

export const sameCell = (a, b) => Boolean(a && b && a.row === b.row && a.col === b.col);
export const isAdjacent = (a, b) => Boolean(a && b && Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1);
export const isCellVisited = (path, cell) => path.some(item => sameCell(item, cell));
export const inBounds = (puzzle, cell) => Boolean(cell && Number.isInteger(cell.row) && Number.isInteger(cell.col) && cell.row >= 0 && cell.col >= 0 && cell.row < puzzle.rows && cell.col < puzzle.cols);
export const checkpointAt = (puzzle, cell) => puzzle.checkpoints.find(point => sameCell(point, cell))?.value;
export function getExpectedCheckpoint(puzzle, path) {
  return path.reduce((next, cell) => checkpointAt(puzzle, cell) === next ? next + 1 : next, 1);
}
export function canEnterCell(puzzle, path, cell) {
  if (!inBounds(puzzle, cell) || isCellVisited(path, cell)) return false;
  if (!path.length) return checkpointAt(puzzle, cell) === 1;
  if (!isAdjacent(path.at(-1), cell)) return false;
  const checkpoint = checkpointAt(puzzle, cell);
  return checkpoint === undefined || checkpoint === getExpectedCheckpoint(puzzle, path);
}
export function advancePath(puzzle, path, cell) {
  if (path.length > 1 && sameCell(path.at(-2), cell)) return path.slice(0, -1);
  return canEnterCell(puzzle, path, cell) ? [...path, { row: cell.row, col: cell.col }] : path;
}
export function validateSolution(puzzle, solution) {
  if (!Array.isArray(solution) || solution.length !== puzzle.rows * puzzle.cols) return false;
  const visited = new Set();
  let expected = 1;
  for (let i = 0; i < solution.length; i++) {
    const cell = solution[i];
    if (!inBounds(puzzle, cell)) return false;
    const key = `${cell.row},${cell.col}`;
    if (!inBounds(puzzle, cell) || visited.has(key) || (i && !isAdjacent(solution[i - 1], cell))) return false;
    const checkpoint = checkpointAt(puzzle, cell);
    if ((!i && checkpoint !== 1) || (checkpoint !== undefined && checkpoint !== expected++)) return false;
    visited.add(key);
  }
  return expected === puzzle.checkpoints.length + 1;
}
export const isPuzzleCompleted = (puzzle, path) => validateSolution(puzzle, path);
export function validatePuzzle(puzzle) {
  if (!Number.isInteger(puzzle.rows) || !Number.isInteger(puzzle.cols) || puzzle.rows < 1 || puzzle.cols < 1 || !Array.isArray(puzzle.checkpoints) || !puzzle.checkpoints.length) return false;
  const cells = new Set();
  for (let i = 0; i < puzzle.checkpoints.length; i++) {
    const point = puzzle.checkpoints[i];
    if (!inBounds(puzzle, point)) return false;
    const key = `${point.row},${point.col}`;
    if (point.value !== i + 1 || !inBounds(puzzle, point) || cells.has(key)) return false;
    cells.add(key);
  }
  return validateSolution(puzzle, puzzle.solution);
}
