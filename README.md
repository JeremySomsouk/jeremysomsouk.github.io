# Jeremy Somsouk

This repository publishes my public site and the interactive **Cabane à
découvertes** prototype collection.

- Live site: <https://www.somsouk.fr/>
- Cabane: <https://www.somsouk.fr/cabane/>

![La cabane à découvertes](docs/cabane/images/welcome.webp)

## What this is

A personal homepage plus six browser activities for reading and play, all
static files with no server or third-party runtime:

- **La Fluence** reads a text aloud with a timer and simple reading controls.
- **Le Memory** plays a matching game with an illustrated Rust/Wasm engine.
- **Le Chemin** asks you to connect every square on a grid without crossing your path.
- **Les Petits Calculs** asks you to write arithmetic answers by hand.
- **La Lumière** uses mirrors and prisms to wake sleeping ghosts.
- **La Rivière** offers thirty touch-first landscapes: scratch soft earth to
  release water and make ponds bloom, with tunnels and sluices in later levels.

## Architecture

The site is generated statically at build time. `crates/content` holds typed
content records and validation; `crates/site` renders them with Leptos
(build-time SSR only — no client router, no hydration) and writes a complete
artifact to `target/site-preview/`. The generator:

- renders the homepage, project pages (`/projects/…`), blog (`/blog/…`),
  a real 404 page, `sitemap.xml` and `robots.txt` with typed HTTPS metadata;
- copies the legacy Cabane application from `docs/cabane/` byte-for-byte
  (game controllers, assets and the Memory Wasm engine), while owning exactly
  one file itself: the regenerated `cabane/index.html` selection page;
- enforces route ownership, path safety and artifact completeness, verified
  independently by `scripts/verify-site-preview.py`.

Ordinary pages contain no JavaScript or Wasm. The Cabane games keep their
self-contained controllers; the generator must not rewrite, rename or import
their internals (see `crates/site/tests/output.rs` and the artifact verifier
for the enforced boundary). A gentle CSS cross-document transition between the
homepage and the Cabane landing is progressive enhancement only, disabled for
reduced motion.

Site styling lives in `styles/site.css`; self-hosted Inter fonts, Tabler icons
and licenses live in `public/`. The site's own GPL-3.0 notice is
`docs/LICENSE`, published at `/LICENSE`. The legacy Jekyll source in `docs/`
remains the production site until cutover.

## Build and preview

The checked-in `rust-toolchain.toml` selects Rust 1.96.0.

```sh
rm -rf target/site-preview          # disposable generated output only
SITE_BUILD_DATE="$(date -u +%F)" cargo run --locked --release -p site
python3 -m http.server 8766 --directory target/site-preview
```

Open `http://localhost:8766/`. The generator refuses an existing preview
directory; remove it before rebuilding, including after a failed write.

The Memory engine builds independently:

```sh
rustup toolchain install 1.96.0 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
bash scripts/build-games.sh
```

## Checks

```sh
cargo fmt --check
cargo check --locked
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked
rustup run 1.96.0 cargo test --manifest-path games/memory/Cargo.toml
node --test scripts/*.test.mjs
python3 scripts/verify-site-preview.py   # after generating the preview
```

The `Leptos preview` workflow runs the same suite on every push and pull
request, verifies the exact artifact set and uploads it for seven days. It has
read-only permissions and deploys nothing.

## Writing content

- **Homepage prose**: edit `content/home/*.md`; profile/resume/project records
  are typed in `crates/content/src/homepage.rs` (see
  `content/home/README.md`). Keep both in sync with the legacy YAML until
  cutover.
- **Articles**: create `content/blog/<slug>.md` with TOML front matter:

  ```markdown
  +++
  title = "My first post"
  description = "A short description for listings and search results."
  slug = "my-first-post"
  date = 2026-09-28
  draft = true
  tags = ["Rust"]
  +++
  Write the article in Markdown here.
  ```

  The filename must match `slug` (lowercase ASCII, hyphens, ≤80 chars).
  Omitted `draft` defaults to true; publication requires `draft = false` and a
  date on or before the build date. Markdown is trusted repository content —
  drafts stay visible in this public repository, so do not commit private
  material or secrets.
- **Projects**: add a record to `HOMEPAGE.projects` with a unique safe slug and
  register any new image in the static asset manifest; the presentation route
  is generated automatically (update the verifier's expected routes).

## Migration status

The static Leptos generator is feature-complete and validated (all routes and
assets preserved, walkthrough-tested, CI-green). Production still serves the
legacy Jekyll site from `master`. Remaining steps before cutover:

1. Exact-width desktop/print/accessibility visual comparison of the new pages
   against the legacy site (release gate).
2. One final squash commit of the whole migration onto `master`, with the
   pre-cutover SHA and rollback instructions recorded.
3. Activate GitHub Pages deployment of the generated artifact (CNAME, custom
   404) and verify deployed routes, assets, HTTPS metadata and rollback.
4. Remove the Jekyll configuration and Sass once nothing depends on it.

Migration history and planning notes are preserved in the development branch
history; the published tree carries only product documentation.