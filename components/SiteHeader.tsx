'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const LINKS = [
  { href: '/categories', label: 'Categories' },
  { href: '/files', label: 'Stories' },
  { href: '/images', label: 'Gallery' },
  { href: '/collections', label: 'Collections' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-velvet-border/30 bg-velvet-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/categories" className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-lg font-semibold tracking-tight text-velvet-text">Velvet Pages</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-rose-gold/50 sm:inline">
            private library
          </span>
        </Link>

        <div className="hidden flex-1 sm:block">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-0.5 font-mono text-xs uppercase tracking-wider sm:gap-1">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-2 py-1.5 transition-colors sm:px-3 ${
                  active
                    ? 'bg-rose-gold/15 text-rose-gold'
                    : 'text-velvet-text/50 hover:text-rose-gold'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-velvet-text/50 transition-colors hover:bg-rose-gold/15 hover:text-rose-gold sm:ml-1 sm:hidden"
            aria-label="Search"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
