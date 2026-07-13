'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CategorySelect from './CategorySelect';

type Part = {
  id: number;
  itemType: 'file' | 'image';
  itemId: string;
  partNumber: number;
  title: string;
  shareId: string | null;
};

type PickerItem = { id: string; title: string; type: 'file' | 'image' };

export default function CollectionEditor({ collectionId }: { collectionId: string }) {
  const [collection, setCollection] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<PickerItem[]>([]);
  const [pickerValue, setPickerValue] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    load();
    loadPicker();
  }, [collectionId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/collections/${collectionId}`);
    const data = await res.json().catch(() => ({}));
    if (data.collection) {
      setCollection(data.collection);
      setTitle(data.collection.title || '');
      setDescription(data.collection.description || '');
      setCategoryId(data.collection.category_id || '');
    }
    setParts(data.items || []);
    setLoading(false);
  }

  async function loadPicker() {
    const [fRes, iRes] = await Promise.all([
      fetch('/api/admin/picker?type=file'),
      fetch('/api/admin/picker?type=image'),
    ]);
    const fData = await fRes.json().catch(() => ({ items: [] }));
    const iData = await iRes.json().catch(() => ({ items: [] }));
    setPicker([
      ...(fData.items || []).map((i: any) => ({ ...i, type: 'file' as const })),
      ...(iData.items || []).map((i: any) => ({ ...i, type: 'image' as const })),
    ]);
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    await fetch(`/api/admin/collections/${collectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, categoryId: categoryId || null }),
    });
    setSavingMeta(false);
    load();
  }

  async function addPart() {
    if (!pickerValue) return;
    const [type, id] = pickerValue.split(':');
    await fetch(`/api/admin/collections/${collectionId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: type, itemId: id }),
    });
    setPickerValue('');
    load();
  }

  async function removePart(itemId: number) {
    await fetch(`/api/admin/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' });
    load();
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...parts];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setParts(next);
    await fetch(`/api/admin/collections/${collectionId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((p) => p.id) }),
    });
    load();
  }

  const addedIds = new Set(parts.map((p) => `${p.itemType}:${p.itemId}`));
  const availableToAdd = picker.filter((p) => !addedIds.has(`${p.type}:${p.id}`));

  if (loading) return <p className="text-sm text-paper/40">Loading…</p>;
  if (!collection) return <p className="text-sm text-rust">Collection not found.</p>;

  return (
    <div className="space-y-8">
      <form onSubmit={saveMeta} className="rounded border border-line/15 bg-white/[0.02] p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-brass">Details</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass sm:col-span-2"
          />
          <CategorySelect value={categoryId} onChange={setCategoryId} />
        </div>
        <button
          type="submit"
          disabled={savingMeta}
          className="mt-4 rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-40"
        >
          {savingMeta ? 'Saving…' : 'Save details'}
        </button>
        <p className="mt-3 font-mono text-xs text-paper/40">
          Share link: <span className="text-brass">/collection/{collection.share_id}</span>
        </p>
      </form>

      <div className="rounded border border-line/15 bg-white/[0.02] p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-brass">Add a part</p>
        <div className="mt-3 flex gap-2">
          <select
            value={pickerValue}
            onChange={(e) => setPickerValue(e.target.value)}
            className="w-full rounded border border-line/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brass"
          >
            <option value="">Choose a document or image…</option>
            {availableToAdd.map((item) => (
              <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                [{item.type === 'file' ? 'Document' : 'Image'}] {item.title}
              </option>
            ))}
          </select>
          <button
            onClick={addPart}
            disabled={!pickerValue}
            className="shrink-0 rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
          Parts, in order ({parts.length})
        </p>
        {!parts.length ? (
          <p className="mt-3 text-sm text-paper/40">No parts added yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-line/10 rounded border border-line/15">
            {parts.map((part, index) => (
              <div key={part.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line/20 font-mono text-xs text-paper/60">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-paper/85">{part.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-paper/35">
                      {part.itemType === 'file' ? 'Document' : 'Image'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded border border-line/20 px-2 py-1 text-xs text-paper/60 hover:border-brass hover:text-brass disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === parts.length - 1}
                    className="rounded border border-line/20 px-2 py-1 text-xs text-paper/60 hover:border-brass hover:text-brass disabled:opacity-30"
                  >
                    ↓
                  </button>
                  {part.shareId ? (
                    <Link
                      href={`/view/${part.shareId}`}
                      target="_blank"
                      className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-brass hover:text-brass"
                    >
                      View
                    </Link>
                  ) : null}
                  <button
                    onClick={() => removePart(part.id)}
                    className="rounded border border-line/20 px-2.5 py-1 text-xs text-paper/60 hover:border-rust hover:text-rust"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
