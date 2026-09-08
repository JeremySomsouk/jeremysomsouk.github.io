import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackReadingViewport } from '../docs/cabane/lecture/viewport.mjs';

test('controls follow the visible bottom through mobile toolbar, keyboard and zoom changes', () => {
  const viewportEvents = {};
  const windowEvents = {};
  const frames = [];
  const values = {};
  const viewport = { offsetTop: 0, offsetLeft: 0, height: 667, width: 375,
    addEventListener(name, callback) { viewportEvents[name] = callback; } };
  const view = { visualViewport: viewport,
    addEventListener(name, callback) { windowEvents[name] = callback; },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; } };
  const controls = { style: { setProperty(name, value) { values[name] = value; } } };
  trackReadingViewport(controls, view);
  assert.equal(values['--controls-top'], '667px');
  assert.equal(values['--controls-width'], '375px');
  viewport.height = 580;
  viewportEvents.resize();
  viewportEvents.scroll();
  assert.equal(frames.length, 1, 'Coalesce viewport changes within the same frame');
  frames.shift()();
  assert.equal(values['--controls-top'], '580px');
  viewport.height = 300;
  viewport.offsetTop = 40;
  viewport.offsetLeft = 30;
  viewport.width = 200;
  viewportEvents.scroll();
  frames.shift()();
  assert.equal(values['--controls-top'], '340px');
  assert.equal(values['--controls-left'], '30px');
  assert.equal(values['--controls-width'], '200px');
  assert.equal(values['--controls-transform'], 'translateY(-100%)');
  viewport.height = 667;
  viewport.offsetTop = 0;
  windowEvents.pageshow();
  frames.shift()();
  assert.equal(values['--controls-top'], '667px');
});

test('browsers without VisualViewport retain the CSS fixed fallback', () => {
  trackReadingViewport({ style: { setProperty() { assert.fail('Keep CSS defaults'); } } }, {});
});
