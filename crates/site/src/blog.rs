//! Static blog routes. Only publication-filtered articles reach the output manifest.
use crate::{
    document::render_document,
    output::{Manifest, OutputPath, Route},
    prose::Prose,
    ui::{Section, WebsiteLayout},
};
use leptos::prelude::*;
use site_content::{
    Article, ArticleDate, Articles, CanonicalUrl, HOMEPAGE, PageMetadata, SocialImage,
    SocialMetadata, StructuredData,
};
use std::error::Error;

fn metadata(title: &str, description: &str, path: &str) -> Result<PageMetadata, Box<dyn Error>> {
    Ok(PageMetadata {
        description: Some(description.into()),
        canonical: Some(CanonicalUrl::from_site_path(path)?),
        social: Some(SocialMetadata {
            title: title.into(),
            site_name: Some(HOMEPAGE.profile.name.into()),
            image: None,
        }),
        ..PageMetadata::new(format!("{title} | {}", HOMEPAGE.profile.name))
    })
}

fn render_index(articles: &[Article], as_of: ArticleDate) -> Result<String, Box<dyn Error>> {
    let entries = articles.to_vec();
    Ok(render_document(
        metadata("Blog", "Notes and articles.", "/blog/")?,
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb"><a href="/">"Home"</a><span aria-current="page">"Blog"</span></nav>
                <Section id="blog" title="Blog".to_owned()>
                    <div data-published-through=as_of.to_string()>
                        {if entries.is_empty() {
                            view! { <p>"No articles published yet."</p> }.into_any()
                        } else {
                            view! { <ul class="article-list">
                                {entries.into_iter().map(|article| view! { <li>
                                    <h3><a href=article.metadata.slug.path()>{article.metadata.title}</a></h3>
                                    <time class="article-date" datetime=article.metadata.date.to_string()>{article.metadata.date.readable()}</time>
                                    <p>{article.metadata.description}</p>
                                </li> }).collect_view()}
                            </ul> }.into_any()
                        }}
                    </div>
                </Section>
            </WebsiteLayout>
        },
    )?)
}

fn render_article(article: Article) -> Result<String, Box<dyn Error>> {
    let mut head = metadata(
        &article.metadata.title,
        &article.metadata.description,
        &article.metadata.slug.path(),
    )?;
    head.structured = Some(StructuredData::Article {
        published: article.metadata.date,
    });
    if let Some(image) = &article.metadata.image
        && let Some(social) = &mut head.social
    {
        social.image = Some(SocialImage {
            url: CanonicalUrl::from_site_path(&image.src)?,
            alt: image.alt.clone(),
        });
    }
    Ok(render_document(
        head,
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb"><a href="/">"Home"</a><a href="/blog/">"Blog"</a><span aria-current="page">{article.metadata.title.clone()}</span></nav>
                <Section id="article-title" title=article.metadata.title.clone()>
                    <article class="blog-article" aria-labelledby="article-title">
                        <time class="article-date" datetime=article.metadata.date.to_string()>{article.metadata.date.readable()}</time>
                        <p class="article-description">{article.metadata.description}</p>
                        {article.metadata.image.map(|image| view! { <img class="article-cover" src=image.src alt=image.alt decoding="async"/> })}
                        {(!article.metadata.tags.is_empty()).then(|| view! { <ul class="project-tags" aria-label="Article tags">
                            {article.metadata.tags.into_iter().map(|tag| view! { <li>{tag}</li> }).collect_view()}
                        </ul> })}
                        <Prose content=article.markdown/>
                    </article>
                </Section>
            </WebsiteLayout>
        },
    )?)
}

pub fn add_blog(
    manifest: &mut Manifest,
    articles: &Articles,
    as_of: ArticleDate,
) -> Result<(), Box<dyn Error>> {
    let published: Vec<_> = articles.published(as_of).cloned().collect();
    for article in &published {
        if let Some(image) = &article.metadata.image {
            let path = OutputPath::new(image.src.trim_start_matches('/'))?;
            if !manifest.contains(&path) {
                return Err(format!(
                    "Article {} references unpublished image {}",
                    article.metadata.slug.as_str(),
                    image.src
                )
                .into());
            }
        }
    }
    manifest.insert_page(
        Route::new("/blog/")?,
        render_index(&published, as_of)?,
        site_content::Indexing::Index,
    )?;
    for article in published {
        manifest.insert_page(
            Route::new(&article.metadata.slug.path())?,
            render_article(article)?,
            site_content::Indexing::Index,
        )?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, path::PathBuf};
    struct Fixture(PathBuf);
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn generated_blog_excludes_unpublished_content_and_preserves_metadata() {
        let root = Fixture(std::env::temp_dir().join(format!("site-blog-{}", std::process::id())));
        fs::create_dir(&root.0).expect("test dir");
        // macOS resolves the system temporary directory through symlinked
        // components such as /var; canonicalize so the output guard validates
        // the real filesystem layout instead of rejecting the host's aliases.
        let root = fs::canonicalize(&root.0).expect("canonical test dir");
        let content = root.join("content");
        fs::create_dir(&content).expect("content dir");
        let fixture = include_str!("../../content/tests/fixtures/articles/first-note.md");
        for (slug, date, draft) in [
            ("first-note", "2024-02-29", false),
            ("draft", "2024-02-29", true),
            ("future", "2099-01-01", false),
        ] {
            fs::write(
                content.join(format!("{slug}.md")),
                fixture
                    .replace("first-note", slug)
                    .replace("2024-02-29", date)
                    .replace("draft = false", &format!("draft = {draft}")),
            )
            .expect("fixture");
        }
        let articles = site_content::load_articles(&content).expect("load");
        let date = "2024-02-29".parse().expect("build date");
        let mut manifest = Manifest::default();
        assert!(
            add_blog(&mut manifest, &articles, date).is_err(),
            "missing image must fail"
        );
        manifest
            .insert(
                OutputPath::new("images/profile.webp").expect("path"),
                vec![1],
            )
            .expect("image");
        add_blog(&mut manifest, &articles, date).expect("generate");
        let output = root.join("output");
        manifest.write_new(&output).expect("write");
        assert!(!output.join("blog/draft").exists());
        assert!(!output.join("blog/future").exists());
        let index = fs::read_to_string(output.join("blog/index.html")).expect("index");
        assert!(index.contains("/blog/first-note/"));
        assert!(!index.contains("/blog/draft/") && !index.contains("/blog/future/"));
        let page = fs::read_to_string(output.join("blog/first-note/index.html")).expect("article");
        for expected in [
            "https://www.somsouk.fr/blog/first-note/",
            "<strong>Markdown</strong>",
            "<mark>trusted author HTML</mark>",
            "BlogPosting",
            "datePublished",
            "2024-02-29",
            "February 29, 2024",
            "content=\"article\"",
        ] {
            assert!(page.contains(expected), "Missing {expected}");
        }
        assert!(!page.contains("<script src") && !page.contains(".wasm"));
        assert!(
            render_index(&[], date)
                .expect("empty")
                .contains("No articles published yet.")
        );
    }
}
