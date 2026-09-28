import { CanonicalMedia } from '@streaming/shared';

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  type?: string | null;
  status?: string | null;
  episodes?: number | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  score?: number | null;
  members?: number | null; // Used for popularity
  season?: string | null;
  year?: number | null;
  aired?: { from?: string | null; to?: string | null };
  genres?: Array<{ name: string }>;
  explicit_genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
}

export class MetadataNormalizer {
  public static fromJikan(anime: JikanAnime): CanonicalMedia {
    const genres = [
      ...(anime.genres || []),
      ...(anime.explicit_genres || []),
      ...(anime.themes || []),
      ...(anime.demographics || [])
    ].map(g => g.name);

    return {
      title: anime.title,
      titleEnglish: anime.title_english || null,
      titleNative: anime.title_japanese || null,
      synopsis: anime.synopsis || null,
      type: this.mapType(anime.type),
      status: this.mapStatus(anime.status),
      seasonYear: anime.year || null,
      seasonQuarter: anime.season ? anime.season.toUpperCase() : null,
      episodeCount: anime.episodes ?? null,
      coverImage: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
      bannerImage: null, // TMDB will provide this
      averageScore: anime.score ?? null,
      popularity: anime.members ?? null,
      startDate: anime.aired?.from ? new Date(anime.aired.from) : null,
      endDate: anime.aired?.to ? new Date(anime.aired.to) : null,
      genres: Array.from(new Set(genres)), // Unique
      externalIds: [
        { provider: 'jikan', externalId: anime.mal_id.toString() }
      ],
      episodes: Array.from({ length: anime.episodes || 0 }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
      }))
    };
  }

  public static fromAnilist(anime: any): CanonicalMedia {
    const genres = anime.genres || [];

    const externalIds = [{ provider: 'anilist', externalId: anime.id.toString() }];
    if (anime.idMal) {
      externalIds.push({ provider: 'jikan', externalId: anime.idMal.toString() });
    }

    return {
      title: anime.title?.romaji || anime.title?.english || 'Unknown',
      titleEnglish: anime.title?.english || null,
      titleNative: anime.title?.native || null,
      synopsis: anime.description || null,
      type: null, // Anilist format isn't strictly 'type' in this query, defaulting
      status: this.mapAnilistStatus(anime.status),
      seasonYear: null,
      seasonQuarter: null,
      episodeCount: anime.episodes || null,
      coverImage: anime.coverImage?.extraLarge || anime.coverImage?.large || null,
      bannerImage: anime.bannerImage || null,
      averageScore: anime.averageScore ? anime.averageScore / 10 : null, // Anilist is 0-100, we map to 0-10
      popularity: null,
      startDate: null,
      endDate: null,
      genres: Array.from(new Set(genres)),
      externalIds,
      episodes: Array.from({ length: anime.episodes || 0 }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
      }))
    };
  }

  private static mapAnilistStatus(status?: string | null): string {
    const s = status?.toUpperCase();
    if (s === 'RELEASING') return 'RELEASING';
    if (s === 'FINISHED') return 'FINISHED';
    if (s === 'NOT_YET_RELEASED') return 'NOT_YET_RELEASED';
    if (s === 'CANCELLED') return 'CANCELLED';
    return 'UNKNOWN';
  }

  private static mapType(jikanType?: string | null): string | null {
    const t = jikanType?.toUpperCase();
    if (t === 'TV' || t === 'MOVIE' || t === 'OVA' || t === 'ONA' || t === 'SPECIAL' || t === 'MUSIC') return t;
    return null; // Fallback
  }

  private static mapStatus(jikanStatus?: string | null): string {
    const s = jikanStatus?.toLowerCase();
    if (s?.includes('currently airing')) return 'RELEASING';
    if (s?.includes('finished airing')) return 'FINISHED';
    if (s?.includes('not yet aired')) return 'NOT_YET_RELEASED';
    if (s?.includes('paused')) return 'HIATUS';
    if (s === 'cancelled' || s === 'discontinued') return 'CANCELLED';
    return 'UNKNOWN';
  }
}
