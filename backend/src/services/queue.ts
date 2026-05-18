import { Queue } from "bullmq";
import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const notifierQueue = new Queue("notifierQueue", {
  connection,
});
