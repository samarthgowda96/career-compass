/**
 * Resolves the AdMob library on native platforms (iOS/Android).
 *
 * This file has a `.web.ts` sibling that always returns null — Metro picks
 * that one for web builds, so `react-native-google-mobile-ads` (a native-only
 * package) is never bundled into the web app.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireAdsModule(): any {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require("react-native-google-mobile-ads");
	} catch {
		return null;
	}
}
