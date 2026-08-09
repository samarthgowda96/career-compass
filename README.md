# 🧭 Career Compass India

An AI-assisted career exploration app for Indian students and young adults.
Answer 15 simple questions (3–5 minutes), get compatibility-scored career
matches from a database of 35 Indian career paths, and read a personalised
AI analysis — all anonymously, with no account or personal information.

> **Positioning:** the app provides *guidance for exploration*, not a
> scientific prediction of anyone's "perfect career". That framing is baked
> into the UI copy, the AI prompt, and the Terms screen.

## Project structure

```
career-compass/
├── mobile/                  # Expo (React Native) app — iOS & Android
│   ├── App.tsx              # Navigation + providers
│   └── src/
│       ├── config.ts        # ⚙️ All developer TODOs: backend URL, ad unit ids
│       ├── types.ts         # Shared contracts (answers, careers, AI analysis)
│       ├── data/
│       │   ├── questions.ts # The 15-question assessment (data only)
│       │   └── careers.ts   # 35-career database (easy to extend)
│       ├── matching/        # Deterministic scoring: answers → 0–100 per career
│       ├── services/        # aiService, adService, premiumService, analytics
│       ├── state/           # Assessment context (answers, matches, AI status)
│       ├── components/      # Buttons, cards, progress bar, ad banner…
│       ├── screens/         # Home → Questionnaire → Analysis → Results → Detail
│       └── theme/           # Light/dark design tokens
└── server/                  # AI backend (Express + free Gemini API)
    └── src/
        ├── server.ts        # POST /api/analyze, GET /health
        ├── gemini.ts        # The ONLY file that talks to the AI provider
        ├── prompt.ts        # System prompt + JSON output schema
        └── types.ts         # Request validation + response types
```

**Separation of concerns:** UI, questionnaire data, career database, matching
algorithm, AI service, ad service, and premium scaffolding are all independent
modules. Adding a career = appending one entry to `careers.ts`. Swapping the
AI provider = replacing `gemini.ts`. Disabling ads for premium = already wired
through `premiumService.isPremium()`.

---

## 1. Running locally

### Prerequisites
- Node.js 20.19+ (required by Expo SDK 54)
- npm
- The Expo Go app on your phone, or an Android emulator / iOS simulator

### Start the AI backend (free — no credit card)

```bash
cd server
npm install
cp .env.example .env
# Edit .env and paste your FREE Gemini API key (see section 3)
npm run dev            # → http://localhost:3000
```

Verify: `curl http://localhost:3000/health` → `{"ok":true,"aiConfigured":true}`

### Start the mobile app

```bash
cd mobile
npm install
npm start              # scan the QR code with Expo Go
```

**Reaching the backend from a device:** automatic in development. Physical
phones reuse the Metro bundler's host (your computer's LAN IP), the Android
emulator uses `10.0.2.2`, and the iOS simulator uses `localhost` — phone and
computer just need to be on the same Wi-Fi, with the server running.

> **The app works even when the AI backend is down** — results fall back to
> the questionnaire-based matches with a notice that detailed AI analysis is
> temporarily unavailable, plus a Retry button.

> **Ads in Expo Go:** `react-native-google-mobile-ads` is a native module and
> is not part of Expo Go, so ads are silently disabled there (the app detects
> this and keeps working; the rewarded unlock auto-grants so you can test the
> flow). To see real test ads, make a development build:
> `npx expo run:android` / `npx expo run:ios` (or EAS `npx eas build --profile development`).

---

## 2. AdMob setup

During development the app uses **Google's official test ad ids** everywhere —
safe, and they never earn revenue. Before release:

1. Create an AdMob account at https://admob.google.com (free).
2. **Apps → Add app** — register your Android app and iOS app. Each gets an
   **App ID** that looks like `ca-app-pub-1234567890123456~1234567890`.
3. Put the App IDs in `mobile/app.json` under the
   `react-native-google-mobile-ads` plugin (replacing the sample test App IDs):
   ```json
   ["react-native-google-mobile-ads", {
     "androidAppId": "ca-app-pub-XXXX~AAAA",
     "iosAppId": "ca-app-pub-XXXX~BBBB"
   }]
   ```
