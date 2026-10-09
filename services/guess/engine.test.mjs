import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room, TTL, questions } from './engine.mjs';
const t = 1_000_000;
function lobby(input = [{ text: 'First question?', seconds: 30 }, { text: 'Next question?', seconds: 90 }]) {
  const room = new Room('K9F4', 'Host', input, t);
  room.join('Alice', t); room.join('Bob', t); room.join('Sarah', t);
  return room;
}
const command = (r, p, type, more = {}, now = t) => r.command(p.token, p.id === r.hostId ? r.hostToken : undefined, { type, questionId: r.questions[r.current].id, ...more }, now);
const start = r => command(r, r.players[0], 'start_game');
function answerAll(r) { r.players.forEach((p, i) => command(r, p, 'submit_answer', { text: `Answer ${i}` })); }
function guesses(r, p, shift = 0) {
  return r.answers.map((a, i) => ({ answerId: a.id, playerId: r.answers[(i+shift)%r.answers.length].owner }));
}
test('creation validates all questions and bounded independent timers', () => {
  assert.throws(() => questions([]));
  for (const seconds of [0, 14, 301, 30.5, undefined]) assert.throws(() => questions([{ text: 'Valid?', seconds }]));
  for (const seconds of [null, 15, 300]) assert.equal(questions([{ text: 'Valid?', seconds }])[0].seconds, seconds);
  assert.throws(() => lobby([{ text: 'x', seconds: 30 }]));
  assert.throws(() => new Room('K9F4', '', [{ text: 'Okay?', seconds: null }], t));
});
test('lobby requires explicit host start, minimum players and unique names', () => {
  const r = lobby(); assert.equal(r.phase, 'Lobby');
  assert.throws(() => r.join('alice', t), /taken/);
  assert.throws(() => command(r, r.players[1], 'submit_answer', { text: 'secret' }), /closed/);
  assert.throws(() => command(r, r.players[1], 'start_game'), /host/);
  const small = new Room('K9F4', 'Host', [{ text: 'Okay?', seconds: null }], t);
  assert.throws(() => command(small, small.players[0], 'start_game'), /3 players/);
  start(r); assert.equal(r.deadline, t+30000);
  assert.throws(() => r.join('Late', t), /started/);
  assert.throws(() => start(r), /started/);
});
test('answer edits are unique, remain secret and early completion closes answers', () => {
  const r = lobby(); start(r);
  command(r, r.players[0], 'submit_answer', { text: 'Secret 1' });
  command(r, r.players[0], 'update_answer', { text: 'Secret 2' });
  assert.equal(r.answers.length, 1);
  const other = r.view(r.players[1].token, t);
  assert.deepEqual(other.answers, []); assert.equal(other.ownAnswer, '');
  assert.ok(!JSON.stringify(other).includes('Secret 2'));
  answerAll(r); assert.equal(r.phase, 'Guessing'); assert.equal(r.deadline, null);
  assert.throws(() => command(r, r.players[0], 'update_answer', { text: 'Late' }), /closed/);
  const view = r.view(r.players[1].token, t);
  assert.equal(view.answers.length, 4);
  for (const a of view.answers) assert.deepEqual(Object.keys(a).sort(), ['id','text']);
  for (const p of r.players) assert.ok(!JSON.stringify(view).includes(p.token));
  assert.ok(!JSON.stringify(view).includes(r.hostToken));
});
test('deadline expiry rejects late arrivals and excludes missing authors', () => {
  const r = lobby(); start(r);
  command(r, r.players[0], 'submit_answer', { text: 'A' });
  command(r, r.players[1], 'submit_answer', { text: 'B' });
  const deadline = r.deadline;
  assert.equal(r.view(r.players[2].token, t+12000).deadline, deadline);
  assert.equal(r.player(r.players[2].token).id, r.players[2].id);
  assert.throws(() => command(r, r.players[2], 'submit_answer', { text: 'too late' }, deadline), /closed/);
  assert.equal(r.phase, 'Guessing');
  assert.equal(r.view(r.players[2].token, deadline).authors.length, 2);
  assert.ok(!r.view(r.players[2].token, deadline).authors.includes(r.players[2].id));
});
test('no timer stays open, zero/one answers produce zero-point round', () => {
  const r = lobby([{ text: 'No timer?', seconds: null }]); start(r); r.tick(t+500000);
  assert.equal(r.phase, 'Answering'); assert.equal(r.deadline, null);
  const empty = lobby(); start(empty); empty.tick(t+30000); assert.equal(empty.phase, 'Revealing'); assert.ok(empty.players.every(p => p.score === 0));
  const one = lobby(); start(one); command(one, one.players[0], 'submit_answer', { text: 'Just one' }); one.tick(t+30000); assert.equal(one.phase, 'Revealing');
});
test('guesses are independent, private, immutable and a complete bijection', () => {
  const r = lobby(); start(r); answerAll(r);
  const p = r.players[0], valid = guesses(r,p);
  for (const assignments of [[], valid.slice(1), valid.map(g => ({ ...g, playerId: p.id })), valid.map(g => ({ ...g, answerId: valid[0].answerId })), valid.map(g => ({ ...g, playerId: 'foreign' })), [null]]) assert.throws(() => command(r,p,'submit_guesses',{ assignments }), /Match/);
  command(r,p,'submit_guesses',{ assignments: valid });
  assert.equal(r.view(r.players[1].token,t).guesses,null);
  assert.deepEqual(r.view(p.token,t).guesses,valid);
  assert.throws(() => command(r,p,'submit_guesses',{ assignments: valid }), /already/);
  command(r,r.players[1],'submit_guesses',{ assignments: guesses(r,r.players[1],1) });
  assert.notDeepEqual(r.guesses[p.id],r.guesses[r.players[1].id]);
});
test('server scoring excludes self, accumulates and final ranks handle ties', () => {
  const r = lobby(); start(r); answerAll(r);
  r.players.forEach(p => command(r,p,'submit_guesses',{ assignments: guesses(r,p) }));
  assert.equal(r.phase, 'Revealing'); assert.ok(r.players.every(p=>p.score===3));
  const ranks = r.view(r.players[0].token,t).leaderboard.map(p=>p.rank); assert.deepEqual(ranks,[1,1,1,1]);
  assert.equal(r.view(r.players[0].token,t).answers.filter(a=>a.owner).length,1);
  while(r.revealCount<r.answers.length) command(r,r.players[0],'advance_reveal');
  assert.ok(r.view(r.players[0].token,t).answers.every(a=>a.owner));
  assert.throws(() => command(r,r.players[1],'finish_reveal'), /host/);
  command(r,r.players[0],'finish_reveal'); assert.equal(r.phase,'QuestionComplete');
  command(r,r.players[0],'next_question',{},t+10000); assert.equal(r.deadline,t+10000+90000);
  assert.equal(r.answers.length,0); assert.deepEqual(r.guesses,{});
  answerAll(r); r.players.forEach(p=>command(r,p,'submit_guesses',{ assignments: guesses(r,p), score: 99999 }));
  assert.ok(r.players.every(p=>p.score===6));
  while(r.revealCount<r.answers.length) command(r,r.players[0],'advance_reveal');
  command(r,r.players[0],'finish_reveal'); assert.equal(r.phase,'Finished');
  assert.throws(()=>command(r,r.players[0],'next_question'),/first/);
});
test('everyone’s guesses become public only for revealed answers', () => {
  const r = lobby(); start(r); answerAll(r);
  r.players.forEach((p, i) => {
    assert.ok(r.view(p.token,t).answers.every(a => !Object.hasOwn(a, 'guesses')));
    command(r,p,'submit_guesses',{ assignments: guesses(r,p,i % 2) });
  });
  const view = r.view(r.players[1].token,t);
  assert.deepEqual(view.answers[0].guesses, r.players.map(p => ({ playerId: p.id, guessedPlayerId: r.guesses[p.id].find(g => g.answerId === view.answers[0].id).playerId })));
  assert.ok(view.answers.slice(1).every(a => !Object.hasOwn(a, 'guesses')));
  while(r.revealCount < r.answers.length) command(r,r.players[0],'advance_reveal');
  assert.ok(r.view(r.players[0].token,t).answers.every(a => a.guesses.length === r.players.length));
  command(r,r.players[0],'finish_reveal');
  assert.ok(r.view(r.players[0].token,t).answers.every(a => a.guesses.length === r.players.length));
  command(r,r.players[0],'next_question');
  assert.deepEqual(r.view(r.players[0].token,t).answers, []);
});
test('reveal includes players who did not submit guesses', () => {
  const r = lobby(); start(r); answerAll(r);
  command(r,r.players[0],'end_game');
  assert.ok(r.view(r.players[0].token,t).answers.every(a => a.guesses.every(g => g.guessedPlayerId === null)));
});
test('disconnected answered players stay candidates; host can waive readiness', () => {
  const r=lobby(); start(r); answerAll(r);
  const absent=r.players[3]; absent.connected=false;
  command(r,r.players[0],'exclude_player',{playerId:absent.id});
  assert.equal(r.answers.length,4);
  r.players.slice(0,3).forEach(p=>command(r,p,'submit_guesses',{assignments:guesses(r,p)}));
  assert.equal(r.phase,'Revealing'); assert.equal(absent.score,0);
});
test('authorization, malformed messages and expiration are enforced', () => {
  const r=lobby();
  for (const type of ['start_game','end_game','next_question','exclude_player']) assert.throws(()=>command(r,r.players[1],type),/host/);
  assert.throws(()=>r.command('wrong',r.hostToken,{type:'start_game'},t),/token/);
  for(const intent of [null,{}, {type:'unknown'}]) assert.throws(()=>r.command(r.players[0].token,r.hostToken,intent,t));
  assert.throws(()=>r.join('New',t+TTL),/expired/); assert.throws(()=>r.view(r.players[0].token,t+TTL),/expired/);
  assert.throws(()=>command(r,r.players[0],'start_game',{},t+TTL),/expired/);
});
test('old-question commands and repeated progression cannot be replayed', () => {
  const r=lobby();start(r);answerAll(r);
  r.players.forEach(p=>command(r,p,'submit_guesses',{assignments:guesses(r,p)}));
  assert.throws(()=>command(r,r.players[0],'finish_reveal'),/ready/);
  while(r.revealCount<r.answers.length)command(r,r.players[0],'advance_reveal');
  const oldQuestion=r.questions[0].id;
  command(r,r.players[0],'finish_reveal');command(r,r.players[0],'next_question');
  for(const type of ['submit_answer','submit_guesses','next_question','advance_reveal']) assert.throws(()=>command(r,r.players[0],type,{questionId:oldQuestion,text:'Replay'}),/changed/);
});
