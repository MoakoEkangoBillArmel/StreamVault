import { describe, it, expect } from 'vitest';
import {
  // Enums
  MediaTypeEnum,
  MediaFormatEnum,
  MediaStatusEnum,
  SeasonQuarterEnum,
  WatchStatusEnum,
  UserRoleEnum,
  // Schemas
  MediaSchema,
  EpisodeSchema,
  GenreSchema,
  UserSchema,
  WatchProgressSchema,
  WatchHistorySchema,
  // DTOs
  UserLoginInput,
  UserRegisterInput,
  SearchQueryInput,
  UpdateWatchProgressInput,
  UpsertWatchHistoryInput,
  ToggleMediaInput,
  ExportPayloadSchema,
} from './types';

// ══════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════

describe('Enums', () => {
  it('MediaTypeEnum accepts valid values', () => {
    expect(MediaTypeEnum.parse('TV')).toBe('TV');
    expect(MediaTypeEnum.parse('MOVIE')).toBe('MOVIE');
    expect(MediaTypeEnum.parse('OVA')).toBe('OVA');
    expect(MediaTypeEnum.parse('ONA')).toBe('ONA');
    expect(MediaTypeEnum.parse('SPECIAL')).toBe('SPECIAL');
    expect(MediaTypeEnum.parse('MUSIC')).toBe('MUSIC');
  });

  it('MediaTypeEnum rejects invalid values', () => {
    expect(() => MediaTypeEnum.parse('SERIES')).toThrow();
    expect(() => MediaTypeEnum.parse('EPISODE')).toThrow();
    expect(() => MediaTypeEnum.parse('')).toThrow();
  });

  it('MediaStatusEnum accepts all valid statuses', () => {
    expect(MediaStatusEnum.parse('RELEASING')).toBe('RELEASING');
    expect(MediaStatusEnum.parse('FINISHED')).toBe('FINISHED');
    expect(MediaStatusEnum.parse('NOT_YET_RELEASED')).toBe('NOT_YET_RELEASED');
    expect(MediaStatusEnum.parse('CANCELLED')).toBe('CANCELLED');
    expect(MediaStatusEnum.parse('HIATUS')).toBe('HIATUS');
    expect(MediaStatusEnum.parse('UNKNOWN')).toBe('UNKNOWN');
  });

  it('SeasonQuarterEnum accepts all quarters', () => {
    expect(SeasonQuarterEnum.parse('WINTER')).toBe('WINTER');
    expect(SeasonQuarterEnum.parse('SPRING')).toBe('SPRING');
    expect(SeasonQuarterEnum.parse('SUMMER')).toBe('SUMMER');
    expect(SeasonQuarterEnum.parse('FALL')).toBe('FALL');
  });

  it('WatchStatusEnum accepts all watch statuses', () => {
    expect(WatchStatusEnum.parse('PLAN_TO_WATCH')).toBe('PLAN_TO_WATCH');
    expect(WatchStatusEnum.parse('WATCHING')).toBe('WATCHING');
    expect(WatchStatusEnum.parse('COMPLETED')).toBe('COMPLETED');
    expect(WatchStatusEnum.parse('ON_HOLD')).toBe('ON_HOLD');
    expect(WatchStatusEnum.parse('DROPPED')).toBe('DROPPED');
  });

  it('WatchStatusEnum rejects old values', () => {
    expect(() => WatchStatusEnum.parse('TOWATCH')).toThrow();
  });

  it('UserRoleEnum accepts USER and ADMIN', () => {
    expect(UserRoleEnum.parse('USER')).toBe('USER');
    expect(UserRoleEnum.parse('ADMIN')).toBe('ADMIN');
  });

  it('MediaFormatEnum accepts all formats', () => {
    for (const f of ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']) {
      expect(MediaFormatEnum.parse(f)).toBe(f);
    }
  });
});

// ══════════════════════════════════════════
// ENTITY SCHEMAS
// ══════════════════════════════════════════

describe('MediaSchema', () => {
  const validMedia = {
    id: 'clx1234',
    title: 'Naruto Shippuden',
    type: 'TV',
    status: 'FINISHED',
  };

  it('accepts minimal valid media', () => {
    expect(MediaSchema.parse(validMedia)).toMatchObject(validMedia);
  });

  it('accepts fully populated media', () => {
    const full = {
      ...validMedia,
      titleEnglish: 'Naruto Shippuden',
      titleNative: 'ナルト 疾風伝',
      synopsis: 'A ninja story',
      format: 'TV',
      seasonYear: 2007,
      seasonQuarter: 'WINTER',
      episodeCount: 500,
      coverImage: 'https://example.com/cover.jpg',
      bannerImage: 'https://example.com/banner.jpg',
      averageScore: 8.5,
      popularity: 100000,
    };
    expect(MediaSchema.parse(full)).toMatchObject(full);
  });

  it('rejects media without title', () => {
    expect(() => MediaSchema.parse({ id: 'x', type: 'TV', status: 'UNKNOWN' })).toThrow();
  });

  it('rejects media with invalid type', () => {
    expect(() => MediaSchema.parse({ ...validMedia, type: 'SERIES' })).toThrow();
  });
});

describe('EpisodeSchema', () => {
  it('accepts valid episode', () => {
    const ep = { id: 'ep1', mediaId: 'media1', number: 1 };
    expect(EpisodeSchema.parse(ep)).toMatchObject(ep);
  });

  it('accepts episode with title', () => {
    const ep = { id: 'ep1', mediaId: 'media1', number: 1, title: 'Pilot' };
    expect(EpisodeSchema.parse(ep)).toMatchObject(ep);
  });

  it('rejects episode without number', () => {
    expect(() => EpisodeSchema.parse({ id: 'ep1', mediaId: 'media1' })).toThrow();
  });
});

