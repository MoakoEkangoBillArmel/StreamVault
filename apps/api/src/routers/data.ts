import { router, protectedProcedure } from '../trpc/trpc';
import { DataExportPayloadSchema, ExportFormatVersion } from '@streaming/shared';
import { TRPCError } from '@trpc/server';

export const dataRouter = router({
  export: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Fetch user basic data
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    const favorites = await ctx.prisma.favorite.findMany({ where: { userId } });
    const watchlist = await ctx.prisma.watchlistItem.findMany({ where: { userId } });
    const progress = await ctx.prisma.watchProgress.findMany({ where: { userId } });
    const historyRaw = await ctx.prisma.watchHistory.findMany({
      where: { userId },
      include: { episode: true },
    });

    return {
      format: 'streamvault-export',
      version: ExportFormatVersion,
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
      },
      favorites: favorites.map((f) => ({
        mediaId: f.mediaId,
        createdAt: f.createdAt.toISOString(),
      })),
      watchlist: watchlist.map((w) => ({
        mediaId: w.mediaId,
        createdAt: w.createdAt.toISOString(),
      })),
      progress: progress.map((p) => ({
        mediaId: p.mediaId,
        status: p.status,
        lastWatchedEpNum: p.lastWatchedEpNum,
        updatedAt: p.updatedAt.toISOString(),
      })),
      history: historyRaw.map((h) => ({
        mediaId: h.episode.mediaId,
        episodeNumber: h.episode.number,
        resumePosition: h.resumePosition,
        completed: h.completed,
        watchedAt: h.watchedAt.toISOString(),
        updatedAt: h.updatedAt.toISOString(),
      })),
    };
  }),

  previewImport: protectedProcedure
    .input(DataExportPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Version validation
      if (input.version !== ExportFormatVersion) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported format version: ${input.version}`,
        });
      }

      // Check which media actually exist in our DB
      const allMediaIds = new Set([
        ...input.favorites.map((f) => f.mediaId),
        ...input.watchlist.map((w) => w.mediaId),
        ...input.progress.map((p) => p.mediaId),
        ...input.history.map((h) => h.mediaId),
      ]);

      const existingMedia = allMediaIds.size > 0 ? await ctx.prisma.media.findMany({
        where: { id: { in: Array.from(allMediaIds) } },
        select: { id: true },
      }) : [];
      const validMediaIds = new Set(existingMedia.map((m) => m.id));

      let errors = 0;
      let ignored = 0;
      let newItems = 0;
      let duplicates = 0;

      const userId = ctx.user.id;
      const [currentFavs, currentWatch, currentProg, currentHist] = await Promise.all([
        ctx.prisma.favorite.findMany({ where: { userId }, select: { mediaId: true } }),
        ctx.prisma.watchlistItem.findMany({ where: { userId }, select: { mediaId: true } }),
        ctx.prisma.watchProgress.findMany({ where: { userId }, select: { mediaId: true } }),
        ctx.prisma.watchHistory.findMany({ where: { userId }, include: { episode: true } }),
      ]);

      const currentFavSet = new Set(currentFavs.map((f) => f.mediaId));
      const currentWatchSet = new Set(currentWatch.map((w) => w.mediaId));
      const currentProgSet = new Set(currentProg.map((p) => p.mediaId));
      const currentHistSet = new Set(currentHist.map((h) => `${h.episode.mediaId}-${h.episode.number}`));

      input.favorites.forEach((f) => {
        if (!validMediaIds.has(f.mediaId)) {
          ignored++;
          errors++;
        } else if (currentFavSet.has(f.mediaId)) {
          duplicates++;
        } else {
          newItems++;
        }
      });

      input.watchlist.forEach((w) => {
        if (!validMediaIds.has(w.mediaId)) {
          ignored++;
          errors++;
        } else if (currentWatchSet.has(w.mediaId)) {
          duplicates++;
        }
      });

      input.progress.forEach((p) => {
        if (!validMediaIds.has(p.mediaId)) {
          ignored++;
          errors++;
        } else if (currentProgSet.has(p.mediaId)) {
          duplicates++;
        }
      });

      input.history.forEach((h) => {
        if (!validMediaIds.has(h.mediaId)) {
          ignored++;
          errors++;
        } else if (currentHistSet.has(`${h.mediaId}-${h.episodeNumber}`)) {
          duplicates++;
        }
      });

      const totalItems = input.favorites.length + input.watchlist.length + input.progress.length + input.history.length;

      return {
        totalItems,
        favoritesCount: input.favorites.length,
        watchlistCount: input.watchlist.length,
        progressCount: input.progress.length,
        historyCount: input.history.length,
        newItems,
        duplicates,
        ignored,
        errors,
        message: 'Preview generated successfully.',
      };
    }),

  import: protectedProcedure
    .input(DataExportPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (input.version !== ExportFormatVersion) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported format version: ${input.version}`,
        });
      }

      const allMediaIds = new Set([
        ...input.favorites.map((f) => f.mediaId),
        ...input.watchlist.map((w) => w.mediaId),
        ...input.progress.map((p) => p.mediaId),
        ...input.history.map((h) => h.mediaId),
      ]);

      const existingMedia = allMediaIds.size > 0 ? await ctx.prisma.media.findMany({
        where: { id: { in: Array.from(allMediaIds) } },
        select: { id: true },
      }) : [];
      const validMediaIds = new Set(existingMedia.map((m) => m.id));

      const validFavorites = input.favorites.filter((f) => validMediaIds.has(f.mediaId));
      const validWatchlist = input.watchlist.filter((w) => validMediaIds.has(w.mediaId));
      const validProgress = input.progress.filter((p) => validMediaIds.has(p.mediaId));
      const validHistory = input.history.filter((h) => validMediaIds.has(h.mediaId));

      // Fetch valid episodes for history safely
      const episodeLookups = validHistory.map((h) => ({ mediaId: h.mediaId, number: h.episodeNumber }));
      const existingEpisodes = episodeLookups.length > 0 ? await ctx.prisma.episode.findMany({
        where: {
          OR: episodeLookups.map((l) => ({ mediaId: l.mediaId, number: l.number })),
        },
        select: { id: true, mediaId: true, number: true },
      }) : [];

      const episodeMap = new Map<string, string>();
      existingEpisodes.forEach((ep) => {
        episodeMap.set(`${ep.mediaId}-${ep.number}`, ep.id);
      });

      // Transactional import
      await ctx.prisma.$transaction(async (tx) => {
        // Favorites
        for (const fav of validFavorites) {
          await tx.favorite.upsert({
            where: { userId_mediaId: { userId, mediaId: fav.mediaId } },
            update: {}, // No update needed for favorites
            create: {
              userId,
              mediaId: fav.mediaId,
              createdAt: fav.createdAt ? new Date(fav.createdAt) : undefined,
            },
          });
        }

        // Watchlist
        for (const w of validWatchlist) {
          await tx.watchlistItem.upsert({
            where: { userId_mediaId: { userId, mediaId: w.mediaId } },
            update: {},
            create: {
              userId,
              mediaId: w.mediaId,
              createdAt: w.createdAt ? new Date(w.createdAt) : undefined,
            },
          });
        }

        // Progress
        for (const p of validProgress) {
          await tx.watchProgress.upsert({
            where: { userId_mediaId: { userId, mediaId: p.mediaId } },
            update: {
              status: p.status,
              lastWatchedEpNum: p.lastWatchedEpNum,
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            },
            create: {
              userId,
              mediaId: p.mediaId,
              status: p.status,
              lastWatchedEpNum: p.lastWatchedEpNum,
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            },
          });
        }

        // History
        for (const h of validHistory) {
          const episodeId = episodeMap.get(`${h.mediaId}-${h.episodeNumber}`);
          if (episodeId) {
            await tx.watchHistory.upsert({
              where: { userId_episodeId: { userId, episodeId } },
              update: {
                resumePosition: Math.max(h.resumePosition, 0), // Use Math.max if we want to keep largest? Just override.
                completed: h.completed,
                watchedAt: h.watchedAt ? new Date(h.watchedAt) : undefined,
                updatedAt: h.updatedAt ? new Date(h.updatedAt) : undefined,
              },
              create: {
                userId,
                episodeId,
                resumePosition: h.resumePosition,
                completed: h.completed,
                watchedAt: h.watchedAt ? new Date(h.watchedAt) : undefined,
                updatedAt: h.updatedAt ? new Date(h.updatedAt) : undefined,
              },
            });
          }
        }
      }, {
        maxWait: 10000,
        timeout: 30000,
      });

      return {
        success: true,
        imported: {
          favorites: validFavorites.length,
          watchlist: validWatchlist.length,
          progress: validProgress.length,
          history: validHistory.filter((h) => episodeMap.has(`${h.mediaId}-${h.episodeNumber}`)).length,
        },
      };
    }),
});
