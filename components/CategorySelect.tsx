'use client';

import { useEffect, useState } from 'react';

type Category = { id: string; name: string; slug: string };

type Props = {
  name?: string;
  value?: string;
  onChange?: (categoryId: string) => void;
};

export default function CategorySelect({ name = 'categoryId', value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState(value || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  async function load() {
    const res = await fetch('/api/admin/categories');
    const data = await res.json().catch(() => ({}));
    setCategories(data.categories || []);
  }

  function handleSelect(v: string) {
    setSelected(v);
    onChange?.(v);
  }

  async function createCategory() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusy(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && data.category) {
      setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      handleSelect(data.category.id);
      setNewName('');
      setAdding(false);
    }
  }

  return (
    <div>
      <label className="block text-text-dim text-xs">Category</label>
      {!adding ? (
        <div className="mt-1 flex gap-2">
          <select
            name={name}
            value={selected}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text outline-none focus:border-rose/40 transition-all"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-text-muted hover:text-gold hover:border-gold/30 transition-colors btn-press"
          >
            + New
          </button>
        </div>
      ) : (
        <div className="mt-1 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createCategory();
              }
            }}
            placeholder="New category name"
            className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 transition-all"
          />
          <button
            type="button"
            onClick={createCategory}
            disabled={busy || !newName.trim()}
            className="shrink-0 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-bg hover:bg-gold-light disabled:opacity-40 transition-colors btn-press"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="shrink-0 rounded-lg border border-border px-2 py-2 text-xs text-text-dim hover:text-text transition-colors btn-press"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}