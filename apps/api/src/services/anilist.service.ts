import { CanonicalMedia, MetadataProvider } from '@streaming/shared';
import { MetadataNormalizer } from './metadata-normalizer';

class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(requestsPerMinute: number) {
    this.minIntervalMs = (60 * 1000) / requestsPerMinute;
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

export class AnilistService implements MetadataProvider {
  public name = 'anilist';
  private rateLimiter = new RateLimiter(90);
  private endpoint = 'https://graphql.anilist.co';

  private async queryGraphQL(query: string, variables?: any): Promise<any> {
    return this.rateLimiter.enqueue(async () => {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Anilist API Error: ${res.statusText}`);
      }

      const json = (await res.json()) as any;
      if (json.errors) {
        throw new Error(`Anilist GraphQL Error: ${json.errors[0].message}`);
      }

      return json.data;
    });
  }

  async searchAnime(query: string, page = 1): Promise<CanonicalMedia[]> {
    const q = `
      query ($query: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          media(search: $query, type: ANIME, isAdult: false) {
            id
            idMal
            title { romaji english native }
            description
            coverImage { extraLarge large }
            bannerImage
            episodes
            status
            genres
            averageScore
          }
        }
      }
    `;
    const data = await this.queryGraphQL(q, { query, page });
    return data.Page.media.map((m: any) => MetadataNormalizer.fromAnilist(m));
  }

  async getAnimeById(id: string): Promise<CanonicalMedia | null> {
    const q = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { romaji english native }
          description
          coverImage { extraLarge large }
          bannerImage
          episodes
          status
          genres
          averageScore
        }
      }
    `;
    try {
      const data = await this.queryGraphQL(q, { id: parseInt(id) });
      return MetadataNormalizer.fromAnilist(data.Media);
    } catch {
      return null;
    }
  }

  async getTrending(page = 1): Promise<CanonicalMedia[]> {
    const q = `
      query ($page: Int) {
        Page(page: $page, perPage: 20) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            idMal
            title { romaji english native }
            description
            coverImage { extraLarge large }
            bannerImage
            episodes
            status
            genres
            averageScore
          }
        }
      }
    `;
    const data = await this.queryGraphQL(q, { page });
    return data.Page.media.map((m: any) => MetadataNormalizer.fromAnilist(m));
  }

  async getSeasonal(year: number, season: string, page = 1): Promise<CanonicalMedia[]> {
    const anilistSeason = season.toUpperCase();
    const q = `
      query ($season: MediaSeason, $seasonYear: Int, $page: Int) {
        Page(page: $page, perPage: 20) {
          media(type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: false) {
            id
            idMal
            title { romaji english native }
            description
            coverImage { extraLarge large }
            bannerImage
            episodes
            status
            genres
            averageScore
          }
        }
      }
    `;
    const data = await this.queryGraphQL(q, { season: anilistSeason, seasonYear: year, page });
    return data.Page.media.map((m: any) => MetadataNormalizer.fromAnilist(m));
  }

  async getRecommendations(id: string): Promise<CanonicalMedia[]> {
    const q = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(sort: RATING_DESC) {
            edges {
              node {
                mediaRecommendation {
                  id
                  idMal
                  title { romaji english native }
                  description
                  coverImage { extraLarge large }
                  bannerImage
                  episodes
                  status
                  genres
                  averageScore
                }
              }
            }
          }
        }
      }
    `;
    try {
      const data = await this.queryGraphQL(q, { id: parseInt(id) });
      const recs = data.Media.recommendations.edges.map((e: any) => e.node.mediaRecommendation);
      return recs.filter(Boolean).map((m: any) => MetadataNormalizer.fromAnilist(m));
    } catch {
      return [];
    }
  }
}
