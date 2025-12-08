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
  url: env.database.url,
  synchronize: false,
  logging: true,
  entities: [User, Item, ItemPhoto, Service, Favorite, Report, Appeal, Incident, Chat, Message, Rating],
  // Point to source migrations for ts-node CLI runs
  migrations: ["src/migrations/*{.ts,.js}"],
});

export default AppDataSource;
