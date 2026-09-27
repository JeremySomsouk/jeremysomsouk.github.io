use std::{error::Error, path::Path};

use site::output::{Manifest, OutputPath, Route};
use site_content::PageMetadata;

fn main() -> Result<(), Box<dyn Error>> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .ok_or("Cannot locate repository root")?;
    let mut manifest = Manifest::default();
    manifest.insert(
        Route::new("/")?.output().clone(),
        site::render_homepage().into_bytes(),
    )?;
    for asset in [
        "images/profile.webp",
        "images/js-icon.webp",
        "images/melimo-player.png",
        "images/favicon.ico",
    ] {
        manifest.add_legacy_asset(&root.join("docs"), OutputPath::new(asset)?)?;
    }
    let route = Route::new("/leptos-proof/")?;
    let html = site::render_proof_page(PageMetadata {
        title: "Static Leptos proof".into(),
        description: "An isolated build-time rendering proof for the website migration.".into(),
    });
    manifest.insert(route.output().clone(), html.into_bytes())?;
    manifest.insert(
        OutputPath::new("assets/main.css")?,
        site::SITE_CSS.as_bytes().to_vec(),
    )?;
    manifest.add_legacy_cabane(&root.join("docs"))?;
    let output = root.join("target/site-preview");
    manifest.write_new(&output)?;
    println!("Generated {}", output.display());
    Ok(())
}
