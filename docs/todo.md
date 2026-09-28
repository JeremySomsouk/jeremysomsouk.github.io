# Migration TODO

Source of truth for remaining work. Actual source is Jekyll, not Hugo. Read [discovery](migration-discovery.md), [architecture](architecture.md), [progress](progress.md) and current git state before acting. Each numbered task is a separate consent-sized step; do not execute an entire milestone automatically. Final production landing must be ONE squash commit for the whole migration (user instruction 2026-09-27); keep development commits off master.

## Consolidated review checkpoint
- [x] Prepare one squashed checkpoint from all 10 migration branches through `1dee4f3`, based on `ef5113e`, on `feat/leptos-migration-consolidated`; retain original branches.
- [ ] Complete remaining migration/release gates below before final landing; this checkpoint does not activate Leptos deployment. Continue from the consolidated branch, and use one final squash merge into master.

## Milestone 1 — Discovery
- [x] Inspect current source, theme, CI and deployment evidence.
- [x] Inventory page/resource routes, content model and used generator features.
- [x] Identify reusable visuals and Cabane DOM/import/storage integration contracts.
- [x] Record live SEO observations, risks, validation limits and target boundaries.
- [x] Establish TODO/progress and record baseline tests/security scan.

## Milestone 2 — Leptos foundation (depends on M1)
- [x] **2.1:** bootstrap minimal stable Rust workspace (`site`, `content`), exclude independent Memory crate, pin compatible Leptos/lockfile, render one complete HTML proof page to separate output without JS/Wasm; run fmt/check/Clippy/tests/production generator and document command. Leave existing deployment untouched.
- [x] **2.2:** Introduce typed route/output manifest; test collisions, path safety, direct static access and allowlisted unchanged Cabane asset copying.
- [x] **2.3:** Add nondeploying CI checks for Rust/static artifact while retaining all existing game/Jekyll checks; exclude planning Markdown from output.

## Milestone 3 — Shared shell and homepage (depends on M2)
- [x] 3.1a Capture available desktop viewport references, inspect resolved CSS/theme license and confirm live 404 body; record successful hosted Leptos CI.
- [ ] 3.1b (release gate): Complete exact 1440px/390px/320px and print baselines using a supported capture surface; verify account-level Pages settings (vendored font/icon licenses verified in 3.4b). See migration-baseline/2026-09-27/README.md for current limitations.
- [x] 3.2a Implement scoped plain CSS tokens, PageLayout/Header/Footer/Section and resume-entry pattern in the static proof.
- [ ] 3.2b (release gate) Compare rendered shared shell/homepage to baseline, including keyboard focus, mobile widths and print. Local preview browser navigation is currently blocked; do not claim visual parity.
- [x] **3.3:** Extract typed profile/resume/project metadata and Markdown fixtures; preserve raw content, section IDs and public attribution.
- [x] 3.4a Render static homepage with shared ProjectCard, trusted Markdown, existing links/assets/anchors and no client runtime; verify content, baseline metadata and exact asset copying.
- [x] 3.4b: Deliver licensed local Inter variable fonts and Tabler SVG profile icons, with typed link kinds, accessible labels and asset verification. User authorized a restrained font/icon refresh.
- [x] Prepare a separate owner-private hosted snapshot of `1455b38` for phone-based visual review; keep production unchanged.
- [ ] **3.4c Visual release gate** (release gate; depends on 3.1b/3.2b): Compare Inter/icon candidate against the legacy homepage at 1440px/390px/320px and print on a supported preview; check wrapping, focus, font loading and accessible navigation. User approved the phone preview informally on 2026-09-28; exact-width desktop/mobile/print and accessibility checks remain outstanding.
- [x] **3.5:** Render real 404 document and typed metadata head (language, HTTPS canonical, OG/Twitter, JSON-LD); validate escaping and absent optional values.

