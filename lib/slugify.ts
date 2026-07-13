/**
 * Convert a title into a URL-friendly slug.
 * e.g. "My Cool Document (2024)" → "my-cool-document-2024"
 * Appends a short random suffix if needed for uniqueness.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric with hyphens (collapse runs into one)
    .replace(/[^a-z0-9]+/g, '-')
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Cap length at 80 chars
    .slice(0, 80)
    // Strip trailing hyphens again after truncation
    .replace(/-+$/, '');
}

/**
 * Generate a short random suffix (4 hex chars).
 */
function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 6);
}

/**
 * Generate a unique slug for a title.
 * Tries the clean slug first; if it conflicts, appends a short random suffix.
 * The `exists` async function should return true if the slug is already taken.
 */
export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title);
  if (!base) return randomSuffix();

  // Try the clean slug first
  if (!(await exists(base))) return base;

  // Append random suffix until unique (max 5 attempts, then just use timestamp)
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Absolute fallback — very unlikely
  return `${base}-${Date.now().toString(36)}`;
}