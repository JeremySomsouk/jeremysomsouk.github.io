import { RiverGame, WIDTH, HEIGHT } from './engine.mjs';
import { createBoard } from './board.mjs';
import { attachInput } from './input.mjs';
import { levels } from './levels.mjs';

export function createRiverApp({ document, celebrate, window = globalThis.window }) {
  const byId = id => document.getElementById(id);
  const canvas = byId('board'), picker = byId('level'), completion = byId('completion');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let game, board, input, index, celebrated = false, frame = null, last = 0, previousCount = -1;
  const abort = new AbortController(), options = { signal: abort.signal };
  const url = new URL(window.location.href);
  const requested = levels.findIndex(level => level.id === url.searchParams.get('level'));
  levels.forEach((level, i) => {
    const option = document.createElement('option'); option.value = i;
    option.textContent = `${i + 1} / ${levels.length} · ${level.title}`; picker.append(option);
  });
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.getBoundingClientRect().width;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(width * HEIGHT / WIDTH * ratio);
    board?.render();
  }
  function reflect() {
    const count = game.fills.filter(fill => fill >= .97).length;
    if (count !== previousCount) {
      byId('progress').textContent = `${count} / ${game.fills.length} ${game.fills.length > 1 ? 'mares fleuries' : 'mare fleurie'}`;
      previousCount = count;
    }
    if (game.solved && !celebrated) {
      celebrated = true;
      completion.hidden = false;
      byId('result-title').textContent = index === levels.length - 1 ? 'Tout le jardin s’éveille !' : 'La rivière reprend vie !';
      byId('next').textContent = index === levels.length - 1 ? 'Rejouer les rivières ↻' : 'Rivière suivante →';
      byId('instructions').textContent = 'Les fleurs te disent merci.';
      input.cancel();
      celebrate(canvas, { variant: 'fireflies' });
    }
  }
  function tick(now) {
    frame = null;
    if (document.hidden) { last = 0; return; }
    // 30fps is ample for gentle water; cap elapsed time on resume.
    if (!last || now - last >= 1000 / 30) {
      game.update(last ? Math.min(.05, (now - last) / 1000) : 0);
      last = now;
      board.render(); reflect();
    }
    frame = window.requestAnimationFrame(tick);
  }
  function pause() { if (frame !== null) window.cancelAnimationFrame(frame); frame = null; last = 0; input?.cancel(); }
  function resume() { if (frame === null && !document.hidden) frame = window.requestAnimationFrame(tick); }
  function start(nextIndex) {
    pause(); input?.destroy();
    index = nextIndex; celebrated = false; previousCount = -1;
    game = new RiverGame(levels[index]);
    board = createBoard(canvas, game, { reducedMotion: media.matches });
    picker.value = String(index); completion.hidden = true;
    byId('instructions').textContent = levels[index].hint;
    canvas.setAttribute('aria-label', `${levels[index].title}. Gratte la terre pour arroser ${game.fills.length} ${game.fills.length > 1 ? 'mares' : 'mare'}.`);
    input = attachInput(canvas, {
      keyboardStart: levels[index].source,
      scratch(from, to) { const count = game.scratch(from, to); board.scratch(to, count); },
      cursor(point) { board.cursor(point); },
    });
    url.searchParams.set('level', levels[index].id);
    window.history.replaceState(null, '', url);
    resize(); reflect(); resume();
  }
  picker.addEventListener('change', () => start(Number(picker.value)), options);
  byId('restart').addEventListener('click', () => start(index), options);
  byId('next').addEventListener('click', () => { start((index + 1) % levels.length); canvas.focus({ preventScroll: true }); }, options);
  window.addEventListener('resize', resize, options);
  window.addEventListener('pagehide', pause, options);
  window.addEventListener('pageshow', resume, options);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume(), options);
  media.addEventListener('change', () => {
    board = createBoard(canvas, game, { reducedMotion: media.matches }); board.render();
  }, options);
  start(requested < 0 ? 0 : requested);
  return { get game() { return game; }, restart() { start(index); }, destroy() { pause(); input.destroy(); abort.abort(); } };
}
