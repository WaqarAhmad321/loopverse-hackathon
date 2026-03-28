import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 lg:px-8">
        {/* Logo + tagline */}
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-block">
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-[var(--foreground)]">Loop</span>
              <span className="text-[var(--accent)]">Verse</span>
            </span>
          </Link>
          <span className="hidden text-sm text-[var(--muted)] font-body sm:inline">
            A marketplace hackathon project
          </span>
        </div>

        {/* Copyright */}
        <p className="font-body text-xs text-[var(--muted)]">
          {currentYear} LoopVerse
        </p>
      </div>
    </footer>
  );
}
