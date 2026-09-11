const colors = [
  '#e8aa30',
  '#cc7190',
  '#dc8051',
  '#5f956b',
  '#8583b6',
  '#74a6bd',
  '#cc655d',
  '#cc9d37',
  '#276858',
  '#bd5837',
];
const rectangleCount = 14;
const starCount = 8;
const cleanupDelay = 1800;
let activeCleanup;

function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function originPoint(origin) {
  const rect = origin?.getBoundingClientRect?.();
  const viewportWidth = globalThis.innerWidth ?? Number.POSITIVE_INFINITY;
  const viewportHeight = globalThis.innerHeight ?? Number.POSITIVE_INFINITY;
  if (!rect) return { x: '50vw', y: '45vh' };
  return {
    x: `${Math.round(Math.min(Math.max(rect.left + rect.width / 2, 0), viewportWidth))}px`,
    y: `${Math.round(Math.min(Math.max(rect.top + rect.height / 2, 0), viewportHeight))}px`,
  };
}

function createParticle(document, type, index, count, origin) {
  const particle = document.createElement('span');
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const distance = type === 'star' ? 72 + Math.random() * 68 : 92 + Math.random() * 88;
  const rotation = (Math.random() * 2 - 1) * 240;
  const duration = 1.25 + Math.random() * 0.4;
  particle.className = `cabane-celebration-${type}`;
  particle.style.setProperty('--x', `${Math.round(Math.cos(angle) * distance)}px`);
  particle.style.setProperty('--y', `${Math.round(Math.sin(angle) * distance)}px`);
  particle.style.setProperty('--rotation', `${Math.round(rotation)}deg`);
  particle.style.setProperty('--duration', `${duration.toFixed(2)}s`);
  particle.style.setProperty('--start-scale', type === 'star' ? '.25' : '1');
  particle.style.setProperty('--end-scale', type === 'star' ? '1' : '.55');
  particle.style.setProperty('--particle-color', colors[(index + type.length) % colors.length]);
  origin.append(particle);
  return particle;
}

export function celebrate(origin = document.body) {
  if (prefersReducedMotion()) return false;

  activeCleanup?.();
  const overlay = document.createElement('div');
  overlay.className = 'cabane-celebration';
  overlay.setAttribute('aria-hidden', 'true');
  const point = originPoint(origin);
  overlay.style.setProperty('--origin-x', point.x);
  overlay.style.setProperty('--origin-y', point.y);

  const particleCount = rectangleCount + starCount;
  for (let index = 0; index < particleCount; index += 1) {
    createParticle(document, index < rectangleCount ? 'rectangle' : 'star', index, particleCount, overlay);
  }
  document.body.append(overlay);

  const timeout = setTimeout(() => cleanup(), cleanupDelay);
  function cleanup() {
    clearTimeout(timeout);
    overlay.remove();
    if (activeCleanup === cleanup) activeCleanup = null;
  }
  activeCleanup = cleanup;
  return true;
}
