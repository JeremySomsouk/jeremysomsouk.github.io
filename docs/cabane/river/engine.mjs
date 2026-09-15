// Hidden sampling grid; the landscape and gesture have no visible tiles.
export const WIDTH = 420;
export const HEIGHT = 600;
export const CELL = 5;
export const COLS = WIDTH / CELL;
export const ROWS = HEIGHT / CELL;
export const BRUSH = 27;

export function distanceToSegment(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

// Shared by the scenery and simulation: visible banks match playable ground.
export function curve(points) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i];
    const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4);
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t
        + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t
        + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)));
    }
  }
  return [...out, points.at(-1)];
}

export function createTerrain(level) {
  const paths = level.paths.map(path => ({ ...path, samples: curve(path.points) }));
  const land = new Uint8Array(COLS * ROWS);
  const initial = new Uint8Array(land.length);
  const seeds = [];
  const pondCells = level.ponds.map(() => []);
  for (let i = 0; i < land.length; i++) {
    const x = (i % COLS + .5) * CELL, y = (Math.floor(i / COLS) + .5) * CELL;
    const spring = Math.hypot(x - level.source[0], y - level.source[1]) < 30;
    const pond = level.ponds.findIndex(p => Math.hypot((x - p.x) / 1.18, y - p.y) < p.r);
    const inPath = paths.some(p => p.samples.some((a, j) => j > 0
      && distanceToSegment(x, y, p.samples[j - 1], a) <= p.width / 2));
    const rock = level.rocks.some(r => Math.hypot(x - r.x, y - r.y) <= r.r);
    land[i] = Number(!rock && (spring || pond >= 0 || inPath));
    if (!land[i]) continue;
    initial[i] = Number(spring || pond >= 0 || level.exposed.some(p =>
      distanceToSegment(x, y, p[0], p[1]) <= p[2]));
    if (spring) seeds.push(i);
    if (pond >= 0) pondCells[pond].push(i);
  }
  return { paths, land, initial, seeds, pondCells };
}

export function neighbors(i) {
  const out = [];
  if (i % COLS) out.push(i - 1);
  if (i % COLS < COLS - 1) out.push(i + 1);
  if (i >= COLS) out.push(i - COLS);
  if (i < COLS * (ROWS - 1)) out.push(i + COLS);
  return out;
}

export class RiverGame {
  constructor(level) {
    this.level = level;
    this.terrain = createTerrain(level);
    this.open = this.terrain.initial.slice();
    this.openedAt = new Float64Array(this.open.length);
    this.arrival = new Float64Array(this.open.length).fill(Infinity);
    this.time = 0;
    this.revision = 0;
    this.dirty = true;
    this.scratched = false;
    this.fills = level.ponds.map(() => 0);
    this.solved = false;
    this.update(0);
  }

  scratch(from, to = from, radius = BRUSH) {
    if (this.solved || ![...from, ...to, radius].every(Number.isFinite) || radius <= 0) return 0;
    let changed = 0;
    const minX = Math.max(0, Math.floor((Math.min(from[0], to[0]) - radius) / CELL));
    const maxX = Math.min(COLS - 1, Math.floor((Math.max(from[0], to[0]) + radius) / CELL));
    const minY = Math.max(0, Math.floor((Math.min(from[1], to[1]) - radius) / CELL));
    const maxY = Math.min(ROWS - 1, Math.floor((Math.max(from[1], to[1]) + radius) / CELL));
    for (let row = minY; row <= maxY; row++) for (let col = minX; col <= maxX; col++) {
      const i = row * COLS + col;
      if (!this.terrain.land[i] || this.open[i]) continue;
      if (distanceToSegment((col + .5) * CELL, (row + .5) * CELL, from, to) > radius) continue;
      this.open[i] = 1;
      this.openedAt[i] = this.time;
      changed++;
    }
    if (changed) { this.dirty = true; this.scratched = true; this.revision++; }
    return changed;
  }

  propagate() {
    // Earliest arrival through excavated cells. New holes cannot make water appear
    // in the past or jump over a dry plug, a bank, or a diagonal corner.
    this.arrival.fill(Infinity);
    const queue = [...this.terrain.seeds];
    const queued = new Uint8Array(this.open.length);
    for (const i of queue) { this.arrival[i] = 0; queued[i] = 1; }
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head];
      queued[i] = 0;
      for (const j of neighbors(i)) {
        if (!this.open[j]) continue;
        const arrival = Math.max(this.arrival[i], this.openedAt[j]) + .019;
        if (arrival >= this.arrival[j] - 1e-9) continue;
        this.arrival[j] = arrival;
        if (!queued[j]) { queued[j] = 1; queue.push(j); }
      }
    }
    this.dirty = false;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;
    this.time += dt;
    if (this.dirty) this.propagate();
    this.fills = this.terrain.pondCells.map(cells => cells.length
      ? cells.reduce((sum, i) => sum + Math.max(0, Math.min(1, (this.time - this.arrival[i]) / .5)), 0) / cells.length : 0);
    this.solved = this.fills.length > 0 && this.fills.every(fill => fill >= .97);
  }

  wetAt(x, y) {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return false;
    return this.arrival[Math.floor(y / CELL) * COLS + Math.floor(x / CELL)] <= this.time;
  }
}
