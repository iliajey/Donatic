import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { demoDonuts } from '../data/demo';
import { colors, spacing, typography } from '../theme/tokens';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DonutVisual } from '../components/DonutVisual';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Section } from '../components/Section';
import { AppText, Heading } from '../components/Typography';

export function HomeScreen({ onGoBuilder, onGoCart }: { onGoBuilder: () => void; onGoCart: () => void }) {
  return (
    <View style={styles.page}>
      <Header
        route="home"
        onNavigate={(r) => {
          if (r === 'builder') onGoBuilder();
          else if (r === 'cart') onGoCart();
        }}
      />
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Badge text="Real catalog · demo cart" />
          <Heading level={1}>Build Your Donut. Your Taste. Your Donatic.</Heading>
          <AppText>
            Pick a real base from our catalog, swirl a sauce, scatter toppings — priced live by
            the server and saved to your cart. No checkout yet: this demo ends at the cart.
          </AppText>
          <View style={styles.ctaRow}>
            <Button title="Try the Donut Builder" onPress={onGoBuilder} variant="primary" />
            <Button
              title="Browse demo donuts"
              variant="secondary"
              onPress={() => {
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  document.getElementById('demo-donuts')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </View>
        </View>
        <DonutVisual glaze="strawberry" size={220} label="Hero illustrated strawberry donut" />
      </View>

      <View nativeID="demo-donuts">
        <Section title="Featured demo donuts">
          <AppText>Clearly labeled concept cards — nothing here is for sale.</AppText>
          <View style={styles.grid}>
            {demoDonuts.map((d) => (
              <View key={d.id} style={styles.cardWrap}>
                <ProductCard donut={d} />
              </View>
            ))}
          </View>
        </Section>
      </View>

      <Section title="How it works">
        {['Pick a base — classic, cocoa, or twist.', 'Swirl a glaze — strawberry to matcha.', 'Scatter toppings and preview the price estimate.'].map(
          (step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <AppText>{step}</AppText>
            </View>
          )
        )}
      </Section>

      <Section title="Our story">
        <AppText>
          Donatic started with a simple craving: a donut that tastes like you. Pick a base, swirl
          a sauce, scatter toppings — the builder prices everything live, in English first, with
          tokens ready for a future Farsi (RTL) pass.
        </AppText>
      </Section>

      <View style={styles.finalCta}>
        <Heading level={2}>Hungry for the real thing?</Heading>
        <AppText>Open the builder — live catalog, live prices, demo cart, no real orders yet.</AppText>
        <Button title="Open Donut Builder" onPress={onGoBuilder} variant="primary" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          onPress={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <Text style={styles.topLink}>Back to top ↑</Text>
        </Pressable>
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.xl, paddingBottom: spacing.xxxl },
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  heroCopy: { flex: 1, minWidth: 280, gap: spacing.md },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardWrap: { flex: 1, minWidth: 220 },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.white, fontWeight: '800' },
  finalCta: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  topLink: { color: colors.action, fontWeight: '700', fontSize: typography.scale.small.fontSize },
});
