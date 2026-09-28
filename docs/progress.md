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

## 2026-09-26 — Nondeploying Leptos CI (2.3)

### Completed
- Added a dedicated Leptos workflow for branch pushes, pull requests and manual dispatch, with read-only repository permissions.
- Added a standard-library Python verifier for the exact artifact set, unchanged Cabane files, static proof without client resources, directory/index routes, local HTML resources and Wasm MIME type.
- Added seven-day downloadable preview artifacts and documented local verification and workflow behavior.
- Kept existing Jekyll/Cabane checks, deployment configuration and application sources unchanged.

### Decisions
- Use no path filters during migration, ensuring root Cargo files, crates and future inputs cannot silently skip checks.
- Use the checked-in Rust toolchain and locked dependency resolution, two build jobs, a job timeout and cancellation of superseded runs of the same event/ref.
- Upload only a successfully verified preview with the normal artifact action; no Pages/deployment permissions or publishing steps.

### Validation
- Python verifier passed on the existing release artifact: 65 identical Cabane files and 18 directory/index URLs, plus HTML resource and Wasm MIME checks.
- Negative checks rejected an extra planning document, a modified Wasm asset and a script added to the proof page; fixtures were restored.
- Workflow YAML parsed and trigger/permission/artifact-path checks passed. Existing Node suites: 89 passed.
- Workspace format/check/strict all-target all-feature Clippy and all six Rust tests passed. Fresh release generation and the committed artifact verifier passed.
- Git whitespace and documentation links passed; existing runtime and Cabane CI files are unchanged.

### Remaining concerns
- GitHub-hosted workflow execution is separate from local validation; no hosted run is claimed here.
- Push and PR events may produce two runs. Manual dispatch becomes available when the workflow is on the default branch.
- The partial preview still has no migrated homepage; this milestone does not assert browser layout/gameplay parity.

### Recommended next step
- With consent, implement 3.1 only: capture desktop/mobile/narrow/print baselines for homepage and Cabane, resolve theme CSS/fonts/icons and licensing, inspect Pages configuration and rendered 404 behavior. Scope: baseline artifacts and discovery/architecture/progress notes; no visual redesign or page migration yet.

## 2026-09-27 — Desktop baseline and single-commit release policy

### Completed
- Captured loaded homepage/Cabane desktop viewport references at 1363×936 and recorded HTTP/CSS hashes.
- Confirmed live missing routes show resume content instead of an error message; documented the replacement requirement.
- Inspected upstream theme MIT notice and existing GPL site license; retained both unchanged.
- Verified hosted Leptos preview run 36229809216 succeeded.
- Recorded the user's single final migration commit, production trial authorization and homepage-to-Cabane transition requirement.

### Decisions
- Land the entire migration as one squash commit on master when ready, with source and deployment-settings rollback instructions; preserve intermediate development history off master.
- Plan a brief progressive navigation animation with cream/green destination identity, normal links and reduced-motion fallback; no SPA/Wasm solely for animation.

### Validation
- Live homepage/Cabane HTTP 200; explicit /404.html HTTP 200 and missing route HTTP 404 share the erroneous resume body.
- Both project images and all seven Cabane images loaded; desktop scroll width stays within viewport.
- GitHub hosted CI success confirmed for the previous implementation commit.
- This session changes documentation/evidence only; no Rust/game/production changes.

### Remaining concerns
- Supported browser API lacks resize/print emulation; requested exact desktop/mobile/narrow/print captures remain incomplete. Full-page capture timed out, viewport capture worked.
- Pages settings endpoint is unsupported by the connector; actual source/build settings remain unverified.
- Font/icon licenses must be checked before vendoring. Do not claim task 3.1 or visual parity complete.

### Recommended next step
- Finish 3.1b with a supported viewport/print capture surface and authorized Pages settings access; then propose shared shell step 3.2. Production trial is authorized when ready, not performed now.

## 2026-09-27 — Shared site shell (3.2 implementation)

### Completed
- Added reusable PageLayout, Header, Footer, Section and ResumeEntry components with header/body/footer slots and semantic headings/landmarks.
- Added a site-only plain CSS stylesheet with the existing violet palette, desktop container, stacked small-screen resume layout, focus/skip-link behavior, print and reduced-motion rules.
- Updated the static proof to exercise components with explicit example content; emitted one local stylesheet through the validated manifest.
- Updated artifact checks for exact CSS bytes, required landmarks and valid in-page navigation/skip-link targets.

