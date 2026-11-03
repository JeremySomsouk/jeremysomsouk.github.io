//! Content models independent of rendering and filesystem access.

mod articles;
pub use articles::*;

mod metadata;
pub use metadata::*;

mod homepage;
pub use homepage::HOMEPAGE;

/// Trusted, repository-authored Markdown. Render as Markdown only at the page boundary.
/// Existing inline HTML is intentional; this is not a user-input sanitization type.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Markdown(pub &'static str);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Link {
    pub label: &'static str,
    pub url: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProfileLinkKind {
    GitHub,
    LinkedIn,
    Home,
    Website,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProfileLink {
    pub kind: ProfileLinkKind,
    pub label: &'static str,
    pub url: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Image {
    pub src: &'static str,
    pub alt: &'static str,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    pub name: &'static str,
    pub role: &'static str,
    pub email: &'static str,
    pub image: Image,
    pub about: Markdown,
    pub links: &'static [ProfileLink],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResumeKind {
    Experience,
    Education,
}

impl ResumeKind {
    pub const fn title(self) -> &'static str {
        match self {
            Self::Experience => "Experience",
            Self::Education => "Education",
        }
    }

    pub const fn id(self) -> &'static str {
        match self {
            Self::Experience => "experience",
            Self::Education => "education",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResumeEntry {
    pub logo: Option<Image>,
    pub heading_id: &'static str,
    pub title: &'static str,
    pub subtitle: &'static str,
    pub period: &'static str,
    pub url: Option<&'static str>,
    pub description: Markdown,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResumeSection {
    pub kind: ResumeKind,
    pub entries: &'static [ResumeEntry],
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProjectMetadata {
    pub slug: &'static str,
    pub heading_id: &'static str,
    pub title: &'static str,
    pub tagline: &'static str,
    pub description: &'static str,
    pub tags: &'static [&'static str],
    pub tags_label: &'static str,
    pub note: Option<&'static str>,
    pub destination: Link,
    pub image: Image,
}

impl ProjectMetadata {
    /// Presentation routes are distinct from application/repository destinations.
    pub fn presentation_path(&self) -> String {
        format!("/projects/{}/", self.slug)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Homepage {
    pub profile: Profile,
    pub projects_title: &'static str,
    pub projects_id: &'static str,
    pub projects: &'static [ProjectMetadata],
    pub resume: &'static [ResumeSection],
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    // Historical metadata reference; authored prose can evolve independently.
    const LEGACY: &str = include_str!("../tests/fixtures/legacy-homepage.yml");

    #[test]
    fn homepage_prose_and_resume_structure_remain_complete() {
        for entry in HOMEPAGE.resume.iter().flat_map(|section| section.entries) {
            assert!(!entry.description.0.trim().is_empty());
        }
        assert!(!HOMEPAGE.profile.about.0.trim().is_empty());
        assert!(
            HOMEPAGE
                .profile
                .about
                .0
                .contains("href=\"#personal-projects\"")
        );
        assert_eq!(HOMEPAGE.resume[0].entries.len(), 3);
        assert_eq!(HOMEPAGE.resume[1].entries.len(), 1);
    }

    #[test]
    fn profile_and_resume_metadata_preserve_public_identity() {
        let profile = &HOMEPAGE.profile;
        for value in [
            profile.name,
            profile.email,
            &profile.image.src[1..],
            HOMEPAGE.projects_title,
        ] {
            assert!(LEGACY.contains(value), "{value}");
        }
        for section in HOMEPAGE.resume {
            assert!(LEGACY.contains(section.kind.title()));
            for entry in section.entries {
                for value in [entry.title, entry.subtitle, entry.period] {
                    assert!(LEGACY.contains(value), "{value}");
                }
                if let Some(url) = entry.url {
                    assert!(LEGACY.contains(url.trim_start_matches("https://")));
                }
            }
        }
        for link in profile.links {
            let source_value = link.url.rsplit('/').next().expect("URL has a last segment");
            assert!(LEGACY.contains(source_value));
        }
    }

    #[test]
    fn projects_preserve_metadata_and_have_unique_safe_identifiers_and_assets() {
        let mut slugs = BTreeSet::new();
        let mut ids = BTreeSet::new();
        assert_eq!(HOMEPAGE.projects.len(), 5);
        assert_eq!(HOMEPAGE.projects[0].slug, "bientot");
        for project in HOMEPAGE.projects {
            assert!(slugs.insert(project.slug));
            assert!(ids.insert(project.heading_id));
            assert!(
                project
                    .slug
                    .bytes()
                    .all(|b| b.is_ascii_lowercase() || b == b'-')
            );
            for value in [
                project.title,
                project.tagline,
                project.tags_label,
                project.destination.label,
                project.destination.url,
                project.image.src,
                project.image.alt,
                project.heading_id,
            ]
            .into_iter()
            .chain(project.tags.iter().copied())
            {
                if !matches!(project.slug, "prctrl" | "tessera" | "bientot") {
                    assert!(LEGACY.contains(&value.replace('&', "&amp;")), "{value}");
                }
            }
            // Project descriptions and notes are maintained after the migration.
            assert!(!project.description.trim().is_empty());
            if let Some(note) = project.note {
                assert!(!note.trim().is_empty());
            }
            assert!(project.image.width > 0 && project.image.height > 0);
            assert!(project.image.src.starts_with('/') && !project.image.src.contains(".."));
            let asset = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../docs")
                .join(&project.image.src[1..]);
            assert!(asset.is_file(), "{}", asset.display());
        }
    }
}
