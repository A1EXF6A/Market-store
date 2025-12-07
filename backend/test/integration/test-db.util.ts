import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import AppDataSource from '../../src/data-source';
import { execSync } from 'child_process';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';

export interface TestContext {
  app: INestApplication;
  container: StartedTestContainer;
}

export async function createTestApp(
  overrideAuth: boolean = false,
): Promise<TestContext> {
  // 1. Arrancar contenedor Postgres 14
  const container = await new GenericContainer('postgres:14')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'testdb',
    })
    .withExposedPorts(5432)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(5432);

  process.env.DB_HOST = host;
  process.env.DB_PORT = String(port);
  process.env.DB_USER = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'testdb';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

  
  (AppDataSource as any).options = {
    ...AppDataSource.options,
    host,
    port,
    username: 'test',
    password: 'test',
    database: 'testdb',
  };

  execSync('npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts', {
    stdio: 'inherit',
    env: { ...process.env },
  });

  const { AppModule } = await import('../../src/app.module');
  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (overrideAuth) {
  
    moduleBuilder = moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const header = req.get('x-test-user');
          if (!header) return false;
          try {
            req.user = JSON.parse(header);
            return true;
          } catch {
            return false;
          }
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true });
  }

  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();
  await app.init();

  return { app, container };
}

export async function closeTestApp(ctx: TestContext) {
  if (ctx.app) await ctx.app.close();
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  if (ctx.container) await ctx.container.stop();
}
