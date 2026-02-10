import redis from "./client.js";

/**
 * Increment live analytics counters
 * Safe: ignores 0 / undefined values
 */
export async function updateAnalyticsCounters({
  paidCups = 0,
  freeCups = 0,
}) {
  const ops = [];

  if (paidCups > 0) {
    ops.push(redis.incrBy("analytics:cupsSold", paidCups));
  }

  if (freeCups > 0) {
    ops.push(redis.incrBy("analytics:cupsRedeemed", freeCups));
  }

  // Fire & forget safely
  try {
    await Promise.all(ops);
  } catch (err) {
    console.error("Redis analytics update failed:", err.message);
    // DO NOT throw → never break core flow
  }
}