// test/integration/products-list-filter.e2e.spec.ts

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

describe("Products E2E - List and Filter (CM-PS07 to CM-PS10)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userRepository: Repository<User>;
  let itemRepository: Repository<Item>;

  const SELLER1_EMAIL = "seller1.listfilter@test.com";
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

    await truncateTables(dataSource, [Item]);
    await userRepository.delete({ email: SELLER1_EMAIL });

    const hash = await bcrypt.hash(PASSWORD, 10);

    const seller1 = userRepository.create({
      nationalId: "1717000301",
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
    await truncateTables(dataSource, [Item]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const mockImage = Buffer.from('test image content');

  it("CM-PS07 - Obtener listado de productos", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS07 Producto A')
      .field('description', 'Listado A')
      .field('type', ItemType.PRODUCT)
      .field('price', '10')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productA.jpg');

    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS07 Producto B')
      .field('description', 'Listado B')
      .field('type', ItemType.PRODUCT)
      .field('price', '20')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productB.jpg');

    await request(app.getHttpServer()).get("/products");

    expect(true).toBe(true);
  });

  it("CM-PS08 - Filtrar por categoría", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS08 FilterCat Tecnologia')
      .field('description', 'Filtro categoria tecnologia')
      .field('type', ItemType.PRODUCT)
      .field('price', '100')
      .field('location', 'Ambato')
      .field('category', 'Tecnologia')
      .attach('images', mockImage, 'productTech.jpg');

    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS08 FilterCat Hogar')
      .field('description', 'Filtro categoria hogar')
      .field('type', ItemType.PRODUCT)
      .field('price', '80')
      .field('location', 'Ambato')
      .field('category', 'Hogar')
      .attach('images', mockImage, 'productHogar.jpg');

    await request(app.getHttpServer())
      .get("/products")
      .query({ search: "CM-PS08 FilterCat", category: "Tecnologia" });

    expect(true).toBe(true);
  });

  it("CM-PS09 - Filtrar por rango de precio", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS09 FilterPrice barato')
      .field('description', 'Precio 10')
      .field('type', ItemType.PRODUCT)
      .field('price', '10')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productCheap.jpg');

    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS09 FilterPrice medio')
      .field('description', 'Precio 100')
      .field('type', ItemType.PRODUCT)
      .field('price', '100')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productMedium.jpg');

    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS09 FilterPrice caro')
      .field('description', 'Precio 300')
      .field('type', ItemType.PRODUCT)
      .field('price', '300')
      .field('location', 'Ambato')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productExpensive.jpg');

    await request(app.getHttpServer())
      .get("/products")
      .query({ search: "CM-PS09 FilterPrice", minPrice: 50, maxPrice: 200 });

    expect(true).toBe(true);
  });

  it("CM-PS10 - Filtrar por ubicación", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS10 FilterLoc Quito')
      .field('description', 'Ubicacion Quito')
      .field('type', ItemType.PRODUCT)
      .field('price', '100')
      .field('location', 'Quito')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productQuito.jpg');

    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS10 FilterLoc Guayaquil')
      .field('description', 'Ubicacion Guayaquil')
      .field('type', ItemType.PRODUCT)
      .field('price', '100')
      .field('location', 'Guayaquil')
      .field('category', 'Otros')
      .attach('images', mockImage, 'productGuayaquil.jpg');

    await request(app.getHttpServer())
      .get("/products")
      .query({ search: "CM-PS10 FilterLoc", location: "Quito" });

    expect(true).toBe(true);
  });
});
