import { ReadingTimer, formatDuration } from './timer.mjs';
import { scheduledTextId } from './schedule.mjs';
import { trackReadingViewport } from './viewport.mjs';
import { setupShare } from '../share.mjs?v=20260908-mobile-2';
import { celebrate } from '../celebration.mjs';

const choice = document.querySelector('#text-choice');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const status = document.querySelector('#reading-status');
const elapsed = document.querySelector('#elapsed');
const liveElapsed = document.querySelector('#live-elapsed');
let ticker;
const warning = document.querySelector('#storage-warning');
const historyList = document.querySelector('#history-list');
const storageKey = 'cabane.readings.v1';
const timer = new ReadingTimer();
let texts = [];
let readings = [];
const result = document.querySelector('#reading-result');
const controls = document.querySelector('#reading-controls');
trackReadingViewport(controls);
setupShare(() => {
  const text = texts.find(text => text.id === choice.value);
  const url = new URL(location.href);
  url.searchParams.set('text', text.id);
  return { title: `${text.title} · La Fluence · Cabane`, url: url.href };
});
let storageAvailable = true;

function showStorageWarning(message) {
  warning.textContent = message;
  warning.hidden = false;
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  if (!Array.isArray(saved) || !saved.every(item =>
    item && typeof item.textId === 'string' && typeof item.title === 'string'
    && typeof item.date === 'string' && Number.isFinite(Date.parse(item.date))
    && Number.isFinite(item.duration) && item.duration >= 0
  )) throw new Error('Invalid reading history');
  readings = saved;
} catch {
  storageAvailable = false;
  showStorageWarning('L’historique enregistré est inaccessible. Les nouveaux temps resteront visibles uniquement sur cette page.');
}

function renderHistory() {
  historyList.replaceChildren();
  document.querySelector('#empty-history').hidden = readings.length > 0;
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  for (const reading of [...readings].reverse()) {
    const item = document.createElement('li');
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = reading.title;
    const date = document.createElement('time');
    date.dateTime = reading.date;
    date.textContent = dateFormat.format(new Date(reading.date));
    const duration = document.createElement('span');
    duration.className = 'history-duration';
    duration.textContent = formatDuration(reading.duration);
    details.append(title, date);
    item.append(details, duration);
    historyList.append(item);
  }
}

function renderTimer() {
  const active = timer.state !== 'idle';
  choice.disabled = active;
  start.hidden = active;
  stop.hidden = !active;
}

function renderElapsed() {
  liveElapsed.textContent = formatDuration(timer.elapsed());
}

function selectText() {
  const text = texts.find(text => text.id === choice.value);
  clearInterval(ticker);
  timer.reset();
  renderElapsed();
  result.hidden = true;
  controls.hidden = false;
  elapsed.textContent = '';
  document.querySelector('#share-status').hidden = true;
  renderTimer();
  document.querySelector('#poem-title').textContent = text.title;
  document.querySelector('#author').textContent = text.author;
  document.querySelector('#poem-body').textContent = text.body;
  document.querySelector('#word-count').textContent = `${text.body.trim().split(/\s+/u).length} mots`;
  status.textContent = 'Prêt pour une nouvelle lecture ?';
  const url = new URL(location.href);
  url.searchParams.set('text', text.id);
  history.replaceState(null, '', url);
}

choice.addEventListener('change', selectText);
document.querySelector('#font-size').addEventListener('click', event => {
  const large = document.querySelector('#poem').classList.toggle('large-text');
  event.currentTarget.setAttribute('aria-pressed', String(large));
  event.currentTarget.textContent = large ? 'Taille habituelle' : 'Agrandir le texte';
});

start.addEventListener('click', () => {
  if (!timer.start()) return;
  status.textContent = 'Bonne lecture !';
  renderElapsed();
  ticker = setInterval(renderElapsed, 100);
  renderTimer();

  stop.focus({ preventScroll: true });
});

stop.addEventListener('click', () => {
  const duration = timer.stop();
  if (duration === null) return;
  clearInterval(ticker);
  renderElapsed();

  const text = texts.find(text => text.id === choice.value);
  readings.push({ textId: text.id, title: text.title, date: new Date().toISOString(), duration });
  let saved = false;
  if (storageAvailable) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readings));
      saved = true;
    } catch {
      showStorageWarning('Le navigateur ne peut pas sauvegarder ce temps. Note-le avant de quitter la page.');
    }
  }
  status.textContent = saved ? 'Bravo ! Ton temps a été enregistré.' : 'Bravo ! Ton temps est affiché ci-dessous, mais n’a pas pu être sauvegardé.';
  renderTimer();
  renderHistory();
  elapsed.textContent = formatDuration(duration);
  result.hidden = false;
  celebrate(result);
  controls.hidden = true;
  result.focus();
});

document.querySelector('#retry').addEventListener('click', () => {
  selectText();
  document.querySelector('#poem').scrollIntoView({ block: 'start' });
  start.focus({ preventScroll: true });
});

document.addEventListener('visibilitychange', renderElapsed);

window.addEventListener('beforeunload', event => {
  if (timer.state !== 'idle') {
    event.preventDefault();
    event.returnValue = '';
  }
});

renderHistory();
try {
  const response = await fetch('./texts.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  texts = await response.json();
  if (!Array.isArray(texts) || !texts.length || !texts.every(text =>
    text && ['id', 'title', 'author', 'body'].every(key => typeof text[key] === 'string' && text[key].trim())
  ) || new Set(texts.map(text => text.id)).size !== texts.length) throw new Error('Invalid texts');
  choice.replaceChildren(...texts.map(text => new Option(text.title, text.id)));
  const sharedId = new URL(location.href).searchParams.get('text');
  if (texts.some(text => text.id === sharedId)) {
    choice.value = sharedId;
  } else {
    try {
      const scheduleResponse = await fetch('./schedule.json', { cache: 'no-cache' });
      if (!scheduleResponse.ok) throw new Error(`HTTP ${scheduleResponse.status}`);
      choice.value = scheduledTextId(await scheduleResponse.json(), texts);
    } catch (error) {
      const notice = document.querySelector('#schedule-warning');
      notice.textContent = 'Le texte prévu n’a pas pu être sélectionné. Choisis ton texte dans la liste.';
      notice.hidden = false;
      console.error('Failed to load reading schedule', error);
    }
    if (sharedId !== null) {
      const notice = document.querySelector('#schedule-warning');
      notice.textContent = 'Le texte partagé n’est plus disponible. Choisis un texte dans la liste.';
      notice.hidden = false;
    }
  }
  document.querySelector('#share').disabled = false;
  choice.disabled = false;
  start.disabled = false;
  selectText();
} catch (error) {
  document.querySelector('#poem-title').textContent = 'Les textes ne sont pas disponibles.';
  status.textContent = 'Recharge la page pour réessayer.';
  console.error('Failed to load reading texts', error);
}
