// routes/testRedis.ts
import { Router } from "express";
import redis from "../redis/client.js";

const router = Router();

router.get("/redis-test", async (req, res) => {
  await redis.set("test:key", "redis-connected");
  const value = await redis.get("test:key");

  res.json({
    success: true,
    value,
  });
});

export default router;