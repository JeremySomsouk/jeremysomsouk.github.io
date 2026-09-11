export function createRiverGame(engine, { celebrate = () => {} } = {}) {
  let levelIndex = 0;
  let celebrated = false;

  const load = level => {
    if (!engine.start(level)) return false;
    levelIndex = level;
    celebrated = false;
    return true;
  };

  const game = {
    get levelIndex() { return levelIndex; },
    get rows() { return engine.rows(); },
    get cols() { return engine.cols(); },
    get isSolved() { return engine.is_solved() === 1; },
    get moveCount() { return engine.move_count(); },
    get celebrated() { return celebrated; },
    tile(row, col) { return engine.tile(row, col); },
    isWet(row, col) { return engine.is_wet(row, col) === 1; },
    isWatered(row, col) { return engine.is_watered(row, col) === 1; },
    get progress() {
      let total = 0;
      let watered = 0;
      for (let row = 0; row < engine.rows(); row += 1) {
        for (let col = 0; col < engine.cols(); col += 1) {
          if (engine.tile(row, col) === 5) {
            total += 1;
            watered += engine.is_watered(row, col);
          }
        }
      }
      return `${watered} / ${total} plantes arrosées`;
    },
    tap(row, col) { return engine.tap(row, col) === 1; },
    undo() { return engine.undo() === 1; },
    start(level) { return load(level); },
    restart() { return load(levelIndex); },
    next() { return load((levelIndex + 1) % engine.level_count()); },
    celebrate(origin = 'result') {
      if (!game.isSolved || celebrated) return false;
      celebrated = true;
      celebrate(origin);
      return origin;
    },
  };

  load(0);
  return game;
}
