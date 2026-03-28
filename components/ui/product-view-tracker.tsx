"use client";

import { useEffect, useRef } from "react";
import { trackProductView } from "@/actions/recommendations";

interface ProductViewTrackerProps {
  productId: string;
  categoryId: string;
}

/**
 * Invisible component that tracks a product view on mount.
 * Ensures the view is only tracked once per mount.
 */
export function ProductViewTracker({
  productId,
  categoryId,
}: ProductViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    trackProductView(productId, categoryId).catch(() => {
      // Non-critical — silently fail
    });
  }, [productId, categoryId]);

  return null;
}
