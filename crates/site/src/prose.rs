//! Rendering boundary for trusted repository-authored Markdown; not a sanitizer.
use leptos::prelude::*;
use pulldown_cmark::{Options, Parser, html};

pub(crate) fn markdown_html(markdown: &str) -> String {
    let mut output = String::new();
    html::push_html(
        &mut output,
        Parser::new_ext(markdown, Options::ENABLE_SMART_PUNCTUATION),
    );
    output
}

#[component]
pub(crate) fn Prose(content: String) -> impl IntoView {
    view! { <div class="prose" inner_html=markdown_html(&content)></div> }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn markdown_keeps_lists_paragraphs_and_intentional_html() {
        let html = markdown_html(
            "Hello <mark>Rust</mark>.\n\n- One\n- Two\n\n<a href=\"#personal-projects\">Projects</a>\n\n`<script>` & text",
        );
        assert!(html.contains("<p>Hello <mark>Rust</mark>.</p>"));
        assert!(html.contains("<ul>\n<li>One</li>\n<li>Two</li>\n</ul>"));
        assert!(html.contains("href=\"#personal-projects\""));
        assert!(html.contains("<code>&lt;script&gt;</code> &amp; text"));
    }
}
