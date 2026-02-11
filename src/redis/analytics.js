// src/redis/analytics.js
import redis from "./client.js";

export async function incrementAnalytics({ paidCups = 0, freeCups = 0 }) {
  try {
    if (paidCups > 0) {
      await redis.incrby("analytics:cupsSold", paidCups);
    }
    if (freeCups > 0) {
      await redis.incrby("analytics:cupsRedeemed", freeCups);
    }
  } catch (err) {
    // IMPORTANT: never break main flow
    console.error("Redis increment failed:", err.message);
  }
}