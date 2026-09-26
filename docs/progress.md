# Migration progress

## 2026-09-26 — Discovery and migration boundaries

### Completed
- Inspected repository at `ef5113e`, source routes, config, styles, Cabane modules, Rust engine and CI; inspected relevant upstream theme files.
- Corrected initial premise: the current site uses Jekyll, not Hugo.
- Added discovery inventory, proposed architecture and milestone TODO; no site implementation changed.
- Inspected live homepage/Cabane and SEO endpoints; ran existing Node tests and a limited tracked-text secret-signature scan.

### Decisions
- Build static Leptos output alongside current Jekyll; no full-site SPA or ordinary-page Wasm requirement.
- Begin with site/content crates and internal UI modules; preserve independent Memory build and unchanged legacy game boundary.
- Preserve current URLs, query parameters, origin/storage and asset paths; project/blog pages will be additive.
- Use plain CSS and typed content; proposed TOML-front-matter Markdown authoring supports publishing articles through GitHub.
- Keep mandatory planning documents here without Jekyll front matter; explicitly exclude them from the future production artifact.

### Validation
- `node --test scripts/*.test.mjs`: 89 passed, 0 failed.
- Direct HTTP: homepage and Cabane landing return 200; robots/sitemap return 404. Live homepage canonical/OG URL are HTTP and should become HTTPS.
- No matches for selected private-key/GitHub-token/AWS-key/Google-key signatures in tracked text; this is not an exhaustive audit.
- Ruby/Bundler and Rust/Cargo are unavailable locally: Jekyll production build, Rust checks and Wasm rebuild not run. No application code changed.

### Remaining concerns
- Capture real responsive/print screenshots and resolved theme dependencies before visual migration; no visual parity claim is made.
- Confirm Pages account settings, correct 404 body, deployed source freshness and exact dependency versions during implementation.
- Unpinned remote theme, external CSS and docs-as-publish-source require explicit cutover handling.

### Recommended next step
- With user consent, implement TODO 2.1 only: minimal workspace and static Leptos proof page. Expected files: root Cargo.toml/Cargo.lock/toolchain config, site/content manifests and small sources, ignore rules, build instructions and updated planning docs. Validate complete HTML without client runtime. Do not port homepage, games or deployment in the same step.

## 2026-09-26 — Minimal static Leptos foundation (2.1)

### Completed
- Added root workspace with site/content crates, pinned Rust 1.96.0 and Leptos 0.8.20, and committed dependency lockfile.
- Added a typed PageMetadata boundary and pure HTML rendering function, plus a native generator for `target/site-preview/leptos-proof/index.html`.
- Added rendering regression coverage for document structure, metadata escaping and absence of client scripts/Wasm/preloads.
- Documented build/preview/check commands and ignored root target output. Existing site, games and deployment files remain unchanged.

### Decisions
- Use Leptos `ssr` feature only for native build-time HTML rendering; no router, hydration, browser entry point or server adapter yet.
- Keep dependencies minimal: Leptos is the only direct external crate; content types use std only.
- Keep Memory excluded from the workspace, preserving its own lockfile and release profile.
- Use a fixed repository-relative preview path and noindex proof page. Shared layouts, styling and route/asset manifests remain separate tasks.

### Validation
- Rust 1.96.0 installed locally; workspace format, check, strict all-target/all-feature Clippy and tests passed.
- Existing independent Memory tests: 3 passed. Existing Node suites: 89 passed.
- Cargo metadata confirms exactly two workspace members and Memory's independent workspace root.
- Release generation passed. Both `/leptos-proof/` and its direct `index.html` returned HTTP 200/text-html on a local static server; parsed output contains complete content, viewport metadata and no client resources. The artifact contains only that HTML file.
- Initial release build encountered a dependency archive error; cleaning that dependency and rebuilding with `-j 2` succeeded. Documentation links and git whitespace checks passed.
- Verified no changes to existing site runtime, games, scripts or CI.

### Remaining concerns
- The proof is unstyled, not a visual migration or production website. No responsive parity or full-site SEO claims.
- Jekyll production build and Memory Wasm rebuild were not required for this isolated proof; neither source nor their build configuration changed.
- The existing workflow does not yet validate the new workspace; preview CI is task 2.3.

### Recommended next step
- With consent, implement 2.2: typed route/output manifest and safe allowlisted legacy asset copying, including collision/path-safety tests and direct static route checks. Expected changes: site routing/output modules and tests, planning docs; no deployment cutover or game rewrite.

## 2026-09-26 — Typed routes and isolated legacy output (2.2)

### Completed
- Added `Route`, `OutputPath` and a deterministic output manifest shared by generated pages and legacy files.
- Added collision/path validation and Cabane-only runtime copying; Markdown, Jekyll config and planning documents are excluded.
- Refused symlink inputs/output ancestors, nonregular files, unknown extensions and existing preview directories.
- Added five integration tests and updated preview commands/architecture. No dependencies, game sources or deployment changes.

### Decisions
- Preserve every legacy Cabane runtime byte and public path; register the proof route through the same manifest.
- Validate inputs and collisions before writing. Require a fresh disposable preview to prevent stale output; an interrupted write requires removing that directory before retrying.
- Keep this a partial preview: the homepage and global site shell remain later tasks.

### Validation
- `cargo fmt --check`, `cargo check --locked`, strict all-target/all-feature Clippy and `cargo test --locked`: passed (six Rust tests).
- Existing Node suites: 89 passed, zero failed.
- Release generation passed after the dependency rebuild. All 65 legacy runtime files are byte-identical; the artifact contains only those files and the static proof.
- Local HTTP checks passed for all 18 directory/index page URLs and their HTML resource references; Memory Wasm has application/wasm MIME type. Proof has no script/Wasm loader. Rebuilding into existing output correctly fails.
- Documentation links and git whitespace checks passed.
- Initial release dependency archive failure in syn; cleaned the affected release dependency and the retry passed.

### Remaining concerns
- No visual migration occurred; Cabane's back-to-home link has no migrated homepage in the partial preview.
- No atomic deployment or hostile concurrent-filesystem guarantee is implied by this local generator.
- Production Jekyll and Memory sources/build scripts remain unchanged; no deployment was attempted.

### Recommended next step
- With consent, implement 2.3: nondeploying CI for the Rust workspace/static preview, retaining existing Jekyll/game checks and checking that planning files stay out of output. Scope: one workflow (or job), an artifact verification script if useful, and planning docs. Main risk: CI path filters must include root Cargo and crate changes.
