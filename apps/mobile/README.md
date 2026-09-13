# SchichtPro Mobile

Native iOS and Android client built with Expo and React Native. The app uses the
production SchichtPro API by default and shares accounts and scheduling data with
the web dashboard.

## Run locally

```bash
pnpm install
pnpm --filter @schichtpro/mobile ios
```

Use `pnpm --filter @schichtpro/mobile android` for an Android emulator. The API
base URL is configured in `app.json` under `expo.extra.apiUrl`.

## Validate

```bash
pnpm --filter @schichtpro/mobile typecheck
pnpm --filter @schichtpro/mobile exec expo export --platform ios
```

The bundle identifiers reserved for store builds are:

- iOS: `sbs.smarbiz.schichtpro`
- Android: `sbs.smarbiz.schichtpro`
