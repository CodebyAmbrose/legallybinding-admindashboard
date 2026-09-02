import { getAdminSupabase } from "@/lib/supabase-admin";

type AdminSupabase = ReturnType<typeof getAdminSupabase>;

export type AdminOwner = {
  id: string;
  name: string | null;
  email: string | null;
};

export type RelatedDocument = {
  id?: string;
  filename: string;
  original_filename: string;
  status: string;
  classification: string | null;
  created_at?: string;
};

export function parsePage(value: string | null) {
  const page = Number(value ?? 0);
  return Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
}

export function sanitizeSearch(value: string | null) {
  return (value ?? "").replace(/[,%()]/g, " ").trim().slice(0, 120);
}

export function normalizeDocument(value: RelatedDocument | RelatedDocument[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function loadOwners(database: AdminSupabase, ownerIds: string[]) {
  const uniqueIds = [...new Set(ownerIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, AdminOwner>();

  const result = await database
    .from("profiles")
    .select("clerk_user_id,name,email")
    .in("clerk_user_id", uniqueIds);

  if (result.error) throw result.error;

  return new Map(
    (result.data ?? []).map(profile => [
      profile.clerk_user_id,
      { id: profile.clerk_user_id, name: profile.name, email: profile.email },
    ]),
  );
}

export function resolveOwner(ownerMap: Map<string, AdminOwner>, ownerId: string): AdminOwner {
  return ownerMap.get(ownerId) ?? { id: ownerId, name: null, email: null };
}

export function errorDetail(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return String(error);
}
