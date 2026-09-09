import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRecognizer } from '../docs/cabane/chiffres/recognizer.mjs';
import { normalizeDigit } from '../docs/cabane/chiffres/preprocess.mjs';

function canvas(w = 100, h = 100) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
function circle(image, cx, cy, r, alpha = 255) {
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r * r) image.data[(y * image.width + x) * 4 + 3] = alpha;
  }
  return image;
}

test('recognizer loads and returns the required shape', async () => {
  const recognizer = await loadRecognizer();
  assert.equal(typeof recognizer.predict, 'function');
  const zero = new Float32Array(28 * 28);
  const r = recognizer.predict(zero);
  assert.equal(typeof r.digit, 'number');
  assert.equal(typeof r.confidence, 'number');
  assert.equal(typeof r.confident, 'boolean');
  assert.equal(Array.isArray(r.probabilities), true);
  assert.equal(r.probabilities.length, 10);
  const sum = r.probabilities.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6);
});

test('recognizer handles a simple synthetic digit image', async () => {
  const recognizer = await loadRecognizer();
  const img = circle(canvas(100, 100), 50, 50, 30, 255);
  const normalized = normalizeDigit(img);
  assert.ok(normalized && normalized.pixels.length === 28 * 28);
  const r2 = recognizer.predict(normalized.pixels);
  assert.equal(typeof r2.digit, 'number');
  assert.ok(r2.confidence >= 0 && r2.confidence <= 1);
  assert.equal(r2.probabilities.length, 10);
});
