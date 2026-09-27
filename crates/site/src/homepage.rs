//! Homepage composition. Content is repository-authored, never request input.
use leptos::prelude::*;
use pulldown_cmark::{Options, Parser, html};
use site_content::{HOMEPAGE, Markdown};

use crate::ui::{ProjectCard, ResumeEntry, Section, WebsiteLayout};

fn markdown_html(markdown: Markdown) -> String {
    let mut output = String::new();
    html::push_html(
        &mut output,
        Parser::new_ext(markdown.0, Options::ENABLE_SMART_PUNCTUATION),
    );
    output
}

/// Only accepts the explicit trusted-author Markdown type; not a sanitizer.
#[component]
fn Prose(content: Markdown) -> impl IntoView {
    view! { <div class="prose" inner_html=markdown_html(content)></div> }
}

pub fn render_homepage() -> Result<String, serde_json::Error> {
    let home = &HOMEPAGE;
    let body = view! {
        <WebsiteLayout>
            <Section id="about-me" title="About Me".to_owned()>
                <div class="about-layout">
                    <img class="profile-image" src=home.profile.image.src alt=home.profile.image.alt
                        width=home.profile.image.width height=home.profile.image.height decoding="async"/>
                    <Prose content=home.profile.about/>
                </div>
            </Section>
            <Section id="things-i-m-building" title=home.projects_title.to_owned()>
                <div class="project-grid" id=home.projects_id>
                    {home.projects.iter().map(|project| view! { <ProjectCard project=project.clone()/> }).collect_view()}
                </div>
            </Section>
            {home.resume.iter().map(|section| view! {
                <Section id=section.kind.id() title=section.kind.title().to_owned()>
                    {section.entries.iter().map(|entry| view! {
                        <ResumeEntry id=entry.heading_id title=entry.title.to_owned()
                            subtitle=entry.subtitle.to_owned() period=entry.period.to_owned()
                            url=entry.url>
                            <Prose content=entry.description/>
                        </ResumeEntry>
                    }).collect_view()}
                </Section>
            }).collect_view()}
            <Section id="a-little-more-about-me" title=home.hobbies_title.to_owned()>
                <Prose content=home.hobbies/>
            </Section>
        </WebsiteLayout>
    };
    crate::document::render_document(site_content::PageMetadata::homepage(), body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn markdown_keeps_lists_paragraphs_and_intentional_html() {
        let html = markdown_html(Markdown(
            "Hello <mark>Rust</mark>.\n\n- One\n- Two\n\n<a href=\"#personal-projects\">Projects</a>\n\n`<script>` & text",
        ));
        assert!(html.contains("<p>Hello <mark>Rust</mark>.</p>"));
        assert!(html.contains("<ul>\n<li>One</li>\n<li>Two</li>\n</ul>"));
        assert!(html.contains("href=\"#personal-projects\""));
        assert!(html.contains("<code>&lt;script&gt;</code> &amp; text"));
    }

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
            "<mark>Java</mark>",
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
        for section in HOMEPAGE.resume {
            for entry in section.entries {
                assert!(html.contains(entry.title));
                assert!(html.contains(entry.period));
                assert!(html.contains(&format!("id=\"{}\"", entry.heading_id)));
            }
        }
        for forbidden in [
            "<script src",
            ".wasm",
            "modulepreload",
            "noindex",
            "href=\"#\"",
        ] {
            assert!(!html.contains(forbidden), "Unexpected {forbidden}");
        }
    }
}
