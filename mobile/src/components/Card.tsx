import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  emphasized?: boolean;
}

export function Card({ children, style, emphasized }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: emphasized ? colors.primary : colors.border,
          borderWidth: emphasized ? 2 : 1,
          shadowOpacity: isDark ? 0 : emphasized ? 0.12 : 0.05,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#1B1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 2,
  },
});
