//! One static document/head renderer for ordinary pages and a future SSR adapter.
use leptos::prelude::*;
use serde::Serialize;
use site_content::{PageMetadata, StructuredData};

#[derive(Serialize)]
struct DocumentSchema<'a> {
    #[serde(rename = "@context")]
    context: &'static str,
    #[serde(rename = "@type")]
    kind: &'static str,
    name: &'a str,
    headline: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    url: Option<&'a str>,
    #[serde(rename = "datePublished", skip_serializing_if = "Option::is_none")]
    date_published: Option<String>,
}

fn structured_json(metadata: &PageMetadata) -> Result<Option<String>, serde_json::Error> {
    match metadata.structured {
        None => Ok(None),
        Some(kind) => {
            let title = metadata
                .social
                .as_ref()
                .map_or(metadata.title.as_str(), |social| social.title.as_str());
            let name = metadata
                .social
                .as_ref()
                .and_then(|social| social.site_name.as_deref())
                .unwrap_or(title);
            let schema = DocumentSchema {
                context: "https://schema.org",
                kind: match kind {
                    StructuredData::WebSite => "WebSite",
                    StructuredData::Article { .. } => "BlogPosting",
                },
                date_published: match kind {
                    StructuredData::Article { published } => Some(published.to_string()),
                    _ => None,
                },
                name,
                headline: title,
                description: metadata.description.as_deref(),
                url: metadata.canonical.as_ref().map(|url| url.as_str()),
            };
            // JSON escaping alone does not protect HTML's raw-text script boundary.
            let json = serde_json::to_string(&schema)?
                .replace('&', "\\u0026")
                .replace('<', "\\u003c")
                .replace('>', "\\u003e")
                .replace('\u{2028}', "\\u2028")
                .replace('\u{2029}', "\\u2029");
            Ok(Some(json))
        }
    }
}

// RDFa's `property` is a custom HTML attribute, not a DOM property setter.
fn open_graph(property: &'static str, content: impl Into<String>) -> impl IntoView {
    leptos::html::meta()
        .attr("property", property)
        .attr("content", content.into())
}

#[component]
fn DocumentHead(
    metadata: PageMetadata,
    structured: Option<String>,
    assets: DocumentAssets,
) -> impl IntoView {
    let article_date = match metadata.structured {
        Some(StructuredData::Article { published }) => Some(published.to_string()),
        _ => None,
    };
    let canonical = metadata.canonical.map(|url| url.as_str().to_owned());
    let description = metadata.description;
    view! {
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>{metadata.title}</title>
            {description.clone().map(|value| view! { <meta name="description" content=value/> })}
            {canonical.clone().map(|url| view! { <link rel="canonical" href=url/> })}
            {metadata.indexing.robots().map(|value| view! { <meta name="robots" content=value/> })}
            {metadata.social.map(|social| {
                let card = if social.image.is_some() { "summary_large_image" } else { "summary" };
                view! {
                    {open_graph("og:title", social.title.clone())}
                    <meta name="twitter:title" content=social.title/>
                    {open_graph("og:type", if article_date.is_some() { "article" } else { "website" })}
                    {article_date.map(|date| open_graph("article:published_time", date))}
                    {open_graph("og:locale", metadata.language.locale())}
                    <meta name="twitter:card" content=card/>
                    {social.site_name.map(|name| open_graph("og:site_name", name))}
                    {canonical.map(|url| open_graph("og:url", url))}
                    {description.map(|value| view! {
                        {open_graph("og:description", value.clone())}
                        <meta name="twitter:description" content=value/>
                    })}
                    {social.image.map(|image| view! {
                        {open_graph("og:image", image.url.as_str().to_owned())}
                        <meta name="twitter:image" content=image.url.as_str().to_owned()/>
                        {open_graph("og:image:alt", image.alt.clone())}
                        <meta name="twitter:image:alt" content=image.alt/>
                    })}
                }
            })}
            {structured.map(|json| view! { <script type="application/ld+json">{json}</script> })}
            <link rel="stylesheet" href="/assets/main.css"/>
            <link rel="icon" href=assets.icon/>
            {assets.stylesheets.iter().map(|href| view! { <link rel="stylesheet" href=*href/> }).collect_view()}
            {assets.theme_color.map(|color| view! { <meta name="theme-color" content=color/> })}
        </head>
    }
}

pub fn render_document(
    metadata: PageMetadata,
    body: impl IntoView,
) -> Result<String, serde_json::Error> {
    render_document_with_assets(metadata, body, DocumentAssets::default())
}

