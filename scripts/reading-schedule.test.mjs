import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduledTextId } from '../docs/cabane/lecture/schedule.mjs';

const texts = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
const schedule = {
  defaultTextId: 'first',
  entries: [
    { from: '2026-09-21', textId: 'third' },
    { from: '2026-09-14', textId: 'second' },
  ],
};

test('selects the latest applicable date, including its first day, regardless of entry order', () => {
  assert.equal(scheduledTextId(schedule, texts, new Date(2026, 8, 13, 23, 59)), 'first');
  assert.equal(scheduledTextId(schedule, texts, new Date(2026, 8, 14)), 'second');
  assert.equal(scheduledTextId(schedule, texts, new Date(2026, 8, 20)), 'second');
  assert.equal(scheduledTextId(schedule, texts, new Date(2026, 8, 21)), 'third');
  assert.equal(scheduledTextId(schedule, texts, new Date(2027, 0, 1)), 'third');
});

test('uses the local calendar day instead of the UTC date', () => {
  const localDate = {
    getFullYear: () => 2026,
    getMonth: () => 8,
    getDate: () => 14,
    toISOString: () => '2026-09-13T22:00:00.000Z',
  };
  assert.equal(scheduledTextId(schedule, texts, localDate), 'second');
});

test('rejects unknown texts, duplicate dates and impossible calendar dates', () => {
  for (const entries of [
    [{ from: '2026-02-30', textId: 'second' }],
    [{ from: '2026-09-14', textId: 'missing' }],
    [{ from: '14/09/2026', textId: 'second' }],
    [{ from: '2026-09-14', textId: 'second' }, { from: '2026-09-14', textId: 'third' }],
  ]) {
    assert.throws(() => scheduledTextId({ ...schedule, entries }, texts));
  }
  assert.throws(() => scheduledTextId({ ...schedule, defaultTextId: 'missing' }, texts));
});
