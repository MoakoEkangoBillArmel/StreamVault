import { z } from 'zod';

export const ExportFormatVersion = 1;

export const ExportedFavoriteSchema = z.object({
  mediaId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const ExportedWatchlistItemSchema = z.object({
  mediaId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const ExportedWatchProgressSchema = z.object({
  mediaId: z.string(),
  status: z.enum(['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']),
  lastWatchedEpNum: z.number().int().min(1).nullable().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ExportedWatchHistorySchema = z.object({
  mediaId: z.string(),
  episodeNumber: z.number().int().min(1),
  resumePosition: z.number().min(0).default(0),
  completed: z.boolean().default(false),
  watchedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const DataExportPayloadSchema = z.object({
  format: z.literal('streamvault-export'),
  version: z.number().int(),
  exportedAt: z.string().datetime(),
  user: z.object({
    email: z.string().email(),
    name: z.string().nullable().optional(),
  }),
  favorites: z.array(ExportedFavoriteSchema).max(5000),
  watchlist: z.array(ExportedWatchlistItemSchema).max(5000),
  progress: z.array(ExportedWatchProgressSchema).max(5000),
  history: z.array(ExportedWatchHistorySchema).max(10000),
});

export type DataExportPayload = z.infer<typeof DataExportPayloadSchema>;
