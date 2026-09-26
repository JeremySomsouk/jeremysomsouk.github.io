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