/// Explicit static page resources; project behavior stays outside the document shell.
pub struct DocumentAssets {
    pub body_class: &'static str,
    pub icon: &'static str,
    pub stylesheets: &'static [&'static str],
    pub theme_color: Option<&'static str>,
}
impl Default for DocumentAssets {
    fn default() -> Self {
        Self {
            body_class: "site-page",
            icon: "/images/favicon.ico",
            stylesheets: &[],
            theme_color: None,
        }
    }
}
pub fn render_document_with_assets(
    metadata: PageMetadata,
    body: impl IntoView,
    assets: DocumentAssets,
) -> Result<String, serde_json::Error> {
    let structured = structured_json(&metadata)?;
    let language = metadata.language.tag();
    let body_class = assets.body_class;
    let html = view! {
        <html lang=language>
            <DocumentHead metadata structured assets/>
            <body class=body_class>{body}</body>
        </html>
    }
    .to_html();
    Ok(format!("<!DOCTYPE html>\n{html}\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use site_content::{CanonicalUrl, Language, SocialImage, SocialMetadata};

    #[test]
    fn optional_metadata_is_absent_and_language_is_shared() {
        let mut metadata = PageMetadata::new("Sans description");
        metadata.language = Language::French;
        let html = render_document(metadata, view! { <p>"Test"</p> }).expect("render");
        assert!(html.starts_with("<!DOCTYPE html>\n<html lang=\"fr\">"));
        for absent in [
            "name=\"description\"",
            "canonical",
            "og:",
            "twitter:",
            "application/ld+json",
            "robots",
        ] {
            assert!(!html.contains(absent), "{absent}");
        }
    }

    #[test]
    fn sparse_social_metadata_omits_missing_values() {
        let mut metadata = PageMetadata::new("Minimal");
        metadata.language = Language::French;
        metadata.social = Some(SocialMetadata {
            title: "Minimal".into(),
            site_name: None,
            image: None,
        });
        metadata.structured = Some(StructuredData::WebSite);
        let json = structured_json(&metadata)
            .expect("serialize")
            .expect("schema");
        let value: serde_json::Value = serde_json::from_str(&json).expect("JSON");
        assert!(value.get("description").is_none());
        assert!(value.get("url").is_none());
        let html = render_document(metadata, view! { <p>"Test"</p> }).expect("render");
        assert!(html.contains("fr_FR"));
        assert!(html.contains("content=\"summary\""));
        for absent in [
            "canonical",
            "og:url",
            "og:image",
            "og:description",
            "og:site_name",
            "twitter:image",
            "twitter:description",
        ] {
            assert!(!html.contains(absent), "{absent}");
        }
    }

    #[test]
    fn hostile_metadata_round_trips_as_inert_json_and_escaped_attributes() {
        let attack = "</script><script>alert(1)</script> & \"quoted\"\n\u{2028}\u{2029}";
        let mut metadata = PageMetadata::homepage();
        metadata.title = attack.into();
        metadata.description = Some(attack.into());
        metadata.social = Some(SocialMetadata {
            title: attack.into(),
            site_name: None,
            image: Some(SocialImage {
                url: CanonicalUrl::from_site_path("/images/profile.webp").expect("path"),
                alt: attack.into(),
            }),
        });
        let json = structured_json(&metadata)
            .expect("serialize")
            .expect("schema");
        let decoded: serde_json::Value = serde_json::from_str(&json).expect("valid JSON");
        assert_eq!(decoded["headline"], attack);
        assert_eq!(decoded["description"], attack);
        assert!(!json.contains(['<', '>', '&', '\u{2028}', '\u{2029}']));
        let html = render_document(metadata, view! { <p>"Test"</p> }).expect("render");
        assert_eq!(html.matches("<script").count(), 1);
        assert_eq!(html.matches("</script>").count(), 1);
        assert!(html.contains("&lt;/script&gt;"));
        assert!(html.contains("&quot;quoted&quot;"));
        assert!(html.contains("summary_large_image"));
        let start = html
            .find("<script type=\"application/ld+json\">")
            .expect("script")
            + "<script type=\"application/ld+json\">".len();
        let end = html[start..].find("</script>").expect("end") + start;
        let rendered: serde_json::Value =
            serde_json::from_str(&html[start..end]).expect("rendered JSON");
        assert_eq!(rendered["headline"], attack);
    }
}
