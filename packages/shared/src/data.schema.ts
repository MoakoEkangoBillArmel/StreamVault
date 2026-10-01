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
  lastWatchedEpNum: z.number().nullable().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ExportedWatchHistorySchema = z.object({
  mediaId: z.string(),
  episodeNumber: z.number(),
  resumePosition: z.number().default(0),
  completed: z.boolean().default(false),
  watchedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const DataExportPayloadSchema = z.object({
  format: z.literal('streamvault-export'),
  version: z.literal(ExportFormatVersion),
  exportedAt: z.string().datetime(),
  user: z.object({
    email: z.string().email(),
    name: z.string().nullable().optional(),
  }),
  favorites: z.array(ExportedFavoriteSchema),
  watchlist: z.array(ExportedWatchlistItemSchema),
  progress: z.array(ExportedWatchProgressSchema),
  history: z.array(ExportedWatchHistorySchema),
});

export type DataExportPayload = z.infer<typeof DataExportPayloadSchema>;
