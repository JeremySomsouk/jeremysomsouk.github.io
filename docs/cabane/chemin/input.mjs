import { sameCell } from './domain.mjs';

export function cellFromPoint(x, y, rect, rows, cols) {
  if (x < rect.left || y < rect.top || x >= rect.right || y >= rect.bottom) return null;
  return { row: Math.floor((y - rect.top) / rect.height * rows), col: Math.floor((x - rect.left) / rect.width * cols) };
}

export function cellsBetween(from, to) {
  if (!from || !to || sameCell(from, to) || (from.row !== to.row && from.col !== to.col)) return [];
  const distance = Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  return Array.from({ length: distance }, (_, index) => ({
    row: from.row + Math.sign(to.row - from.row) * (index + 1),
    col: from.col + Math.sign(to.col - from.col) * (index + 1),
  }));
}

export function enterCells(game, cells) {
  let changed = false;
  for (const cell of cells) {
    if (sameCell(cell, game.path.at(-1))) continue;
    if (!game.enter(cell)) break;
    changed = true;
  }
  return changed;
}

export function attachInput(board, getGame, render) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let pointerId = null;
  let rect;
  let lastCell;
  const finish = () => {
    if (pointerId !== null && board.hasPointerCapture(pointerId)) board.releasePointerCapture(pointerId);
    pointerId = null;
    lastCell = null;
  };
  const detect = event => {
    const puzzle = getGame().puzzle;
    return cellFromPoint(event.clientX, event.clientY, rect, puzzle.rows, puzzle.cols);
  };
  board.addEventListener('pointerdown', event => {
    if (pointerId !== null || !event.isPrimary || event.button !== 0) return;
    rect = board.getBoundingClientRect();
    const cell = detect(event);
    const game = getGame();
    if (!cell || game.status === 'completed') return;
    const changed = game.enter(cell);
    if (!changed && !sameCell(cell, game.path.at(-1))) return;
    event.preventDefault();
    board.focus({ preventScroll: true });
    pointerId = event.pointerId;
    lastCell = cell;
    board.setPointerCapture(pointerId);
    if (changed) render();
  }, options);
  board.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event]) {
      const cell = detect(sample);
      if (sameCell(cell, lastCell)) continue;
      if (!cell) { lastCell = null; continue; }
      const game = getGame();
      // Only interpolate a straight gesture. A diagonal sample never invents a turn.
      const candidates = lastCell ? cellsBetween(lastCell, cell) : [cell];
      lastCell = cell;
      if (enterCells(game, candidates)) render();
    }
  }, options);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    board.addEventListener(event, e => { if (e.pointerId === pointerId) finish(); }, options);
  }
  window.addEventListener('resize', finish, options);
  window.addEventListener('blur', finish, options);
  board.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const game = getGame();
    const directions = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const direction = directions[event.key];
    if (!direction && !['Enter', ' ', 'Backspace'].includes(event.key)) return;
    event.preventDefault();
    if (pointerId !== null) return;
    let changed = false;
    if (!game.path.length && event.key !== 'Backspace') changed = game.enter(game.puzzle.checkpoints[0]);
    else if (event.key === 'Backspace' && game.path.length > 1) changed = game.enter(game.path.at(-2));
    else if (direction && game.path.length) {
      const last = game.path.at(-1);
      changed = game.enter({ row: last.row + direction[0], col: last.col + direction[1] });
    }
    if (changed) render();
  }, options);
  return { cancel: finish, destroy() { finish(); abort.abort(); } };
}
