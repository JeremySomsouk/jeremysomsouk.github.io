//! A preflighted output manifest. Only explicitly registered files are published.

use std::{
    collections::{BTreeMap, BTreeSet},
    fs, io,
    path::{Path, PathBuf},
};

fn invalid(message: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, message.into())
}

/// A portable, relative output filename, never a URL or filesystem escape.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct OutputPath(String);

impl OutputPath {
    pub fn new(value: &str) -> io::Result<Self> {
        if value.split('/').any(|part| {
            part.is_empty()
                || part == "."
                || part == ".."
                || !part
                    .bytes()
                    .all(|c| c.is_ascii_alphanumeric() || b"-_.".contains(&c))
        }) {
            return Err(invalid(format!("Unsafe output path: {value}")));
        }
        Ok(Self(value.to_owned()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Directory-style public routes retain direct index.html access.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Route(OutputPath);

impl Route {
    pub fn new(url: &str) -> io::Result<Self> {
        if url == "/" {
            return Ok(Self(OutputPath::new("index.html")?));
        }
        let directory = url
            .strip_prefix('/')
            .and_then(|value| value.strip_suffix('/'))
            .ok_or_else(|| invalid(format!("Route must start and end with /: {url}")))?;
        Ok(Self(OutputPath::new(&format!("{directory}/index.html"))?))
    }

    pub fn output(&self) -> &OutputPath {
        &self.0
    }
}

#[derive(Default)]
pub struct Manifest {
    files: BTreeMap<OutputPath, Vec<u8>>,
    indexed_pages: BTreeSet<OutputPath>,
}

impl Manifest {
    /// Register a rendered page and its indexing policy together.
    pub fn insert_page(
        &mut self,
        route: Route,
        html: String,
        indexing: site_content::Indexing,
    ) -> io::Result<()> {
        let path = route.output().clone();
        self.insert(path.clone(), html.into_bytes())?;
        if indexing == site_content::Indexing::Index {
            self.indexed_pages.insert(path);
        }
        Ok(())
    }

    /// Discovery files derive from registered, actually emitted pages only.
    pub fn add_discovery(&mut self, docs: &Path) -> io::Result<()> {
        let cname = docs.join("CNAME");
        reject_symlinks(&cname)?;
        let domain = fs::read_to_string(&cname)?;
        if Some(domain.trim()) != site_content::SITE_ORIGIN.strip_prefix("https://") {
            return Err(invalid("CNAME must match the canonical HTTPS origin"));
        }
        let mut sitemap = String::from(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n",
        );
        for path in &self.indexed_pages {
            let file = path.as_str();
            let url_path = if file == "index.html" {
                "/".to_owned()
            } else if let Some(directory) = file.strip_suffix("/index.html") {
                format!("/{directory}/")
            } else {
                format!("/{file}")
            };
            let canonical = site_content::CanonicalUrl::from_site_path(&url_path)
                .map_err(|error| invalid(error.to_string()))?;
            // Canonical origin and validated output paths contain no XML metacharacters.
            sitemap.push_str(&format!("  <url><loc>{}</loc></url>\n", canonical.as_str()));
        }
        sitemap.push_str("</urlset>\n");
        self.insert(OutputPath::new("sitemap.xml")?, sitemap.into_bytes())?;
        self.insert(
            OutputPath::new("robots.txt")?,
            format!(
                "User-agent: *\nAllow: /\n\nSitemap: {}/sitemap.xml\n",
                site_content::SITE_ORIGIN
            )
            .into_bytes(),
        )?;
        self.insert(OutputPath::new("CNAME")?, domain.into_bytes())?;
        self.insert(OutputPath::new(".nojekyll")?, Vec::new())?;
        Ok(())
    }

    pub fn contains(&self, path: &OutputPath) -> bool {
        self.files.contains_key(path)
    }

    pub fn insert(&mut self, path: OutputPath, bytes: Vec<u8>) -> io::Result<()> {
        for existing in self.files.keys() {
            if existing == &path
                || existing.0.starts_with(&format!("{}/", path.0))
                || path.0.starts_with(&format!("{}/", existing.0))
            {
                return Err(invalid(format!(
                    "Output collision: {} and {}",
                    existing.0, path.0
                )));
            }
        }
        self.files.insert(path, bytes);
        Ok(())
    }

    /// Register one explicitly selected static asset; never copy an entire source tree.
    pub fn add_static_asset(&mut self, source_root: &Path, path: OutputPath) -> io::Result<()> {
        let source = source_root.join(path.as_str());
        reject_symlinks(&source)?;
        if !fs::metadata(&source)?.is_file() {
            return Err(invalid(format!(
                "Not a regular asset: {}",
                source.display()
            )));
        }
        self.insert(path, fs::read(source)?)
    }

    /// Copies Cabane runtime files only. Planning Markdown and Jekyll sources
    /// are never publication inputs. Unknown extensions fail closed.
    pub fn add_legacy_cabane(&mut self, docs: &Path) -> io::Result<()> {
        reject_symlinks(docs)?;
        self.visit_cabane(docs, Path::new("cabane"))
    }

    fn visit_cabane(&mut self, docs: &Path, relative: &Path) -> io::Result<()> {
        let source = docs.join(relative);
        let metadata = fs::symlink_metadata(&source)?;
        if metadata.file_type().is_symlink() {
            return Err(invalid(format!(
                "Symlink source rejected: {}",
                source.display()
            )));
        }
        if metadata.is_dir() {
            let mut children = fs::read_dir(&source)?.collect::<Result<Vec<_>, _>>()?;
            children.sort_by_key(|entry| entry.file_name());
            for child in children {
                self.visit_cabane(docs, &relative.join(child.file_name()))?;
            }
        } else if metadata.is_file() {
            let extension = source.extension().and_then(|ext| ext.to_str());
            match extension {
                Some("md") => return Ok(()),
                Some(
                    "html" | "css" | "js" | "mjs" | "json" | "wasm" | "png" | "svg" | "webp"
                    | "ico",
                ) => {}
                _ => {
                    return Err(invalid(format!(
                        "Unregistered Cabane asset: {}",
                        source.display()
                    )));
                }
            }
            let portable = relative
                .to_str()
                .ok_or_else(|| invalid("Non-UTF-8 asset filename"))?
                .replace(std::path::MAIN_SEPARATOR, "/");
            // The selection page is now composed by Leptos; games remain byte-preserved.
            if portable == "cabane/index.html" {
                return Ok(());
            }
            let path = OutputPath::new(&portable)?;
            self.insert(path.clone(), fs::read(&source)?)?;
            // Existing Cabane HTML pages have no noindex directive; preserve their discoverability.
            if extension == Some("html") {
                self.indexed_pages.insert(path);
            }
        } else {
            return Err(invalid("Only regular files and directories are supported"));
        }
        Ok(())
    }

    /// Requires a new destination: no stale files, overwrites or partial updates
    /// to a previous preview. The caller chooses a fixed staging location.
    pub fn write_new(&self, destination: &Path) -> io::Result<()> {
        reject_symlinks(destination)?;
        if destination.try_exists()? {
            return Err(invalid(format!(
                "Preview already exists; remove it before rebuilding: {}",
                destination.display()
            )));
        }
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::create_dir(destination)?;
        for (path, bytes) in &self.files {
            let target = destination.join(path.as_str());
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(target, bytes)?;
        }
        Ok(())
    }
}

fn reject_symlinks(path: &Path) -> io::Result<()> {
    let mut current = PathBuf::new();
    for component in path.components() {
        current.push(component);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                return Err(invalid(format!(
                    "Symlink path rejected: {}",
                    current.display()
                )));
            }
            Ok(_) => {}
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => return Err(error),
        }
    }
    Ok(())
}
