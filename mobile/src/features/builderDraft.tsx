import React, { createContext, useContext, useMemo, useState } from 'react';

/** Builder draft survives navigation (builder screen unmounts on route change). */
interface Draft {
  baseId: number | null;
  sauceId: number | null;
  toppingIds: number[];
  setBaseId: React.Dispatch<React.SetStateAction<number | null>>;
  setSauceId: React.Dispatch<React.SetStateAction<number | null>>;
  setToppingIds: React.Dispatch<React.SetStateAction<number[]>>;
  toggleTopping: (id: number) => void;
}

const DraftContext = createContext<Draft | null>(null);

export function BuilderDraftProvider({ children }: { children: React.ReactNode }) {
  const [baseId, setBaseId] = useState<number | null>(null);
  const [sauceId, setSauceId] = useState<number | null>(null);
  const [toppingIds, setToppingIds] = useState<number[]>([]);
  const value = useMemo<Draft>(
    () => ({
      baseId,
      sauceId,
      toppingIds,
      setBaseId,
      setSauceId,
      setToppingIds,
      toggleTopping: (id: number) =>
        setToppingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    }),
    [baseId, sauceId, toppingIds],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useBuilderDraft(): Draft {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useBuilderDraft must be used inside BuilderDraftProvider');
  return ctx;
}
