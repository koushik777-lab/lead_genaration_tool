import { Worker } from "bullmq";
import redis from "../lib/redis.js";
import { sendEmail } from "../lib/email.js";
import logger from "../lib/logger.js";

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, html, text } = job.data;
    logger.info(`Processing email job ${job.id} for ${to}`);
    
    const result = await sendEmail({ to, subject, html, text });
    
    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }
    
    return result.data;
  },
  { connection: redis }
);

emailWorker.on("completed", (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`Email job ${job.id} failed: ${err.message}`);
});

export default emailWorker;
