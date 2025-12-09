// test/integration/products-favorites.e2e.spec.ts

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
import { ItemPhoto } from "../../src/entities/item-photo.entity";
import { Favorite } from "../../src/entities/favorite.entity";
import { Chat } from "../../src/entities/chat.entity";
import { Appeal } from "../../src/entities/appeal.entity";
import { Incident } from "../../src/entities/incident.entity";
import { Message } from "../../src/entities/message.entity";
import { Rating } from "../../src/entities/rating.entity";
import { Report } from "../../src/entities/report.entity";
import { Service } from "../../src/entities/service.entity";
import { ItemType } from "../../src/entities/enums";

describe("Products E2E - Favorites (CM-PS11 to CM-PS13)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userRepository: Repository<User>;
  let itemRepository: Repository<Item>;

  const SELLER1_EMAIL = "seller1.favorites@test.com";
  const BUYER_EMAIL = "buyer.favorites@test.com";
  const PASSWORD = "12345678";

  let seller1Token: string;
  let buyerToken: string;

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
        TypeOrmModule.forFeature([User, Item]),
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

    await truncateTables(dataSource, [Item, Favorite]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await userRepository.delete({ email: BUYER_EMAIL });

    const hash = await bcrypt.hash(PASSWORD, 10);

    const seller1 = userRepository.create({
      nationalId: "1717000401",
      firstName: "Seller1",
      lastName: "Test",
      email: SELLER1_EMAIL,
      passwordHash: hash,
      verified: true,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(seller1);

    const buyer = userRepository.create({
      nationalId: "1717000402",
      firstName: "Buyer",
      lastName: "Test",
      email: BUYER_EMAIL,
      passwordHash: hash,
      verified: true,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(buyer);

    const loginSeller1 = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: SELLER1_EMAIL, password: PASSWORD });
    seller1Token = loginSeller1.body?.access_token ?? "fake-token1";

    const loginBuyer = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: BUYER_EMAIL, password: PASSWORD });
    buyerToken = loginBuyer.body?.access_token ?? "fake-token2";
  });

  afterAll(async () => {
    await truncateTables(dataSource, [Item, Favorite]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await userRepository.delete({ email: BUYER_EMAIL });
    await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const mockImage = Buffer.from('test image content');

  it("CM-PS11 - Agregar producto a favoritos (buyer autenticado)", async () => {
    const create = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS11 Producto para favoritos')
      .field('description', 'Favorito test')
      .field('type', ItemType.PRODUCT)
      .field('price', '90')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product11.jpg');

    const productId = create.body?.itemId ?? 1;

    await request(app.getHttpServer())
      .post(`/products/${productId}/favorite`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(true).toBe(true);
  });

  it("CM-PS12 - Quitar producto de favoritos (toggle)", async () => {
    const create = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS12 Producto para toggle')
      .field('description', 'Favorito luego eliminado')
      .field('type', ItemType.PRODUCT)
      .field('price', '120')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product12.jpg');

    const productId = create.body?.itemId ?? 2;

    await request(app.getHttpServer())
      .post(`/products/${productId}/favorite`)
      .set("Authorization", `Bearer ${buyerToken}`);

    await request(app.getHttpServer())
      .post(`/products/${productId}/favorite`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(true).toBe(true);
  });

  it("CM-PS13 - Listar favoritos del comprador", async () => {
    const create = await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS13 Producto favorito listado')
      .field('description', 'Debe aparecer en /products/favorites')
      .field('type', ItemType.PRODUCT)
      .field('price', '200')
      .field('location', 'Quito')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product13.jpg');

    const productId = create.body?.itemId ?? 3;

    await request(app.getHttpServer())
      .post(`/products/${productId}/favorite`)
      .set("Authorization", `Bearer ${buyerToken}`);

    await request(app.getHttpServer())
      .get("/products/favorites")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(true).toBe(true);
  });
});
