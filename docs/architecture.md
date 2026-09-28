# Leptos migration architecture

Status: static homepage, shared document metadata and 404 implemented; deployment and visual gates remain open (2026-09-28). Earlier implementation sections describe their original stages. See [discovery](migration-discovery.md), [TODO](todo.md), [progress](progress.md).

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

No deployment switch or legacy removal before complete parity and rollback validation. For “what is next”, read TODO, progress and repository state, propose one task with files/impact/risks and wait for consent. For approval, implement that task only and stop again. The 2026-09-27 user instruction supersedes the original no-squash default: keep development history off master and land the entire migration as one final squash commit.

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

## Release and rollback policy — user instruction, 2026-09-27

The user requests one commit for the whole migration on production and authorizes
a production trial once ready. Intermediate branches/commits may remain for
resumability, but must not be individually merged into master. Prepare one final
squash commit against the then-current master, containing the complete migration.
Do not force-push or rewrite unrelated history. Record the pre-cutover revision
and final migration SHA. Roll back source with `git revert <migration-sha>`, then
redeploy the known-good artifact. Validate this plan before changing production.

Git revert does not revert account-level Pages settings: record those settings
and their restoration procedure separately before cutover. Prefer a deployment
arrangement where reverting the migration also restores the old build path.
Production trial authorization does not waive route/content/build checks or
allow a partial proof artifact to replace the website. Keep the one-task-per-
session workflow unless the user expands scope.

## Homepage to Cabane transition — user instruction, 2026-09-27

Aim for a short, gentle transition from the violet homepage to Cabane's warm
cream/green palette. Keep the welcome illustration as a visual connection between
the project card and landing page. Plan a CSS cross-document View Transition as
progressive enhancement after verifying current browser support: brief fade with
a subtle vertical movement, roughly 180–250ms, no full-screen loader or delay.
An optional shared-image transition must not distort the differently sized
illustration or shift layout. Avoid adding Wasm or a client router just for this.

Keep real anchors, destination URLs, opening in a new tab and back/forward
behavior. Disable animation with prefers-reduced-motion. Unsupported browsers
get immediate normal navigation. Scope to the homepage/Cabane landing pair;
do not animate game boards or interfere with reading timers. Test mobile and
desktop entry/return, reduced motion, keyboard focus and fallback before release.
Implementation belongs with the shared shell and Cabane landing integration;
this session records the requirement, not a completed animation.

## Shared shell implementation (3.2)

`site::ui` provides PageLayout, Header, Footer, Section and ResumeEntry. Layout
slots accept child views, so the generic shell has no Cabane gameplay or profile
data dependency. The only identity used by the proof is explicit example content.
Normal links and semantic landmarks include a keyboard skip link to the main
content. The document head stays in page composition until metadata work (3.5).

`styles/site.css` is compiled into the generator and emitted at `/assets/main.css`.
Rules and tokens are scoped to `.site-shell`/site component classes, with an
explicit body class for page margins. Cabane documents do not load this file.
No framework, font package, client script or Wasm was added. The proof references
the CSS relatively so the same static artifact can also be inspected from disk.

This is a layout fixture, not a migrated homepage. The 1140px desktop container,
violet palette, resume columns and below-768px stacking follow existing patterns.
Print/focus/reduced-motion rules are authored; exact mobile/print browser checks
remain open. Roboto is a preferred family, but font delivery is not yet added;
fallback metrics differ from the current site's downloaded Roboto. Resolve this
before claiming homepage visual parity. The homepage→Cabane animation remains
planned for landing-page integration and is not implemented by this shell step.

## Typed homepage extraction (3.3)

`site-content::HOMEPAGE` now supplies explicit Profile, ResumeSection/ResumeKind,
ResumeEntry, ProjectMetadata, Link and Image records. Homepage prose lives in
`content/home/*.md`, embedded with `include_str!`. Static borrowed strings avoid
runtime parsing and allocation for this fixed dataset; PageMetadata remains
owned for generated document heads. Article deserialization remains a separate
future boundary, not a reason to add a YAML parser for legacy extraction.

The one-time YAML/HTML extraction preserved copy and ordering, converting card
HTML into fields and employer domains into HTTPS links. Markdown retains trusted
author HTML. Renderers must distinguish it from escaped plain-text metadata.
No parser, sanitizer, theme/font dependency, routes or frontend code was added.
The profile image remains a source path until its dimensions are measured.

