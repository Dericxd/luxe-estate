"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { UserProfile, UserRole, UserStatus } from "../../lib/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";

export const AdminUsersView = () => {
  const { dict } = useLanguage();
  const { user: currentUser, updateUserRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | UserRole>("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[AdminUsersView] Error fetching users:", error.message);
        // Fallback: If table is empty or error, use current authenticated user
        if (currentUser) {
          setUsers([
            {
              id: currentUser.id,
              email: currentUser.email || "user@luxeestate.com",
              full_name:
                currentUser.user_metadata?.full_name ||
                currentUser.user_metadata?.name ||
                "Admin User",
              avatar_url:
                currentUser.user_metadata?.avatar_url ||
                currentUser.user_metadata?.picture ||
                null,
              role: "admin",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        }
      } else if (data) {
        setUsers(data as UserProfile[]);
      }
    } catch (err) {
      console.error("[AdminUsersView] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole, newStatus?: UserStatus) => {
    try {
      setUpdatingId(userId);
      setOpenDropdownId(null);
      await updateUserRole(userId, newRole, newStatus);

      // Local optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: newRole, ...(newStatus ? { status: newStatus } : {}) }
            : u
        )
      );

      setToastMessage(dict.admin.users.successUpdate);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("[AdminUsersView] Error changing role:", err);
      setToastMessage(dict.admin.users.errorUpdate);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === "" ||
        (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      const matchTab = selectedTab === "all" || u.role === selectedTab;
      return matchSearch && matchTab;
    });
  }, [users, search, selectedTab]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-nordic text-white">
            {dict.admin.users.roles.admin}
          </span>
        );
      case "broker":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-mosque/15 text-mosque dark:text-[#06f9d0]">
            {dict.admin.users.roles.broker}
          </span>
        );
      case "agent":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            {dict.admin.users.roles.agent}
          </span>
        );
      case "viewer":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {dict.admin.users.roles.viewer}
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === "active") {
      return (
        <div className="flex items-center text-xs text-nordic/70 dark:text-gray-300">
          <span className="material-icons text-[14px] mr-1 text-mosque">check_circle</span>
          {dict.admin.users.statuses.active}
        </div>
      );
    }
    if (status === "suspended") {
      return (
        <div className="flex items-center text-xs text-red-600 dark:text-red-400 font-medium">
          <span className="material-icons text-[14px] mr-1">block</span>
          {dict.admin.users.statuses.suspended}
        </div>
      );
    }
    return (
      <div className="flex items-center text-xs text-nordic/40 dark:text-gray-500">
        <span className="material-icons text-[14px] mr-1">schedule</span>
        {dict.admin.users.statuses.inactive}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" ref={dropdownRef}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-nordic text-white px-5 py-3 rounded-xl shadow-dropdown flex items-center gap-3 text-sm animate-fade-in-up">
          <span className="material-icons text-mosque text-lg">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-nordic dark:text-white">
            {dict.admin.users.title}
          </h2>
          <p className="text-nordic/60 dark:text-gray-400 mt-1 text-sm">
            {dict.admin.users.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <span className="material-icons absolute inset-y-0 left-3 flex items-center text-nordic/40 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.admin.users.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-nordic/10 dark:border-white/10 bg-white dark:bg-[#152e2a] text-nordic dark:text-white text-sm shadow-soft focus:ring-2 focus:ring-mosque focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUsers}
              title="Recargar usuarios"
              className="p-2.5 border border-nordic/10 dark:border-white/10 rounded-lg bg-white dark:bg-[#152e2a] text-nordic/70 dark:text-gray-300 hover:text-mosque hover:bg-hint-green/20 transition-colors shadow-soft cursor-pointer"
            >
              <span className="material-icons text-lg">refresh</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-mosque text-sm font-medium rounded-lg text-mosque dark:text-[#06f9d0] dark:border-[#06f9d0]/60 bg-transparent hover:bg-mosque hover:text-white dark:hover:bg-mosque dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mosque transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <span className="material-icons text-lg mr-2">add</span>
              <span>{dict.admin.users.addUser}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-6 border-b border-nordic/10 dark:border-white/10 overflow-x-auto pb-px">
        <button
          onClick={() => setSelectedTab("all")}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            selectedTab === "all"
              ? "text-mosque border-b-2 border-mosque font-bold"
              : "text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
          }`}
        >
          {dict.admin.users.tabs.all}
        </button>
        <button
          onClick={() => setSelectedTab("admin")}
          className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
            selectedTab === "admin"
              ? "text-mosque border-b-2 border-mosque font-bold"
              : "text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
          }`}
        >
          {dict.admin.users.tabs.admins}
        </button>
        <button
          onClick={() => setSelectedTab("broker")}
          className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
            selectedTab === "broker"
              ? "text-mosque border-b-2 border-mosque font-bold"
              : "text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
          }`}
        >
          {dict.admin.users.tabs.brokers}
        </button>
        <button
          onClick={() => setSelectedTab("agent")}
          className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
            selectedTab === "agent"
              ? "text-mosque border-b-2 border-mosque font-bold"
              : "text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
          }`}
        >
          {dict.admin.users.tabs.agents}
        </button>
        <button
          onClick={() => setSelectedTab("viewer")}
          className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
            selectedTab === "viewer"
              ? "text-mosque border-b-2 border-mosque font-bold"
              : "text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white"
          }`}
        >
          {dict.admin.users.tabs.viewers}
        </button>
      </div>

      {/* Table Column Labels for Desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold uppercase tracking-wider text-nordic/50 dark:text-gray-400 mb-1">
        <div className="col-span-5">{dict.admin.users.tableHeaders.details}</div>
        <div className="col-span-3">{dict.admin.users.tableHeaders.roleStatus}</div>
        <div className="col-span-2">{dict.admin.users.tableHeaders.registered}</div>
        <div className="col-span-2 text-right">{dict.admin.users.tableHeaders.actions}</div>
      </div>

      {/* User Directory Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-nordic/50">
          <div className="w-8 h-8 border-4 border-mosque border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-[#152e2a] rounded-xl p-12 text-center text-nordic/50 dark:text-gray-400 border border-nordic/10 dark:border-white/5">
          <span className="material-icons text-4xl mb-2 text-nordic/30">people_outline</span>
          <p className="text-sm">{dict.admin.users.noUsersFound}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const shortId = u.id ? u.id.slice(0, 8).toUpperCase() : "USR";
            const isSelf = currentUser?.id === u.id;
            const isDropdownOpen = openDropdownId === u.id;
            const isUpdating = updatingId === u.id;

            return (
              <div
                key={u.id}
                className={`group relative rounded-xl p-4 sm:p-5 shadow-soft border transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-center ${
                  u.role === "admin"
                    ? "bg-hint-green/40 dark:bg-mosque/20 border-mosque/20"
                    : "bg-white dark:bg-[#152e2a] border-nordic/5 dark:border-white/5 hover:border-mosque/20 hover:bg-hint-green/10"
                }`}
              >
                {/* Details */}
                <div className="col-span-12 md:col-span-5 flex items-center w-full">
                  <div className="relative flex-shrink-0">
                    {u.avatar_url ? (
                      <img
                        alt={u.full_name || u.email}
                        src={u.avatar_url}
                        className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-mosque"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-mosque/15 text-mosque font-bold flex items-center justify-center border-2 border-white dark:border-mosque text-lg">
                        {(u.full_name || u.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#152e2a] ${
                        u.status === "active"
                          ? "bg-emerald-500"
                          : u.status === "suspended"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div className="ml-4 overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-nordic dark:text-white truncate">
                        {u.full_name || "Usuario"}
                      </div>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-mosque/10 text-mosque font-semibold">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-nordic/70 dark:text-gray-300 truncate">
                      {u.email}
                    </div>
                    <div className="mt-1 text-[10px] px-2 py-0.5 inline-block bg-white/70 dark:bg-white/10 rounded text-nordic/60 dark:text-gray-400">
                      ID: #{shortId}
                    </div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="col-span-12 md:col-span-3 w-full flex items-center justify-between md:justify-start gap-4">
                  {getRoleBadge(u.role)}
                  {getStatusBadge(u.status)}
                </div>

                {/* Registered Date */}
                <div className="col-span-12 md:col-span-2 w-full">
                  <div className="text-[10px] uppercase tracking-wider text-nordic/40 dark:text-gray-500">
                    {dict.admin.users.tableHeaders.registered}
                  </div>
                  <div className="text-xs font-semibold text-nordic dark:text-white mt-0.5">
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions / Change Role Dropdown */}
                <div className="col-span-12 md:col-span-2 w-full flex justify-end relative">
                  <button
                    disabled={isUpdating}
                    onClick={() =>
                      setOpenDropdownId(isDropdownOpen ? null : u.id)
                    }
                    className={`inline-flex items-center px-3.5 py-1.5 border text-xs font-semibold rounded-lg shadow-sm transition-all w-full md:w-auto justify-center gap-1 cursor-pointer ${
                      isDropdownOpen
                        ? "bg-mosque text-white border-mosque shadow-md"
                        : "border-nordic/15 dark:border-white/10 bg-white dark:bg-[#1a3833] text-nordic dark:text-white hover:border-mosque hover:text-mosque"
                    }`}
                  >
                    <span>{dict.admin.users.changeRole}</span>
                    <span className="material-icons text-[16px]">
                      {isDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 rounded-xl shadow-dropdown bg-white dark:bg-[#152e2a] border border-nordic/10 dark:border-white/10 focus:outline-none overflow-hidden z-50 origin-top-right animate-fade-in-down py-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nordic/40 dark:text-gray-500 border-b border-nordic/5 dark:border-white/5">
                        Seleccionar Rol
                      </div>

                      <button
                        onClick={() => handleRoleChange(u.id, "admin")}
                        className={`group w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          u.role === "admin"
                            ? "bg-mosque/10 text-mosque font-bold"
                            : "text-nordic dark:text-gray-200 hover:bg-hint-green/30 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="material-icons text-sm mr-2.5 text-mosque">shield</span>
                        <span>{dict.admin.users.roles.admin}</span>
                      </button>

                      <button
                        onClick={() => handleRoleChange(u.id, "broker")}
                        className={`group w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          u.role === "broker"
                            ? "bg-mosque/10 text-mosque font-bold"
                            : "text-nordic dark:text-gray-200 hover:bg-hint-green/30 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="material-icons text-sm mr-2.5 text-nordic/50 group-hover:text-mosque">
                          business_center
                        </span>
                        <span>{dict.admin.users.roles.broker}</span>
                      </button>

                      <button
                        onClick={() => handleRoleChange(u.id, "agent")}
                        className={`group w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          u.role === "agent"
                            ? "bg-mosque/10 text-mosque font-bold"
                            : "text-nordic dark:text-gray-200 hover:bg-hint-green/30 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="material-icons text-sm mr-2.5 text-nordic/50 group-hover:text-mosque">
                          support_agent
                        </span>
                        <span>{dict.admin.users.roles.agent}</span>
                      </button>

                      <button
                        onClick={() => handleRoleChange(u.id, "viewer")}
                        className={`group w-full flex items-center px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                          u.role === "viewer"
                            ? "bg-mosque/10 text-mosque font-bold"
                            : "text-nordic dark:text-gray-200 hover:bg-hint-green/30 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="material-icons text-sm mr-2.5 text-nordic/50 group-hover:text-mosque">
                          visibility
                        </span>
                        <span>{dict.admin.users.roles.viewer}</span>
                      </button>

                      <div className="border-t border-nordic/10 dark:border-white/10 my-1"></div>

                      {u.status === "suspended" ? (
                        <button
                          onClick={() => handleRoleChange(u.id, u.role, "active")}
                          className="w-full flex items-center px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-left cursor-pointer"
                        >
                          <span className="material-icons text-sm mr-2.5">check_circle</span>
                          <span>{dict.admin.users.activateUser}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u.id, u.role, "suspended")}
                          className="w-full flex items-center px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                        >
                          <span className="material-icons text-sm mr-2.5">block</span>
                          <span>{dict.admin.users.suspendUser}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
