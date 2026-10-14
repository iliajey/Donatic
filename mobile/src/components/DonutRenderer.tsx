import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { DonutVisualSpec, RendererTopping } from './visualMapping';
import { scatterPosition } from './visualMapping';

/**
 * Layered 2D donut renderer (renderer boundary: props in, pixels out).
 * Layers: base > sauce (spread-in) > toppings (fall-in) > hole + shine.
 * Pure Views + Animated; works on native + react-native-web.
 */

function FallingTopping({ t, index, total, size, reducedMotion }: {
  t: RendererTopping; index: number; total: number; size: number; reducedMotion: boolean;
}) {
  const pos = scatterPosition(index, total);
  const drop = useRef(new Animated.Value(reducedMotion ? 0 : -1)).current;
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reducedMotion) {
      drop.setValue(0);
      opacity.setValue(1);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(drop, {
        toValue: 0, duration: 320, delay: Math.min(index, 12) * 45,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 200, delay: Math.min(index, 12) * 45, useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [drop, opacity, index, reducedMotion]);
  const r = size / 2;
  const shapeStyle = (() => {
    switch (t.shape) {
      case 'bar': return { width: 16, height: 7, borderRadius: 3.5, backgroundColor: t.color };
      case 'flake': return { width: 11, height: 11, borderRadius: 2, backgroundColor: t.color };
      case 'curl': return {
        width: 13, height: 13, borderRadius: 6.5, backgroundColor: 'transparent',
        borderWidth: 3, borderColor: t.color,
      };
      default: return { width: 10, height: 10, borderRadius: 5, backgroundColor: t.color };
    }
  })();
  return (
    <Animated.View
      style={[styles.topping, shapeStyle, {
        opacity,
        transform: [
          { translateX: pos.dx * r }, { translateY: pos.dy * r },
          { translateY: drop.interpolate({ inputRange: [-1, 0], outputRange: [-size * 0.45, 0] }) },
          { rotate: `${pos.rot}deg` },
        ],
      }]}
    />
  );
}
// CHUNK2

function SauceLayer({ color, size, reducedMotion }: {
  color: string; size: number; reducedMotion: boolean;
}) {
  const spread = useRef(new Animated.Value(reducedMotion ? 1 : 0.15)).current;
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0.4)).current;
  useEffect(() => {
    if (reducedMotion) {
      spread.setValue(1);
      opacity.setValue(1);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(spread, {
        toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [spread, opacity, reducedMotion]);
  const r = size / 2;
  return (
    <Animated.View
      style={[styles.glaze, {
        width: size * 0.86, height: size * 0.8, borderRadius: r,
        backgroundColor: color, opacity,
        transform: [{ scale: spread }],
      }]}
    />
  );
}

export function DonutRenderer({ spec, size = 200, label = 'Customized donut preview', reducedMotion }: {
  spec: DonutVisualSpec; size?: number; label?: string; reducedMotion: boolean;
}) {
  const r = size / 2;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reducedMotion]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const baseStyle = spec.baseShape === 'pillow'
    ? { borderRadius: size * 0.28 }
    : spec.baseShape === 'twist'
      ? { borderRadius: size * 0.42 }
      : { borderRadius: r };
  return (
    <View style={[styles.stage, { width: size, height: size }]}
      accessibilityRole="image" accessibilityLabel={label}>
      <Animated.View style={[styles.spin, { width: size, height: size, transform: [{ rotate }] }]}>
        <View style={[styles.dough, { width: size, height: size, backgroundColor: spec.baseColor }, baseStyle]} />
        {spec.sauceColor ? (
          <SauceLayer key={spec.sauceColor} color={spec.sauceColor} size={size} reducedMotion={reducedMotion} />
        ) : null}
        {spec.toppings.map((t, i) => (
          <FallingTopping key={t.instanceId} t={t} index={i}
            total={spec.toppings.length} size={size} reducedMotion={reducedMotion} />
        ))}
        <View style={[styles.hole, {
          width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13,
        }]} />
        <View style={[styles.shine, {
          width: size * 0.3, height: size * 0.12, borderRadius: size * 0.06,
          left: size * 0.16, top: size * 0.2,
        }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  spin: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dough: { position: 'absolute' },
  glaze: { position: 'absolute', top: '4%' },
  topping: { position: 'absolute' },
  hole: { position: 'absolute', backgroundColor: '#FFF6EF', borderWidth: 3, borderColor: '#D89A5B' },
  shine: { position: 'absolute', backgroundColor: '#FFFFFF', opacity: 0.35 },
});
