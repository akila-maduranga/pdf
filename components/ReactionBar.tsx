'use client';

import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/deviceId';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👀'];

type Props = {
  itemType: 'file' | 'image';
  itemId: string;
};

export default function ReactionBar({ itemType, itemId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch(`/api/react?itemType=${itemType}&itemId=${itemId}&deviceId=${deviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts || {});
        setMine(data.mine || null);
      })
      .finally(() => setLoading(false));
  }, [itemType, itemId]);

  async function react(emoji: string) {
    const deviceId = getDeviceId();
    const next = mine === emoji ? null : emoji;
    setMine(next);
    setCounts((prev) => {
      const updated = { ...prev };
      if (mine) updated[mine] = Math.max(0, (updated[mine] || 1) - 1);
      if (next) updated[next] = (updated[next] || 0) + 1;
      return updated;
    });
    await fetch('/api/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType, itemId, deviceId, emoji: next }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          disabled={loading}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-base transition-all active:scale-90 ${
            mine === emoji
              ? 'bg-rose text-white shadow-lg shadow-rose/30 scale-110'
              : 'bg-surface border border-border text-text-muted hover:border-rose/30 hover:text-rose-light'
          }`}
        >
          <span>{emoji}</span>
          {counts[emoji] ? <span className="font-body text-xs font-semibold">{counts[emoji]}</span> : null}
        </button>
      ))}
    </div>
  );
}