import { cellKey } from './engine.mjs';
import { ghostArt, lampArt, pieceArt, wallArt } from './art.mjs';

export function createBoard(board, rays, level) {
  const cells = new Map();
  const scenery = new Map([
    ...level.lights.map(item => [cellKey(item), { type: 'lamp', ...item }]),
    ...level.ghosts.map(item => [cellKey(item), { type: 'ghost', ...item }]),
    ...level.walls.map(item => [cellKey(item), { type: 'wall', ...item }]),
  ]);
  board.replaceChildren();
  board.style.setProperty('--cols', level.width);
  board.style.setProperty('--rows', level.height);
  board.setAttribute('aria-label', `Maison de ${level.height} lignes et ${level.width} colonnes`);
  rays.setAttribute('viewBox', `0 0 ${level.width * 100} ${level.height * 100}`);
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const button = document.createElement('button');
      button.className = 'light-cell';
      button.dataset.x = x;
      button.dataset.y = y;
      board.append(button);
      cells.set(cellKey({ x, y }), button);
    }
  }
  return (game, selection, moving) => {
    const result = game.result;
    const lit = new Set(result.illuminatedGhosts);
    const mirrors = new Map(game.pieces.map(item => [cellKey(item), item]));
    for (const [key, button] of cells) {
      const item = scenery.get(key);
      const mirror = mirrors.get(key);
      const illuminated = item?.type === 'ghost' && lit.has(item.id);
      const selected = mirror?.id === selection;
      const hinted = level.hint && cellKey(level.hint) === key && game.pieces.length === 0;
      button.className = `light-cell${illuminated ? ' illuminated' : ''}${selected ? ' selected' : ''}${hinted ? ' hinted' : ''}`;
      let art = '';
      let label = 'Case libre';
      if (item?.type === 'lamp') { art = lampArt(item.direction); label = `Lampe vers ${{ N: 'le haut', E: 'la droite', S: 'le bas', W: 'la gauche' }[item.direction]}`; }
      if (item?.type === 'wall') { art = wallArt; label = 'Mur, bloque la lumière'; }
      if (item?.type === 'ghost') { art = ghostArt(illuminated); label = illuminated ? 'Fantôme éveillé, éclairé' : 'Fantôme endormi, à éclairer'; }
      if (mirror) { art = pieceArt(mirror); label = `${mirror.type === 'prism' ? 'Prisme, sépare le rayon en deux,' : 'Miroir'} ${mirror.orientation === '/' ? 'oblique /' : 'oblique inverse'}, toucher pour tourner`; }
      if (hinted) art = '<span class="hint-mark" aria-hidden="true">＋</span>';
      // Preserve nodes during selection-only updates so light/ghost animations do not restart.
      if (button.dataset.art !== art) { button.innerHTML = art; button.dataset.art = art; }
      button.dataset.piece = mirror?.id ?? '';
      button.setAttribute('aria-label', `Ligne ${Number(button.dataset.y) + 1}, colonne ${Number(button.dataset.x) + 1} : ${label}`);
      button.setAttribute('aria-pressed', String(Boolean(selected)));
      button.setAttribute('aria-disabled', String(Boolean(item) || result.isSolved));
      button.classList.toggle('destination', Boolean(moving || selection === 'supply' || selection === 'prism-supply') && game.canPlace({ x: Number(button.dataset.x), y: Number(button.dataset.y) }, moving ? selection : null));
    }
    const signature = JSON.stringify(result.lightPaths);
    if (rays.dataset.paths !== signature) {
      rays.dataset.paths = signature;
      rays.innerHTML = result.lightPaths.map(path => {
        const points = path.points.map(point => `${(point.x + .5) * 100},${(point.y + .5) * 100}`).join(' ');
        return `<polyline class="ray-glow" points="${points}"/><polyline class="ray-core" pathLength="1" points="${points}"/>`;
      }).join('');
    }
    board.parentElement.classList.toggle('solved', result.isSolved);
    return result;
  };
}
