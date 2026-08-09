import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../theme';

interface Props {
  /** 0–1 */
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  const { colors } = useTheme();
  const animated = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress, animated]);

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            width: animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
