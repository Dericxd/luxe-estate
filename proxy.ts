import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  isValidLocale,
  Locale,
  SUPPORTED_LOCALES,
} from "./app/i18n/config";
import { verifyAdmin } from "./app/lib/auth/verify-admin";

function detectPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferredLanguages = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";q=");
      return {
        code: lang.toLowerCase().split("-")[0],
        q: qPart ? parseFloat(qPart) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const pref of preferredLanguages) {
    const match = SUPPORTED_LOCALES.find((l) => l.code === pref.code);
    if (match) {
      return match.code;
    }
  }

  return DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas administrativas (/admin y subrutas) con política fail-closed
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("luxe-auth-token")?.value;
    const check = await verifyAdmin(token);

    if (!check.ok) {
      if (check.reason === "no-token" || check.reason === "invalid-token") {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        const redirectResp = NextResponse.redirect(loginUrl);

        if (check.reason === "invalid-token") {
          redirectResp.cookies.delete("luxe-auth-token");
          redirectResp.cookies.delete("luxe-auth-role");
        }
        return redirectResp;
      }

      // Usuario sin rol admin activo o error de verificación (fail-closed)
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Gestión de idioma (cookie i18n)
  const response = NextResponse.next();
  const existingLocale = request.cookies.get(COOKIE_NAME)?.value;

  if (!isValidLocale(existingLocale)) {
    const detectedLocale = detectPreferredLocale(request);
    response.cookies.set(COOKIE_NAME, detectedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
