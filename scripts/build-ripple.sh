#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build --locked --release -p ripple-engine --target wasm32-unknown-unknown
mkdir -p target/ripple
cp target/wasm32-unknown-unknown/release/ripple_engine.wasm target/ripple/engine.wasm