### Decisions
- Proceed with implementation while keeping unavailable capture/Pages checks as explicit release gates. No screenshot requirement was silently marked complete.
- Keep all Cabane styles/controllers byte-identical; no game concepts in generic shell components.
- Do not introduce fonts/framework dependencies before license/delivery work. Roboto remains a preferred font with fallback; no visual parity claim.

### Validation
- cargo fmt --check, cargo check --locked, strict all-target/all-feature Clippy, six Rust tests and release generation passed.
- Cached icu_properties rlib was missing; cleaning only that dependency and rebuilding fixed the test environment.
- Artifact verifier passed: 65 unchanged Cabane files, 18 page URLs, local resources, Wasm MIME, shared CSS bytes and proof anchors.
- Cloud browser rejected the file-protocol preview URL under its URL security policy. No alternate browser workaround attempted; rendered visual comparison remains unverified.
- No existing homepage, game, deployment or dependency-lockfile changes.

### Remaining concerns
- Complete mobile/print and shared-shell visual review before release; resolve font metrics/delivery when migrating real content.
- The new shell is a fixture only. The public homepage remains Jekyll and the requested Cabane transition remains planned.
- All work stays off master, to be included in the single final migration squash commit.

### Recommended next step
- With consent, implement 3.3: extract current profile/resume/project content into explicit Rust models and Markdown fixtures with content-preservation tests. Expected scope: content crate, content files, tests and planning docs. Full homepage composition is still the following step.

## 2026-09-27 — Typed homepage content (3.3)

### Completed
- Extracted seven Markdown prose files and explicit profile, resume-section/entry, project, link and image records into the content crate.
- Preserved public identity, prose, project copy/order, tags, notes, image paths/alt text/dimensions, project IDs and navigation destinations.
- Added three preservation tests and documented editing/coexistence in content/home/README.md; marked 3.3 complete and 3.4 next.

### Decisions
- Use compile-time records and include_str! for the fixed homepage dataset; add no runtime YAML/HTML parser or new dependency.
- Keep author Markdown, including intentional inline HTML, separate from plain-text card metadata. Rendering and Markdown parser selection remain in 3.4.
- Make employer domains explicit HTTPS URLs. Keep profile image dimensions unspecified until measured.
- Production still reads legacy YAML; synchronize both sources until cutover. Retain development commits off master for one final migration squash commit.

### Validation
- Rust formatting, locked compilation, strict all-target/all-feature Clippy and all nine Rust tests passed.
- Independent one-time YAML comparison confirmed all seven Markdown bodies match exactly, including whitespace; existing trailing whitespace is retained intentionally.
- Release generation and artifact verification passed: 65 unchanged Cabane files, 18 page URLs, local resources and static proof.
- Release dependency archives hit zero-length object errors (syn, rstml, leptos_hot_reload); targeted dependency cleaning and a serial retry completed successfully.
- No homepage rendering, CSS, game controller, dependency lockfile or deployment changes. No new visual comparison is claimed.

### Remaining concerns
- Preserve migration parity fixtures before deleting legacy YAML; current tests intentionally reference it.
- Verify Markdown rendering and theme-derived section anchors in 3.4; mobile/print/font and hosting release gates remain open.
- The homepage-to-Cabane transition remains planned for landing-page integration.

### Recommended next step
- Implement 3.4: compose the real static homepage from these records with shared ProjectCard, Markdown rendering and existing assets; validate content, links and visual behavior before cutover.

## 2026-09-27 — Static homepage candidate (3.4 implementation)

### Completed
- Added real homepage composition from the typed profile/resume/project records, trusted Markdown and shared shell/ProjectCard.
- Preserved every live section/project/resume anchor, existing title/description/social metadata, visible employer domains, contact details, images and project actions. Canonical, OG and structured URLs use HTTPS.
- Added typed portrait dimensions (measured 1024×1024), four explicit legacy asset registrations, and scoped homepage CSS based on existing cards/palette/layout.
- Expanded artifact validation for homepage anchors, unique IDs, metadata/JSON-LD, local links, unchanged asset bytes and absent executable runtime. Documented the preview and remaining visual gates.

### Decisions
- Add only pulldown-cmark 0.13.4 with default features disabled and HTML output enabled; smart punctuation matches legacy prose. Raw author HTML is trusted repository input, not sanitized user submissions.
- Preserve JSON-LD as inert data. Share typed document metadata in the next task rather than introducing a second generic head system here.
- Keep real same-tab navigation; employer links retain new tabs with noopener. Text social labels/fallback fonts are provisional until licensed font/icon delivery and visual review.
- Keep production, Cabane code and deployment unchanged. This development commit remains off master for the single final migration squash commit.

