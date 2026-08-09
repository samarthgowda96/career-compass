import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { AdBanner } from '../components/AdBanner';
import { useAssessment } from '../state/AssessmentContext';
import { track } from '../services/analyticsService';
import { DISCLAIMER } from '../config';
import type { ScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { resetAssessment } = useAssessment();

  useEffect(() => {
    track('app_open');
  }, []);

  const startAssessment = () => {
    resetAssessment();
    track('assessment_started');
    navigation.navigate('Questionnaire');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.logo}>🧭</Text>
          <Text style={[typography.title, styles.title, { color: colors.text }]}>
            Find the Career That's Right for You
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
            Answer a few simple questions and discover careers that match your interests,
            strengths, personality, and goals.
          </Text>
        </View>

        <View style={styles.badges}>
          {['🇮🇳 Made for India', '⏱️ 3–5 minutes', '🔒 No sign-up needed'].map((badge) => (
            <View key={badge} style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{badge}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton label="Start Career Assessment" onPress={startAssessment} />

        <Text style={[typography.caption, styles.disclaimer, { color: colors.textMuted }]}>
          {DISCLAIMER}
        </Text>

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate('Privacy')} hitSlop={8}>
            <Text style={[typography.caption, { color: colors.primary }]}>Privacy Policy</Text>
          </Pressable>
          <Text style={[typography.caption, { color: colors.textMuted }]}>  ·  </Text>
          <Pressable onPress={() => navigation.navigate('Terms')} hitSlop={8}>
            <Text style={[typography.caption, { color: colors.primary }]}>Terms of Use</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 64, marginBottom: spacing.md },
  title: { textAlign: 'center', marginBottom: spacing.md },
  subtitle: { textAlign: 'center', paddingHorizontal: spacing.sm },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  disclaimer: { textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.md },
  links: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
