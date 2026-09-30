+++
title = "Migrating this site from Jekyll to Rust and Leptos"
description = "Why and how this static site moved from Jekyll and a remote theme to a typed Rust generator that renders Leptos views at build time."
slug = "migrating-from-jekyll-to-leptos"
date = 2026-09-30
draft = false
tags = ["Rust", "Leptos", "Static sites"]
+++
The site you're reading used to be Jekyll. It worked fine. It ran on a remote
theme I never pinned, a Sass pipeline I never opened, and a Ruby toolchain I
only saw when something broke. For clarity about the stakes: this is a
personal site, the most demanding visitors are my kids coming for the games,
and nobody ever filed a bug. I rewrote it anyway, in Rust, with
[Leptos](https://book.leptos.dev/) doing the rendering. Three honest reasons:
it sounded fun, I wanted to vibe code it with an AI agent doing the typing,
and I wanted to know where the limits of that were. How far can an agent
take a migration like this before a human has to actually care? The games
did not get rewritten. More on that.

## What I wanted

Three things, written down before starting, because "rewrite the site" is how
side projects die:

- Nothing breaks. Every URL, image and bookmark keeps working. If a file
  carries over, it carries over byte-identical, and the build proves it or
  fails.
- The games stay frozen. My kids play them. They work. The migration does not
  touch them.
- The output stays a plain folder. I host on GitHub Pages today, but the
  artifact shouldn't know that. `CNAME` and `.nojekyll` are the only
  Pages-shaped files in it, and both are inert anywhere else. The day I want a
  VPS, moving is a copy and a five-line Caddy config, not another migration.

Softer goals existed too. Cabane deserved to feel like part of the site instead
of a folder parked next to my resume, and I wanted a build I actually trust.
But those three were the contract.

## The build

Two small crates. One holds typed content: my profile, resume entries,
projects, and articles like this one. Articles are just Markdown files with
a small TOML header; a bad date or a weird slug fails the build with the file
path. The other renders that content using Leptos's server-side rendering, at
build time, into complete HTML files. No router, no hydration, no JavaScript
on ordinary pages. This article ships none.

A typed manifest owns every output path and refuses collisions, unsafe paths
and symlinks. Then a separate Python script rebuilds the expected artifact from
the sources and compares. The checker and the generator share no code, so a
bug has to get past two very different programs before it reaches you.

## The games

The Cabane activities are plain static files: HTML, JS, and one Rust engine
compiled to Wasm. I nearly rewrote them in Leptos too. Glad I didn't. Instead
every game file is copied byte for byte, except one: the selection page, which
the generator now renders in the same shell as the rest of the site. That
single regenerated page is what lets the homepage and the games share a small
cross-document transition, pure CSS with no scripts, disabled for reduced
motion.

The verifier doesn't take "byte for byte" on faith, either. It walks every
relative import and fetch in the copied scripts to confirm they still resolve,
and it parses the Memory engine's Wasm binary directly to check that it
imports nothing and exports exactly the functions its controller calls. Rename
an asset or rebuild the engine wrong, and the build fails before publishing.

## Was it worth it

For a site this size, honestly, maybe not. Jekyll worked. But I got the build
I trust: typed content where the compiler catches my typos, a real 404, https
canonicals, and a deploy that builds, verifies and publishes in one pass. The
whole migration landed as a single commit with a rollback plan I wrote down
and hope to never use.

As an experiment, it answered its own question. An agent can carry a surprising
amount of the discipline, byte-identity checks and Wasm parsing included, as
long as the human keeps saying no to shortcuts. And there is a payoff that
points forward: future updates are now easy to vibe code. Adding a project or
an article is a small typed diff, the compiler complains when a record is
wrong, and the verifier rebuilds the expected artifact from scratch every run.
That loop is exactly what an agent needs, so my next change will probably
happen with me reviewing instead of typing.

One regret: I kept a "proof" page around long past the point where it proved
anything, and let migration notes pile up in the published tree for weeks.
Fixtures are for branches. Ship the site.

Would I recommend it as a weekend project? The migration was the fun part,
and honestly the last one this site needs. The point of the setup is to never
have to bother again: with typed content, the compiler and the verifier in
the loop, changing the site is a prompt away. Describe it, review the diff,
merge, done. You just read the result.