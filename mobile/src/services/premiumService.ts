import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Premium/subscription scaffolding.
 *
 * The MVP has no payments. This module is the single gate every premium
 * check goes through, so adding purchases later (RevenueCat, react-native-iap,
 * Play Billing / StoreKit) only means changing `refreshEntitlement()` to read
 * from the store instead of local storage.
 *
 * Planned premium features (already gated through here where relevant):
 *  - No ads (adService consults isPremium())
 *  - Top 10 matches without watching a rewarded ad
 *  - Full career report / personalised roadmap / skill-gap analysis
 *  - Saving previous assessments
 */

const PREMIUM_KEY = '@career_compass/premium';

let cachedPremium = false;

export async function loadPremiumStatus(): Promise<boolean> {
  try {
    cachedPremium = (await AsyncStorage.getItem(PREMIUM_KEY)) === 'true';
  } catch {
    cachedPremium = false;
  }
  return cachedPremium;
}

/** Synchronous check for hot paths (ads). Call loadPremiumStatus() at boot. */
export function isPremium(): boolean {
  return cachedPremium;
}

/**
 * TODO(developer): when payments are added, call this after a verified
 * purchase/restore instead of exposing it in the UI.
 */
export async function setPremium(value: boolean): Promise<void> {
  cachedPremium = value;
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
  } catch {
    // Non-fatal: premium simply won't persist across restarts.
  }
}
