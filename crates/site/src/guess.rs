//! Standalone static game shell; the personal website remains the entry point.
use leptos::prelude::*;
use site_content::{CanonicalUrl, Indexing, PageMetadata};

fn assets() -> crate::document::DocumentAssets {
    crate::document::DocumentAssets {
        body_class: "guessr-page",
        icon: "/guessr/icon.svg",
        stylesheets: &["/guessr/guessr.css"],
        theme_color: Some("#f5f0e8"),
    }
}

pub fn render_guess() -> Result<String, serde_json::Error> {
    crate::document::render_document_with_assets(
        PageMetadata {
            description: Some("Guess who wrote each answer. A multiplayer game with private answers and individual guesses.".into()),
            canonical: Some(CanonicalUrl::from_site_path("/guessr/").expect("fixed route")),
            ..PageMetadata::new("Guessr — Who said what?")
        },
        view! {
            <div class="guessr-shell">
                <header class="guessr-topbar"><a href="/" class="guessr-home">"← Homepage"</a><span class="guessr-mark" aria-hidden="true">"g."</span></header>
                <main class="guess-game" aria-labelledby="guess-title">
                    <h1 id="guess-title">"Guessr"<span aria-hidden="true">"."</span></h1>
                    <p id="guess-intro">"Guess who wrote each answer."</p>
                    <p id="guess-connection" role="status"></p>
                    <p id="guess-error" role="alert"></p>
                    <div id="guess-app"><p>"Getting ready…"</p></div>
                    <noscript><p>"Enable JavaScript to join a room."</p></noscript>
                </main>
                <script type="module" src="/guessr/game.js"></script>
            </div>
        },
        assets(),
    )
}

pub fn render_guess_redirect() -> Result<String, serde_json::Error> {
    crate::document::render_document_with_assets(
        PageMetadata {
            indexing: Indexing::NoIndex,
            canonical: Some(CanonicalUrl::from_site_path("/guessr/").expect("fixed route")),
            ..PageMetadata::new("Guessr has moved")
        },
        view! {
            <main class="guess-game"><h1>"Guessr"</h1><p><a href="/guessr/">"Continue to Guessr →"</a></p></main>
            <script type="module" src="/guessr/redirect.js"></script>
        },
        assets(),
    )
}
