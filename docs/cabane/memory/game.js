const shapes = [
  ['Soleil', '<g fill="#e8aa30"><circle cx="50" cy="50" r="23"/><path d="M46 2h8v16h-8zM46 82h8v16h-8zM2 46h16v8H2zM82 46h16v8H82z"/><path d="m14 20 6-6 12 12-6 6zm54 54 6-6 12 12-6 6zm0-48 12-12 6 6-12 12zm-54 54 12-12 6 6-12 12z"/></g>'],
  ['Fleur', '<g fill="#cc7190"><circle cx="50" cy="24" r="20"/><circle cx="75" cy="43" r="20"/><circle cx="65" cy="73" r="20"/><circle cx="35" cy="73" r="20"/><circle cx="25" cy="43" r="20"/></g><circle cx="50" cy="48" r="16" fill="#f4cf63"/>'],
  ['Poisson', '<path d="M62 50 94 23v54z" fill="#dc8051"/><ellipse cx="41" cy="50" rx="34" ry="26" fill="#eaa15b"/><circle cx="25" cy="44" r="5" fill="#243e3a"/>'],
  ['Étoile', '<path d="m50 4 14 29 32 5-23 23 5 33-28-16-28 16 5-33L4 38l32-5z" fill="#cc9d37"/>'],
  ['Feuille', '<path d="M15 85C-5 20 55 9 89 11c2 48-17 83-74 74" fill="#5f956b"/><path d="m18 83 50-48m-30 28-4-21m20 6 21-1" fill="none" stroke="#d8e6b9" stroke-width="5" stroke-linecap="round"/>'],
  ['Lune', '<path d="M72 8A43 43 0 1 0 91 72 38 38 0 0 1 72 8" fill="#8583b6"/>'],
  ['Cœur', '<path d="M50 87C-16 47 7 2 36 16q9 4 14 15 5-11 14-15c29-14 52 31-14 71" fill="#cc655d"/>'],
  ['Nuage', '<path d="M23 78a21 21 0 0 1-5-41 26 26 0 0 1 50-7 24 24 0 1 1 9 48z" fill="#74a6bd"/>'],
];

const board = document.querySelector('#board');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const next = document.querySelector('#next');
const restart = document.querySelector('#restart');
let engine;
let round = 0;
let timer;

function startRound(focusBoard = false) {
  clearTimeout(timer);
  const pairs = round + 3;
  engine.start(pairs, crypto.getRandomValues(new Uint32Array(1))[0]);
  result.hidden = true;
  board.dataset.pairs = pairs;
  board.replaceChildren();
  for (let i = 0; i < pairs * 2; i++) {
    const button = document.createElement('button');
    button.className = 'card';
    button.type = 'button';
    button.addEventListener('click', () => reveal(i));
    board.append(button);
  }
  document.querySelectorAll('.progress li').forEach((step, index) => {
    step.classList.toggle('done', index < round);
    if (index === round) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  status.textContent = 'À toi de trouver les paires !';
  render();
  if (focusBoard) board.firstElementChild.focus();
}

function render() {
  let found = 0;
  [...board.children].forEach((button, index) => {
    const symbol = engine.card(index);
    const matched = Boolean(engine.is_matched(index));
    found += Number(matched);
    button.classList.toggle('revealed', symbol !== 0);
    button.classList.toggle('matched', matched);
    button.disabled = matched;
    if (symbol) {
      const [name, drawing] = shapes[symbol - 1];
      button.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${drawing}</svg>`;
      button.setAttribute('aria-label', `Carte ${index + 1} : ${name}${matched ? ', paire trouvée' : ''}`);
    } else {
      button.textContent = '?';
      button.setAttribute('aria-label', `Carte ${index + 1}, face cachée`);
    }
  });
  document.querySelector('#counter').textContent = `${found / 2} / ${round + 3} paires trouvées`;
}

function reveal(index) {
  const outcome = engine.flip(index);
  if (!outcome) return;
  render();
  if (outcome === 1) status.textContent = 'Et sa jumelle ?';
  if (outcome === 2) {
    status.textContent = 'Essaie encore, tu vas les retrouver.';
    timer = setTimeout(() => {
      engine.hide_mismatch();
      render();
      status.textContent = 'Choisis deux autres cartes.';
    }, 1100);
  }
  if (outcome === 3) {
    status.textContent = 'Une paire retrouvée !';
    board.querySelector('button:not(:disabled)').focus({ preventScroll: true });
  }
  if (outcome === 4) {
    const finished = round === 2;
    status.textContent = 'Toutes les paires sont réunies !';
    document.querySelector('#result-title').textContent = finished ? 'Bravo, tu as tout retrouvé !' : 'Bien joué !';
    document.querySelector('#result-text').textContent = finished ? 'Une nouvelle partie ? Les cartes seront mélangées.' : `On continue avec ${round + 4} paires ?`;
    next.textContent = finished ? 'Rejouer ↻' : 'Grille suivante →';
    result.hidden = false;
    next.focus({ preventScroll: true });
    result.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}

restart.addEventListener('click', () => { round = 0; startRound(true); });
next.addEventListener('click', () => { round = (round + 1) % 3; startRound(true); });

try {
  const response = await fetch('./game.wasm');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer());
  engine = instance.exports;
  startRound();
  restart.disabled = false;
} catch (error) {
  status.textContent = 'Le jeu n’a pas pu se charger. Recharge la page pour réessayer.';
  console.error('Failed to load Memory', error);
} finally {
  board.setAttribute('aria-busy', 'false');
}
