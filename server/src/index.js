import env from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./lib/logger.js";

const PORT = env.PORT;

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
    app.listen(PORT, () => {
      logger.info(`🚀 Enterprise Server running on http://localhost:${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
