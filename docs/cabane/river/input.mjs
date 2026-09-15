import { WIDTH, HEIGHT } from './engine.mjs';

export function landscapePoint(event, rect) {
  if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right
    || event.clientY < rect.top || event.clientY > rect.bottom) return null;
  return [(event.clientX - rect.left) / rect.width * WIDTH, (event.clientY - rect.top) / rect.height * HEIGHT];
}

export function attachInput(canvas, { scratch, cursor, keyboardStart = [210, 160] }) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let pointer = null, previous = null, rect;
  let keyboard = [...keyboardStart];
  const cancel = () => {
    const id = pointer;
    pointer = null;
    previous = null;
    cursor(null);
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  };
  const move = event => {
    const point = landscapePoint(event, rect);
    if (point) { scratch(previous ?? point, point); cursor(point); }
    else cursor(null);
    previous = point;
  };
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    rect = canvas.getBoundingClientRect();
    pointer = event.pointerId;
    previous = null;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(pointer);
    move(event);
  }, options);
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event]) move(sample);
  }, options);
  canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer) return;
    move(event);
    cancel();
  }, options);
  for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, event => {
    if (event.pointerId === pointer) cancel();
  }, options);
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || pointer !== null) return;
    const delta = { ArrowUp: [0, -12], ArrowDown: [0, 12], ArrowLeft: [-12, 0], ArrowRight: [12, 0] }[event.key];
    if (event.key === 'Escape') { cancel(); return; }
    if (!delta && event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    const next = delta ? [Math.max(0, Math.min(WIDTH, keyboard[0] + delta[0])), Math.max(0, Math.min(HEIGHT, keyboard[1] + delta[1]))] : keyboard;
    // Arrows move the tool; Shift + arrows digs continuously.
    if (event.shiftKey || !delta) scratch(keyboard, next);
    keyboard = next;
    cursor(keyboard);
  }, options);
  window.addEventListener('blur', cancel, options);
  window.addEventListener('resize', cancel, options);
  canvas.addEventListener('blur', cancel, options);
  return { cancel, destroy() { cancel(); abort.abort(); } };
}
