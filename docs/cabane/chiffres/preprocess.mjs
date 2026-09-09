// Normalize transparent canvas ink to a centered 28×28 image.
export function normalizeDigit({ width, height, data }) {
  let left = width, top = height, right = -1, bottom = -1, mass = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const ink = data[(y * width + x) * 4 + 3] / 255;
    if (ink > 0.1) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); mass += ink; }
  }
  if (mass < 6 || right < left) return null;
  const scale = 20 / Math.max(right - left + 1, bottom - top + 1);
  const raw = new Float32Array(784);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const dx = Math.min(27, Math.floor((x - left) * scale + 3));
    const dy = Math.min(27, Math.floor((y - top) * scale + 3));
    raw[dy * 28 + dx] += data[(y * width + x) * 4 + 3] / 255 * scale * scale;
  }
  let total = 0, cx = 0, cy = 0;
  for (let i = 0; i < 784; i++) { raw[i] = Math.min(1, raw[i]); total += raw[i]; cx += i % 28 * raw[i]; cy += Math.floor(i / 28) * raw[i]; }
  const ox = Math.round(13.5 - cx / total), oy = Math.round(13.5 - cy / total);
  const pixels = new Float32Array(784);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    if (x + ox >= 0 && x + ox < 28 && y + oy >= 0 && y + oy < 28) pixels[(y + oy) * 28 + x + ox] = raw[y * 28 + x];
  }
  return { pixels };
}
