"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { dict } = useLanguage();
  const { user, avatarUrl, displayName, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-nordic-dark/10 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-nordic-dark flex items-center justify-center">
              <span className="material-icons text-white text-lg">apartment</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic-dark dark:text-white">LuxeEstate</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-mosque font-medium text-sm border-b-2 border-mosque px-1 py-1" href="#">{dict.navbar.buy}</a>
            <a className="text-nordic-dark/70 dark:text-white/70 hover:text-nordic-dark dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all" href="#">{dict.navbar.rent}</a>
            <a className="text-nordic-dark/70 dark:text-white/70 hover:text-nordic-dark dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all" href="#">{dict.navbar.sell}</a>
            <a className="text-nordic-dark/70 dark:text-white/70 hover:text-nordic-dark dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all" href="#">{dict.navbar.savedHomes}</a>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-5">
            <LanguageSelector />
            <ThemeToggle />
            <button className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors">
              <span className="material-icons">search</span>
            </button>
            <button className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors relative">
              <span className="material-icons">notifications_none</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark transition-colors duration-300"></span>
            </button>

            <div className="relative pl-2 border-l border-nordic-dark/10 dark:border-white/10 ml-2" ref={dropdownRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 cursor-pointer"
                    aria-label="User menu"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden ring-2 ring-transparent hover:ring-mosque transition-all flex items-center justify-center">
                      {avatarUrl ? (
                        <img
                          alt={displayName || "Profile"}
                          className="w-full h-full object-cover"
                          src={avatarUrl}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="material-icons text-nordic-dark dark:text-white text-xl">
                          person
                        </span>
                      )}
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#152e2a] shadow-soft border border-nordic-dark/10 dark:border-white/10 py-2 z-50">
                      <div className="px-4 py-2 border-b border-nordic-dark/5 dark:border-white/5">
                        {displayName && (
                          <p className="text-sm font-medium text-nordic-dark dark:text-white truncate">
                            {displayName}
                          </p>
                        )}
                        {user.email && (
                          <p className="text-xs text-nordic-muted dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setMenuOpen(false);
                          await signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-nordic-dark/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-icons text-base">logout</span>
                        <span>{dict.navbar.signOut}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2"
                  title={dict.navbar.signIn}
                >
                  <div className="w-9 h-9 rounded-full bg-mosque/10 dark:bg-white/10 text-mosque dark:text-white overflow-hidden ring-2 ring-transparent hover:ring-mosque transition-all flex items-center justify-center">
                    <span className="material-icons text-xl">person_outline</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="md:hidden border-t border-nordic-dark/5 bg-background-light dark:bg-background-dark overflow-hidden h-0 transition-all duration-300">
        <div className="px-4 py-2 space-y-1">
          <a className="block px-3 py-2 rounded-md text-base font-medium text-mosque bg-mosque/10" href="#">{dict.navbar.buy}</a>
          <a className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5" href="#">{dict.navbar.rent}</a>
          <a className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5" href="#">{dict.navbar.sell}</a>
          <a className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5" href="#">{dict.navbar.savedHomes}</a>
        </div>
      </div>
    </nav>
  );
};
