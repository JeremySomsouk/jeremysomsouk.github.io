#!/usr/bin/env bash
set -euo pipefail
mkdir -p docs/cabane/chiffres/vendor
echo "Downloading TensorFlow.js ESM build into docs/cabane/chiffres/vendor/tf.esm.js"
# Use jsdelivr ESM build
curl -fL -o docs/cabane/chiffres/vendor/tf.esm.js https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.esm.js
ls -lah docs/cabane/chiffres/vendor/tf.esm.js

echo "Done. Commit docs/cabane/chiffres/vendor/tf.esm.js to vendor TF.js in the repo."