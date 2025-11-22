try {
  process.loadEnvFile(__dirname + "/../../.env");
} catch (error) {}

interface Config {
  port: number;
  databaseUrl: string;
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
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/postgres",
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
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
