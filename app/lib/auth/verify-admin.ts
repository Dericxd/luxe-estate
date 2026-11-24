export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "no-token" | "invalid-token" | "forbidden" | "error" };

/**
 * Verificación estricta (fail-closed) en servidor del token de sesión y del rol 'admin' activo
 * contra Supabase Auth (/auth/v1/user) y PostgREST (/rest/v1/user_roles).
 * Nunca confía en cookies de rol manipulables desde el cliente.
 */
export async function verifyAdmin(token: string | undefined): Promise<AdminCheck> {
  if (!token) {
    return { ok: false, reason: "no-token" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, reason: "error" };
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    };

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers,
      cache: "no-store",
    });

    if (!userRes.ok) {
      return { ok: false, reason: "invalid-token" };
    }

    const userData: { id?: string } = await userRes.json();
    if (!userData?.id) {
      return { ok: false, reason: "invalid-token" };
    }

    const roleRes = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?id=eq.${encodeURIComponent(userData.id)}&select=role,status`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!roleRes.ok) {
      return { ok: false, reason: "error" };
    }

    const roles: Array<{ role?: string; status?: string }> = await roleRes.json();
    const userRole = roles[0];

    if (userRole?.role === "admin" && userRole?.status === "active") {
      return { ok: true, userId: userData.id };
    }

    return { ok: false, reason: "forbidden" };
  } catch (err) {
    console.error("[verifyAdmin] Error validating admin session:", err);
    return { ok: false, reason: "error" };
  }
}
