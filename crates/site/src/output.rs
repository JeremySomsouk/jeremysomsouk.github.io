//! A preflighted output manifest. Only explicitly registered files are published.

use std::{
    collections::BTreeMap,
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
}

impl Manifest {
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
            self.insert(OutputPath::new(&portable)?, fs::read(source)?)?;
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
