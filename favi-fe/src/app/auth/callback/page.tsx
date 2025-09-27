"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/supabase-client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        const code = search.get("code");
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
            // Dọn URL: bỏ query ?code=...
            window.history.replaceState({}, "", window.location.pathname);
          } catch (ex) {
            console.warn("exchangeCodeForSession failed (fallback to getSession):", ex);
          }
        }

        // 2) Lấy session hiện tại
        const { data: sessData, error: sessErr } = await supabase.auth.getSession();
        if (sessErr || !sessData.session) {
          console.error("OAuth callback - no session:", sessErr?.message);
          router.replace("/login");
          return;
        }
        const session = sessData.session;
        const userId = session.user.id;

        // I think we should store the token anyway even if we don't use it
        try {
          const provider = session.user.app_metadata?.provider;
          const provider_refresh_token = (session as any)?.provider_refresh_token as
            | string
            | undefined;

          if (provider === "google" && provider_refresh_token) {
            await fetch("/api/oauth/save-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "google",
              refresh_token: provider_refresh_token,
              }),
            });
          }
        } catch (e) {
          console.warn("Cannot persist provider refresh token:", e);
        }

        let profile: any = null;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from("profile")
            .select("id, username")
            .eq("id", userId)
            .maybeSingle();

          if (!error && data) {
            profile = data;
            break;
          }
          await sleep(200); // đợi 200ms rồi thử lại
        }

        if (!profile) {
          const { data, error } = await supabase
            .from("profile")
            .insert({ id: userId })
            .select("id, username")
            .maybeSingle();
          if (error) {
            console.error("Cannot ensure profile row:", error.message);
            router.replace("/");
            return;
          }
          profile = data;
        }

        if (!profile?.username) {
          router.replace("/onboarding/username");
          return;
        }
        let redirectTo = "/";
        try {
          const saved = localStorage.getItem("redirectTo");
          if (saved) {
            redirectTo = saved;
            localStorage.removeItem("redirectTo");
          }
        } catch {
          /* ignore */
        }
        router.replace(redirectTo);
      } catch (err) {
        console.error("Auth callback fatal:", err);
        router.replace("/login");
      }
    };

    run();
  }, [router, search]);

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-current" />
        <p>Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}
