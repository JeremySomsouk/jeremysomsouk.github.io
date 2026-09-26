//! Native static rendering. No client router or hydration entry point.

pub mod output;

use leptos::prelude::*;
use site_content::PageMetadata;

/// Render the isolated migration proof, without filesystem or HTTP dependencies.
pub fn render_proof_page(metadata: PageMetadata) -> String {
    let document = view! {
        <html lang="en">
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="robots" content="noindex, nofollow"/>
                <title>{metadata.title}</title>
                <meta name="description" content=metadata.description/>
            </head>
            <body>
                <main>
                    <h1>"Static Leptos proof"</h1>
                    <p>"This complete page was rendered by Rust at build time."</p>
                    <p>"It needs no JavaScript or WebAssembly to display."</p>
                </main>
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
        assert!(html.contains("</head><body><main>"));
        assert!(html.ends_with("</body></html>\n"));
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
