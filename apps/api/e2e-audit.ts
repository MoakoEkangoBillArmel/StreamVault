import { appRouter } from './src/routers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('=============================================');
  console.log(' STARTING REAL FUNCTIONAL BACKEND AUDIT');
  console.log('=============================================');

  // 1. DB Connection Check
  try {
    await prisma.$connect();
    console.log('✅ DATABASE: Connection Successful');
  } catch (e: any) {
    console.error('❌ DATABASE: Connection Failed', e.message);
    process.exit(1);
  }

  // Generate random user
  const uniqueId = Date.now().toString();
  const testUser = { email: `test${uniqueId}@audit.com`, password: 'password123', name: 'Auditor' };
  
  // Create anonymous caller
  const anonCaller = appRouter.createCaller({ prisma, user: null as any });

  // 2. AUTH: Register
  console.log('\n--- 2. AUTHENTICATION ---');
  let token = '';
  let authCaller: any;
  try {
    const res = await anonCaller.auth.register(testUser);
    token = res.token;
    console.log('✅ AUTH: Register successful. User created.');
  } catch (e: any) {
    console.error('❌ AUTH: Register failed', e.message);
  }

  // 3. AUTH: Login
  try {
    const res = await anonCaller.auth.login({ email: testUser.email, password: testUser.password });
    if (res.token === token) {
      console.log('✅ AUTH: Login successful. Token verified.');
    }
  } catch (e: any) {
    console.error('❌ AUTH: Login failed', e.message);
  }

  // Setup Authenticated Caller
  const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
  if (dbUser) {
    authCaller = appRouter.createCaller({ prisma, user: dbUser });
    console.log('✅ AUTH: Protected caller created.');
  }

  // 4. CATALOG & JIKAN API (External Sync)
  console.log('\n--- 3. CATALOG & METADATA (Jikan) ---');
  let mediaId = '';
  try {
    // Cowboy Bebop (MAL ID: 1)
    const media = await anonCaller.catalog.getById('1');
    if (media && media.title) {
      console.log(`✅ CATALOG: getById fetched ${media.title} successfully.`);
      mediaId = media.id;
    } else {
      console.error('❌ CATALOG: getById returned empty or invalid data.');
    }
  } catch (e: any) {
    console.error('❌ CATALOG: getById failed', e.message);
  }

  try {
    const eps = await anonCaller.catalog.getEpisodes(mediaId);
    if (eps.length > 0) {
      console.log(`✅ CATALOG: getEpisodes fetched ${eps.length} episodes.`);
    }
  } catch (e: any) {
    console.error('❌ CATALOG: getEpisodes failed', e.message);
  }

  // 5. SEARCH & FTS
  console.log('\n--- 4. SEARCH ---');
  try {
    const searchRes = await anonCaller.search.query({ q: 'Bebop', limit: 5, page: 1 });
    if (searchRes.items.length > 0) {
      console.log(`✅ SEARCH: FTS query for 'Bebop' found ${searchRes.meta.total} results.`);
    } else {
      console.warn('⚠️ SEARCH: FTS query for "Bebop" returned 0 results. Trigger/Index might not have processed yet or sync is pending.');
    }
  } catch (e: any) {
    console.error('❌ SEARCH: FTS query failed', e.message);
  }

  // 6. DISCOVERY
  console.log('\n--- 5. DISCOVERY ---');
  try {
    const trending = await anonCaller.discovery.trending({ page: 1 });
    if (trending.length > 0) {
      console.log(`✅ DISCOVERY: Trending fetched ${trending.length} items from Jikan.`);
    }
  } catch (e: any) {
    console.error('❌ DISCOVERY: Trending failed', e.message);
  }

  // 7. WATCH SYSTEM
  console.log('\n--- 6. WATCH SYSTEM ---');
  let firstEpisodeId = '';
  if (authCaller && mediaId) {
    try {
      const eps = await prisma.episode.findMany({ where: { mediaId }, orderBy: { number: 'asc' }});
      if (eps.length > 0) {
        firstEpisodeId = eps[0].id;
        
        // Update History
        await authCaller.history.upsertPosition({ episodeId: firstEpisodeId, resumePosition: 300, completed: false });
        console.log('✅ WATCH: history.upsertPosition (progress) working.');
        
        // Update Progress
        await authCaller.watch.updateProgress({ mediaId, status: 'WATCHING', lastWatchedEpNum: 1 });
        console.log('✅ WATCH: updateProgress working.');
        
        // Continue Watching
        const cw = await authCaller.watch.getContinueWatching();
        if (cw.length > 0) {
          console.log(`✅ WATCH: getContinueWatching returned ${cw.length} items.`);
        }
      }
    } catch (e: any) {
      console.error('❌ WATCH: System failed', e.message);
    }
  }

  // 8. FAVORITES & WATCHLIST
  console.log('\n--- 7. FAVORITES & WATCHLIST ---');
  if (authCaller && mediaId) {
    try {
      await authCaller.favorites.toggle({ mediaId });
      const favs = await authCaller.favorites.list();
      console.log(`✅ FAVORITES: toggle and list working. Total favs: ${favs.length}`);
    } catch (e: any) {
      console.error('❌ FAVORITES: failed', e.message);
    }
    
    try {
      await authCaller.watchlist.toggle({ mediaId });
      const wl = await authCaller.watchlist.list();
      console.log(`✅ WATCHLIST: toggle and list working. Total watchlist: ${wl.length}`);
    } catch (e: any) {
      console.error('❌ WATCHLIST: failed', e.message);
    }
  }

  // 9. SOURCES & STREAMING
  console.log('\n--- 8. SOURCES ---');
  if (authCaller && firstEpisodeId) {
    try {
      const streams = await authCaller.sources.resolve({ episodeId: firstEpisodeId, language: 'VOSTFR' });
      console.log(`✅ SOURCES: resolve returned ${streams.length} streams.`);
    } catch (e: any) {
      console.error('❌ SOURCES: resolve failed', e.message);
    }
  }

  console.log('\n=============================================');
  console.log(' AUDIT COMPLETE');
  console.log('=============================================');

  // Cleanup test user
  if (dbUser) {
    await prisma.user.delete({ where: { id: dbUser.id } });
  }
  
  await prisma.$disconnect();
}

runAudit().catch(e => {
  console.error('FATAL AUDIT ERROR', e);
  process.exit(1);
});
