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
