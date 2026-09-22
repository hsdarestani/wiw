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
./gradlew :app:generateAutolinkingPackageList
PACKAGE_LIST="app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java"
if grep -q 'expo\.core\.ExpoModulesPackage' "$PACKAGE_LIST"; then
  sed -i 's/expo\.core\.ExpoModulesPackage/expo.modules.ExpoModulesPackage/g' "$PACKAGE_LIST"
fi
grep -q 'expo\.modules\.ExpoModulesPackage' "$PACKAGE_LIST"
./gradlew bundleRelease
mkdir -p ../artifacts
cp app/build/outputs/bundle/release/app-release.aab ../artifacts/schichtpro-release.aab
