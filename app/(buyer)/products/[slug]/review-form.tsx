"use client";

import { useState, useTransition } from "react";
import { Star, Send } from "lucide-react";
import { submitReview } from "@/actions/reviews";

interface ReviewFormProps {
  productId: string;
  productSlug: string;
}

export function ReviewForm({ productId, productSlug }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = () => {
    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a rating" });
      return;
    }

    startTransition(async () => {
      const result = await submitReview(productId, productSlug, rating, comment);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Review submitted!" });
        setComment("");
        setRating(0);
      }
    });
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="mt-6 rounded-[10px] border border-border bg-surface p-5">
      <h4 className="font-display text-base font-semibold text-foreground mb-4">
        Write a Review
      </h4>

      {/* Star rating selector */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-sm text-muted font-body mr-2">Your rating:</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform duration-100 hover:scale-110"
          >
            <Star
              className={`size-6 ${
                i < displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-muted/40"
              }`}
              strokeWidth={1.5}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm font-medium text-foreground font-body">
            {displayRating}/5
          </span>
        )}
      </div>

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        rows={3}
        className="w-full rounded-[6px] border border-[var(--field-border)] bg-[var(--field-background)] px-3.5 py-2.5 text-sm text-foreground font-body placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
      />

      {/* Submit + message */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover,#0F766E)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="size-4" />
          {isPending ? "Submitting..." : "Submit Review"}
        </button>

        {message && (
          <span
            className={`text-sm font-body ${
              message.type === "success" ? "text-success" : "text-danger"
            }`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
