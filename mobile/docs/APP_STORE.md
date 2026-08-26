# GearNet — App Store click-by-click guide

Do these sections **in order**. GearNet’s Expo config is already set (`com.gearnet.app`, EAS project `e9ea28f1-9d31-446f-96bd-4a2baa3f8ec7`).

**Values you will fill in:**

| What | Where you get it | Where you put it |
|------|------------------|------------------|
| Team ID | developer.apple.com → Membership | `eas.json` → `appleTeamId` |
| Asc App ID | App Store Connect → App Information → **Apple ID** | `eas.json` → `ascAppId` |
| ASC API Key `.p8` | App Store Connect → Users and Access → Integrations | Keep private; EAS prompt or local path |

---

## Part A — Apple Developer Program (one-time, ~15–30 min if already paid)

### A1. Enroll / confirm membership

1. Open [https://developer.apple.com/programs/](https://developer.apple.com/programs/)
2. Click **Enroll** (or **Account** if you already have one)
3. Sign in with the Apple ID you want as the developer account
4. If not enrolled: complete identity verification → pay the annual fee → wait for “You are enrolled” email
5. Open [https://developer.apple.com/account](https://developer.apple.com/account)
6. Left sidebar → click **Membership details** (wording may be **Membership**)
7. Copy **Team ID** (10 characters, e.g. `AB12CD34EF`) → paste into a notes app for later

### A2. Register the Bundle ID (Identifiers)

1. Still on [developer.apple.com/account](https://developer.apple.com/account)
2. Left sidebar → **Certificates, Identifiers & Profiles**
3. Left sidebar → **Identifiers**
4. Top-left **+** (blue plus)
5. Select **App IDs** → **Continue**
6. Select **App** → **Continue**
7. **Description:** `GearNet`
8. **Bundle ID:** choose **Explicit**
9. Enter: `com.gearnet.app`
10. Capabilities (check if you use them):
    - **Push Notifications** (you use expo-notifications)
    - **Associated Domains** (you have `applinks:gearnetapp.com`)
11. Click **Continue** → **Register**

If `com.gearnet.app` already exists under your team, skip registration and note it.

---

## Part B — App Store Connect: create the app record

### B1. Open App Store Connect

1. Open [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
2. Sign in with the same Apple ID
3. If prompted for a team, select your paid team
4. Click **Apps** (or **My Apps**)

### B2. New App

1. Click the blue **+** near the top left
2. Click **New App**
3. Fill the modal:
   - **Platforms:** check **iOS**
   - **Name:** `GearNet` (must be unique on the App Store; if taken, try `GearNet Social` etc.)
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** select `com.gearnet.app` (GearNet)
   - **SKU:** `gearnet-ios` (internal only; never shown to users)
   - **User Access:** **Full Access**
4. Click **Create**

### B3. Copy your Asc App ID (`ascAppId`)

1. You should land on the app’s page
2. Top tabs: make sure **App Store** is selected (not TestFlight)
3. Left sidebar under **General** → click **App Information**
4. Under **General Information**, find **Apple ID** (numeric, e.g. `6750123456`)
5. Copy that number → notes app  
   This is **`ascAppId`** for EAS (not the Bundle ID).

### B4. Set privacy policy URL (App Information)

1. Still on **App Information**
2. Scroll to **App Store** / **Privacy Policy URL**
3. Enter: `https://gearnetapp.com/privacy`
4. Click **Save** (top right)

### B5. Category

1. Still on **App Information**
2. **Primary Category** → **Social Networking**
3. **Secondary Category** (optional) → **Lifestyle** or **Shopping**
4. **Save**

---

## Part C — App Store Connect API key (for EAS Submit)

### C1. Create the key

1. App Store Connect top nav → click your name / **Users and Access**  
   Direct: [https://appstoreconnect.apple.com/access/integrations/api](https://appstoreconnect.apple.com/access/integrations/api)
2. Tab **Integrations** → **App Store Connect API**
3. If asked, click **Request Access** / agree once
4. Under **Team Keys** (or **Active**), click **Generate API Key** / **+**
5. **Name:** `EAS Submit`
6. **Access:** **App Manager**
7. Click **Generate**
8. Click **Download API Key** → saves `AuthKey_XXXXXXXXXX.p8`  
   **You can only download this once.** Put it somewhere safe outside the repo (e.g. `~/Documents/apple/AuthKey_….p8`). Never commit it.
9. On the same page, copy:
   - **Issuer ID** (UUID at the top of the Integrations page)
   - **Key ID** (shown next to the key name)

### C2. (Optional) Put IDs in `eas.json` now

On your computer, edit `mobile/eas.json` → `submit.production.ios`:

```json
"ios": {
  "companyName": "GearNet",
  "ascAppId": "PASTE_NUMERIC_APPLE_ID",
  "appleTeamId": "PASTE_TEAM_ID"
}
```

You can leave API key paths out and let `eas submit` prompt, or add:

```json
"ascApiKeyPath": "/absolute/path/to/AuthKey_XXXXX.p8",
"ascApiKeyId": "XXXXXXXXXX",
"ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## Part D — Fill the version page (listing) before review

You can do most of this while the binary builds.

### D1. Open the iOS version

1. App Store Connect → **Apps** → **GearNet**
2. Tab **App Store**
3. Left sidebar under **iOS App** → click **1.0 Prepare for Submission** (or **+ Version** if needed)
4. You are now on the version editor

### D2. Screenshots

1. In **Previews and Screenshots**, choose **iPhone 6.7" Display**
2. Click the **+** / drag images
3. Upload 3–10 PNGs of the real app (Explore, Garage, Meets, Marketplace)
4. Because `supportsTablet: true`, also open **iPad Pro 12.9"** (or the required iPad size shown) and upload iPad screenshots  
   — or later set `"supportsTablet": false` in `app.json` and rebuild if you don’t want iPad

### D3. Text fields

Still on the version page, fill:

| Field | Suggested value |
|-------|-----------------|
| Promotional Text | (optional) |
| Description | Short pitch: garage profiles, explore feed, meets, marketplace, chat |
| Keywords | `cars,garage,automotive,meets,builds,marketplace` (comma-separated, no spaces after commas is fine) |
| Support URL | `https://gearnetapp.com` |
| Marketing URL | `https://gearnetapp.com` |
| Version | `1.0.0` (matches `app.json`) |
| Copyright | `2026 Your Legal Name` |

Click **Save**.

### D4. App Review Information (scroll down on same page)

1. **Sign-In Required:** turn **ON**
2. **User name** / **Password:** create a real production account first (sign up on gearnetapp.com or in a TestFlight build), then paste those credentials
3. **Contact:** your name, phone, email
4. **Notes** (paste something like):

```
GearNet is a social network for car builders.
Demo account is above.
Permissions: Photos (posts/garage), Location when in use (meet map pins), Microphone (optional voice notes in chat), Notifications (optional).
UGC: users can report and block from post menus and profiles.
Marketplace is peer-to-peer; GearNet is not a party to transactions.
Account deletion: Settings → Delete account.
Privacy: https://gearnetapp.com/privacy
```

5. **Save**

### D5. Age Rating

1. Left sidebar → **App Information** (or the **Age Ratings** link on the version page — UI moves occasionally)
2. Click **Edit** / **Age Rating** questionnaire
3. Answer honestly for UGC, messaging, unrestricted web access if any
4. Expect roughly **12+** for social + UGC
5. **Save** / **Done**

### D6. App Privacy (nutrition labels)

1. Left sidebar → **App Privacy**
2. Click **Get Started** or **Edit**
3. Privacy Policy URL: `https://gearnetapp.com/privacy`
4. Click through data types. For GearNet, typically declare **Yes, we collect data from this app**, including roughly:
   - **Contact Info** → Email Address (Account Registration)
   - **User Content** → Photos/Videos, Other User Content (posts, messages, listings)
   - **Identifiers** → User ID
   - **Location** → Coarse/Precise (App Functionality; only if permission granted)
   - **Device ID** (if push) → Device ID
5. For each type, mark whether it is linked to identity and used for tracking (**tracking = No** unless you use ATT ads/analytics cross-app)
6. **Publish** / **Save**

### D7. Pricing

1. Left sidebar → **Pricing and Availability**
2. **Price:** Free
3. Availability: all countries you want (or All)
4. **Save**

---

## Part E — Build the IPA with EAS (your computer)

### E1. Terminal setup

```bash
cd /path/to/GearNet/mobile
npm install
npx eas-cli login
```

1. Browser/device opens Expo login → sign in as **`primetrigger`** (project owner in `app.json`)
2. Confirm:

```bash
npx eas-cli whoami
```

### E2. First production build

```bash
npm run build:ios
```

When EAS asks (first time only):

1. **Generate a new Apple Distribution Certificate?** → **Yes** / let EAS manage
2. **Generate a new Provisioning Profile?** → **Yes**
3. Log in with Apple ID if prompted → enter 2FA code
4. Select your **Team** if asked
5. Wait until the CLI prints a build URL

### E3. Watch the build

1. Open the printed `https://expo.dev/...` link  
   Or: [https://expo.dev](https://expo.dev) → your account → **gearnet** → **Builds**
2. Wait for status **Finished** (often 10–20 minutes)
3. Do **not** download the IPA for normal flow — EAS Submit will use it

---

## Part F — Upload to App Store Connect (TestFlight)

### F1. Submit from terminal

```bash
cd /path/to/GearNet/mobile
npm run submit:ios
```

When prompted:

1. **Select a build** → choose the latest production iOS build (or it uses `--latest` behavior)
2. Apple login / API key:
   - Prefer: **App Store Connect API Key** → point to your `.p8`, paste Key ID + Issuer ID
   - Or: Apple ID + [app-specific password](https://appleid.apple.com) (Account → Sign-In and Security → App-Specific Passwords)
3. Confirm upload → wait for “submitted”

### F2. Wait for processing in App Store Connect

1. Open App Store Connect → **Apps** → **GearNet**
2. Top tab → **TestFlight**
3. Left → **iOS Builds**
4. When the build appears with a yellow clock, wait until it turns ready (10–30 min)
5. If Apple shows **Missing Compliance**:
   - Click the build → **Provide Export Compliance Information**
   - **Does your app use encryption?** → answer per your setup  
     GearNet sets `ITSAppUsesNonExemptEncryption = false` → usually **No** / standard HTTPS only → **Save**

### F3. Install on your iPhone (sanity check)

1. On iPhone: install **TestFlight** from the App Store
2. App Store Connect → TestFlight → **Internal Testing**
3. Click **+** create group if needed → add your Apple ID as tester
4. Enable the build for that group
5. Open the TestFlight email/invite on the phone → **Install** GearNet
6. Smoke-test: sign in, feed, garage, meet map permission, post photo, settings → delete account path visible

---

## Part G — Submit for App Review (go live queue)

### G1. Attach the build to the version

1. App Store Connect → **Apps** → **GearNet**
2. Tab **App Store**
3. Left → **1.0 Prepare for Submission**
4. Section **Build** → click **+** / **Add Build**
5. Select the processed TestFlight build → **Done**
6. Confirm screenshots, description, review notes, demo account are filled
7. Top right → **Add for Review** (or **Save** then **Add for Review**)

### G2. Final confirmation

1. Review the submission summary
2. Click **Submit to App Review**
3. Status becomes **Waiting for Review** → later **In Review** → **Pending Developer Release** or **Ready for Sale**

### G3. After approval

1. If you chose **Manually release this version**: open the version → **Release This Version**
2. If **Automatically release**: it goes live when approved
3. Check the public App Store listing on your phone

---

## Part H — If rejected

1. App Store Connect → app → **Resolution Center** (or email from App Review)
2. Read the guideline cite (e.g. 5.1.1 privacy, 1.2 UGC, 2.1 crash)
3. Fix code/metadata → bump via new EAS build (`npm run build:ios` auto-increments) → `npm run submit:ios` → attach new build → **Reply** + **Submit for Review** again

---

## Command cheat sheet

```bash
cd mobile
npx eas-cli login
npm run build:ios      # Part E
npm run submit:ios     # Part F
npx eas-cli build:list --platform ios --limit 5
```

One-shot build + submit (after credentials work):

```bash
npx eas-cli build --platform ios --profile production --auto-submit
```

---

## Already done in this repo

- Bundle ID `com.gearnet.app`
- EAS project + `build:ios` / `submit:ios` scripts
- Production API `https://gearnetapp.com`
- Account deletion in Settings
- Mic permission string + `expo-av`
- ATS arbitrary-loads removed for store builds
- Privacy/Terms live at gearnetapp.com
