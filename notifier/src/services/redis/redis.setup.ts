import { Redis } from "ioredis";

const connectionString = process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

export const redisConnection = new Redis(connectionString, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});