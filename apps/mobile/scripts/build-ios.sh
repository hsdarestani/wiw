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
sudo gem install cocoapods -v 1.16.2 --no-document
pod _1.16.2_ install
ruby - <<'RUBY'
require 'xcodeproj'
project = Xcodeproj::Project.open('Pods/Pods.xcodeproj')
project.targets.select { |target| ['fmt', 'RCT-Folly'].include?(target.name) }.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
  end
end
project.save
RUBY
: "${IOS_TEAM_ID:?Publisher must provide IOS_TEAM_ID}"
: "${IOS_PROVISIONING_PROFILE_SPECIFIER:?Publisher must provide the provisioning profile}"
: "${IOS_SIGNING_KEYCHAIN:?Publisher must provide the signing keychain}"
xcodebuild -workspace SchichtPro.xcworkspace -scheme SchichtPro -configuration Release -archivePath build/SchichtPro.xcarchive archive CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM="$IOS_TEAM_ID" CODE_SIGN_IDENTITY="${IOS_CODE_SIGN_IDENTITY:-Apple Distribution}" PROVISIONING_PROFILE_SPECIFIER="$IOS_PROVISIONING_PROFILE_SPECIFIER" PRODUCT_BUNDLE_IDENTIFIER="${IOS_BUNDLE_ID:-sbs.smarbiz.schichtpro}" OTHER_CODE_SIGN_FLAGS="--keychain $IOS_SIGNING_KEYCHAIN" MARKETING_VERSION="${APP_VERSION_NAME:-1.0.0}" CURRENT_PROJECT_VERSION="${APP_BUILD_NUMBER:-1}"
EXPORT_OPTIONS="${IOS_EXPORT_OPTIONS_PLIST:-build/ExportOptions.plist}"
if [[ -z "${IOS_EXPORT_OPTIONS_PLIST:-}" ]]; then
  cat > "$EXPORT_OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>signingStyle</key><string>manual</string>
<key>teamID</key><string>${IOS_TEAM_ID}</string>
<key>provisioningProfiles</key><dict><key>${IOS_BUNDLE_ID:-sbs.smarbiz.schichtpro}</key><string>${IOS_PROVISIONING_PROFILE_SPECIFIER}</string></dict>
</dict></plist>
PLIST
fi
xcodebuild -exportArchive -archivePath build/SchichtPro.xcarchive -exportPath build/export -exportOptionsPlist "$EXPORT_OPTIONS" OTHER_CODE_SIGN_FLAGS="--keychain $IOS_SIGNING_KEYCHAIN"
mkdir -p ../artifacts
cp build/export/*.ipa ../artifacts/schichtpro.ipa
