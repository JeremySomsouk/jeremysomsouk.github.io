// Progressive enhancement: the complete project list remains usable without JavaScript.
const root = document.querySelector('[data-project-explorer]');
if (root) {
  const map = root.querySelector('.project-map');
  const panel = root.querySelector('.project-grid');
  const cards = [...panel.querySelectorAll('[data-project]')];
  const hint = root.querySelector('.project-map-hint');
  const status = root.querySelector('[data-project-status]');
  const positions = {
    bientot: [23, 16], cabane: [68, 14], tessera: [43, 40],
    guessr: [80, 39], prctrl: [17, 62], melimo: [73, 64],
    ripple: [30, 86], nuance: [69, 87],
  };
  const connections = [
    ['bientot', 'cabane'], ['bientot', 'tessera'], ['cabane', 'guessr'],
    ['tessera', 'prctrl'], ['tessera', 'melimo'], ['tessera', 'ripple'],
    ['guessr', 'melimo'], ['ripple', 'nuance'], ['melimo', 'nuance'],
  ];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  for (const [from, to] of connections) {
    if (!cards.some(card => card.dataset.project === from) || !cards.some(card => card.dataset.project === to)) continue;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    const [x1, y1] = positions[from];
    const [x2, y2] = positions[to];
    for (const [name, value] of Object.entries({ x1, y1, x2, y2 })) line.setAttribute(name, value);
    line.dataset.from = from;
    line.dataset.to = to;
    svg.append(line);
  }
  map.append(svg);
  const nodes = [];
  function select(card) {
    for (const item of cards) item.hidden = item !== card;
    for (const node of nodes) node.setAttribute('aria-pressed', String(node.dataset.project === card?.dataset.project));
    for (const line of svg.children) line.classList.toggle('is-active', !!card && [line.dataset.from, line.dataset.to].includes(card.dataset.project));
    hint.hidden = !!card;
    status.textContent = card ? card.querySelector('h3').textContent : `${cards.length} projects · Hover or tap to explore`;
  }
  cards.forEach((card, index) => {
    const slug = card.dataset.project;
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'project-map-node';
    node.dataset.project = slug;
    node.textContent = card.querySelector('h3').textContent;
    node.setAttribute('aria-controls', panel.id);
    node.setAttribute('aria-pressed', 'false');
    const [x, y] = positions[slug] ?? [25 + (index % 2) * 50, 15 + Math.floor(index / 2) * 23];
    node.style.setProperty('--x', `${x}%`);
    node.style.setProperty('--y', `${y}%`);
    node.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') select(card);
    });
    node.addEventListener('focus', () => select(card));
    node.addEventListener('click', () => select(card));
    nodes.push(node);
    map.append(node);
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const active = nodes.find(node => node.getAttribute('aria-pressed') === 'true');
    // Return focus before clearing, so its focus handler cannot reopen the preview.
    active?.focus();
    select(null);
  });
  // Keep the preview in place while moving to its links; no hover-only actions.
  root.classList.add('is-enhanced');
  map.hidden = false;
  panel.removeAttribute('tabindex');
  select(null);
}
