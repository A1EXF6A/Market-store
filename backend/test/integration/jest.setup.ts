import { ensureTestDb, shutdownTestDb } from './test-db';

beforeAll(async () => {
  await ensureTestDb();
});

afterAll(async () => {
  await shutdownTestDb();
});
