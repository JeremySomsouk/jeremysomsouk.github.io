// The browser copies Rust execution records. It never implements pathfinding.
export const ABSENT = 0xffffffff;
export async function loadEngine(home = false, seed = 0x7f93a2) {
  const response = await fetch('/ripple/engine.wasm');
  if (!response.ok) throw new Error('Engine unavailable');
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
  const engine = instance.exports;
  engine.init(Number(home), seed);
  return {
    change: (node, block = false) => Boolean(engine.change(node, Number(block))),
    undo: () => Boolean(engine.undo()), reset: () => engine.reset(),
    algorithm: value => engine.algorithm(Number(value)),
    snapshot() {
      const info = Array.from({ length: 10 }, (_, i) => (engine.info(i) >>> 0));
      const nodes = Array.from({ length: info[0] }, (_, i) => ({ cost: (engine.node(i, 0) >>> 0), x: engine.node(i, 1), y: engine.node(i, 2), editable: Boolean(engine.node(i, 3)) }));
      const events = Array.from({ length: info[9] }, (_, i) => ({ kind: engine.event(i, 0), node: engine.event(i, 1), cost: (engine.event(i, 2) >>> 0), parent: engine.event(i, 3) }));
      return { nodes, events, start: info[1], target: info[2], checkpoint: info[3], budget: info[4], used: info[5], cost: info[6], explored: info[7], solved: Boolean(info[8]), path: events.filter(e => e.kind === 7).map(e => e.node) };
    }
  };
}

// One cancellable timeout at most. Hidden documents pause; reduced motion can
// finish instantly. Step always advances to one visible algorithm decision.
export function playback(events, apply, finish, { reduced = false, delay = 65 } = {}) {
  let cursor = 0, timer = null, running = false, disposed = false;
  const stop = () => { clearTimeout(timer); timer = null; running = false; };
  const step = () => {
    if (disposed || cursor >= events.length) return false;
    let event;
    do { event = events[cursor++]; apply(event, cursor); }
    while (cursor < events.length && ![1, 7, 8].includes(event.kind));
    if (cursor === events.length) { stop(); finish(); }
    return true;
  };
  const tick = () => { if (!running || disposed) return; step(); if (running) timer = setTimeout(tick, delay); };
  return {
    step, pause: stop,
    play() {
      if (disposed || running || cursor === events.length) return;
      running = true;
      if (reduced) { while (cursor < events.length && !disposed) step(); }
      else tick();
    },
    get running() { return running; }, get complete() { return cursor === events.length; },
    dispose() { disposed = true; stop(); }
  };
}
