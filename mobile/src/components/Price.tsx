import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../theme/tokens';
import { formatPrice } from '../utils/format';

export function Price({ value, currency = 'USD', note }: { value: number; currency?: string; note?: string }) {
  const label = `${formatPrice(value, currency)}${note ? ` — ${note}` : ''}`;
  return (
    <Text style={styles.text} accessibilityRole="text" accessibilityLabel={label}>
      {formatPrice(value, currency)}
      {note ? <Text style={styles.note}> · {note}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.scale.body.fontSize,
    fontWeight: '800',
    color: colors.chocolate,
  },
  note: { fontWeight: '400', color: colors.muted, fontSize: typography.scale.small.fontSize },
});
