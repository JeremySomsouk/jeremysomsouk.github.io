use leptos::prelude::*;
use site_content::{Indexing, PageMetadata};

use crate::{
    document::render_document,
    ui::{Section, WebsiteLayout},
};

pub fn render_not_found() -> Result<String, serde_json::Error> {
    let metadata = PageMetadata {
        description: Some(
            "This page could not be found. Return to the homepage or explore La Cabane.".into(),
        ),
        indexing: Indexing::NoIndex,
        ..PageMetadata::new("Page not found | Jeremy Somsouk")
    };
    render_document(
        metadata,
        view! {
            <WebsiteLayout>
                <Section id="page-not-found" title="404 — Page not found".to_owned()>
                    <p>"The page you’re looking for could not be found."</p>
                    <p><a href="/">"Return to the homepage"</a>" or "<a href="/cabane/">"explore La Cabane"</a>"."</p>
                </Section>
            </WebsiteLayout>
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_found_is_a_real_error_document_without_indexable_metadata() {
        let html = render_not_found().expect("render error page");
        assert!(html.contains("404 — Page not found"));
        assert!(html.contains("content=\"noindex, follow\""));
        assert!(html.contains("href=\"/\""));
        assert!(html.contains("href=\"/cabane/\""));
        for absent in [
            "canonical",
            "og:",
            "twitter:",
            "<script",
            "Doctolib",
            ".wasm",
        ] {
            assert!(!html.contains(absent), "{absent}");
        }
    }
}