describe('GenreSchema', () => {
  it('accepts valid genre', () => {
    expect(GenreSchema.parse({ id: 'g1', name: 'Action' })).toMatchObject({ id: 'g1', name: 'Action' });
  });
});

describe('UserSchema', () => {
  it('accepts valid user', () => {
    const u = { id: 'u1', email: 'test@test.com', role: 'USER' };
    expect(UserSchema.parse(u)).toMatchObject(u);
  });

  it('rejects invalid email', () => {
    expect(() => UserSchema.parse({ id: 'u1', email: 'not-email', role: 'USER' })).toThrow();
  });
});

describe('WatchProgressSchema', () => {
  it('accepts valid watch progress', () => {
    const wp = { id: 'wp1', userId: 'u1', mediaId: 'm1', status: 'WATCHING' };
    expect(WatchProgressSchema.parse(wp)).toMatchObject(wp);
  });

  it('accepts with lastWatchedEpNum', () => {
    const wp = { id: 'wp1', userId: 'u1', mediaId: 'm1', status: 'WATCHING', lastWatchedEpNum: 4 };
    expect(WatchProgressSchema.parse(wp)).toMatchObject(wp);
  });
});

describe('WatchHistorySchema', () => {
  it('accepts valid watch history', () => {
    const wh = { id: 'wh1', userId: 'u1', episodeId: 'ep1', resumePosition: 834, completed: false };
    expect(WatchHistorySchema.parse(wh)).toMatchObject(wh);
  });
});

// ══════════════════════════════════════════
// DTOs
// ══════════════════════════════════════════

describe('UserLoginInput', () => {
  it('accepts valid login', () => {
    expect(UserLoginInput.parse({ email: 'a@b.com', password: '123456' }))
      .toMatchObject({ email: 'a@b.com', password: '123456' });
  });

  it('rejects short password', () => {
    expect(() => UserLoginInput.parse({ email: 'a@b.com', password: '12345' })).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => UserLoginInput.parse({ email: 'bad', password: '123456' })).toThrow();
  });
});

describe('UserRegisterInput', () => {
  it('accepts valid registration', () => {
    const input = { email: 'a@b.com', password: '123456', name: 'Alice' };
    expect(UserRegisterInput.parse(input)).toMatchObject(input);
  });

  it('accepts registration without name', () => {
    expect(UserRegisterInput.parse({ email: 'a@b.com', password: '123456' }))
      .toMatchObject({ email: 'a@b.com' });
  });
});

describe('SearchQueryInput', () => {
  it('accepts empty search (defaults applied)', () => {
    const result = SearchQueryInput.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('accepts full search params', () => {
    const input = {
      q: 'Naruto',
      type: 'TV',
      status: 'FINISHED',
      genre: 'Action',
      seasonYear: 2007,
      seasonQuarter: 'WINTER',
      sortBy: 'score',
      sortOrder: 'desc',
      page: 2,
      limit: 10,
    };
    expect(SearchQueryInput.parse(input)).toMatchObject(input);
  });

  it('rejects page < 1', () => {
    expect(() => SearchQueryInput.parse({ page: 0 })).toThrow();
  });

  it('rejects limit > 50', () => {
    expect(() => SearchQueryInput.parse({ limit: 51 })).toThrow();
  });
});

describe('UpdateWatchProgressInput', () => {
  it('accepts valid input', () => {
    const input = { mediaId: 'm1', status: 'WATCHING', lastWatchedEpNum: 3 };
    expect(UpdateWatchProgressInput.parse(input)).toMatchObject(input);
  });
});

describe('UpsertWatchHistoryInput', () => {
  it('accepts valid input', () => {
    const input = { episodeId: 'ep1', resumePosition: 120, completed: false };
    expect(UpsertWatchHistoryInput.parse(input)).toMatchObject(input);
  });

  it('rejects negative resumePosition', () => {
    expect(() => UpsertWatchHistoryInput.parse({ episodeId: 'ep1', resumePosition: -1 })).toThrow();
  });
});

describe('ToggleMediaInput', () => {
  it('accepts valid mediaId', () => {
    expect(ToggleMediaInput.parse({ mediaId: 'm1' })).toMatchObject({ mediaId: 'm1' });
  });
});

describe('ExportPayloadSchema', () => {
  it('accepts valid export payload', () => {
    const payload = {
      schemaVersion: '1.0.0',
      exportedAt: '2026-09-24T22:00:00Z',
      checksum: 'abc123def456',
      data: {
        favorites: [{ mediaTitle: 'Naruto', externalId: '20', provider: 'jikan' }],
        watchlist: [],
        watchProgress: [{ mediaTitle: 'Naruto', status: 'WATCHING', lastEpNum: 4 }],
        watchHistory: [{ mediaTitle: 'Naruto', epNumber: 4, resumePosition: 834, completed: false }],
      },
    };
    expect(ExportPayloadSchema.parse(payload)).toMatchObject(payload);
  });

  it('rejects payload without schemaVersion', () => {
    expect(() => ExportPayloadSchema.parse({
      exportedAt: '2026-09-24T22:00:00Z',
      checksum: 'abc',
      data: { favorites: [], watchlist: [], watchProgress: [], watchHistory: [] },
    })).toThrow();
  });

  it('rejects payload with invalid watchStatus in watchProgress', () => {
    expect(() => ExportPayloadSchema.parse({
      schemaVersion: '1.0.0',
      exportedAt: '2026-09-24T22:00:00Z',
      checksum: 'abc',
      data: {
        favorites: [],
        watchlist: [],
        watchProgress: [{ mediaTitle: 'X', status: 'INVALID', lastEpNum: 1 }],
        watchHistory: [],
      },
    })).toThrow();
  });
});
