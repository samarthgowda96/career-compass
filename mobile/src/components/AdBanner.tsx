import React from 'react';
import { View } from 'react-native';
import { getBanner } from '../services/adService';

/**
 * Small bottom banner. Renders nothing when ads are disabled (premium users)
 * or unavailable (Expo Go, where the native AdMob module doesn't exist).
 */
export function AdBanner() {
  const banner = getBanner();
  if (!banner) return null;

  const { BannerAd, sizes, unitId } = banner;
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={unitId}
        size={sizes.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
