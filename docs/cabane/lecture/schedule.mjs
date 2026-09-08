export function scheduledTextId(schedule, texts, now = new Date()) {
  const ids = new Set(texts.map(text => text.id));
  if (!schedule || !ids.has(schedule.defaultTextId) || !Array.isArray(schedule.entries)) {
    throw new Error('Invalid reading schedule');
  }
  const dates = new Set();
  for (const entry of schedule.entries) {
    if (!entry || typeof entry.from !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.from)
      || !Number.isFinite(Date.parse(`${entry.from}T00:00:00Z`))
      || new Date(`${entry.from}T00:00:00Z`).toISOString().slice(0, 10) !== entry.from
      || dates.has(entry.from) || !ids.has(entry.textId)) {
      throw new Error('Invalid reading schedule entry');
    }
    dates.add(entry.from);
  }
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const active = schedule.entries.filter(entry => entry.from <= today)
    .sort((a, b) => b.from.localeCompare(a.from))[0];
  return active?.textId ?? schedule.defaultTextId;
}
