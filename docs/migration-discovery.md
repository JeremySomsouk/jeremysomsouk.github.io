# Website migration discovery

Inspected 2026-09-26, baseline `ef5113e` on `master`. This is a discovery-only milestone: no runtime, game, route, deployment or design changes.

## Actual architecture

The premise that this is Hugo is incorrect. The 102 tracked files describe **Jekyll + static Cabane pages**, with no Hugo configuration, layouts, shortcodes or taxonomies. There are no repository AGENTS.md files or existing TODO/progress documents.

| Source | Actual responsibility |
| --- | --- |
| `docs/_config.yml` | Resume content in YAML, Markdown strings, raw HTML project cards, social/navigation links, theme and SEO configuration |
| `docs/index.md` | Front matter selecting remote `default` layout; no article body |
| `docs/Gemfile`, `Gemfile.lock` | GitHub Pages/Jekyll dependencies |
| `docs/assets/main.scss` | Liquid asset URL, imported theme Sass, purple branding, project grid, print rules |
| `docs/404.html` | Jekyll default layout plus custom error markup and permalink |
| `docs/cabane/` | Eight standalone HTML entry points, JS modules, CSS, images, reading JSON, Memory Wasm |
| `games/memory/` | Independent Rust 2024 cdylib/rlib engine; no crate dependencies |
| `scripts/` | Game build plus 16 Node test files |
| `.github/workflows/cabane-checks.yml` | Node tests, Rust 1.96.0 tests/Clippy/Wasm, production Jekyll build and copied-file checks; uploads artifact, does not deploy |
| `CNAME`, `docs/CNAME` | Existing public custom domain |

The README identifies `docs/` as the Pages source. Account-level Pages settings were not inspected: confirm before cutover. No root Cargo workspace exists. A simple static server previews Cabane but cannot render the Jekyll homepage.

## Route contract

| URL | Source | Behavior to preserve |
| --- | --- | --- |
| `/` | `docs/index.md` + config + remote theme | English resume, contact/social links, project cards |
| `/404.html` | `docs/404.html` | Error page; verify rendered error body separately because default theme does not interpolate page content |
| `/cabane/` | `docs/cabane/index.html` | French game selection, welcome artwork, share, `#games` |
| `/cabane/lecture/` | `lecture/index.html` | La Fluence; `?text=<id>`, weekly schedule, timer, local history |
| `/cabane/memory/` | `memory/index.html` | JS controller + Rust Wasm engine |
| `/cabane/chemin/` | `chemin/index.html` | JS generated path puzzles |
| `/cabane/calculs/` | `calculs/index.html` | Handwritten arithmetic |
| `/cabane/chiffres/` | `chiffres/index.html` | Linked digit drawing/recognition prototype |
| `/cabane/lumiere/` | `lumiere/index.html` | JS light puzzles |
| `/cabane/river/` | `river/index.html` | JS river game |

Preserve trailing-slash directory indexes, direct `index.html` access, `/assets/main.css`, `/images/*`, `/cabane/*` resource URLs and cache query strings. Preserve homepage anchors including `#personal-projects` and theme-generated section IDs. Do not rename lecture to fluence or river to riviere as part of this migration. `/projects/`, `/projects/cabane/`, `/projects/melimo/`, `/blog/` and `/melimo/` are not existing pages; the first four are prospective additions, the last is reserved only.

## Generator features actually used and replacements

| Current feature | Replacement |
| --- | --- |
| Remote `sproogen/resume-theme` | Local Leptos shell, header, footer, resume sections |
| Theme `default`, text/list sections, left detail layout | Typed page composition and reusable section/resume components |
| Liquid includes, `relative_url`, `slugify`, `markdownify` | Explicit route/assets helpers, stable IDs, Rust Markdown conversion |
| YAML config mixing text/list section types | Explicit structs/enums and extracted Markdown; retain original until parity |
| Sass + Liquid preprocessing | Plain CSS/custom properties; progressively port used rules |
| `jekyll-seo-tag` | Typed metadata rendered directly into static document head |
| 404 front matter/permalink | Explicit output route with real error content |
| Static copy behavior | Validated asset manifest with collision checks |
| CNAME + Pages build | Retain domain; staged Actions-generated static artifact at final cutover |

No local layouts/partials/shortcodes, posts, taxonomy pages, custom collections or content menus were found. Navigation is YAML `additional_links`/social fields and hard-coded Cabane links. Blog publication is a new requirement, not existing Hugo behavior to reproduce.

