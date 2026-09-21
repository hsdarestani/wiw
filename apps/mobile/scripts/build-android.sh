#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"
corepack enable
pnpm install --frozen-lockfile
cd apps/mobile
npx expo prebuild --platform android --clean --no-install
cd android
chmod +x gradlew
./gradlew bundleRelease
mkdir -p ../artifacts
cp app/build/outputs/bundle/release/app-release.aab ../artifacts/schichtpro-release.aab
