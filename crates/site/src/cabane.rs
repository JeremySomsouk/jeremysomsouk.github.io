//! Cabane owns its presentation and optional controller, independent of generic UI.
use crate::{
    document::{DocumentAssets, render_document_with_assets},
    ui::PageLayout,
};
use leptos::prelude::*;
use site_content::{CanonicalUrl, Language, PageMetadata, SocialImage, SocialMetadata};

struct Game {
    route: &'static str,
    image: &'static str,
    tag: &'static str,
    title: &'static str,
    description: &'static str,
    label: &'static str,
    class: &'static str,
}
const GAMES: &[Game] = &[
    Game {
        route: "lecture",
        image: "fluence-preview.webp",
        tag: "Mon rendez-vous lecture",
        title: "La Fluence",
        description: "Un texte à découvrir, un temps à garder.",
        label: "Lire",
        class: "game-tile reading-tile",
    },
    Game {
        route: "memory",
        image: "memory-preview.webp",
        tag: "Observe & retrouve",
        title: "Le Memory",
        description: "Deux par deux, les images se retrouvent.",
        label: "Jouer",
        class: "game-tile",
    },
    Game {
        route: "chemin",
        image: "chemin-preview.webp",
        tag: "Relie & explore",
        title: "Le Chemin",
        description: "De nombre en nombre, passe par toutes les cases.",
        label: "Jouer",
        class: "game-tile",
    },
    Game {
        route: "calculs",
        image: "calculs-preview.webp",
        tag: "Compte & trace",
        title: "Les Petits Calculs",
        description: "Additions, soustractions et réponses au bout du doigt.",
        label: "Jouer",
        class: "game-tile counting-tile",
    },
    Game {
        route: "lumiere",
        image: "lumiere-preview.webp",
        tag: "Observe & illumine",
        title: "La Lumière",
        description: "Un miroir, un rayon… et les petits fantômes s’éveillent.",
        label: "Jouer",
        class: "game-tile light-tile",
    },
    Game {
        route: "river",
        image: "riviere-preview.webp",
        tag: "Gratte & fais fleurir",
        title: "La Rivière",
        description: "Gratte la terre, libère l’eau et réveille les fleurs.",
        label: "Jouer",
        class: "game-tile river-tile",
    },
];

pub fn render_cabane() -> Result<String, Box<dyn std::error::Error>> {
    let mut metadata = PageMetadata::new("La cabane à découvertes");
    metadata.language = Language::French;
    metadata.description =
        Some("Lire, jouer, grandir. Un petit pas chaque jour, à ton rythme.".into());
    metadata.canonical = Some(CanonicalUrl::from_site_path("/cabane/")?);
    metadata.social = Some(SocialMetadata {
        title: metadata.title.clone(),
        site_name: Some(metadata.title.clone()),
        image: Some(SocialImage {
            url: CanonicalUrl::from_site_path("/cabane/images/welcome.webp")?,
            alt: metadata.title.clone(),
        }),
    });
    let body = view! {
        <PageLayout shell_class="cabane-landing shell menu" main_class="cabane-content" skip_label="Aller au contenu"
            header=Box::new(|| view! {
                <nav class="toolbar" aria-label="Navigation de Cabane">
                    <a class="back" href="/">"← Le site de Jeremy"</a>
                    <button id="share" class="quiet" type="button">"Partager"</button>
                </nav>
                <p id="share-status" role="status" hidden></p>
            }.into_any())
            footer=Box::new(|| view! { <footer><p class="footer-note">"Des petites parties. De grandes découvertes."</p></footer> }.into_any())
        >
            <header class="welcome">
                <h1 class="welcome-brand">
                    <img src="/cabane/images/welcome.webp" width="800" height="800"
                        alt="La cabane à découvertes" fetchpriority="high" decoding="async"/>
                </h1>
                <div class="welcome-copy">
                    <p class="eyebrow">"Lire, jouer, grandir"</p>
                    <h2>"Choisis ton aventure"</h2>
                    <p class="intro">"Un petit pas chaque jour, à ton rythme."</p>
                    <a class="primary welcome-link" href="#games">"Explorer les jeux "<span aria-hidden="true">"↓"</span></a>
                </div>
            </header>
            <div class="games" id="games">
                {GAMES.iter().map(|game| view! {
                    <a class=game.class href=format!("/cabane/{}/", game.route)>
                        <div class="preview illustrated-preview" aria-hidden="true">
                            <img src=format!("/cabane/images/{}", game.image) alt="" width="900" height="463" decoding="async"/>
                        </div>
                        <div class="tile-content"><span class="tag">{game.tag}</span><h2>{game.title}</h2>
                            <p>{game.description}</p><span class="play-label">{game.label}</span></div>
                    </a>
                }).collect_view()}
            </div>
        </PageLayout>
        <script src="/cabane/share.mjs?v=20260908-mobile-2" type="module"></script>
    };
    Ok(render_document_with_assets(
        metadata,
        body,
        DocumentAssets {
            body_class: "cabane-page",
            icon: "/cabane/favicon.svg?v=20260921-center-star",
            stylesheet: Some("/cabane/style.css?v=20260910-illustrations"),
            theme_color: Some("#f8f4eb"),
        },
    )?)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn static_landing_preserves_games_and_share_contract() {
        let html = render_cabane().expect("render Cabane");
        assert!(html.contains("<html lang=\"fr\">"));
        assert!(html.contains("https://www.somsouk.fr/cabane/"));
        assert!(html.contains("id=\"main-content\""));
        assert!(html.contains("id=\"share\""));
        assert!(html.contains("id=\"share-status\""));
        for game in GAMES {
            assert!(html.contains(&format!("href=\"/cabane/{}/\"", game.route)));
            assert!(html.contains(game.title));
        }
        assert_eq!(html.matches("<h1").count(), 1);
        assert_eq!(html.matches("<main").count(), 1);
        assert_eq!(html.matches("<script").count(), 1);
        assert!(!html.contains(".wasm"));
    }
}
