import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, touchTarget, typography } from '../theme/tokens';
import { pressScale } from '../animations/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', accessibilityLabel, testID }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={({ pressed }) => [
        base.container,
        styles.container,
        pressed ? { transform: [{ scale: pressScale }] } : null,
      ]}
    >
      <Text style={[base.label, styles.label]}>{title}</Text>
    </Pressable>
  );
}

const base = StyleSheet.create({
  container: {
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    borderRadius: radii.control,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.scale.body.fontSize,
    fontWeight: '700',
  },
});

const variantStyles: Record<ButtonVariant, { container: ViewStyle; label: object }> = {
  primary: {
    container: { backgroundColor: colors.action },
    label: { color: colors.white },
  },
  secondary: {
    container: {
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.action,
    },
    label: { color: colors.action },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.action },
  },
};
