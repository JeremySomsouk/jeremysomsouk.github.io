//! Content models independent of rendering and filesystem access.

/// Plain-text metadata rendered into a document head.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PageMetadata {
    pub title: String,
    pub description: String,
}
