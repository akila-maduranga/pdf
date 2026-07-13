'use client';

import { useEffect } from 'react';

/**
 * Best-effort deterrents against casual copying: blocks the right-click
 * menu and common save/print keyboard shortcuts while this component is
 * mounted. This cannot stop a determined user (screenshots always work),
 * but it removes the one-click "Save As" / "Print" paths.
 */
export default function ViewOnlyGuard() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isSaveOrPrint = (e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(key);
      if (isSaveOrPrint) e.preventDefault();
    };
    const blockDrag = (e: DragEvent) => e.preventDefault();

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('dragstart', blockDrag);
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('dragstart', blockDrag);
    };
  }, []);

  return null;
}
