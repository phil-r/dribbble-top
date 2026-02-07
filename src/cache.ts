export function createTtlCache<T>(
  loader: () => Promise<T>,
  ttlMs: number
): () => Promise<T> {
  let cacheValue: T | undefined;
  let cacheTime = 0;
  let inflight: Promise<T> | null = null;

  return async () => {
    const now = Date.now();
    const hasFreshValue = cacheValue !== undefined && now - cacheTime < ttlMs;
    if (hasFreshValue && cacheValue !== undefined) {
      return cacheValue;
    }

    if (inflight) {
      return inflight;
    }

    inflight = loader()
      .then((value) => {
        cacheValue = value;
        cacheTime = Date.now();
        return value;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  };
}
