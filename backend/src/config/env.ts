import * as dotenv from "dotenv";

// Cargar .env local en desarrollo (dentro de Docker simplemente no existe)
dotenv.config();

interface Config {
  port: number;
  database: {
    url: string;
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

const env: Config = {
  port: Number(process.env.PORT || 3000),

  database: {
    // DATABASE_URL tiene prioridad absoluta (ideal en Docker)
    url:
      process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || "postgres"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "marketstore"}`,

    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    name: process.env.DB_NAME || "marketstore",
  },

  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
};

export default env;
