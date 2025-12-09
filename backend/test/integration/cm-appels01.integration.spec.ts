require('dotenv').config({ path: '.env' });

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IncidentsService } from "../../src/incidents/incidents.service";
import { UsersService } from "../../src/users/users.service";

import { User, UserRole, UserStatus } from "../../src/entities/user.entity";
import { Item } from "../../src/entities/item.entity";
import { ItemType, ItemStatus } from "../../src/entities/enums";

import { ItemPhoto } from "../../src/entities/item-photo.entity";
import { Message } from "../../src/entities/message.entity";
import { Chat } from "../../src/entities/chat.entity";
import { Rating } from "../../src/entities/rating.entity";
import { Report, ReportType } from "../../src/entities/report.entity";
import { Appeal } from "../../src/entities/appeal.entity";
import { Service } from "../../src/entities/service.entity";
import { Favorite } from "../../src/entities/favorite.entity";
import { Incident } from "../../src/entities/incident.entity";

describe("CM-US-08 - IncidentsService Integration Tests", () => {
  let app: INestApplication;
  let incidentsService: IncidentsService;
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let itemRepository: Repository<Item>;
  let reportRepository: Repository<Report>;

  let testBuyer: User;
  let testSeller: User;
  let testItem: Item;

  beforeAll(async () => {
    process.env.JWT_SECRET = "testSecret";

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [
            User, Item, ItemPhoto, Message, Chat, Rating, Report, Appeal, Service, Favorite, Incident
          ],
          synchronize: true, // solo para desarrollo
        }),
        TypeOrmModule.forFeature([User, Item, Report, Incident, Appeal]),
      ],
      providers: [IncidentsService, UsersService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    incidentsService = moduleRef.get<IncidentsService>(IncidentsService);
    usersService = moduleRef.get<UsersService>(UsersService);

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    itemRepository = moduleRef.get<Repository<Item>>(getRepositoryToken(Item));
    reportRepository = moduleRef.get<Repository<Report>>(getRepositoryToken(Report));

    // Crear usuarios de prueba
    testSeller = await userRepository.save({
      firstName: "Seller",
      lastName: "Test",
      email: "seller@test.com",
      password: "123456",
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
    });

    testBuyer = await userRepository.save({
      firstName: "Buyer",
      lastName: "Test",
      email: "buyer@test.com",
      password: "123456",
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
    });

    // Crear un item de prueba
    testItem = await itemRepository.save({
      code: "ITEM001",
      sellerId: 4,
      type: ItemType.PRODUCT, // usa el enum
      name: "Laptop Gamer",
      description: "Laptop de alto rendimiento para juegos con tarjeta gráfica dedicada.",
      category: "Electrónica",
      price: 1500.99,
      location: "Bogotá, Colombia",
      availability: true,
      status: ItemStatus.ACTIVE, // usa el enum
    });
  });

  afterAll(async () => {
    await reportRepository.query(`DELETE FROM reports`);
    await itemRepository.query(`DELETE FROM items`);
    await userRepository.query(`DELETE FROM users`);
    await app.close();
  });

  it("CM-PS01 - Crear reportes con buyer autenticado", async () => {
    const report1 = await incidentsService.createReport(
      { itemId: testItem.itemId, type: ReportType.OTHER, comment: "Roto" },
      testBuyer.userId
    );
    const report2 = await incidentsService.createReport(
      { itemId: testItem.itemId, type: ReportType.SPAM, comment: "Spam" },
      testBuyer.userId
    );

    expect(report1).toHaveProperty("reportId");
    expect(report2).toHaveProperty("reportId");
    expect(report1.type).toBe(ReportType.OTHER);
    expect(report2.type).toBe(ReportType.SPAM);
  });

  it("CM-PS02 - Crear incidente desde reporte", async () => {
    const report = await incidentsService.createReport(
      { itemId: testItem.itemId, type: ReportType.INAPPROPRIATE, comment: "Inapropiado" },
      testBuyer.userId
    );

    const incident = await incidentsService.createIncidentFromReport(
      report.reportId,
      "Descripcion del incidente",
      null
    );

    expect(incident).toHaveProperty("incidentId");
    expect(incident.itemId).toBe(testItem.itemId);
    expect(incident.status).toBe(ItemStatus.PENDING);
  });

  it("CM-PS03 - Crear apelacion para incidente", async () => {
    const incident = await incidentsService.createIncident(
      testItem.itemId,
      "Incidente para apelar"
    );

    const appeal = await incidentsService.createAppeal(
      { incidentId: incident.incidentId, reason: "No estoy de acuerdo" },
      testSeller.userId
    );

    expect(appeal).toHaveProperty("appealId");
    expect(appeal.sellerId).toBe(testSeller.userId);
  });

  it("CM-PS04 - Contar incidentes de un reporte", async () => {
    const report = await incidentsService.createReport(
      { itemId: testItem.itemId, type: ReportType.ILLEGAL, comment: "Ilegal" },
      testBuyer.userId
    );

    const count = await incidentsService.getReportIncidentsCount(report.reportId);
    expect(count).toHaveProperty("count");
    expect(count.count).toBeGreaterThanOrEqual(0);
  });
});
