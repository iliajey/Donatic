import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator color={colors.action} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error} accessibilityRole="alert" accessibilityLabel={message}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.retry}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
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
  retry: {
    marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.lg,
    minHeight: 44, justifyContent: 'center', borderRadius: 999,
    borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.white,
  },
  retryText: { color: colors.error, fontWeight: '800' },
  toast: { backgroundColor: colors.ink, borderRadius: 12, padding: spacing.md },
  toastText: { color: colors.white, fontWeight: '600' },
});
