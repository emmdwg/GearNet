# GearNet — App Store upload guide

Your Expo app is already wired for **EAS Build** + **EAS Submit**. Follow this checklist in order.

## Already configured in this repo

| Item | Value |
|------|--------|
| Bundle ID | `com.gearnet.app` |
| Display name | GearNet |
| Version / build | `1.0.0` / auto-increment via EAS (`appVersionSource: remote`) |
| EAS project | `e9ea28f1-9d31-446f-96bd-4a2baa3f8ec7` (owner: `primetrigger`) |
| Export compliance | Non-exempt encryption = **false** |
| Account deletion | Settings → Delete account |
| Privacy / Terms (web) | https://gearnetapp.com/privacy · https://gearnetapp.com/terms |
| Production API | `https://gearnetapp.com` (set in `eas.json` production env) |
| Build script | `npm run build:ios` |
| Submit script | `npm run submit:ios` |

## 1. Apple accounts (one-time)

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
2. Sign in to [App Store Connect](https://appstoreconnect.apple.com/).
3. **Users and Access → Integrations → App Store Connect API** — create a key with **App Manager** access. Download the `.p8` once; note **Key ID** and **Issuer ID**.
4. Find your **Team ID** at [developer.apple.com/account](https://developer.apple.com/account) → Membership.

## 2. Create the app record in App Store Connect

1. **My Apps → + → New App**
2. Platforms: **iOS**
3. Name: **GearNet** (must be unique on the store)
4. Bundle ID: register `com.gearnet.app` if needed, then select it
5. SKU: e.g. `gearnet-ios` (internal only)
6. User Access: Full Access

After creation, open **App Information → General Information → Apple ID** (numeric). That is your `ascAppId`.

Add both IDs to `mobile/eas.json` under `submit.production.ios` (EAS will also prompt if omitted):

```json
"submit": {
  "production": {
    "ios": {
      "companyName": "GearNet",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCD123456"
    }
  }
}
```

Optional (recommended for CI / non-interactive submit): ASC API key fields `ascApiKeyPath`, `ascApiKeyId`, `ascApiKeyIssuerId` — see [Expo’s guide](https://docs.expo.dev/submit/ios/).
## 3. App Store Connect listing (before review)

Fill these in App Store Connect (not in git):

### Required metadata

- **Subtitle** (30 chars) — e.g. `Drive. Build. Connect.`
- **Description** — what GearNet is (garage, feed, meets, marketplace, chat)
- **Keywords** — cars, garage, meets, automotive, …
- **Support URL** — `https://gearnetapp.com` (or a dedicated support page)
- **Marketing URL** (optional) — `https://gearnetapp.com`
- **Privacy Policy URL** — `https://gearnetapp.com/privacy`
- **Category** — Social Networking (primary); Lifestyle or Shopping as secondary if desired

### Screenshots (required)

Capture from a device or simulator after a production/preview build:

| Device class | Typical size |
|--------------|--------------|
| 6.7" (iPhone 15 Pro Max etc.) | 1290 × 2796 |
| 6.5" (optional if 6.7" provided) | 1284 × 2778 |
| iPad (if `supportsTablet: true`) | 2048 × 2732 |

Show Explore, Garage, Meets, and Marketplace — real UI, not marketing mockups only.

### App Privacy (nutrition labels)

Declare data you collect. GearNet currently involves roughly:

- Contact info (email)
- User content (posts, photos, messages, listings)
- Identifiers (user ID)
- Location (meets / map pins — only if user grants permission)
- Device ID / push tokens (notifications)

Be accurate; match https://gearnetapp.com/privacy.

### Age rating

Complete the questionnaire. UGC + messaging typically lands **12+** (or higher if you allow mature content without strong filters).

### App Review information

- Contact name, phone, email
- **Demo account** (required — app has login): create a stable reviewer account and put username/password here
- Notes: mention location, photo library, mic (voice notes), and that marketplace is user-to-user

### Content rights / UGC

You already have report + block flows. In review notes, point reviewers to report/block in profile and post menus.

## 4. Expo / EAS login (on your machine)

```bash
cd mobile
npx eas-cli login          # Expo account that owns project (primetrigger)
npx eas-cli whoami
npx eas-cli credentials    # optional: confirm Apple creds managed by EAS
```

Store the ASC API key where EAS can read it (interactive prompt on first submit, or set in `eas.json` / secrets):

- `ascApiKeyPath` → path to `AuthKey_XXXXX.p8`
- `ascApiKeyId` → Key ID
- `ascApiKeyIssuerId` → Issuer ID

Never commit the `.p8` file.

## 5. Build for App Store

```bash
cd mobile
npm run build:ios
# same as: EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production
```

- First iOS build: EAS will ask to manage certificates/profiles — choose **Let EAS handle it**.
- Wait for the build to finish on [expo.dev](https://expo.dev). Download/install via TestFlight after submit, or use internal distribution for `preview`.

Optional internal test build (Ad Hoc / device):

```bash
npx eas-cli build --platform ios --profile preview
```

## 6. Upload to App Store Connect (TestFlight)

```bash
cd mobile
npm run submit:ios
# same as: EAS_NO_VCS=1 npx eas-cli submit --platform ios --profile production
```

Or submit a specific build:

```bash
npx eas-cli submit --platform ios --profile production --latest
```

Processing in App Store Connect usually takes 10–30 minutes. Then:

1. **TestFlight** → add yourself / internal testers
2. Fix crashes before external TestFlight or App Review

## 7. Submit for App Review

In App Store Connect:

1. Select the processed build on the iOS version page
2. Confirm Privacy Policy URL, age rating, pricing (Free)
3. **Add for Review → Submit to App Review**

Typical first review: a few days. Respond in Resolution Center if rejected.

## Common rejection risks (GearNet-specific)

| Risk | Status / action |
|------|------------------|
| Missing account deletion | Done — Settings |
| Missing privacy policy URL | Use `https://gearnetapp.com/privacy` |
| ATS `NSAllowsArbitraryLoads` | Removed for store builds; HTTPS API only |
| Missing mic usage string | Set via `expo-av` plugin |
| Incomplete UGC moderation | Report/block exist — describe in review notes |
| Broken demo login | Seed a reviewer account on production |
| Placeholder legal “starter template” notice | Have counsel review before public launch; reviewers may open the Privacy URL |
| iPad screenshots | `supportsTablet: true` — provide iPad shots or set `supportsTablet` to `false` |

## Quick command cheat sheet

```bash
cd mobile

# Production IPA on EAS
npm run build:ios

# Upload latest production build to ASC / TestFlight
npm run submit:ios

# Check build status
npx eas-cli build:list --platform ios --limit 5
```

## What you must do outside this repo

1. Pay / activate Apple Developer membership  
2. Create the App Store Connect app + paste `ascAppId` / `appleTeamId` into `eas.json`  
3. Create ASC API key (keep `.p8` private)  
4. Write store copy + take screenshots  
5. Fill App Privacy + age rating  
6. Run `build:ios` then `submit:ios` from a machine logged into Expo  
7. Submit for review in App Store Connect  

The binary upload itself is `npm run submit:ios` after a successful production build — everything else is Apple’s web UI and metadata.
