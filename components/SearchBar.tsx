'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';

function SearchBarInner({ placeholder = 'Search...' }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const updateSearch = useCallback((value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => updateSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-surface border border-border pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all"
      />
      {query && (
        <button
          onClick={() => updateSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function SearchBar({ placeholder = 'Search...' }: { placeholder?: string }) {
  return (
    <Suspense fallback={
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="w-full rounded-xl bg-surface border border-border pl-10 pr-4 py-2.5 text-sm text-text-dim h-10" />
      </div>
    }>
      <SearchBarInner placeholder={placeholder} />
    </Suspense>
  );
}