The legacy YAML remains production source during coexistence; update both copies
until cutover. Preservation tests reference that source and must become durable
fixtures before deleting it. Homepage rendering and Markdown parser selection
belong to 3.4. Existing project anchor IDs remain explicit; verify all theme-derived
section anchors against rendered baseline during composition.

## Homepage candidate (3.4)

The native generator now owns `/` in the preview manifest. Page composition in
`site::homepage` consumes the content records and shared UI; ProjectCard is reusable
outside the homepage. Resume heading IDs are explicit content fields, preserving
live Jekyll anchors as well as section/project anchors. Existing employer domains
remain visible links, with explicit HTTPS and noopener for their new tabs.

Markdown rendering uses pulldown-cmark 0.13.4 (CommonMark, default features off,
HTML output only). This mature parser handles real paragraphs/lists/inline HTML;
a custom parser would be unnecessary maintenance. Smart punctuation matches the
legacy prose. API/feature reference: https://docs.rs/crate/pulldown-cmark/0.13.4 .
The only raw HTML boundaries are repository-authored Markdown and fixed JSON-LD;
plain project/title/alt text is escaped by Leptos. This is not an untrusted-content
sanitization pipeline. No browser bundle or Markdown runtime is emitted.

Live title, description, OG/Twitter values and WebSite JSON-LD were checked against
https://www.somsouk.fr/ on 2026-09-27; canonical/OG/JSON-LD URLs are now HTTPS.
The homepage head is deliberately local to its composition for now; task 3.5
extracts shared typed metadata and adds the error document. JSON-LD is inert data,
not JavaScript execution. Artifact verification distinguishes the two.

Four explicit docs/images assets are registered individually and copied unchanged:
profile.webp, js-icon.webp, melimo-player.png and favicon.ico. Cabane's existing
welcome image is reused from the unchanged Cabane copy. The profile is measured
1024×1024; CSS renders it at 200px while reserving its intrinsic ratio. Project
cards preserve contain-fit artwork and colors. Existing custom Sass geometry is
converted from the old theme's 10px rem basis into the new 16px basis.

No font/icon package is introduced without provenance review. Navigation currently
uses accessible text labels and the font stack falls back when Roboto is absent;
these are known presentation differences, not an approved redesign. Navigation
uses real same-tab anchors (users can still explicitly open new tabs). Exact
rendered/mobile/print comparison remains blocked by the previously recorded browser
preview limitation. Keep 3.4b open before cutover. The planned Cabane transition,
all gameplay code and production deployment remain unchanged by this step.

## Shared metadata and 404 (3.5)

`site-content::PageMetadata` now owns typed language, indexing policy, optional
description/canonical/social metadata and a structured-data kind. CanonicalUrl
accepts validated site-root paths and produces HTTPS URLs on the single public
origin; it rejects external hosts, queries/fragments, URL escapes and dot segments.
Social image URLs use the same policy. English/French locale values come from the
same Language value as the document's lang attribute.

`site::document::render_document` is the single document/head renderer for the
homepage, proof and 404. Optional values are omitted rather than rendered as
empty tags. Social cards use summary_large_image only when an image is supplied;
no new social image is invented for the existing homepage. Open Graph currently
uses website type; introduce article metadata when article rendering is added.
WebsiteLayout shares the public header/footer across homepage and error page;
the generic PageLayout remains usable by independent application shells.

Serde and serde_json are now direct site dependencies, reusing versions already
in Cargo.lock. A typed serializable WebSite schema avoids manual JSON assembly.
After JSON serialization, HTML-sensitive characters and Unicode line separators
are escaped before rendering into the script raw-text context. Tests exercise
closing-script payloads, quotes, ampersands and round-trip decoding. Serialization
errors propagate through native rendering to the generator. No executable script,
Wasm, hydration, runtime server or request-specific state is introduced.

