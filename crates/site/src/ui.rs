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
pub fn Header(title: String, subtitle: String, children: Children) -> impl IntoView {
    view! {
        <header class="site-header site-container">
            <div class="site-identity"><h1>{title}</h1><p>{subtitle}</p></div>
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
    children: Children,
) -> impl IntoView {
    view! {
        <article class="resume-entry">
            <header class="resume-details">
                <h3>{title}</h3><p class="resume-subtitle">{subtitle}</p>
                <p class="resume-period">{period}</p>
            </header>
            <div class="resume-description">{children()}</div>
        </article>
    }
}
