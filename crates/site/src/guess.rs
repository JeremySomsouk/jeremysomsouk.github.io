//! A static Leptos shell with a small WebSocket participant controller.
use crate::ui::WebsiteLayout;
use leptos::prelude::*;
use site_content::{CanonicalUrl, PageMetadata};

pub fn render_guess() -> Result<String, serde_json::Error> {
    crate::document::render_document_with_assets(
        PageMetadata {
            description: Some("Answer a question. Guess who said what. A private, account-free game to play with friends.".into()),
            canonical: Some(CanonicalUrl::from_site_path("/guess/").expect("fixed route")),
            ..PageMetadata::new("Who said that? | Jérémy Somsouk")
        },
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb"><a href="/">"Home"</a><a href="/projects/">"Projects"</a><span aria-current="page">"Who said that?"</span></nav>
                <section class="guess-game" aria-labelledby="guess-title">
                    <h2 id="guess-title">"Who said that?"</h2>
                    <p id="guess-intro">"Guess which friend wrote each answer."</p>
                    <p id="guess-connection" role="status"></p>
                    <p id="guess-error" role="alert"></p>
                    <div id="guess-app"><p>"Getting the table ready…"</p></div>
                    <noscript><p>"Enable JavaScript to join a room."</p></noscript>
                </section>
                <script type="module" src="/guess/game.js"></script>
            </WebsiteLayout>
        },
        crate::document::DocumentAssets { stylesheets: &["/guess/guess.css"], ..Default::default() },
    )
}