4. For each platform create three **ad units** (they look like
   `ca-app-pub-XXXX/CCCC`):
   - Banner (shown on Home, Results, Career Detail)
   - Interstitial (shown once, after the questionnaire, before results)
   - Rewarded ("watch to unlock 5 more matches")
5. Paste the ad unit ids into `mobile/src/config.ts` (`AD_UNIT_IDS`), replacing
   the test ids — the TODO comments mark exactly where.
6. Rebuild the app (`npx expo prebuild --clean` if you use bare workflows, or a
   fresh EAS/development build) since App IDs are baked in natively.

Ad policy choices already implemented: no ads between questions, interstitial
only at the questionnaire→results transition, rewarded unlock only granted on
`EARNED_REWARD`, and every ad call is skipped for premium users.

---

## 3. AI backend configuration (free Gemini API)

The app never talks to the AI provider directly and **no AI key ever ships in
the mobile app**. The tiny Express server in `/server` holds the key in an
environment variable.

1. Get a **free** Gemini API key: https://aistudio.google.com/apikey
   (Google account required, no credit card).
2. `cd server && cp .env.example .env` and set:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Optional: set `GEMINI_MODEL` (default `gemini-flash-latest`, Google's
   rolling alias for the current Flash model; `gemini-flash-lite-latest` is
   faster with higher free-tier limits) and `PORT`.
4. Deploy anywhere Node 22 runs (Render, Railway, Fly.io, a VPS…). Set the
   env vars in the host's dashboard — never commit `.env`. Then point
   `AI_BACKEND_URL` in `mobile/src/config.ts` at the deployed URL.

**Free-tier note:** Gemini's free tier is rate-limited per model (requests per
minute/day). The server maps provider rate limits to HTTP 429 and the app
falls back gracefully, so hitting the limit never breaks the experience.

**Swapping providers later:** implement `generateAnalysis()` in a new adapter
(e.g. `claude.ts`, `groq.ts`) and change one import in `server.ts`. The prompt
and schema in `prompt.ts` are provider-agnostic.

---

## 4. Web app

The same codebase compiles to a web app (`react-native-web`). The Express
server doubles as the web host: if `server/public` exists, it serves the site
and the API from one origin (the web build calls `/api` same-origin, so no
extra configuration is needed).

```bash
cd mobile
npm run build:web     # exports the web build and copies it to server/public
cd ../server
npm run dev           # → http://localhost:3000 now serves the web app + API
```

To put it online, deploy **only the server** (see the backend deployment
steps above) after running `build:web` — one Render/Fly/Railway service gives
you the website and the AI API together. Ads are native-only and automatically
disabled on web (`src/services/adsModule.web.ts`).

## 5. How matching works (no AI involved)

`mobile/src/matching/` converts answers into a 0–10 user profile across 16
attributes (analytical, technical, creative, biology, business, …,
salary/stability/remote/international priorities), then scores every career:

- **70% interest fit** — weighted similarity between the user's interests and
  the career's attribute vector (strong opinions count more than neutral ones)
- **22% priority fit** — does the career offer what the user says matters
  (earning potential, security, remote work, international mobility)
- **8% practical fit** — preferred work environment + willingness to study vs.
  the career's education length

The AI is only asked to *explain* the top matches, never to pick careers —
so results are deterministic, fast, and available offline.

## 5. Privacy

- No account, no name/phone/address/ID/financial data — the assessment is
  fully anonymous (see the in-app Privacy Policy and Terms screens).
- Only the questionnaire answers + top match names are sent to the backend
  for analysis; analytics events carry no personal information.

## 6. Premium (future)

`mobile/src/services/premiumService.ts` is the single gate for premium checks.
Ads already consult it; the rewarded unlock and future features (top-10
matches, full report, saved assessments) route through it. Adding payments
later = implementing the entitlement refresh with RevenueCat/react-native-iap
and calling `setPremium(true)` after a verified purchase.

## 7. Adding careers

Append an entry to `mobile/src/data/careers.ts` following the `Career` type —
the matching algorithm, results list and detail screen pick it up
automatically. Calibrate the 16 attribute values (0–10) against similar
existing careers.
