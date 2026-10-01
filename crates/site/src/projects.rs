//! Static project presentations; application runtimes keep their own destinations.
use std::error::Error;

use leptos::prelude::*;
use site_content::{
    CanonicalUrl, HOMEPAGE, PageMetadata, ProjectMetadata, SocialImage, SocialMetadata,
};

use crate::ui::{
    GuessrProjectCard, ProjectCard, ProjectDescription, RippleProjectCard, Section, WebsiteLayout,
};

fn metadata(
    title: &str,
    description: &str,
    path: &str,
) -> Result<PageMetadata, site_content::InvalidCanonicalPath> {
    Ok(PageMetadata {
        description: Some(description.into()),
        canonical: Some(CanonicalUrl::from_site_path(path)?),
        social: Some(SocialMetadata {
            title: title.into(),
            site_name: Some(HOMEPAGE.profile.name.into()),
            image: None,
        }),
        ..PageMetadata::new(format!("{title} | {}", HOMEPAGE.profile.name))
    })
}

pub fn render_projects() -> Result<String, Box<dyn Error>> {
    let head = metadata(
        "Projects",
        "Personal software projects: music, learning, and play.",
        "/projects/",
    )?;
    Ok(crate::document::render_document(
        head,
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb"><a href="/">"Home"</a><span aria-current="page">"Projects"</span></nav>
                <Section id="projects" title="Projects".to_owned()>
                    <div class="project-grid">
                        {HOMEPAGE.projects.iter().map(|project| view! { <ProjectCard project=project.clone() show_details=true/> }).collect_view()}
                        <GuessrProjectCard/>
                        <RippleProjectCard/>
                    </div>
                </Section>
            </WebsiteLayout>
        },
    )?)
}

/// One presentation pattern for every registered project; no project-specific controller.
#[component]
fn ProjectPresentation(project: ProjectMetadata) -> impl IntoView {
    view! {
        <Section id=project.heading_id title=project.title.to_owned()>
            <article class="project-presentation" data-project=project.slug aria-labelledby=project.heading_id>
                <img class="project-preview" src=project.image.src alt=project.image.alt
                    width=project.image.width height=project.image.height decoding="async"/>
                <ProjectDescription project=project.clone()/>
            </article>
        </Section>
    }
}

pub fn render_project(project: ProjectMetadata) -> Result<String, Box<dyn Error>> {
    let mut head = metadata(
        project.title,
        project.description,
        &project.presentation_path(),
    )?;
    if let Some(social) = &mut head.social {
        social.image = Some(SocialImage {
            url: CanonicalUrl::from_site_path(project.image.src)?,
            alt: project.image.alt.into(),
        });
    }
    Ok(crate::document::render_document(
        head,
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb">
                    <a href="/">"Home"</a><a href="/projects/">"Projects"</a><span aria-current="page">{project.title}</span>
                </nav>
                <ProjectPresentation project/>
            </WebsiteLayout>
        },
    )?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_presentations_preserve_destinations_and_have_distinct_metadata() {
        let index = render_projects().expect("project index");
        for project in HOMEPAGE.projects {
            assert!(index.contains(&format!("href=\"{}\"", project.presentation_path())));
            let page = render_project(project.clone()).expect("project page");
            assert!(page.contains(&format!("href=\"{}\"", project.destination.url)));
            assert!(page.contains(&format!(
                "href=\"https://www.somsouk.fr{}\"",
                project.presentation_path()
            )));
            assert!(page.contains("property=\"og:image\""));
            assert!(page.contains(project.description));
            assert!(page.contains(project.tags_label));
            assert_eq!(page.matches("<h1>").count(), 1);
            for forbidden in ["<script", ".wasm", "noindex", "modulepreload"] {
                assert!(!page.contains(forbidden), "Unexpected {forbidden}");
            }
        }
    }

    #[test]
    fn invalid_project_routes_fail_instead_of_generating_ambiguous_canonicals() {
        let mut project = HOMEPAGE.projects[0].clone();
        project.slug = "../cabane";
        assert!(render_project(project).is_err());
    }
}
