use std::{error::Error, fs, path::Path};

use site_content::PageMetadata;

fn main() -> Result<(), Box<dyn Error>> {
    // Fixed, repository-relative staging output: never accept docs/ as a destination.
    let output =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/site-preview/leptos-proof");
    let html = site::render_proof_page(PageMetadata {
        title: "Static Leptos proof".into(),
        description: "An isolated build-time rendering proof for the website migration.".into(),
    });
    fs::create_dir_all(&output)?;
    let page = output.join("index.html");
    fs::write(&page, html)?;
    println!("Generated {}", page.display());
    Ok(())
}
