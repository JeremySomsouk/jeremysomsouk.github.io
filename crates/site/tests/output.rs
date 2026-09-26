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
