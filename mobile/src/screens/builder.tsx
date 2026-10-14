import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Catalog, CatalogItem, ValidatePriceResponse } from '../api/catalog';
import { fetchCatalog, validateComposition } from '../api/catalog';
import { ApiRequestError } from '../api/client';
import { usePrefersReducedMotion } from '../animations/tokens';
import { colors, radii, spacing, touchTarget } from '../theme/tokens';
import { formatIRR } from '../utils/money';
import { canonicalize } from '../utils/composition';
import { useCart } from '../features/cart';
import { useBuilderDraft } from '../features/builderDraft';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DonutRenderer } from '../components/DonutRenderer';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { ErrorState, LoadingState } from '../components/States';
import { Section } from '../components/Section';
import { AppText, Heading } from '../components/Typography';
import { compositionToVisual } from '../components/visualMapping';

type PriceState =
  | { kind: 'idle' }
  | { kind: 'pricing' }
  | { kind: 'ready'; data: ValidatePriceResponse }
  | { kind: 'error'; message: string };

function OptionChip({ label, detail, selected, onToggle, testId }: {
  label: string; detail?: string; selected: boolean;
  onToggle: () => void; testId?: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={detail ? `${label}, ${detail}${selected ? ', selected' : ''}` : label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.chip, selected && styles.chipSelected]}
      testID={testId}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {detail ? <Text style={[styles.chipDetail, selected && styles.chipTextSelected]}>{detail}</Text> : null}
    </Pressable>
  );
}

