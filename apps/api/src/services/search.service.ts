import { PrismaClient, Prisma } from '@prisma/client';
import { SearchQuery } from '@streaming/shared';

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  async search(query: SearchQuery) {
    const { q, type, status, genre, seasonYear, seasonQuarter, sortBy, sortOrder, page, limit } = query;
    const skip = (page - 1) * limit;

    // Build the WHERE clause dynamically
    let whereClause: Prisma.MediaWhereInput = {};

    if (q) {
      // Use PostgreSQL FTS via Prisma raw query capabilities or filtered results
      // Prisma's search preview feature doesn't fully support all pg_trgm and tsvector nuances easily in typed API,
      // so we use a raw query if a text search is provided.
    }

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (seasonYear) whereClause.seasonYear = seasonYear;
    if (seasonQuarter) whereClause.seasonQuarter = seasonQuarter;
    if (genre) {
      whereClause.genres = {
        some: {
          genre: {
            name: genre
          }
        }
      };
    }

    let items: any[] = [];
    let totalCount = 0;

    if (q && q.trim().length > 0) {
      // Raw query for FTS
      const tsQuery = q.trim().split(/\s+/).join(' | '); // simple OR matching
      
      // Building dynamic raw conditions
      const conditions: string[] = [`"title_search" @@ to_tsquery('english', $1)`];
      const params: any[] = [tsQuery];
      let paramIndex = 2;

      if (type) { conditions.push(`"type" = $${paramIndex++}`); params.push(type); }
      if (status) { conditions.push(`"status" = $${paramIndex++}`); params.push(status); }
      if (seasonYear) { conditions.push(`"seasonYear" = $${paramIndex++}`); params.push(seasonYear); }
      if (seasonQuarter) { conditions.push(`"seasonQuarter" = $${paramIndex++}`); params.push(seasonQuarter); }
      // Genre filtering in raw SQL is complex due to join, so if genre is provided with Q, we might just filter after or join

      let joinClause = '';
      if (genre) {
        joinClause = `
          INNER JOIN "MediaGenre" mg ON mg."mediaId" = m.id
          INNER JOIN "Genre" g ON g.id = mg."genreId"
        `;
        conditions.push(`g.name = $${paramIndex++}`);
        params.push(genre);
      }

      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const orderByField = sortBy === 'score' ? '"averageScore"' : sortBy === 'popularity' ? '"popularity"' : sortBy === 'startDate' ? '"startDate"' : '"popularity"';
      const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

      const rawItems = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT m.* 
        FROM "Media" m
        ${joinClause}
        ${whereSql}
        ORDER BY ${orderByField} ${orderDir} NULLS LAST
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        ...params, limit, skip
      );

      const countResult = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT COUNT(DISTINCT m.id)::int as count
        FROM "Media" m
        ${joinClause}
        ${whereSql}
        `,
        ...params
      );

      // Need to fetch includes (genres, episodes) manually or just return raw
      // Since it's raw, let's map them to proper type by fetching their details using Prisma
      if (rawItems.length > 0) {
        items = await this.prisma.media.findMany({
          where: { id: { in: rawItems.map(r => r.id) } },
          include: { genres: { include: { genre: true } }, episodes: true },
        });
        // Restore sort order
        items.sort((a, b) => rawItems.findIndex(r => r.id === a.id) - rawItems.findIndex(r => r.id === b.id));
      } else {
        items = [];
      }
      totalCount = countResult[0]?.count || 0;

    } else {
      // Standard Prisma query
      const orderBy = sortBy === 'score' ? { averageScore: sortOrder || 'desc' }
                    : sortBy === 'popularity' ? { popularity: sortOrder || 'desc' }
                    : sortBy === 'startDate' ? { startDate: sortOrder || 'desc' }
                    : { popularity: 'desc' }; // Default sort

      items = await this.prisma.media.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: orderBy as any,
        include: { genres: { include: { genre: true } }, episodes: true }
      });

      totalCount = await this.prisma.media.count({ where: whereClause });
    }

    return {
      items,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }
}
