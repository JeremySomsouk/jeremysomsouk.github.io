import { WIDTH, HEIGHT, COLS, ROWS, CELL, BRUSH, neighbors } from './engine.mjs';
import { drawScenery, drawEarth, drawPlants, drawTunnels, makeSurface, ellipse } from './art.mjs';

export function createBoard(canvas, game, { createCanvas = () => document.createElement('canvas'), reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  const scenery = makeSurface(createCanvas), earth = makeSurface(createCanvas);
  const dirt = makeSurface(createCanvas), water = makeSurface(createCanvas);
  const small = makeSurface(createCanvas, COLS, ROWS), mask = makeSurface(createCanvas);
  const smallCtx = small.getContext('2d'), maskCtx = mask.getContext('2d');
  const pixels = smallCtx.createImageData(COLS, ROWS);
  const dirtCtx = dirt.getContext('2d'), waterCtx = water.getContext('2d');
  drawScenery(scenery.getContext('2d'), game); drawEarth(earth.getContext('2d'), game);
  let renderedRevision = -1, cursor = null;
  let crumbs = [];
  const maskFor = opacity => {
    for (let i = 0; i < game.open.length; i++) {
      const offset = i * 4;
      pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = 255;
      pixels.data[offset + 3] = Math.round(opacity(i) * 255);
    }
    smallCtx.putImageData(pixels, 0, 0);
    maskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    maskCtx.filter = 'blur(1.5px)';
    maskCtx.drawImage(small, 0, 0, WIDTH, HEIGHT);
    maskCtx.filter = 'none';
  };
  const rebuildEarth = () => {
    maskFor(i => game.terrain.land[i] && !game.open[i] ? 1 : 0);
    dirtCtx.clearRect(0, 0, WIDTH, HEIGHT);
    dirtCtx.drawImage(earth, 0, 0); dirtCtx.globalCompositeOperation = 'destination-in';
    dirtCtx.drawImage(mask, 0, 0); dirtCtx.globalCompositeOperation = 'source-over';
    renderedRevision = game.revision;
  };
  function render() {
    if (renderedRevision !== game.revision) rebuildEarth();
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(scenery, 0, 0); ctx.drawImage(dirt, 0, 0);
    maskFor(i => game.open[i] ? Math.max(0, Math.min(1, (game.time - game.arrival[i]) / .12)) : 0);
    waterCtx.clearRect(0, 0, WIDTH, HEIGHT);
    waterCtx.fillStyle = '#7cabb0'; waterCtx.fillRect(0, 0, WIDTH, HEIGHT);
    // Short drifting strokes follow the arrival field, including finger-made detours.
    for (let i = 0; i < game.open.length; i += 11) {
      if (game.arrival[i] > game.time) continue;
      const next = neighbors(i).filter(j => Number.isFinite(game.arrival[j]) && game.arrival[j] > game.arrival[i] + .001)
        .sort((a, b) => game.arrival[a] - game.arrival[b])[0];
      if (next === undefined) continue;
      const t = reducedMotion ? .4 : (game.time * .6 + i * .137) % 1;
      const dx = next % COLS - i % COLS, dy = Math.floor(next / COLS) - Math.floor(i / COLS);
      const x = (i % COLS + .5 + dx * t) * CELL, y = (Math.floor(i / COLS) + .5 + dy * t) * CELL;
      waterCtx.beginPath(); waterCtx.moveTo(x - dx * 2, y - dy * 2); waterCtx.lineTo(x + dx * 3, y + dy * 3);
      waterCtx.strokeStyle = i % 3 ? '#e9f0d777' : '#497f8644'; waterCtx.lineWidth = 1.3; waterCtx.lineCap = 'round'; waterCtx.stroke();
    }
    for (const p of [{ x: game.level.source[0], y: game.level.source[1], r: 20 }, ...game.level.ponds]) {
      const t = reducedMotion ? .5 : (game.time * .4 + p.x / 100) % 1;
      waterCtx.beginPath(); waterCtx.ellipse(p.x, p.y, 5 + t * p.r * .8, 2 + t * p.r * .35, -.2, 0, Math.PI * 1.6);
      waterCtx.strokeStyle = `rgba(238,245,215,${.5 * (1 - t)})`; waterCtx.lineWidth = 1.6; waterCtx.stroke();
    }
    waterCtx.globalCompositeOperation = 'destination-in'; waterCtx.drawImage(mask, 0, 0); waterCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(water, 0, 0);
    // The visible little spring emerges from the rocks into the permanently fed pool.
    const [sx, sy] = game.level.source;
    ctx.beginPath(); ctx.moveTo(sx - 7, sy - 36); ctx.bezierCurveTo(sx - 9, sy - 23, sx + 7, sy - 14, sx + 2, sy - 3);
    ctx.strokeStyle = '#719da4'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 9, sy - 35); ctx.bezierCurveTo(sx - 10, sy - 23, sx + 4, sy - 16, sx - 1, sy - 7);
    ctx.strokeStyle = '#eaf0d6'; ctx.lineWidth = 2.4; ctx.stroke();
    for (let i = 0; i < 3; i++) ellipse(ctx, sx - 9 + i * 9, sy - 2 + i % 2 * 3, 2.5, 1.2, '#e8efd2');
    drawPlants(ctx, game, game.time, reducedMotion);
    for (const [index, gate] of game.gates.entries()) {
      const vertical = gate.height > gate.width;
      ctx.save(); ctx.translate(gate.x, gate.y);
      if (vertical) ctx.rotate(Math.PI / 2);
      const length = vertical ? gate.height : gate.width;
      ctx.fillStyle = '#735b43';
      ctx.fillRect(-length / 2 - 3, -18, 8, 36); ctx.fillRect(length / 2 - 5, -18, 8, 36);
      if (!gate.unlocked) {
        ctx.fillStyle = '#bc9669'; ctx.fillRect(-length / 2, -11, length, 22);
        ctx.strokeStyle = '#735b43'; ctx.lineWidth = 2;
        ctx.strokeRect(-length / 2, -11, length, 22);
        ctx.beginPath(); ctx.moveTo(-length / 2, 0); ctx.lineTo(length / 2, 0); ctx.stroke();
      }
      ctx.restore();
      const badge = (x, y, label, open) => {
        ellipse(ctx, x, y, 12, 12, open ? '#527661' : '#fff1cf');
        ctx.fillStyle = open ? '#fff8e7' : '#624b38'; ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1);
      };
      const pond = game.level.ponds[gate.pond];
      badge(pond.x, pond.y - pond.r - 10, String(index + 1), gate.unlocked);
      badge(gate.x + (vertical ? 25 : 0), gate.y + (vertical ? 0 : -25), gate.unlocked ? '✓' : String(index + 1), gate.unlocked);
    }
    drawTunnels(ctx, game);
    crumbs = crumbs.filter(p => game.time - p.born < .45);
    if (!reducedMotion) for (const p of crumbs) {
      const t = game.time - p.born;
      ctx.globalAlpha = Math.max(0, 1 - t / .45);
      ellipse(ctx, p.x + p.dx * t, p.y + p.dy * t + t * t * 100, p.r, p.r * .65, '#ae885c', p.dx);
    }
    ctx.globalAlpha = 1;
    if (!game.scratched && game.level.guide) {
      const guide = game.level.guide;
      const t = reducedMotion ? .5 : (game.time * .45) % 1;
      const a = guide[0], b = guide.at(-1);
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      ctx.beginPath(); ctx.ellipse(x, y, 13, 16, -.2, 0, Math.PI * 2); ctx.fillStyle = '#fff5d882'; ctx.fill();
      ctx.strokeStyle = '#6c624c'; ctx.lineWidth = 1.7; ctx.stroke();
      ellipse(ctx, x - 2, y - 4, 4, 6, '#fff8e7');
    }
    if (cursor && !game.solved) {
      ctx.beginPath(); ctx.arc(...cursor, BRUSH, 0, Math.PI * 2); ctx.strokeStyle = '#fff8dfb0'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  return {
    render,
    cursor(point) { cursor = point; },
    scratch(point, count) {
      if (reducedMotion || !count) return;
      for (let i = 0; i < Math.min(7, count); i++) crumbs.push({ x: point[0], y: point[1], dx: (Math.random() - .5) * 120, dy: -20 - Math.random() * 60, r: 1 + Math.random() * 2, born: game.time });
      if (crumbs.length > 70) crumbs = crumbs.slice(-70);
    },
  };
}
