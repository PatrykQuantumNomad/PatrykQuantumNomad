#!/usr/bin/env bash
set -euo pipefail

# Optimize head.glb for web delivery
# Requires: npx @gltf-transform/cli

INPUT="public/head.glb"
TEMP="public/head-temp.glb"
OUTPUT="public/head-opt.glb"

echo "Optimizing $INPUT ($(ls -lh "$INPUT" | awk '{print $5}'))..."

# 1. Weld duplicate vertices
npx --yes @gltf-transform/cli weld "$INPUT" "$TEMP"

# 2. Simplify mesh (reduce polygon count for web)
npx --yes @gltf-transform/cli simplify "$TEMP" "$TEMP" --ratio 0.01 --error 0.01

# 3. Resize textures to 1024x1024
npx --yes @gltf-transform/cli resize "$TEMP" "$TEMP" --width 1024 --height 1024

# 4. Convert textures to WebP
npx --yes @gltf-transform/cli webp "$TEMP" "$TEMP" --quality 75

# 5. Dedup & prune unused data
npx --yes @gltf-transform/cli dedup "$TEMP" "$TEMP"
npx --yes @gltf-transform/cli prune "$TEMP" "$TEMP"

# 6. Quantize vertex attributes (reduce precision)
npx --yes @gltf-transform/cli quantize "$TEMP" "$TEMP"

# 7. Apply Meshopt geometry compression
npx --yes @gltf-transform/cli meshopt "$TEMP" "$OUTPUT" --level medium

# Clean up
rm -f "$TEMP"

echo "Done: $(ls -lh "$OUTPUT" | awk '{print $5}') → $OUTPUT"
