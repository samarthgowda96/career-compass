import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, useTheme } from '../theme';
import { APP_NAME } from '../config';
import type { ScreenProps } from '../navigation/types';

/** Simple, honest legal screens for the anonymous MVP. */

function LegalLayout({
  title,
  sections,
  onBack,
}: {
  title: string;
  sections: Array<{ heading: string; body: string }>;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.primary }]}>←</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.title, { color: colors.text, marginBottom: spacing.lg }]}>
          {title}
        </Text>
        {sections.map((section) => (
          <View key={section.heading} style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.subheading, { color: colors.text, marginBottom: spacing.xs }]}>
              {section.heading}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function PrivacyPolicyScreen({ navigation }: ScreenProps<'Privacy'>) {
  return (
    <LegalLayout
      onBack={() => navigation.goBack()}
      title="Privacy Policy"
      sections={[
        {
          heading: 'No account, no identity',
          body: `${APP_NAME} works completely anonymously. You do not need to create an account, and we never ask for your name, phone number, address, government ID, or financial information.`,
        },
        {
          heading: 'What we process',
          body: 'Your questionnaire answers are used on your device to calculate career matches. To generate the optional AI analysis, your answers and top matches (nothing else) are sent to our server, which forwards them to an AI provider. They are not linked to your identity.',
        },
        {
          heading: 'Analytics',
          body: 'We record anonymous usage events (such as "assessment completed") to understand how the app is used and improve it. These events contain no personal information.',
        },
        {
          heading: 'Advertising',
          body: 'The free version shows ads served by Google AdMob. AdMob may process device information to serve and measure ads, as described in Google\'s privacy policy. Ads are requested in non-personalised mode.',
        },
        {
          heading: 'Data retention',
          body: 'Your answers live only in the app\'s memory during a session. Closing the app discards the assessment. We do not maintain user profiles on our servers.',
        },
        {
          heading: 'Contact',
          body: 'Questions about privacy? Contact the developer at the email address listed on the app store page.',
        },
      ]}
    />
  );
}

export function TermsScreen({ navigation }: ScreenProps<'Terms'>) {
  return (
    <LegalLayout
      onBack={() => navigation.goBack()}
      title="Terms of Use"
      sections={[
        {
          heading: 'Guidance, not advice',
          body: `${APP_NAME} is an AI-assisted career exploration tool. The compatibility scores and AI-generated explanations are guidance to help you explore options — they are not professional career counselling, and they cannot scientifically determine a "perfect career" for anyone.`,
        },
        {
          heading: 'No guarantees',
          body: 'Career outcomes depend on many factors beyond a questionnaire — effort, opportunity, economic conditions and more. We make no promises about admission, employment, or earnings in any field.',
        },
        {
          heading: 'Do your own research',
          body: 'Before making education or career decisions, verify details (eligibility, entrance exams, costs, job prospects) from official sources, and consider speaking with a qualified career counsellor, teachers, and professionals working in the field.',
        },
        {
          heading: 'AI limitations',
          body: 'AI-generated content can be incomplete or inaccurate. The app never makes psychological or medical assessments, and its output should not be treated as any form of diagnosis.',
        },
        {
          heading: 'Acceptable use',
          body: 'The app is provided as-is for personal, non-commercial use. Do not attempt to misuse, reverse engineer, or disrupt the service.',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  back: { fontSize: 26 },
  content: { paddingHorizontal: spacing.lg },
});
