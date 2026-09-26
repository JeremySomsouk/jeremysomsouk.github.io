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
currently generates only an isolated, unstyled proof page; it is not a replacement
homepage and is not deployed.

Install Rust through rustup, then run from the repository root (the checked-in
`rust-toolchain.toml` selects Rust 1.96.0, rustfmt and Clippy):

```sh
cargo run --locked --release -p site
python3 -m http.server 8766 --directory target/site-preview
```

Open `http://localhost:8766/leptos-proof/`. The generated `index.html` contains the
whole document; no JavaScript, Wasm, hydration, external assets or runtime server
is required. The generator always writes beneath `target/site-preview/`, regardless
of the working directory, and does not copy or change production files.

Workspace checks:

```sh
cargo fmt --check
cargo check --locked
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked
```

`crates/content` contains plain Rust content types; `crates/site` renders them with
Leptos and provides the native generator. Memory remains an independent Cargo
project with its own lockfile/profile and existing build commands.

Read [migration TODO](docs/todo.md), [progress](docs/progress.md) and
[architecture](docs/architecture.md) before continuing. Route manifests, legacy
asset copying and preview CI are separate next steps.
