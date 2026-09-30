//! Static Ripple shell; Rust/Wasm owns the runtime search and interventions.
use crate::ui::WebsiteLayout;
use leptos::prelude::*;
use site_content::{CanonicalUrl, PageMetadata, SocialMetadata};

pub fn render_ripple() -> Result<String, serde_json::Error> {
    let level = ripple_engine::Level::weighted(0x7f93a2);
    let metadata = PageMetadata {
        description: Some("One change. A different path. An interactive pathfinding puzzle about costs and consequences.".into()),
        canonical: Some(CanonicalUrl::from_site_path("/ripple/").expect("fixed route")),
        social: Some(SocialMetadata { title: "Ripple".into(), site_name: None, image: None }),
        ..PageMetadata::new("Ripple | Jérémy Somsouk")
    };
    crate::document::render_document_with_assets(
        metadata,
        view! {
            <WebsiteLayout>
                <nav class="page-trail" aria-label="Breadcrumb"><a href="/">"Home"</a><a href="/projects/">"Projects"</a><span aria-current="page">"Ripple"</span></nav>
                <section class="ripple-game" aria-labelledby="ripple-title" data-seed="7F93A2">
                    <div class="ripple-intro"><p class="ripple-eyebrow">"An experiment in cause & effect · 01"</p>
                        <h2 id="ripple-title">"Ripple"</h2><p class="ripple-tagline">"One change. A different path."</p>
                        <p id="ripple-objective">"Make the search pass through ◇ on the lower route. You have two changes."</p>
                    </div>
                    <div class="ripple-workspace">
                        <div>
                            <div class="ripple-board" role="group" aria-label="Weighted pathfinding board" aria-describedby="ripple-objective ripple-instructions">
                                {level.graph.nodes.iter().enumerate().map(|(i,node)| {
                                    let wall = node.cost.is_none();
                                    let label = if i == level.graph.start { "S".into() } else if i == level.graph.target { "T".into() }
                                        else if i == level.checkpoint { format!("◇ {}",node.cost.unwrap()) } else { node.cost.map_or("·".into(),|c| c.to_string()) };
                                    view! { <button type="button" class="ripple-cell" data-node=i data-wall=wall.to_string()
                                        disabled=true aria-label=format!("Row {}, column {}, {}",node.y+1,node.x+1, if wall {"fixed wall".into()} else {format!("cost {}",node.cost.unwrap())})>{label}</button> }
                                }).collect_view()}
                            </div>
                            <p class="ripple-legend">"S start · T target · ◇ required waypoint · numbers = entry cost"<br/>"○ frontier · ✓ visited · → chosen path · × blocked"</p>
                            <p id="ripple-instructions">"Tap a cell to change its cost between 1 and 9, or choose Block. The algorithm draws the path."</p>
                            <div class="ripple-controls" role="group" aria-label="Intervention controls">
                                <button type="button" id="ripple-weight" aria-pressed="true" disabled=true>"Change cost"</button>
                                <button type="button" id="ripple-block" aria-pressed="false" disabled=true>"Block"</button>
                                <button type="button" id="ripple-undo" disabled=true>"Undo"</button>
                                <button type="button" id="ripple-reset" disabled=true>"Reset"</button>
                                <span id="ripple-budget">"2 changes left"</span>
                            </div>
                        </div>
                        <aside class="ripple-observation" aria-label="Search observation">
                            <p class="ripple-eyebrow">"Watch the decisions"</p>
                            <div class="ripple-controls">
                                <label for="ripple-algorithm">"Search "</label>
                                <select id="ripple-algorithm" disabled=true><option value="0">"Dijkstra"</option><option value="1">"A*"</option></select>
                            </div>
                            <p id="ripple-algorithm-note">"Dijkstra expands the cheapest known cost first."</p>
                            <div class="ripple-controls" role="group" aria-label="Playback controls">
                                <button type="button" id="ripple-play" disabled=true>"Play"</button>
                                <button type="button" id="ripple-step" disabled=true>"Step"</button>
                                <button type="button" id="ripple-replay" disabled=true>"Replay"</button>
                            </div>
                            <p id="ripple-status" role="status" aria-live="polite">"Loading the experiment…"</p>
                            <dl class="ripple-metrics"><dt>"Explored"</dt><dd id="ripple-explored">"—"</dd><dt>"Path cost"</dt><dd id="ripple-cost">"—"</dd></dl>
                            <div id="ripple-feedback" hidden=true>
                                <h3>"The ripple point"</h3><p id="ripple-reason"></p>
                                <p id="ripple-before-after"></p>
                                <button type="button" id="ripple-compare" aria-pressed="false">"Show original path"</button>
                            </div>
                            <p class="ripple-seed">"Level seed · 7F93A2"</p>
                        </aside>
                    </div>
                    <noscript><p>"Ripple needs JavaScript and WebAssembly to run. All other pages remain available."</p></noscript>
                </section>
                <script type="module" src="/ripple/game.js"></script>
            </WebsiteLayout>
        },
        crate::document::DocumentAssets {
            stylesheets: &["/ripple/ripple.css"],
            ..Default::default()
        },
    )
}

#[cfg(test)]
mod tests {
    #[test]
    fn static_route_has_board_and_metadata() {
        let html = super::render_ripple().unwrap();
        assert_eq!(html.matches("data-node=").count(), 35);
        assert!(html.contains("https://www.somsouk.fr/ripple/"));
        assert!(html.contains("id=\"ripple-undo\""));
        assert!(html.contains("<noscript>"));
    }
}
