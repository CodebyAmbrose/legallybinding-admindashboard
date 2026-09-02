import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, status: 401, userId: null };
  const allowlist = (process.env.ADMIN_CLERK_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!allowlist.includes(userId)) return { ok: false as const, status: 403, userId };
  return { ok: true as const, userId };
}
