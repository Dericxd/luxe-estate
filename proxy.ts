import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  isValidLocale,
  Locale,
  SUPPORTED_LOCALES,
} from "./app/i18n/config";

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

export function proxy(request: NextRequest) {
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

