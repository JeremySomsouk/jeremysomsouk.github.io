//! Homepage composition. Content is repository-authored, never request input.
use crate::prose::Prose;
use leptos::prelude::*;
use site_content::HOMEPAGE;

use crate::ui::{ProjectCard, ResumeEntry, Section, WebsiteLayout};

pub fn render_homepage() -> Result<String, serde_json::Error> {
    let home = &HOMEPAGE;
    let body = view! {
        <WebsiteLayout>
            <div class="ripple-home">
                <button class="ripple-spark" type="button" aria-label="Investigate the small search pulse"></button>
            <Section id="about-me" title="About Me".to_owned()>
                <div class="about-layout">
                    <img class="profile-image" src=home.profile.image.src alt=home.profile.image.alt
                        width=home.profile.image.width height=home.profile.image.height decoding="async"/>
                    <Prose content=home.profile.about.0.to_owned()/>
                </div>
            </Section>
            <Section id="things-i-m-building" title=home.projects_title.to_owned()>
                <p><a href="/projects/">"All projects →"</a></p>
                <div class="project-grid" id=home.projects_id>
                    {home.projects.iter().map(|project| view! { <ProjectCard project=project.clone() invitation=project.slug == "cabane"/> }).collect_view()}
                </div>
            </Section>
                <div class="ripple-discovery" hidden=true>
                    <p data-ripple-clue="" role="status" aria-live="polite"></p>
                    <a data-ripple-enter="" href="/ripple/" hidden=true>"Enter Ripple →"</a>
                    <button data-ripple-reset="" type="button" hidden=true>"Hide & reset"</button>
                </div>
            </div>
            {home.resume.iter().map(|section| view! {
                <Section id=section.kind.id() title=section.kind.title().to_owned()>
                    {section.entries.iter().map(|entry| view! {
                        <ResumeEntry id=entry.heading_id title=entry.title.to_owned()
                            subtitle=entry.subtitle.to_owned() period=entry.period.to_owned()
                            url=entry.url>
                            <Prose content=entry.description.0.to_owned()/>
                        </ResumeEntry>
                    }).collect_view()}
                </Section>
            }).collect_view()}
            <Section id="a-little-more-about-me" title=home.hobbies_title.to_owned()>
                <Prose content=home.hobbies.0.to_owned()/>
            </Section>
            <script type="module" src="/ripple/home.js"></script>
        </WebsiteLayout>
    };
    crate::document::render_document_with_assets(
        site_content::PageMetadata::homepage(),
        body,
        crate::document::DocumentAssets {
            stylesheets: &["/assets/page-transition.css", "/ripple/ripple.css"],
            ..Default::default()
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn card_metadata_is_escaped_instead_of_interpreted_as_markdown() {
        let mut project = HOMEPAGE.projects[0].clone();
        project.title = "<script>alert(1)</script>";
        project.image.alt = "\" onerror=\"alert(1)";
        let html = view! { <ProjectCard project/> }.to_html();
        assert!(html.contains("&lt;script&gt;"));
        assert!(html.contains("&quot; onerror=&quot;"));
        assert!(!html.contains("<script>"));
    }

    #[test]
    fn homepage_preserves_content_links_and_static_rendering() {
        let html = render_homepage().expect("render homepage");
        assert!(html.starts_with("<!DOCTYPE html>"));
        assert_eq!(html.matches("<h1>").count(), 1);
        for text in [
            HOMEPAGE.profile.name,
            HOMEPAGE.profile.email,
            "<mark>great dad</mark>",
            "Gaming",
            "Photography",
            "Chess",
        ] {
            assert!(html.contains(text), "Missing {text}");
        }
        for project in HOMEPAGE.projects {
            assert!(html.contains(project.title));
            assert!(html.contains(project.description));
            assert!(html.contains(project.destination.url));
            assert!(html.contains(project.image.src));
        }
        assert!(!html.contains("Cabane features and technologies"));
        assert!(html.contains(r#"class="cabane-entrance""#));
        for section in HOMEPAGE.resume {
            for entry in section.entries {
                assert!(html.contains(entry.title));
                assert!(html.contains(entry.period));
                assert!(html.contains(&format!("id=\"{}\"", entry.heading_id)));
            }
        }
        for forbidden in [".wasm", "modulepreload", "noindex", "href=\"#\""] {
            assert!(!html.contains(forbidden), "Unexpected {forbidden}");
        }
    }
}
