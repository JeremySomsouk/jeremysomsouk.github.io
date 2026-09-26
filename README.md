# Jeremy Somsouk

This repository publishes my public site and the interactive **Cabane à découvertes** prototype collection.

- Live site: <https://www.somsouk.fr/>
- Cabane: <https://www.somsouk.fr/cabane/>

![La cabane à découvertes](docs/cabane/images/welcome.webp)

## Contents

The site is split into two parts:

- `docs/` is the GitHub Pages site.
- `games/` contains the Rust engine compiled to WebAssembly.
- `scripts/` contains build and test scripts.

### La cabane à découvertes

Cabane is a small set of browser activities for reading and play:

- **La Fluence** reads a text aloud with a timer and simple reading controls.
- **Le Memory** plays a matching game with illustrated cards.
- **Le Chemin** asks you to connect every square on a grid without crossing your path.
- **Les Petits Calculs** asks you to write arithmetic answers by hand.
- **La Lumière** uses mirrors and prisms to wake sleeping ghosts.
- **La Rivière** offers thirty touch-first landscapes: scratch soft earth to release water and make ponds bloom. Levels 20 to 30 introduce paired underground passages across disconnected riverbanks, followed by branching routes and sluices.

All activities are static files and run without a server or third-party dependencies.

## Preview locally

Run a local static server:

```sh
python3 -m http.server 8765 --directory docs
```

Open `http://localhost:8765/cabane/`.

## Build

Cabane’s Memory engine uses Rust and WebAssembly. To build it:

```sh
rustup toolchain install 1.96.0 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
bash scripts/build-games.sh
```

## Checks

Run the test suites:

```sh
rustup run 1.96.0 cargo test --manifest-path games/memory/Cargo.toml
rustup run 1.96.0 cargo clippy --manifest-path games/memory/Cargo.toml --all-targets -- -D warnings
node --test scripts/*.test.mjs
```

## Structure

- `docs/`: Jekyll and static site files
- `games/memory/`: Rust source for the Memory engine
- `scripts/`: Build and test helpers
- `docs/cabane/`: Cabane activity pages and assets
- `docs/cabane/images/`: Illustrations used by the activities

## Leptos migration preview

The existing Jekyll site remains the production source. The new Rust workspace
generates an isolated, unstyled proof page and an unchanged copy of Cabane.
It is not a replacement homepage and is not deployed.

Install Rust through rustup, then run from the repository root (the checked-in
`rust-toolchain.toml` selects Rust 1.96.0, rustfmt and Clippy):

```sh
rm -rf target/site-preview # Only the disposable generated preview
cargo run --locked --release -p site
python3 -m http.server 8766 --directory target/site-preview
```

Open `http://localhost:8766/leptos-proof/`. The generated `index.html` contains the
whole document; no JavaScript, Wasm, hydration, external assets or runtime server
is required for the proof page. `/cabane/` retains its existing JS/Wasm runtime.
The generator writes only to `target/site-preview/`, regardless of the working
directory, and never changes production sources. It refuses an existing preview
directory: remove the disposable preview before rebuilding, including after a
failed write. The manifest is validated before any output is written.

Only `docs/cabane/` runtime extensions (HTML, CSS, JS/MJS, JSON, Wasm, PNG, SVG,
WebP and ICO) are copied, byte for byte. Markdown is excluded; unknown extensions,
symlinks, unsafe paths and duplicate/file-directory destinations fail the build.
Jekyll configuration and migration notes are never copied. The homepage is not
yet migrated, so Cabane’s back-to-site link has no homepage in this partial preview.

Workspace checks:

```sh
cargo fmt --check
cargo check --locked
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked
python3 scripts/verify-site-preview.py # After generating the preview
```

`crates/content` contains plain Rust content types; `crates/site` renders them with
Leptos and provides the native generator. Memory remains an independent Cargo
project with its own lockfile/profile and existing build commands.

Read [migration TODO](docs/todo.md), [progress](docs/progress.md) and
[architecture](docs/architecture.md) before continuing. The `Leptos preview` workflow runs on every branch push and pull request, and
supports manual dispatch once available on the default branch. It uses the pinned
Rust toolchain, runs the workspace checks and release generator, then validates
the exact artifact file set, unchanged Cabane bytes, static proof, page routes and
local HTML resource URLs. Successful runs upload `leptos-preview` for seven days.
The artifact is downloadable from the workflow run; it is not a hosted deployment.
The existing Cabane/Jekyll workflow remains independent and unchanged.

There are deliberately no path filters during migration, so new build inputs
cannot silently miss validation. Push and PR runs may both occur; newer runs of
the same event/ref cancel older ones. The workflow has read-only repository
permissions and does not request Pages or deployment access.
