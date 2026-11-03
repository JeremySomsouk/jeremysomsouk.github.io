use leptos::prelude::*;
use site_content::{CanonicalUrl, Indexing, PageMetadata};

pub fn render_political() -> Result<String, serde_json::Error> {
    crate::document::render_document_with_assets(
        PageMetadata {
            description: Some("Retrouvez qui a dit quoi. Un jeu solo de déclarations à associer à leurs auteurs.".into()),
            canonical: Some(CanonicalUrl::from_site_path("/qui-a-dit/").expect("fixed route")),
            indexing: Indexing::NoIndex,
            ..PageMetadata::new("Qui a dit ? — Démonstration")
        },
        view! {
            <header><a href="/">"Accueil"</a><span>"Un projet de Jérémy Somsouk"</span></header>
            <main>
                <h1>"Qui a dit ?"</h1>
                <p class="demo">"Démonstration : tous les auteurs et toutes les déclarations sont fictifs. Aucune position n’est attribuée à une personnalité réelle."</p>
                <div id="political-app"><p>"Chargement de l’édition…"</p></div>
                <p id="political-status" role="status" aria-live="polite"></p>
                <noscript>"Activez JavaScript pour jouer."</noscript>
            </main>
            <script type="module" src="/qui-a-dit/app.js"></script>
        },
        crate::document::DocumentAssets {
            body_class: "political-page",
            icon: "/images/favicon.ico",
            stylesheets: &["/qui-a-dit/style.css"],
            theme_color: Some("#101d35"),
        },
    )
}
