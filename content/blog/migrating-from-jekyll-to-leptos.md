+++
title = "Migrating this site from Jekyll to Rust and Leptos"
description = "Why and how this static site moved from Jekyll and a remote theme to a typed Rust generator that renders Leptos views at build time."
slug = "migrating-from-jekyll-to-leptos"
date = 2026-09-30
draft = false
tags = ["Rust", "Leptos", "Static sites"]
+++
The site you are reading used to be a Jekyll site. It worked, but it was built
on things I did not control: an unpinned remote theme, a Sass pipeline, a Ruby
toolchain I only touched when it broke, and content flowing through templates
with no type checking. Small cracks showed up in odd places: canonical URLs
that said `http://`, no sitemap or robots.txt, and a 404 page that happily
served my resume instead of an error.

So I migrated the site to Rust, with [Leptos](https://book.leptos.dev/) doing
the rendering. This post is the short version of how it went.

## The shape of the new build

Two small crates do all the work:

- A content crate holds typed records for my profile, resume and projects, and
  validates blog articles written in plain Markdown with a small TOML header.
  Invalid dates, unsafe slugs or missing required fields fail the build with
  the offending file path.
- A site crate renders those records into complete HTML files using Leptos's
  server-side rendering, at build time. There is no client router, no
  hydration, no JavaScript on ordinary pages. A typed manifest owns every
  output path, rejecting collisions, unsafe paths and symlinks before a single
  file is written.

The generated artifact is then checked by an independent verifier written in
plain Python, which rebuilds the expected file set from the sources and
compares them. The generator and the verifier share no code, so a bug has to
fool two very different programs to reach production.

## The games stayed untouched

Next to the articles, this site hosts little browser games for my kids, built
as plain static files — one of them with a Rust engine compiled to WebAssembly.
A blanket rewrite of working games was out of the question, so the migration
treated them as a frozen boundary: every game file is copied byte for byte,
except the single selection page the new generator renders.

To keep that promise honest, the verifier walks every relative import and fetch
in the copied scripts to prove they still resolve, and parses the Memory
engine's Wasm binary directly to assert that it imports nothing and exports
exactly the ABI its controller calls. If someone renames an asset or rebuilds
the engine with a different interface, the build fails before anything is
published.

## What improved

- Ordinary pages ship zero client code, including this article.
- A real 404 page, a sitemap, robots.txt and HTTPS canonical URLs.
- Content is typed: the compiler catches a broken record before I push.
- Deployment is a single pipeline: build, verify, publish to GitHub Pages.
- The whole migration landed as one commit with a recorded rollback.

## What I would do differently

I kept a small "proof" page around long after it stopped proving anything, and
I let the migration notes pile up in the published tree. Fixtures and logs are
for the working branches; ship the product. The cleanup was easy — deleting
files usually is — but doing it on day one would have saved a pass.

If you have a small static site and a Rust toolchain lying around, this is a
fun weekend-sized project. The blog you just read is the system it describes:
Markdown in, typed records, verified artifact out.