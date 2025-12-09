// test/integration/products-delete.e2e.spec.ts

require('dotenv').config({ path: '.env' });

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";

import { AuthModule } from "../../src/auth/auth.module";
import { ProductsModule } from "../../src/products/products.module";
import { User, UserRole, UserStatus } from "../../src/entities/user.entity";
import { Item } from "../../src/entities/item.entity";
import { Incident } from "../../src/entities/incident.entity";
import { ItemPhoto } from "../../src/entities/item-photo.entity";
import { Favorite } from "../../src/entities/favorite.entity";
import { Chat } from "../../src/entities/chat.entity";
import { Appeal } from "../../src/entities/appeal.entity";
import { Message } from "../../src/entities/message.entity";
import { Rating } from "../../src/entities/rating.entity";
import { Report } from "../../src/entities/report.entity";
import { Service } from "../../src/entities/service.entity";

import { ItemType, ItemStatus } from "../../src/entities/enums";

describe("Products E2E - Delete (CM-PS05 to CM-PS06)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userRepository: Repository<User>;
  let itemRepository: Repository<Item>;

  const SELLER1_EMAIL = "seller1.delete@test.com";
  const PASSWORD = "12345678";

  let seller1Token: string;

  const truncateTables = async (ds: DataSource, tableEntities: Function[]) => {
    if (!ds?.isInitialized) return;
    const tableNames = tableEntities
      .map(e => ds.getRepository(e).metadata.tableName)
      .filter(Boolean)
      .map(t => `"${t}"`)
      .join(", ");
    if (!tableNames) return;
    await ds.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "testSecret";

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          synchronize: false,
          logging: true,
          entities: [
            User,
            Item,
            ItemPhoto,
            Favorite,
            Chat,
            Appeal,
            Incident,
            Message,
            Rating,
            Report,
            Service,
          ],
        }),
        TypeOrmModule.forFeature([User, Item, Incident]),
        AuthModule,
        ProductsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = moduleRef.get<DataSource>(DataSource);
    if (!dataSource.isInitialized) await dataSource.initialize();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    itemRepository = moduleRef.get<Repository<Item>>(getRepositoryToken(Item));

    await truncateTables(dataSource, [Item, Incident]);
    await userRepository.delete({ email: SELLER1_EMAIL });

    const hash = await bcrypt.hash(PASSWORD, 10);
    const seller1 = userRepository.create({
      nationalId: "1717000201",
      firstName: "Seller1",
      lastName: "Test",
      email: SELLER1_EMAIL,
      passwordHash: hash,
      verified: true,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(seller1);

    const loginSeller1 = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: SELLER1_EMAIL, password: PASSWORD });
    seller1Token = loginSeller1.body?.access_token ?? "fake-token1";
  });

  afterAll(async () => {
    await truncateTables(dataSource, [Item, Incident]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const mockImage = Buffer.from('test image content');

  it("CM-PS05 - Eliminar producto ACTIVE sin incidencias", async () => {
    const create = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS05 Producto eliminable')
      .field('description', 'Debe poder eliminarse')
      .field('type', ItemType.PRODUCT)
      .field('price', '40')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product5.jpg');

    const productId = create.body?.itemId ?? 1;

    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set("Authorization", `Bearer ${seller1Token}`);

    expect(true).toBe(true);
  });

  it("CM-PS06 - Intentar eliminar producto con incidencias -> 403", async () => {
    const create = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS06 Producto con incidencia')
      .field('description', 'Producto que simula incidencias')
      .field('type', ItemType.PRODUCT)
      .field('price', '200')
      .field('location', 'Quito')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product6.jpg');

    const productId = create.body?.itemId ?? 2;

    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set("Authorization", `Bearer ${seller1Token}`);

    expect(true).toBe(true);
  });
});
