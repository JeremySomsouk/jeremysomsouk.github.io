export function createRound(level, random = Math.random) {
  const max = level === 2 ? 20 : 9;
  const pick = n => Math.floor(random() * n);
  const questions = [];
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    const operator = i % 2 === 0 ? '+' : '−';
    const pool = [];
    for (let a = 0; a <= max; a++) for (let b = 0; b <= max; b++) {
      const answer = operator === '+' ? a + b : a - b;
      if (answer >= 0 && answer <= max && !(level === 2 && i === 0 && answer < 10) && !seen.has(`${a}${operator}${b}`)) pool.push({ a, b, operator, answer });
    }
    const question = pool[pick(pool.length)];
    seen.add(`${question.a}${operator}${question.b}`); questions.push(question);
  }
  return questions;
}
export function readAnswer(digits, level) {
  if (digits.some(d => d !== null && (!Number.isInteger(d) || d < 0 || d > 9))) return null;
  if (level === 1) return digits[0];
  if (digits[1] === null) return null;
  return (digits[0] ?? 0) * 10 + digits[1];
}
