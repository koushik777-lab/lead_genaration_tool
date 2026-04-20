import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5001;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
}

start();
