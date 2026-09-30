import { ABSENT, loadEngine, playback } from './engine.js';
import { canEdit, routeEnergy } from './lessons.js';
const root = document.querySelector('.ripple-game');
const $ = id => root.querySelector(`#ripple-${id}`);
const cells = [...root.querySelectorAll('[data-node]')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let engine, snapshot, baseline, player, block = false, completed = false;
let original = false, lastChange = null, explored = 0, resume = false, selected = null;
const baselines = new Map();
let lesson = 'energy';
const pathCost = value => value === ABSENT ? 'unreachable' : String(value);
const label = (node, i) => i === snapshot.start ? '●' : i === snapshot.target ? '◎'
  : `${i === snapshot.checkpoint ? '◇ ' : ''}${node.cost === ABSENT ? '×' : node.cost === 1 && i !== snapshot.checkpoint && !$('lab').open ? '·' : node.cost}`;
function routeTotals() {
  for (const [name, row] of [['upper', 1], ['lower', 3]]) {
    const energy = routeEnergy(snapshot, row);
    $(name).textContent = energy === null ? 'closed' : `${energy} energy`;
    $(name).parentElement.classList.toggle('chosen', snapshot.path.some(i => snapshot.nodes[i].y === row) && completed);
  }
}
function lessonCopy() {
  $('lesson').textContent = lesson === 'energy' ? '1 / 2 · Make a route tempting'
    : lesson === 'obstacle' ? '2 / 2 · Close a route' : 'Your experiment';
  $('instructions').textContent = lesson === 'energy' ? 'Tap a marked cell to make it easier or harder. Watch the spark choose again.'
    : lesson === 'obstacle' ? 'This time, keep the diamond expensive. Tap a dot on the upper route to close it.'
    : 'Change a cell’s energy or close it. See what the spark does with your new conditions.';
  $('tools').hidden = lesson !== 'free';
  $('free').textContent = lesson === 'free' ? 'Back to the first challenge' : 'Experiment freely';
  $('block').setAttribute('aria-pressed', String(block));
  $('weight').setAttribute('aria-pressed', String(!block));
}
function startLesson(next) {
  lesson = next; block = lesson === 'obstacle';
  engine.reset(); lastChange = null;
  $('nudge').hidden = true; lessonCopy(); begin();
}
function cellLabel(i) {
  const node = snapshot.nodes[i];
  const identity = i === snapshot.start ? 'spark starts here, ' : i === snapshot.target ? 'finish, ' : i === snapshot.checkpoint ? 'diamond: visit here, ' : '';
  const action = canEdit(snapshot, i, lesson, baseline) ? `; tap to ${block ? 'close or reopen this cell' : 'make this cell easier or harder'}` : '';
  return `Row ${node.y + 1}, column ${node.x + 1}, ${identity}${node.cost === ABSENT ? 'closed' : `${i === snapshot.start ? 0 : node.cost} energy`}${action}`;
}
function draw() {
  cells.forEach((cell, i) => {
    const node = snapshot.nodes[i];
    const editable = canEdit(snapshot, i, lesson, baseline);
    cell.disabled = !editable;
    cell.classList.toggle('intervention', editable && lesson !== 'free');
    cell.classList.toggle('diamond', i === snapshot.checkpoint);
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
  $('before-after').textContent = '';
  root.dataset.solved = 'false';
  $('hint').hidden = true; $('next').hidden = true;
  $('compare').disabled = !snapshot.used;
  routeTotals();
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
  const beforeLower = routeEnergy(baseline, 3), afterLower = routeEnergy(snapshot, 3);
  const upper = routeEnergy(snapshot, 1);
  let reason;
  if (snapshot.solved) {
    reason = upper === null ? `You closed the upper route. The spark found another way through the diamond, using ${snapshot.cost} energy.`
      : afterLower < beforeLower ? `You made the diamond route cheaper: ${beforeLower} → ${afterLower} energy. The spark changed its mind.`
      : `The upper route now needs ${upper} energy; the diamond route needs ${afterLower}. The spark chose the cheaper one.`;
  } else if (snapshot.cost === ABSENT) reason = 'Both routes are closed. Undo a change and let the spark try again.';
  else if (lesson === 'energy') reason = 'The upper route is still cheaper. Can you make the diamond route more tempting?';
  else if (lesson === 'obstacle') reason = 'The spark can still use the upper route. Try closing a cell along that route.';
  else reason = snapshot.path.join(',') === baseline.path.join(',') ? 'The spark kept its route. Your change did not make the other route cheaper.' : 'Your change sent the spark along a different route.';
  $('reason').textContent = reason;
  $('hint').hidden = snapshot.solved || lesson === 'free';
  $('next').hidden = !snapshot.solved || lesson === 'free';
  $('next').textContent = lesson === 'energy' ? 'Next: close a route →' : 'Now experiment freely →';
  $('before-after').textContent = `Changes: ${changes}. Energy ${pathCost(baseline.cost)} → ${pathCost(snapshot.cost)} · explored ${baseline.explored} → ${snapshot.explored}. ${dropped} previously explored cells skipped; ${added} newly explored.${divergence >= 0 ? ` First different selection: ${describe(afterOrder[divergence])} (decision ${divergence + 1}).` : ''}`;
  if (divergence >= 0) cells[afterOrder[divergence]].classList.add('ripple-point');
}
function begin(auto = true) {
  player?.dispose();
  snapshot = engine.snapshot(); baseline = baselines.get($('algorithm').value);
  completed = false; draw();
  $('status').textContent = snapshot.used ? 'You changed the conditions. The spark is choosing again…' : 'Watch which route the spark chooses.';
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
    $('status').textContent = snapshot.solved ? 'It visited the diamond. You changed its mind!'
      : snapshot.cost === ABSENT ? 'The spark is stuck. Undo a change to help it.'
      : 'The spark chose the upper route. Can you send it through the diamond?';
    root.dataset.solved = String(snapshot.solved); routeTotals();
    feedback();
  }, { reduced: motion.matches, delay: 100 });
  if (auto && !document.hidden) { player.play(); $('play').textContent = completed ? 'Play' : 'Pause'; }
  else $('play').textContent = 'Play';
}
try {
  engine = await loadEngine();
  baselines.set('0', engine.snapshot()); engine.algorithm(1); baselines.set('1',engine.snapshot()); engine.algorithm(0);
  root.querySelectorAll('button:not(.ripple-cell), select').forEach(el => { el.disabled = false; });
  cells.forEach((cell, i) => cell.addEventListener('click', () => {
    if (!canEdit(snapshot, i, lesson, baseline)) return;
    if (!engine.change(i, block)) { $('status').textContent = 'No changes left. Undo or reset to try another idea.'; return; }
    lastChange = i; begin();
  }));
  for (const mode of ['weight','block']) $(mode).addEventListener('click', () => {
    if (lesson !== 'free') return;
    block = mode === 'block'; $('block').setAttribute('aria-pressed',String(block)); $('weight').setAttribute('aria-pressed',String(!block));
    // Update action labels without disturbing playback or its state.
    cells.forEach((cell,i) => { if (!cell.disabled) cell.setAttribute('aria-label', `${cellLabel(i)}${cell.dataset.mark ? `, ${cell.dataset.mark}` : ''}`); });
  });
  $('undo').addEventListener('click', () => { engine.undo(); lastChange = null; begin(); });
  $('reset').addEventListener('click', () => startLesson(lesson));
  $('next').addEventListener('click', () => { startLesson(lesson === 'energy' ? 'obstacle' : 'free'); $('instructions').focus({preventScroll:true}); });
  $('free').addEventListener('click', () => startLesson(lesson === 'free' ? 'energy' : 'free'));
  $('hint').addEventListener('click', () => { $('nudge').textContent = lesson === 'energy' ? 'The diamond costs 9 energy. What if it cost only 1?' : 'Close a cell on the upper route. With that route unavailable, the spark will try the other one.'; $('nudge').hidden = false; });
  $('lab').addEventListener('toggle', () => { root.dataset.inspect = String($('lab').open); cells.forEach((cell,i) => { cell.textContent = label(snapshot.nodes[i],i); }); });
  $('replay').addEventListener('click', () => begin());
  $('play').addEventListener('click', () => {
    if (completed) begin(); else if (player.running) { player.pause(); $('play').textContent='Play'; }
    else { player.play(); $('play').textContent=completed ? 'Play' : 'Pause'; }
  });
  $('step').addEventListener('click', () => { player.pause(); $('play').textContent='Play'; if (completed) begin(false); player.step(); if (!completed && selected) $('status').textContent = `Selected row ${snapshot.nodes[selected.node].y + 1}, column ${snapshot.nodes[selected.node].x + 1}; known cost ${selected.cost}.`; });
  $('algorithm').addEventListener('change', () => {
    engine.algorithm($('algorithm').value);
    $('algorithm-note').textContent = $('algorithm').value === '0' ? 'Dijkstra tries the lowest energy total first.' : 'A* also estimates the distance to the finish. It checks fewer possibilities when that estimate helps, while still finding a cheapest route.';
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
  lessonCopy(); begin();
} catch {
  $('status').textContent = 'The experiment could not load. Reload to try again, or return to Projects.';
}
