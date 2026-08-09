import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { Card } from '../components/Card';
import { AdBanner } from '../components/AdBanner';
import { getCareerById } from '../data/careers';
import { maybeShowInterstitial } from '../services/adService';
import { useAssessment } from '../state/AssessmentContext';
import { AI_DISCLAIMER } from '../config';
import type { ScreenProps } from '../navigation/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text style={[typography.subheading, { color: colors.text, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

function Bullets({ items, tone }: { items: string[]; tone?: 'pro' | 'con' }) {
  const { colors } = useTheme();
  const marker = tone === 'pro' ? '✅' : tone === 'con' ? '⚠️' : '•';
  return (
    <>
      {items.map((item) => (
        <Text
          key={item}
          style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xs }]}
        >
          {marker}  {item}
        </Text>
      ))}
    </>
  );
}

export function CareerDetailScreen({ route, navigation }: ScreenProps<'CareerDetail'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { matches, aiAnalysis } = useAssessment();

  // Opening a career page is a natural transition — an interstitial may show
  // here, but only when the global cooldown (3 min) has elapsed.
  useEffect(() => {
    void maybeShowInterstitial();
  }, []);

  const career = getCareerById(route.params.careerId);

  if (!career) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[typography.heading, { color: colors.text }]}>Career not found</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[typography.body, { color: colors.primary, marginTop: spacing.md }]}>
            ← Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const match = matches.find((m) => m.careerId === career.id);
  const ai = aiAnalysis?.careers.find((c) => c.careerId === career.id);

  const infoRows: Array<[string, string]> = [
    ['Entry difficulty', `${career.entryDifficulty} — ${career.entryDifficultyNote}`],
    ['Career growth', career.careerGrowth],
    ['Work environment', career.workEnvironment],
    ['Remote work', career.remoteNote],
    ['International options', career.internationalNote],
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{career.emoji}</Text>
          <Text style={[typography.title, { color: colors.text, textAlign: 'center' }]}>
            {career.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {career.category}
          </Text>
          {match ? (
            <View style={[styles.scorePill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.subheading, { color: colors.primary }]}>
                {match.score}% compatibility
              </Text>
            </View>
          ) : null}
          <Text
            style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}
          >
            {career.description}
          </Text>
        </View>

        {ai || (match && match.localReasons.length > 0) ? (
          <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary }}>
            <Text style={[typography.subheading, { color: colors.primary }]}>💡 Why it matches you</Text>
            <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs }]}>
              {ai ? ai.whyItMatches : `${match!.localReasons.join('. ')}.`}
            </Text>
            {ai ? (
              <>
                <Text style={[typography.caption, styles.aiLabel, { color: colors.primary }]}>
                  POTENTIAL CHALLENGES
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  {ai.potentialChallenges}
                </Text>
              </>
            ) : null}
          </Card>
        ) : null}

        <Section title="🗂️ What people in this career do">
          <Bullets items={career.whatTheyDo} />
        </Section>

        <Section title="🛠️ Important skills">
          <Bullets items={ai ? [...career.importantSkills, ...ai.skillsToDevelop.filter((s) => !career.importantSkills.includes(s))] : career.importantSkills} />
        </Section>

        <Section title="🎓 Typical education path in India">
          {career.educationPath.map((step, i) => (
            <View key={step} style={styles.pathRow}>
              <View style={[styles.pathIndex, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[typography.body, styles.pathText, { color: colors.textSecondary }]}>
                {step}
              </Text>
            </View>
          ))}
        </Section>

        <Section title="ℹ️ At a glance">
          {infoRows.map(([label, value]) => (
            <View key={label} style={{ marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700' }]}>
                {label.toUpperCase()}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{value}</Text>
            </View>
          ))}
        </Section>

        <Section title="👍 Pros">
          <Bullets items={career.pros} tone="pro" />
        </Section>

        <Section title="👎 Cons">
          <Bullets items={career.cons} tone="con" />
        </Section>

        <Section title="🧪 Try before you commit">
          <Bullets items={career.tryBeforeCommit} />
        </Section>

        <Text style={[typography.caption, styles.disclaimer, { color: colors.textMuted }]}>
          {AI_DISCLAIMER}
        </Text>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  back: { fontSize: 26 },
  content: { paddingHorizontal: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  heroEmoji: { fontSize: 56, marginBottom: spacing.sm },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.md,
  },
  aiLabel: { fontWeight: '700', marginTop: spacing.md, marginBottom: 2 },
  pathRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  pathIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  pathText: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { textAlign: 'center', marginVertical: spacing.md },
});
