# Leptos migration architecture

Status: static foundation implemented; later architecture remains planned (2026-09-26). See [discovery](migration-discovery.md), [TODO](todo.md), [progress](progress.md).

## Rendering and deployment

Static by default, interactive when needed, server-side when justified. Use a small native build-time generator which renders Leptos views into complete HTML files. A typed route manifest determines output paths and metadata. Do not ship a client router or hydration bootstrap on ordinary pages. Render to an independent staging directory, never over the current `docs/` source. Verify the selected stable Leptos rendering API in the foundation spike before committing to its exact version; do not assume cargo-leptos automatically exports a deployable static site.

GitHub Pages remains the deployment target during migration. No runtime server, Axum or server functions are needed now. Keep page components free of filesystem/request dependencies: a native content loader supplies typed models to render functions. A later SSR adapter can reuse these components and route metadata on a server-capable host. This is a boundary, not an SSR implementation or hosting commitment.

For future interactive Rust UI, choose isolated mount roots/client bundles per application or measured islands. Never hydrate a DOM subtree already owned by a Cabane JS controller. Leptos islands are a possible future mechanism, not a first-milestone dependency. Official references consulted: https://book.leptos.dev/islands.html and https://book.leptos.dev/ssr/24_hydration_bugs.html . Validate APIs/version/MSRV during the next step.

## Minimal workspace and ownership

Start with `crates/site` (renderable page library + native static generator) and `crates/content` (typed metadata/content validation, no browser dependency). Use `site::ui` modules for shared components until there is an actual second Rust UI consumer; only then extract `crates/ui`. Keep `games/memory` independent and explicitly excluded from the root workspace initially. Do not introduce an empty Cabane crate: legacy Cabane stays an application boundary copied unchanged into the staged artifact.

Dependency direction: content models -> site page composition -> static generator output. Future UI components must not depend on games. App-specific metadata/assets live behind a registry rather than conditionals scattered through the generic shell. No future Melimo app is implemented.

## Content and authoring

Preserve source content until parity. Extract resume/profile data to explicit structs (Profile, ResumeEntry, ResumeSection enum), project cards to ProjectMetadata (title, slug, description, tags, image with alt/dimensions, destination), and document metadata to PageMetadata. Validate slugs, unique routes, required fields and safe local asset paths at build time with file-specific errors. Prefer enums for page/theme kinds rather than untyped maps. Do not silently drop unknown migration fields.

For new articles: `content/blog/<slug>.md` with TOML front matter delimited by `+++`, deserialized with Serde/TOML. Define title, description, date, slug, draft and optional tags/image. Use pulldown-cmark for Markdown if confirmed suitable by fixtures. This avoids adding a YAML dependency solely for the one-time resume extraction; document the explicit conversion from existing YAML. No plugin system, arbitrary shortcodes or taxonomy engine until needed. Raw author HTML policy must be explicit and tested; use typed UI for project cards instead of preserving embedded card HTML.

Publishing should require only committing/uploading Markdown and optional assets to GitHub: CI validates, generates and eventually publishes it. Drafts excluded from production, deterministic ordering, permalink `/blog/<slug>/`, static listing and article metadata. Blog routes are additive; decide feed scope separately rather than silently adding it.

## Styling and assets

Use plain CSS with semantic custom properties, shared layout/component rules and scoped app styles. Progressively convert only used Sass and retain existing appearance. No Tailwind or new framework. Inventory theme font/icon/grid dependencies before replacement, retain license notices, and prefer local assets where practical. Theme choice should be explicit (`site`, `cabane`), not game-specific state in the shell.

Once migrated, `public/` is the static asset source copied to output root and `styles/` holds authored site CSS. Preserve current public URLs first: `public/images/`, `public/cabane/`, output `/assets/main.css`. New project assets use `public/images/projects/<slug>/`; do not relocate existing images just to match that convention. Typed image metadata includes src, alt, width, height and optional srcset/sizes; retain current crop/contain behavior and avoid inventing variants. Never duplicate assets into two maintained sources. During coexistence, copy only allowlisted legacy paths from docs until their ownership moves atomically.

## Route ownership and SEO

Each route has exactly one owner: legacy or Leptos. Begin with a nonproduction static proof page; then port homepage/404, project presentation pages, and content pages, validating each before activation. Cabane entry points remain legacy owners until individually integrated. No global SPA fallback.

Render language, title, description, HTTPS canonical, OG/Twitter metadata and appropriate JSON-LD into HTML. Preserve public identity, anchors and link destinations. Add sitemap and robots output, excluding drafts and noncontent artifacts. Use a correct static 404 page. Keep website -> project presentation -> application navigation possible without changing established `/cabane/*` URLs.

## Quality and resumability

Every implementation step updates TODO and appends progress, validates its risk, and gets a coherent commit. Required eventual checks: cargo fmt --check; cargo check; cargo clippy --all-targets --all-features -- -D warnings; cargo test; static production build; existing game tests and Memory build; complete route/asset/metadata checks; responsive browser comparison. Add target-specific Wasm checks only for actual browser crates. Keep feature combinations compatible or document/test an explicit matrix before adding mutually exclusive rendering features.

No deployment switch or legacy removal before complete parity and rollback validation. For “what is next”, read TODO, progress and repository state, propose one task with files/impact/risks and wait for consent. For approval, implement that task only and stop again. Do not squash intermediate history automatically.

## Foundation implementation — 2026-09-26

Rust 1.96.0 is pinned to match the existing Memory build. Leptos 0.8.20 is
pinned with default features disabled and only `ssr` enabled. Here `ssr` means
native HTML rendering at build time, not a deployed request server. The rendering
API is `RenderHtml::to_html()` via `leptos::prelude`, with an explicit HTML5 doctype.
The root Cargo.lock fixes transitive versions. There are no other direct external
crate dependencies; serialization/Markdown libraries wait for actual content loading.

The content crate currently contains only `PageMetadata` (title/description),
without speculative loaders. The site library accepts that model; only its binary
writes files. The proof is deliberately unstyled and marked noindex. Its fixed
output is `target/site-preview/leptos-proof/index.html`; production docs and assets
are not read or copied yet. No frontend bundles are emitted even though Leptos has
transitive browser-related Rust dependencies. No shared UI extraction is justified
by this single proof. `games/memory` is explicitly excluded from the root workspace.

## Route/output manifest (2.2)

`site::output::Route` converts a validated trailing-slash URL into an
`OutputPath` directory index. Output paths accept portable ASCII filename
characters only and reject dot segments, empty segments, URL escapes, query
strings, backslashes and absolute paths. `Manifest` owns a sorted map of output
paths to bytes; duplicate destinations and file/directory prefix conflicts
fail before writing. Generated and legacy pages use the same collision checks.

The only legacy source is `docs/cabane/`, recursively enumerated with an explicit
runtime-extension allowlist; Markdown is excluded and other extensions fail
closed. No generic docs copy occurs. Symlinks and nonregular files are rejected.
Source bytes, URLs, query strings and import layout remain unchanged.

Publication writes a fresh fixed `target/site-preview/` directory and refuses
existing output, including symlink ancestors. This avoids stale output and
overwriting another build. Remove only that disposable directory to rebuild.
An I/O failure can leave an incomplete preview: the command fails and the next
build refuses it until removed. This is a local generator for a trusted checkout,
not a concurrent hostile-filesystem sandbox or atomic production deployment.
The partial artifact intentionally has no homepage yet; no deployment changed.
