import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { UpdateWatchProgressInput } from '@streaming/shared';

export const watchRouter = router({
  getProgress: protectedProcedure
    .input(z.object({ mediaId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.watchProgress.findUnique({
        where: {
          userId_mediaId: {
            userId: ctx.user.id,
            mediaId: input.mediaId,
          },
        },
      });
    }),

  updateProgress: protectedProcedure
    .input(UpdateWatchProgressInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.watchProgress.upsert({
        where: {
          userId_mediaId: {
            userId: ctx.user.id,
            mediaId: input.mediaId,
          },
        },
        update: {
          status: input.status,
          ...(input.lastWatchedEpNum !== undefined && { lastWatchedEpNum: input.lastWatchedEpNum }),
        },
        create: {
          userId: ctx.user.id,
          mediaId: input.mediaId,
          status: input.status,
          ...(input.lastWatchedEpNum !== undefined && { lastWatchedEpNum: input.lastWatchedEpNum }),
        },
      });
    }),

  getContinueWatching: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all "WATCHING" progress for the user
      const progress = await ctx.prisma.watchProgress.findMany({
        where: {
          userId: ctx.user.id,
          status: 'WATCHING',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          media: {
            include: { episodes: true }
          }
        },
      });

      const episodeIds = progress
        .map(p => p.media.episodes.find(e => e.number === p.lastWatchedEpNum)?.id)
        .filter(id => id) as string[];

      const histories = await ctx.prisma.watchHistory.findMany({
        where: {
          userId: ctx.user.id,
          episodeId: { in: episodeIds }
        }
      });
      const historyMap = new Map(histories.map(h => [h.episodeId, h]));
      const continueWatching: any[] = [];

      for (const p of progress) {
        if (!p.lastWatchedEpNum) continue;

        // Find the specific episode they were last watching
        const lastEpisode = p.media.episodes.find(e => e.number === p.lastWatchedEpNum);
        if (!lastEpisode) continue;

        // Fetch history for this episode from map
        const history = historyMap.get(lastEpisode.id);

        if (!history) continue;

        if (history.completed) {
          // If completed, suggest the NEXT episode
          const nextEpisode = p.media.episodes.find(e => e.number === p.lastWatchedEpNum! + 1);
          if (nextEpisode) {
            continueWatching.push({
              media: p.media,
              episode: nextEpisode,
              resumePosition: 0,
            });
          }
        } else {
          // If not completed, suggest resuming the current episode
          continueWatching.push({
            media: p.media,
            episode: lastEpisode,
            resumePosition: history.resumePosition,
          });
        }
      }

      return continueWatching;
    }),
});
