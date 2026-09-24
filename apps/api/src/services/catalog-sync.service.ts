import { PrismaClient, MediaType, MediaFormat, MediaStatus, SeasonQuarter } from '@prisma/client';
import { CanonicalMedia } from '@streaming/shared';

export class CatalogSyncService {
  constructor(private prisma: PrismaClient) {}

  public async syncMedia(media: CanonicalMedia) {
    const jikanId = media.externalIds.find(e => e.provider === 'jikan')?.externalId;
    if (!jikanId) throw new Error('Cannot sync media without Jikan ID');

    // Find existing media by external ID
    const existingExtId = await this.prisma.externalId.findUnique({
      where: {
        provider_externalId: { provider: 'jikan', externalId: jikanId }
      },
      include: { media: true }
    });

    // Ensure all genres exist
    for (const genreName of media.genres) {
      await this.prisma.genre.upsert({
        where: { name: genreName },
        update: {},
        create: { name: genreName }
      });
    }
    const genres = await this.prisma.genre.findMany({
      where: { name: { in: media.genres } }
    });

    const mediaData = {
      title: media.title,
      titleEnglish: media.titleEnglish,
      titleNative: media.titleNative,
      synopsis: media.synopsis,
      type: media.type as MediaType,
      format: media.format as MediaFormat,
      status: media.status as MediaStatus,
      seasonYear: media.seasonYear,
      seasonQuarter: media.seasonQuarter as SeasonQuarter,
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
      syncedMedia = await this.prisma.media.update({
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
    } else {
      // Create new
      syncedMedia = await this.prisma.media.create({
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
          }
        }
      });
    }

    return syncedMedia;
  }
}
