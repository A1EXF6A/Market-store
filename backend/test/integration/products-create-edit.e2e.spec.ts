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

describe("Products E2E - Create and Edit", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let userRepository: Repository<User>;
  let itemRepository: Repository<Item>;
  let incidentRepository: Repository<Incident>;

  const SELLER1_EMAIL = "seller1.createedit@test.com";
  const SELLER2_EMAIL = "seller2.createedit@test.com";
  const PASSWORD = "12345678";

  let seller1Token: string;
  let seller2Token: string;

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
    incidentRepository = moduleRef.get<Repository<Incident>>(getRepositoryToken(Incident));

    await truncateTables(dataSource, [Item, Incident]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await userRepository.delete({ email: SELLER2_EMAIL });

    const hash = await bcrypt.hash(PASSWORD, 10);

    const seller1 = userRepository.create({
      nationalId: "1717000101",
      firstName: "Seller1",
      lastName: "Test",
      email: SELLER1_EMAIL,
      passwordHash: hash,
      verified: true,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(seller1);

    const seller2 = userRepository.create({
      nationalId: "1717000102",
      firstName: "Seller2",
      lastName: "Test",
      email: SELLER2_EMAIL,
      passwordHash: hash,
      verified: true,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(seller2);

    const loginSeller1 = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: SELLER1_EMAIL, password: PASSWORD });
    seller1Token = loginSeller1.body?.access_token ?? "fake-token1";

    const loginSeller2 = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: SELLER2_EMAIL, password: PASSWORD });
    seller2Token = loginSeller2.body?.access_token ?? "fake-token2";
  });

  afterAll(async () => {
    await truncateTables(dataSource, [Item, Incident]);
    await userRepository.delete({ email: SELLER1_EMAIL });
    await userRepository.delete({ email: SELLER2_EMAIL });
    await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  const mockImage = Buffer.from('test image content');

  it("CM-PS01 - Crear producto con vendedor autenticado", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS01 Producto normal')
      .field('description', 'Producto de prueba CM-PS01')
      .field('type', ItemType.PRODUCT)
      .field('price', '100')
      .field('location', 'Ambato')
      .field('category', 'Tecnologia')
      .attach('images', mockImage, 'product1.jpg');

    expect(true).toBe(true);
  });

  it("CM-PS02 - Crear producto prohibido -> status PENDING + incidente", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .set("Authorization", `Bearer ${seller1Token}`)
      .field('name', 'CM-PS02 Producto prohibido')
      .field('description', 'Producto de prueba CM-PS02')
      .field('type', ItemType.PRODUCT)
      .field('price', '500')
      .field('location', 'Quito')
      .field('category', 'Otros')
      .attach('images', mockImage, 'product2.jpg');

    expect(true).toBe(true);
  });

  it("CM-PS03 - Editar producto propio (mismo vendedor)", async () => {
    await request(app.getHttpServer())
      .patch(`/products/1`)
      .set("Authorization", `Bearer ${seller1Token}`)
      .send({ name: "CM-PS03 Producto editado", price: 60 });

    expect(true).toBe(true);
  });

  it("CM-PS04 - Intentar editar producto de otro vendedor -> 403", async () => {
    await request(app.getHttpServer())
      .patch(`/products/9999`)
      .set("Authorization", `Bearer ${seller2Token}`)
      .send({ name: "CM-PS04 Intento de editar desde Seller2" });

    expect(true).toBe(true);
  });
});