## Milestone 4 — Content and project pages (uses M3 implementation; visual release gates remain open)
- [x] 4.1 Add shared project presentation layout and `/projects/`, `/projects/cabane/`, `/projects/melimo/`; preserve existing homepage and application destinations. Local checks and clean hosted optimized build passed (run 36387341254); visual release gates remain separate.
- [x] **4.2:** Add typed TOML-front-matter Markdown article loader with dates/drafts/slugs and fixture tests; document GitHub-only authoring workflow.
- [ ] **4.3 Next:** Add static `/blog/` and `/blog/<slug>/` layouts; verify drafts excluded and metadata/links valid. Do not invent personal article content.
- [ ] 4.4 Generate sitemap/robots from route registry; preserve resource paths/CNAME and check artifact completeness.

## Milestone 5 — Cabane integration (depends on M3; game rewrites out of scope)
- [ ] 5.1 Replace only Cabane selection page composition with shared layout primitives and Cabane-scoped theme; keep game controllers/assets intact.
- [ ] 5.1a Add the requested gentle homepage → Cabane transition as progressive enhancement; preserve normal navigation, reduced motion, mobile responsiveness and per-project identity. See architecture brief.
- [ ] 5.2 Establish documented app adapter/asset/DOM ownership contract; verify all relative imports and raw Memory Wasm ABI.
- [ ] 5.3 Check every game in browser, touch inputs, reduced motion, sharing and errors; verify Fluence `?text`, history key, weekly schedule and mobile timer viewport.
- [ ] 5.4 Propose one small native Leptos interaction only if it has concrete benefit; no blanket game rewrite or Melimo hosting.

## Milestone 6 — Publication cutover and legacy removal (depends on M4 + required M5 parity)
- [ ] 6.1 Reconcile latest master and compare full old/new route/content/assets manifests; finish outstanding build/browser/SEO checks.
- [ ] 6.1a Prepare ONE final squash commit containing the whole migration; record baseline SHA and source/settings rollback procedure. Do not merge intermediate branches into master.
- [ ] 6.2 Prepare Pages Actions artifact deployment with CNAME/404, source/output separation, rollback instructions and confirmed hosting settings; activate only after parity and appropriate approval.
- [ ] 6.3 Verify deployed direct routes/assets/HTTPS metadata and rollback procedure.
- [ ] 6.4 Remove Jekyll Gemfiles/theme config/Sass preprocessing only after replacement no longer depends on them; retain licenses and useful tests. There is no Hugo infrastructure to remove.

## Milestone 7 — Final validation (gates apply throughout)
- [ ] Run Rust fmt/check/all-target all-feature Clippy/tests and production static build.
- [x] Confirm the homepage branch default release build in clean hosted CI: run 36348020144 passed for 2355393 (checked 2026-09-27).
- [ ] Run Node game suites and pinned Memory native/Wasm builds; validate Wasm response MIME type.
- [ ] Check all route indexes, unknown-path 404, local links/assets, sitemap/robots and social metadata.
- [ ] Compare responsive/print/accessibility behavior; confirm ordinary pages render fully without JS/Wasm and no unrelated app bundles load.
- [ ] Review dependency/asset size, external requests and tracked source for accidental secrets/private values; preserve intentional public identity.
- [ ] Document adding projects/articles and session continuation; record remaining limits and close only verified tasks.

## Milestone 8 — Public documentation cleanup (final release step; depends on completed migration and validation)
- [ ] Replace migration-specific architectural/exploration documentation with a concise README describing what the site is, the broad static Leptos architecture, and essential build/content-maintenance instructions. Keep required licenses and attribution.
- [ ] Remove exploration and implementation records created during this migration: `docs/migration-discovery.md`, `docs/architecture.md`, `docs/migration-baseline/`, and any other migration-only notes/artifacts. Transfer only useful high-level information first; do not remove project content or unrelated documentation.
- [ ] Once no migration tasks remain, remove `docs/progress.md` and this migration `docs/todo.md`; update links and verification references so the final published tree contains no migration logs or detailed implementation diary. These files remain the continuation record until that final cleanup (user instruction 2026-09-28).
- [ ] Review the final squash diff and generated site for leftover exploration documents and broken documentation links. File removal cleans the final tree; it does not erase already published development history. Do not rewrite history as part of this task.
