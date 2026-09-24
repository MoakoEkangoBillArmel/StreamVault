import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling pg_trgm extension...');
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;

  console.log('Adding title_search tsvector column...');
  try {
    await prisma.$executeRaw`ALTER TABLE "Media" ADD COLUMN "title_search" tsvector;`;
  } catch (e) {
    console.log('Column might already exist, ignoring error.');
  }

  console.log('Creating GIN index...');
  try {
    await prisma.$executeRaw`CREATE INDEX media_title_search_idx ON "Media" USING GIN ("title_search");`;
  } catch (e) {
    console.log('Index might already exist, ignoring error.');
  }

  console.log('Setting up trigger for automatic tsvector updates...');
  try {
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION media_search_trigger() RETURNS trigger AS $$
      begin
        new.title_search :=
          setweight(to_tsvector('english', coalesce(new."title", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(new."titleEnglish", '')), 'B') ||
          setweight(to_tsvector('english', coalesce(new."synopsis", '')), 'C');
        return new;
      end
      $$ LANGUAGE plpgsql;
    `;
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS tsvectorupdate ON "Media";
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
      ON "Media" FOR EACH ROW EXECUTE FUNCTION media_search_trigger();
    `;
  } catch (e) {
    console.error('Failed to setup trigger:', e);
  }

  console.log('FTS Setup Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
