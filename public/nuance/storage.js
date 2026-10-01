export const SESSION_KEY = 'nuance.session.v1';
export const LANGUAGE_KEY = 'nuance.language';
export const freshSession = () => ({ version: 1, question: '', criteria: [], options: [], comparisons: [], stage: 0, note: '' });
export function readSession(storage) { const raw = storage.getItem(SESSION_KEY); return raw === null ? null : JSON.parse(raw); }
export function saveSession(storage, session) { storage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function burnSession(storage) { storage.removeItem(SESSION_KEY); if (storage.getItem(SESSION_KEY) !== null) throw new Error('Page remains stored'); return freshSession(); }
export function exportPage(session, observations, t) {
  return [t.exportTitle, '', session.question, '', t.matters, ...session.criteria.map(v => `• ${v}`), '', t.possibilities, ...session.options.map(v => `• ${v}`), '', t.reflection, ...observations, '', t.note, session.note].join('\n');
}
