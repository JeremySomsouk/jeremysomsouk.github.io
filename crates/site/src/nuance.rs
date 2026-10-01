//! Independent Leptos static entrance; no session data is rendered or transmitted.
use leptos::prelude::*;
use site_content::{CanonicalUrl, PageMetadata, SocialImage, SocialMetadata};
pub fn render_nuance() -> Result<String, serde_json::Error> {
    crate::document::render_document_with_assets(
        PageMetadata {
            description: Some("See what matters before you choose. A private space for untangling difficult decisions.".into()),
            canonical: Some(CanonicalUrl::from_site_path("/nuance/").expect("fixed route")),
            social: Some(SocialMetadata { title: "Nuance".into(), site_name: None, image: Some(SocialImage { url: CanonicalUrl::from_site_path("/nuance/banner.webp").expect("fixed asset"), alt: "Warm paper fragments connected by pencil lines".into() }) }),
            ..PageMetadata::new("Nuance — See what matters before you choose")
        },
        view! {
            <div class="nuance-desk">
                <header class="nuance-top"><a href="/" id="nuance-home">"← Homepage"</a>
                    <nav aria-label="Language" id="nuance-language"><button type="button" data-lang="en" aria-pressed="true">"English"</button><span aria-hidden="true">" · "</span><button type="button" data-lang="fr" aria-pressed="false">"Français"</button></nav>
                </header>
                <main id="nuance-sheet" class="nuance-sheet" aria-labelledby="nuance-title">
                    <div class="nuance-masthead"><p class="nuance-margin" id="nuance-eyebrow">"A little space to think"</p><h1 id="nuance-title">"Nuance"</h1><p id="nuance-tagline">"See what matters before you choose."</p></div>
                    <div id="nuance-app"><p>"Preparing your page… / Préparation de votre page…"</p></div>
                    <p id="nuance-status" role="status"></p>
                    <footer class="nuance-foot"><p id="nuance-privacy">"This stays on this device. One page, kept in this browser until you burn it. No account. Nothing is sent."</p><button type="button" id="nuance-burn" hidden=true>"Burn this page"</button></footer>
                    <noscript><p>"Enable JavaScript and WebAssembly to write here. Nothing you write leaves this browser. / Activez JavaScript et WebAssembly pour écrire ici. Rien de ce que vous écrivez ne quitte ce navigateur."</p></noscript>
                </main>
                <dialog id="nuance-confirm" aria-labelledby="nuance-confirm-title" aria-describedby="nuance-confirm-copy"><h2 id="nuance-confirm-title">"Burn this page?"</h2><p id="nuance-confirm-copy">"This reflection will disappear from this device."</p><div class="nuance-actions"><button type="button" id="nuance-keep">"Keep it"</button><button type="button" id="nuance-destroy">"Burn it"</button></div></dialog>
                <script type="module" src="/nuance/app.js"></script>
            </div>
        },
        crate::document::DocumentAssets { body_class: "nuance-page", stylesheets: &["/assets/page-transition.css", "/nuance/nuance.css"],theme_color: Some("#efe5d7"),..Default::default() },
    )
}
#[cfg(test)]
mod tests {
    #[test]
    fn standalone_static_shell_and_two_invitations() {
        let html = super::render_nuance().unwrap();
        assert!(html.contains("https://www.somsouk.fr/nuance/"));
        assert!(html.contains("data-lang=\"fr\""));
        assert!(html.contains("<dialog"));
        assert!(!html.contains("site-header"));
        for page in [
            crate::render_homepage().unwrap(),
            crate::render_projects().unwrap(),
        ] {
            assert!(page.contains("data-project=\"nuance\""));
            assert!(page.contains("/nuance/banner.webp"));
            assert!(page.contains("href=\"/nuance/\""));
        }
    }
}