export function BuilderScreen({ onGoHome, onGoCart }: {
  onGoHome: () => void; onGoCart: () => void;
}) {
  const { dispatch } = useCart();
  const reducedMotion = usePrefersReducedMotion();
  const { baseId, sauceId, toppingIds, setBaseId, setSauceId, toggleTopping } = useBuilderDraft();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState<PriceState>({ kind: 'idle' });
  const [priceNonce, setPriceNonce] = useState(0);
  const [added, setAdded] = useState(false);
  const pricePulse = useRef(new Animated.Value(1)).current;
  const requestSeq = useRef(0);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetchCatalog().then(
      (c) => {
        setCatalog(c);
        setLoading(false);
        if (c.base_donuts.length > 0) {
          const first = c.base_donuts[0];
          if (first) setBaseId((prev) => prev ?? first.id);
        }
      },
      (e: unknown) => {
        setLoadError(e instanceof ApiRequestError ? e.message : 'Could not load the catalog.');
        setLoading(false);
      },
    );
  }, [setBaseId]);

  useEffect(() => {
    load();
  }, [load]);

  const base = catalog?.base_donuts.find((b) => b.id === baseId) ?? null;
  const sauce = catalog?.sauces.find((s) => s.id === sauceId) ?? null;
  const toppings = useMemo(
    () => (catalog?.toppings ?? []).filter((t) => toppingIds.includes(t.id)),
    [catalog, toppingIds],
  );

  useEffect(() => {
    if (baseId === null) {
      setPrice({ kind: 'idle' });
      return;
    }
    const seq = ++requestSeq.current;
    setPrice((prev) => (prev.kind === 'ready' ? prev : { kind: 'pricing' }));
    const req = canonicalize(baseId, sauceId, toppingIds);
    const timer = setTimeout(
      () => {
        validateComposition(req).then(
          (data) => {
            if (requestSeq.current !== seq) return;
            setPrice({ kind: 'ready', data });
            setAdded(false);
            if (!reducedMotion) {
              Animated.sequence([
                Animated.timing(pricePulse, {
                  toValue: 1.12, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true,
                }),
                Animated.timing(pricePulse, {
                  toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true,
                }),
              ]).start();
            }
          },
          (e: unknown) => {
            if (requestSeq.current !== seq) return;
            setPrice({
              kind: 'error',
              message: e instanceof ApiRequestError ? e.message : 'Pricing is unavailable right now.',
            });
          },
        );
      },
      reducedMotion ? 0 : 250,
    );
    return () => clearTimeout(timer);
  }, [baseId, sauceId, toppingIds, reducedMotion, pricePulse, priceNonce]);

  const addToCart = () => {
    if (price.kind !== 'ready' || !base) return;
    const canonical = price.data.canonical;
    dispatch({
      type: 'add',
      composition: canonical,
      names: {
        serverHash: price.data.composition_hash,
        baseName: price.data.breakdown.base.name,
        sauceName: price.data.breakdown.sauce?.name ?? null,
        toppingNames: price.data.breakdown.toppings.map((t) => t.name),
        unitPrice: price.data.total_price,
      },
    });
    setAdded(true);
  };

  const spec = useMemo(
    () => (base ? compositionToVisual(base, sauce, toppings) : null),
    [base, sauce, toppings],
  );

  const describeSelection = (): string => {
    if (!base) return 'No base selected yet';
    const parts = [base.name, sauce ? `with ${sauce.name}` : 'no sauce'];
    parts.push(toppings.length ? `toppings ${toppings.map((t) => t.name).join(', ')}` : 'no toppings');
    return `Donut preview: ${parts.join(', ')}`;
  };

  return (
    <View style={styles.page}>
      <Header route="builder" onNavigate={(r) => r === 'home' && onGoHome()} />
      <View style={styles.wrap}>
        <Heading level={1}>Donut Builder</Heading>
        {loading ? (
          <LoadingState message="Loading the fresh catalog…" />
        ) : loadError || !catalog ? (
          <ErrorState
            message={loadError ?? 'Catalog is empty.'}
            onRetry={load}
          />
        ) : catalog.base_donuts.length === 0 ? (
          <ErrorState message="No donuts available right now." onRetry={load} />
        ) : (
          <View style={styles.split}>
            <View style={styles.stageCard}>
              {spec ? (
                <DonutRenderer spec={spec} size={220} label={describeSelection()} reducedMotion={reducedMotion} />
              ) : null}
              <View style={styles.priceRow}>
                <Badge text={price.kind === 'ready' ? 'Server price' : 'Live estimate'} />
                {price.kind === 'ready' ? (
                  <Animated.Text style={[styles.price, { transform: [{ scale: pricePulse }] }]}>
                    {formatIRR(price.data.total_price)}
                  </Animated.Text>
                ) : price.kind === 'pricing' ? (
                  <AppText>Calculating…</AppText>
                ) : price.kind === 'error' ? (
                  <AppText>Price unavailable — {price.message}</AppText>
                ) : (
                  <AppText>Pick a base to price your donut.</AppText>
                )}
              </View>
              {price.kind === 'ready' ? (
                <View style={styles.breakdown} accessibilityLabel="Itemized price breakdown">
                  <AppText>Base {price.data.breakdown.base.name} · {formatIRR(price.data.breakdown.base.price)}</AppText>
                  {price.data.breakdown.sauce ? (
                    <AppText>Sauce {price.data.breakdown.sauce.name} · {formatIRR(price.data.breakdown.sauce.price)}</AppText>
                  ) : (
                    <AppText>No sauce</AppText>
                  )}
                  {price.data.breakdown.toppings.map((t) => (
                    <AppText key={t.id}>+ {t.name} · {formatIRR(t.price)}</AppText>
                  ))}
                </View>
              ) : null}
              <View style={styles.ctaRow}>
                <Button
                  title={added ? 'Added ✓ — View cart' : 'Add to cart'}
                  onPress={() => (added ? onGoCart() : addToCart())}
                  variant="primary"
                />
                {price.kind === 'error' ? <Button title="Retry price" variant="secondary" onPress={() => setPriceNonce((n) => n + 1)} /> : null}
              </View>
              {added ? <AppText>Added to your cart. Build another or review your cart.</AppText> : null}
            </View>
            <Section title="1 · Pick a base">
              <View style={styles.chips}>
                {catalog.base_donuts.map((b: CatalogItem) => (
                  <OptionChip key={b.id} label={b.name} detail={formatIRR(b.price)}
                    selected={baseId === b.id} onToggle={() => setBaseId(b.id)} />
                ))}
              </View>
            </Section>
            <Section title="2 · Swirl a sauce (optional)">
              <View style={styles.chips}>
                <OptionChip label="No sauce" selected={sauceId === null} onToggle={() => setSauceId(null)} />
                {catalog.sauces.map((s: CatalogItem) => (
                  <OptionChip key={s.id} label={s.name} detail={formatIRR(s.price)}
                    selected={sauceId === s.id}
                    onToggle={() => setSauceId((prev) => (prev === s.id ? null : s.id))} />
                ))}
              </View>
            </Section>
            <Section title="3 · Scatter toppings">
              <View style={styles.chips}>
                {catalog.toppings.map((t: CatalogItem) => (
                  <OptionChip key={t.id} label={t.name} detail={formatIRR(t.price)}
                    selected={toppingIds.includes(t.id)} onToggle={() => toggleTopping(t.id)} />
                ))}
              </View>
            </Section>
            <Button title="Back to storefront" variant="secondary" onPress={onGoHome} />
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
  split: { gap: spacing.md },
  stageCard: {
    gap: spacing.md, alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radii.card, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 24, fontWeight: '800', color: colors.ink },
  breakdown: { gap: 2, alignItems: 'center' },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget.min, justifyContent: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.cream,
  },
  chipSelected: { borderColor: colors.action, backgroundColor: colors.white },
  chipText: { color: colors.chocolate, fontWeight: '600' },
  chipTextSelected: { color: colors.action, fontWeight: '800' },
  chipDetail: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
