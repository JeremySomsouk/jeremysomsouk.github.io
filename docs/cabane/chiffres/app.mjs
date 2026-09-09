import { createDrawing } from './drawing.mjs';
import { normalizeDigit } from './preprocess.mjs';
// Try loading a TF.js-backed recognizer when available; fall back to the lightweight procedural recognizer.
let loadRecognizer = null;
try {
  // Defer dynamic import to initialization so it doesn't block module parsing in browsers that
  // don't need TF.js or in test environments. A runtime attempt happens in initialize().
  // Placeholder here for variable used later.
} catch (e) { }


const result = document.querySelector('#result');
const confidence = document.querySelector('#confidence');
const status = document.querySelector('#engine-status');
const retry = document.querySelector('#retry');
const probabilities = document.querySelector('#probabilities');
const preview = document.querySelector('#normalized').getContext('2d');
let recognizer = null;
let loading = false;

function clearResult() {
  result.textContent = '';
  confidence.textContent = '';
  probabilities.textContent = 'Dessine pour voir les résultats.';
  preview.clearRect(0, 0, 28, 28);
}

function showDebug(pixels, prediction) {
  const image = preview.createImageData(28, 28);
  for (let i = 0; i < pixels.length; i += 1) {
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = Math.round(pixels[i] * 255);
    image.data[i * 4 + 3] = 255;
  }
  preview.putImageData(image, 0, 0);
  probabilities.textContent = prediction.probabilities
    .map((probability, digit) => ({ probability, digit }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map(({ digit, probability }) => `${digit} : ${Math.round(probability * 100)} %`)
    .join('\n');
}

const drawing = createDrawing(document.querySelector('#drawing'), {
  onStart: clearResult,
  onReset: clearResult,
  onIdle() {
    if (!recognizer) return;
    try {
      const normalized = normalizeDigit(drawing.getImageData());
      if (!normalized) return;
      const prediction = recognizer.predict(normalized.pixels);
      result.textContent = prediction.confident ? `Je reconnais : ${prediction.digit}` : 'Je ne suis pas sûr. Essaie encore.';
      confidence.textContent = prediction.confident ? `Confiance : ${Math.round(prediction.confidence * 100)} %` : '';
      showDebug(normalized.pixels, prediction);
    } catch {
      status.textContent = 'La reconnaissance a rencontré un problème.';
      retry.hidden = false;
      recognizer = null;
    }
  },
});

document.querySelector('#clear').addEventListener('click', () => drawing.reset());
retry.addEventListener('click', initialize);

async function initialize() {
  if (loading) return;
  loading = true;
  retry.hidden = true;
  status.textContent = 'Chargement de la reconnaissance…';
  try {
    // Prefer TF.js-backed recognizer if available in the browser and the model assets exist.
    if (!loadRecognizer) {
      try {
        // Attempt to dynamically import the TF.js recognizer which will in turn load TF.js from CDN.
        const mod = await import('./recognizer_tf.mjs');
        loadRecognizer = mod.loadRecognizer;
      } catch (e) {
        // Fallback to the lightweight procedural recognizer bundled in the repo.
        // This keeps tests and server-side environments working without TF.js.
        // eslint-disable-next-line import/no-unresolved
        const fallback = await import('./recognizer.mjs');
        loadRecognizer = fallback.loadRecognizer;
      }
    }
    recognizer = await loadRecognizer();
    status.textContent = 'Prêt. La reconnaissance se lance après ton tracé.';
    drawing.scheduleRecognition();
  } catch (err) {
    console.error('Initialize recognizer failed', err);
    status.textContent = 'Chargement impossible. Vérifie ta connexion et réessaie.';
    retry.hidden = false;
  } finally {
    loading = false;
  }
}

initialize();
