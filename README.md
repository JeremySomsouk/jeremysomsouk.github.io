# JeremySomsouk.github.io

GitHub Pages publishes the existing site from `docs/`.

## La cabane à découvertes

Developer documentation, code identifiers, and diagnostic logs use English. Interfaces, accessibility labels, and reading texts remain in French.

The menu is available at `/cabane/` and contains five independent activities:

- `/cabane/memory/`: a Rust engine compiled to WebAssembly, with an HTML/CSS interface and local SVG illustrations. Each game contains three randomly shuffled boards with 3, 4, and 5 pairs. Playing again or restarting returns to 3 pairs. Progress is not saved.
- `/cabane/lecture/`: La Fluence: text selection, adjustable text size, compact fixed reading controls, and dated reading history. The existing `/lecture/` route is preserved for compatibility. This activity uses native browser APIs in JavaScript and does not depend on the game’s WASM module.
- `/cabane/chemin/`: Le Chemin, a 5×5 path puzzle. Start at 1, connect checkpoints in order, and cover every cell exactly once. Drag with touch, mouse, or stylus; use arrow keys after focusing the board. Backtracking removes one segment. Restart keeps the same puzzle; a new puzzle changes its seed.
- `/cabane/calculs/`: Les Petits Calculs, progressive arithmetic with handwritten answers.
- `/cabane/lumiere/`: La Lumière, ten spatial puzzles in two difficulty tiers. Mirrors redirect warm light; prisms split it to wake several ghosts at once. No timer or speed score.

The pages require no application server, third-party assets, or JavaScript libraries. The SVG illustrations and three sample poems were created for this prototype. No audio is recorded.

### Preview locally

```sh
python3 -m http.server 8765 --directory docs
```

Open `http://localhost:8765/cabane/`. Use an HTTP server rather than opening files directly with `file://`. This server lets you test the activities but does not render the Jekyll resume at the site root.

### Build Le Memory

The `docs/cabane/memory/game.wasm` binary is included so that the existing Jekyll deployment can publish `docs/` without changes. Whenever you modify the engine, rebuild this file and commit it alongside the source changes.

```sh
rustup toolchain install 1.96.0 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
bash scripts/build-games.sh
```

The script pins the Rust version to keep builds on the same toolchain, even if another Rust version is installed through Homebrew.

### Run checks

```sh
rustup run 1.96.0 cargo test --manifest-path games/memory/Cargo.toml
rustup run 1.96.0 cargo clippy --manifest-path games/memory/Cargo.toml --all-targets -- -D warnings
node --test scripts/*.test.mjs
```

### Add reading texts

Edit `docs/cabane/lecture/texts.json`. Each entry contains `id`, `title`, `author`, and `body`. Use `\n` between lines and `\n\n` between stanzas. Content is displayed as plain text without interpreting HTML.

Use a unique, stable identifier. If a text changes significantly, create a new identifier (for example, `my-text-v2`) to distinguish versions in saved records.

The menu and activities offer native sharing with an immediate copy-link fallback on failure. A separate copy action stays available while a native share is pending or cancelled; when clipboard access is denied, the URL can be selected manually. La Fluence links include `?text=<stable-id>` and open that text before considering the daily schedule. Unknown IDs show a notice and fall back to the scheduled text. Sharing Le Memory opens the game, without transferring randomized board state or progress.

A live clock updates below the text during reading, separate from the fixed button. The compact controls are mounted outside the main content and follow the visual viewport as mobile browser chrome or zoom changes. CSS fixed positioning is used when the Visual Viewport API is unavailable. Fixed bottom controls show only “Démarrer” then “Terminer”; the duration and “Recommencer” appear in the result after stopping. The timer measures the full duration between the “Démarrer” (Start) and “Terminer” (Finish) buttons, with no pause option. Text selection is disabled during a reading. Finishing adds the title, text identifier, date, and duration to `localStorage` under `cabane.readings.v1`. Records are shared by users of the same browser and are not synchronized across devices. Clearing browser data deletes them. If saving fails, the interface displays a message and keeps the time visible on the page.

### Schedule the default text

Edit `docs/cabane/lecture/schedule.json`, then publish the site as usual. Rebuilding the Rust module is not necessary.

```json
{
  "defaultTextId": "petit-matin-v1",
  "entries": [
    { "from": "2026-09-14", "textId": "bateau-v1" },
    { "from": "2026-09-21", "textId": "jardin-v1" }
  ]
}
```

`from` is an inclusive start date in `YYYY-MM-DD` format. `textId` matches an identifier in `texts.json`. The text with the most recent applicable date remains selected until the next scheduled change. Before the first date, `defaultTextId` applies. Dates must be unique; entries can appear in any order.

The selection is calculated whenever the page opens or reloads, using the device's local date. Users can still select another text from the list. If the schedule is invalid, texts remain available and a message is displayed. The included schedule is an example to replace with actual homework assignments.

### Path puzzles

Le Chemin uses native JavaScript modules under `docs/cabane/chemin/`, with separate generation, rules, state, input, and rendering. It reuses Cabane styles, sharing, and the reading timer. No additional build step is needed.

