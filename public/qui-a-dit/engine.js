export function validateEdition(e) {
  const fail = message => { throw new Error(message); };
  if(e?.version !== 1 || !e.id || typeof e.demo !== 'boolean' || !Array.isArray(e.speakers) || !Array.isArray(e.rounds) || !e.rounds.length) fail('Édition invalide');
  const ids = new Set(e.speakers.map(s => s.id));
  if(ids.size !== e.speakers.length || ids.size < 2 || e.speakers.some(s => !s.id || !s.name)) fail('Personnalités invalides');
  const rounds = new Set(), quotes = new Set();
  for(const r of e.rounds) {
    if(!r.id || rounds.has(r.id) || !r.topic || !Array.isArray(r.statements) || r.statements.length !== ids.size) fail('Manche invalide');
    rounds.add(r.id); const authors = new Set();
    for(const q of r.statements) {
      if(!q.id || quotes.has(q.id) || !q.text || !ids.has(q.speakerId) || authors.has(q.speakerId) || !q.source?.title || !q.source.context) fail('Déclaration invalide');
      if(!e.demo && (!/^https:\/\//.test(q.source.url || '') || !/^\d{4}-\d{2}-\d{2}$/.test(q.source.date || ''))) fail('Source datée requise');
      quotes.add(q.id); authors.add(q.speakerId);
    }
  }
  return e;
}
export function assign(matches, statementId, speakerId) {
  const next = Object.fromEntries(Object.entries(matches).filter(([q,s]) => q !== statementId && s !== speakerId));
  if(speakerId) next[statementId] = speakerId;
  return next;
}
export function evaluate(round, speakers, matches) {
  const allowed = new Set(speakers.map(s => s.id));
  const values = round.statements.map(q => matches[q.id]);
  if(Object.keys(matches).length !== round.statements.length || values.some(s => !allowed.has(s)) || new Set(values).size !== values.length) throw new Error('Associez toutes les déclarations avant de révéler.');
  return round.statements.map(q => ({id:q.id, correct:matches[q.id] === q.speakerId}));
}
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
