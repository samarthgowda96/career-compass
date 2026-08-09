/**
 * Web builds: the AdMob native module does not exist in browsers, so ads are
 * always off. Web monetisation (e.g. Google AdSense) would be a separate
 * integration — adService treats a null module as "ads disabled" everywhere.
 */
export function requireAdsModule(): null {
	return null;
}