Generation starts with a full-grid snake path, then reverses sections through adjacent endpoints to vary the route while preserving every cell and adjacency. Checkpoints are distributed along that valid path, including its first and last cells. Generated solutions are validated before play. Generation accepts a seed, dimensions, and difficulty; the first interface exposes a single 5×5 setting. The URL stores `?seed=...`, so reopening or sharing it recreates the puzzle. Progress and times remain session-only.

Multiple solutions may exist; uniqueness and difficulty scoring are outside this first version. There is no daily schedule or saved record. Keyboard play uses Enter or Space to start, arrow keys to move, and Backspace to undo.

### Add an activity

Create a subdirectory under `docs/cabane/` containing its own `index.html`, then add its card to the menu in `docs/cabane/index.html`. Use relative asset paths and `../` to return to the menu.

### Light puzzles

La Lumière uses native ES modules and original inline SVG art, reusing Cabane typography, paper background, buttons, navigation, and sharing. The static files in `docs/cabane/lumiere/` need no compilation and are published by the existing GitHub Pages/Jekyll build. Preview at `http://localhost:8765/cabane/lumiere/` using the server above.

- `engine.mjs`: pure `propagate(level, pieces)` returns `lightPaths`, `illuminatedGhosts`, and `isSolved`. Coordinates are zero-based cell centres, with y increasing downwards. Light travels north/east/south/west, passes through ghosts, reflects on `/` or `\`, and stops at walls or room edges. A prism keeps the straight beam and queues a reflected branch. Each source shares its visited `(x,y,direction)` states across branches, terminating cycles and duplicate continuations without exponential branching. Sources contribute jointly to victory; every ghost must be illuminated in the current state.
- `levels.mjs`: data entries contain `id`, `title`, `width`, `height`, `lights`, `ghosts`, `walls`, `availablePieces` (mirror count), optional `availablePrisms`, optional `tier` (defaults to 1), and an optional tutorial `hint`/`hintType`. Add an entry without changing the engine or renderer. Tier 1 introduces a single reflection, two ghosts in one ray, a wall detour, three reflections, and a 5×5 puzzle combining three ghosts with walls. Tier 2 adds splitting, separate detours, prism cascades, and a final puzzle with two mirrors, two prisms, and five ghosts.
- `state.mjs`: owns separate bounded mirror/prism inventories, legal placement, rotation, movement, removal, and reset independently of the DOM. Lamps, ghosts, walls, and other pieces cannot receive a placed piece. New pieces start at `\`; moving preserves orientation and type. Solved rooms remain visible and locked until restart or room selection.
- `board.mjs` / `art.mjs`: grid, continuous SVG rays, round mirrors, diamond-shaped prisms, sleeping/happy faces, and halos. Animation is brief and respects reduced motion.
- `input.mjs` / `game.mjs`: Pointer Events with capture support mouse, touch, and stylus. Drag a piece from its reserve, tap to rotate, drag it again to move, or return it to the reserve to remove. Invalid drops and cancelled gestures preserve state. The tap alternative is reserve → cell; select a placed piece then use “Déplacer” → cell or “Retirer”. Native buttons also support keyboard activation. Reset and room changes cancel pending gestures.

Run `node --test scripts/lumiere*.test.mjs` for optics, level solutions, inventories, prism branching/feedback loops, and pointer regression coverage, or `node --test scripts/*.test.mjs` for all JavaScript checks. The `Cabane checks` workflow runs these tests, syntax checks, and the official GitHub Pages Jekyll production build, verifies that game assets were published unchanged, and saves the built site as an artifact. No JavaScript lint or TypeScript toolchain is configured in this repository. Progress is session-only, and all ten rooms can be selected freely. There are no coloured rays, sound, persistence, or move limits in this prototype. Physical-device playtesting with children is still needed to assess difficulty and enjoyment.


### Arithmetic and handwriting

`/cabane/calculs/` offers five mixed addition/subtraction questions per round. Level 1 uses operands and answers from 0–9; level 2 uses 0–20 and always includes a two-digit answer. Subtraction never yields a negative result. Completing level 1 offers level 2; both remain selectable for testing. Progress is session-only.

Children draw one digit per canvas, inspect the recognized value, then explicitly validate. Level 2 always shows tens and units, so the UI does not reveal the answer length; blank tens means zero, but units are required. Recognition never receives the expected answer. Editing a stroke invalidates the previous prediction, and pending recognition blocks validation. A digit selector supports correction and keyboard input, including when recognition fails to load.

`/cabane/chiffres/` is the free-drawing diagnostic page. The previously missing HTML, input module, and preprocessing module are now included. Both pages share pointer capture, multi-stroke input, and centered 28×28 preprocessing. Templates now represent complete strokes and use the same normalization as input. The recognizer remains an experimental template matcher, not a learned model; similarity and relative scores are not calibrated accuracy estimates. Real child handwriting accuracy has not been measured. No drawings are uploaded or saved.
