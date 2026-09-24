import { z } from 'zod';

// ══════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════

export const MediaTypeEnum = z.enum(['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC']);
export const MediaFormatEnum = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
export const MediaStatusEnum = z.enum(['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS', 'UNKNOWN']);
export const SeasonQuarterEnum = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
export const WatchStatusEnum = z.enum(['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']);
export const UserRoleEnum = z.enum(['USER', 'ADMIN']);

// ══════════════════════════════════════════
// SCHEMAS — Catalogue
// ══════════════════════════════════════════

export const MediaSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleEnglish: z.string().nullable().optional(),
  titleNative: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  type: MediaTypeEnum,
  format: MediaFormatEnum.nullable().optional(),
  status: MediaStatusEnum,
  seasonYear: z.number().nullable().optional(),
  seasonQuarter: SeasonQuarterEnum.nullable().optional(),
  episodeCount: z.number().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  bannerImage: z.string().nullable().optional(),
  averageScore: z.number().nullable().optional(),
  popularity: z.number().nullable().optional(),
});

export type Media = z.infer<typeof MediaSchema>;

export const EpisodeSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  number: z.number(),
  title: z.string().nullable().optional(),
});

export type Episode = z.infer<typeof EpisodeSchema>;

export const GenreSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Genre = z.infer<typeof GenreSchema>;

// ══════════════════════════════════════════
// SCHEMAS — Utilisateur
// ══════════════════════════════════════════

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  role: UserRoleEnum,
});

export type User = z.infer<typeof UserSchema>;

// ══════════════════════════════════════════
// SCHEMAS — Watch System
// ══════════════════════════════════════════

export const WatchProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mediaId: z.string(),
  status: WatchStatusEnum,
  lastWatchedEpNum: z.number().nullable().optional(),
});

export type WatchProgress = z.infer<typeof WatchProgressSchema>;

export const WatchHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  episodeId: z.string(),
  resumePosition: z.number(),
  completed: z.boolean(),
});

export type WatchHistory = z.infer<typeof WatchHistorySchema>;

// ══════════════════════════════════════════
// DTOs — Auth
// ══════════════════════════════════════════

export const UserLoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const UserRegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

// ══════════════════════════════════════════
// DTOs — Catalog
// ══════════════════════════════════════════

export const SearchQueryInput = z.object({
  q: z.string().optional(),
  type: MediaTypeEnum.optional(),
  status: MediaStatusEnum.optional(),
  genre: z.string().optional(),
  seasonYear: z.number().optional(),
  seasonQuarter: SeasonQuarterEnum.optional(),
  sortBy: z.enum(['title', 'score', 'popularity', 'startDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

export type SearchQuery = z.infer<typeof SearchQueryInput>;

// ══════════════════════════════════════════
// DTOs — Watch System
// ══════════════════════════════════════════

export const UpdateWatchProgressInput = z.object({
  mediaId: z.string(),
  status: WatchStatusEnum,
  lastWatchedEpNum: z.number().optional(),
});

export const UpsertWatchHistoryInput = z.object({
  episodeId: z.string(),
  resumePosition: z.number().min(0),
  completed: z.boolean().optional(),
});

// ══════════════════════════════════════════
// DTOs — Lists
// ══════════════════════════════════════════

export const ToggleMediaInput = z.object({
  mediaId: z.string(),
});

// ══════════════════════════════════════════
// DTOs — Import/Export
// ══════════════════════════════════════════

export const ExportPayloadSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: z.string(),
  checksum: z.string(),
  data: z.object({
    favorites: z.array(z.object({
      mediaTitle: z.string(),
      externalId: z.string(),
      provider: z.string(),
    })),
    watchlist: z.array(z.object({
      mediaTitle: z.string(),
      externalId: z.string(),
      provider: z.string(),
    })),
    watchProgress: z.array(z.object({
      mediaTitle: z.string(),
      status: WatchStatusEnum,
      lastEpNum: z.number().nullable(),
    })),
    watchHistory: z.array(z.object({
      mediaTitle: z.string(),
      epNumber: z.number(),
      resumePosition: z.number(),
      completed: z.boolean(),
    })),
  }),
});

export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

// ══════════════════════════════════════════
// INTERFACES — Provider / Streaming
// ══════════════════════════════════════════

export interface NormalizedStream {
  url: string;
  type: 'hls' | 'dash' | 'iframe' | 'direct';
  quality: string;
  language: 'VF' | 'VOSTFR' | 'RAW';
  server: string;
  provider: string;
  /** Only safe, public headers (Referer, Origin, Accept). Never credentials. */
  publicHeaders?: Record<string, string>;
}

export interface VideoResolver {
  resolve(episodeIdentifier: string, language: string): Promise<NormalizedStream[]>;
}

export interface ProviderComplianceCheck {
  providerId: string;
  hasOfficialApi: boolean;
  tosUrl: string;
  robotsTxtCompliant: boolean;
  requiresAuth: boolean;
  bypassesDrm: boolean;
  bypassesCaptcha: boolean;
  bypassesPaywall: boolean;
  lastVerified: Date;
  verifiedBy: string;
}

// ══════════════════════════════════════════
// INTERFACES — Metadata
// ══════════════════════════════════════════

export interface CanonicalMedia {
  title: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  synopsis?: string | null;
  type: string;
  format?: string | null;
  status: string;
  seasonYear?: number | null;
  seasonQuarter?: string | null;
  episodeCount?: number | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  genres: string[];
  externalIds: { provider: string; externalId: string }[];
}

export interface MetadataProvider {
  name: string;
  searchAnime(query: string, page?: number): Promise<CanonicalMedia[]>;
  getAnimeById(id: string): Promise<CanonicalMedia | null>;
  getTrending(page?: number): Promise<CanonicalMedia[]>;
  getSeasonal(year: number, season: string, page?: number): Promise<CanonicalMedia[]>;
  getRecommendations(id: string): Promise<CanonicalMedia[]>;
}
