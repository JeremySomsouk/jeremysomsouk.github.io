//! Native static rendering. No client router or hydration entry point.

pub mod output;
pub mod ui;

use leptos::prelude::*;
use site_content::PageMetadata;
use ui::{Footer, Header, PageLayout, ResumeEntry, Section};

pub const SITE_CSS: &str = include_str!("../../../styles/site.css");

/// Render the isolated migration proof, without filesystem or HTTP dependencies.
pub fn render_proof_page(metadata: PageMetadata) -> String {
    let document = view! {
        <html lang="en">
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="robots" content="noindex, nofollow"/>
                <title>{metadata.title}</title>
                <link rel="stylesheet" href="../assets/main.css"/>
                <meta name="description" content=metadata.description/>
            </head>
            <body class="site-page">
                <PageLayout
                    header=Box::new(|| view! {
                        <Header title="Static Leptos proof".to_owned() subtitle="Shared layout preview".to_owned()>
                            <a href="#overview">"Overview"</a>
                            <a href="#experience">"Experience"</a>
                            <a href="../cabane/">"La Cabane"</a>
                        </Header>
                    }.into_any())
                    footer=Box::new(|| view! {
                        <Footer><p>"Static layout preview — website migration in progress."</p></Footer>
                    }.into_any())
                >
                    <Section id="overview" title="Overview".to_owned()>
                        <p>"This complete page was rendered by Rust at build time."</p>
                        <p>"It needs no JavaScript or WebAssembly to display."</p>
                    </Section>
                    <Section id="experience" title="Experience".to_owned()>
                        <ResumeEntry title="Reusable resume entry".to_owned()
                            subtitle="Layout example".to_owned() period="Preview".to_owned()>
                            <p>"A shared details column and content area, ready for typed website content."</p>
                            <p>"This is a component fixture, not a replacement for the existing homepage."</p>
                        </ResumeEntry>
                    </Section>
                </PageLayout>
            </body>
        </html>
    }
    .to_html();

    format!("<!DOCTYPE html>\n{document}\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_complete_static_document_and_escapes_metadata() {
        let html = render_proof_page(PageMetadata {
            title: "<script>alert('x')</script> & Mélimo".into(),
            description: "\" onload=\"alert('x')".into(),
        });

        assert!(html.starts_with("<!DOCTYPE html>\n<html lang=\"en\">"));
        assert!(html.contains("id=\"main-content\""));
        assert!(html.ends_with("</body></html>\n"));
        assert!(html.contains("href=\"#main-content\""));
        assert!(html.contains("aria-labelledby=\"experience\""));
        assert!(html.contains("&lt;script&gt;"));
        assert!(html.contains("&amp; Mélimo"));
        assert!(html.contains("&quot; onload=&quot;"));
        assert!(html.contains("<h1>Static Leptos proof</h1>"));
        for forbidden in ["<script", ".wasm", "modulepreload", "rel=\"preload\""] {
            assert!(
                !html.contains(forbidden),
                "unexpected client runtime: {forbidden}"
            );
        }
    }
}
