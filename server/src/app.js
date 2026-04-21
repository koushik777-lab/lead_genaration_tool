import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import router from "./routes/index.js";

const app = express();

// Global Rate Limiter: 100 requests per 15 min (Production) / 1000 (Development)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 100 : 1000,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

// Stricter limiter for Search & Auth
const stricterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 20 : 100,
  message: { error: "Sensitive API limit reached, please try again after 15 minutes" },
});

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiters in production only
if (env.NODE_ENV === "production") {
  app.use("/api/auth", stricterLimiter);
  app.use("/api/search", stricterLimiter);
  app.use("/api", globalLimiter);
}
app.use("/api", router);

// Error Handler
import errorHandler from "./middleware/error.js";
app.use(errorHandler);

export default app;
