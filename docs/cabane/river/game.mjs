import { celebrate } from '../celebration.mjs';
import { createRiverApp } from './app.mjs';
import { loadEngine } from './engine.mjs';

export async function startRiverPage({
  document = globalThis.document,
  loadEngine: load = loadEngine,
  createApp = createRiverApp,
  celebrate: effect = celebrate,
  console: logger = globalThis.console,
} = {}) {
  if (!document) return;
  const byId = id => document.getElementById(id);
  const board = byId('board');
  const engineStatus = byId('engine-status');
  const retry = byId('retry');
  board.setAttribute('aria-busy', 'true');

  try {
    const engine = await load();
    createApp({ engine, document, celebrate: effect });
    engineStatus.hidden = true;
    retry.hidden = true;
  } catch (error) {
    engineStatus.hidden = false;
    engineStatus.textContent = 'Le jeu n’a pas pu se charger. Recharge la page pour réessayer.';
    retry.hidden = false;
    logger.error(`Failed to load La Rivière: ${error.message}`);
  } finally {
    board.setAttribute('aria-busy', 'false');
  }
}

if (globalThis.document) {
  await startRiverPage();
  document.getElementById('retry')?.addEventListener('click', () => globalThis.location.reload());
}
