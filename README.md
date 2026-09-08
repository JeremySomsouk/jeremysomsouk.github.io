# JeremySomsouk.github.io

GitHub Pages publishes the existing site from `docs/`.

## La cabane à découvertes

Developer documentation, code identifiers, and diagnostic logs use English. Interfaces, accessibility labels, and reading texts remain in French.

The menu is available at `/cabane/` and contains two independent activities:

- `/cabane/memory/`: a Rust engine compiled to WebAssembly, with an HTML/CSS interface and local SVG illustrations. Each game contains three randomly shuffled boards with 3, 4, and 5 pairs. Playing again or restarting returns to 3 pairs. Progress is not saved.
- `/cabane/lecture/`: text selection, adjustable text size, a timer below the text, and dated reading history. This activity uses native browser APIs in JavaScript and does not depend on the Memory WASM module.

The pages require no application server, third-party assets, or JavaScript libraries. The SVG illustrations and three sample poems were created for this prototype. No audio is recorded.

### Preview locally

```sh
python3 -m http.server 8765 --directory docs
```

Open `http://localhost:8765/cabane/`. Use an HTTP server rather than opening files directly with `file://`. This server lets you test the activities but does not render the Jekyll resume at the site root.

### Build Memory

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
node --test scripts/reading*.test.mjs
```

### Add reading texts

Edit `docs/cabane/lecture/texts.json`. Each entry contains `id`, `title`, `author`, and `body`. Use `\n` between lines and `\n\n` between stanzas. Content is displayed as plain text without interpreting HTML.

Use a unique, stable identifier. If a text changes significantly, create a new identifier (for example, `my-text-v2`) to distinguish versions in saved records.

The timer measures the full duration between the “Démarrer” (Start) and “Terminer” (Finish) buttons, with no pause option. Text selection is disabled during a reading. Finishing adds the title, text identifier, date, and duration to `localStorage` under `cabane.readings.v1`. Records are shared by users of the same browser and are not synchronized across devices. Clearing browser data deletes them. If saving fails, the interface displays a message and keeps the time visible on the page.

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

### Add an activity

Create a subdirectory under `docs/cabane/` containing its own `index.html`, then add its card to the menu in `docs/cabane/index.html`. Use relative asset paths and `../` to return to the menu.
