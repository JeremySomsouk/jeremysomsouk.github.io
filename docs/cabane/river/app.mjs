import { createBoard } from './board.mjs';
import { createRiverGame } from './state.mjs';

export function createRiverApp({ engine, document, celebrate }) {
  const byId = id => document.getElementById(id);
  const board = byId('board');
  const status = byId('status');
  const progress = byId('progress');
  const moves = byId('moves');
  const undoButton = byId('undo');
  const restartButton = byId('restart');
  const nextButton = byId('next');
  const completion = byId('completion');
  const resultText = byId('result-text');

  const game = createRiverGame(engine, {
    celebrate: origin => celebrate(origin),
  });
  let renderBoard = () => {};

  const render = () => {
    renderBoard();
    progress.textContent = game.progress;
    moves.textContent = `${game.moveCount} tour${game.moveCount > 1 ? 's' : ''}`;
    status.textContent = game.isSolved
      ? 'Bravo ! Toutes les plantes ont leur eau.'
      : 'Tourne un canal pour guider l’eau.';
    completion.hidden = !game.isSolved;
    resultText.textContent = game.isSolved
      ? 'L’eau a trouvé son chemin. Veux-tu découvrir une autre rivière ?'
      : '';
    undoButton.disabled = game.moveCount === 0;
    nextButton.disabled = !game.isSolved;
    restartButton.disabled = false;
    nextButton.textContent = game.levelIndex === engine.level_count() - 1
      ? 'Recommencer ↻'
      : 'Rivière suivante →';
    if (game.isSolved) {
      game.celebrate(completion);
      nextButton.focus();
    }
  };

  const load = level => {
    game.start(level);
    renderBoard = createBoard(board, game, tap, document);
    render();
  };

  function tap(row, col) {
    if (game.tap(row, col)) render();
  }

  const app = {
    game,
    render,
    tap,
    undo() {
      if (game.undo()) render();
    },
    restart() { load(game.levelIndex); },
    next() { load((game.levelIndex + 1) % engine.level_count()); },
  };

  undoButton.addEventListener('click', () => app.undo());
  restartButton.addEventListener('click', () => app.restart());
  nextButton.addEventListener('click', () => app.next());
  load(0);
  return app;
}
