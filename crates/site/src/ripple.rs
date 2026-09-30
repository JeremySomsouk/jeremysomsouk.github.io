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
                    <div class="ripple-intro"><p class="ripple-eyebrow">"A small change. A surprising consequence."</p>
                        <h2 id="ripple-title">"Ripple"</h2><p class="ripple-tagline">"Can you change its mind?"</p>
                        <p id="ripple-objective">"The spark takes the cheapest route. Make it visit the diamond ◇."</p>
                    </div>
                    <div class="ripple-workspace">
                        <div class="ripple-challenge">
                            <p id="ripple-lesson" class="ripple-eyebrow">"1 / 2 · Make a route tempting"</p>
                            <p id="ripple-instructions" tabindex="-1">"Tap a marked cell to make it easier or harder. Watch the spark choose again."</p>
                            <div class="ripple-route-totals" aria-label="Energy needed by each route">
                                <p>"Upper route "<strong id="ripple-upper">"—"</strong></p>
                                <p>"Diamond route ◇ "<strong id="ripple-lower">"—"</strong></p>
                            </div>
                            <div class="ripple-board" role="group" aria-label="Send the spark through the diamond" aria-describedby="ripple-objective ripple-instructions">
                                {level.graph.nodes.iter().enumerate().map(|(i,node)| {
                                    let wall = node.cost.is_none();
                                    let label = if i == level.graph.start { "●".into() } else if i == level.graph.target { "◎".into() }
                                        else if i == level.checkpoint { format!("◇ {}",node.cost.unwrap()) } else { node.cost.map_or("".into(),|c| if c == 1 {"·".into()} else {c.to_string()}) };
                                    view! { <button type="button" class="ripple-cell" data-node=i data-wall=wall.to_string()
                                        disabled=true aria-label=format!("Row {}, column {}, {}",node.y+1,node.x+1, if wall {"fixed wall".into()} else {format!("energy {}",node.cost.unwrap())})>{label}</button> }
                                }).collect_view()}
                            </div>
                            <p class="ripple-legend">"● spark · ◎ finish · ◇ visit here · each small dot costs 1 energy"</p>
                            <p id="ripple-status" role="status" aria-live="polite">"Waking the spark…"</p>
                            <div class="ripple-controls" role="group" aria-label="Try another idea">
                                <button type="button" id="ripple-undo" disabled=true>"Undo"</button>
                                <button type="button" id="ripple-reset" disabled=true>"Try again"</button>
                                <button type="button" id="ripple-replay" disabled=true>"Watch again"</button>
                                <span id="ripple-budget">"2 changes left"</span>
                            </div>
                            <div id="ripple-feedback" hidden=true>
                                <p id="ripple-reason"></p>
                            </div>
                            <button type="button" id="ripple-next" hidden=true>"Next: close a route →"</button>
                            <button type="button" id="ripple-hint" hidden=true>"A little nudge?"</button>
                            <p id="ripple-nudge" hidden=true>"The diamond costs 9 energy. What if it cost only 1?"</p>
                        </div>
                        <details class="ripple-observation" id="ripple-lab">
                            <summary>"Look inside the algorithm"</summary>
                            <p>"It adds up the energy along each route and chooses the smallest total. You change the conditions; it chooses the path."</p>
                            <div class="ripple-controls">
                                <label for="ripple-algorithm">"Search "</label>
                                <select id="ripple-algorithm" disabled=true><option value="0">"Dijkstra"</option><option value="1">"A*"</option></select>
                            </div>
                            <p id="ripple-algorithm-note">"Dijkstra tries the lowest energy total first."</p>
                            <div class="ripple-controls" role="group" aria-label="Playback controls">
                                <button type="button" id="ripple-play" disabled=true>"Play"</button>
                                <button type="button" id="ripple-step" disabled=true>"Step"</button>
                            </div>
                            <p class="ripple-legend">"○ waiting to be checked · ✓ checked · → chosen path · × closed"</p>
                            <dl class="ripple-metrics"><dt>"Cells checked"</dt><dd id="ripple-explored">"—"</dd><dt>"Route energy"</dt><dd id="ripple-cost">"—"</dd></dl>
                            <p id="ripple-before-after"></p>
                            <button type="button" id="ripple-compare" aria-pressed="false" disabled=true>"Show original path"</button>
                            <div class="ripple-controls" id="ripple-tools" hidden=true role="group" aria-label="Intervention controls">
                                <button type="button" id="ripple-weight" aria-pressed="true" disabled=true>"Change energy"</button>
                                <button type="button" id="ripple-block" aria-pressed="false" disabled=true>"Close a cell"</button>
                            </div>
                            <button type="button" id="ripple-free" disabled=true>"Experiment freely"</button>
                            <p class="ripple-seed">"Level seed · 7F93A2"</p>
                        </details>
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
