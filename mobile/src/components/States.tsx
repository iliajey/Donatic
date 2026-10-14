import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator color={colors.action} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.error} accessibilityRole="alert" accessibilityLabel={message}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <View style={styles.toast} accessibilityRole="alert" accessibilityLabel={message}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  text: { fontFamily: typography.bodyFamily, color: colors.muted, fontSize: 14 },
  error: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: { color: colors.error, fontWeight: '600' },
  toast: { backgroundColor: colors.ink, borderRadius: 12, padding: spacing.md },
  toastText: { color: colors.white, fontWeight: '600' },
});
