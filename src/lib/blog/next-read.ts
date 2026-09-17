export interface BlogLikeEntry {
  data: {
    title: string;
    slug: string;
    description: string;
    datePublished: string;
    keywords: string[];
    draft: boolean;
  };
}

const DEFAULT_LIMIT = 2;

export function pickNextReads<T extends BlogLikeEntry>(
  current: T,
  all: readonly T[],
  limit: number = DEFAULT_LIMIT,
): T[] {
  const candidates = all.filter(
    (entry) => entry.data.slug !== current.data.slug && !entry.data.draft,
  );
  if (candidates.length === 0) return [];

  const currentKeywords = new Set(current.data.keywords);
  const scored = candidates.map((entry) => ({
    entry,
    overlap: entry.data.keywords.filter((k) => currentKeywords.has(k)).length,
  }));

  if (scored.some((s) => s.overlap > 0)) {
    return scored
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return dateMs(b.entry) - dateMs(a.entry);
      })
      .slice(0, limit)
      .map((s) => s.entry);
  }

  const currentMs = dateMs(current);
  return candidates
    .map((entry) => ({ entry, distance: Math.abs(dateMs(entry) - currentMs) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((d) => d.entry);
}

function dateMs(entry: BlogLikeEntry): number {
  return new Date(entry.data.datePublished).getTime();
}
