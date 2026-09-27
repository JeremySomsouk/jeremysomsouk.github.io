# Homepage content

These Markdown files preserve the active prose from `docs/_config.yml`, with
only YAML indentation removed. `crates/content/src/homepage.rs` holds explicit
profile, resume and project records in their original order. Projects are typed
fields rather than copied HTML cards. No new copy or hosted Mélimo app is added.

During coexistence, the public site still reads the legacy YAML. Keep both
sources synchronized until homepage cutover. Rust preservation tests compare
against the legacy source; replace those checks with a stable migration fixture
when removing Jekyll, rather than deleting the parity evidence.

Edit prose here and metadata in the Rust records. No front matter or parser is
needed for these compile-time homepage records. Future article loading is a
separate task with typed TOML front matter. The `Markdown` wrapper denotes
trusted repository content, including intentional `<mark>` and project-jump
HTML; it is not sanitized user input. The next rendering step must test Markdown
lists, paragraphs, inline HTML and escaping of plain-text metadata.

Existing project image URLs, alt text, dimensions, heading IDs, tags, action
labels and destinations are retained. Employer domains are made explicit HTTPS
URLs. Profile image dimensions are deliberately unspecified until measured;
do not invent dimensions or responsive image variants. Keep the existing public
name, email and social links, and preserve theme/license notices at cutover.

Run `cargo test -p site-content` for extraction checks. This directory is authoring
source and must never be copied wholesale into the public artifact.
