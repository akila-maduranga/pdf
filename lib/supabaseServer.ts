import { createClient } from '@supabase/supabase-js';

// Server-only client. Uses the service role key so it can read/write the
// database and private storage buckets directly. This file must never be
// imported from a 'use client' component.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Return a dummy client that won't crash the app
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
    });
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export const PDF_BUCKET = process.env.SUPABASE_PDF_BUCKET || 'pdf-files';
export const IMAGE_BUCKET = process.env.SUPABASE_IMAGE_BUCKET || 'images';