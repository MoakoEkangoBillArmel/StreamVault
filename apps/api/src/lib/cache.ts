/**
 * Cache abstraction layer.
 * 
 * Currently uses Next.js 15.3.9 `unstable_cache`.
 * When migrating to Next.js 16+ with `use cache`, only this file needs updating.
 */
import { unstable_cache } from 'next/cache';

export function cacheQuery<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] } = {}
): Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: options.revalidate ?? 3600,
    tags: options.tags,
  })();
}
