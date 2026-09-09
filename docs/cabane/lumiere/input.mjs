export function cellFromPoint(x, y, rect, level) {
  if (x < rect.left || y < rect.top || x >= rect.right || y >= rect.bottom) return null;
  return { x: Math.floor((x - rect.left) / rect.width * level.width), y: Math.floor((y - rect.top) / rect.height * level.height) };
}
const contains = (rect, x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

// Capture on the stable play area, never on a rendered piece. Cancellation changes no game state.
export function attachInput({ area, board, supply, prismSupply, inventory, preview, getGame, tap, drop, describePiece }) {
  let gesture = null;
  const clear = () => {
    const previous = gesture;
    gesture = null;
    preview.hidden = true;
    board.querySelectorAll('.drop-target').forEach(cell => cell.classList.remove('drop-target'));
    inventory.classList.remove('drop-target');
    if (previous && area.hasPointerCapture(previous.id)) area.releasePointerCapture(previous.id);
  };
  area.addEventListener('pointerdown', event => {
    if (gesture || !event.isPrimary || event.button !== 0 || getGame().result.isSolved) return;
    const target = event.target.closest('.light-cell, #supply, #prism-supply');
    if (!target || (target === supply && getGame().remaining === 0) || (target === prismSupply && getGame().remainingPrisms === 0)) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
    gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, target,
      piece: target === supply ? 'supply' : target === prismSupply ? 'prism-supply' : target.dataset.piece || null, dragging: false };
    area.setPointerCapture(event.pointerId);
  });
  area.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 9) gesture.dragging = true;
    if (!gesture.dragging || !gesture.piece) return;
    preview.innerHTML = describePiece(gesture.piece);
    preview.hidden = false;
    preview.style.left = `${event.clientX}px`;
    preview.style.top = `${event.clientY}px`;
    const game = getGame();
    const cell = cellFromPoint(event.clientX, event.clientY, board.getBoundingClientRect(), game.level);
    board.querySelectorAll('.light-cell').forEach(button => button.classList.toggle('drop-target', Boolean(cell)
      && Number(button.dataset.x) === cell.x && Number(button.dataset.y) === cell.y
      && game.canPlace(cell, ['supply', 'prism-supply'].includes(gesture.piece) ? null : gesture.piece)));
    inventory.classList.toggle('drop-target', !['supply', 'prism-supply'].includes(gesture.piece) && contains(inventory.getBoundingClientRect(), event.clientX, event.clientY));
  });
  area.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const finished = gesture;
    // A fast release may arrive without a final pointermove.
    finished.dragging ||= Math.hypot(event.clientX - finished.startX, event.clientY - finished.startY) > 9;
    clear();
    if (finished.dragging) {
      if (!finished.piece) return;
      const cell = cellFromPoint(event.clientX, event.clientY, board.getBoundingClientRect(), getGame().level);
      const returned = contains(inventory.getBoundingClientRect(), event.clientX, event.clientY);
      drop(finished.piece, cell, returned);
    } else tap(finished.target);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    area.addEventListener(name, event => { if (event.pointerId === gesture?.id) clear(); });
  }
  // Native button activation supports keyboards and assistive technology without duplicating pointer taps.
  area.addEventListener('click', event => {
    if (event.detail !== 0 || gesture) return;
    const target = event.target.closest('.light-cell, #supply, #prism-supply');
    if (target) tap(target);
  });
  window.addEventListener('blur', clear);
  window.addEventListener('resize', clear);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') clear(); });
  return { cancel: clear };
}
