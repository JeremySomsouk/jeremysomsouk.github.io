import { celebrate } from '../celebration.mjs';
import { createRiverApp } from './app.mjs';

try {
  createRiverApp({ document, celebrate });
} catch (error) {
  document.getElementById('instructions').textContent = 'Le paysage n’a pas pu se charger. Recharge la page pour réessayer.';
  document.getElementById('retry').hidden = false;
  console.error('La Rivière:', error);
}
document.getElementById('retry').addEventListener('click', () => location.reload());
