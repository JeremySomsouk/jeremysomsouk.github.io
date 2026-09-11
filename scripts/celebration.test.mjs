import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { celebrate } from '../docs/cabane/celebration.mjs';

class TestElement {
  constructor(tagName, rect = { left: 40, top: 80, width: 320, height: 160, right: 360, bottom: 240 }) {
    this.tagName = tagName;
    this.rect = rect;
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.attributes = new Map();
    this.dataset = {};
    this.style = {
      properties: new Map(),
      setProperty(name, value) { this.properties.set(name, String(value)); },
    };
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this;
      this.children.push(node);
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  remove() {
    this.parentNode?.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

function setupDocument({ reducedMotion = false, viewport = { width: 1024, height: 768 }, rect } = {}) {
  const body = new TestElement('body');
  const origin = new TestElement('section', rect);
  globalThis.innerWidth = viewport.width;
  globalThis.innerHeight = viewport.height;
  globalThis.document = { body, createElement: tagName => new TestElement(tagName) };
  globalThis.matchMedia = query => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
  });
  const frames = [];
  globalThis.requestAnimationFrame = callback => frames.push(callback);
  return { body, origin, frames };
}

function flushFrames(frames) {
  frames.splice(0).forEach(frame => frame());
}

test('a celebration emits rectangles and stars from its origin and removes them after the burst', () => {
  const { body, origin, frames } = setupDocument();
  mock.timers.enable({ apis: ['setTimeout'] });

  assert.equal(celebrate(origin), true);
  flushFrames(frames);
  const overlay = body.children.at(-1);
  assert.equal(overlay.className, 'cabane-celebration');
  assert.equal(overlay.getAttribute('aria-hidden'), 'true');
  assert.equal(overlay.children.length, 60);
  assert.equal(overlay.children.filter(child => child.className === 'cabane-celebration-rectangle').length, 42);
  assert.equal(overlay.children.filter(child => child.className === 'cabane-celebration-star').length, 18);
  assert.equal(overlay.style.properties.get('--origin-x'), '200px');
  assert.equal(overlay.style.properties.get('--origin-y'), '160px');
  for (const particle of overlay.children) {
    for (const property of ['--x', '--y', '--rotation', '--duration', '--delay', '--particle-color']) {
      assert.ok(particle.style.properties.has(property), `${particle.className} has ${property}`);
    }
  }

  mock.timers.tick(2600);
  assert.equal(body.children.length, 0);
  mock.timers.reset();
});

test('starting another celebration replaces an unfinished one instead of stacking overlays', () => {
  const { body, origin, frames } = setupDocument();
  mock.timers.enable({ apis: ['setTimeout'] });

  celebrate(origin);
  flushFrames(frames);
  const first = body.children.at(-1);
  mock.timers.tick(400);
  celebrate(origin);
  flushFrames(frames);
  assert.equal(body.children.length, 1);
  assert.notEqual(body.children.at(-1), first);
  mock.timers.tick(2600);
  assert.equal(body.children.length, 0);
  mock.timers.reset();
});

test('reduced motion creates no particles or timer', () => {
  const { body, origin } = setupDocument({ reducedMotion: true });
  mock.timers.enable({ apis: ['setTimeout'] });

  assert.equal(celebrate(origin), false);
  assert.equal(body.children.length, 0);
  mock.timers.tick(3000);
  assert.equal(body.children.length, 0);
  mock.timers.reset();
});

test('a low mobile completion point keeps the burst inside the viewport', () => {
  const { body, origin, frames } = setupDocument({
    viewport: { width: 375, height: 667 },
    rect: { left: 20, top: 580, width: 335, height: 120, right: 355, bottom: 700 },
  });
  mock.timers.enable({ apis: ['setTimeout'] });

  celebrate(origin);
  flushFrames(frames);
  const overlay = body.children.at(-1);
  assert.equal(overlay.style.properties.get('--origin-x'), '188px');
  assert.equal(overlay.style.properties.get('--origin-y'), '480px');
  mock.timers.tick(2600);
  assert.equal(body.children.length, 0);
  mock.timers.reset();
});

test('a celebration waits one frame so focus-driven scrolling finishes before its origin is measured', () => {
  const { body, origin, frames } = setupDocument({
    viewport: { width: 375, height: 667 },
    rect: { left: 20, top: 580, width: 335, height: 120, right: 355, bottom: 700 },
  });
  mock.timers.enable({ apis: ['setTimeout'] });

  celebrate(origin);
  assert.equal(body.children.length, 0);
  origin.rect = { left: 20, top: 240, width: 335, height: 120, right: 355, bottom: 360 };
  frames.splice(0).forEach(frame => frame());

  const overlay = body.children.at(-1);
  assert.equal(overlay.style.properties.get('--origin-y'), '300px');
  mock.timers.tick(2600);
  assert.equal(body.children.length, 0);
  mock.timers.reset();
});

test('the shared stylesheet keeps the overlay fixed, inert and still under reduced motion', () => {
  const css = readFileSync(new URL('../docs/cabane/celebration.css', import.meta.url), 'utf8');
  assert.match(css, /\.cabane-celebration\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /\.cabane-celebration\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.cabane-celebration-rectangle\s*\{[^}]*border-radius/s);
  assert.match(css, /\.cabane-celebration-star\s*\{[^}]*clip-path:\s*polygon/s);
  assert.match(css, /animation:\s*cabane-celebration-burst\s+var\(--duration\)[^;]*var\(--delay,\s*0s\)\s+both/s);
  assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*\.cabane-celebration-rectangle\s*\{[^}]*width:\s*14px[^}]*height:\s*18px/s);
  assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*\.cabane-celebration-star\s*\{[^}]*width:\s*20px[^}]*height:\s*20px/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.cabane-celebration[^{]*\{[^}]*animation:\s*none/s);
});

test('the five games each wire one celebration at the requested completion point', () => {
  const cases = [
    ['lecture/reading.js', /result\.hidden = false;\s*\n\s*celebrate\(result\)/],
    ['chemin/game.mjs', /game\.status === 'completed' && !celebrated/],
    ['calculs/app.mjs', /\$\('play'\)\.hidden = true; \$\('complete'\)\.hidden = false; celebrate\(\$\('complete'\)\)/],
    ['lumiere/game.mjs', /result\.isSolved && !celebrated/],
    ['memory/game.js', /outcome === 4[\s\S]{0,900}celebrate\(result\)/],
  ];
  for (const [file, completionPattern] of cases) {
    const source = readFileSync(new URL(`../docs/cabane/${file}`, import.meta.url), 'utf8');
    assert.match(source, /import \{ celebrate \} from '\.\.\/celebration\.mjs';/, `${file} imports the shared effect`);
    assert.equal((source.match(/\bcelebrate\(/g) ?? []).length, 1, `${file} calls the effect once`);
    assert.match(source, completionPattern, `${file} guards the intended completion point`);
  }
});
