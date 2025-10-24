#!/usr/bin/env bash
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
OUT=$ROOT/packages/shared/abi
mkdir -p "$OUT"
jq -r .abi out/ARKToken.sol/ARKToken.json > "$OUT/ARKToken.json"
jq -r .abi out/XPRegistry.sol/XPRegistry.json > "$OUT/XPRegistry.json"
jq -r .abi out/BadgeNFT.sol/BadgeNFT.json > "$OUT/BadgeNFT.json"
jq -r .abi out/GameEscrow.sol/GameEscrow.json > "$OUT/GameEscrow.json"
echo "ABIs → packages/shared/abi"
