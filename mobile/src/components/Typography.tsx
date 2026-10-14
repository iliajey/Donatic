import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../theme/tokens';

interface AppTextProps {
  children: React.ReactNode;
  accessibilityLabel?: string;
}

export function AppText({ children, accessibilityLabel }: AppTextProps) {
  return <Text style={styles.body} accessibilityLabel={accessibilityLabel}>{children}</Text>;
}

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  accessibilityLabel?: string;
}

export function Heading({ children, level = 2, accessibilityLabel }: HeadingProps) {
  const style = level === 1 ? styles.hero : level === 2 ? styles.h2 : styles.h3;
  return (
    <Text style={style} accessibilityRole="header" aria-level={level} accessibilityLabel={accessibilityLabel}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.scale.body.fontSize,
    lineHeight: typography.scale.body.lineHeight,
    color: colors.ink,
  },
  hero: {
    fontFamily: typography.displayFamily,
    fontSize: typography.scale.hero.fontSize,
    lineHeight: typography.scale.hero.lineHeight,
    fontWeight: '800',
    color: colors.ink,
  },
  h2: {
    fontFamily: typography.displayFamily,
    fontSize: typography.scale.h2.fontSize,
    lineHeight: typography.scale.h2.lineHeight,
    fontWeight: '700',
    color: colors.ink,
  },
  h3: {
    fontFamily: typography.displayFamily,
    fontSize: typography.scale.h3.fontSize,
    lineHeight: typography.scale.h3.lineHeight,
    fontWeight: '700',
    color: colors.chocolate,
  },
});
