//! Native static rendering. No client router or hydration entry point.
mod cabane;
pub use cabane::render_cabane;

pub mod blog;
pub mod document;
mod not_found;
mod prose;
pub use not_found::render_not_found;

mod homepage;
pub use homepage::render_homepage;

mod projects;
pub use projects::{render_project, render_projects};

pub mod output;
pub mod ui;

pub const SITE_CSS: &str = include_str!("../../../styles/site.css");

mod ripple;
pub use ripple::render_ripple;

mod guess;
pub use guess::{render_guess, render_guess_redirect};

mod nuance;
pub use nuance::render_nuance;
