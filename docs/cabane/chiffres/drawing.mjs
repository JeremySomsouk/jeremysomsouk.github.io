export function createDrawing(canvas, { onStart = () => {}, onReset = () => {}, onIdle = () => {} } = {}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let pointer = null, timer, enabled = true;
  ctx.strokeStyle = ctx.fillStyle = '#243e3a';
  ctx.lineWidth = 14;
  ctx.lineCap = ctx.lineJoin = 'round';
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
  }
  function scheduleRecognition() { clearTimeout(timer); if (pointer === null) timer = setTimeout(onIdle, 450); }
  function release() {
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    pointer = null;
  }
  canvas.addEventListener('pointerdown', event => {
    if (!enabled || pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); clearTimeout(timer); pointer = event.pointerId;
    canvas.setPointerCapture(pointer); onStart();
    const [x, y] = point(event);
    ctx.beginPath(); ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y);
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.();
    for (const sample of samples?.length ? samples : [event]) { ctx.lineTo(...point(sample)); ctx.stroke(); }
  });
  function finish(event) { if (event.pointerId !== pointer) return; release(); scheduleRecognition(); }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  return {
    getImageData: () => ctx.getImageData(0, 0, canvas.width, canvas.height),
    scheduleRecognition,
    reset() { clearTimeout(timer); release(); ctx.clearRect(0, 0, canvas.width, canvas.height); onReset(); },
    setEnabled(value) { enabled = value; if (!value) { clearTimeout(timer); release(); } },
  };
}
