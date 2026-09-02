import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getClerkUserActivityMetrics } from "@/lib/clerk-user-metrics";

export async function GET(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Admin access required" }, { status: access.status });
  const url = new URL(request.url);
  const query = (url.searchParams.get("query") || "").trim();
  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  try {
    const client = await clerkClient();
    const [result, activity] = await Promise.all([
      client.users.getUserList({ limit: 50, offset: page * 50, query: query || undefined, orderBy: "-created_at" }),
      getClerkUserActivityMetrics(),
    ]);
    return NextResponse.json({
      users: result.data.map(user => ({ id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed user", email: user.emailAddresses[0]?.emailAddress || "—", imageUrl: user.imageUrl, createdAt: user.createdAt, lastSignInAt: user.lastSignInAt, banned: user.banned, locked: user.locked, role: user.publicMetadata?.role || "User" })),
      total: result.totalCount,
      stats: {
        activeUsers: activity.activeUsers,
        activeSince: activity.activeSince,
        newUsers: activity.newUsers,
        suspendedUsers: activity.suspendedUsers,
      },
      page,
      pageSize: 50,
    });
  } catch (error) {
    console.error("Admin users query failed", error);
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  }
}
