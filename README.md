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

Ordinary content pages contain no JavaScript or Wasm. The homepage has a dormant
Ripple discovery controller; it fetches the Rust/Wasm engine only on interaction. The Cabane games keep their
self-contained controllers; the generator must not rewrite, rename or import
their internals (see `crates/site/tests/output.rs` and the artifact verifier
for the enforced boundary). A gentle CSS cross-document transition between the
homepage and the Cabane landing is progressive enhancement only, disabled for
reduced motion.

Site styling lives in `styles/site.css`; self-hosted Inter fonts, Tabler icons
and licenses live in `public/`. The site's own GPL-3.0 notice is
`docs/LICENSE`, published at `/LICENSE`. `docs/` now contains only the legacy
Cabane game runtime (copied byte-identical into the artifact), registered
images, `CNAME` and the license.

## Ripple

`/ripple/` is a pathfinding puzzle: change cell costs or block a cell with a
budget of two interventions to make the search pass through the lower waypoint.
Undo, reset, replay, step and Dijkstra/A* comparison use the same deterministic
input (seed `7F93A2`). Numbers are entry costs; the start costs zero. A* uses an
admissible Manhattan heuristic on unit grid edges and falls back to zero on
arbitrary graphs. Before/after feedback shows the original path, changed costs,
exploration counts and the first different node selection.

`crates/ripple` owns graphs, validated level definitions, interventions and pure
search events. Leptos renders the static page; `public/ripple` plays the Rust/Wasm
events through a small raw ABI, following the existing Memory integration.
The homepage hides a six-node version along its actual section and project
landmarks. Discovery loads the engine; solving reveals an optional entrance.
No backend or client router is required. The Wasm build is generated into
`target/ripple/` and registered explicitly in the publication manifest.

## Build and preview

The checked-in `rust-toolchain.toml` selects Rust 1.96.0.

```sh
rm -rf target/site-preview          # disposable generated output only
bash scripts/build-ripple.sh        # requires wasm32-unknown-unknown target
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
  `content/home/README.md`). A frozen snapshot of the removed legacy YAML is
  kept as a parity fixture in `crates/content/tests/fixtures/`.
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

## Article pipeline

Article ideas live in an Obsidian vault synced to GitHub
(`jiwi-thought-vault`, local path
`/Users/jeremy.somsouk/Documents/ObsidianVault`), under
`10 Projects/Website Blog/`:

- `Inbox/`: raw captures from the phone. Promote promising ones to briefs
  using facts from this repository.
- `Queue/`: briefs with `status: ready`. Write these one branch at a time
  (`blog/<slug>`), draft PR, keep the vault note's status in sync
  (`writing` with the PR link, `published` with the live URL, moved to
  `Published/`).
- The vault README holds the full contract, including the house voice:
  plain, honest, first person, no em dashes.

A **`Publish scheduled blog`** workflow runs every day at 00:00 UTC. It finds
open pull requests whose blog article front matter is dated today or earlier
with `draft = false`, waits for green checks, marks the pull request ready for
review if it is still a draft, squash-merges it, and dispatches `Deploy Pages`
(a merge made with the workflow token does not fire the push event). It can be
rehearsed by hand: `DRY_RUN=1 PUBLISH_DATE=YYYY-MM-DD
bash scripts/publish-scheduled-blog.sh`.

## Deployment

Production serves the generated artifact through the `Deploy Pages` workflow:
every push to `master` builds, verifies and publishes it to GitHub Pages with
HTTPS enforced. Rollback is `git revert` of the offending commit (the
migration landed as squash `28e9b7b` with the pre-migration baseline and
account-settings restore procedure recorded in its message), followed by a
redeploy. The legacy Jekyll sources removed in this cleanup remain
recoverable from that history.