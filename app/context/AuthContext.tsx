"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  avatarUrl: string | null;
  displayName: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
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
    const redirectTo = `${window.location.origin}/auth/callback`;
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  };

  const avatarUrl = extractAvatarUrl(user);
  const displayName = extractDisplayName(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        avatarUrl,
        displayName,
        loading,
        signInWithGoogle,
        signInWithGithub,
        signOut,
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

