// Pure, deterministic optics. Coordinates describe cell centres; y grows downwards.
export const directions = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const reflections = {
  '/': { N: 'E', E: 'N', S: 'W', W: 'S' },
  '\\': { N: 'W', W: 'N', S: 'E', E: 'S' },
};
export const cellKey = ({ x, y }) => `${x},${y}`;
export const inside = (level, { x, y }) => Number.isInteger(x) && Number.isInteger(y)
  && x >= 0 && y >= 0 && x < level.width && y < level.height;

export function reflect(direction, orientation) {
  const result = reflections[orientation]?.[direction];
  if (!result) throw new Error('Invalid mirror orientation or light direction');
  return result;
}

export function propagate({ width, height, lights, ghosts, walls }, pieces = []) {
  const blocked = new Set(walls.map(cellKey));
  const reflectors = new Map(pieces.map(piece => [cellKey(piece), piece]));
  const targets = new Map(ghosts.map(ghost => [cellKey(ghost), ghost.id]));
  const illuminated = new Set();
  const lightPaths = [];
  for (const light of lights) {
    // Sharing visited states across a source's branches also stops prism feedback loops.
    const visited = new Set();
    const branches = [{ ...light }];
    for (let branchIndex = 0; branchIndex < branches.length; branchIndex++) {
      let { x, y, direction } = branches[branchIndex];
      if (!directions[direction]) throw new Error('Invalid light direction');
      const points = [{ x, y }];
      let stoppedBy;
      while (true) {
        const state = `${x},${y},${direction}`;
        if (visited.has(state)) { stoppedBy = 'loop'; break; }
        visited.add(state);
        const [dx, dy] = directions[direction];
        const next = { x: x + dx, y: y + dy };
        if (!inside({ width, height }, next) || blocked.has(cellKey(next))) {
          // Stop exactly at the edge of the room or the near face of a wall.
          points.push({ x: x + dx / 2, y: y + dy / 2 });
          stoppedBy = inside({ width, height }, next) ? 'wall' : 'edge';
          break;
        }
        ({ x, y } = next);
        points.push({ x, y });
        const key = cellKey(next);
        if (targets.has(key)) illuminated.add(targets.get(key));
        const piece = reflectors.get(key);
        if (piece?.type === 'prism') branches.push({ x, y, direction: reflect(direction, piece.orientation) });
        else if (piece) direction = reflect(direction, piece.orientation);
      }
      lightPaths.push({ sourceId: light.id, points, stoppedBy });
    }
  }
  return {
    lightPaths,
    illuminatedGhosts: [...illuminated],
    isSolved: ghosts.length > 0 && ghosts.every(ghost => illuminated.has(ghost.id)),
  };
}