### Validation
- Fresh live HTML inspection established the exact page title, metadata, contact/employer links and all 13 legacy IDs. Existing desktop screenshot and custom Sass were used as implementation references, not proof of rendered parity.
- Formatting, locked compilation, strict all-target/all-feature Clippy and 13 Rust tests passed, including Markdown, escaping and selected-asset safety checks.
- Artifact checks caught incorrect JSON-LD serialization during development; corrected the script's content rendering.
- Optimized generation and artifact verification passed: 20 page URLs, 65 unchanged Cabane files and four unchanged homepage assets. All 49 live paragraph/list text items were found in the generated page; homepage HTML is 9,442 bytes.
- Negative artifact checks rejected a missing anchor, executable event handler, incorrect JSON-LD URL and modified image, then passed after restoration.
- Default release builds repeatedly encountered zero-length object archives in this workspace; targeted cleanup did not resolve it. A temporary CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1 build succeeded. No repository build profile was changed; verify the default command in clean hosted CI before release.

### Remaining concerns
- Local preview browser restriction remains unresolved. Font/icon presentation, exact desktop/mobile/print behavior and visual parity remain open under 3.4b; no screenshots of the new homepage were claimed.
- Hosting settings, shared typed head/404, full publication output and the Cabane transition are still pending. No cutover is attempted with this partial candidate.

### Recommended next step
- Implement 3.5: shared typed metadata/head generation and a real static 404 document, with escaping/optional-field tests. Finish the documented visual gates before production landing.

## 2026-09-28 — Shared SEO and static 404 (3.5)

### Completed
- Centralized document/head rendering for homepage, proof and error page; added typed language, indexing, canonical, social-image and structured-data metadata.
- Reused homepage identity through WebsiteLayout and generated a real /404.html with recovery links, noindex/follow and no misleading canonical/social metadata.
- Added safe typed JSON-LD serialization and tests for optional fields, French locale, canonical path validation, malicious metadata and closing-script payloads.
- Confirmed normal hosted homepage CI succeeded: run 36348020144 for 2355393. The previous local compiler workaround was not needed there.

### Decisions
- Canonical/social image URLs stay on the existing HTTPS origin and reject ambiguous paths; current homepage metadata remains unchanged except the shared renderer also supplies Twitter description.
- Use Serde/serde_json directly for typed serialization, reusing already locked versions without new transitive packages. Escape HTML-sensitive characters after JSON serialization and propagate errors.
- Shared static HTML does not determine response status. The verifier simulates custom-404 hosting; production missing-path behavior still requires cutover verification.
- Keep the existing deployment and Cabane files unchanged. Development remains off master for the final single migration commit.

### Validation
- Formatting, locked compilation, strict all-target/all-feature Clippy and all 18 Rust tests passed.
- Default optimized generation passed after cleaning a corrupt rstml build artifact; no compiler/profile workaround was committed.
- Artifact validation passed: 65 unchanged Cabane files, 21 page URLs, existing resources, homepage metadata and two simulated missing-route 404 responses with the correct body/status.
- Negative checks rejected an indexable 404, relative error-page stylesheet and misleading canonical, then passed after restoring the artifact.

### Remaining concerns
- Font/icon restoration and desktop/mobile/print visual review remain open; the prior browser-preview restriction is unchanged. No visual parity or production deployment is claimed.
- The 404 host configuration must be verified on Pages; the test server is only a simulation and the README preview command does not install its fallback.

### Recommended next step
- Restore licensed local Roboto and the social icons (remaining 3.4b), then complete the visual gate on a supported preview before production. Project presentation pages follow in 4.1.

## 2026-09-27 — Local typography and navigation icons

### Completed
- Added self-hosted Inter variable normal/italic Latin and Vietnamese fonts and four Tabler SVG profile icons, with original licenses and provenance.
- Added typed profile link kinds, accessible labels, 48px circular links, keyboard focus and forced-colors text fallback.
- Generalized explicit asset registration and extended artifact validation for local fonts, passive SVGs, labels and licensing files.

### Decisions
- User authorized a restrained font/icon refresh: Inter replaces provisional Roboto; Tabler outlines reuse the existing circular navigation motif. Violet branding, public links and Cabane runtime stay unchanged.
- Four font subsets total 120,936 bytes; no JavaScript, external font request, icon font, new package dependency or production deployment.
- Development remains on a branch for the final single migration squash commit.

### Validation
- cargo fmt --check, locked cargo check, strict all-target/all-feature Clippy and all 18 Rust tests passed.
- Optimized production generation and artifact verifier passed: 65 byte-identical Cabane files, 21 page URLs, local resources/fonts and two simulated missing-route 404 responses.
- A corrupt cached release object was resolved with cargo clean -p site --release; no build configuration workaround was committed.
- Fontsource tarball integrity matched published SHA-512; licenses and exact public asset bytes are retained.

