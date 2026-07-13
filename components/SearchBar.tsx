'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SearchResult = {
  type: 'file' | 'image' | 'collection';
  id: string;
  title: string;
  description: string | null;
  shareId: string;
  hasThumbnail: boolean;
  category: string | null;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
  query: string;
};

const TYPE_LABELS: Record<string, { label: string; icon: string; href: (r: SearchResult) => string }> = {
  file: {
    label: 'Story',
    icon: '📖',
    href: (r) => {
      const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
      return `/view/${r.shareId}/${slug}`;
    },
  },
  image: {
    label: 'Image',
    icon: '🖼',
    href: (r) => {
      const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
      return `/view/${r.shareId}/${slug}`;
    },
  },
  collection: {
    label: 'Collection',
    icon: '📚',
    href: (r) => {
      const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
      return `/collection/${r.shareId}/${slug}`;
    },
  },
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const instanceId = useId();
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
        signal: controller.signal,
      });
      const data: SearchResponse = await res.json();
      if (!controller.signal.aborted) {
        setResults(data.results || []);
        setTotal(data.total || 0);
        setLoading(false);
      }
    } catch {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setFocusedIndex(-1);
    setLoading(true);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      inputRef.current?.blur();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleResultClick() {
    setOpen(false);
    setQuery('');
  }

  function navigateResults(direction: 1 | -1) {
    setFocusedIndex((prev) => {
      const next = prev + direction;
      if (next < -1) return -1;
      if (next >= results.length) return results.length - 1;
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateResults(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateResults(-1);
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const r = results[focusedIndex];
      if (r) {
        const href = TYPE_LABELS[r.type].href(r);
        setOpen(false);
        setQuery('');
        router.push(href);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd/Ctrl+K global shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const showDropdown = open && (query.length >= 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-velvet-text/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stories, images, collections..."
          autoComplete="off"
          className={`w-full rounded-lg border border-velvet-border/30 bg-velvet-surface/50 py-2 pl-9 pr-16 text-sm text-velvet-text placeholder-velvet-text/30 outline-none transition-all focus:border-rose-gold/50 focus:bg-velvet-surface/80 focus:ring-1 focus:ring-rose-gold/20 sm:py-2.5 sm:pl-10 ${
            open ? 'rounded-b-none border-b-0' : ''
          }`}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${instanceId}-listbox`}
          aria-autocomplete="list"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-3 sm:flex">
          <kbd className="rounded border border-velvet-border/30 bg-velvet-bg/50 px-1.5 py-0.5 font-mono text-[10px] text-velvet-text/25">
            {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
          </kbd>
        </div>
        {query.length >= 2 && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-velvet-text/30 hover:text-velvet-text/60 sm:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          id={`${instanceId}-listbox`}
          role="listbox"
          className="absolute z-50 w-full overflow-hidden rounded-b-lg border border-t-0 border-velvet-border/30 bg-velvet-surface/95 shadow-2xl backdrop-blur-md"
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-velvet-text/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-gold/30 border-t-rose-gold" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-velvet-text/40">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-y-auto">
                {results.map((r, i) => {
                  const meta = TYPE_LABELS[r.type];
                  const href = meta.href(r);
                  return (
                    <Link
                      key={`${r.type}-${r.id}`}
                      href={href}
                      onClick={handleResultClick}
                      role="option"
                      aria-selected={i === focusedIndex}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        i === focusedIndex
                          ? 'bg-rose-gold/15'
                          : 'hover:bg-velvet-card/50'
                      }`}
                    >
                      <span className="mt-0.5 text-base">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-velvet-text/90">{r.title}</p>
                          {r.category && (
                            <span className="shrink-0 rounded-full bg-rose-gold/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-rose-gold/60">
                              {r.category}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="mt-0.5 truncate text-xs text-velvet-text/40">{r.description}</p>
                        )}
                        <span className="font-mono text-[10px] uppercase text-velvet-text/25">{meta.label}</span>
                      </div>
                      <svg className="mt-1 h-4 w-4 shrink-0 text-velvet-text/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
              {total > results.length && (
                <div className="border-t border-velvet-border/20 px-4 py-2.5">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={handleResultClick}
                    className="block text-center text-xs text-rose-gold/70 hover:text-rose-gold"
                  >
                    View all {total} results →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
