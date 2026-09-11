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
const burstCount = 3;
const particlesPerBurst = 20;
const rectanglesPerBurst = 14;
const burstDelay = 0.22;
const cleanupDelay = 2600;
let activeCleanup;

function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function originPoint(origin, burstIndex) {
  const rect = origin?.getBoundingClientRect?.();
  const viewportWidth = globalThis.innerWidth ?? Number.POSITIVE_INFINITY;
  const viewportHeight = globalThis.innerHeight ?? Number.POSITIVE_INFINITY;
  if (!rect) return { x: '50vw', y: '45vh' };
  const maximumOriginY = viewportHeight * 0.72;
  const centeredX = rect.left + rect.width / 2;
  const slotOffset = (burstIndex - 1) * viewportWidth * 0.13;
  const slotJitter = (Math.random() - 0.5) * viewportWidth * 0.04;
  const horizontalJitter = Math.min(Math.max(slotOffset + slotJitter, -viewportWidth * 0.15), viewportWidth * 0.15);
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

function createParticle(document, index, burstIndex, origin, viewportScale) {
  const type = index < rectanglesPerBurst ? 'rectangle' : 'star';
  const particle = document.createElement('span');
  const angle = (index / particlesPerBurst) * Math.PI * 2 - Math.PI / 2;
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
  particle.style.setProperty('--delay', `${(burstIndex * burstDelay).toFixed(2)}s`);
  particle.style.setProperty('--start-scale', type === 'star' ? '.25' : '1');
  particle.style.setProperty('--end-scale', type === 'star' ? '1' : '.55');
  particle.style.setProperty('--particle-color', colors[(index + burstIndex + type.length) % colors.length]);
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
    for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
      const burstOrigin = document.createElement('div');
      burstOrigin.className = 'cabane-celebration-burst';
      const point = originPoint(origin, burstIndex);
      burstOrigin.style.setProperty('--origin-x', point.x);
      burstOrigin.style.setProperty('--origin-y', point.y);
      overlay.append(burstOrigin);
    }

    const viewportWidth = globalThis.innerWidth ?? Number.POSITIVE_INFINITY;
    const viewportHeight = globalThis.innerHeight ?? Number.POSITIVE_INFINITY;
    const viewportScale = Math.min(1, Math.max(0.8, Math.min(viewportWidth, viewportHeight) / 500));
    for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
      const burstOrigin = overlay.children[burstIndex];
      for (let index = 0; index < particlesPerBurst; index += 1) {
        createParticle(document, index, burstIndex, burstOrigin, viewportScale);
      }
    }
    document.body.append(overlay);
    timeout = setTimeout(cleanup, cleanupDelay);
  });
  return true;
}
