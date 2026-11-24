"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const redirectTo = searchParams.get("redirectTo");
      const safeTarget =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/";

      let accessToken: string | null = null;
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        accessToken = data.session?.access_token ?? null;
      } else {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token ?? null;
      }

      if (accessToken) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
      }

      router.replace(safeTarget);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-nordic dark:text-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-mosque border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

