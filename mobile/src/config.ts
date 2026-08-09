import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Central app configuration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  DEVELOPER TODOs — everything you must fill in before release lives here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// AI backend
// ---------------------------------------------------------------------------
// The mobile app NEVER talks to the AI provider directly and NEVER holds an
// AI API key. It calls your own backend (see the /server folder), which keeps
// the key in a server-side environment variable.
//
// TODO(developer): point this at your deployed backend, e.g.
//   https://career-compass-api.yourdomain.com
// While developing, run `npm run dev` inside /server. The dev URL below is
// resolved automatically: on a physical phone (Expo Go / dev build) we reuse
// the Metro bundler's host — your computer's LAN IP — so no manual setup is
// needed; emulators fall back to their loopback conventions.
function devBackendUrl(): string {
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (metroHost) return `http://${metroHost}:3000`;
  return Platform.select({
    android: 'http://10.0.2.2:3000', // Android emulator → host machine
    default: 'http://localhost:3000',
  })!;
}

export const AI_BACKEND_URL = __DEV__
  ? devBackendUrl()
  : Platform.OS === 'web'
    ? '' // web is served by the backend itself → same-origin /api calls
    : 'https://YOUR-DEPLOYED-BACKEND.example.com'; // TODO(developer): replace before release

/** How long to wait for AI analysis before falling back to local results. */
export const AI_REQUEST_TIMEOUT_MS = 45_000;

// ---------------------------------------------------------------------------
// AdMob
// ---------------------------------------------------------------------------
// The values below are GOOGLE'S OFFICIAL TEST AD UNIT IDS — safe to use in
// development, and they never earn money. Before release:
//
//   1. Create an AdMob account at https://admob.google.com
//   2. Register your Android and iOS apps to get App IDs
//      (ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY) and put them in app.json under
//      the "react-native-google-mobile-ads" plugin config.
//   3. Create three ad units per platform (banner, interstitial, rewarded)
//      and paste their ids below, replacing the test ids.
//
// TODO(developer): replace TEST ids with your real ad unit ids for release.
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';

export const AD_UNIT_IDS = {
  banner: Platform.select({ ios: TEST_BANNER_IOS, default: TEST_BANNER })!,
  interstitial: Platform.select({ ios: TEST_INTERSTITIAL_IOS, default: TEST_INTERSTITIAL })!,
  rewarded: Platform.select({ ios: TEST_REWARDED_IOS, default: TEST_REWARDED })!,
};

// ---------------------------------------------------------------------------
// Product copy
// ---------------------------------------------------------------------------
export const APP_NAME = 'Career Compass India';
export const DISCLAIMER =
  'This assessment provides guidance, not a guaranteed prediction of your future career.';
export const AI_DISCLAIMER =
  'AI-generated recommendations are guidance for exploration and should not be treated as professional career counselling.';
