import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      {/* Subtle teal gradient decoration at top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(13,148,136,0.06) 0%, transparent 100%)",
        }}
      />

      {/* Back to home */}
      <div className="relative z-10 mb-8 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--muted)] transition-colors duration-150 hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/">
          <span className="font-display text-3xl font-bold tracking-tight">
            <span className="text-[var(--foreground)]">Loop</span>
            <span className="text-[var(--accent)]">Commerce</span>
          </span>
        </Link>
      </div>

      {/* Card container */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--surface)] p-8"
        style={{
          boxShadow:
            "0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03), 0 12px 32px rgba(15,23,42,0.06)",
        }}
      >
        {children}
      </div>

      {/* Bottom subtle text */}
      <p className="relative z-10 mt-8 font-body text-xs text-[var(--muted)]">
        {new Date().getFullYear()} LoopCommerce. All rights reserved.
      </p>
    </div>
  );
}
