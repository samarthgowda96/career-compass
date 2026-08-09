import { AD_UNIT_IDS } from "../config";
import { isPremium } from "./premiumService";
import { track } from "./analyticsService";
import { requireAdsModule } from "./adsModule";

/**
 * AdMob wrapper.
 *
 * Design goals:
 *  - Every ad decision goes through this module, so disabling ads for premium
 *    users later is a one-line check (`adsEnabled()`), already in place.
 *  - `react-native-google-mobile-ads` is a NATIVE module: it works in
 *    development/EAS builds but is NOT present inside Expo Go. We load it
 *    lazily inside try/catch so the app still runs everywhere — ads simply
 *    stay off when the module is unavailable.
 *  - Test ad unit ids are used in development (see src/config.ts for where to
 *    put real ids).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdsModule = any;

let ads: AdsModule | null = null;
let initialized = false;

/**
 * True when running inside the Expo Go store client, which does not contain
 * the AdMob native module. We must not even require() the library there —
 * its import would log "RNGoogleMobileAdsModule could not be found" errors.
 */
function isExpoGo(): boolean {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const Constants = require("expo-constants").default;
		return Constants.executionEnvironment === "storeClient";
	} catch {
		return false;
	}
}

function loadAdsModule(): AdsModule | null {
	if (ads) return ads;
	if (isExpoGo()) return null;
	// Platform-split resolver: real module on iOS/Android dev builds, always
	// null on web (see adsModule.web.ts), so web bundles never include AdMob.
	ads = requireAdsModule();
	return ads;
}

/** Single switch consulted before any ad is loaded or shown. */
export function adsEnabled(): boolean {
	return !isPremium() && loadAdsModule() !== null;
}

export async function initializeAds(): Promise<void> {
	const module = loadAdsModule();
	if (!module || initialized) return;
	try {
		await module.default().initialize();
		initialized = true;
	} catch (e) {
		if (__DEV__) console.warn("[ads] initialization failed", e);
	}
}

/** Banner component + unit id, or null when ads are off (premium/Expo Go). */
export function getBanner(): {
	BannerAd: React.ComponentType<any>;
	sizes: any;
	unitId: string;
} | null {
	if (!adsEnabled()) return null;
	const module = loadAdsModule();
	if (!module?.BannerAd) return null;
	return {
		BannerAd: module.BannerAd,
		sizes: module.BannerAdSize,
		unitId: AD_UNIT_IDS.banner,
	};
}

/**
 * Shows an interstitial at a natural transition (after the questionnaire,
 * before results). Resolves once the ad closes — or immediately when ads are
 * disabled or the ad fails to load, so navigation is never blocked.
 */
export function showInterstitial(): Promise<void> {
	return new Promise((resolve) => {
		if (!adsEnabled()) return resolve();
		const module = loadAdsModule()!;
		try {
			const interstitial = module.InterstitialAd.createForAdRequest(
				AD_UNIT_IDS.interstitial,
				{
					requestNonPersonalizedAdsOnly: true,
				},
			);
			const timeout = setTimeout(() => resolve(), 6_000); // never block the user
			const unsubscribe = interstitial.addAdEventsListener(
				({ type }: { type: string }) => {
					if (type === module.AdEventType.LOADED) {
						clearTimeout(timeout);
						interstitial.show().catch(() => resolve());
					}
					if (
						type === module.AdEventType.CLOSED ||
						type === module.AdEventType.ERROR
					) {
						clearTimeout(timeout);
						unsubscribe();
						resolve();
					}
				},
			);
			interstitial.load();
		} catch {
			resolve();
		}
	});
}

// ---------------------------------------------------------------------------
// Time-gated interstitials
// ---------------------------------------------------------------------------
// AdMob policy forbids interstitials that interrupt users unexpectedly, so we
// never fire ads on a raw timer. Instead, screens call maybeShowInterstitial()
// at natural transition points, and the cooldown decides whether enough time
// has passed for another ad. Tune INTERSTITIAL_COOLDOWN_MS to change how
// often ads can appear.
const INTERSTITIAL_COOLDOWN_MS = 3 * 60_00; // at most one interstitial per 3 min

let lastInterstitialAt = 0;

/**
 * Shows an interstitial only if the cooldown has elapsed since the last one.
 * Safe to call from any natural transition (screen change, task completed) —
 * it resolves immediately when it's too soon, ads are off, or loading fails.
 * Returns true when an ad attempt was actually made.
 */
export async function maybeShowInterstitial(
	minIntervalMs: number = INTERSTITIAL_COOLDOWN_MS,
): Promise<boolean> {
	if (!adsEnabled()) return false;
	const now = Date.now();
	if (now - lastInterstitialAt < minIntervalMs) return false;
	lastInterstitialAt = now;
	await showInterstitial();
	return true;
}

/**
 * Shows a rewarded ad. Resolves `true` only when the user actually earned the
 * reward (watched the ad), `false` otherwise — the caller unlocks extra
 * matches only on `true`.
 */
export function showRewardedAd(): Promise<boolean> {
	return new Promise((resolve) => {
		if (!adsEnabled()) {
			// No ad system available (Expo Go / premium): grant the unlock so the
			// feature remains testable. Real builds always show the ad.
			return resolve(true);
		}
		const module = loadAdsModule()!;
		try {
			track("rewarded_ad_started");
			const rewarded = module.RewardedAd.createForAdRequest(
				AD_UNIT_IDS.rewarded,
				{
					requestNonPersonalizedAdsOnly: true,
				},
			);
			let earned = false;
			const timeout = setTimeout(() => resolve(false), 15_000);
			const unsubscribe = rewarded.addAdEventsListener(
				({ type }: { type: string }) => {
					if (type === module.AdEventType.LOADED) {
						clearTimeout(timeout);
						rewarded.show().catch(() => resolve(false));
					}
					if (type === module.RewardedAdEventType.EARNED_REWARD) {
						earned = true;
						track("rewarded_ad_completed");
					}
					if (
						type === module.AdEventType.CLOSED ||
						type === module.AdEventType.ERROR
					) {
						clearTimeout(timeout);
						unsubscribe();
						resolve(earned);
					}
				},
			);
			rewarded.load();
		} catch {
			resolve(false);
		}
	});
}
