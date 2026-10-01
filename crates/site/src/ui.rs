//! Shared site components; application controllers do not belong here.

use leptos::prelude::*;

/// Shared page landmarks. Each page supplies its own identity and body.
#[component]
pub fn PageLayout(
    header: Children,
    footer: Children,
    children: Children,
    #[prop(default = "site-shell")] shell_class: &'static str,
    #[prop(default = "site-container")] main_class: &'static str,
    #[prop(default = "Skip to content")] skip_label: &'static str,
) -> impl IntoView {
    view! {
        <div class=shell_class>
            <a class="skip-link" href="#main-content">{skip_label}</a>
            {header()}
            <main id="main-content" class=main_class tabindex="-1">{children()}</main>
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
pub fn ProjectCard(
    project: site_content::ProjectMetadata,
    #[prop(optional)] show_details: bool,
    #[prop(optional)] invitation: bool,
) -> impl IntoView {
    view! {
        <article class="project-card" class:project-invitation=invitation data-project=project.slug aria-labelledby=project.heading_id>
            <img class="project-preview" src=project.image.src alt=project.image.alt
                width=project.image.width height=project.image.height loading="lazy" decoding="async"/>
            <div class="project-body">
                <h3 id=project.heading_id>{project.title}</h3>
                {show_details.then(|| view! { <a class="project-details-link" href=project.presentation_path()>"About this project →"</a> })}
                <ProjectDescription project=project.clone() show_tags=!invitation/>
            </div>
        </article>
    }
}

/// Shared project copy and application destination for cards and presentation pages.
#[component]
pub fn ProjectDescription(
    project: site_content::ProjectMetadata,
    #[prop(default = true)] show_tags: bool,
) -> impl IntoView {
    view! { <div class="project-description">
                <p class="project-tagline">{project.tagline}</p>
                <p>{project.description}</p>
                {show_tags.then(|| view! { <ul class="project-tags" aria-label=project.tags_label>
                    {project.tags.iter().map(|tag| view! { <li>{*tag}</li> }).collect_view()}
                </ul> })}
                {project.note.map(|note| view! { <p class="project-note">{note}</p> })}
                <a class="project-link" href=project.destination.url>{project.destination.label}</a>
    </div> }
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
                    {home.profile.links.iter().filter(|link| !matches!(link.kind, site_content::ProfileLinkKind::Home)).map(|link| view! {
                        <a class="profile-icon-link" href=link.url title=link.label>
                            <img src=profile_icon(link.kind) alt="" width="24" height="24"/>
                            <span class="profile-icon-label">{link.label}</span>
                        </a>
                    }).collect_view()}
                </div>
                <div class="site-page-links"><a href="/projects/">"Projects"</a><a href="/blog/">"Blog"</a><a class="cabane-entrance" href="/cabane/">"Cabane"<span aria-hidden="true">" →"</span></a></div>
                <p class="profile-contact">"Email: "<a href=format!("mailto:{}", home.profile.email)>{home.profile.email}</a></p>
            </Header>
        }.into_any())
        footer=Box::new(move || view! {
            <Footer><p>{home.profile.name}" - "<a href=format!("mailto:{}", home.profile.email)>{home.profile.email}</a></p></Footer>
        }.into_any())
    >
        {children()}</PageLayout> }
}

fn profile_icon(kind: site_content::ProfileLinkKind) -> &'static str {
    use site_content::ProfileLinkKind;
    match kind {
        ProfileLinkKind::GitHub => "/icons/tabler/brand-github.svg",
        ProfileLinkKind::LinkedIn => "/icons/tabler/brand-linkedin.svg",
        ProfileLinkKind::Home => "/icons/tabler/home.svg",
        ProfileLinkKind::Website => "/icons/tabler/world.svg",
    }
}

/// Shared game invitation in the homepage and projects grid.
#[component]
pub fn GuessrProjectCard() -> impl IntoView {
    let project = site_content::ProjectMetadata {
        slug: "guessr",
        heading_id: "guessr-project-title",
        title: "Guessr",
        tagline: "Guess who wrote each answer.",
        description: "Write an answer, match anonymous responses to players, and compare your scores.",
        tags: &["Multiplayer", "Browser game"],
        tags_label: "Guessr features",
        note: None,
        destination: site_content::Link {
            label: "Play Guessr →",
            url: "/guessr/",
        },
        image: site_content::Image {
            src: "/guessr/banner.webp",
            alt: "Guessr: anonymous answer cards and player tags in green",
            width: 1200,
            height: 600,
        },
    };
    view! { <ProjectCard project/> }
}

/// Shared Ripple invitation in the homepage and projects grid.
#[component]
pub fn RippleProjectCard() -> impl IntoView {
    view! {
        <article class="project-card" data-project="ripple" aria-labelledby="ripple-project-title">
            <img class="project-preview" src="/ripple/banner.webp" alt="A mint spark bends mysterious branching paths and concentric waves" width="1200" height="600" loading="lazy" decoding="async"/>
            <div class="project-body">
                <h3 id="ripple-project-title">"Ripple"</h3>
                <p class="project-tagline">"Change the rules. Follow the ripple."</p>
                <p>"An experiment in cause and effect. Change a cost, watch a pathfinding algorithm decide differently."</p>
                <a class="project-link" href="/ripple/">"Explore Ripple →"</a>
            </div>
        </article>
    }
}

/// One invitation shared by the homepage tree and the complete project list.
#[component]
pub fn NuanceProjectCard() -> impl IntoView {
    view! {
        <article class="project-card" data-project="nuance" aria-labelledby="nuance-project-title">
            <img class="project-preview" src="/nuance/banner.webp" alt="Nuance in terracotta ink on cream paper, with two crossing pencil lines" width="1200" height="600" loading="lazy" decoding="async"/>
            <div class="project-body"><h3 id="nuance-project-title">"Nuance"</h3>
                <p class="project-tagline">"See what matters before you choose."</p>
                <p>"A private space for untangling difficult decisions and understanding the trade-offs behind them."</p>
                <ul class="project-tags" aria-label="Nuance features"><li>"Reflection"</li><li>"Private by design"</li><li>"Rust & WebAssembly"</li></ul>
                <a class="project-link" href="/nuance/">"Open Nuance →"</a>
            </div>
        </article>
    }
}
