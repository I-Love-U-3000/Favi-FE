"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("OAuth callback:", error.message);
        router.replace("/login");
        return;
      }

      const session = data.session;

      // (TUỲ CHỌN) Nếu bạn cần gọi Google API về sau, gửi refresh token lên server để lưu an toàn:
      // Lưu ý: Chỉ làm đoạn này khi bạn thật sự cần gọi Google API.
      try {
        const provider = session?.user?.app_metadata?.provider;
        // provider_token = access token của Google (ngắn hạn)
        // provider_refresh_token = refresh token của Google (nếu bạn xin với access_type=offline + prompt=consent)
        // Hai field này có thể không tồn tại nếu Google không cấp.
        const provider_refresh_token = (session as any)?.provider_refresh_token as string | undefined;

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
        // Không nên chặn đăng nhập chỉ vì lưu token phụ thất bại
        console.warn("Cannot persist provider refresh token:", e);
      }

      // Redirect user vào app
      router.replace("/"); // hoặc /feed
    };

    run();
  }, [router]);

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Đang hoàn tất đăng nhập...
      </p>
    </div>
  );
}
