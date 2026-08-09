import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { useAssessment } from '../state/AssessmentContext';
import type { ScreenProps } from '../navigation/types';

const STEPS = [
  'Reading your answers…',
  'Comparing 35+ career paths…',
  'Scoring your compatibility…',
  'Preparing your personalised analysis…',
];

/** Max time we wait for the AI before showing results with local matches. */
const MAX_WAIT_MS = 45_000;
/** Minimum time on this screen so the transition doesn't flash. */
const MIN_WAIT_MS = 2_600;

/**
 * Transitional screen shown while the AI analysis request is in flight.
 * Matches are already computed locally, so the user is never stuck here:
 * we proceed on success, on error, or after a timeout.
 */
export function AnalysisScreen({ navigation }: ScreenProps<'Analysis'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { aiStatus } = useAssessment();
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [maxTimePassed, setMaxTimePassed] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stepTimer = setInterval(
      () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)),
      1_600,
    );
    const minTimer = setTimeout(() => setMinTimePassed(true), MIN_WAIT_MS);
    const maxTimer = setTimeout(() => setMaxTimePassed(true), MAX_WAIT_MS);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    return () => {
      clearInterval(stepTimer);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [pulse]);

  useEffect(() => {
    const aiSettled = aiStatus === 'success' || aiStatus === 'error';
    if ((aiSettled && minTimePassed) || maxTimePassed) {
      navigation.replace('Results');
    }
  }, [aiStatus, minTimePassed, maxTimePassed, navigation]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.compass,
          {
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
            ],
          },
        ]}
      >
        🧭
      </Animated.Text>
      <Text style={[typography.heading, styles.title, { color: colors.text }]}>
        Analysing your responses
      </Text>
      <Text style={[typography.body, styles.step, { color: colors.textSecondary }]}>
        {STEPS[stepIndex]}
      </Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  compass: { fontSize: 72, marginBottom: spacing.lg },
  title: { marginBottom: spacing.sm, textAlign: 'center' },
  step: { textAlign: 'center' },
});
