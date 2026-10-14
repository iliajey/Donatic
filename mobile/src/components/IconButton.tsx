import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, touchTarget } from '../theme/tokens';
import { pressScale } from '../animations/tokens';

interface IconButtonProps {
  label: string;
  glyph: string;
  onPress?: () => void;
}

export function IconButton({ label, glyph, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.hit, pressed ? { transform: [{ scale: pressScale }] } : null]}
    >
      <Text style={styles.glyph} accessibilityElementsHidden>
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 18, color: colors.action, fontWeight: '700' },
});
