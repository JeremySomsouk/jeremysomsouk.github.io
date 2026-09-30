import { ABSENT, loadEngine, playback } from './engine.js';
const root = document.querySelector('.ripple-game');
const $ = id => root.querySelector(`#ripple-${id}`);
const cells = [...root.querySelectorAll('[data-node]')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let engine, snapshot, baseline, player, block = false, completed = false;
let original = false, lastChange = null, explored = 0, resume = false, selected = null;
const baselines = new Map();
const pathCost = value => value === ABSENT ? 'unreachable' : String(value);
const label = (node, i) => i === snapshot.start ? 'S' : i === snapshot.target ? 'T'
  : `${i === snapshot.checkpoint ? '◇ ' : ''}${node.cost === ABSENT ? '×' : node.cost}`;
function cellLabel(i) {
  const node = snapshot.nodes[i];
  const identity = i === snapshot.start ? 'start, ' : i === snapshot.target ? 'target, ' : i === snapshot.checkpoint ? 'required waypoint, ' : '';
  const action = node.editable && i !== snapshot.start && i !== snapshot.target ? `; ${block ? 'toggle obstacle' : 'change cost'}` : '';
  return `Row ${node.y + 1}, column ${node.x + 1}, ${identity}${node.cost === ABSENT ? 'blocked' : `entry cost ${node.cost}`}${action}`;
}
function draw() {
  cells.forEach((cell, i) => {
    const node = snapshot.nodes[i];
    const editable = node.editable && i !== snapshot.start && i !== snapshot.target;
    cell.disabled = !editable;
    cell.textContent = label(node, i);
    cell.dataset.mark = '';
    cell.classList.toggle('changed', node.cost !== baseline.nodes[i].cost);
    cell.classList.remove('original', 'ripple-point');
    cell.setAttribute('aria-label', cellLabel(i));
  });
  if (lastChange !== null) cells[lastChange].classList.add('ripple-point');
  $('budget').textContent = `${snapshot.budget - snapshot.used} changes left`;
  $('undo').disabled = snapshot.used === 0;
  $('explored').textContent = '0'; $('cost').textContent = '—';
  $('feedback').hidden = true;
  $('compare').setAttribute('aria-pressed', 'false');
  $('compare').textContent = 'Show original path';
  original = false; explored = 0;
}
function feedback() {
  if (!snapshot.used) return;
  $('feedback').hidden = false;
  const changed = snapshot.nodes.map((n, i) => n.cost !== baseline.nodes[i].cost ? i : null).filter(i => i !== null);
  const beforeVisits = baseline.events.filter(e => e.kind === 3).map(e => e.node);
  const afterVisits = snapshot.events.filter(e => e.kind === 3).map(e => e.node);
  const dropped = beforeVisits.filter(i => !afterVisits.includes(i)).length;
  const added = afterVisits.filter(i => !beforeVisits.includes(i)).length;
  const beforeOrder = baseline.events.filter(e => e.kind === 1).map(e => e.node);
  const afterOrder = snapshot.events.filter(e => e.kind === 1).map(e => e.node);
  const divergence = afterOrder.findIndex((node, i) => node !== beforeOrder[i]);
  const describe = i => `row ${snapshot.nodes[i].y + 1}, column ${snapshot.nodes[i].x + 1}`;
  const changes = changed.map(i => `${describe(i)}: ${pathCost(baseline.nodes[i].cost)} → ${pathCost(snapshot.nodes[i].cost)}`).join('; ');
  let reason = snapshot.solved ? 'You changed the algorithm. The lower route now wins.'
    : snapshot.cost === ABSENT ? 'Both routes are cut off. Undo a change to let the search continue.'
    : snapshot.path.join(',') === baseline.path.join(',') ? 'The chosen path stayed the same. This change did not make the lower route cheaper.'
    : 'The search chose a different route after your change.';
  $('reason').textContent = `${reason} ${changes}.`;
  $('before-after').textContent = `Cost ${pathCost(baseline.cost)} → ${pathCost(snapshot.cost)} · explored ${baseline.explored} → ${snapshot.explored}. ${dropped} previously explored cells skipped; ${added} newly explored.${divergence >= 0 ? ` First different selection: ${describe(afterOrder[divergence])} (decision ${divergence + 1}).` : ''}`;
  if (divergence >= 0) cells[afterOrder[divergence]].classList.add('ripple-point');
}
function begin(auto = true) {
  player?.dispose();
  snapshot = engine.snapshot(); baseline = baselines.get($('algorithm').value);
  completed = false; draw();
  $('status').textContent = snapshot.used ? 'Your change invalidated the old search. Recomputing from S…' : 'Watch the search, then change a cell.';
  player = playback(snapshot.events, event => {
    const cell = cells[event.node];
    if (!cell) return;
    if (event.kind === 1) {
      root.querySelector('[data-mark="current"]')?.setAttribute('data-mark', 'visited');
      cell.dataset.mark = 'current'; selected = event;
    }
    if (event.kind === 2 && !['visited','current'].includes(cell.dataset.mark)) cell.dataset.mark = 'frontier';
    if (event.kind === 3) { explored++; $('explored').textContent = String(explored); cell.dataset.mark = 'visited'; }
    if (event.kind === 7) cell.dataset.mark = 'path';
    cell.setAttribute('aria-label', `${cellLabel(event.node)}${cell.dataset.mark ? `, ${cell.dataset.mark}` : ''}`);
  }, () => {
    completed = true;
    $('play').textContent = 'Play';
    $('cost').textContent = pathCost(snapshot.cost);
    $('status').textContent = snapshot.solved ? 'One change. A different path. Objective reached.'
      : snapshot.cost === ABSENT ? 'No route reaches T. Try undoing a change.'
      : 'Search complete. Can you make it pass through ◇?';
    feedback();
  }, { reduced: motion.matches });
  if (auto && !document.hidden) { player.play(); $('play').textContent = completed ? 'Play' : 'Pause'; }
  else $('play').textContent = 'Play';
}
try {
  engine = await loadEngine();
  baselines.set('0', engine.snapshot()); engine.algorithm(1); baselines.set('1',engine.snapshot()); engine.algorithm(0);
  root.querySelectorAll('.ripple-controls button, select').forEach(el => { el.disabled = false; });
  cells.forEach((cell, i) => cell.addEventListener('click', () => {
    if (!engine.change(i, block)) { $('status').textContent = 'No changes left. Undo or reset to try another idea.'; return; }
    lastChange = i; begin();
  }));
  for (const mode of ['weight','block']) $(mode).addEventListener('click', () => {
    block = mode === 'block'; $('block').setAttribute('aria-pressed',String(block)); $('weight').setAttribute('aria-pressed',String(!block));
    // Update action labels without disturbing playback or its state.
    cells.forEach((cell,i) => { if (!cell.disabled) cell.setAttribute('aria-label', `${cellLabel(i)}${cell.dataset.mark ? `, ${cell.dataset.mark}` : ''}`); });
  });
  $('undo').addEventListener('click', () => { engine.undo(); lastChange = null; begin(); });
  $('reset').addEventListener('click', () => { engine.reset(); lastChange = null; begin(); });
  $('replay').addEventListener('click', () => begin());
  $('play').addEventListener('click', () => {
    if (completed) begin(); else if (player.running) { player.pause(); $('play').textContent='Play'; }
    else { player.play(); $('play').textContent=completed ? 'Play' : 'Pause'; }
  });
  $('step').addEventListener('click', () => { player.pause(); $('play').textContent='Play'; if (completed) begin(false); player.step(); if (!completed && selected) $('status').textContent = `Selected row ${snapshot.nodes[selected.node].y + 1}, column ${snapshot.nodes[selected.node].x + 1}; known cost ${selected.cost}.`; });
  $('algorithm').addEventListener('change', () => {
    engine.algorithm($('algorithm').value);
    $('algorithm-note').textContent = $('algorithm').value === '0' ? 'Dijkstra expands the cheapest known cost first.' : 'A* adds Manhattan distance to the known cost. The estimate guides exploration; the path still has minimum cost.';
    begin();
  });
  $('compare').addEventListener('click', () => {
    original = !original; $('compare').setAttribute('aria-pressed',String(original));
    $('compare').textContent = original ? 'Hide original path' : 'Show original path';
    cells.forEach((cell,i) => cell.classList.toggle('original', original && baseline.path.includes(i)));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resume = player.running; player.pause(); $('play').textContent = 'Play'; }
    else if (resume) { player.play(); $('play').textContent = completed ? 'Play' : 'Pause'; resume=false; }
  });
  motion.addEventListener('change', () => begin(false));
  addEventListener('pagehide', () => player?.dispose());
  begin();
} catch {
  $('status').textContent = 'The experiment could not load. Reload to try again, or return to Projects.';
}
