import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

export type GlazeKind = 'strawberry' | 'chocolate' | 'vanilla' | 'matcha';

const GLAZE: Record<GlazeKind, { main: string; drip: string }> = {
  strawberry: { main: '#F6A8BE', drip: '#EF7FA3' },
  chocolate: { main: '#6B3E2E', drip: '#4A2C21' },
  vanilla: { main: '#F7E3C3', drip: '#EBCB9B' },
  matcha: { main: '#9DBE8C', drip: '#7FA56E' },
};

/**
 * Layered donut visual built in code: dough circle + glaze layer +
 * topping dots + hole. No emoji, no external images. Works on
 * native + react-native-web (pure Views).
 */
export function DonutVisual({
  glaze = 'strawberry',
  size = 180,
  toppingCount = 8,
  label = 'Illustrated donut',
}: {
  glaze?: GlazeKind;
  size?: number;
  toppingCount?: number;
  label?: string;
}) {
  const g = GLAZE[glaze];
  const r = size / 2;
  const dots = Array.from({ length: toppingCount }, (_, i) => {
    const angle = (i / Math.max(1, toppingCount)) * Math.PI * 2 + 0.4;
    const rad = r * 0.52;
    return { x: Math.cos(angle) * rad, y: Math.sin(angle) * rad * 0.9, key: i };
  });
  return (
    <View
      style={[styles.stage, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {/* dough */}
      <View style={[styles.dough, { width: size, height: size, borderRadius: r, backgroundColor: '#E8B06E' }]} />
      {/* glaze */}
      <View
        style={[
          styles.glaze,
          {
            width: size * 0.86,
            height: size * 0.8,
            borderRadius: r,
            backgroundColor: g.main,
            borderBottomWidth: 6,
            borderBottomColor: g.drip,
          },
        ]}
      />
      {/* topping dots */}
      {dots.map((d, idx) => (
        <View
          key={d.key}
          style={[
            styles.dot,
            {
              backgroundColor: idx % 3 === 0 ? colors.white : idx % 3 === 1 ? colors.gold : colors.action,
              transform: [{ translateX: d.x }, { translateY: d.y }],
            },
          ]}
        />
      ))}
      {/* hole */}
      <View style={[styles.hole, { width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dough: { position: 'absolute' },
  glaze: { position: 'absolute', top: '4%' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  hole: { position: 'absolute', backgroundColor: '#FFF6EF', borderWidth: 3, borderColor: '#D89A5B' },
});
