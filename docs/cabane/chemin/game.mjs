import { generatePuzzle } from './generator.mjs';
import { PathGame, formatTime } from './state.mjs';
import { createBoard } from './board.mjs';
import { attachInput } from './input.mjs';
import { celebrate } from '../celebration.mjs';

const board = document.querySelector('#path-board');
const timer = document.querySelector('#timer');
const status = document.querySelector('#status');
const coverage = document.querySelector('#coverage');
const completion = document.querySelector('#completion');
let game;
let renderBoard;
let interval;
let celebrated = false;
const newSeed = () => Array.from(crypto.getRandomValues(new Uint32Array(2)), value => value.toString(36)).join('-');
const renderTime = () => { timer.textContent = formatTime(game.timer.elapsed()); };
function render() {
  renderBoard(game);
  renderTime();
  coverage.textContent = `${game.path.length} / ${game.puzzle.rows * game.puzzle.cols} cases`;
  status.textContent = game.status === 'completed' ? 'Bravo ! Toutes les cases sont reliées.' : game.status === 'idle' ? 'Pars de 1.' : game.expectedCheckpoint <= game.puzzle.checkpoints.length ? `Prochaine étape : ${game.expectedCheckpoint}.` : 'Passe encore par toutes les cases.';
  completion.hidden = game.status !== 'completed';
  if (game.status === 'completed' && !celebrated) {
    celebrated = true;
    celebrate(completion);
  }
  if (!completion.hidden) document.querySelector('#result-time').textContent = `Puzzle terminé en ${formatTime(game.timer.elapsed())}.`;
  clearInterval(interval);
  if (game.status === 'playing') interval = setInterval(renderTime, 250);
}
function loadPuzzle(seed, puzzle = generatePuzzle({ seed })) {
  game = new PathGame(puzzle);
  celebrated = false;
  const url = new URL(location.href);
  url.searchParams.set('seed', seed);
  history.replaceState(null, '', url);
  renderBoard = createBoard(board, game.puzzle);
  render();
}
loadPuzzle(new URL(location.href).searchParams.get('seed') || newSeed());
const input = attachInput(board, () => game, render);
function restart() { input.cancel(); celebrated = false; game.restart(); render(); board.focus({ preventScroll: true }); }
document.querySelector('#restart').addEventListener('click', restart);
document.querySelector('#replay').addEventListener('click', restart);
document.querySelector('#new-puzzle').addEventListener('click', () => {
  input.cancel();
  let puzzle;
  do { puzzle = generatePuzzle({ seed: newSeed() }); }
  while (JSON.stringify(puzzle.checkpoints) === JSON.stringify(game.puzzle.checkpoints));
  loadPuzzle(puzzle.seed, puzzle);
  board.focus({ preventScroll: true });
});
window.addEventListener('pagehide', () => { input.cancel(); clearInterval(interval); });
window.addEventListener('pageshow', () => { render(); });
