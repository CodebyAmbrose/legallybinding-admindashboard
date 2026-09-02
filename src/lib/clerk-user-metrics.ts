import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;
const CACHE_DURATION_MS = 60_000;
type DailyUserGrowth = { date: string; users: number; total: number };
type Metrics = { activeUsers: number; totalUsers: number; newUsers: number; suspendedUsers: number; activeSince: string; dailyGrowth: DailyUserGrowth[] };
let cache: { expiresAt: number; value: Metrics } | null = null;

export async function getClerkUserActivityMetrics(): Promise<Metrics> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const activeSinceTimestamp = Date.now() - ACTIVE_WINDOW_MS;
  const growthStart = new Date();
  growthStart.setUTCHours(0, 0, 0, 0);
  growthStart.setUTCDate(growthStart.getUTCDate() - 29);
  const client = await clerkClient();
  let offset = 0;
  let totalUsers = 0;
  let activeUsers = 0;
  let newUsers = 0;
  let suspendedUsers = 0;
  const dailyRegistrations = new Map<string, number>();
  do {
    const result = await client.users.getUserList({ limit: PAGE_SIZE, offset });
    totalUsers = result.totalCount;
    activeUsers += result.data.filter(user => !user.banned && !user.locked && user.lastSignInAt !== null && user.lastSignInAt >= activeSinceTimestamp).length;
    newUsers += result.data.filter(user => user.createdAt >= activeSinceTimestamp).length;
    suspendedUsers += result.data.filter(user => user.banned || user.locked).length;
    result.data.forEach(user => {
      if (user.createdAt < growthStart.getTime()) return;
      const date = new Date(user.createdAt).toISOString().slice(0, 10);
      dailyRegistrations.set(date, (dailyRegistrations.get(date) ?? 0) + 1);
    });
    offset += result.data.length;
    if (!result.data.length) break;
  } while (offset < totalUsers);
  let runningTotal = totalUsers - Array.from(dailyRegistrations.values()).reduce((sum, count) => sum + count, 0);
  const dailyGrowth = Array.from({ length: 30 }, (_, index) => {
    const dateValue = new Date();
    dateValue.setUTCHours(0, 0, 0, 0);
    dateValue.setUTCDate(dateValue.getUTCDate() - (29 - index));
    const date = dateValue.toISOString().slice(0, 10);
    const users = dailyRegistrations.get(date) ?? 0;
    runningTotal += users;
    return { date, users, total: runningTotal };
  });
  const value = { activeUsers, totalUsers, newUsers, suspendedUsers, activeSince: new Date(activeSinceTimestamp).toISOString(), dailyGrowth };
  cache = { expiresAt: Date.now() + CACHE_DURATION_MS, value };
  return value;
}
