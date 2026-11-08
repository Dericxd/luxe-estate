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

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else {
        await supabase.auth.getSession();
      }

      router.replace("/");
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

