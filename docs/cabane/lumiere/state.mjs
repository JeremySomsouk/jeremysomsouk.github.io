import { cellKey, inside, propagate } from './engine.mjs';

export function createGame(level) {
  const occupied = new Set([...level.lights, ...level.ghosts, ...level.walls].map(cellKey));
  let pieces = [];
  let nextId = 0;
  return {
    level,
    get pieces() { return pieces.map(piece => ({ ...piece })); },
    get remaining() { return level.availablePieces - pieces.filter(piece => piece.type === 'mirror').length; },
    get remainingPrisms() { return (level.availablePrisms ?? 0) - pieces.filter(piece => piece.type === 'prism').length; },
    get result() { return propagate(level, pieces); },
    canPlace(cell, movingId) {
      return inside(level, cell) && !occupied.has(cellKey(cell))
        && !pieces.some(piece => piece.id !== movingId && cellKey(piece) === cellKey(cell));
    },
    place(cell, movingId = null, type = 'mirror') {
      if (this.result.isSolved || !this.canPlace(cell, movingId)) return false;
      if (movingId !== null) {
        const piece = pieces.find(piece => piece.id === movingId);
        if (!piece || cellKey(piece) === cellKey(cell)) return false;
        Object.assign(piece, cell);
      } else {
        if (!['mirror', 'prism'].includes(type) || (type === 'prism' ? this.remainingPrisms : this.remaining) === 0) return false;
        pieces.push({ ...cell, type, id: `piece-${nextId++}`, orientation: '\\' });
      }
      return true;
    },
    rotate(id) {
      const piece = pieces.find(piece => piece.id === id);
      if (!piece || this.result.isSolved) return false;
      piece.orientation = piece.orientation === '/' ? '\\' : '/';
      return true;
    },
    remove(id) {
      if (this.result.isSolved || !pieces.some(piece => piece.id === id)) return false;
      pieces = pieces.filter(piece => piece.id !== id);
      return true;
    },
    reset() { pieces = []; nextId = 0; },
  };
}
