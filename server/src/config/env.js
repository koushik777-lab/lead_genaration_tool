import { cleanEnv, str, port, url } from "envalid";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "test", "production"], default: "development" }),
  PORT: port({ default: 5000 }),
  MONGODB_URI: str(),
  REDIS_URL: str({ default: "redis://localhost:6379" }),
  JWT_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  ADMIN_REGISTRATION_KEY: str(),
  RESEND_API_KEY: str(),
  SERPAPI_KEY: str(),
  CLIENT_URL: url({ default: "http://localhost:5173" }),
});

export default env;
