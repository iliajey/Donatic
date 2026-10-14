import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

export function DonutMark({ size = 32 }: { size?: number }) {
  const r = size / 2;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="image"
      accessibilityLabel="Donatic donut mark"
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: '#E8B06E',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 1,
          width: size * 0.84,
          height: size * 0.78,
          borderRadius: r,
          backgroundColor: colors.blush,
        }}
      />
      <View
        style={[
          styles.hole,
          { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hole: { position: 'absolute', backgroundColor: colors.cream },
});
