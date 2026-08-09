import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { OptionButton } from '../components/OptionButton';
import { ScalePicker } from '../components/ScalePicker';
import { ProgressBar } from '../components/ProgressBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { QUESTIONS, TOTAL_QUESTIONS } from '../data/questions';
import { useAssessment } from '../state/AssessmentContext';
import { track } from '../services/analyticsService';
import { maybeShowInterstitial } from '../services/adService';
import type { ScreenProps } from '../navigation/types';

/**
 * One question per screen with a progress indicator. Users can go back and
 * change answers at any time. Single-choice questions auto-advance; multi
 * and scale questions use a Continue button.
 */
export function QuestionnaireScreen({ navigation }: ScreenProps<'Questionnaire'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { answers, setAnswer, finalizeAssessment } = useAssessment();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const question = QUESTIONS[index];
  const selected = answers[question.id] ?? [];
  const isLast = index === TOTAL_QUESTIONS - 1;

  const goNext = async () => {
    track('question_completed', { question: question.id, index: index + 1 });
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    // Assessment finished: compute matches + start AI analysis, show one
    // interstitial at this natural break, then move to the analysis screen.
    setFinishing(true);
    track('assessment_completed');
    finalizeAssessment();
    // Interval 0: always show at this transition, and start the cooldown so
    // other placements don't fire another ad right after.
    await maybeShowInterstitial(0);
    setFinishing(false);
    navigation.replace('Analysis');
  };

  const goBack = () => {
    if (index === 0) {
      navigation.goBack();
    } else {
      setIndex((i) => i - 1);
    }
  };

  const onSelectSingle = (optionId: string) => {
    setAnswer(question.id, [optionId]);
    // Auto-advance shortly after selection for a smooth flow.
    setTimeout(() => void goNext(), 180);
  };

  const onToggleMulti = (optionId: string) => {
    const exists = selected.includes(optionId);
    let next = exists ? selected.filter((id) => id !== optionId) : [...selected, optionId];
    if (question.maxSelections && next.length > question.maxSelections) {
      next = next.slice(next.length - question.maxSelections);
    }
    setAnswer(question.id, next);
  };

  const canContinue =
    question.type === 'scale' ? selected.length > 0 : selected.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Question {index + 1} of {TOTAL_QUESTIONS}
        </Text>
        <View style={styles.back} />
      </View>

      <View style={styles.progress}>
        <ProgressBar progress={(index + 1) / TOTAL_QUESTIONS} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.heading, styles.title, { color: colors.text }]}>
          {question.title}
        </Text>
        {question.subtitle ? (
          <Text style={[typography.caption, styles.subtitle, { color: colors.textMuted }]}>
            {question.subtitle}
          </Text>
        ) : null}

        {question.type === 'scale' ? (
          <ScalePicker
            value={selected.length > 0 ? Number(selected[0]) : null}
            onChange={(n) => setAnswer(question.id, [String(n)])}
            minLabel={question.scaleMinLabel}
            maxLabel={question.scaleMaxLabel}
          />
        ) : (
          question.options.map((option) => (
            <OptionButton
              key={option.id}
              label={option.label}
              emoji={option.emoji}
              multi={question.type === 'multi'}
              selected={selected.includes(option.id)}
              onPress={() =>
                question.type === 'multi' ? onToggleMulti(option.id) : onSelectSingle(option.id)
              }
            />
          ))
        )}

        {question.type !== 'single' ? (
          <PrimaryButton
            label={isLast ? 'See My Results' : 'Continue'}
            onPress={() => void goNext()}
            disabled={!canContinue}
            loading={finishing}
            style={{ marginTop: spacing.md }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  back: { fontSize: 26, width: 32, textAlign: 'center' },
  progress: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  content: { paddingHorizontal: spacing.lg },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.md },
});
