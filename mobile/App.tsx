import React, { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/index';
import { BuilderScreen } from './src/screens/builder';
import { CartScreen } from './src/screens/cart';
import { CartProvider, useCart } from './src/features/cart';
import { BuilderDraftProvider } from './src/features/builderDraft';
import { colors } from './src/theme/tokens';

type Dir = 'ltr' | 'rtl';
type Route = 'home' | 'builder' | 'cart';

function useWebHead() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('donatic-fonts')) {
      const link = document.createElement('link');
      link.id = 'donatic-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="description"]')) {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Donatic: build-your-donut storefront — customize a donut and review your cart.';
      document.head.appendChild(meta);
    }
  }, []);
}

function Shell() {
  const [route, setRoute] = useState<Route>('home');
  const [dir, setDir] = useState<Dir>('ltr');
  const { count } = useCart();
  useWebHead();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', dir === 'rtl' ? 'fa' : 'en');
    }
  }, [dir]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.dirBar}>
        <Text style={styles.dirText}>
          EN primary · FA-ready tokens{count > 0 ? ` · cart: ${count}` : ''}
        </Text>
        <Pressable
          onPress={() => setDir((d) => (d === 'ltr' ? 'rtl' : 'ltr'))}
          accessibilityRole="button"
          accessibilityLabel={`dir: ${dir} — toggle text direction`}
          style={styles.dirToggle}
        >
          <Text style={styles.dirToggleText}>dir: {dir} — toggle</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} role="main">
        {route === 'home' ? (
          <HomeScreen
            onGoBuilder={() => setRoute('builder')}
            onGoCart={() => setRoute('cart')}
          />
        ) : route === 'builder' ? (
          <BuilderScreen onGoHome={() => setRoute('home')} onGoCart={() => setRoute('cart')} />
        ) : (
          <CartScreen onGoBuilder={() => setRoute('builder')} onGoHome={() => setRoute('home')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BuilderDraftProvider>
        <Shell />
      </BuilderDraftProvider>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, backgroundColor: colors.cream },
  dirBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dirText: { fontSize: 12, color: colors.muted },
  dirToggle: { padding: 10, minHeight: 44, justifyContent: 'center' },
  dirToggleText: { color: colors.action, fontWeight: '700', fontSize: 12 },
});
