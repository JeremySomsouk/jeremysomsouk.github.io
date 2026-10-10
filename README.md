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

## Bientôt

Bientôt appears first on the homepage and projects index, with its generated
presentation at `/projects/bientot/` and public destination <https://bientotanous.app/>.
It is a collaborative preparation checklist for expectant and new parents,
designed first for France. The application is still in development and privately
tested; the public website presents it. The existing brand sharing image is copied
unchanged.

## Ripple

`/ripple/` starts with a spark that chooses the route needing the least energy.
Two guided challenges introduce changing a cell's energy, then closing a route,
to send it through a diamond. The first challenge exposes only two marked cells;
route totals explain its choice. Optional hints follow unsuccessful attempts.
The algorithm inspector and unrestricted experiment remain available below the
board. Each attempt has a budget of two interventions.
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
bash scripts/build-ripple.sh
bash scripts/build-nuance.sh        # requires wasm32-unknown-unknown target
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
## Guessr

`/guessr/` is a guessing game for 3–20 players. The host prepares all questions and
individual timers, shares a room code, and starts from the lobby. Players answer
privately, independently match anonymous answers to authors, and compare their
scores. Each revealed answer shows everyone's guesses and their results; guesses
stay private until that answer is revealed. Self-identification earns no points. The host advances through the
prepared rounds. Rooms expire after 24 hours; there are no accounts or histories.
The host can upload, replace or remove a room banner in the lobby. JPEG, PNG and
WebP files up to 10 MB are cropped to 3:1 and compressed to a JPEG of at most
24 KB in the browser. The banner is stored with the temporary room, shared only
when changed or reconnecting, and deleted when the room expires. Completing a
round triggers a short confetti burst, respecting reduced-motion preferences.

The page has its own visual identity and a discreet link to the homepage,
while retaining static Leptos rendering and a small browser controller. Names
are matched by touch/mouse drag-and-drop or keyboard/tap placement, with swaps
and undoing placements before submission. Old `/guess/` room links redirect
while preserving their query string and reconnect identity. The authoritative rules live in `services/guess/engine.mjs`, shared by
the local WebSocket server and the Cloudflare Durable Object. Only sanitized,
per-player views reach browsers. Clients display server deadlines and never
calculate scores. The host can excuse disconnected participants from readiness
checks for the current round; their submitted answers remain valid candidates.
Skipped answerers may guess but are excluded from possible authors.

After generating the preview as above:

```sh
cd services/guess
npm ci
npm test
npm start
```

Open `http://localhost:8787/guessr/` in four tabs. Create five questions in one tab
and join its code with three different names in the others. Identity is stored
per tab in session storage so refreshing reconnects without duplicating players.
Local rooms are in memory and disappear if the server restarts. A reconnect in
another device requires the original private token; room codes grant no privileges.
The local server binds to loopback by default.

To use the real local Cloudflare runtime instead, run `npm run dev` in
`services/guess`, serve `target/site-preview` on port 8787, and open
`http://localhost:8787/guessr/?backend=worker`. That selects the local Worker at
port 8788; shared invitations retain the transport selection.

Shared links use `/guessr/?room=CODE`, compatible with GitHub Pages without a
client router. The local server additionally accepts `/guessr/CODE`. The game is
listed on the projects page. Production uses `https://somsouk-games-api.jh-somsouk.workers.dev`;
localhost keeps using the local transport.

The Cloudflare deployment is named `somsouk-games-api`. `wrangler.toml` declares
one SQLite-backed Durable Object per room, with hibernating WebSockets and alarms
for deadline/24-hour expiry. Both `https://www.somsouk.fr` and
`https://somsouk.fr` are allowed origins, along with the local server on port 8787.
All game rules are shared with the local server; scores and reveal progress are
persisted authoritatively. Reconnecting restores the current question, deadline,
private answer, submitted guesses, reveal screen and cumulative scores.
Commands carry the current question ID to reject stale round replays.

Deploy from a checkout of this branch:

```sh
cd services/guess
npm ci
npm test
npm run test:worker                 # complete game against local Cloudflare runtime
npx wrangler login
npx wrangler deploy
```

`GET /` and `GET /health` are neutral health checks. WebSocket `/create` creates a room;
`/room?room=CODE` joins/reconnects. There are no public room-state endpoints.
`public/guessr/config.js` centralizes the public production API origin. Publishing
the frontend follows the existing GitHub Pages workflow; no Cloudflare Pages
migration is involved. No credentials or account IDs belong in this repository.
Apply Cloudflare edge rate limits before opening creation broadly (per-socket
message and per-room connection limits are not an IP quota).

Use the existing **Cloudflare Workers Builds** connection (no separate GitHub
Actions deployment or manually created API token). In **somsouk-games-api →
Settings → Build**, set:

| Setting | Value |
| --- | --- |
| Root directory | `services/guess` |
| Build command | `npm ci && npm test && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Production branch | `master` after merging this change |
| Node version | `22` or newer |

Save and trigger/retry a build of a commit containing this implementation.
Cloudflare bundles the JavaScript backend; it does not need Rust/Wasm tools.
The existing GitHub Pages workflow continues to build the Rust/Leptos site and
its Wasm assets. Keep non-production preview builds disabled until explicitly
needed; do not point their deploy command at the production Worker.

For an immediate backend test before merging, choose `feat/social-guess` as the
Cloudflare production build branch temporarily, then return it to `master` once
merged. This deploys the same existing Worker. The frontend still publishes only
through the established GitHub Pages workflow.

## Nuance

`/nuance/` is a quiet English/French space for thinking through a decision.
The standalone Leptos page uses a small Rust/Wasm model in `crates/nuance`:
bounded priority comparisons, adaptive option comparisons, and descriptive
relationships, including equality, uncertainty, unexplored pairs and cycles.
There is no overall option score or chosen answer.

`public/nuance` owns the paper interface and browser boundary. One active page
is kept in `localStorage`; no writing enters URLs or network requests. Burning
removes that page before the short disappearing-ink gesture and clears other
open tabs. Language preference is kept separately. A plain-text copy can be
saved locally; burning cannot remove an already downloaded copy. Reduced
motion, keyboard controls and mobile layouts are supported. Build the engine
with `bash scripts/build-nuance.sh`; test it with `cargo test -p nuance-engine`
and `node --test scripts/nuance.test.mjs`.
