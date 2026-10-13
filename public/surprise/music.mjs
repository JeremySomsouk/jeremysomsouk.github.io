export function createMusic() {
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  let context;
  let output;
  let timer;
  let enabled = false;
  let muted = false;
  let enriched = false;
  let finished = false;
  let step = 0;
  let lastSparkle = -Infinity;
  const melody = [67, 72, 76, 74, 72, 69, 67, null, 69, 72, 77, 76, 74, 72, 71, null,
    67, 71, 74, 76, 79, 76, 74, null, 72, 76, 74, 71, 69, 67, 72, null];
  const bass = [48, 53, 55, 48];

  function note(midi, at, duration, volume, bright = false) {
    for (const [multiple, strength] of [[1, 1], [2, .08], [3, bright ? .035 : .015]]) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12) * multiple;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume * strength, at + .055);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.start(at);
      oscillator.stop(at + duration + .03);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }
  }

  function playMelody() {
    if (!enabled || finished || context.state !== 'running' || document.hidden) return;
    const midi = melody[step % melody.length];
    if (midi !== null) note(midi, context.currentTime, 1.8, .028);
    if (enriched && step % 4 === 0) {
      const root = bass[Math.floor(step / 8) % bass.length];
      note(root, context.currentTime, 2.8, .018);
      note(root + 7, context.currentTime + .12, 2.5, .009);
    }
    step++;
  }

  function start() {
    if (!Audio || enabled || muted) return;
    try {
      context ||= new Audio();
      if (!output) {
        output = context.createGain();
        output.gain.value = 0;
        output.connect(context.destination);
      }
      enabled = true;
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setTargetAtTime(.25, context.currentTime, .2);
      context.resume().then(() => {
        if (!enabled) return;
        playMelody();
        if (!timer && !finished) timer = setInterval(playMelody, 650);
      }).catch(stop);
    } catch {
      stop();
    }
  }

  function stop() {
    enabled = false;
    muted = true;
    clearInterval(timer);
    timer = null;
    if (output) {
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setTargetAtTime(0, context.currentTime, .03);
    }
  }

  document.addEventListener('pointerdown', start, { once: true });
  document.addEventListener('keydown', start, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (enabled) context.resume().catch(stop);
  });

  return {
    start,
    sparkle(position) {
      if (!enabled || finished || context.state !== 'running') return;
      const now = context.currentTime;
      if (now - lastSparkle < .14) return;
      lastSparkle = now;
      const notes = [79, 81, 84, 86, 88];
      note(notes[Math.min(4, Math.max(0, Math.floor(position * 5)))], now, .7, .008, true);
    },
    progress(value) { enriched ||= value >= .7; },
    reveal() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      timer = null;
      if (!enabled) return;
      const now = context.currentTime;
      [60, 64, 67, 72, 76].forEach((midi, index) => note(midi, now + index * .07, 3.2, .025, true));
    },
  };
}
