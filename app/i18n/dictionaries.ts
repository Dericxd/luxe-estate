import { cookies } from "next/headers";
import { COOKIE_NAME, DEFAULT_LOCALE, isValidLocale, Locale } from "./config";

import es from "./dictionaries/es.json";
import en from "./dictionaries/en.json";
import it from "./dictionaries/it.json";
import fr from "./dictionaries/fr.json";

export type Dictionary = typeof es;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  es,
  en,
  it,
  fr,
};

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(COOKIE_NAME)?.value;
  if (isValidLocale(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

export async function getServerDictionary(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getServerLocale();
  return {
    locale,
    dict: DICTIONARIES[locale],
  };
}

