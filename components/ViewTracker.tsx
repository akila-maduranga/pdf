'use client';

import { useEffect, useRef } from 'react';
import { getDeviceId } from '@/lib/deviceId';

type Props = {
  itemType: 'file' | 'image';
  itemId: string;
};

export default function ViewTracker({ itemType, itemId }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const referrer = document.referrer || '';
    const cameFromThisSite = referrer.includes(window.location.host);
    // If someone landed here without coming from our own file/image gallery,
    // they followed a shared link directly (bookmark, DM, external page, etc).
    const isDirectLink = !cameFromThisSite;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType, itemId, deviceId: getDeviceId(), isDirectLink }),
    }).catch(() => {});
  }, [itemType, itemId]);

  return null;
}
