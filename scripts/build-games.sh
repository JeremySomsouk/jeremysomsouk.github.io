#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
RUSTC="$(rustup which --toolchain 1.96.0 rustc)" rustup run 1.96.0 cargo build --manifest-path games/memory/Cargo.toml --release --target wasm32-unknown-unknown
cp games/memory/target/wasm32-unknown-unknown/release/memory_game.wasm docs/cabane/memory/game.wasm
