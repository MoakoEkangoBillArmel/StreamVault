import { CanonicalMedia, MetadataProvider } from '@streaming/shared';
import { MetadataNormalizer, JikanAnime } from './metadata-normalizer';

class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(requestsPerSecond: number) {
    this.minIntervalMs = 1000 / requestsPerSecond;
  }

  public async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;

      if (timeSinceLast < this.minIntervalMs) {
        await new Promise(r => setTimeout(r, this.minIntervalMs - timeSinceLast));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }

    this.isProcessing = false;
  }
}

export class JikanService implements MetadataProvider {
  public name = 'jikan';
  private rateLimiter = new RateLimiter(3); // 3 requests per second limit
  private baseUrl = 'https://api.jikan.moe/v4';

  private async fetchJson<T>(path: string): Promise<T> {
    return this.rateLimiter.enqueue(async () => {
      const res = await fetch(`${this.baseUrl}${path}`);
      if (!res.ok) {
        if (res.status === 429) {
          // Could implement backoff here, but rate limiter should prevent this
          throw new Error('Jikan Rate Limit Exceeded');
        }
        throw new Error(`Jikan API Error: ${res.statusText}`);
      }
      return res.json() as Promise<T>;
    });
  }

  async searchAnime(query: string, page = 1): Promise<CanonicalMedia[]> {
    const res = await this.fetchJson<{ data: JikanAnime[] }>(`/anime?q=${encodeURIComponent(query)}&page=${page}`);
    return res.data.map(a => MetadataNormalizer.fromJikan(a));
  }

  async getAnimeById(id: string): Promise<CanonicalMedia | null> {
    try {
      const res = await this.fetchJson<{ data: JikanAnime }>(`/anime/${id}`);
      return MetadataNormalizer.fromJikan(res.data);
    } catch (e) {
      return null;
    }
  }

  async getTrending(page = 1): Promise<CanonicalMedia[]> {
    const res = await this.fetchJson<{ data: JikanAnime[] }>(`/top/anime?filter=bypopularity&page=${page}`);
    return res.data.map(a => MetadataNormalizer.fromJikan(a));
  }

  async getSeasonal(year: number, season: string, page = 1): Promise<CanonicalMedia[]> {
    const res = await this.fetchJson<{ data: JikanAnime[] }>(`/seasons/${year}/${season}?page=${page}`);
    return res.data.map(a => MetadataNormalizer.fromJikan(a));
  }

  async getRecommendations(id: string): Promise<CanonicalMedia[]> {
    const res = await this.fetchJson<{ data: Array<{ entry: JikanAnime }> }>(`/anime/${id}/recommendations`);
    // Jikan recommendations endpoint returns limited anime details inside 'entry'
    // For full details, we would need to fetch each one, but we use what we have
    return res.data.map(r => MetadataNormalizer.fromJikan(r.entry));
  }
}
