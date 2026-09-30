// Level 0 is dormant: no Wasm fetch, graph or timers until discovery.
const root = document.querySelector('.ripple-home');
const spark = root?.querySelector('.ripple-spark');
const panel = root?.querySelector('.ripple-discovery');
const clue = root?.querySelector('[data-ripple-clue]');
const enter = root?.querySelector('[data-ripple-enter]');
const reset = root?.querySelector('[data-ripple-reset]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const NS = 'http://www.w3.org/2000/svg';
let engine, playback, player, snapshot, layer, buttons = [], lines = [], discovered = false, busy = false, observer, visibilityObserver, visible = true;
const edges = [[0,1],[1,2],[2,5],[0,3],[3,4],[4,5]];
function position() {
  if (!layer) return;
  const box = root.getBoundingClientRect();
  const about = root.querySelector('#about-me').closest('section').getBoundingClientRect();
  const title = root.querySelector('#things-i-m-building').getBoundingClientRect();
  const cards = root.querySelector('.project-grid').getBoundingClientRect();
  const w = box.width;
  const points = [[w/2,about.bottom-box.top+8], [w-8,title.bottom-box.top+6], [w-8,cards.bottom-box.top+8],
    [8,title.bottom-box.top+6], [8,cards.bottom-box.top+8], [w/2,cards.bottom-box.top+24]];
  layer.setAttribute('width',w); layer.setAttribute('height',box.height);
  buttons.forEach((b,i) => { b.style.left=`${points[i][0]}px`; b.style.top=`${points[i][1]}px`; });
  lines.forEach((line,i) => { const [a,b] = edges[i]; ['x1','y1','x2','y2'].forEach((key,j) => line.setAttribute(key,[...points[a],...points[b]][j])); });
}
function draw() {
  snapshot = engine.snapshot();
  buttons.forEach((b,i) => {
    b.dataset.active='false';
    b.querySelector('span').textContent = i===0 ? '·' : i===5 ? '◇' : String(snapshot.nodes[i].cost);
    b.setAttribute('aria-label',i===0 ? 'Search starts here' : i===5 ? 'Hidden destination' : `Change this node's entry cost from ${snapshot.nodes[i].cost} to ${snapshot.nodes[i].cost === 1 ? 9 : 1}`);
    b.disabled = [0,5].includes(i) || snapshot.used >= snapshot.budget;
  });
  lines.forEach(l => l.classList.remove('traced')); enter.hidden=true;
}
function run(change = false) {
  player?.dispose(); draw();
  if (change) clue.textContent='One cost changed. Watch the search start again.';
  player = playback(snapshot.events, e => {
    if ([1,7].includes(e.kind)) buttons[e.node].dataset.active='true';
    if (e.kind===7 && e.node!==e.parent) {
      const i=edges.findIndex(([a,b]) => (a===e.node && b===e.parent)||(b===e.node && a===e.parent));
      if (i>=0) lines[i].classList.add('traced');
    }
  }, () => {
    if (snapshot.solved) {
      clue.textContent='One change. A different path. You changed the algorithm. The lower-cost route won.';
      enter.hidden=false;
    } else clue.textContent = change ? 'The route changed, but missed ◇. Reset and try lowering a cost.'
      : 'Something is searching. Can one cost send it through the other side to ◇?';
    reset.hidden=false;
  }, { reduced: motion.matches, delay: 90 });
  player.play();
}
spark?.addEventListener('click', async () => {
  if (busy || discovered) return;
  busy=true; panel.hidden=false; clue.textContent='Something is searching.';
  try {
    const module = await import('./engine.js');
    engine=await module.loadEngine(true); playback=module.playback; discovered=true;
    layer=document.createElementNS(NS,'svg'); layer.classList.add('ripple-layer'); layer.setAttribute('aria-hidden','true');
    lines=edges.map(() => { const line=document.createElementNS(NS,'line'); layer.append(line); return line; }); root.append(layer);
    buttons=engine.snapshot().nodes.map((_,i) => {
      const b=document.createElement('button'); b.type='button'; b.className='ripple-home-node';
      const dot=document.createElement('span'); b.append(dot); root.append(b);
      b.addEventListener('click', () => { if (engine.change(i)) run(true); }); return b;
    });
    observer=new ResizeObserver(position); observer.observe(root); position();
    visibilityObserver=new IntersectionObserver(entries => {
      visible=entries[0].isIntersecting;
      if (!visible) player?.pause(); else if (!document.hidden) player?.play();
    }); visibilityObserver.observe(root);
    spark.hidden=true; reset.hidden=false; run(); buttons[3].focus({preventScroll:true});
  } catch { clue.textContent='The hidden experiment could not load. Tap the dot to retry.'; }
  finally { busy=false; }
});
reset?.addEventListener('click', () => {
  player?.dispose(); engine?.reset(); observer?.disconnect(); visibilityObserver?.disconnect(); layer?.remove(); layer=null;
  buttons.forEach(b => b.remove()); buttons=[]; lines=[]; discovered=false;
  panel.hidden=true; spark.hidden=false; spark.focus({preventScroll:true});
});
document.addEventListener('visibilitychange', () => { if (document.hidden) player?.pause(); else if (visible) player?.play(); });
motion.addEventListener('change', () => { if (discovered) run(); });
addEventListener('pagehide', () => { player?.dispose(); observer?.disconnect(); visibilityObserver?.disconnect(); });
