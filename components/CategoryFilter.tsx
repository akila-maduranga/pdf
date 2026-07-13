'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Category = { id: string; name: string; slug: string };

function CategoryFilterInner({
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
        className={`rounded-lg px-4 py-2 font-body text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 btn-press ${
          !active
            ? 'bg-rose text-white shadow-lg shadow-rose/20'
            : 'bg-surface border border-border text-text-muted hover:border-rose/30 hover:text-rose-light'
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?category=${c.slug}`}
          className={`rounded-lg px-4 py-2 font-body text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 btn-press ${
            active === c.slug
              ? 'bg-rose text-white shadow-lg shadow-rose/20'
              : 'bg-surface border border-border text-text-muted hover:border-rose/30 hover:text-rose-light'
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

export default function CategoryFilter({
  categories,
  basePath,
}: {
  categories: Category[];
  basePath: string;
}) {
  return (
    <Suspense fallback={null}>
      <CategoryFilterInner categories={categories} basePath={basePath} />
    </Suspense>
  );
}