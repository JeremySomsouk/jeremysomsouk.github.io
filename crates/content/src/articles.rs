//! Trusted repository articles; loading and validation never render or sanitize HTML.
use std::{
    collections::BTreeSet,
    fmt, fs, io,
    path::{Path, PathBuf},
};

use serde::Deserialize;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Deserialize)]
#[serde(try_from = "String")]
pub struct ArticleSlug(String);

impl ArticleSlug {
    pub fn as_str(&self) -> &str {
        &self.0
    }
    pub fn path(&self) -> String {
        format!("/blog/{}/", self.0)
    }
}

impl TryFrom<String> for ArticleSlug {
    type Error = &'static str;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        if value.len() > 80
            || value.split('-').any(|part| {
                part.is_empty()
                    || !part
                        .bytes()
                        .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())
            })
        {
            return Err(
                "slug must contain 1–80 lowercase ASCII letters/digits separated by single hyphens",
            );
        }
        Ok(Self(value))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize)]
#[serde(try_from = "toml::value::Datetime")]
pub struct ArticleDate {
    year: u16,
    month: u8,
    day: u8,
}

impl TryFrom<toml::value::Datetime> for ArticleDate {
    type Error = &'static str;
    fn try_from(value: toml::value::Datetime) -> Result<Self, Self::Error> {
        let date = value
            .date
            .ok_or("date must be an unquoted YYYY-MM-DD calendar date")?;
        if value.time.is_some() || value.offset.is_some() {
            return Err("date must not contain a time or offset");
        }
        let leap = date.year.is_multiple_of(4)
            && (!date.year.is_multiple_of(100) || date.year.is_multiple_of(400));
        let days = match date.month {
            2 if leap => 29,
            2 => 28,
            4 | 6 | 9 | 11 => 30,
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            _ => 0,
        };
        if date.year == 0 || date.day == 0 || date.day > days {
            return Err("date is not a valid Gregorian calendar day");
        }
        Ok(Self {
            year: date.year,
            month: date.month,
            day: date.day,
        })
    }
}
impl fmt::Display for ArticleDate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ArticleImage {
    pub src: String,
    pub alt: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ArticleMetadata {
    pub title: String,
    pub description: String,
    pub slug: ArticleSlug,
    pub date: ArticleDate,
    /// Opt in to publication explicitly; new articles are drafts by default.
    #[serde(default = "default_draft")]
    pub draft: bool,
    #[serde(default)]
    pub tags: Vec<String>,
    pub image: Option<ArticleImage>,
}
fn default_draft() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Article {
    pub metadata: ArticleMetadata,
    /// Exact trusted author Markdown after front matter; never user-submitted HTML.
    pub markdown: String,
}

#[derive(Debug)]
pub struct ArticleError {
    path: PathBuf,
    message: String,
}
impl ArticleError {
    fn new(path: &Path, message: impl ToString) -> Self {
        Self {
            path: path.into(),
            message: message.to_string(),
        }
    }
}
impl fmt::Display for ArticleError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.path.display(), self.message)
    }
}
impl std::error::Error for ArticleError {}

/// Parses +++ TOML front matter without altering the Markdown body or its line endings.
pub fn parse_article(path: &Path, source: &str) -> Result<Article, ArticleError> {
    let mut lines = source.split_inclusive('\n');
    let first = lines.next().unwrap_or_default();
    if first.trim_end_matches(['\r', '\n']) != "+++" {
        return Err(ArticleError::new(
            path,
            "expected +++ front matter on the first line",
        ));
    }
    let opening = first.len();
    let mut end = opening;
    let mut boundary = None;
    for line in lines {
        if line.trim_end_matches(['\r', '\n']) == "+++" {
            boundary = Some((end, end + line.len()));
            break;
        }
        end += line.len();
    }
    let (end, body) =
        boundary.ok_or_else(|| ArticleError::new(path, "missing closing +++ delimiter"))?;
    let metadata: ArticleMetadata =
        toml::from_str(&source[opening..end]).map_err(|error| ArticleError::new(path, error))?;
    for (name, value) in [
        ("title", &metadata.title),
        ("description", &metadata.description),
    ] {
        if value.trim().is_empty() {
            return Err(ArticleError::new(path, format!("{name} cannot be blank")));
        }
    }
    if metadata.tags.iter().any(|tag| tag.trim().is_empty()) {
        return Err(ArticleError::new(path, "tags cannot be blank"));
    }
    if let Some(image) = &metadata.image
        && (image.alt.trim().is_empty()
            || crate::CanonicalUrl::from_site_path(&image.src).is_err()
            || image.src.ends_with('/'))
    {
        return Err(ArticleError::new(
            path,
            "image needs a safe site-root file path and nonblank alt text",
        ));
    }
    if source[body..].trim().is_empty() {
        return Err(ArticleError::new(path, "article body cannot be blank"));
    }
    Ok(Article {
        metadata,
        markdown: source[body..].into(),
    })
}

#[derive(Debug, Default)]
pub struct Articles {
    entries: Vec<Article>,
}
impl Articles {
    /// Newest first, then slug. Future dates are withheld using an explicit build date.
    pub fn published(&self, as_of: ArticleDate) -> impl Iterator<Item = &Article> {
        self.entries
            .iter()
            .filter(move |article| !article.metadata.draft && article.metadata.date <= as_of)
    }
}

/// Flat .md files only. Validate drafts too; never follow symlinks or publish source files.
pub fn load_articles(directory: &Path) -> Result<Articles, ArticleError> {
    let fail = |error: io::Error| ArticleError::new(directory, error);
    let info = fs::symlink_metadata(directory).map_err(fail)?;
    if info.is_symlink() || !info.is_dir() {
        return Err(ArticleError::new(
            directory,
            "expected a regular content directory",
        ));
    }
    let mut paths = fs::read_dir(directory)
        .map_err(fail)?
        .map(|entry| entry.map(|e| e.path()))
        .collect::<Result<Vec<_>, _>>()
        .map_err(fail)?;
    paths.sort();
    let mut entries = Vec::new();
    let mut slugs = BTreeSet::new();
    for path in paths {
        let info = fs::symlink_metadata(&path).map_err(|e| ArticleError::new(&path, e))?;
        if info.is_symlink() || !info.is_file() {
            return Err(ArticleError::new(
                &path,
                "expected a regular Markdown file; symlinks and nested directories are unsupported",
            ));
        }
        if path.file_name().is_some_and(|name| name == ".gitkeep") {
            continue;
        }
        if path.extension().is_none_or(|ext| ext != "md") {
            return Err(ArticleError::new(&path, "expected a .md file"));
        }
        let source = fs::read_to_string(&path).map_err(|e| ArticleError::new(&path, e))?;
        let article = parse_article(&path, &source)?;
        if !slugs.insert(article.metadata.slug.clone()) {
            return Err(ArticleError::new(&path, "duplicate article slug"));
        }
        if path.file_stem().and_then(|s| s.to_str()) != Some(article.metadata.slug.as_str()) {
            return Err(ArticleError::new(
                &path,
                "filename must match the front-matter slug",
            ));
        }
        entries.push(article);
    }
    entries.sort_by(|a, b| {
        b.metadata
            .date
            .cmp(&a.metadata.date)
            .then_with(|| a.metadata.slug.cmp(&b.metadata.slug))
    });
    Ok(Articles { entries })
}
