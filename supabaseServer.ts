/**
 * Convert a title into a URL-friendly slug.
 * e.g. "My Cool Document (2024)" → "my-cool-document-2024"
 * Appends a short random suffix if needed for uniqueness.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 6);
}

/**
 * Generate a unique slug for a title.
 * Tries the clean slug first; if it conflicts, appends a short random suffix.
 */
export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title);
  if (!base) return randomSuffix();

  if (!(await exists(base))) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}