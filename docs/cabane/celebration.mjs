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
const particleCount = 60;
const waveSize = 20;
const rectanglesPerWave = 14;
const waveDelay = 0.16;
const cleanupDelay = 2600;
let activeCleanup;

function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function originPoint(origin) {
  const rect = origin?.getBoundingClientRect?.();
  const viewportWidth = globalThis.innerWidth ?? Number.POSITIVE_INFINITY;
  const viewportHeight = globalThis.innerHeight ?? Number.POSITIVE_INFINITY;
  if (!rect) return { x: '50vw', y: '45vh' };
  const maximumOriginY = viewportHeight * 0.72;
  const centeredX = rect.left + rect.width / 2;
  const horizontalJitter = (Math.random() - 0.5) * viewportWidth * 0.12;
  return {
    x: `${Math.round(Math.min(Math.max(centeredX + horizontalJitter, 0), viewportWidth))}px`,
    y: `${Math.round(Math.min(Math.max(rect.top + rect.height / 2, 0), maximumOriginY))}px`,
  };
}

function requestFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    const frameId = globalThis.requestAnimationFrame(callback);
    return () => globalThis.cancelAnimationFrame?.(frameId);
  }
  const timeoutId = setTimeout(callback, 0);
  return () => clearTimeout(timeoutId);
}

function createParticle(document, index, origin, viewportScale) {
  const wave = Math.floor(index / waveSize);
  const positionInWave = index % waveSize;
  const type = positionInWave < rectanglesPerWave ? 'rectangle' : 'star';
  const particle = document.createElement('span');
  const angle = (positionInWave / waveSize) * Math.PI * 2 - Math.PI / 2 + wave * 0.18;
  const baseDistance = type === 'star' ? 80 + Math.random() * 70 : 100 + Math.random() * 120;
  const distance = baseDistance * viewportScale;
  const rotation = (Math.random() * 2 - 1) * 240;
  const duration = 1.35 + Math.random() * 0.4;
  const driftX = (Math.random() - 0.5) * 96;
  particle.className = `cabane-celebration-${type}`;
  particle.style.setProperty('--x', `${Math.round(Math.cos(angle) * distance)}px`);
  particle.style.setProperty('--y', `${Math.round(Math.sin(angle) * distance)}px`);
  particle.style.setProperty('--drift-x', `${Math.round(driftX)}px`);
  particle.style.setProperty('--rotation', `${Math.round(rotation)}deg`);
  particle.style.setProperty('--duration', `${duration.toFixed(2)}s`);
  particle.style.setProperty('--delay', `${(wave * waveDelay).toFixed(2)}s`);
  particle.style.setProperty('--start-scale', type === 'star' ? '.25' : '1');
  particle.style.setProperty('--end-scale', type === 'star' ? '1' : '.55');
  particle.style.setProperty('--particle-color', colors[(index + type.length) % colors.length]);
  origin.append(particle);
  return particle;
}

export function celebrate(origin = document.body) {
  if (prefersReducedMotion()) return false;

  activeCleanup?.();

  let overlay;
  let timeout;
  let cancelFrame = () => {};
  function cleanup() {
    cancelFrame();
    clearTimeout(timeout);
    overlay?.remove();
    if (activeCleanup === cleanup) activeCleanup = null;
  }
  activeCleanup = cleanup;

  cancelFrame = requestFrame(() => {
    cancelFrame = () => {};
    overlay = document.createElement('div');
    overlay.className = 'cabane-celebration';
    overlay.setAttribute('aria-hidden', 'true');
    const point = originPoint(origin);
    overlay.style.setProperty('--origin-x', point.x);
    overlay.style.setProperty('--origin-y', point.y);

    const viewportWidth = globalThis.innerWidth ?? Number.POSITIVE_INFINITY;
    const viewportHeight = globalThis.innerHeight ?? Number.POSITIVE_INFINITY;
    const viewportScale = Math.min(1, Math.max(0.8, Math.min(viewportWidth, viewportHeight) / 500));
    for (let index = 0; index < particleCount; index += 1) {
      createParticle(document, index, overlay, viewportScale);
    }
    document.body.append(overlay);
    timeout = setTimeout(cleanup, cleanupDelay);
  });
  return true;
}
