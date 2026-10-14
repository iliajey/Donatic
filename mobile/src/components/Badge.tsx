import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme/tokens';

export function Badge({ text }: { text: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={text}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blush,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.scale.small.fontSize,
    fontWeight: '700',
    color: colors.chocolate,
  },
});