The upstream theme was inspected at `8901c8bcd4713b5a1fafcf0cccb130b840a8519d` (modern-resume-theme repository). This is current upstream evidence, not proof of the exact deployed theme revision: the site uses an unpinned remote theme. Relevant files: `_layouts/default.html`, `_includes/{head,header,about,footer,section-list,section-text}.html`, `_sass/`. Default renders config sections, not page body. Its base CSS imports Google Roboto, Bootstrap 3.3.5 and Font Awesome 5.11.2/v4 shims from external CDNs. Preserve necessary license notices if copying theme rules; do not import a new UI framework.

## Visual patterns and integration seams

Homepage: dark violet background, lilac headings, profile image, JS icon, resume detail/content columns, two project cards becoming one column below 768px, contained project images, print overrides, visible focus rings. Reuse PageLayout, Header, Footer, Section, ProjectCard and a resume entry pattern; avoid trivial typography wrappers.

Cabane: warm cream/green/terracotta palette, rounded system fonts, constrained `.shell`, toolbar/back/share, illustrated cards, large touch targets, responsive game grids and reduced-motion rules. Shared `style.css` also contains Memory and Fluence rules, so it cannot safely become global site CSS. Keep it scoped to Cabane documents initially; theme tokens can later share semantic names without forcing the purple site identity onto games.

The homepage links to `/cabane/` and uses `/cabane/images/welcome.webp`. Cabane links back to `/`. Existing entry points are real full documents, not iframe embeds. Their controllers depend on exact DOM IDs, relative imports and CSS. Shared `share.mjs` and `celebration.mjs/css` are integration seams. Chemin imports Fluence timer code; Calculs imports Chiffres drawing/preprocessing. Keep the complete directory together initially. Memory loads `game.wasm` using a raw exported ABI, not Leptos hydration. Fluence fetches `texts.json`/`schedule.json`, shares `?text=`, stores `cabane.readings.v1`, and compensates for mobile visual viewport behavior. Preserve these contracts and the origin.

## Live observations and validation limits

Direct HTTP inspection found homepage and Cabane landing HTTP 200. Homepage reports Jekyll 3.10.0, English language, resume title, description `Just a simple playground`, OG/Twitter tags and JSON-LD. Canonical and OG URL use HTTP; target should use HTTPS. `/robots.txt` and `/sitemap.xml` returned 404. Cabane source generally has titles/theme-color/favicon but lacks descriptions, canonical and social metadata; River has a description. Correcting these is planned work, not done here.

The search-engine snapshot showed older Melimo copy than repository HEAD, so use pinned source for migration content and a freshly captured browser baseline for appearance. No screenshots or responsive browser comparison were completed in discovery. Ruby/Bundler and Rust/Cargo are absent in this environment; production Jekyll and Rust checks could not be rerun. Existing Node suites: 89 passed, 0 failed. This is not production-build or browser equivalence evidence.

## Risks and mitigations

| Risk | Mitigation / gate |
| --- | --- |
| Remote theme and external CSS hide layout dependencies | Capture desktop/mobile/print baselines and resolved CSS before porting shell |
| `docs/` is both publication source and required planning location | Leave new planning Markdown without front matter; explicitly exclude planning files from final artifact; never copy all docs blindly |
| Global selectors collide with Cabane | Separate stylesheets/documents initially; scope tokens before shared shell integration |
| Renamed paths break imports, shared text links and bookmarks | Freeze route manifest and asset paths; query/storage regression checks |
| Root workspace changes Memory profiles/build artifacts | Keep Memory independent at first; explicitly exclude it from workspace and retain script/CI |
| Leptos static output accidentally loads Wasm everywhere | Assert homepage/project HTML works without JS and has no Wasm loader/preload |
| Markdown differs from Jekyll/Kramdown or raw HTML is lost | Representative fixtures for lists, links, marks, headings, Unicode and trusted HTML; never execute Markdown scripts |
| Duplicate routes or partially overwritten artifacts | One output owner per URL, collision errors, separate staging directory |
| Deployment cutover removes domain or 404 behavior | Confirm Pages settings, preserve CNAME, compare complete artifacts and retain rollback to current source commit |
| New content or games change during migration | Reconcile against latest master before each step; no frozen-source overwrite |

Security review: tracked-text signature scan found no matching private-key, GitHub token, AWS access-key or Google API-key patterns. This is a limited current-tree check, not a full history/binary/secret audit. Public identity/contact/employment details are intentional site content and remain untouched; analytics options are commented out. No credentials or infrastructure values were added.
