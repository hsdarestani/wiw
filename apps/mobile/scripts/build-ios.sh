#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS release builds require a macOS Publisher agent with Xcode." >&2
  exit 1
fi
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"
corepack enable
pnpm install --frozen-lockfile
cd apps/mobile
npx expo prebuild --platform ios --clean --no-install
cd ios
pod install
: "${IOS_TEAM_ID:?Publisher must provide IOS_TEAM_ID}"
xcodebuild -workspace SchichtPro.xcworkspace -scheme SchichtPro -configuration Release -archivePath build/SchichtPro.xcarchive archive CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM="$IOS_TEAM_ID" PRODUCT_BUNDLE_IDENTIFIER="sbs.smarbiz.schichtpro" MARKETING_VERSION="${APP_VERSION_NAME:-1.0.0}" CURRENT_PROJECT_VERSION="${APP_BUILD_NUMBER:-1}"
xcodebuild -exportArchive -archivePath build/SchichtPro.xcarchive -exportPath build/export -exportOptionsPlist "$IOS_EXPORT_OPTIONS_PLIST"
mkdir -p ../artifacts
cp build/export/*.ipa ../artifacts/schichtpro.ipa
