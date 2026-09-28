use site_content::{load_articles, parse_article};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicUsize, Ordering},
};

const FIXTURE: &str = include_str!("fixtures/articles/first-note.md");
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct Directory(PathBuf);
impl Directory {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "site-articles-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).expect("create test directory");
        Self(path)
    }
    fn write(&self, name: &str, contents: &str) {
        fs::write(self.0.join(name), contents).expect("write fixture");
    }
}
impl Drop for Directory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn typed_front_matter_preserves_trusted_markdown_and_crlf() {
    for source in [FIXTURE.to_owned(), FIXTURE.replace('\n', "\r\n")] {
        let article = parse_article(Path::new("first-note.md"), &source).expect("valid fixture");
        assert_eq!(article.metadata.slug.path(), "/blog/first-note/");
        assert_eq!(article.metadata.date.to_string(), "2024-02-29");
        assert!(!article.metadata.draft);
        assert_eq!(article.metadata.tags, ["Rust", "Notes"]);
        assert_eq!(
            article.markdown,
            source[source.find("# Sample body").expect("body")..]
        );
        assert!(
            article
                .markdown
                .contains("<mark>trusted author HTML</mark>")
        );
        assert!(article.markdown.contains("\"+++\""));
    }
}

#[test]
fn invalid_front_matter_and_routes_fail_with_source_context() {
    for source in [
        FIXTURE.replacen("+++", "---", 1),
        FIXTURE.replace("\n+++\n", "\n"),
        FIXTURE.replace("first-note", "../escape"),
        FIXTURE.replace("first-note", "Uppercase"),
        FIXTURE.replace("first-note", "two--hyphens"),
        FIXTURE.replace("title =", "titel ="),
        FIXTURE.replace("A sample article", "   "),
        FIXTURE.replace("2024-02-29", "2023-02-29"),
        FIXTURE.replace("2024-02-29", "2024-04-31"),
        FIXTURE.replace("2024-02-29", "2024-02-29T12:00:00Z"),
        FIXTURE.replace("2024-02-29", "0000-01-01"),
        FIXTURE.replace("/images/profile.webp", "https://external.example/image.png"),
        FIXTURE.replace("Example illustration", ""),
        FIXTURE
            .split("# Sample body")
            .next()
            .expect("header")
            .to_owned(),
    ] {
        let error =
            parse_article(Path::new("invalid.md"), &source).expect_err("reject invalid article");
        assert!(error.to_string().starts_with("invalid.md:"));
    }
}

#[test]
fn publication_excludes_drafts_and_future_dates_with_stable_order() {
    let dir = Directory::new();
    dir.write("first-note.md", FIXTURE);
    dir.write("another.md", &FIXTURE.replace("first-note", "another"));
    dir.write(
        "old.md",
        &FIXTURE
            .replace("first-note", "old")
            .replace("2024-02-29", "2023-01-01"),
    );
    dir.write(
        "future.md",
        &FIXTURE
            .replace("first-note", "future")
            .replace("2024-02-29", "2025-01-01"),
    );
    dir.write(
        "draft.md",
        &FIXTURE
            .replace("first-note", "draft")
            .replace("draft = false\n", ""),
    );
    let articles = load_articles(&dir.0).expect("catalog");
    let as_of = parse_article(Path::new("first-note.md"), FIXTURE)
        .expect("date")
        .metadata
        .date;
    assert_eq!(
        articles
            .published(as_of)
            .map(|a| a.metadata.slug.as_str())
            .collect::<Vec<_>>(),
        ["another", "first-note", "old"]
    );
}

#[test]
fn duplicates_filename_mismatch_and_invalid_drafts_fail() {
    let dir = Directory::new();
    dir.write("first-note.md", FIXTURE);
    dir.write("second.md", FIXTURE);
    assert!(
        load_articles(&dir.0)
            .expect_err("duplicate")
            .to_string()
            .contains("duplicate")
    );
    fs::remove_file(dir.0.join("first-note.md")).expect("remove fixture");
    assert!(
        load_articles(&dir.0)
            .expect_err("filename mismatch")
            .to_string()
            .contains("filename")
    );
    dir.write(
        "second.md",
        &FIXTURE
            .replace("first-note", "second")
            .replace("draft = false", "draft = true")
            .replace("2024-02-29", "2023-02-29"),
    );
    assert!(load_articles(&dir.0).is_err());
}

#[test]
fn empty_directory_is_valid_but_missing_directory_and_unexpected_files_fail() {
    let dir = Directory::new();
    dir.write(".gitkeep", "");
    assert!(load_articles(&dir.0).is_ok());
    assert!(load_articles(&dir.0.join("missing")).is_err());
    dir.write("notes.txt", "not an article");
    assert!(load_articles(&dir.0).is_err());
}

#[cfg(unix)]
#[test]
fn symlink_sources_and_nested_directories_are_rejected() {
    use std::os::unix::fs::symlink;
    let dir = Directory::new();
    let outside = Directory::new();
    outside.write("first-note.md", FIXTURE);
    symlink(outside.0.join("first-note.md"), dir.0.join("first-note.md")).expect("link");
    assert!(load_articles(&dir.0).is_err());
    fs::remove_file(dir.0.join("first-note.md")).expect("remove link");
    symlink(&outside.0, dir.0.join("nested")).expect("directory link");
    assert!(load_articles(&dir.0.join("nested")).is_err());
    fs::remove_file(dir.0.join("nested")).expect("remove link");
    fs::create_dir(dir.0.join("nested")).expect("nested directory");
    assert!(load_articles(&dir.0).is_err());
}
