import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReadingTimer, formatDuration } from '../docs/cabane/lecture/timer.mjs';

test('timer measures the full reading despite delayed display updates and saves once', () => {
  let now = 0;
  const timer = new ReadingTimer(() => now);
  assert.equal(timer.stop(), null);
  assert.equal(timer.start(), true);
  assert.equal(timer.start(), false);
  now = 1500;
  assert.equal(timer.elapsed(), 1500);
  now = 70500;
  assert.equal(timer.stop(), 70500);
  assert.equal(timer.stop(), null);
  now = 90000;
  assert.equal(formatDuration(timer.elapsed()), '01:10.5');
  timer.start();
  assert.equal(timer.elapsed(), 0);
});

test('reset clears the previous reading and formatting handles minute boundaries', () => {
  let now = 0;
  const timer = new ReadingTimer(() => now);
  timer.start();
  now = 1234;
  assert.equal(timer.stop(), 1234);
  timer.reset();
  assert.equal(timer.elapsed(), 0);
  assert.equal(timer.state, 'idle');
  assert.equal(formatDuration(59999), '00:59.9');
  assert.equal(formatDuration(60000), '01:00.0');
});
