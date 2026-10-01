import { describe, it, expect, vi } from 'vitest';
import { dataRouter } from './data';
import { ExportFormatVersion } from '@streaming/shared';

describe('dataRouter', () => {
  describe('export', () => {
    it('should throw NOT_FOUND if user does not exist', async () => {
      const ctx = {
        user: { id: 'invalid' },
        prisma: {
          user: { findUnique: vi.fn().mockResolvedValue(null) }
        }
      };
      
      const caller = dataRouter.createCaller(ctx as any);
      
      await expect(caller.export()).rejects.toThrow('User not found');
    });

    it('should export user data correctly for empty user', async () => {
      const ctx = {
        user: { id: 'user-1' },
        prisma: {
          user: { findUnique: vi.fn().mockResolvedValue({ email: 'test@test.com', name: 'Test' }) },
          favorite: { findMany: vi.fn().mockResolvedValue([]) },
          watchlistItem: { findMany: vi.fn().mockResolvedValue([]) },
          watchProgress: { findMany: vi.fn().mockResolvedValue([]) },
          watchHistory: { findMany: vi.fn().mockResolvedValue([]) },
        }
      };

      const caller = dataRouter.createCaller(ctx as any);
      const result = await caller.export();

      expect(result.format).toBe('streamvault-export');
      expect(result.version).toBe(ExportFormatVersion);
      expect(result.user.email).toBe('test@test.com');
      expect(result.favorites).toEqual([]);
      expect(result.watchlist).toEqual([]);
      expect(result.progress).toEqual([]);
      expect(result.history).toEqual([]);
    });
  });

  describe('previewImport', () => {
    it('should throw if version is unsupported', async () => {
      const ctx = { user: { id: 'user-1' } };
      const caller = dataRouter.createCaller(ctx as any);
      
      await expect(caller.previewImport({
        format: 'streamvault-export',
        version: 999 as any,
        exportedAt: new Date().toISOString(),
        user: { email: 'a@a.com' },
        favorites: [],
        watchlist: [],
        progress: [],
        history: []
      })).rejects.toThrow('Unsupported format version');
    });
  });

  describe('import', () => {
    it('should import valid data successfully within a transaction', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (cb) => cb(ctx.prisma));
      const ctx = {
        user: { id: 'user-1' },
        prisma: {
          $transaction: mockTransaction,
          media: { findMany: vi.fn().mockResolvedValue([{ id: 'media-1' }]) },
          episode: { findMany: vi.fn().mockResolvedValue([{ id: 'ep-1', mediaId: 'media-1', number: 1 }]) },
          favorite: { upsert: vi.fn() },
          watchlistItem: { upsert: vi.fn() },
          watchProgress: { upsert: vi.fn() },
          watchHistory: { upsert: vi.fn() },
        }
      };

      const caller = dataRouter.createCaller(ctx as any);
      const result = await caller.import({
        format: 'streamvault-export',
        version: ExportFormatVersion,
        exportedAt: new Date().toISOString(),
        user: { email: 'test@test.com' },
        favorites: [{ mediaId: 'media-1' }],
        watchlist: [],
        progress: [],
        history: [{ mediaId: 'media-1', episodeNumber: 1, resumePosition: 10, completed: true }]
      });

      expect(result.success).toBe(true);
      expect(result.imported.favorites).toBe(1);
      expect(result.imported.history).toBe(1);
    });
  });
});
