import Link from "next/link";
import { Separator } from "@heroui/react";
import { CreditCard, Shield, Truck } from "lucide-react";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Returns", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Twitter / X", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--field-background)]">
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-8">
        {/* Top section: Logo + columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link href="/" className="inline-block">
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="text-[var(--foreground)]">Loop</span>
                <span className="text-[var(--accent)]">Verse</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[var(--muted)] font-body leading-relaxed max-w-[240px]">
              A trusted multi-vendor marketplace connecting buyers with quality sellers worldwide.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-sm font-semibold text-[var(--foreground)] mb-3">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-[var(--muted)] transition-colors duration-150 hover:text-[var(--foreground)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-body text-xs text-[var(--muted)]">
            {currentYear} LoopVerse. All rights reserved.
          </p>

          {/* Payment / trust icons */}
          <div className="flex items-center gap-4 text-[var(--muted)]">
            <div className="flex items-center gap-1.5 text-xs font-body">
              <Shield className="size-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-body">
              <CreditCard className="size-4" />
              <span>Stripe</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-body">
              <Truck className="size-4" />
              <span>Tracked</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
