# Migration TODO

Source of truth for remaining work. Actual source is Jekyll, not Hugo. Read [discovery](migration-discovery.md), [architecture](architecture.md), [progress](progress.md) and current git state before acting. Each numbered task is a separate consent-sized step; do not execute an entire milestone automatically.

## Milestone 1 — Discovery
- [x] Inspect current source, theme, CI and deployment evidence.
- [x] Inventory page/resource routes, content model and used generator features.
- [x] Identify reusable visuals and Cabane DOM/import/storage integration contracts.
- [x] Record live SEO observations, risks, validation limits and target boundaries.
- [x] Establish TODO/progress and record baseline tests/security scan.

## Milestone 2 — Leptos foundation (depends on M1)
- [x] **2.1:** bootstrap minimal stable Rust workspace (`site`, `content`), exclude independent Memory crate, pin compatible Leptos/lockfile, render one complete HTML proof page to separate output without JS/Wasm; run fmt/check/Clippy/tests/production generator and document command. Leave existing deployment untouched.
- [x] **2.2:** Introduce typed route/output manifest; test collisions, path safety, direct static access and allowlisted unchanged Cabane asset copying.
- [ ] **2.3 Next:** Add nondeploying CI checks for Rust/static artifact while retaining all existing game/Jekyll checks; exclude planning Markdown from output.

## Milestone 3 — Shared shell and homepage (depends on M2)
- [ ] 3.1 Capture fresh homepage/Cabane desktop (1440px), mobile (390px), narrow (320px) and print baselines; resolve remote CSS/fonts/icons and licensing; inspect actual Pages settings and 404 response body.
- [ ] 3.2 Port plain CSS tokens, PageLayout/Header/Footer/Section and resume-entry pattern; compare to baseline, including focus/print behavior.
- [ ] 3.3 Extract typed profile/resume/project metadata and Markdown fixtures; preserve raw content, section IDs and public attribution.
- [ ] 3.4 Render homepage with shared ProjectCard, existing links/assets and no Wasm; verify content/SEO and responsive parity.
- [ ] 3.5 Render real 404 document and typed metadata head (language, HTTPS canonical, OG/Twitter, JSON-LD); validate escaping and absent optional values.

## Milestone 4 — Content and project pages (depends on M3)
- [ ] 4.1 Add shared project presentation layout and `/projects/`, `/projects/cabane/`, `/projects/melimo/`; preserve existing homepage and application destinations.
- [ ] 4.2 Add typed TOML-front-matter Markdown article loader with dates/drafts/slugs and fixture tests; document GitHub-only authoring workflow.
- [ ] 4.3 Add static `/blog/` and `/blog/<slug>/` layouts; verify drafts excluded and metadata/links valid. Do not invent personal article content.
- [ ] 4.4 Generate sitemap/robots from route registry; preserve resource paths/CNAME and check artifact completeness.

## Milestone 5 — Cabane integration (depends on M3; game rewrites out of scope)
- [ ] 5.1 Replace only Cabane selection page composition with shared layout primitives and Cabane-scoped theme; keep game controllers/assets intact.
- [ ] 5.2 Establish documented app adapter/asset/DOM ownership contract; verify all relative imports and raw Memory Wasm ABI.
- [ ] 5.3 Check every game in browser, touch inputs, reduced motion, sharing and errors; verify Fluence `?text`, history key, weekly schedule and mobile timer viewport.
- [ ] 5.4 Propose one small native Leptos interaction only if it has concrete benefit; no blanket game rewrite or Melimo hosting.

## Milestone 6 — Publication cutover and legacy removal (depends on M4 + required M5 parity)
- [ ] 6.1 Reconcile latest master and compare full old/new route/content/assets manifests; finish outstanding build/browser/SEO checks.
- [ ] 6.2 Prepare Pages Actions artifact deployment with CNAME/404, source/output separation, rollback instructions and confirmed hosting settings; activate only after parity and appropriate approval.
- [ ] 6.3 Verify deployed direct routes/assets/HTTPS metadata and rollback procedure.
- [ ] 6.4 Remove Jekyll Gemfiles/theme config/Sass preprocessing only after replacement no longer depends on them; retain licenses and useful tests. There is no Hugo infrastructure to remove.

## Milestone 7 — Final validation (gates apply throughout)
- [ ] Run Rust fmt/check/all-target all-feature Clippy/tests and production static build.
- [ ] Run Node game suites and pinned Memory native/Wasm builds; validate Wasm response MIME type.
- [ ] Check all route indexes, unknown-path 404, local links/assets, sitemap/robots and social metadata.
- [ ] Compare responsive/print/accessibility behavior; confirm ordinary pages render fully without JS/Wasm and no unrelated app bundles load.
- [ ] Review dependency/asset size, external requests and tracked source for accidental secrets/private values; preserve intentional public identity.
- [ ] Document adding projects/articles and session continuation; record remaining limits and close only verified tasks.
