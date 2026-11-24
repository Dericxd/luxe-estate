"use client";

import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { AdminPropertiesView } from "../components/admin/AdminPropertiesView";
import { AdminUsersView } from "../components/admin/AdminUsersView";
import { Property } from "../lib/types";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface AdminDashboardClientProps {
  initialProperties: Property[];
}

export const AdminDashboardClient = ({
  initialProperties,
}: AdminDashboardClientProps) => {
  const { dict } = useLanguage();
  const { role, displayName, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"properties" | "users">("properties");

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-nordic dark:text-gray-100">
      <Navbar />

      <div className="bg-white dark:bg-[#152e2a] border-b border-nordic/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-mosque text-white flex items-center justify-center shadow-sm">
                <span className="material-icons text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-nordic dark:text-white tracking-tight">
                  {dict.admin.title}
                </h1>
                <p className="text-xs sm:text-sm text-nordic/60 dark:text-gray-400">
                  {dict.admin.subtitle}
                </p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2 self-start sm:self-auto bg-background-light dark:bg-background-dark px-3.5 py-2 rounded-xl border border-nordic/10 dark:border-white/10">
                <span className="material-icons text-mosque text-base">verified_user</span>
                <span className="text-xs font-medium text-nordic dark:text-gray-200">
                  {displayName || user.email}
                </span>
                {role && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mosque text-white">
                    {role}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("properties")}
              className={`pb-3.5 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "properties"
                  ? "border-mosque text-mosque"
                  : "border-transparent text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
                }`}
            >
              <span className="material-icons text-lg">apartment</span>
              <span>{dict.admin.tabs.properties}</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-mosque/10 text-mosque font-bold">
                {initialProperties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`pb-3.5 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "users"
                  ? "border-mosque text-mosque"
                  : "border-transparent text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
                }`}
            >
              <span className="material-icons text-lg">group</span>
              <span>{dict.admin.tabs.users}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === "properties" ? (
          <AdminPropertiesView initialProperties={initialProperties} />
        ) : (
          <AdminUsersView />
        )}
      </main>

      <footer className="mt-auto border-t border-nordic/10 dark:border-white/10 bg-white dark:bg-[#152e2a]">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm text-nordic/50 dark:text-gray-500">
            © {new Date().getFullYear()} LuxeEstate Administration. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

