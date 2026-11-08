"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_NAME, Locale, SUPPORTED_LOCALES } from "./config";
import type { Dictionary } from "./dictionaries";
import es from "./dictionaries/es.json";
import en from "./dictionaries/en.json";
import it from "./dictionaries/it.json";
import fr from "./dictionaries/fr.json";

const CLIENT_DICTIONARIES: Record<Locale, Dictionary> = {
  es,
  en,
  it,
  fr,
};

interface LanguageContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (newLocale: Locale) => void;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  initialLocale: Locale;
  initialDictionary: Dictionary;
  children: React.ReactNode;
}

export function LanguageProvider({
  initialLocale,
  initialDictionary,
  children,
}: LanguageProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const dict = locale === initialLocale ? initialDictionary : CLIENT_DICTIONARIES[locale];

  const setLocale = (newLocale: Locale) => {
    // Persist user preference in a cookie for 1 year
    document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = newLocale;
    setLocaleState(newLocale);
    router.refresh();
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        dict,
        setLocale,
        supportedLocales: SUPPORTED_LOCALES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
