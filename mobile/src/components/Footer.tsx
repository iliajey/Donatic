import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export function Footer() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Donatic — Your Taste. Your Donatic.</Text>
      <Text style={styles.small}>Phase 1 prototype. Demo content only — no real orders.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: 4,
  },
  brand: { fontFamily: typography.bodyFamily, fontWeight: '700', color: colors.chocolate },
  small: { fontSize: typography.scale.small.fontSize, color: colors.muted },
});
