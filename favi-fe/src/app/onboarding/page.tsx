"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

import { isValidUsername } from "@/lib/validator/username";

export default function OnboardingPage() {
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      // Nếu đã có username thì bỏ qua
      const { data } = await supabase
        .from("profile")
        .select("username")
        .eq("id", user.id)
        .single();
      if (data?.username) router.replace("/home");
    })();
  }, [router]);

  const show = (severity: any, summary: string, detail?: string) =>
    toastRef.current?.show({ severity, summary, detail, life: 3000 });

  const checkAvailability = async (u: string) => {
    setChecking(true);
    const { data, error } = await supabase
      .from("profile")
      .select("id")
      .eq("username", u)
      .maybeSingle();
    setChecking(false);
    return !error && !data; // true nếu chưa tồn tại
  };

  const onSubmit = async () => {
    const u = username.trim().toLowerCase();
    if (!isValidUsername(u)) {
    show("warn", "Username không hợp lệ",
        "Chỉ [a-z0-9._-], 2–20 ký tự, không bắt đầu/kết thúc bằng dấu, không lặp '..', '__', '--'.");
    return;
    }

    const ok = await checkAvailability(u);
    if (!ok) {
      show("error", "Username đã được dùng");
      return;
    }

    setSaving(true);
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) {
      show("error", "Phiên không hợp lệ");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profile")
      .update({ username: u })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      show("error", "Lưu thất bại", error.message);
      return;
    }

    show("success", "Đã hoàn tất hồ sơ");
    router.replace("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toast ref={toastRef} />
      <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/70 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold">Hoàn tất tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">Chọn username (bắt buộc)</p>

        <label className="block text-sm mt-4 mb-1">Username</label>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">@</span>
          <InputText
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            autoFocus
          />
          <Button
            type="button"
            label={checking ? "Checking..." : "Check"}
            onClick={() => checkAvailability(username.trim().toLowerCase()).then(ok =>
              show(ok ? "success" : "error", ok ? "Có thể dùng" : "Đã tồn tại")
            )}
            disabled={checking}
            className="p-button-outlined"
          />
        </div>

        <Button
          label={saving ? "Saving..." : "Hoàn tất"}
          className="w-full mt-4"
          onClick={onSubmit}
          disabled={saving}
        />
      </div>
    </div>
  );
}
