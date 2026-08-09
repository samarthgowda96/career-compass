import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

/** 1–5 importance picker with large targets. */
export function ScalePicker({ value, onChange, minLabel, maxLabel }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(n)}
              style={({ pressed }) => [
                styles.dot,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.dotText,
                  { color: selected ? colors.onPrimary : colors.text },
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{minLabel}</Text>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{maxLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  dot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 20, fontWeight: '700' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  labelText: { fontSize: 13 },
});
