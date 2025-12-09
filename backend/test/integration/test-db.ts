import { StartedTestContainer } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: (StartedTestContainer & Partial<StartedPostgreSqlContainer>) | null = null;

export async function ensureTestDb() {
  if (container) return container;
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('market_store_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = String(container.getMappedPort(5432));
  // Methods exist on StartedPostgreSqlContainer; fallback to connection string if types differ
  const conn = (container as any).getConnectionString?.() as string | undefined;
  process.env.DB_USERNAME = (container as any).getUsername?.() || 'test';
  process.env.DB_PASSWORD = (container as any).getPassword?.() || 'test';
  process.env.DB_NAME = (container as any).getDatabase?.() || (conn ? new URL(conn).pathname.slice(1) : 'market_store_test');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testSecret';

  return container;
}

export async function shutdownTestDb() {
  if (container) {
    await container.stop();
    container = null;
  }
}
