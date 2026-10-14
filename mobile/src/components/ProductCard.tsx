import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { DemoDonut } from '../data/demo';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { AppText } from './Typography';
import { Badge } from './Badge';
import { DonutVisual } from './DonutVisual';
import { Price } from './Price';

export function ProductCard({ donut }: { donut: DemoDonut }) {
  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${donut.name}, ${donut.description}`}
    >
      <DonutVisual glaze={donut.glaze} size={120} label={`${donut.name} illustration`} />
      <View style={styles.body}>
        <AppText>
          <AppText>{donut.name}</AppText>
        </AppText>
        <AppText>{donut.description}</AppText>
        <Price value={donut.price} currency={donut.currency} note="Demo concept — not for sale" />
        <Badge text="Demo concept — not for sale" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.subtle,
  },
  body: { gap: 6, alignItems: 'center' },
});
