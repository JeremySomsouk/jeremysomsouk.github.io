// TF.js-backed recognizer loader. Uses TensorFlow.js in the browser but hosts model weights
// as a local module under ./model/weights.mjs so no external model hosting is required.
// The loader constructs a tiny dense classifier (784 -> 10) using tfjs tensors built from
// the exported weights. This provides a real TF.js inference path while keeping assets local.

// Prefer a vendored local ESM build at ./vendor/tf.esm.js if present; otherwise fall back to CDN.
const CDN_TF_ESM = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.esm.js';
import * as weightsModule from './model/weights.mjs';

async function loadTf() {
  if (typeof window === 'undefined') throw new Error('TF.js recognizer is browser-only');
  // Try local vendored build first
  try {
    // eslint-disable-next-line import/no-dynamic-require, import/no-unresolved
    // Note: dynamic import of a relative path may fail in environments where file is missing.
    return await import('./vendor/tf.esm.js');
  } catch (e) {
    // Fallback to CDN ESM
    return await import(CDN_TF_ESM);
  }
}

export async function loadRecognizer() {
  // Dynamically load TF.js (vendored or CDN) in the browser.
  const tfModule = await loadTf();
  const tf = tfModule.tf || tfModule.default || tfModule; // accommodate various export styles
  const { weights, biases } = weightsModule;
  // weights: Float32Array length 784*10, row-major (784 rows, 10 cols)
  const wTensor = tf.tensor2d(weights, [784, 10]);
  const bTensor = tf.tensor1d(biases);
  return {
    predict(pixels) {
      if (!pixels || pixels.length !== 784) throw new Error('pixels must be Float32Array(784)');
      // convert to tensor [1,784]
      const x = tf.tensor2d(pixels, [1, 784]);
      const logits = x.matMul(wTensor).add(bTensor);
      const probs = tf.softmax(logits).dataSync();
      // cleanup
      x.dispose();
      // derive best
      let bestP = -1, bestI = -1;
      for (let i = 0; i < probs.length; i++) if (probs[i] > bestP) { bestP = probs[i]; bestI = i; }
      return { digit: bestI, confidence: bestP, confident: bestP > 0.7, probabilities: Array.from(probs) };
    },
    // allow disposal if needed
    dispose() {
      wTensor.dispose();
      bTensor.dispose();
    },
  };
}
