import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "luxe-auth-token";
const ROLE_COOKIE = "luxe-auth-role";
const MAX_AGE_ONE_WEEK = 60 * 60 * 24 * 7;

/**
 * POST /api/auth/session
 * Establece el token de sesión en una cookie HttpOnly segura gestionada únicamente por el servidor.
 */
export async function POST(request: Request) {
  try {
    const body: { accessToken?: string | null } = await request.json();
    const accessToken = body?.accessToken;
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    if (typeof accessToken === "string" && accessToken.trim() !== "") {
      cookieStore.set(TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE_ONE_WEEK,
      });
    } else {
      cookieStore.delete(TOKEN_COOKIE);
      cookieStore.delete(ROLE_COOKIE);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

/**
 * DELETE /api/auth/session
 * Elimina las cookies de sesión HttpOnly al cerrar sesión.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
  return NextResponse.json({ ok: true });
}
