#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build --locked --release -p nuance-engine --target wasm32-unknown-unknown
mkdir -p target/nuance
cp target/wasm32-unknown-unknown/release/nuance_engine.wasm target/nuance/engine.wasm
