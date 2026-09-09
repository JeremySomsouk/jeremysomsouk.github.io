import { levels } from './levels.mjs';
import { createGame } from './state.mjs';
import { createBoard } from './board.mjs';
import { attachInput } from './input.mjs';
import { mirrorArt, prismArt, pieceArt } from './art.mjs';

const byId = id => document.getElementById(id);
const board = byId('light-board');
const supply = byId('supply');
const prismSupply = byId('prism-supply');
const picker = byId('level-select');
const instruction = byId('instruction');
let index = 0;
let game;
let draw;
let selected = null;
let moving = false;
let input;

const groups = [1, 2].map(tier => {
  const group = document.createElement('optgroup');
  group.label = tier === 1 ? 'Niveau 1 · Les miroirs' : 'Niveau 2 · Les prismes';
  return group;
});
levels.forEach((level, i) => {
  const option = document.createElement('option');
  option.value = i;
  option.textContent = `${i + 1} / ${levels.length} · ${level.title}`;
  groups[(level.tier ?? 1) - 1].append(option);
});
picker.replaceChildren(...groups);
supply.querySelector('.reserve-icon').innerHTML = mirrorArt('\\');
prismSupply.querySelector('.reserve-icon').innerHTML = prismArt('\\');

function render() {
  const result = draw(game, selected, moving);
  byId('count').textContent = `${result.illuminatedGhosts.length} / ${game.level.ghosts.length} éveillés`;
  byId('remaining').textContent = `× ${game.remaining}`;
  supply.setAttribute('aria-label', `Prendre un miroir, ${game.remaining} disponible${game.remaining > 1 ? 's' : ''}`);
  supply.setAttribute('aria-disabled', String(game.remaining === 0 || result.isSolved));
  supply.setAttribute('aria-pressed', String(selected === 'supply'));
  supply.hidden = game.level.availablePieces === 0;
  prismSupply.hidden = !game.level.availablePrisms;
  byId('reserve-help').hidden = !supply.hidden && !prismSupply.hidden;
  byId('prism-help').hidden = game.level.tier !== 2;
  byId('prisms-remaining').textContent = `× ${game.remainingPrisms}`;
  prismSupply.setAttribute('aria-label', `Prendre un prisme, ${game.remainingPrisms} disponible${game.remainingPrisms > 1 ? 's' : ''}`);
  prismSupply.setAttribute('aria-disabled', String(game.remainingPrisms === 0 || result.isSolved));
  prismSupply.setAttribute('aria-pressed', String(selected === 'prism-supply'));
  document.querySelector('.eyebrow').textContent = game.level.tier === 2 ? 'Niveau 2 · Les prismes' : 'Niveau 1 · Les miroirs';
  byId('move').disabled = byId('remove').disabled = !game.pieces.some(piece => piece.id === selected) || result.isSolved;
  byId('move').setAttribute('aria-pressed', String(moving));
  byId('completion').hidden = !result.isSolved;
  byId('next').textContent = index === levels.length - 1 ? 'Rejouer les dix chambres ↺' : levels[index + 1].tier === 2 && game.level.tier !== 2 ? 'Découvrir le niveau 2 →' : 'Chambre suivante →';
  let message = 'Éclaire tous les fantômes !';
  if (game.level.hint && game.pieces.length === 0) message = game.level.hintType === 'prism' ? 'Glisse le prisme sur le ＋ !' : 'Glisse le miroir sur le ＋ !';
  if (selected === 'supply') message = 'Touche une case pour poser le miroir.';
  else if (selected === 'prism-supply') message = 'Touche une case pour poser le prisme.';
  else if (moving) message = 'Touche une case libre pour le déplacer.';
  else if (game.level.hint && game.pieces.length) message = game.level.hintType === 'prism' ? 'Touche le prisme : deux rayons, deux chemins !' : 'Touche le miroir pour le tourner.';
  if (result.isSolved) message = index === levels.length - 1 ? 'Bravo, la dernière chambre est éclairée !' : 'Bravo, tous les fantômes sont éclairés !';
  if (instruction.textContent !== message) instruction.textContent = message;
}

function start(nextIndex) {
  input?.cancel();
  index = nextIndex;
  picker.value = String(index);
  game = createGame(levels[index]);
  selected = null;
  moving = false;
  draw = createBoard(board, byId('rays'), game.level);
  render();
}

function tap(target) {
  if (game.result.isSolved) return;
  if (target === supply || target === prismSupply) {
    if (!(target === supply ? game.remaining : game.remainingPrisms)) return;
    const kind = target === supply ? 'supply' : 'prism-supply';
    selected = selected === kind ? null : kind;
    moving = false;
  } else {
    const cell = { x: Number(target.dataset.x), y: Number(target.dataset.y) };
    const id = target.dataset.piece;
    if (moving && selected) {
      if (game.place(cell, selected)) moving = false;
    } else if (id) {
      selected = id;
      game.rotate(id);
    } else if (['supply', 'prism-supply'].includes(selected) && game.place(cell, null, selected === 'supply' ? 'mirror' : 'prism')) selected = game.pieces.at(-1).id;
  }
  render();
}

start(0);
input = attachInput({
  area: byId('play-area'), board, supply, prismSupply, inventory: byId('inventory'), preview: byId('drag-piece'),
  getGame: () => game, tap,
  describePiece: id => pieceArt(game.pieces.find(piece => piece.id === id) ?? { type: id === 'prism-supply' ? 'prism' : 'mirror', orientation: '\\' }),
  drop(id, cell, returned) {
    let changed = false;
    if (cell) {
      const fromReserve = ['supply', 'prism-supply'].includes(id);
      changed = game.place(cell, fromReserve ? null : id, id === 'prism-supply' ? 'prism' : 'mirror');
      if (changed) selected = fromReserve ? game.pieces.at(-1).id : id;
    } else if (returned && !['supply', 'prism-supply'].includes(id)) {
      changed = game.remove(id);
      if (changed) selected = null;
    }
    if (changed) moving = false;
    render();
  },
});
byId('move').addEventListener('click', () => { moving = !moving; render(); });
byId('remove').addEventListener('click', () => { if (game.remove(selected)) { selected = null; moving = false; render(); } });
byId('restart').addEventListener('click', () => { input.cancel(); game.reset(); selected = null; moving = false; render(); });
byId('next').addEventListener('click', () => { start((index + 1) % levels.length); board.querySelector('button').focus({ preventScroll: true }); });
picker.addEventListener('change', () => start(Number(picker.value)));
