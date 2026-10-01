export function connectEngine(instance) {
  const api = instance.exports;
  const analyze = session => {
    if (!session || typeof session.question !== 'string' || typeof session.note !== 'string'
        || [...session.question].length > 2000 || [...session.note].length > 4000
        || !Array.isArray(session.criteria) || !Array.isArray(session.options)
        || [session.criteria, session.options].some(labels => labels.some(label => typeof label !== 'string' || !label.trim() || [...label].length > 80) || new Set(labels).size !== labels.length)) {
      throw new Error('Invalid page');
    }
    // The model needs relationships, not writing. Keep private text out of Wasm memory.
    const model = { ...session, question: '', note: '', criteria: session.criteria.map((_, i) => String(i)), options: session.options.map((_, i) => String(i)) };
    const bytes = new TextEncoder().encode(JSON.stringify(model));
    if (bytes.length > 65536) throw new Error('Page too large');
    const ptr = api.input(bytes.length);
    new Uint8Array(api.memory.buffer, ptr, bytes.length).set(bytes);
    const len = api.analyze();
    if (!len) throw new Error('Invalid page');
    return JSON.parse(new TextDecoder().decode(new Uint8Array(api.memory.buffer, api.output(), len)));
  };
  analyze.clear = () => api.clear();
  return analyze;
}
export async function openEngine() {
  const response = await fetch('./engine.wasm');
  if (!response.ok) throw new Error('Could not open engine');
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
  return connectEngine(instance);
}
