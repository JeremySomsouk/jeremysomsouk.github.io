import { transportClass, available } from './transport.js';
const app = document.querySelector('#guess-app');
const error = document.querySelector('#guess-error');
const connection = document.querySelector('#guess-connection');
let transport, state, pending = false, clockOffset = 0, answerDraft = '', assignments = {}, roundKey = '';
let draftQuestions = [{ text: 'What would you bring to a desert island?', seconds: 60 }];
const params = new URLSearchParams(location.search);
const backendQuery = params.get('backend') === 'worker' ? '&backend=worker' : '';
let roomCode = (params.get('room') ?? location.pathname.match(/^\/guess\/([a-z0-9]+)\/?$/i)?.[1] ?? '').toUpperCase();
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
  node.append(...children.flat().filter(x => x !== null && x !== undefined).map(x => typeof x === 'string' || typeof x === 'number' ? document.createTextNode(String(x)) : x));
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
      history.replaceState(null, '', `/guess/?room=${roomCode}${backendQuery}`);
    } else if (event.type === 'state') {
      const previous = state;
      state = event.state; clockOffset = state.serverNow - Date.now();
      if (roundKey !== `${state.code}:${state.current}`) {
        roundKey = `${state.code}:${state.current}`; answerDraft = state.ownAnswer; assignments = {};
      }
      if (!previous || previous.phase !== state.phase) {
        showError('');
      }
      render();
    } else if (event.type === 'error') showError(event.message);
  }, message => { connection.textContent = message; if (/closed|Cannot/.test(message)) pending = false; });
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
    const timer = el('select', { id: `timer-${i}`, onchange: e => { q.seconds = e.target.value === '' ? null : Number(e.target.value); document.getElementById(`custom-${i}`).value = q.seconds ?? ''; } });
    for (const [value, label] of [['', 'No timer'], [30, '30 seconds'], [45, '45 seconds'], [60, '60 seconds'], [90, '90 seconds'], [120, '2 minutes'], [300, '5 minutes']]) {
      timer.append(el('option', { value, selected: value === (q.seconds ?? '') }, label));
    }
    if (q.seconds !== null && ![30,45,60,90,120,300].includes(q.seconds)) timer.append(el('option', { value: q.seconds, selected: true }, `${q.seconds} seconds`));
    const custom = el('input', { id: `custom-${i}`, type: 'number', min: 15, max: 300, value: q.seconds ?? '', placeholder: '15–300', oninput: e => { q.seconds = e.target.value === '' ? null : Number(e.target.value); timer.value = String(q.seconds ?? ''); } });
    list.append(el('fieldset', { class: 'guess-card' }, el('legend', {}, `Question ${i + 1}`), el('label', { for: textarea.id }, 'Question', textarea),
      el('div', { class: 'guess-timers' }, el('label', { for: timer.id }, 'Time to answer', timer), el('label', { for: custom.id }, 'Or seconds (optional)', custom)),
      el('div', { class: 'guess-actions' },
        button('↑', () => { [draftQuestions[i-1], draftQuestions[i]] = [q, draftQuestions[i-1]]; setup(); }, i === 0, { 'aria-label': `Move question ${i+1} up` }),
        button('↓', () => { [draftQuestions[i+1], draftQuestions[i]] = [q, draftQuestions[i+1]]; setup(); }, i === draftQuestions.length-1, { 'aria-label': `Move question ${i+1} down` }),
        button('Remove', () => { draftQuestions.splice(i, 1); setup(); }, draftQuestions.length === 1))));
  });
  return list;
}
let setupName = '', joinName = '';
function setup() {
  if (state) return;
  app.replaceChildren();
  if (!available) app.append(el('p', { class: 'guess-card' }, 'Online rooms are coming soon. The full game is available with the local development server.'));
  const name = inputField('Your name', { id: 'host-name', maxlength: 24, required: true, value: setupName, autocomplete: 'nickname' }, e => { setupName = e.target.value; });
  const create = el('form', { onsubmit: e => {
    e.preventDefault();
    if (pending) return;
    if (draftQuestions.some(q => [...q.text.trim()].length < 3 || [...q.text.trim()].length > 200 || (q.seconds !== null && (!Number.isInteger(q.seconds) || q.seconds < 15 || q.seconds > 300)))) return showError('Check question text and timers (15–300 seconds).');
    begin({ type: 'create_room', name: setupName, questions: draftQuestions });
  } }, el('h3', {}, 'Create a game'), name, questionEditor(), button('+ Add question', () => { draftQuestions.push({ text: '', seconds: 60 }); setup(); }, draftQuestions.length >= 20),
    el('p', {}, 'Prepare every question now. Once started, questions and timers are locked.'), el('button', { type: 'submit', disabled: !available }, 'Create room'));
  const join = el('form', { class: 'guess-card', onsubmit: e => { e.preventDefault(); if (!pending) begin({ type: 'join_room', code: roomCode.trim().toUpperCase(), name: joinName }); } },
    el('h3', {}, 'Join friends'), inputField('Room code', { id: 'room-code', required: true, minlength: 4, maxlength: 8, value: roomCode, autocapitalize: 'characters', pattern: '[23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]{4,8}' }, e => { roomCode = e.target.value.toUpperCase(); }),
    inputField('Your name', { id: 'join-name', maxlength: 24, required: true, value: joinName, autocomplete: 'nickname' }, e => { joinName = e.target.value; }), el('button', { type: 'submit', disabled: !available }, 'Join room'));
  app.append(join, el('details', { open: !roomCode }, el('summary', {}, 'Or create your own game'), create));
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
  // Retain in-progress input and focus across readiness updates from other players.
  const active = document.activeElement; const focusId = active?.id; const selection = active?.selectionStart;
  app.replaceChildren();
  const me = state.players.find(p => p.id === state.me);
  app.append(el('div', { class: 'guess-room-header' }, el('strong', {}, `Room ${state.code}`), el('span', {}, `${state.players.length} players`)));
  if (state.phase === 'Lobby') {
    app.append(el('h3', {}, state.isHost ? 'Gather your friends' : "You’re in!"), el('p', {}, state.isHost ? 'Share this code or link. Nothing starts until you press Start game.' : 'Waiting for the host to start…'));
    const link = `${location.origin}/guess/?room=${state.code}${backendQuery}`;
    app.append(el('p', { class: 'guess-code' }, state.code), el('a', { href: link }, link),
      button('Copy invitation', async () => { try { await navigator.clipboard.writeText(link); connection.textContent = 'Invitation copied.'; } catch { showError('Copy the invitation link above.'); } }),
      el('ul', { class: 'guess-players' }, state.players.map(p => el('li', {}, p.name, p.host ? ' · Host' : '', p.id === state.me ? ' · You' : '', p.connected ? ' · ready' : ' · disconnected'))));
    if (state.isHost) app.append(el('p', {}, `${state.players.length} players in the room · ${state.total} prepared questions`), button('Start game', () => send({ type: 'start_game' }), state.players.length < 3), state.players.length < 3 ? el('p', {}, 'Need at least 3 players') : null);
  } else if (state.phase === 'Finished') {
    app.append(leaderboard(true), el('p', {}, 'Thanks for playing. One more game?'), button('New game', () => { transport.close(); location.assign('/guess/'); }));
  } else {
    app.append(el('p', { class: 'guess-eyebrow' }, `Question ${state.current + 1} of ${state.total}`), el('h3', { class: 'guess-question' }, state.question.text));
    if (state.phase === 'Answering') {
      app.append(el('p', { id: 'guess-clock', class: 'guess-clock', 'aria-label': 'Time remaining' }), el('p', {}, `${state.players.filter(p => p.answered && !p.excluded).length} / ${state.players.filter(p => !p.excluded).length} answered`));
      if (me.excluded) app.append(el('p', {}, 'You have been excused from this round. You can watch and return next round.'));
      else {
        const answer = el('textarea', { id: 'your-answer', required: true, maxlength: 120, rows: 3, oninput: e => { answerDraft = e.target.value; } }, answerDraft);
        app.append(el('form', { class: 'guess-card', onsubmit: e => { e.preventDefault(); send({ type: 'submit_answer', text: answerDraft }); } }, el('label', { for: 'your-answer' }, 'Your answer', answer), el('button', { type: 'submit' }, me.answered ? 'Update answer' : 'Submit answer')),
          me.answered ? el('p', {}, 'Answer submitted ✓ You can edit until the round closes.') : null);
      }
      updateClock();
    } else if (state.phase === 'Guessing') {
      app.append(el('p', {}, 'Who wrote each answer? Use each name once. Your own answer earns no point.'), el('p', {}, `${state.players.filter(p => p.guessed && !p.excluded).length} / ${state.players.filter(p => !p.excluded).length} guesses submitted`));
      if (!me.answered) app.append(el('p', {}, 'You skipped answering. You may still guess, but your name is not a possible author.'));
      if (me.excluded) app.append(el('p', {}, 'You are watching this round.'));
      else if (state.guesses) app.append(el('p', { class: 'guess-card' }, 'Guesses submitted ✓ Waiting for everyone…'));
      else {
        const form = el('form', { onsubmit: e => {
          e.preventDefault();
          const mapping = state.answers.map(a => ({ answerId: a.id, playerId: assignments[a.id] }));
          if (mapping.some(a => !a.playerId) || new Set(mapping.map(a => a.playerId)).size !== mapping.length) return showError('Use every eligible name exactly once.');
          send({ type: 'submit_guesses', assignments: mapping });
        } });
        for (const a of state.answers) {
          const select = el('select', { id: `match-${a.id}`, required: true, onchange: e => { assignments[a.id] = e.target.value; refreshOptions(); } }, el('option', { value: '' }, 'Choose a player'));
          for (const p of state.players.filter(p => state.authors.includes(p.id))) select.append(el('option', { value: p.id }, p.name + (p.id === state.me ? ' (you)' : '')));
          select.value = assignments[a.id] ?? '';
          form.append(el('div', { class: 'guess-card guess-match' }, el('p', {}, a.text), el('label', { for: select.id }, 'Who wrote this?', select)));
        }
        form.append(el('button', { type: 'submit' }, 'Submit my guesses')); app.append(form); refreshOptions();
      }
      app.append(el('p', {}, 'Discuss together, then commit to your own guesses.'));
    } else {
      const revealing = state.phase === 'Revealing';
      app.append(el('h3', {}, revealing ? 'The authors revealed' : 'Question complete'));
      const count = revealing ? state.revealCount : state.answers.length;
      for (const a of state.answers.slice(0, count)) {
        const guessed = state.guesses?.find(g => g.answerId === a.id)?.playerId;
        app.append(el('article', { class: 'guess-card guess-reveal' }, el('p', {}, a.text), el('strong', {}, `Actually: ${playerName(a.owner)}`),
          el('p', {}, guessed ? `You guessed ${playerName(guessed)} · ${a.owner === state.me ? 'Your answer · no point' : guessed === a.owner ? 'Correct! +1' : 'Not this time'}` : 'No guess submitted')));
      }
      if (revealing && count < state.answers.length) app.append(state.isHost ? button('Reveal next answer', () => send({ type: 'advance_reveal' })) : el('p', {}, 'Waiting for the host to reveal the next answer…'));
      else {
        app.append(el('section', { class: 'guess-card' }, el('h3', {}, 'This round'), state.players.map(p => el('p', {}, `${p.name} +${state.points[p.id] ?? 0}`))), leaderboard());
        if (state.isHost) app.append(button(revealing ? (state.current === state.total-1 ? 'Final results' : 'Finish round') : 'Next question', () => send({ type: revealing ? 'finish_reveal' : 'next_question' })));
        else app.append(el('p', {}, 'Waiting for the host to continue…'));
      }
    }
  }
  app.append(hostControls());
  if (focusId) { const node = document.getElementById(focusId); node?.focus(); if (selection !== null && node?.setSelectionRange) node.setSelectionRange(selection, selection); }
}
function refreshOptions() {
  for (const a of state.answers) {
    const select = document.getElementById(`match-${a.id}`);
    if (!select) continue;
    for (const option of select.options) option.disabled = Boolean(option.value && option.value !== select.value && Object.values(assignments).includes(option.value));
  }
}
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
