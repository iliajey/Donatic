import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { CartAction, CartState } from './cartStore';
import { cartCount, cartReducer, cartSubtotal, emptyCart } from './cartStore';

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, emptyCart);
  const value = useMemo<CartContextValue>(
    () => ({ state, dispatch, subtotal: cartSubtotal(state), count: cartCount(state) }),
    [state],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
