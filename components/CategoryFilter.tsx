'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Category = { id: string; name: string; slug: string };

export default function CategoryFilter({
  categories,
  basePath,
}: {
  categories: Category[];
  basePath: string;
}) {
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  if (!categories.length) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link
        href={basePath}
        className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
          !active
            ? 'border-brass bg-brass/15 text-brass'
            : 'border-line/20 text-paper/55 hover:border-line/40 hover:text-paper'
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?category=${c.slug}`}
          className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
            active === c.slug
              ? 'border-brass bg-brass/15 text-brass'
              : 'border-line/20 text-paper/55 hover:border-line/40 hover:text-paper'
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
