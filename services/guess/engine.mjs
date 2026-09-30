// Shared authoritative rules. This module is never published to the static site.
import { webcrypto } from 'node:crypto';
const cryptoApi = globalThis.crypto ?? webcrypto;
export const TTL = 24 * 60 * 60 * 1000;
export const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const id = () => cryptoApi.randomUUID();
export const code = () => Array.from(cryptoApi.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
const fail = message => { throw new Error(message); };
const text = (value, min, max) => {
  if (typeof value !== 'string') fail('Invalid text.');
  value = value.trim();
  const length = [...value].length;
  if (length < min || length > max) fail(`Use ${min}–${max} characters.`);
  return value;
};
export function questions(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) fail('Prepare 1–20 questions.');
  return input.map(q => {
    if (!q || (q.seconds !== null && (!Number.isInteger(q.seconds) || q.seconds < 15 || q.seconds > 300))) fail('Timers must be 15–300 seconds or none.');
    return { id: id(), text: text(q.text, 3, 200), seconds: q.seconds };
  });
}
export class Room {
  constructor(roomCode, name, input, now = Date.now()) {
    this.code = roomCode; this.createdAt = now; this.expiresAt = now + TTL;
    this.questions = questions(input); this.players = []; this.hostToken = id();
    this.phase = 'Lobby'; this.current = 0; this.deadline = null;
    this.answers = []; this.guesses = {}; this.rounds = []; this.excluded = []; this.revealCount = 0;
    const host = this.join(name, now); this.hostId = host.playerId;
  }
  live(now) { if (now >= this.expiresAt) fail('This room has expired.'); }
  player(token) { return this.players.find(p => p.token === token) ?? fail('Please rejoin with your private player token.'); }
  host(token) { if (token !== this.hostToken) fail('Only the host can do that.'); }
  join(name, now = Date.now()) {
    this.live(now);
    if (this.phase !== 'Lobby') fail('This game has already started.');
    if (this.players.length >= 20) fail('This room is full.');
    name = text(name, 1, 24);
    if (this.players.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) fail('That name is already taken.');
    const player = { id: id(), token: id(), name, score: 0, connected: false };
    this.players.push(player);
    return { playerId: player.id, playerToken: player.token };
  }
  eligible() { return this.players.filter(p => !this.excluded.includes(p.id)); }
  startQuestion(now) {
    this.phase = 'Answering'; this.answers = []; this.guesses = {}; this.excluded = []; this.revealCount = 0;
    const seconds = this.questions[this.current].seconds;
    this.deadline = seconds === null ? null : now + seconds * 1000;
  }
  tick(now = Date.now()) {
    this.live(now);
    if (this.phase === 'Answering' && this.deadline !== null && now >= this.deadline) this.closeAnswers();
  }
  closeAnswers() {
    this.deadline = null;
    // Random UUIDs and one fixed cryptographic shuffle conceal join/submission order.
    for (let i = this.answers.length - 1; i > 0; i--) {
      const j = cryptoApi.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      [this.answers[i], this.answers[j]] = [this.answers[j], this.answers[i]];
    }
    this.phase = 'Guessing';
    // All non-excluded roster members may guess, including players who skipped.
    if (this.answers.length < 2 || !this.eligible().length) this.score();
  }
  score() {
    if (this.phase !== 'Guessing') fail('The round is already scored.');
    const points = {};
    for (const p of this.players) {
      const assignments = this.guesses[p.id] ?? [];
      points[p.id] = assignments.filter(g => this.answers.some(a => a.id === g.answerId && a.owner === g.playerId && a.owner !== p.id)).length;
      p.score += points[p.id];
    }
    this.rounds.push(points); this.phase = 'Revealing'; this.revealCount = Math.min(1, this.answers.length);
  }
  allGuessed() { if (this.eligible().every(p => Object.hasOwn(this.guesses, p.id))) this.score(); }
  command(token, hostToken, intent, now = Date.now()) {
    if (!intent || typeof intent.type !== 'string') fail('Invalid message.');
    this.tick(now);
    const p = this.player(token);
    if (['start_game', 'advance_reveal', 'finish_reveal', 'next_question', 'exclude_player', 'end_game'].includes(intent.type)) this.host(hostToken);
    if (['submit_answer', 'update_answer', 'submit_guesses', 'advance_reveal', 'finish_reveal', 'next_question', 'exclude_player'].includes(intent.type) && intent.questionId !== this.questions[this.current].id) fail('This question has changed. Refresh your view.');
    switch (intent.type) {
      case 'start_game':
        this.host(hostToken);
        if (this.phase !== 'Lobby') fail('The game has already started.');
        if (this.players.length < 3) fail('Need at least 3 players.');
        this.startQuestion(now); break;
      case 'submit_answer': case 'update_answer': {
        if (this.phase !== 'Answering' || this.excluded.includes(p.id)) fail('Answering has closed.');
        const value = text(intent.text, 1, 120);
        const existing = this.answers.find(a => a.owner === p.id);
        if (existing) existing.text = value;
        else this.answers.push({ id: id(), owner: p.id, text: value });
        if (this.eligible().every(p => this.answers.some(a => a.owner === p.id))) this.closeAnswers();
        break;
      }
      case 'submit_guesses': {
        if (this.phase !== 'Guessing' || this.excluded.includes(p.id)) fail('Guessing has closed.');
        if (Object.hasOwn(this.guesses, p.id)) fail('Your guesses are already submitted.');
        const g = intent.assignments;
        const owners = new Set(this.answers.map(a => a.owner));
        if (!Array.isArray(g) || g.length !== this.answers.length || g.some(x => !x || !this.answers.some(a => a.id === x.answerId) || !owners.has(x.playerId)) || new Set(g.map(x => x.answerId)).size !== g.length || new Set(g.map(x => x.playerId)).size !== g.length) fail('Match every answer to a different eligible player.');
        this.guesses[p.id] = g.map(x => ({ answerId: x.answerId, playerId: x.playerId }));
        this.allGuessed(); break;
      }
      case 'exclude_player': {
        this.host(hostToken);
        if (!['Answering', 'Guessing'].includes(this.phase)) fail('No active round.');
        const target = this.players.find(x => x.id === intent.playerId);
        if (!target || target.connected || target.id === this.hostId) fail('Only disconnected participants can be excused.');
        if (!this.excluded.includes(target.id)) this.excluded.push(target.id);
        // Keep existing answers as matching candidates; exclusion only waives readiness.
        if (this.phase === 'Guessing') this.allGuessed();
        else if (this.eligible().every(p => this.answers.some(a => a.owner === p.id))) this.closeAnswers();
        break;
      }
      case 'advance_reveal':
        this.host(hostToken); if (this.phase !== 'Revealing' || this.revealCount >= this.answers.length) fail('All answers are already revealed.');
        this.revealCount++; break;
      case 'finish_reveal':
        this.host(hostToken); if (this.phase !== 'Revealing' || this.revealCount < this.answers.length) fail('Reveal is not ready.');
        this.phase = this.current === this.questions.length - 1 ? 'Finished' : 'QuestionComplete'; break;
      case 'next_question':
        this.host(hostToken); if (this.phase !== 'QuestionComplete') fail('Finish this round first.');
        this.current++; this.startQuestion(now); break;
      case 'end_game':
        this.host(hostToken); if (this.phase === 'Finished') fail('The game is already finished.'); this.phase = 'Finished'; this.deadline = null; break;
      default: fail('Unknown action.');
    }
  }
  view(token, now = Date.now()) {
    this.live(now); const me = this.player(token);
    const revealed = ['Revealing', 'QuestionComplete', 'Finished'].includes(this.phase);
    const visible = revealed || this.phase === 'Guessing';
    const ordered = [...this.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return {
      code: this.code, phase: this.phase, serverNow: now, expiresAt: this.expiresAt,
      current: this.current, total: this.questions.length,
      question: this.questions[this.current], deadline: this.deadline, revealCount: this.revealCount,
      me: me.id, isHost: me.id === this.hostId,
      players: this.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected, host: p.id === this.hostId, answered: this.answers.some(a => a.owner === p.id), guessed: Object.hasOwn(this.guesses, p.id), excluded: this.excluded.includes(p.id) })),
      answers: visible ? this.answers.map((a, i) => ({ id: a.id, text: a.text, ...(revealed && (this.phase !== 'Revealing' || i < this.revealCount) ? { owner: a.owner } : {}) })) : [],
      authors: visible ? this.players.filter(p => this.answers.some(a => a.owner === p.id)).map(p => p.id) : [],
      ownAnswer: this.answers.find(a => a.owner === me.id)?.text ?? '',
      guesses: this.guesses[me.id] ?? null,
      points: revealed && (this.phase !== 'Revealing' || this.revealCount >= this.answers.length) ? this.rounds.at(-1) ?? {} : {},
      leaderboard: ordered.map((p, i) => ({ id: p.id, name: p.name, score: p.score, rank: ordered.findIndex(x => x.score === p.score) + 1 })),
    };
  }
}
