import { useCallback, useState } from "react";

const MAX_COMPARE = 4;

export function useCompareState() {
  const [comparedItemIds, setComparedItemIds] = useState<number[]>([]);
  const [comparedSpellIds, setComparedSpellIds] = useState<number[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const toggleItemCompare = useCallback((id: number) => {
    setComparedItemIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const toggleSpellCompare = useCallback((id: number) => {
    setComparedSpellIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const isItemCompared = useCallback(
    (id: number) => comparedItemIds.includes(id),
    [comparedItemIds],
  );

  const isSpellCompared = useCallback(
    (id: number) => comparedSpellIds.includes(id),
    [comparedSpellIds],
  );

  const clearItemCompare = useCallback(() => {
    setComparedItemIds([]);
  }, []);

  const clearSpellCompare = useCallback(() => {
    setComparedSpellIds([]);
  }, []);

  const clearAllCompare = useCallback(() => {
    setComparedItemIds([]);
    setComparedSpellIds([]);
  }, []);

  return {
    comparedItemIds,
    comparedSpellIds,
    toggleItemCompare,
    toggleSpellCompare,
    isItemCompared,
    isSpellCompared,
    clearItemCompare,
    clearSpellCompare,
    clearAllCompare,
    compareModalOpen,
    setCompareModalOpen,
  };
}