### Remaining concerns
- The existing browser-preview restriction still prevents visual approval. Wrapping, actual font rendering, desktop/mobile/print and browser accessibility checks remain release gates; code checks do not prove visual parity.
- Hosted CI for this commit and production Pages settings still need verification.

### Recommended next step
- Complete visual review in 3.4c on a supported preview, adjusting typography or spacing if needed. Then begin project presentation pages (4.1), followed by the planned Cabane landing/transition boundary.


## 2026-09-28 — Consolidated single-commit review checkpoint

### Completed
- Verified that all 10 migration branch tips are ancestors of `1dee4f3`; there are no independent migration changes to reconcile.
- Prepared `feat/leptos-migration-consolidated` as one commit over current master `ef5113ed1077472f85f6f8f19e625f2bcb1a3abc`, preserving the implementation tree plus this checkpoint documentation.
- Retained the original migration branches and history; no force push, deletion, merge or deployment.

### Decisions
- User requested one consolidated commit/PR while away from a computer. The draft PR is a review checkpoint for all completed work, not a claim that the migration is finished.
- Continue development from the consolidated branch. Final landing must still use one squash commit, even if subsequent implementation adds commits to this branch.
- Existing production Jekyll source and deployment remain intact. Project/blog pages, Cabane shell/transition, sitemap/robots and Pages cutover are still open.

### Validation
- Fresh remote fetch confirmed unchanged master and clean source checkout; all 10 migration tips are included.
- Implementation is unchanged from the previous locally validated commit (18 tests, strict Clippy, optimized generation and static artifact checks).
- The consolidated tree is checked against the source tip; only todo/progress documentation differs. Hosted checks for the new PR must be observed separately.

### Remaining concerns
- Visual review is still blocked by the supported-preview limitation. The consolidation does not waive release gates or activate production.

### Recommended next step
- Review the consolidated PR and continue the outstanding migration tasks there; keep it draft until release gates and deployment preparation are complete.

## 2026-09-28 — Plan final public documentation cleanup

### Completed
- Added milestone 8 for removing migration exploration, architectural detail, baseline artifacts and implementation logs at the end of the migration.

### Decisions
- Keep only concise public product documentation, the big-picture architecture, essential maintenance instructions and required licenses/attribution.
- Retain TODO/progress while work continues; remove both during final cleanup after transferring durable information. This supersedes permanent retention of migration logs.
- Preserve unrelated documentation and published history; cleanup concerns the final repository tree.

### Validation
- Documentation-only change; checked diff formatting and explicit cleanup scope. No application code changed.

### Remaining concerns
- Cleanup must happen after remaining work and validation, so future sessions retain their continuation context.

### Recommended next step
- Continue project presentation pages (4.1) on the consolidated branch; perform milestone 8 at release completion.

## 2026-09-28 — Shared static project presentations

### Completed
- Added `/projects/`, `/projects/cabane/` and `/projects/melimo/` using the existing typed project records, assets and shared website shell.
- Shared project descriptions/tags/actions between homepage cards and detail pages; added breadcrumbs and a homepage link to the project index.
- Generated project-specific canonical/social metadata and preview images, with no client runtime. Existing Cabane and Mélimo application/repository destinations are preserved.

### Decisions
- Presentation paths derive from each project slug; the generator automatically registers each detail page. Content remains in one record per project.
- Continue on the consolidated PR branch while visual release gates remain open. No Cabane controller rewrite, new dependency, hosting change or extra project claims.
- Essential project-authoring instructions belong in README; the final documentation cleanup remains scheduled.

### Validation
- Formatting, locked compilation, strict all-target/all-feature Clippy and all 20 Rust tests passed, including project metadata/destination checks and invalid-path rejection.
- Restored the pinned Rust toolchain after the workspace environment expired. The release build produced a zero-length rstml object even after cleaning that package; no toolchain/build-policy change.
- Debug generation and artifact verification passed: 65 unchanged Cabane files, 27 page URLs, project metadata/local links and two simulated 404 responses. Clean hosted CI must validate the normal optimized build for this head.
- Previous PR head `303a648` passed hosted Leptos and Cabane checks (runs 36358976756 and 36358976738).

### Remaining concerns
- Actual browser responsive/print/accessibility comparison remains outstanding; automated checks do not establish visual approval.
- New-head hosted CI must complete after publishing. Production remains unchanged.

### Recommended next step
- Add the typed Markdown article loader (4.2), including dates, drafts and safe slugs; retain the separate visual release gate.
