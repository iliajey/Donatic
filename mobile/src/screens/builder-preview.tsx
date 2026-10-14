import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { builderBases, builderSauces, builderToppings } from '../data/demo';
import type { GlazeKind } from '../components/DonutVisual';
import { colors, radii, spacing, touchTarget } from '../theme/tokens';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DonutVisual } from '../components/DonutVisual';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Price } from '../components/Price';
import { Section } from '../components/Section';
import { AppText, Heading } from '../components/Typography';
import { estimateBuilderPrice } from '../utils/format';

const SAUCE_TO_GLAZE: Record<string, GlazeKind> = {
  Strawberry: 'strawberry',
  Chocolate: 'chocolate',
  Vanilla: 'vanilla',
  Matcha: 'matcha',
};

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function BuilderPreviewScreen({ onGoHome }: { onGoHome: () => void }) {
  const [base, setBase] = useState<string>(builderBases[0] as string);
  const [sauce, setSauce] = useState<string>(builderSauces[0] as string);
  const [toppings, setToppings] = useState<string[]>([builderToppings[0] as string]);

  const toggleTopping = (t: string) =>
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const estimate = estimateBuilderPrice(builderBases.indexOf(base as never), toppings.length);

  return (
    <View style={styles.page}>
      <Header route="builder-preview" onNavigate={(r) => r !== 'browse' && r !== 'builder-preview' && onGoHome()} />
      <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="Prototype preview — no real orders">
        <Text style={styles.bannerText}>Prototype preview — no real orders</Text>
      </View>
      <View style={styles.wrap}>
        <Heading level={1}>Builder Preview</Heading>
        <AppText>Three mock steps. Selections update the donut illustration and estimate below.</AppText>
        <View style={styles.split}>
          <Section title="1 · Pick a base">
            <View style={styles.chips}>
              {builderBases.map((b) => (
                <Chip key={b} label={b} selected={base === b} onToggle={() => setBase(b)} />
              ))}
            </View>
          </Section>
          <Section title="2 · Swirl a sauce">
            <View style={styles.chips}>
              {builderSauces.map((s) => (
                <Chip key={s} label={s} selected={sauce === s} onToggle={() => setSauce(s)} />
              ))}
            </View>
          </Section>
          <Section title="3 · Scatter toppings">
            <View style={styles.chips}>
              {builderToppings.map((t) => (
                <Chip key={t} label={t} selected={toppings.includes(t)} onToggle={() => toggleTopping(t)} />
              ))}
            </View>
          </Section>
        </View>
        <Section title="Your preview">
          <View style={styles.previewRow}>
            <DonutVisual
              glaze={SAUCE_TO_GLAZE[sauce] ?? 'strawberry'}
              toppingCount={4 + toppings.length * 3}
              label={`Preview donut with ${sauce} glaze`}
            />
            <View style={styles.summary}>
              <Badge text="Estimate only" />
              <AppText>Base: {base}</AppText>
              <AppText>Sauce: {sauce}</AppText>
              <AppText>Toppings: {toppings.length ? toppings.join(', ') : 'None'}</AppText>
              <Price value={estimate} note="Estimate only" />
              <Button title="Back to storefront" variant="secondary" onPress={onGoHome} />
            </View>
          </View>
        </Section>
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  banner: { backgroundColor: colors.gold, padding: spacing.md, alignItems: 'center' },
  bannerText: { color: colors.ink, fontWeight: '800' },
  wrap: { gap: spacing.lg, padding: spacing.xl },
  split: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  chipSelected: { borderColor: colors.action, backgroundColor: colors.white },
  chipText: { color: colors.chocolate, fontWeight: '600' },
  chipTextSelected: { color: colors.action, fontWeight: '800' },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl, alignItems: 'center' },
  summary: { flex: 1, minWidth: 240, gap: spacing.sm },
});
