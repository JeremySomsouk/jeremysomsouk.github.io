export async function loadEngine({
  url = './game.wasm',
  fetch: load = globalThis.fetch,
  instantiate = (bytes, imports) => WebAssembly.instantiate(bytes, imports),
} = {}) {
  const response = await load(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const { instance } = await instantiate(bytes);
  return instance.exports;
}
