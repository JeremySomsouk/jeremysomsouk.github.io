use std::{
    fs, io,
    path::PathBuf,
    sync::atomic::{AtomicU64, Ordering},
};

use site::output::{Manifest, OutputPath, Route};

static NEXT: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> io::Result<Self> {
        let path = std::env::temp_dir().join(format!(
            "site-output-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path)?;
        // macOS exposes the system temporary directory through symlinked
        // components such as /var; canonicalize so the symlink guards below
        // validate the real filesystem layout instead of rejecting host aliases.
        let path = fs::canonicalize(&path)?;
        Ok(Self(path))
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn routes_are_directory_indexes_and_reject_unsafe_urls() -> io::Result<()> {
    assert_eq!(Route::new("/")?.output().as_str(), "index.html");
    assert_eq!(
        Route::new("/cabane/lecture/")?.output().as_str(),
        "cabane/lecture/index.html"
    );
    for value in [
        "",
        "relative/",
        "/no-slash",
        "//",
        "/../",
        "/a/./",
        "/a//b/",
        "/%2e%2e/",
        "/a?x/",
        "/a#b/",
        "/a\\b/",
    ] {
        assert!(Route::new(value).is_err(), "accepted {value}");
    }
    for value in [
        "/absolute",
        "../escape",
        "a/../../b",
        "C:/file",
        "a\\b",
        "a//b",
        "a/",
        "",
    ] {
        assert!(OutputPath::new(value).is_err(), "accepted {value}");
    }
    Ok(())
}

#[test]
fn rejects_duplicates_and_file_directory_collisions_in_both_orders() -> io::Result<()> {
    for (first, second) in [("a", "a"), ("a", "a/b"), ("a/b", "a")] {
        let mut manifest = Manifest::default();
        manifest.insert(OutputPath::new(first)?, vec![1])?;
        assert!(manifest.insert(OutputPath::new(second)?, vec![2]).is_err());
    }
    Ok(())
}

#[test]
fn copies_binary_assets_exactly_and_excludes_planning_sources() -> io::Result<()> {
    let fixture = Fixture::new()?;
    let docs = fixture.0.join("docs");
    fs::create_dir_all(docs.join("cabane/memory"))?;
    fs::write(docs.join("todo.md"), "private planning")?;
    fs::write(docs.join("_config.yml"), "legacy config")?;
    fs::write(docs.join("cabane/notes.md"), "image prompts")?;
    fs::write(docs.join("cabane/memory/index.html"), "<main>Memory</main>")?;
    let binary = [0, 97, 115, 109, 255];
    fs::write(docs.join("cabane/memory/game.wasm"), binary)?;
    let mut manifest = Manifest::default();
    manifest.add_legacy_cabane(&docs)?;
    let output = fixture.0.join("preview");
    manifest.write_new(&output)?;
    assert_eq!(fs::read(output.join("cabane/memory/game.wasm"))?, binary);
    assert_eq!(
        fs::read_to_string(output.join("cabane/memory/index.html"))?,
        "<main>Memory</main>"
    );
    for excluded in ["todo.md", "_config.yml", "cabane/notes.md"] {
        assert!(!output.join(excluded).exists());
    }
    assert!(manifest.write_new(&output).is_err());
    Ok(())
}

#[test]
fn legacy_routes_cannot_overwrite_generated_pages() -> io::Result<()> {
    let fixture = Fixture::new()?;
    fs::create_dir(fixture.0.join("cabane"))?;
    fs::write(fixture.0.join("cabane/index.html"), "legacy")?;
    let mut manifest = Manifest::default();
    manifest.insert(Route::new("/cabane/")?.output().clone(), b"new".to_vec())?;
    manifest.add_legacy_cabane(&fixture.0)?;
    let output = fixture.0.join("output");
    manifest.write_new(&output)?;
    assert_eq!(fs::read_to_string(output.join("cabane/index.html"))?, "new");
    fs::create_dir(fixture.0.join("cabane/memory"))?;
    fs::write(fixture.0.join("cabane/memory/index.html"), "game")?;
    manifest.insert(
        Route::new("/cabane/memory/")?.output().clone(),
        b"collision".to_vec(),
    )?;
    assert!(manifest.add_legacy_cabane(&fixture.0).is_err());
    fs::write(fixture.0.join("cabane/unregistered.txt"), "unexpected")?;
    assert!(Manifest::default().add_legacy_cabane(&fixture.0).is_err());
    Ok(())
}

#[cfg(unix)]
#[test]
fn rejects_source_and_destination_symlinks_without_writing_outside() -> io::Result<()> {
    use std::os::unix::fs::symlink;
    let fixture = Fixture::new()?;
    let outside = fixture.0.join("outside");
    fs::create_dir(&outside)?;
    symlink(&outside, fixture.0.join("cabane"))?;
    assert!(Manifest::default().add_legacy_cabane(&fixture.0).is_err());
    symlink(&outside, fixture.0.join("redirect"))?;
    assert!(
        Manifest::default()
            .write_new(&fixture.0.join("redirect/preview"))
            .is_err()
    );
    assert!(!outside.join("preview").exists());
    Ok(())
}

#[test]
fn explicitly_selected_asset_is_copied_and_rejects_invalid_sources() -> io::Result<()> {
    let fixture = Fixture::new()?;
    fs::create_dir(fixture.0.join("images"))?;
    fs::write(fixture.0.join("images/test.webp"), [0, 1, 255])?;
    let mut manifest = Manifest::default();
    manifest.add_static_asset(&fixture.0, OutputPath::new("images/test.webp")?)?;
    assert!(
        manifest
            .add_static_asset(&fixture.0, OutputPath::new("images/test.webp")?)
            .is_err()
    );
    assert!(
        manifest
            .add_static_asset(&fixture.0, OutputPath::new("images/missing.webp")?)
            .is_err()
    );
    assert!(
        manifest
            .add_static_asset(&fixture.0, OutputPath::new("images")?)
            .is_err()
    );
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(
            fixture.0.join("images/test.webp"),
            fixture.0.join("images/link.webp"),
        )?;
        assert!(
            manifest
                .add_static_asset(&fixture.0, OutputPath::new("images/link.webp")?)
                .is_err()
        );
    }
    let output = fixture.0.join("preview");
    manifest.write_new(&output)?;
    assert_eq!(fs::read(output.join("images/test.webp"))?, [0, 1, 255]);
    Ok(())
}

#[test]
fn discovery_uses_registered_indexable_pages_and_preserves_domain() -> io::Result<()> {
    use site_content::Indexing;
    let fixture = Fixture::new()?;
    fs::write(fixture.0.join("CNAME"), "www.somsouk.fr")?;
    fs::create_dir_all(fixture.0.join("cabane/memory"))?;
    fs::write(fixture.0.join("cabane/memory/index.html"), "game")?;
    let mut manifest = Manifest::default();
    manifest.insert_page(Route::new("/")?, "home".into(), Indexing::Index)?;
    manifest.insert_page(Route::new("/blog/")?, "blog".into(), Indexing::Index)?;
    manifest.insert_page(
        Route::new("/leptos-proof/")?,
        "proof".into(),
        Indexing::NoIndexNoFollow,
    )?;
    manifest.insert_page(Route::new("/hidden/")?, "hidden".into(), Indexing::NoIndex)?;
    manifest.insert(OutputPath::new("404.html")?, b"error".to_vec())?;
    manifest.add_legacy_cabane(&fixture.0)?;
    // A failed duplicate must not change the indexing policy of the existing page.
    assert!(
        manifest
            .insert_page(Route::new("/hidden/")?, "duplicate".into(), Indexing::Index)
            .is_err()
    );
    manifest.add_discovery(&fixture.0)?;
    let output = fixture.0.join("output");
    manifest.write_new(&output)?;
    let sitemap = fs::read_to_string(output.join("sitemap.xml"))?;
    assert_eq!(sitemap.matches("<loc>").count(), 3);
    for url in [
        "https://www.somsouk.fr/",
        "https://www.somsouk.fr/blog/",
        "https://www.somsouk.fr/cabane/memory/",
    ] {
        assert!(sitemap.contains(&format!("<loc>{url}</loc>")));
    }
    for excluded in ["hidden", "404", "leptos-proof", "index.html", "lastmod"] {
        assert!(!sitemap.contains(excluded));
    }
    assert_eq!(fs::read(output.join("CNAME"))?, b"www.somsouk.fr");
    assert!(fs::read(output.join(".nojekyll"))?.is_empty());
    assert!(
        fs::read_to_string(output.join("robots.txt"))?
            .contains("Sitemap: https://www.somsouk.fr/sitemap.xml")
    );
    Ok(())
}

#[test]
fn discovery_rejects_canonical_domain_mismatch() -> io::Result<()> {
    let fixture = Fixture::new()?;
    fs::write(fixture.0.join("CNAME"), "other.example\n")?;
    let mut manifest = Manifest::default();
    assert!(manifest.add_discovery(&fixture.0).is_err());
    assert!(!manifest.contains(&OutputPath::new("sitemap.xml")?));
    Ok(())
}
