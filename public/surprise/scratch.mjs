import { createMusic } from './music.mjs';

const music = createMusic();
const revealThreshold = .42;
const area = document.querySelector('#scratch-area');
const canvas = document.querySelector('#coating');
const secret = document.querySelector('#secret');
const label = document.querySelector('#scratch-label');
const revealButton = document.querySelector('#reveal');
const announcement = document.querySelector('#announcement');
const confetti = document.querySelector('#confetti');
const memes = document.querySelector('#memes');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
let revealed = false;
let pointer = null;
let previous = null;
let lastCheck = 0;

function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#d85a8c', '#efbd43', '#9b80cf', '#77aa83', '#f4a7bd', '#65b6cb'];
  const bounds = area.getBoundingClientRect();
  for (let i = 0; i < 160; i++) {
    const piece = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 400;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 150;
    const duration = 1.6 + Math.random() * 1.2;
    const spin = Math.random() * 1080 - 540;
    piece.style.left = `${bounds.left + bounds.width * (.2 + (i % 3) * .3)}px`;
    piece.style.top = `${bounds.top + bounds.height * .5}px`;
    piece.style.opacity = '0';
    piece.style.setProperty('--color', colors[i % colors.length]);
    confetti.append(piece);
    const frames = Array.from({ length: 21 }, (_, step) => {
      const progress = step / 20;
      const time = progress * duration;
      return {
        transform: `translate(${vx * time}px, ${vy * time + 300 * time * time}px) rotate(${spin * progress}deg)`,
        opacity: progress < .8 ? 1 : (1 - progress) / .2,
        offset: progress,
      };
    });
    piece.animate(frames, { duration: duration * 1000, delay: (i % 3) * 200 + Math.random() * 60, easing: 'linear', fill: 'forwards' });
  }
  setTimeout(() => confetti.replaceChildren(), 3500);
}

function reveal(withConfetti = true) {
  if (revealed) return;
  revealed = true;
  music.reveal();
  pointer = null;
  area.classList.add('revealed');
  secret.hidden = false;
  secret.removeAttribute('aria-hidden');
  const moveFocus = document.activeElement === revealButton;
  revealButton.hidden = true;
  memes.hidden = false;
  announcement.textContent = 'Notre troisième enfant est une fille !';
  if (moveFocus) secret.focus({ preventScroll: true });
  if (withConfetti) celebrate();
}

function sizeCoating(preserve = false) {
  const bounds = area.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = Math.round(bounds.width * ratio);
  const height = Math.round(bounds.height * ratio);
  if (preserve && canvas.width === width && canvas.height === height) return;
  const saved = preserve ? document.createElement('canvas') : null;
  if (saved) {
    saved.width = canvas.width;
    saved.height = canvas.height;
    saved.getContext('2d').drawImage(canvas, 0, 0);
  }
  canvas.width = width;
  canvas.height = height;
  if (saved) {
    ctx.drawImage(saved, 0, 0, width, height);
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#d4d1d9');
  gradient.addColorStop(.35, '#eeecf0');
  gradient.addColorStop(.65, '#c9c6d0');
  gradient.addColorStop(1, '#e3e0e7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff40';
  for (let y = 8 * ratio; y < height; y += 14 * ratio) {
    for (let x = 8 * ratio; x < width; x += 14 * ratio) {
      ctx.beginPath();
      ctx.arc(x, y, .7 * ratio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function checkProgress() {
  if (revealed) return;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let cleared = 0;
  let total = 0;
  for (let y = 8; y < canvas.height; y += 16) {
    for (let x = 8; x < canvas.width; x += 16) {
      total++;
      if (data[(y * canvas.width + x) * 4 + 3] < 128) cleared++;
    }
  }
  if (total) {
    music.progress(cleared / total / revealThreshold);
    if (cleared / total >= revealThreshold) reveal();
  }
}

function scratch(event) {
  const bounds = canvas.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const point = { x: (event.clientX - bounds.left) * scale, y: (event.clientY - bounds.top) * scale };
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 48 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo((previous || point).x, (previous || point).y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 24 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) > scale) {
    music.sparkle(point.x / canvas.width);
  }
  previous = point;
  if (performance.now() - lastCheck > 120) {
    lastCheck = performance.now();
    checkProgress();
  }
}

revealButton.addEventListener('click', () => {
  music.start();
  reveal();
});

if (ctx) {
  sizeCoating();
  revealButton.hidden = false;
  secret.hidden = false;
  canvas.hidden = false;
  label.hidden = false;
  canvas.addEventListener('pointerdown', event => {
    if (revealed || pointer !== null || event.button !== 0) return;
    music.start();
    pointer = event.pointerId;
    previous = null;
    canvas.setPointerCapture(pointer);
    area.classList.add('scratching');
    scratch(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId === pointer && !revealed) scratch(event);
  });
  const endStroke = event => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    previous = null;
    checkProgress();
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);
  new ResizeObserver(() => {
    previous = null;
    if (!revealed) sizeCoating(true);
  }).observe(area);
} else {
  reveal(false);
}
