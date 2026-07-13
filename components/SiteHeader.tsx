'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/files', label: 'Documents' },
  { href: '/images', label: 'Images' },
  { href: '/collections', label: 'Collections' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold tracking-tight text-paper">Walkata</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-brass/70 sm:inline">
            look but don&apos;t touch
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 font-mono text-xs uppercase tracking-wider sm:gap-1">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-2 py-1.5 transition-colors sm:px-3 ${
                  active
                    ? 'bg-brass/15 text-brass'
                    : 'text-paper/55 hover:text-brass'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}