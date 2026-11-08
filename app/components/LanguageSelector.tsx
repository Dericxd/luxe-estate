"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export function LanguageSelector() {
  const { locale, dict, setLocale, supportedLocales } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang =
    supportedLocales.find((l) => l.code === locale) || supportedLocales[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={dict.navbar.languageSelectorLabel}
        aria-expanded={isOpen}
        className="h-9 px-2.5 rounded-full flex items-center gap-1.5 text-sm font-medium text-nordic-dark hover:bg-black/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="text-xs font-semibold tracking-wider uppercase">
          {currentLang.shortLabel}
        </span>
        <span
          className={`material-icons text-base transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-nordic-dark/10 dark:border-white/10 py-1.5 z-50 overflow-hidden"
        >
          {supportedLocales.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${isSelected
                    ? "bg-mosque/10 text-mosque font-semibold"
                    : "text-nordic-dark dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                {isSelected && (
                  <span className="material-icons text-mosque text-sm">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

