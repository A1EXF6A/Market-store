import { DataSource } from "typeorm";

import env from "./config/env";
import { User } from "./entities/user.entity";
import { Item } from "./entities/item.entity";
import { ItemPhoto } from "./entities/item-photo.entity";
import { Service } from "./entities/service.entity";
import { Favorite } from "./entities/favorite.entity";
import { Report } from "./entities/report.entity";
import { Appeal } from "./entities/appeal.entity";
import { Incident } from "./entities/incident.entity";
import { Chat } from "./entities/chat.entity";
import { Message } from "./entities/message.entity";
import { Rating } from "./entities/rating.entity";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host || "localhost",
  port: env.database.port || 5432,
  username: env.database.user || "postgres",
  password: env.database.password || "Youpikne/47",
  database: env.database.name || "sistema_ventas",
  synchronize: false,
  logging: true,
  entities: [User, Item, ItemPhoto, Service, Favorite, Report, Appeal, Incident, Chat, Message, Rating],
  migrations: ["dist/migrations/*{.ts,.js}"],
});

export default AppDataSource;
