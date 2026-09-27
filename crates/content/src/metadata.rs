//! Typed document metadata, independent of a renderer or request server.

pub const SITE_ORIGIN: &str = "https://www.somsouk.fr";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    English,
    French,
}

impl Language {
    pub const fn tag(self) -> &'static str {
        match self {
            Self::English => "en",
            Self::French => "fr",
        }
    }

    pub const fn locale(self) -> &'static str {
        match self {
            Self::English => "en_US",
            Self::French => "fr_FR",
        }
    }
}

/// Canonicals and social images are absolute HTTPS URLs on this site's origin.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CanonicalUrl(String);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidCanonicalPath;

impl std::fmt::Display for InvalidCanonicalPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Expected a site-root path without queries, fragments, escapes or dot segments")
    }
}
impl std::error::Error for InvalidCanonicalPath {}

impl CanonicalUrl {
    pub fn home() -> Self {
        Self(format!("{SITE_ORIGIN}/"))
    }

    pub fn from_site_path(path: &str) -> Result<Self, InvalidCanonicalPath> {
        if path == "/" {
            return Ok(Self::home());
        }
        let tail = path.strip_prefix('/').ok_or(InvalidCanonicalPath)?;
        let tail = tail.strip_suffix('/').unwrap_or(tail);
        if tail.split('/').any(|segment| {
            segment.is_empty()
                || matches!(segment, "." | "..")
                || !segment
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || b"-_.".contains(&byte))
        }) {
            return Err(InvalidCanonicalPath);
        }
        Ok(Self(format!("{SITE_ORIGIN}{path}")))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Indexing {
    Index,
    NoIndex,
    NoIndexNoFollow,
}

impl Indexing {
    pub const fn robots(self) -> Option<&'static str> {
        match self {
            Self::Index => None,
            Self::NoIndex => Some("noindex, follow"),
            Self::NoIndexNoFollow => Some("noindex, nofollow"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SocialImage {
    pub url: CanonicalUrl,
    pub alt: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SocialMetadata {
    pub title: String,
    pub site_name: Option<String>,
    pub image: Option<SocialImage>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StructuredData {
    WebSite,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PageMetadata {
    pub title: String,
    pub description: Option<String>,
    pub language: Language,
    pub canonical: Option<CanonicalUrl>,
    pub indexing: Indexing,
    pub social: Option<SocialMetadata>,
    pub structured: Option<StructuredData>,
}

impl PageMetadata {
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            description: None,
            language: Language::English,
            canonical: None,
            indexing: Indexing::Index,
            social: None,
            structured: None,
        }
    }

    pub fn homepage() -> Self {
        let profile = &crate::HOMEPAGE.profile;
        Self {
            description: Some("Just a simple playground".into()),
            canonical: Some(CanonicalUrl::home()),
            social: Some(SocialMetadata {
                title: profile.role.into(),
                site_name: Some(profile.role.into()),
                image: None,
            }),
            structured: Some(StructuredData::WebSite),
            ..Self::new(format!("{} | {}", profile.name, profile.role))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_urls_reject_ambiguous_or_external_paths() {
        for path in [
            "/",
            "/projects/cabane/",
            "/404.html",
            "/images/profile.webp",
        ] {
            assert_eq!(
                CanonicalUrl::from_site_path(path)
                    .expect("valid path")
                    .as_str(),
                format!("{SITE_ORIGIN}{path}")
            );
        }
        for path in [
            "",
            "relative",
            "https://other.example/",
            "//other.example/",
            "/a//",
            "/a/../",
            "/./",
            "/%2e/",
            "/a?b",
            "/a#b",
            "/a\\b",
            "/\"bad",
        ] {
            assert!(CanonicalUrl::from_site_path(path).is_err(), "{path}");
        }
    }
}
