import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, touchTarget } from '../theme/tokens';
import { formatIRR } from '../utils/money';
import type { CartLine } from '../features/cartStore';
import { useCart } from '../features/cart';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Section } from '../components/Section';
import { AppText, Heading } from '../components/Typography';

function QtyButton({ label, name, onPress }: { label: string; name: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.qty}
    >
      <Text style={styles.qtyText}>{label}</Text>
    </Pressable>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const { dispatch } = useCart();
  const desc = [line.baseName, line.sauceName ?? 'no sauce', ...line.toppingNames].join(', ');
  return (
    <View style={styles.row} accessibilityLabel={`Cart item: ${desc}`}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{line.baseName}</Text>
        <AppText>{line.sauceName ? `Sauce: ${line.sauceName}` : 'No sauce'}</AppText>
        <AppText>{line.toppingNames.length ? line.toppingNames.join(', ') : 'No toppings'}</AppText>
        <AppText>{formatIRR(line.unitPrice)} each</AppText>
      </View>
      <View style={styles.rowSide}>
        <View style={styles.qtyRow}>
          <QtyButton label="−" name={`Decrease quantity of ${line.baseName}`} onPress={() => dispatch({ type: 'decrement', key: line.key })} />
          <Text style={styles.qtyNum} accessibilityLabel={`Quantity ${line.quantity}`}>{line.quantity}</Text>
          <QtyButton label="+" name={`Increase quantity of ${line.baseName}`} onPress={() => dispatch({ type: 'increment', key: line.key })} />
        </View>
        <Text style={styles.lineTotal}>{formatIRR(line.unitPrice * line.quantity)}</Text>
        <QtyButton label="Remove" name={`Remove ${line.baseName} from cart`} onPress={() => dispatch({ type: 'remove', key: line.key })} />
      </View>
    </View>
  );
}

export function CartScreen({ onGoBuilder, onGoHome }: {
  onGoBuilder: () => void; onGoHome: () => void;
}) {
  const { state, subtotal, count } = useCart();
  return (
    <View style={styles.page}>
      <Header route="cart" onNavigate={(r) => r === 'home' && onGoHome()} />
      <View style={styles.wrap}>
        <Heading level={1}>Your Cart</Heading>
        {state.lines.length === 0 ? (
          <View style={styles.empty} accessibilityLabel="Empty cart">
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <AppText>Design a donut in the builder — it will show up here.</AppText>
            <Button title="Open the Builder" onPress={onGoBuilder} variant="primary" />
          </View>
        ) : (
          <View style={styles.list}>
            <Section title={`${count} item${count === 1 ? '' : 's'}`}>
              {state.lines.map((l) => (
                <CartRow key={l.key} line={l} />
              ))}
            </Section>
            <View style={styles.summary} accessibilityLabel={`Cart subtotal ${formatIRR(subtotal)}`}>
              <Text style={styles.subtotal}>Subtotal: {formatIRR(subtotal)}</Text>
              <AppText>Prices are the latest server estimates — no order is placed in this phase.</AppText>
              <View style={styles.ctaRow}>
                <Button title="Add another donut" variant="secondary" onPress={onGoBuilder} />
                <Button title="Back to storefront" variant="secondary" onPress={onGoHome} />
              </View>
            </View>
          </View>
        )}
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  wrap: { gap: spacing.lg, padding: spacing.xl },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radii.card, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  rowInfo: { flex: 1, minWidth: 200, gap: 2 },
  rowTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  rowSide: { gap: spacing.sm, alignItems: 'flex-end', minWidth: 150 },
  qtyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  qty: {
    minWidth: touchTarget.min, minHeight: touchTarget.min, justifyContent: 'center', alignItems: 'center',
    borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
  },
  qtyText: { color: colors.action, fontWeight: '800', fontSize: 16 },
  qtyNum: { fontSize: 16, fontWeight: '800', color: colors.ink, minWidth: 24, textAlign: 'center' },
  lineTotal: { fontSize: 16, fontWeight: '800', color: colors.ink },
  summary: {
    gap: spacing.sm, backgroundColor: colors.white, borderRadius: radii.card,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  subtotal: { fontSize: 20, fontWeight: '800', color: colors.ink },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: {
    gap: spacing.md, alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radii.card, padding: spacing.xxl, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
