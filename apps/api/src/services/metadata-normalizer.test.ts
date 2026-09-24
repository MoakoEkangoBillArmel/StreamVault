import { describe, it, expect } from 'vitest';
import { MetadataNormalizer, JikanAnime } from './metadata-normalizer';

describe('MetadataNormalizer', () => {
  it('should transform a complete Jikan response into CanonicalMedia', () => {
    const raw: JikanAnime = {
      mal_id: 1,
      title: 'Cowboy Bebop',
      title_english: 'Cowboy Bebop',
      title_japanese: 'カウボーイビバップ',
      synopsis: 'Crime is timeless.',
      type: 'TV',
      status: 'Finished Airing',
      episodes: 26,
      images: {
        webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/4/19644l.webp' }
      },
      score: 8.75,
      members: 1771505,
      season: 'spring',
      year: 1998,
      aired: { from: '1998-04-03T00:00:00+00:00', to: '1999-04-24T00:00:00+00:00' },
      genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
    };

    const canonical = MetadataNormalizer.fromJikan(raw);

    expect(canonical.title).toBe('Cowboy Bebop');
    expect(canonical.titleEnglish).toBe('Cowboy Bebop');
    expect(canonical.type).toBe('TV');
    expect(canonical.format).toBe('TV');
    expect(canonical.status).toBe('FINISHED');
    expect(canonical.episodeCount).toBe(26);
    expect(canonical.coverImage).toBe('https://cdn.myanimelist.net/images/anime/4/19644l.webp');
    expect(canonical.averageScore).toBe(8.75);
    expect(canonical.popularity).toBe(1771505);
    expect(canonical.seasonQuarter).toBe('SPRING');
    expect(canonical.seasonYear).toBe(1998);
    expect(canonical.genres).toContain('Action');
    expect(canonical.genres).toContain('Sci-Fi');
    expect(canonical.externalIds).toEqual([{ provider: 'jikan', externalId: '1' }]);
  });

  it('should handle minimal Jikan response', () => {
    const raw: JikanAnime = {
      mal_id: 999,
      title: 'Unknown Anime',
    };

    const canonical = MetadataNormalizer.fromJikan(raw);

    expect(canonical.title).toBe('Unknown Anime');
    expect(canonical.type).toBe('TV'); // Fallback
    expect(canonical.status).toBe('UNKNOWN'); // Fallback
    expect(canonical.episodeCount).toBeNull();
    expect(canonical.genres).toEqual([]);
    expect(canonical.externalIds).toEqual([{ provider: 'jikan', externalId: '999' }]);
  });
});
