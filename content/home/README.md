# Homepage content

These Markdown files are the authored source for the homepage prose.
`crates/content/src/homepage.rs` holds explicit profile, resume and project
records in their original order. Projects are typed fields rather than copied
HTML cards. No new copy or hosted Mélimo app is added.

A frozen snapshot of the removed legacy Jekyll configuration is kept at
`crates/content/tests/fixtures/legacy-homepage.yml`; the Rust preservation
tests compare the current prose against that fixture, so the parity evidence
survives the Jekyll removal.

Edit prose here and metadata in the Rust records. No front matter or parser is
needed for these compile-time homepage records. Article loading is a separate
path with typed TOML front matter. The `Markdown` wrapper denotes trusted
repository content, including intentional `<mark>` and project-jump HTML; it
is not sanitized user input. The site renderer tests Markdown lists,
paragraphs, inline HTML and escaping of plain-text metadata.

Existing project image URLs, alt text, dimensions, heading IDs, tags, action
labels and destinations are retained. Employer domains are made explicit HTTPS
URLs. The profile image was measured at 1024×1024 and now uses the same typed Image
record as projects; do not invent responsive image variants. Keep the existing public
name, email and social links, and preserve theme/license notices at cutover.

Run `cargo test -p site-content` for extraction checks. This directory is authoring
source and must never be copied wholesale into the public artifact.
