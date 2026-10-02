# Qui a dit ? — system prototype

Standalone route: `/qui-a-dit/`. Static Leptos shell, browser JavaScript engine, no account, API, tracking or backend. The prototype is noindex and intentionally not promoted on the homepage yet.

## Play

Three rounds of four statements. Drag a statement onto a speaker, or select the statement and tap/click a speaker. Keyboard users can activate the same buttons. Assigning an occupied speaker removes their previous assignment. Remove an assignment to change it. Reveal requires a complete one-to-one match; reveal locks the round, shows the original author and source context, and scores once. Results show round totals, clipboard sharing without answer spoilers, and replay with shuffled statement order.

## Content contract

Edit `public/qui-a-dit/edition.json` separately from game code. Version 1 fields:

- Edition: `id`, `title`, `version: 1`, `demo`, `speakers`, `rounds`.
- Speaker: unique `id`, `name`, optional `description`.
- Round: unique `id`, `topic`, `statements`.
- Statement: globally unique `id`, `text`, `speakerId`, `source`.
- Source: `title`, `context`, `date` (YYYY-MM-DD), `url` (HTTPS).

Each round must contain exactly one statement per speaker. The same position held by multiple people does not make a quotation multi-author: this game asks who uttered the sourced words, not who agrees with them.

The demo uses fictional names and invented statements throughout. Live editions require dated HTTPS sources. Before real content is enabled, replace the demo banner/title and review indexing deliberately. Preserve exact quotations and enough context to interpret them; this system does not verify their truth. No candidate roster or election date is encoded.

## Checks and limitations

`node --test scripts/political.test.mjs` checks content validation, reassignment, incomplete submissions, duplicate assignments and scoring. The existing CI also compiles and checks the Leptos route.

Answers ship to the browser; this is a casual recognition game, not an anti-cheat system. Progress is session-memory only. Daily edition scheduling and persistent streaks are future work. Native mouse drag-and-drop has tap/keyboard fallback for mobile; a custom touch drag implementation is not included.
