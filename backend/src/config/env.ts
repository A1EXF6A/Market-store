process.loadEnvFile(__dirname + "/../../.env");

interface Config {
  port: number;
  database: {
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
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "12345",
    name: process.env.DB_NAME || "marketstore",
  },
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
