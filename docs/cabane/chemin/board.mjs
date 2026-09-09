import { checkpointAt, isCellVisited, sameCell } from './domain.mjs';
const svgNS = 'http://www.w3.org/2000/svg';

export function createBoard(element, puzzle) {
  element.replaceChildren();
  element.style.setProperty('--cols', puzzle.cols);
  const cells = [];
  for (let row = 0; row < puzzle.rows; row++) {
    const rowElement = document.createElement('div');
    rowElement.className = 'path-row';
    rowElement.setAttribute('role', 'row');
    for (let col = 0; col < puzzle.cols; col++) {
      const position = { row, col };
      const cell = document.createElement('div');
      cell.className = 'path-cell';
      cell.setAttribute('role', 'gridcell');
      const value = checkpointAt(puzzle, position);
      cell.setAttribute('aria-label', `Ligne ${row + 1}, colonne ${col + 1}${value ? `, étape ${value}` : ''}`);
      if (value) {
        const badge = document.createElement('span');
        badge.className = 'checkpoint';
        badge.textContent = value;
        cell.append(badge);
      }
      rowElement.append(cell);
      cells.push({ cell, position });
    }
    element.append(rowElement);
  }
  const overlay = document.createElementNS(svgNS, 'svg');
  overlay.setAttribute('viewBox', `0 0 ${puzzle.cols * 100} ${puzzle.rows * 100}`);
  overlay.setAttribute('preserveAspectRatio', 'none');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.add('path-overlay');
  const line = document.createElementNS(svgNS, 'polyline');
  const endpoint = document.createElementNS(svgNS, 'circle');
  endpoint.setAttribute('r', '13');
  overlay.append(line, endpoint);
  element.append(overlay);
  return game => {
    for (const { cell, position } of cells) {
      cell.classList.toggle('visited', isCellVisited(game.path, position));
      cell.classList.toggle('endpoint', sameCell(game.path.at(-1), position));
    }
    line.setAttribute('points', game.path.map(cell => `${cell.col * 100 + 50},${cell.row * 100 + 50}`).join(' '));
    const last = game.path.at(-1);
    endpoint.style.display = last ? '' : 'none';
    if (last) {
      endpoint.setAttribute('cx', last.col * 100 + 50);
      endpoint.setAttribute('cy', last.row * 100 + 50);
    }
    element.classList.toggle('completed', game.status === 'completed');
  };
}
