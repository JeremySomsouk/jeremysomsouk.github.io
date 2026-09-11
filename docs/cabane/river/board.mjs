const tileNames = {
  0: 'ground',
  1: 'spring',
  2: 'rock',
  3: 'channel horizontal',
  4: 'channel vertical',
  5: 'plant',
};

const tileLabels = {
  0: 'Terrain',
  1: 'Source',
  2: 'Roche',
  3: 'Canal horizontal',
  4: 'Canal vertical',
};

const isChannel = tile => tile === 3 || tile === 4;

function cellClasses(game, row, col, tile) {
  const classes = ['cell', tileNames[tile] ?? 'unknown'];
  if (game.isWet(row, col)) classes.push('wet');
  if (game.isWatered(row, col)) classes.push('watered');
  return classes.join(' ');
}

function cellLabel(game, row, col, tile) {
  if (tile === 5) return game.isWatered(row, col) ? 'Plante arrosée' : 'Plante assoiffée';
  const label = tileLabels[tile] ?? 'Case inconnue';
  return game.isWet(row, col) ? `${label}, eau` : label;
}

export function createBoard(board, game, onTap, document = globalThis.document) {
  const cells = [];
  board.replaceChildren();
  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.addEventListener('click', () => onTap(row, col));
      board.append(cell);
      cells.push(cell);
    }
  }

  const render = () => {
    board.style.setProperty('--cols', String(game.cols));
    for (let row = 0; row < game.rows; row += 1) {
      for (let col = 0; col < game.cols; col += 1) {
        const cell = cells[row * game.cols + col];
        const tile = game.tile(row, col);
        cell.className = cellClasses(game, row, col, tile);
        cell.disabled = game.isSolved || !isChannel(tile);
        cell.setAttribute('aria-label', cellLabel(game, row, col, tile));
      }
    }
  };

  return render;
}
