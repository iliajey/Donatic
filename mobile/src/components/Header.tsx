import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget } from '../theme/tokens';
import { DonutMark } from './DonutMark';

export type HeaderRoute = 'home' | 'builder' | 'cart';

const NAV: Array<{ id: HeaderRoute | 'browse'; label: string }> = [
  { id: 'browse', label: 'Menu' },
  { id: 'builder', label: 'Builder' },
  { id: 'cart', label: 'Cart' },
  { id: 'home', label: 'Story' },
];

/**
 * Logo note: root logos (../logo.jpeg etc.) sit outside the Expo project
 * root, so bundling them via the Expo asset pipeline is unreliable for
 * `expo export --platform web`. Phase 1 therefore uses a local SVG-style
 * donut mark (DonutMark, drawn in code). To use the real logo later, copy
 * it into mobile/assets/ (do NOT move the root files) and wire
 * `require('../assets/logo.jpeg')` here.
 */
export function Header({
  route,
  onNavigate,
}: {
  route: HeaderRoute;
  onNavigate: (r: HeaderRoute | 'browse') => void;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.brand} accessibilityLabel="Donatic home">
        <DonutMark size={32} />
        <Text style={styles.wordmark}>Donatic</Text>
      </View>
      <View style={styles.nav} accessibilityRole="menubar">
        {NAV.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.id)}
            accessibilityRole="menuitem"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: route === item.id }}
            style={styles.link}
          >
            <Text style={[styles.linkText, route === item.id && styles.linkActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wordmark: { fontSize: 22, fontWeight: '800', color: colors.action },
  nav: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  link: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  linkText: { color: colors.chocolate, fontWeight: '600' },
  linkActive: { color: colors.action, textDecorationLine: 'underline' },
});
