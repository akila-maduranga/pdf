'use client';

import { v4 as uuidv4 } from 'uuid';

const KEY = 'vr_device_id';

// Anonymous, per-browser identifier used only to (a) stop the same device
// from inflating view counts on every re-render and (b) let a device change
// its own emoji reaction instead of stacking duplicates. Not tied to any
// personal info.
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(KEY, id);
  }
  return id;
}
