export const COOKIE_NAME = "NEXT_LOCALE";
export const DEFAULT_LOCALE = "es";

export const SUPPORTED_LOCALES = [
  { code: "es", name: "Español", flag: "🇪🇸", shortLabel: "ES" },
  { code: "en", name: "English", flag: "🇺🇸", shortLabel: "EN" },
  { code: "it", name: "Italiano", flag: "🇮🇹", shortLabel: "IT" },
  { code: "fr", name: "Français", flag: "🇫🇷", shortLabel: "FR" },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"];

export function isValidLocale(locale: string | undefined | null): locale is Locale {
  return SUPPORTED_LOCALES.some((l) => l.code === locale);
}

