import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { UpsertWatchHistoryInput } from '@streaming/shared';
import { TRPCError } from '@trpc/server';

export const historyRouter = router({
  getEpisodeHistory: protectedProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.watchHistory.findUnique({
        where: {
          userId_episodeId: {
            userId: ctx.user.id,
            episodeId: input.episodeId,
          },
        },
      });
    }),

  upsertPosition: protectedProcedure
    .input(UpsertWatchHistoryInput)
    .mutation(async ({ ctx, input }) => {
      const episode = await ctx.prisma.episode.findUnique({
        where: { id: input.episodeId },
      });
      if (!episode) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Episode not found' });
      }

      return ctx.prisma.watchHistory.upsert({
        where: {
          userId_episodeId: {
            userId: ctx.user.id,
            episodeId: input.episodeId,
          },
        },
        update: {
          resumePosition: input.resumePosition,
          ...(input.completed !== undefined && { completed: input.completed }),
          watchedAt: new Date(),
        },
        create: {
          userId: ctx.user.id,
          episodeId: input.episodeId,
          resumePosition: input.resumePosition,
          ...(input.completed !== undefined && { completed: input.completed }),
        },
      });
    }),
});
