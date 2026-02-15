#!/usr/bin/env bash
set -euo pipefail

# Optimize head.glb for web delivery
# Requires: npx @gltf-transform/cli

INPUT="public/head.glb"
TEMP="public/head-temp.glb"
OUTPUT="public/head-opt.glb"

echo "Optimizing $INPUT..."

# Resize textures to 1024x1024
npx --yes @gltf-transform/cli resize "$INPUT" "$TEMP" --width 1024 --height 1024

# Convert textures to WebP
npx --yes @gltf-transform/cli webp "$TEMP" "$TEMP" --quality 80

# Apply Meshopt geometry compression
npx --yes @gltf-transform/cli meshopt "$TEMP" "$OUTPUT" --level medium

# Clean up
rm -f "$TEMP"

echo "Done: $(ls -lh "$OUTPUT" | awk '{print $5}') → $OUTPUT"
