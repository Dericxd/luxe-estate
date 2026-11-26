"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { dict } = useLanguage();
  const { user, avatarUrl, displayName, role, isAdmin, signOut } = useAuth();
  const { savedCount } = useFavorites();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isExploreActive = pathname === "/";
  const isSavedActive = pathname === "/saved" || pathname.startsWith("/saved/");
  const isAdminActive = pathname === "/admin" || pathname.startsWith("/admin/");

  const handleSignOut = async () => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    if (isSavedActive || isAdminActive) {
      router.replace("/");
    }
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-nordic-dark/10 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-nordic-dark flex items-center justify-center">
              <span className="material-icons text-white text-lg">apartment</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic-dark dark:text-white">
              LuxeEstate
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium text-sm px-1 py-1 transition-all ${
                isExploreActive
                  ? "text-mosque border-b-2 border-mosque"
                  : "text-nordic-dark/70 dark:text-white/70 hover:text-nordic-dark dark:hover:text-white hover:border-b-2 hover:border-nordic-dark/20"
              }`}
            >
              {dict.navbar.explore}
            </Link>

            <Link
              href="/saved"
              className={`font-medium text-sm px-1 py-1 transition-all flex items-center gap-1.5 ${
                isSavedActive
                  ? "text-mosque border-b-2 border-mosque"
                  : "text-nordic-dark/70 dark:text-white/70 hover:text-nordic-dark dark:hover:text-white hover:border-b-2 hover:border-nordic-dark/20"
              }`}
            >
              <span className={`material-icons text-base ${isSavedActive ? "text-mosque" : ""}`}>
                {user && savedCount > 0 ? "favorite" : "favorite_border"}
              </span>
              <span>{dict.navbar.savedHomes}</span>
              {user && savedCount > 0 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-mosque/10 text-mosque leading-none">
                  {savedCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`font-semibold text-sm px-1 py-1 transition-all flex items-center gap-1 ${
                  isAdminActive
                    ? "text-mosque border-b-2 border-mosque"
                    : "text-nordic-dark/80 dark:text-white/80 hover:text-mosque dark:hover:text-white hover:border-b-2 hover:border-mosque"
                }`}
              >
                <span className="material-icons text-base text-mosque">dashboard</span>
                <span>{dict.navbar.dashboard}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <LanguageSelector />
            <ThemeToggle />

            {user && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((prev) => !prev);
                    setMenuOpen(false);
                  }}
                  aria-label={dict.navbar.notifications}
                  aria-expanded={notificationsOpen}
                  className="p-2 rounded-full text-nordic-dark hover:text-mosque dark:text-gray-300 dark:hover:text-white hover:bg-nordic-dark/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <span className="material-icons">notifications_none</span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-[#152e2a] shadow-soft border border-nordic-dark/10 dark:border-white/10 p-4 z-50">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-nordic-dark/5 dark:border-white/5">
                      <span className="text-sm font-semibold text-nordic-dark dark:text-white">
                        {dict.navbar.notifications}
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-center py-3 gap-2">
                      <div className="w-10 h-10 rounded-full bg-mosque/10 text-mosque flex items-center justify-center">
                        <span className="material-icons text-xl">notifications_none</span>
                      </div>
                      <p className="text-sm font-medium text-nordic-dark dark:text-white">
                        {dict.navbar.notificationsEmpty}
                      </p>
                      <p className="text-xs text-nordic-muted dark:text-gray-400 leading-relaxed">
                        {dict.navbar.notificationsHint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              className="relative pl-2 border-l border-nordic-dark/10 dark:border-white/10 ml-1"
              ref={dropdownRef}
            >
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen((prev) => !prev);
                      setNotificationsOpen(false);
                    }}
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
                        <div className="flex items-center justify-between gap-2">
                          {displayName && (
                            <p className="text-sm font-medium text-nordic-dark dark:text-white truncate">
                              {displayName}
                            </p>
                          )}
                          {role && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mosque/10 text-mosque border border-mosque/20">
                              {role}
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-xs text-nordic-muted dark:text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        )}
                      </div>

                      <Link
                        href="/saved"
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-nordic-dark dark:text-white hover:bg-nordic-dark/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer border-b border-nordic-dark/5 dark:border-white/5"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-icons text-base text-mosque">favorite_border</span>
                          <span>{dict.navbar.savedHomes}</span>
                        </span>
                        {savedCount > 0 && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-mosque/10 text-mosque">
                            {savedCount}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-nordic-dark dark:text-white hover:bg-nordic-dark/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer border-b border-nordic-dark/5 dark:border-white/5"
                        >
                          <span className="material-icons text-base text-mosque">dashboard</span>
                          <span>{dict.navbar.dashboard}</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleSignOut}
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

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? dict.navbar.closeMenu : dict.navbar.openMenu}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-nordic-dark dark:text-white hover:bg-nordic-dark/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-icons">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-nordic-dark/5 dark:border-white/10 bg-background-light dark:bg-background-dark">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isExploreActive
                  ? "text-mosque bg-mosque/10"
                  : "text-nordic-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {dict.navbar.explore}
            </Link>
            <Link
              href="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isSavedActive
                  ? "text-mosque bg-mosque/10"
                  : "text-nordic-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-icons text-lg">
                  {user && savedCount > 0 ? "favorite" : "favorite_border"}
                </span>
                <span>{dict.navbar.savedHomes}</span>
              </span>
              {user && savedCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mosque/10 text-mosque">
                  {savedCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isAdminActive
                    ? "text-mosque bg-mosque/10"
                    : "text-nordic-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="material-icons text-lg text-mosque">dashboard</span>
                <span>{dict.navbar.dashboard}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
