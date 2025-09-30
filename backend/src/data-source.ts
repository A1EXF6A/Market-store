import { DataSource } from "typeorm";

import env from "./config/env";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host || "localhost",
  port: env.database.port || 5432,
  username: env.database.user || "postgres",
  password: env.database.password || "password",
  database: env.database.name || "ventas_multiempresa",
  synchronize: false,
  logging: true,
  entities: ["src/entities/*.entity{.ts,.js}"],
  migrations: ["src/migrations/*{.ts,.js}"],
});

export default AppDataSource;
