import { CanonicalMedia } from '@streaming/shared';
import { AnilistService } from './anilist.service';
import { cacheQuery } from '../lib/cache';

const anilist = new AnilistService();

export class DiscoveryService {
  async getTrending(page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => anilist.getTrending(page),
      ['discovery-trending', page.toString()],
      { revalidate: 3600 } // Cache 1 hour
    );
  }

  async getPopular(page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => anilist.searchAnime('', page), // Anilist handles empty query based on trending/score
      ['discovery-popular', page.toString()],
      { revalidate: 3600 }
    );
  }

  async getSeasonal(year: number, quarter: string, page = 1): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => anilist.getSeasonal(year, quarter, page),
      ['discovery-seasonal', year.toString(), quarter, page.toString()],
      { revalidate: 21600 } // Cache 6 hours
    );
  }

  async getSimilar(mediaId: string): Promise<CanonicalMedia[]> {
    return cacheQuery(
      () => anilist.getRecommendations(mediaId),
      ['discovery-similar', mediaId],
      { revalidate: 86400 } // Cache 24 hours
    );
  }
}
