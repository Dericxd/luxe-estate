export type UserCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "no-token" | "invalid-token" | "error" };

/**
 * Verificación fail-closed en servidor del token de sesión contra Supabase Auth (/auth/v1/user).
 * Valida que el usuario esté autenticado sin requerir rol administrador.
 */
export async function verifyUser(token: string | undefined): Promise<UserCheck> {
  if (!token) {
    return { ok: false, reason: "no-token" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, reason: "error" };
  }

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      return { ok: false, reason: "invalid-token" };
    }

    const userData: { id?: string } = await userRes.json();
    if (!userData?.id) {
      return { ok: false, reason: "invalid-token" };
    }

    return { ok: true, userId: userData.id };
  } catch (err) {
    console.error("[verifyUser] Error validating user session:", err);
    return { ok: false, reason: "error" };
  }
}
