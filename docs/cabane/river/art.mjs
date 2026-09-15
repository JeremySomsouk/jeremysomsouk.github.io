import { WIDTH, HEIGHT, COLS, ROWS, CELL } from './engine.mjs';

export const palette = { grass: '#dce3c3', leaf: '#567760', dark: '#385b48', bank: '#b6986b', sand: '#e4d5ae', earth: '#b8996e', water: '#79acb4', cream: '#fff5d8' };
export function randomSeed(seed = 71) {
  return () => { seed = Math.imul(seed ^ seed >>> 15, 1 | seed); seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed); return ((seed ^ seed >>> 14) >>> 0) / 4294967296; };
}
export function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function stroke(ctx, points, width, color) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.stroke();
}
function leaf(ctx, x, y, scale, rotation, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale, scale);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-13, -7, -14, -23, -3, -33);
  ctx.bezierCurveTo(9, -28, 15, -11, 0, 0); ctx.fillStyle = color; ctx.fill();
  stroke(ctx, [[0, -3], [-2, -25]], 1, '#e4e5b14d'); ctx.restore();
}
function bush(ctx, x, y, scale, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale);
  stroke(ctx, [[0, 8], [4, -20], [-2, -68]], 3, palette.dark);
  for (let i = 0; i < 5; i++) {
    leaf(ctx, 3, -i * 12, .9 - i * .08, i % 2 ? -.85 : .95, i % 2 ? '#71875c' : '#587659');
  }
  ctx.restore();
}
export function rock(ctx, x, y, radius) {
  ctx.save(); ctx.translate(x, y);
  ellipse(ctx, 3, radius * .59, radius * 1.08, radius * .46, '#7e805a32');
  ctx.beginPath(); ctx.moveTo(-radius, radius * .25);
  ctx.bezierCurveTo(-radius * 1.05, -radius * .35, -radius * .45, -radius * .95, radius * .15, -radius * .82);
  ctx.bezierCurveTo(radius * .8, -radius * .9, radius * 1.12, -.1 * radius, radius, radius * .3);
  ctx.quadraticCurveTo(radius * .45, radius * .82, -radius * .65, radius * .58); ctx.closePath();
  ctx.fillStyle = '#8c9688'; ctx.fill(); ctx.strokeStyle = '#6e7c69'; ctx.lineWidth = 1.4; ctx.stroke();
  stroke(ctx, [[-radius * .65, -radius * .12], [-radius * .25, -radius * .55], [radius * .38, -radius * .5]], 3, '#b9bc9f');
  stroke(ctx, [[radius * .6, -.1 * radius], [radius * .34, radius * .47]], 2, '#748271');
  ellipse(ctx, -radius * .5, radius * .45, radius * .4, radius * .13, '#768757');
  ctx.restore();
}
export function flower(ctx, x, y, bloom, color = 'cream', scale = 1, phase = 0) {
  const colors = { cream: '#fff4d7', rose: '#c88078', honey: '#d8b25b' };
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const lean = (1 - bloom) * 17;
  ctx.beginPath(); ctx.moveTo(0, 1); ctx.quadraticCurveTo(-8 + lean * .3, -17, lean, -29 + lean * .45);
  ctx.strokeStyle = '#507150'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.stroke();
  leaf(ctx, -1, -4, .43, -.9 - .2 * (1 - bloom), '#6e925d');
  leaf(ctx, 0, -9, .32, .85, '#879b61');
  ctx.translate(lean, -29 + lean * .45); ctx.rotate(phase + (1 - bloom) * 1.1);
  const petal = 3.8 + 2.8 * bloom;
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    ellipse(ctx, Math.cos(angle) * (3 + bloom * 4), Math.sin(angle) * (3 + bloom * 4), petal, 3.2, colors[color], angle);
  }
  ellipse(ctx, 0, 0, 3.6, 3.4, '#cba354');
  ctx.restore();
}
function squirrel(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
  ellipse(ctx, -17, -11, 15, 24, '#b47852', -.35);
  ellipse(ctx, -20, -13, 8, 17, '#c89160', -.35);
  ellipse(ctx, 1, 0, 11, 17, '#b7774d', .15);
  ellipse(ctx, 5, -1, 6, 11, '#dfc193');
  ellipse(ctx, 9, -18, 12, 11, '#bc8055');
  ellipse(ctx, 3, -28, 3.8, 8, '#b7774d', -.3);
  ellipse(ctx, 14, -27, 3.5, 7, '#b7774d', .25);
  ellipse(ctx, 15, -15, 7, 4.5, '#e0c6a0');
  ellipse(ctx, 13, -20, 1.6, 2, '#3a392e'); ellipse(ctx, 21, -16, 1.7, 1.6, '#3a392e');
  stroke(ctx, [[5, 3], [16, 1]], 4, '#b7774d'); stroke(ctx, [[0, 14], [11, 16]], 5, '#a66f4c');
  ctx.restore();
}
export function drawScenery(ctx, game) {
  const rng = randomSeed(game.level.id.length * 9127);
  ctx.fillStyle = '#eef0d9'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Broad, soft-edged areas of grass give the page the shape of an illustrated clearing.
  ellipse(ctx, 182, 278, 290, 354, palette.grass, -.1);
  ellipse(ctx, 330, 260, 158, 270, '#d5dfbd', .2);
  ellipse(ctx, 35, 415, 110, 275, '#d0d9b6', -.2);
  ellipse(ctx, 200, 605, 200, 60, '#c9d3ac');
  for (let i = 0; i < 1300; i++) {
    const x = rng() * WIDTH, y = rng() * HEIGHT;
    ellipse(ctx, x, y, .5 + rng() * 1.1, .4, i % 2 ? '#657c4920' : '#fff6d637');
  }
  // Continuous banks, not individual controls.
  for (const [extra, color] of [[18, '#829568'], [12, '#b49b71'], [5, '#bda17a'], [0, palette.sand]]) {
    for (const p of game.terrain.paths) stroke(ctx, p.samples, p.width + extra, color);
    for (const p of game.level.ponds) ellipse(ctx, p.x, p.y, p.r * 1.18 + extra / 2, p.r + extra / 2, color);
    ellipse(ctx, ...game.level.source, 30 + extra / 2, 30 + extra / 2, color);
  }
  // River-bed grain stays visible after excavation.
  for (let i = 0; i < game.terrain.land.length; i += 2) if (game.terrain.land[i]) {
    const x = (i % COLS + rng()) * CELL, y = (Math.floor(i / COLS) + rng()) * CELL;
    ellipse(ctx, x, y, .6 + rng(), .45, '#a58a6239');
  }
  // Small grasses only on firm ground, never over the scratchable area.
  for (let i = 0; i < 165; i++) {
    const x = 15 + rng() * 390, y = 65 + rng() * 495;
    const index = Math.floor(y / CELL) * COLS + Math.floor(x / CELL);
    if (game.terrain.land[index]) continue;
    const h = 3 + rng() * 5;
    stroke(ctx, [[x - 4, y - h], [x, y], [x + 1, y - h - 3]], 1.2, '#8d9d6d');
    if (i % 5 === 0) ellipse(ctx, x + 1, y - h - 4, 2, 1.7, '#e6d49a');
  }
  bush(ctx, 26, 151, 1.25); bush(ctx, 396, 202, 1.35, -1);
  bush(ctx, 28, 510, 1.15); bush(ctx, 380, 554, 1.15, -1);
  bush(ctx, 61, 591, .85); bush(ctx, 335, 586, .75, -1);
  rock(ctx, 36, 370, 17); rock(ctx, 380, 365, 13);
  squirrel(ctx, 62, 259);
  // A few leaves frame the source without covering its water.
  const [sx, sy] = game.level.source;
  rock(ctx, sx - 30, sy - 25, 22); rock(ctx, sx + 25, sy - 30, 25); rock(ctx, sx - 2, sy - 43, 26);
  bush(ctx, sx - 49, sy - 17, .55);
}
export function drawEarth(ctx, game) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = palette.earth; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const rng = randomSeed(4107);
  for (let i = 0; i < 5800; i++) {
    const x = rng() * WIDTH, y = rng() * HEIGHT;
    ellipse(ctx, x, y, .5 + rng() * 2, .4 + rng() * .7, i % 3 ? '#e8d0a558' : '#7e644934', rng());
  }
  for (let i = 0; i < 70; i++) {
    const x = rng() * WIDTH, y = rng() * HEIGHT;
    stroke(ctx, [[x, y], [x + 4, y - 2], [x + 9, y - 1]], 1, '#8a704735');
  }
}
export function drawPlants(ctx, game, time, still) {
  game.level.ponds.forEach((p, i) => {
    const bloom = Math.min(1, game.fills[i] / .85);
    const sway = still ? 0 : Math.sin(time * 1.3 + i) * .035 * bloom;
    flower(ctx, p.x + p.r * .8, p.y + p.r * .65, bloom, p.color, 1.1, sway);
    flower(ctx, p.x + p.r * .42, p.y + p.r * .98, bloom, p.color, .78, -sway);
    flower(ctx, p.x - p.r * .88, p.y + p.r * .68, bloom, 'cream', .66, sway);
    if (bloom > .9) {
      ctx.beginPath(); ctx.moveTo(p.x - 8, p.y + 8); ctx.arc(p.x - 8, p.y + 8, 8, .3, Math.PI * 2 - .2); ctx.closePath();
      ctx.fillStyle = '#739a72'; ctx.fill();
      stroke(ctx, [[p.x - 8, p.y + 8], [p.x - 14, p.y + 5]], .8, '#b5c69b');
    }
  });
  for (const r of game.level.rocks) rock(ctx, r.x, r.y, r.r + 1);
}

export function makeSurface(factory, width = WIDTH, height = HEIGHT) {
  const canvas = factory(width, height); canvas.width = width; canvas.height = height; return canvas;
}
