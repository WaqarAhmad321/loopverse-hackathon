"use client";

import { useState } from "react";
import { Package } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const PLACEHOLDER_GRADIENTS = [
  "from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20",
  "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20",
  "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20",
  "from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20",
];

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border bg-[var(--background-secondary,#F8FAFC)]">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            className="size-full object-cover transition-opacity duration-250 ease-out"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20">
            <Package
              className="size-16 text-muted/40"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative size-16 shrink-0 overflow-hidden rounded-[6px] border-2 transition-all duration-150 ease-out sm:size-20 ${
                i === selectedIndex
                  ? "border-accent shadow-sm"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
