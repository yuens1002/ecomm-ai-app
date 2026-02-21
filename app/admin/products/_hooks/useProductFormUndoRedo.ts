"use client";

import { useState, useRef, useCallback, useEffect, type RefObject } from "react";
import type { ProductInfoValues } from "../_components/ProductInfoSection";
import type { VariantData, VariantsSectionRef } from "../_components/VariantsSection";
import type { AddOnEntry, AddOnsSectionRef } from "../_components/AddOnsSection";
import { useAutoSave } from "./useAutoSave";

type FormState<TSpecs> = {
  productInfo: ProductInfoValues;
  categoryIds: string[];
  addOns: AddOnEntry[];
  variants: VariantData[];
} & TSpecs;

interface UseProductFormUndoRedoOptions<TSpecs extends Record<string, unknown>> {
  isNewProduct: boolean;
  productId: string | null;
  historyKeyPrefix: string;
  setProductInfo: (v: ProductInfoValues) => void;
  setCategoryIds: (v: string[]) => void;
  setVariants: (v: VariantData[]) => void;
  restoreSpecs: (state: FormState<TSpecs>) => void;
  productInfo: ProductInfoValues;
  specs: TSpecs;
  categoryIds: string[];
  variants: VariantData[];
  variantsSectionRef: RefObject<VariantsSectionRef | null>;
  addOnsSectionRef: RefObject<AddOnsSectionRef | null>;
  saveFn: () => Promise<void>;
  isValid: boolean;
  specsDeps: unknown[];
}

export function useProductFormUndoRedo<TSpecs extends Record<string, unknown>>({
  isNewProduct,
  productId,
  historyKeyPrefix,
  setProductInfo,
  setCategoryIds,
  setVariants,
  restoreSpecs,
  productInfo,
  specs,
  categoryIds,
  variants,
  variantsSectionRef,
  addOnsSectionRef,
  saveFn,
  isValid,
  specsDeps,
}: UseProductFormUndoRedoOptions<TSpecs>) {
  // Add-ons mirror state (for undo history — AddOnsSection owns the source of truth)
  const [addOns, setAddOns] = useState<AddOnEntry[]>([]);
  const addOnsInitializedRef = useRef(isNewProduct);

  const formState: FormState<TSpecs> = { productInfo, ...specs, categoryIds, addOns, variants };
  const formStateRef = useRef(formState);
  formStateRef.current = formState;

  const onRestore = useCallback(
    (state: FormState<TSpecs>) => {
      setProductInfo(state.productInfo);
      setCategoryIds(state.categoryIds);
      restoreSpecs(state);
      if (state.addOns) {
        setAddOns(state.addOns);
        addOnsSectionRef.current?.restoreAddOns(state.addOns);
      }
      if (state.variants) {
        setVariants(state.variants);
        variantsSectionRef.current?.restoreVariants(state.variants);
      }
    },
    // Setters and refs are stable — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { status, undo, redo, canUndo, canRedo, markExternalSave } = useAutoSave({
    saveFn,
    isValid,
    debounceMs: 800,
    deps: isNewProduct ? [] : [productInfo, ...specsDeps, categoryIds],
    formState,
    historyKey: productId ? `${historyKeyPrefix}-${productId}` : `${historyKeyPrefix}-new`,
    onRestore,
  });

  // Add-ons change callback — creates undo snapshots for add-on mutations
  const handleAddOnsChange = useCallback((updated: AddOnEntry[]) => {
    setAddOns(updated);
    if (!addOnsInitializedRef.current) {
      addOnsInitializedRef.current = true;
      return;
    }
    if (!isNewProduct) {
      markExternalSave({ ...formStateRef.current, addOns: updated });
    }
  }, [isNewProduct, markExternalSave]);

  // Variants change callback — creates undo snapshots for variant mutations
  const handleVariantsSaved = useCallback((updatedVariants: VariantData[]) => {
    if (!isNewProduct) {
      markExternalSave({ ...formStateRef.current, variants: updatedVariants });
    }
  }, [isNewProduct, markExternalSave]);

  // Keyboard shortcuts: U = undo, Shift+U = redo (edit mode only)
  useEffect(() => {
    if (isNewProduct) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.key.toLowerCase() !== "u" || e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (document.querySelector('[data-state="open"][role="dialog"]')) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [undo, redo, isNewProduct]);

  return {
    status,
    canUndo,
    canRedo,
    undo,
    redo,
    handleAddOnsChange,
    handleVariantsSaved,
  };
}
