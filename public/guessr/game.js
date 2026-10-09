import { transportClass, available } from './transport.js';
const app = document.querySelector('#guess-app');
const error = document.querySelector('#guess-error');
const connection = document.querySelector('#guess-connection');
const append = (...children) => app.append(...children.flat(Infinity).filter(x => x !== null && x !== undefined));
let transport, state, pending = false, clockOffset = 0, answerDraft = '', assignments = {}, roundKey = '', selectedPlayer = null, drag = null;
let screenKey = '', screenAnimation;
let draftQuestions = [{ text: 'What would you bring to a desert island?', seconds: 60 }];
const params = new URLSearchParams(location.search);
const backendQuery = params.get('backend') === 'worker' ? '&backend=worker' : '';
let roomCode = (params.get('room') ?? location.pathname.match(/^\/guessr\/([a-z0-9]+)\/?$/i)?.[1] ?? '').toUpperCase();
const key = code => `guess:${code}`;
const saved = code => { try { return JSON.parse(sessionStorage.getItem(key(code)) ?? 'null'); } catch { return null; } };
const write = (code, value) => { try { sessionStorage.setItem(key(code), JSON.stringify(value)); } catch { showError('Allow session storage to keep your identity after refresh.'); } };
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat(Infinity).filter(x => x !== null && x !== undefined).map(x => typeof x === 'string' || typeof x === 'number' ? document.createTextNode(String(x)) : x));
  return node;
}
function button(label, action, disabled = false, attrs = {}) { return el('button', { type: 'button', onclick: action, disabled, ...attrs }, label); }
function showError(message) { error.textContent = message; }
function send(intent) { try { showError(''); transport.send({ ...intent, ...(state ? { questionId: state.question.id } : {}) }); } catch (e) { showError(e.message); } }
function begin(intent) {
  if (!available) return showError('Online rooms are not available yet. Try the local version.');
  transport?.close(); pending = true;
  transport = new transportClass(event => {
    pending = false;
    if (event.type === 'welcome') {
      roomCode = event.code;
      const old = saved(roomCode) ?? {};
      write(roomCode, { ...old, playerToken: event.playerToken, hostToken: event.hostToken ?? old.hostToken });
      history.replaceState(null, '', `/guessr/?room=${roomCode}${backendQuery}`);
    } else if (event.type === 'state') {
      const previous = state;
      state = event.state; clockOffset = state.serverNow - Date.now();
      if (roundKey !== `${state.code}:${state.current}`) {
        roundKey = `${state.code}:${state.current}`; answerDraft = state.ownAnswer; assignments = {}; selectedPlayer = null;
      }
      if (!previous || previous.phase !== state.phase) {
        showError('');
      }
      render();
    } else if (event.type === 'error') showError(event.message);
  }, message => { connection.textContent = message === 'Connected' ? '' : message; if (/closed|Cannot/.test(message)) pending = false; });
  transport.connect(intent);
}
function inputField(label, attrs, oninput) {
  const id = attrs.id;
  return el('label', { for: id }, el('span', {}, label), el('input', { ...attrs, oninput }));
}
function questionEditor() {
  const list = el('div', { class: 'guess-questions' });
  draftQuestions.forEach((q, i) => {
    const textarea = el('textarea', { id: `question-${i}`, minlength: 3, maxlength: 200, required: true, rows: 2, oninput: e => { q.text = e.target.value; } }, q.text);
    const timer = el('select', { id: `timer-${i}`, onchange: e => { q.seconds = e.target.value === '' ? null : Number(e.target.value); } });
    for (const [value, label] of [['', 'No timer'], [15, '15 seconds'], [30, '30 seconds'], [45, '45 seconds'], [60, '60 seconds'], [90, '90 seconds'], [120, '2 minutes'], [300, '5 minutes']]) {
      timer.append(el('option', { value, selected: value === (q.seconds ?? '') }, label));
    }
    if (q.seconds !== null && ![15,30,45,60,90,120,300].includes(q.seconds)) timer.append(el('option', { value: q.seconds, selected: true }, `${q.seconds} seconds`));

    list.append(el('fieldset', { class: 'guess-card' }, el('legend', {}, `Question ${i + 1}`), el('label', { for: textarea.id }, 'Question', textarea),
      el('label', { for: timer.id }, 'Time to answer', timer),
      el('div', { class: 'guess-actions' },
        button('↑', () => { [draftQuestions[i-1], draftQuestions[i]] = [q, draftQuestions[i-1]]; setup(); }, i === 0, { 'aria-label': `Move question ${i+1} up` }),
        button('↓', () => { [draftQuestions[i+1], draftQuestions[i]] = [q, draftQuestions[i+1]]; setup(); }, i === draftQuestions.length-1, { 'aria-label': `Move question ${i+1} down` }),
        button('Remove', () => { draftQuestions.splice(i, 1); setup(); }, draftQuestions.length === 1))));
  });
  return list;
}
let setupName = '', joinName = '', setupMode = roomCode ? 'join' : 'create';
function setup() {
  if (state) return;
  app.replaceChildren();
  if (!available) append(el('p', { class: 'guess-card' }, 'Online rooms are coming soon. The full game is available with the local development server.'));
  const name = inputField('Your name', { id: 'host-name', maxlength: 24, required: true, value: setupName, autocomplete: 'nickname' }, e => { setupName = e.target.value; });
  const create = el('form', { onsubmit: e => {
    e.preventDefault();
    if (pending) return;
    if (draftQuestions.some(q => [...q.text.trim()].length < 3 || [...q.text.trim()].length > 200 || (q.seconds !== null && (!Number.isInteger(q.seconds) || q.seconds < 15 || q.seconds > 300)))) return showError('Check question text and timers (15–300 seconds).');
    begin({ type: 'create_room', name: setupName, questions: draftQuestions });
  } }, name, questionEditor(), button('+ Add question', () => { draftQuestions.push({ text: '', seconds: 60 }); setup(); }, draftQuestions.length >= 20),
    el('p', {}, 'Questions are locked when the game starts.'), el('button', { type: 'submit', disabled: !available }, 'Create room'));
  const join = el('form', { class: 'guess-card', onsubmit: e => { e.preventDefault(); if (!pending) begin({ type: 'join_room', code: roomCode.trim().toUpperCase(), name: joinName }); } },
    inputField('Room code', { id: 'room-code', required: true, minlength: 4, maxlength: 8, value: roomCode, autocapitalize: 'characters', pattern: '[23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]{4,8}' }, e => { roomCode = e.target.value.toUpperCase(); }),
    inputField('Your name', { id: 'join-name', maxlength: 24, required: true, value: joinName, autocomplete: 'nickname' }, e => { joinName = e.target.value; }), el('button', { type: 'submit', disabled: !available }, 'Join room'));
  append(el('div', { class: 'guess-setup-tabs', role: 'group', 'aria-label': 'Create or join' },
    button('Create a game', () => { setupMode = 'create'; setup(); }, false, { 'aria-pressed': setupMode === 'create' }),
    button('Join a room', () => { setupMode = 'join'; setup(); }, false, { 'aria-pressed': setupMode === 'join' })),
    setupMode === 'create' ? create : join);
}
function playerName(id) { return state.players.find(p => p.id === id)?.name ?? 'Player'; }
function leaderboard(final = false) {
  return el('section', { class: 'guess-card' }, el('h3', {}, final ? 'Final results' : 'Overall'),
    el('ol', { class: 'guess-leaderboard' }, state.leaderboard.map(p => el('li', {}, el('span', {}, `${p.rank}. ${p.name}${p.id === state.me ? ' (you)' : ''}`), el('strong', {}, `${p.score} pt`)))));
}
function hostControls() {
  if (!state.isHost || state.phase === 'Finished') return null;
  return el('details', { class: 'guess-host' }, el('summary', {}, 'Host controls'),
    ['Answering','Guessing'].includes(state.phase) ? state.players.filter(p => !p.connected && !p.host && !p.excluded).map(p => button(`Excuse ${p.name} this round`, () => send({ type: 'exclude_player', playerId: p.id }))) : null,
    button('End game', () => { if (confirm('End this game and show final scores?')) send({ type: 'end_game' }); }));
}
function render() {
  cancelDrag();
  // Retain in-progress input and focus across readiness updates from other players.
  const active = document.activeElement; const focusId = active?.id; const selection = active?.selectionStart;
  app.replaceChildren();
  const me = state.players.find(p => p.id === state.me);
  app.closest('.guess-game')?.setAttribute('data-phase', state.phase);
  if (state.phase === 'Lobby') {
    const link = `${location.origin}/guessr/?room=${state.code}${backendQuery}`;
    const invitation = el('div', { class: 'guess-invitation' },
      el('p', { class: 'guess-label' }, 'Room code'),
      el('p', { class: 'guess-code' }, state.code),
      button('Invite players', async () => {
        try {
          if (navigator.share) await navigator.share({ title: 'Guessr', url: link });
          else { await navigator.clipboard.writeText(link); connection.textContent = 'Invite link copied.'; }
        } catch (e) {
          if (e.name === 'AbortError') return;
          showError('Copy this link to invite players.');
          if (!invitation.querySelector('.guess-invite-link')) invitation.append(el('a', { class: 'guess-invite-link', href: link }, link));
        }
      }));
    append(invitation, el('h3', { class: 'guess-player-heading' }, `Players · ${state.players.length}`),
      el('ul', { class: 'guess-players' }, state.players.map(p => el('li', {},
        el('span', { class: 'guess-player-name' }, p.name),
        el('span', { class: 'guess-player-note' }, [p.id === state.me ? 'You' : '', p.host ? 'Host' : '', !p.connected ? 'Offline' : ''].filter(Boolean).join(' · '))))));
    if (state.isHost) {
      const missing = Math.max(0, 3 - state.players.length);
      append(el('div', { class: 'guess-start' }, button('Start game', () => send({ type: 'start_game' }), missing > 0),
        missing ? el('p', { class: 'guess-hint' }, `Invite ${missing} more ${missing === 1 ? 'player' : 'players'} to start.`) : null));
    } else append(el('p', { class: 'guess-hint' }, 'Waiting for the host…'));
  } else if (state.phase === 'Finished') {
    append(leaderboard(true), el('p', {}, 'Play again?'), button('New game', () => { transport.close(); location.assign('/guessr/'); }));
  } else {
    append(el('p', { class: 'guess-eyebrow' }, `Question ${state.current + 1} of ${state.total}`), el('h3', { class: 'guess-question' }, state.question.text));
    if (state.phase === 'Answering') {
      append(el('p', { id: 'guess-clock', class: 'guess-clock', 'aria-label': 'Time remaining' }), el('p', {}, `${state.players.filter(p => p.answered && !p.excluded).length} / ${state.players.filter(p => !p.excluded).length} answered`));
      if (me.excluded) append(el('p', {}, 'You have been excused from this round. You can watch and return next round.'));
      else {
        const answer = el('textarea', { id: 'your-answer', required: true, maxlength: 120, rows: 3, oninput: e => { answerDraft = e.target.value; } }, answerDraft);
        append(el('form', { class: 'guess-card', onsubmit: e => { e.preventDefault(); send({ type: 'submit_answer', text: answerDraft }); } }, el('label', { for: 'your-answer' }, 'Your answer', answer), el('button', { type: 'submit' }, me.answered ? 'Update answer' : 'Submit answer')),
          me.answered ? el('p', {}, 'Answer submitted ✓') : null);
      }
      updateClock();
    } else if (state.phase === 'Guessing') {
      append(el('p', {}, 'Drag a name onto an answer, or tap a name then an answer.'), el('p', {}, `${state.players.filter(p => p.guessed && !p.excluded).length} / ${state.players.filter(p => !p.excluded).length} guesses submitted`));
      if (!me.answered) append(el('p', {}, 'No answer this round. You can still guess.'));
      if (me.excluded) append(el('p', {}, 'You are watching this round.'));
      else if (state.guesses) append(el('p', { class: 'guess-card' }, 'Guesses submitted ✓ Waiting for everyone…'));
      else {
        const form = el('form', { onsubmit: e => {
          e.preventDefault();
          const mapping = state.answers.map(a => ({ answerId: a.id, playerId: assignments[a.id] }));
          if (mapping.some(a => !a.playerId) || new Set(mapping.map(a => a.playerId)).size !== mapping.length) return showError('Use every eligible name exactly once.');
          send({ type: 'submit_guesses', assignments: mapping });
        } });
        form.className = 'guess-matching-form';
        form.append(el('div', { id: 'guess-answer-list' }), el('aside', { id: 'guess-name-bank', class: 'guess-name-bank', 'aria-label': 'Names to match' }),
          el('button', { id: 'guess-submit', type: 'submit' }, 'Submit my guesses'));
        append(form); refreshMatching();

      }
    } else {
      const revealing = state.phase === 'Revealing';
      append(el('h3', {}, revealing ? 'The authors revealed' : 'Question complete'));
      const count = revealing ? state.revealCount : state.answers.length;
      for (const a of state.answers.slice(0, count)) {
        append(el('article', { class: 'guess-card guess-reveal' }, el('p', {}, a.text), el('strong', {}, `Actually: ${playerName(a.owner)}`),
          el('ul', { class: 'guess-reveal-guesses', 'aria-label': 'Everyone’s guesses' }, (a.guesses ?? []).map(g =>
            el('li', {}, `${g.playerId === state.me ? 'You' : playerName(g.playerId)} → ${g.guessedPlayerId ? playerName(g.guessedPlayerId) : 'No guess submitted'}`,
              g.guessedPlayerId ? el('span', {}, ` · ${a.owner === g.playerId ? 'Own answer · no point' : g.guessedPlayerId === a.owner ? 'Correct! +1' : 'Not this time'}`) : null)))));
      }
      if (revealing && count < state.answers.length) append(state.isHost ? button('Reveal next answer', () => send({ type: 'advance_reveal' })) : el('p', {}, 'Waiting for the host to reveal the next answer…'));
      else {
        append(el('section', { class: 'guess-card' }, el('h3', {}, 'This round'), state.players.map(p => el('p', {}, `${p.name} +${state.points[p.id] ?? 0}`))), leaderboard());
        if (state.isHost) append(button(revealing ? (state.current === state.total-1 ? 'Final results' : 'Finish round') : 'Next question', () => send({ type: revealing ? 'finish_reveal' : 'next_question' })));
        else append(el('p', {}, 'Waiting for the host to continue…'));
      }
    }
  }
  append(hostControls());
  const nextScreen = `${state.code}:${state.current}:${state.phase}`;
  if (nextScreen !== screenKey) {
    screenKey = nextScreen;
    screenAnimation?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && app.animate) {
      screenAnimation = app.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(.2,.7,.3,1)' },
      );
    }
  }
  if (focusId) { const node = document.getElementById(focusId); node?.focus(); if (selection !== null && node?.setSelectionRange) node.setSelectionRange(selection, selection); }
}
function placeName(answerId, playerId) {
  if (!state.authors.includes(playerId) || !state.answers.some(a => a.id === answerId)) return;
  const source = Object.keys(assignments).find(id => assignments[id] === playerId);
  const displaced = assignments[answerId];
  if (source && source !== answerId) {
    if (displaced) assignments[source] = displaced;
    else delete assignments[source];
  }
  assignments[answerId] = playerId;
  selectedPlayer = null; showError(''); refreshMatching();
}
function cancelDrag() {
  if (!drag) return;
  const old = drag; drag = null;
  old.ghost?.remove(); cancelAnimationFrame(old.frame);
  document.querySelectorAll('.guess-drop-hover').forEach(n => n.classList.remove('guess-drop-hover'));
  try { old.source.releasePointerCapture(old.pointerId); } catch { /* Capture may already be released. */ }
}
function targetAt(x, y) {
  const target = document.elementFromPoint(x, y)?.closest('[data-answer-id]');
  return target && app.contains(target) ? target : null;
}
function nameChip(playerId, answerId = null) {
  let moved = false;
  const chip = button(playerName(playerId), () => {
    if (moved) { moved = false; return; }
    if (answerId && selectedPlayer && selectedPlayer !== playerId) placeName(answerId, selectedPlayer);
    else { selectedPlayer = selectedPlayer === playerId ? null : playerId; refreshMatching(); }
  }, false, { id: `name-${playerId}`, class: `guess-name-chip${selectedPlayer === playerId ? ' is-picked' : ''}`, 'data-player-id': playerId, 'aria-pressed': selectedPlayer === playerId });
  chip.addEventListener('pointerdown', e => {
    if (drag || (e.button !== 0 && e.pointerType !== 'touch')) return;
    moved = false;
    drag = { source: chip, pointerId: e.pointerId, playerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, ghost: null, frame: null };
    try { chip.setPointerCapture(e.pointerId); } catch { cancelDrag(); }
  });
  chip.addEventListener('pointermove', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.ghost && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 8) return;
    e.preventDefault(); moved = true;
    if (!drag.ghost) {
      drag.ghost = el('div', { class: 'guess-drag-ghost', 'aria-hidden': true }, playerName(playerId));
      document.body.append(drag.ghost);
      const frame = () => {
        if (!drag?.ghost) return;
        const offset = drag.y < 80 ? -10 : drag.y > innerHeight - 80 ? 10 : 0;
        if (offset) window.scrollBy(0, offset);
        drag.frame = requestAnimationFrame(frame);
      };
      drag.frame = requestAnimationFrame(frame);
    }
    drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`;
    document.querySelectorAll('.guess-drop-hover').forEach(n => n.classList.remove('guess-drop-hover'));
    targetAt(e.clientX, e.clientY)?.classList.add('guess-drop-hover');
  });
  chip.addEventListener('pointerup', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const target = drag.ghost ? targetAt(e.clientX, e.clientY) : null;
    cancelDrag();
    if (target) placeName(target.dataset.answerId, playerId);
  });
  chip.addEventListener('pointercancel', e => { if (drag?.pointerId === e.pointerId) cancelDrag(); });
  chip.addEventListener('lostpointercapture', e => { if (drag?.pointerId === e.pointerId) cancelDrag(); });
  return chip;
}
function refreshMatching() {
  const board = document.getElementById('guess-answer-list');
  const bank = document.getElementById('guess-name-bank');
  if (!board || !bank) return;
  const focused = document.activeElement?.id;
  board.replaceChildren();
  for (const answer of state.answers) {
    const playerId = assignments[answer.id];
    const drop = el('div', { class: 'guess-dropzone', 'data-answer-id': answer.id, role: 'group', 'aria-label': `Author for: ${answer.text}` });
    if (playerId) drop.append(nameChip(playerId, answer.id), button('×', () => { delete assignments[answer.id]; refreshMatching(); }, false,
      { class: 'guess-unmatch', 'aria-label': `Remove ${playerName(playerId)} from this answer` }));
    else drop.append(button(selectedPlayer ? `Place ${playerName(selectedPlayer)}` : 'Drop a name', () => {
      if (selectedPlayer) placeName(answer.id, selectedPlayer);
      else showError('Pick a name first.');
    }, false, { id: `match-${answer.id}`, class: 'guess-empty-match' }));
    board.append(el('article', { class: 'guess-card guess-match' }, el('p', {}, answer.text), drop));
  }
  const matched = state.answers.filter(a => assignments[a.id]).length;
  bank.replaceChildren(el('p', { class: 'guess-bank-title' }, `${matched} / ${state.answers.length} matched`),
    el('div', { class: 'guess-names' }, state.authors.filter(id => !Object.values(assignments).includes(id)).map(id => nameChip(id))));
  const submit = document.getElementById('guess-submit'); if (submit) submit.disabled = matched !== state.answers.length;
  if (focused) document.getElementById(focused)?.focus();
}
window.addEventListener('blur', cancelDrag);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { cancelDrag(); selectedPlayer = null; refreshMatching(); }
});
function updateClock() {
  const clock = document.querySelector('#guess-clock'); if (!clock || !state) return;
  if (state.deadline === null) { clock.textContent = 'No timer · take your time'; return; }
  const seconds = Math.max(0, Math.ceil((state.deadline - Date.now() - clockOffset)/1000));
  clock.textContent = seconds ? `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}` : 'Time is up · waiting for the server';
  clock.classList.toggle('guess-clock-low', seconds <= 10);
}
setInterval(updateClock, 250);
setup();
const identity = saved(roomCode);
if (roomCode && identity && available) begin({ type: 'join_room', code: roomCode, ...identity });
