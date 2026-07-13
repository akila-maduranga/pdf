'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelect from './CategorySelect';

export default function ItemCategoryEditor({
  itemId,
  type,
  initialCategoryId,
}: {
  itemId: string;
  type: 'file' | 'image';
  initialCategoryId: string | null;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/file/${itemId}?type=${type}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: categoryId || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    router.refresh();
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-56">
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg border border-velvet-border/30 px-3 py-2.5 text-xs text-velvet-text/60 hover:border-rose-gold hover:text-rose-gold disabled:opacity-40"
      >
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
