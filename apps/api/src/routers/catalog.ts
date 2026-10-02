import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { AnilistService } from '../services/anilist.service';
import { CatalogSyncService } from '../services/catalog-sync.service';

const anilist = new AnilistService();

export const catalogRouter = router({
  getById: publicProcedure
    .input(z.string()) // This can be our internal CUID or a mal_id / anilist_id as string
    .query(async ({ ctx, input }) => {
      // 1. Try to find in DB (either by CUID or externalId 'jikan' or 'anilist')
      let media = await ctx.prisma.media.findFirst({
        where: {
          OR: [
            { id: input },
            { externalIds: { some: { provider: 'jikan', externalId: input } } },
            { externalIds: { some: { provider: 'anilist', externalId: input } } }
          ]
        },
        include: { episodes: true, genres: { include: { genre: true } }, externalIds: true },
      });

      // 2. If not found in DB, try to fetch from Anilist and sync
      if (!media) {
        const canonical = await anilist.getAnimeById(input);
        if (!canonical) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Anime not found' });
        }
        const syncService = new CatalogSyncService(ctx.prisma);
        const synced = await syncService.syncMedia(canonical);
        
        media = await ctx.prisma.media.findUnique({
          where: { id: synced.id },
          include: { episodes: true, genres: { include: { genre: true } }, externalIds: true },
        });
      }

      return media;
    }),

  getEpisodes: publicProcedure
    .input(z.string()) // mediaId
    .query(async ({ ctx, input }) => {
      return ctx.prisma.episode.findMany({
        where: { mediaId: input },
        orderBy: { number: 'asc' }
      });
    }),

  getByGenre: publicProcedure
    .input(z.object({
      genre: z.string().min(1).max(50),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20)
    }))
    .query(async ({ ctx, input }) => {
      const { genre, page, limit } = input;
      const skip = (page - 1) * limit;

      const items = await ctx.prisma.media.findMany({
        where: {
          genres: { some: { genre: { name: { equals: genre, mode: 'insensitive' } } } }
        },
        skip,
        take: limit,
        orderBy: { popularity: 'desc' },
        include: { genres: { include: { genre: true } } }
      });

      return items;
    }),
});

