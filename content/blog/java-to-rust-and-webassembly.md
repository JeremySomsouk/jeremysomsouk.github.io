+++
title = "A Java developer's short guide to Rust and WebAssembly"
description = "What a decade of Java teaches you about learning Rust, and why compiling a small game engine to WebAssembly is a great first project."
slug = "java-to-rust-and-webassembly"
date = 2026-09-30
draft = false
tags = ["Java", "Rust", "WebAssembly"]
+++
I write Java all day at work. At home, one of my kids' favorite browser games
runs on Rust compiled to WebAssembly. I used to think that sentence was for
other people. It turns out the distance from Java to Rust is shorter than the
distance from Java to most things, and WebAssembly is the most fun place to
cross it.

## The part that feels familiar

If you have kept up with modern Java, you already like half of Rust.

Cargo is Maven with the XML and the ceremony removed. A project starts with a
two-line manifest, dependencies are one line each, and the toolchain handles
build, test, docs and formatting without a plugin summit. I have spent entire
afternoons of my life in Gradle and Maven configuration. I have never once
thought about that in Cargo.

And the type system rhymes with where Java is heading. Records are Rust
structs. Sealed interfaces are Rust enums, and Rust enums are fully committed
to the idea: the set of cases is the type, the compiler forces you to handle
every case, and data rides along with each variant. If you enjoy pattern
matching over sealed types today, Rust is that feeling with the training
wheels off.

## The part that feels new

The borrow checker, which is the thing everyone warns you about, is really
just this: the compiler tracks who owns an object and when it dies. Java does
the same job with a garbage collector at runtime. Rust does it at compile time,
which means no GC pauses, no memory leaks from forgotten references, and no
surprises at 3am. The price is that you argue with the compiler for the first
two weeks. The benefit is that after it compiles, the boring guarantees are
already checked.

That strictness matters even more now that agents write a lot of the code. The
borrow checker will argue with an agent all day, at no emotional cost, and it
cannot be talked into accepting sloppy ownership. When an agent tells you "it
compiles," that sentence means more in Rust than in most languages: the
boring guarantees were checked by something that does not get tired.

Two smaller gifts worth the trip: there is no null. An absent value is an
Option, and you cannot touch it without handling the absent case. And errors
are values returned from functions, not exceptions thrown from six frames down.
Both show up in the function signature, so "what can go wrong here" is a
question the type system answers.

## Where WebAssembly fits

Here is the concrete story. The memory game on this site has its logic in a
Rust crate: 183 lines that shuffle a deck, track flips, score matches. That
compiles to a 22 KB WebAssembly module with a plain C-style interface. The
browser page keeps a small JavaScript controller that calls it like any
module: start, flip, card, is matched. The module imports nothing from the
host at all, which matters to me enough that the build parses the binary and
fails if an import sneaks in.

What that buys over writing the game in JavaScript:

- Predictable performance with no garbage collector pauses or type-jitting
  warmup, on a hot path like a game loop.
- Real tests, run natively, in the same crate. The game logic is verified
  without opening a browser.
- A dependency-free artifact. The whole engine, RNG included, is 22 KB.

The comparison I keep coming back to: WebAssembly is the JVM's portability
dream without the JVM. Any page, any browser, instant start, tiny footprint,
sandboxed. Write once, run everywhere actually happened, quietly.

Two honest warnings. Don't reach for Wasm when JavaScript is obviously enough;
this site's ordinary pages ship zero client code, and they are better for it.
And don't start by rewriting your work service in Rust. Start with a small,
pure module, the way the memory engine did.

## The verdict

I kept Java at work and Rust at the seams: a game engine here, a static site
generator there, small tools that need to be fast and correct. That is a very
comfortable place to be a Java developer. The kids, meanwhile, don't know
what a borrow checker is. They just match the cards.