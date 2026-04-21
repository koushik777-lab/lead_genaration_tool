import { Queue } from "bullmq";
import redis from "./redis.js";

export const emailQueue = new Queue("emailQueue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

export const addEmailToQueue = async (data) => {
  await emailQueue.add("sendEmail", data);
};
