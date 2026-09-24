import { CanonicalMedia } from '@streaming/shared';
import { JikanService } from './jikan.service';
import { cacheQuery } from '../lib/cache';

const jikan = new JikanService();

export class DiscoveryService {
  async getTrending(page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => jikan.getTrending(page),
      ['discovery-trending', page.toString()],
      { revalidate: 3600 } // Cache 1 hour
    );
  }

  async getPopular(page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => jikan.searchAnime('', page), // Jikan default search order is popularity
      ['discovery-popular', page.toString()],
      { revalidate: 3600 }
    );
  }

  async getSeasonal(year: number, quarter: string, page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => jikan.getSeasonal(year, quarter.toLowerCase(), page),
      ['discovery-seasonal', year.toString(), quarter, page.toString()],
      { revalidate: 21600 } // Cache 6 hours
    );
  }

  async getSimilar(mediaId: string): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => jikan.getRecommendations(mediaId),
      ['discovery-similar', mediaId],
      { revalidate: 86400 } // Cache 24 hours
    );
  }
}
