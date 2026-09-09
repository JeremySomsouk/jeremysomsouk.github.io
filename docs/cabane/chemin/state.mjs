import { ReadingTimer } from '../lecture/timer.mjs';
import { advancePath, getExpectedCheckpoint, isPuzzleCompleted } from './domain.mjs';

export class PathGame {
  constructor(puzzle, now) {
    this.puzzle = puzzle;
    this.timer = new ReadingTimer(now);
    this.restart();
  }
  restart() {
    this.path = [];
    this.status = 'idle';
    this.timer.reset();
  }
  get expectedCheckpoint() { return getExpectedCheckpoint(this.puzzle, this.path); }
  enter(cell) {
    if (this.status === 'completed') return false;
    const next = advancePath(this.puzzle, this.path, cell);
    if (next === this.path) return false;
    this.path = next;
    if (this.status === 'idle') {
      this.status = 'playing';
      this.timer.start();
    }
    if (isPuzzleCompleted(this.puzzle, this.path)) {
      this.status = 'completed';
      this.timer.stop();
    }
    return true;
  }
}

export function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