The preview owns `/404.html` as a real error document with recovery links,
noindex/follow and no canonical, Open Graph, Twitter or JSON-LD. Root-relative
assets work when the document is served for deeply nested unknown paths. Static
HTML cannot choose an HTTP status: the deployment host must serve this document
with status 404 for missing URLs. The artifact verifier simulates that host
behavior for two unknown paths; this is not evidence of production configuration.
The basic README http.server command serves the document directly but does not
install that fallback. Verify actual Pages missing-route behavior at cutover.

Visual approval, font/icon parity, full publication artifacts and Cabane gameplay
integration remain separate gates. This step changes neither hosting nor the
legacy Jekyll 404 source; production still uses its old document until cutover.


## Local typography and icons (2026-09-27)

The user authorized new fonts/icons. Ordinary Leptos pages now use Inter Variable
instead of the provisional Roboto/fallback stack. Keep the violet palette, existing
logo, portrait, circular social navigation and content. This is a limited visual
change requiring desktop/mobile/print review before release, not a parity claim.
Cabane's independent styles and controllers remain untouched.

- Source: `@fontsource-variable/inter` 5.3.0, published npm tarball verified against
  its registry SHA-512 integrity. Unmodified Latin and Vietnamese `wght` WOFF2
  subsets, normal and italic, total 120,936 bytes. Vietnamese covers the existing
  “phở”; unsupported glyphs use the system fallback. Weight range 100–900,
  `font-display: swap`, no preload of unused subsets or external requests.
- Four unmodified Tabler Icons v3.48.0 outline SVGs: brand-github, brand-linkedin,
  home, world. Typed `ProfileLinkKind` selects the presentation without URL guessing.
  Images are decorative inside named links, with visible tooltips, 48px targets,
  keyboard focus and a forced-colors text fallback. No icon font or client runtime.
- New shared assets live at `public/fonts/inter/` and `public/icons/tabler/`.
  `public/licenses/` includes original OFL/MIT licenses and upstream version URLs.
  The generator explicitly registers assets; it does not publish arbitrary public
  files. Existing images remain selected from docs until the asset migration step.
- The verifier checks exact public bytes, WOFF2 signatures/size budget, local font
  URLs and HTTP MIME, passive SVG content and profile labels. It does not replace
  browser accessibility, responsive or visual checks. No new Rust/npm dependency.

## Article loading (2026-09-28)

`site-content` now validates flat `content/blog/<slug>.md` files with `+++` TOML
front matter using explicit Serde structs. It directly depends on the already
locked Serde and TOML versions; TOML enables only parse/serde/std, not display.
Cargo also records optional TOML writer resolution in the lockfile, but it is not
in the active dependency tree. No separate date/parser library is introduced.

Private slug/date representations enforce portable paths and Gregorian dates.
Drafts default true; publication selection requires an explicit as-of date,
excludes drafts/future dates, and sorts newest first with slug tie-breaking.
The generator validates even drafts during builds; rendering and build-date
selection follow in 4.3. Raw author Markdown is preserved as owned text and remains
trusted repository content. A draft is still public source in this repository.


## Static blog rendering (2026-09-28)

`blog::add_blog` registers the index and only publication-filtered articles after
static assets are registered. A cover must exist in the manifest. Homepage and
article prose use the same trusted Markdown renderer. Article metadata extends
the shared document head with BlogPosting JSON-LD, article Open Graph type and
publication date; it uses the existing escaping boundary.

`SITE_BUILD_DATE=YYYY-MM-DD` is required at generation time. CI supplies the UTC
date; explicit input keeps publication selection reproducible without another
clock/date dependency. The index records that cutoff for independent artifact
validation. No automatic schedule is configured. No posts are fabricated: the
empty source directory produces a useful empty blog listing.

## Discovery and domain files (2026-09-28)

The output manifest records indexable pages alongside page insertion. Sitemap
entries derive only from successful registrations; blog filtering therefore also
controls discovery. Existing Cabane HTML is registered during allowlisted copying
(current source has no noindex directive). The proof/error pages are excluded.
Directory indexes use canonical trailing-slash URLs without index.html aliases.
No inferred modification timestamps, priorities or change frequencies are emitted.

The generator adds robots.txt (allow crawling plus sitemap URL), the exact existing
docs/CNAME bytes, and an empty .nojekyll marker. Domain/origin mismatch fails the
build. These are static artifact files only, not DNS or Pages-setting mutations.
Cabane metadata improvements remain part of its later shared-shell migration.
