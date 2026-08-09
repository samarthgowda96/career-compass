import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface Props {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}

/** Large tappable answer option — the core control of the questionnaire. */
export function OptionButton({ label, emoji, selected, onPress, multi }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        style={[
          styles.label,
          { color: selected ? colors.primary : colors.text, fontWeight: selected ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
      {multi ? (
        <View
          style={[
            styles.check,
            {
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : 'transparent',
            },
          ]}
        >
          {selected ? <Text style={[styles.checkMark, { color: colors.onPrimary }]}>✓</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    minHeight: 56,
  },
  emoji: { fontSize: 20, marginRight: spacing.sm + 4 },
  label: { fontSize: 16, flex: 1, lineHeight: 21 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  checkMark: { fontSize: 13, fontWeight: '800' },
});
