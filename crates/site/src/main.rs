use std::{error::Error, path::Path};

use site::output::{Manifest, OutputPath, Route};
use site_content::{Indexing, PageMetadata};

fn main() -> Result<(), Box<dyn Error>> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .ok_or("Cannot locate repository root")?;
    let as_of: site_content::ArticleDate = std::env::var("SITE_BUILD_DATE")
        .map_err(|_| "Set SITE_BUILD_DATE=YYYY-MM-DD (UTC publication cutoff)")?
        .parse()?;
    let articles = site_content::load_articles(&root.join("content/blog"))?;
    let mut manifest = Manifest::default();
    manifest.insert_page(Route::new("/")?, site::render_homepage()?, Indexing::Index)?;
    manifest.insert(
        OutputPath::new("404.html")?,
        site::render_not_found()?.into_bytes(),
    )?;
    manifest.insert_page(
        Route::new("/projects/")?,
        site::render_projects()?,
        Indexing::Index,
    )?;
    for project in site_content::HOMEPAGE.projects {
        manifest.insert_page(
            Route::new(&project.presentation_path())?,
            site::render_project(project.clone())?,
            Indexing::Index,
        )?;
    }
    for asset in [
        "images/profile.webp",
        "images/js-icon.webp",
        "images/melimo-player.png",
        "images/favicon.ico",
    ] {
        manifest.add_static_asset(&root.join("docs"), OutputPath::new(asset)?)?;
    }
    for asset in [
        "fonts/inter/inter-latin-wght-italic.woff2",
        "fonts/inter/inter-latin-wght-normal.woff2",
        "fonts/inter/inter-vietnamese-wght-italic.woff2",
        "fonts/inter/inter-vietnamese-wght-normal.woff2",
        "icons/tabler/brand-github.svg",
        "icons/tabler/brand-linkedin.svg",
        "icons/tabler/home.svg",
        "icons/tabler/world.svg",
        "licenses/Inter-OFL.txt",
        "licenses/THIRD-PARTY.txt",
        "licenses/Tabler-MIT.txt",
    ] {
        manifest.add_static_asset(&root.join("public"), OutputPath::new(asset)?)?;
    }
    let route = Route::new("/leptos-proof/")?;
    let html = site::render_proof_page(PageMetadata {
        description: Some(
            "An isolated build-time rendering proof for the website migration.".into(),
        ),
        ..PageMetadata::new("Static Leptos proof")
    })?;
    manifest.insert_page(route, html, Indexing::NoIndexNoFollow)?;
    manifest.insert(
        OutputPath::new("assets/main.css")?,
        site::SITE_CSS.as_bytes().to_vec(),
    )?;
    manifest.add_legacy_cabane(&root.join("docs"))?;
    site::blog::add_blog(&mut manifest, &articles, as_of)?;
    manifest.add_discovery(&root.join("docs"))?;
    let output = root.join("target/site-preview");
    manifest.write_new(&output)?;
    println!("Generated {}", output.display());
    Ok(())
}
