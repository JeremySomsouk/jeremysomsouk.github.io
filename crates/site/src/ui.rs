//! Shared site components; application controllers do not belong here.

use leptos::prelude::*;

/// Shared page landmarks. Each page supplies its own identity and body.
#[component]
pub fn PageLayout(header: Children, footer: Children, children: Children) -> impl IntoView {
    view! {
        <div class="site-shell">
            <a class="skip-link" href="#main-content">"Skip to content"</a>
            {header()}
            <main id="main-content" class="site-container" tabindex="-1">{children()}</main>
            {footer()}
        </div>
    }
}

#[component]
pub fn Header(
    title: String,
    subtitle: String,
    #[prop(optional)] logo: Option<&'static str>,
    children: Children,
) -> impl IntoView {
    view! {
        <header class="site-header site-container">
            <div class="site-identity"><h1>{logo.map(|src| view! { <img class="identity-logo" src=src alt="" width="50" height="50"/> })}{title}</h1><p>{subtitle}</p></div>
            <nav class="site-navigation" aria-label="Main navigation">{children()}</nav>
        </header>
    }
}

#[component]
pub fn Footer(children: Children) -> impl IntoView {
    view! { <footer class="site-footer site-container">{children()}</footer> }
}

#[component]
pub fn Section(id: &'static str, title: String, children: Children) -> impl IntoView {
    view! {
        <section class="site-section" aria-labelledby=id>
            <h2 id=id>{title}</h2>
            <div class="site-section-content">{children()}</div>
        </section>
    }
}

#[component]
pub fn ResumeEntry(
    title: String,
    subtitle: String,
    period: String,
    #[prop(optional)] id: Option<&'static str>,
    #[prop(optional_no_strip)] url: Option<&'static str>,
    children: Children,
) -> impl IntoView {
    view! {
        <article class="resume-entry">
            <header class="resume-details">
                <h3 id=id>{title}</h3><p class="resume-subtitle">{subtitle}</p>
                <p class="resume-period">{period}</p>
                {url.map(|href| view! { <a href=href target="_blank" rel="noopener noreferrer">{href.trim_start_matches("https://")}</a> })}
            </header>
            <div class="resume-description">{children()}</div>
        </article>
    }
}

/// Project presentation shared by homepage and future project listings.
#[component]
pub fn ProjectCard(project: site_content::ProjectMetadata) -> impl IntoView {
    view! {
        <article class="project-card" data-project=project.slug aria-labelledby=project.heading_id>
            <img class="project-preview" src=project.image.src alt=project.image.alt
                width=project.image.width height=project.image.height loading="lazy" decoding="async"/>
            <div class="project-body">
                <h3 id=project.heading_id>{project.title}</h3>
                <p class="project-tagline">{project.tagline}</p>
                <p>{project.description}</p>
                <ul class="project-tags" aria-label=project.tags_label>
                    {project.tags.iter().map(|tag| view! { <li>{*tag}</li> }).collect_view()}
                </ul>
                {project.note.map(|note| view! { <p class="project-note">{note}</p> })}
                <a class="project-link" href=project.destination.url>{project.destination.label}</a>
            </div>
        </article>
    }
}

/// Public-site identity shared by ordinary pages, independent of Cabane controllers.
#[component]
pub fn WebsiteLayout(children: Children) -> impl IntoView {
    let home = &site_content::HOMEPAGE;
    view! { <PageLayout
        header=Box::new(move || view! {
            <Header title=home.profile.name.to_owned() subtitle=home.profile.role.to_owned()
                logo="/images/js-icon.webp">
                <div class="profile-links">
                    {home.profile.links.iter().map(|link| view! {
                        <a href=link.url>{link.label}</a>
                    }).collect_view()}
                </div>
                <p class="profile-contact">"Email: "<a href=format!("mailto:{}", home.profile.email)>{home.profile.email}</a></p>
            </Header>
        }.into_any())
        footer=Box::new(move || view! {
            <Footer><p>{home.profile.name}" - "<a href=format!("mailto:{}", home.profile.email)>{home.profile.email}</a></p></Footer>
        }.into_any())
    >
        {children()}</PageLayout> }
}
