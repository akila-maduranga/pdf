import { supabaseServer, PDF_BUCKET, IMAGE_BUCKET } from '@/lib/supabaseServer';

// Cloudflare R2 helpers.
//
// Files and images are no longer uploaded to Supabase Storage. Instead the
// admin pastes a Cloudflare R2 URL (public bucket URL, r2.dev URL, or custom
// domain). The URL is stored in the existing `storage_path` / `thumbnail_path`
// columns (both are plain `text`, so no schema change is needed).
//
// The server still proxies the bytes through /api/file-stream, /api/image-stream
// and /api/thumb, so the browser never receives the raw R2 URL.

/**
 * Optional comma-separated allowlist of hostnames, e.g.
 *   R2_ALLOWED_HOSTS=pub-xxxx.r2.dev,files.example.com
 * Leave unset to accept any https URL on an r2.dev / r2.cloudflarestorage.com
 * host plus anything else you paste (admin-only).
 */
function allowedHosts(): string[] {
  return (process.env.R2_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isRemoteUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

/** Returns the cleaned URL, or null if it is not an acceptable R2 URL. */
export function normalizeR2Url(raw: string | null | undefined): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const allow = allowedHosts();
  if (allow.length && !allow.includes(url.hostname.toLowerCase())) return null;

  return url.toString();
}

export type FetchedObject = {
  body: ReadableStream<Uint8Array> | null;
  contentType: string | null;
  contentLength: string | null;
};

/**
 * Fetch a stored object. R2 URLs are fetched server-side. Rows created before
 * the R2 switch (plain storage paths) fall back to Supabase Storage so
 * existing content keeps working.
 */
export async function fetchStored(
  stored: string,
  kind: 'file' | 'image'
): Promise<FetchedObject | null> {
  if (isRemoteUrl(stored)) {
    const res = await fetch(stored, { cache: 'no-store' });
    if (!res.ok || !res.body) return null;
    return {
      body: res.body,
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
    };
  }

  // Legacy Supabase object
  const supabase = supabaseServer();
  const bucket = kind === 'file' ? PDF_BUCKET : IMAGE_BUCKET;
  const { data: blob, error } = await supabase.storage.from(bucket).download(stored);
  if (error || !blob) return null;
  return {
    body: blob.stream() as ReadableStream<Uint8Array>,
    contentType: blob.type || null,
    contentLength: String(blob.size),
  };
}

/** Guess an image content type from a URL/path extension (ignores ?query). */
export function imageTypeFor(pathOrUrl: string, upstream?: string | null): string {
  if (upstream && upstream.startsWith('image/')) return upstream;
  const clean = pathOrUrl.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'avif': return 'image/avif';
    case 'svg': return 'image/svg+xml';
    default: return 'image/jpeg';
  }
}
