"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  savedIds: Set<string>;
  savedCount: number;
  loading: boolean;
  initialized: boolean;
  isSaved: (propertyId: string) => boolean;
  isPending: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
}

const EMPTY_SET = new Set<string>();
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Track which userId the current savedIds belong to, avoiding synchronous setState in effects
  const [store, setStore] = useState<{ ownerId: string | null; ids: Set<string> }>({
    ownerId: null,
    ids: new Set(),
  });
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let active = true;

    supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error("[FavoritesContext] Error loading saved properties:", error.message);
          setStore({ ownerId: userId, ids: new Set() });
        } else {
          setStore({
            ownerId: userId,
            ids: new Set((data ?? []).map((row) => row.property_id as string)),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  const initialized = useMemo(() => {
    if (authLoading) return false;
    if (!userId) return true;
    return store.ownerId === userId;
  }, [authLoading, userId, store.ownerId]);

  const loading = Boolean(!authLoading && userId && store.ownerId !== userId);

  const savedIds = useMemo(() => {
    if (!userId || store.ownerId !== userId) {
      return EMPTY_SET;
    }
    return store.ids;
  }, [userId, store]);

  const isSaved = useCallback(
    (propertyId: string) => savedIds.has(propertyId),
    [savedIds]
  );

  const isPending = useCallback(
    (propertyId: string) => pendingIds.has(propertyId),
    [pendingIds]
  );

  const toggleFavorite = useCallback(
    async (propertyId: string): Promise<boolean> => {
      if (authLoading || pendingIds.has(propertyId)) {
        return false;
      }

      if (!user) {
        const redirectPath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/";
        router.push(`/login?redirectTo=${encodeURIComponent(redirectPath)}`);
        return false;
      }

      const currentUserId = user.id;
      const wasSaved = savedIds.has(propertyId);
      const nextSaved = !wasSaved;

      setStore((prev) => {
        const base = prev.ownerId === currentUserId ? prev.ids : EMPTY_SET;
        const updated = new Set(base);
        if (nextSaved) updated.add(propertyId);
        else updated.delete(propertyId);
        return { ownerId: currentUserId, ids: updated };
      });

      setPendingIds((prev) => {
        const updated = new Set(prev);
        updated.add(propertyId);
        return updated;
      });

      try {
        if (nextSaved) {
          const { error } = await supabase
            .from("saved_properties")
            .upsert(
              { user_id: currentUserId, property_id: propertyId },
              { onConflict: "user_id,property_id" }
            );
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("saved_properties")
            .delete()
            .eq("user_id", currentUserId)
            .eq("property_id", propertyId);
          if (error) throw error;
        }
        return true;
      } catch (err) {
        console.error("[FavoritesContext] Error toggling favorite:", err);
        setStore((prev) => {
          const base = prev.ownerId === currentUserId ? prev.ids : EMPTY_SET;
          const reverted = new Set(base);
          if (wasSaved) reverted.add(propertyId);
          else reverted.delete(propertyId);
          return { ownerId: currentUserId, ids: reverted };
        });
        return false;
      } finally {
        setPendingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(propertyId);
          return updated;
        });
      }
    },
    [authLoading, pendingIds, router, savedIds, user]
  );

  return (
    <FavoritesContext.Provider
      value={{
        savedIds,
        savedCount: savedIds.size,
        loading,
        initialized,
        isSaved,
        isPending,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
