// Small teaching sequence for the curated two-route board. Search stays in Rust.
import { ABSENT } from './engine.js';
export function canEdit(snapshot, index, lesson, baseline = snapshot) {
  const node = snapshot.nodes[index];
  if (!node?.editable || index === snapshot.start || index === snapshot.target) return false;
  if (lesson === 'energy') return baseline.nodes[index].cost > 1 && baseline.nodes[index].cost !== ABSENT;
  if (lesson === 'obstacle') return index !== snapshot.checkpoint;
  return true;
}
export function routeEnergy(snapshot, row) {
  const route = snapshot.nodes.filter(node => node.y === row);
  if (route.some(node => node.cost === ABSENT)) return null;
  // The start costs zero; entering the finish costs its displayed energy.
  return route.reduce((total, node) => total + node.cost, snapshot.nodes[snapshot.target].cost);
}
