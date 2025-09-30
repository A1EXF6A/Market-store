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
    user: string;
    pass: string;
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
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    name: process.env.DB_NAME || "postgres",
  },
  email: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
};

export default env;
