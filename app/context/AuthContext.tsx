"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserRole, UserStatus } from "../lib/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  avatarUrl: string | null;
  displayName: string | null;
  role: UserRole | null;
  status: UserStatus | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole, newStatus?: UserStatus) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractAvatarUrl(user: User | null): string | null {
  if (!user) return null;

  const metadataAvatar =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (typeof metadataAvatar === "string" && metadataAvatar.trim() !== "") {
    return metadataAvatar;
  }

  if (Array.isArray(user.identities)) {
    for (const identity of user.identities) {
      const idAvatar =
        identity.identity_data?.avatar_url || identity.identity_data?.picture;
      if (typeof idAvatar === "string" && idAvatar.trim() !== "") {
        return idAvatar;
      }
    }
  }

  return null;
}

function extractDisplayName(user: User | null): string | null {
  if (!user) return null;
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.user_name ||
    user.email ||
    null
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Sincroniza el token en una cookie HttpOnly real mediante /api/auth/session.
  // La autorización en servidor (proxy.ts y app/admin/page.tsx) lee esa cookie HttpOnly y consulta Supabase (fail-closed).
  const syncCookies = async (accessToken: string | null, _userRole: UserRole | null) => {
    if (typeof window === "undefined") return;
    // Limpiar cualquier cookie legacy no-HttpOnly que pudiera existir en el navegador
    document.cookie = "luxe-auth-role=; path=/; max-age=0; SameSite=Lax";
    try {
      if (accessToken) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
      } else {
        await fetch("/api/auth/session", { method: "DELETE" });
      }
    } catch (err) {
      console.error("[AuthContext] Error syncing HttpOnly session cookie:", err);
    }
  };

  const fetchOrEnsureRole = useCallback(async (currentUser: User | null, token: string | null) => {
    if (!currentUser) {
      setRole(null);
      setStatus(null);
      await syncCookies(null, null);
      return;
    }

    try {
      // Sincronizar primero la cookie HttpOnly con el servidor
      await syncCookies(token, null);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, status")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data) {
        setRole(data.role as UserRole);
        setStatus(data.status as UserStatus);
      } else if (!error) {
        // Fallback: Si la fila aún no existe, el cliente inserta siempre el rol por defecto 'viewer'
        const fallbackRole: UserRole = "viewer";
        const fullName = extractDisplayName(currentUser);
        const avatar = extractAvatarUrl(currentUser);

        const { error: insertError } = await supabase.from("user_roles").insert({
          id: currentUser.id,
          email: currentUser.email || "",
          full_name: fullName,
          avatar_url: avatar,
          role: fallbackRole,
          status: "active",
        });

        if (insertError) {
          // Si falló por concurrencia con el trigger de Postgres, re-consultamos el rol real
          const { data: retryData } = await supabase
            .from("user_roles")
            .select("role, status")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (retryData) {
            setRole(retryData.role as UserRole);
            setStatus(retryData.status as UserStatus);
          } else {
            console.error("[AuthContext] Error creating user role:", insertError.message);
          }
        } else {
          setRole(fallbackRole);
          setStatus("active");
        }
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching user role:", err);
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (user && session) {
      await fetchOrEnsureRole(user, session.access_token);
    }
  }, [user, session, fetchOrEnsureRole]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchOrEnsureRole(currentSession.user, currentSession.access_token).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchOrEnsureRole(newSession.user, newSession.access_token);
      } else {
        setRole(null);
        setStatus(null);
        await syncCookies(null, null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrEnsureRole]);

  const updateUserRole = async (userId: string, newRole: UserRole, newStatus?: UserStatus) => {
    const updatePayload: { role: UserRole; status?: UserStatus; updated_at: string } = {
      role: newRole,
      updated_at: new Date().toISOString(),
    };
    if (newStatus) {
      updatePayload.status = newStatus;
    }

    const { error } = await supabase
      .from("user_roles")
      .update(updatePayload)
      .eq("id", userId);

    if (error) {
      console.error("[AuthContext] Error updating user role:", error.message);
      throw error;
    }

    if (user && user.id === userId) {
      setRole(newRole);
      if (newStatus) setStatus(newStatus);
    }
  };

  const getSafeRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo");
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      callbackUrl.searchParams.set("redirectTo", redirectTo);
    }
    return callbackUrl.toString();
  };

  const signInWithGoogle = async () => {
    const redirectTo = getSafeRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    const redirectTo = getSafeRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
      },
    });
    if (error) {
      console.error("Error signing in with GitHub:", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await syncCookies(null, null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  };

  const avatarUrl = extractAvatarUrl(user);
  const displayName = extractDisplayName(user);
  const isAdmin = role === "admin" && status === "active";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        avatarUrl,
        displayName,
        role,
        status,
        isAdmin,
        loading,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        refreshRole,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

