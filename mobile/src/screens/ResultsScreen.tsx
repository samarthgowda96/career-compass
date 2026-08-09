import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { AdBanner } from '../components/AdBanner';
import { useAssessment } from '../state/AssessmentContext';
import { track } from '../services/analyticsService';
import { showRewardedAd } from '../services/adService';
import { TOP_MATCHES_FREE, TOP_MATCHES_UNLOCKED } from '../matching/match';
import { AI_DISCLAIMER, DISCLAIMER } from '../config';
import type { CareerMatch } from '../types';
import type { ScreenProps } from '../navigation/types';

const RANK_BADGES = ['🥇', '🥈', '🥉'];

export function ResultsScreen({ navigation }: ScreenProps<'Results'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    matches,
    aiAnalysis,
    aiStatus,
    retryAiAnalysis,
    extraMatchesUnlocked,
    unlockExtraMatches,
    resetAssessment,
  } = useAssessment();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    track('results_viewed');
  }, []);

  // Empty/failure state: no matches means the user landed here without
  // completing an assessment (e.g. after a reload).
  if (matches.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>🧭</Text>
        <Text style={[typography.heading, { color: colors.text, textAlign: 'center' }]}>
          No results yet
        </Text>
        <Text style={[typography.body, styles.emptyText, { color: colors.textSecondary }]}>
          Take the short assessment to discover careers that match you.
        </Text>
        <PrimaryButton
          label="Start Career Assessment"
          onPress={() => {
            resetAssessment();
            navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'Questionnaire' }] });
          }}
          style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
        />
      </View>
    );
  }

  const visibleCount = extraMatchesUnlocked ? TOP_MATCHES_UNLOCKED : TOP_MATCHES_FREE;
  const visibleMatches = matches.slice(0, visibleCount);

  const aiExplanationFor = (careerId: string) =>
    aiAnalysis?.careers.find((c) => c.careerId === careerId);

  const blurbFor = (match: CareerMatch): string => {
    const ai = aiExplanationFor(match.careerId);
    if (ai) return ai.whyItMatches;
    if (match.localReasons.length > 0) return `${match.localReasons.join('. ')}.`;
    return `${match.career.name} aligns with several of your answers — explore it to learn more.`;
  };

  const onUnlockExtra = async () => {
    setUnlocking(true);
    const earned = await showRewardedAd();
    setUnlocking(false);
    if (earned) unlockExtraMatches();
  };

  const openCareer = (careerId: string) => {
    track('career_opened', { career: careerId });
    navigation.navigate('CareerDetail', { careerId });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.title, { color: colors.text }]}>Your Career Matches</Text>
        <Text style={[typography.caption, styles.subtitle, { color: colors.textMuted }]}>
          Compatibility scores are guidance for exploration — not a prediction.
        </Text>

        {/* ---- AI analysis status / summary ---------------------------------- */}
        {aiStatus === 'loading' ? (
          <Card>
            <View style={styles.aiLoadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>
                Your detailed AI analysis is still being prepared…
              </Text>
            </View>
          </Card>
        ) : null}

        {aiStatus === 'error' ? (
          <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warning }}>
            <Text style={[typography.subheading, { color: colors.warning }]}>
              Detailed AI analysis is temporarily unavailable
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              No problem — your matches below are based on your questionnaire answers. You can
              retry the AI analysis anytime.
            </Text>
            <PrimaryButton
              label="Retry AI analysis"
              variant="secondary"
              onPress={retryAiAnalysis}
              style={{ marginTop: spacing.md, minHeight: 44 }}
            />
          </Card>
        ) : null}

        {aiAnalysis ? (
          <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary }}>
            <Text style={[typography.subheading, { color: colors.primary }]}>
              ✨ Your work-style profile
            </Text>
            <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs }]}>
              {aiAnalysis.profileSummary}
            </Text>
          </Card>
        ) : null}

        {/* ---- Match cards ---------------------------------------------------- */}
        {visibleMatches.map((match, i) => {
          const ai = aiExplanationFor(match.careerId);
          const expanded = expandedId === match.careerId;
          const emphasized = i === 0;
          return (
            <Card key={match.careerId} emphasized={emphasized}>
              {emphasized ? (
                <View style={[styles.topPick, { backgroundColor: colors.primary }]}>
                  <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>
                    TOP MATCH
                  </Text>
                </View>
              ) : null}
              <View style={styles.matchHeader}>
                <Text style={styles.rank}>{RANK_BADGES[i] ?? `${i + 1}.`}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subheading, { color: colors.text }]}>
                    {match.career.emoji} {match.career.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {match.career.category}
                  </Text>
                </View>
                <View style={[styles.scoreBubble, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.scoreText, { color: colors.primary }]}>{match.score}%</Text>
                  <Text style={[styles.scoreLabel, { color: colors.primary }]}>match</Text>
                </View>
              </View>

              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                “{blurbFor(match)}”
              </Text>

              {expanded ? (
                <View style={[styles.whyBox, { backgroundColor: colors.surfaceAlt }]}>
                  {ai ? (
                    <>
                      <Text style={[typography.caption, styles.whyLabel, { color: colors.textMuted }]}>
                        POTENTIAL CHALLENGES
                      </Text>
                      <Text style={[typography.body, { color: colors.textSecondary }]}>
                        {ai.potentialChallenges}
                      </Text>
                      {ai.skillsToDevelop.length > 0 ? (
                        <>
                          <Text
                            style={[typography.caption, styles.whyLabel, { color: colors.textMuted }]}
                          >
                            SKILLS TO DEVELOP
                          </Text>
                          {ai.skillsToDevelop.map((skill) => (
                            <Text key={skill} style={[typography.body, { color: colors.textSecondary }]}>
                              •  {skill}
                            </Text>
                          ))}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {match.localReasons.map((reason) => (
                        <Text key={reason} style={[typography.body, { color: colors.textSecondary }]}>
                          •  {reason}
                        </Text>
                      ))}
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
                        Retry the AI analysis above for a personalised explanation.
                      </Text>
                    </>
                  )}
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => setExpandedId(expanded ? null : match.careerId)}
                  style={[styles.secondaryAction, { borderColor: colors.border }]}
                >
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                    {expanded ? 'Hide details' : 'Why this matches me'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => openCareer(match.careerId)}
                  style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                >
                  <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '700' }]}>
                    Explore career →
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        })}

        {/* ---- Rewarded unlock ------------------------------------------------ */}
        {!extraMatchesUnlocked ? (
          <Card style={{ borderStyle: 'dashed' }}>
            <Text style={[typography.subheading, { color: colors.text }]}>
              🔓 Want more options?
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Watch a short ad to unlock 5 more career matches.
            </Text>
            <PrimaryButton
              label="Watch ad to unlock"
              variant="secondary"
              loading={unlocking}
              onPress={() => void onUnlockExtra()}
              style={{ marginTop: spacing.md, minHeight: 48 }}
            />
          </Card>
        ) : null}

        {/* ---- AI next steps -------------------------------------------------- */}
        {aiAnalysis ? (
          <Card>
            <Text style={[typography.subheading, { color: colors.text }]}>🎓 Suggested education path</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {aiAnalysis.suggestedEducationPath}
            </Text>
            <Text style={[typography.subheading, { color: colors.text, marginTop: spacing.md }]}>
              ✅ Suggested next steps
            </Text>
            {aiAnalysis.nextSteps.map((step, i) => (
              <Text
                key={step}
                style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}
              >
                {i + 1}. {step}
              </Text>
            ))}
          </Card>
        ) : null}

        <PrimaryButton
          label="Retake assessment"
          variant="ghost"
          onPress={() => {
            resetAssessment();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />

        <Text style={[typography.caption, styles.footerNote, { color: colors.textMuted }]}>
          {DISCLAIMER} {AI_DISCLAIMER}
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
  content: { padding: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.md },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  topPick: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  matchHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { fontSize: 26, width: 34, textAlign: 'center' },
  scoreBubble: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  scoreText: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  whyBox: { borderRadius: 12, padding: spacing.md, marginTop: spacing.sm },
  whyLabel: { fontWeight: '700', marginTop: spacing.sm, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryAction: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyText: { textAlign: 'center', marginTop: spacing.sm },
  footerNote: { textAlign: 'center', marginTop: spacing.md },
});
