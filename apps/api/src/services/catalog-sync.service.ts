import { PrismaClient, MediaType, MediaFormat, MediaStatus, SeasonQuarter } from '@prisma/client';
import { CanonicalMedia } from '@streaming/shared';

export class CatalogSyncService {
  constructor(private prisma: PrismaClient) {}

  public async syncMedia(media: CanonicalMedia) {
    if (media.externalIds.length === 0) throw new Error('Cannot sync media without external IDs');

    return await this.prisma.$transaction(async (tx) => {
      // Find existing media by external ID
      const existingExtId = await tx.externalId.findFirst({
        where: {
          OR: media.externalIds.map(e => ({
            provider: e.provider,
            externalId: e.externalId
          }))
        },
        include: { media: true }
      });

      // Ensure all genres exist using createMany
      if (media.genres.length > 0) {
        await tx.genre.createMany({
          data: media.genres.map(g => ({ name: g })),
          skipDuplicates: true
        });
      }

      const genres = media.genres.length > 0 ? await tx.genre.findMany({
        where: { name: { in: media.genres } }
      }) : [];

      const mediaData = {
        title: media.title,
        titleEnglish: media.titleEnglish,
        titleNative: media.titleNative,
        synopsis: media.synopsis,
        type: (media.type || 'TV') as MediaType,
        format: (media.type || 'TV') as MediaFormat,
        status: (media.status || 'UNKNOWN') as MediaStatus,
        seasonYear: media.seasonYear,
        seasonQuarter: media.seasonQuarter ? (media.seasonQuarter as SeasonQuarter) : null,
        episodeCount: media.episodeCount,
        coverImage: media.coverImage,
        bannerImage: media.bannerImage,
        averageScore: media.averageScore,
        popularity: media.popularity,
        startDate: media.startDate,
        endDate: media.endDate,
      };

      let syncedMedia;

      if (existingExtId) {
        // Update existing
        syncedMedia = await tx.media.update({
          where: { id: existingExtId.mediaId },
          data: {
            ...mediaData,
            genres: {
              deleteMany: {}, // Clear existing genres relation
              create: genres.map(g => ({
                genre: { connect: { id: g.id } }
              }))
            }
          }
        });

        // Upsert external IDs
        for (const ext of media.externalIds) {
          await tx.externalId.upsert({
            where: { provider_externalId: { provider: ext.provider, externalId: ext.externalId } },
            create: { provider: ext.provider, externalId: ext.externalId, mediaId: existingExtId.mediaId },
            update: {}
          });
        }

        // Upsert episodes safely
        if (media.episodes && media.episodes.length > 0) {
          for (const ep of media.episodes) {
            await tx.episode.upsert({
              where: { mediaId_number: { mediaId: existingExtId.mediaId, number: ep.number } },
              create: { mediaId: existingExtId.mediaId, number: ep.number, title: ep.title, aired: ep.aired },
              update: { title: ep.title, aired: ep.aired }
            });
          }
        }
      } else {
        // Create new
        syncedMedia = await tx.media.create({
          data: {
            ...mediaData,
            externalIds: {
              create: media.externalIds.map(e => ({
                provider: e.provider,
                externalId: e.externalId
              }))
            },
            genres: {
              create: genres.map(g => ({
                genre: { connect: { id: g.id } }
              }))
            },
            episodes: media.episodes && media.episodes.length > 0 ? {
              create: media.episodes.map(ep => ({
                number: ep.number,
                title: ep.title,
                aired: ep.aired
              }))
            } : undefined
          }
        });
      }

      return syncedMedia;
    });
  }
}
