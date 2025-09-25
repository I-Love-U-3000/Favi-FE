"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";

import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

import { BackgroundBubbles } from "@/components/ui/BackgroundBubbles";

import { RegisterValues } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [values, setValues] = useState<RegisterValues>({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const showToast = (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  };

  const onChange = (field: keyof RegisterValues, value: string) => {
    setValues(v => ({ ...v, [field]: value }));
  };


  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.username || !values.password) {
      showToast("warn", "Thiếu thông tin", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      // === CÁCH 1 (Supabase email/password):
      // Nếu bạn dùng Supabase Auth với email/password, hãy coi "username" là email.
      // const { data, error } = await supabase.auth.signUp({
      //   email: values.username,
      //   password: values.password,
      // });
      // if (error) throw error;

      // === CÁCH 2 (backend tự viết / username riêng):
      // Gọi API backend để tạo user theo "username" & "password"
      // const res = await fetch("/api/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(values),
      // });
      // if (!res.ok) throw new Error((await res.json())?.message || "Đăng ký thất bại");

      // Tùy chọn của bạn ở trên. Ở đây mình minh hoạ dùng Supabase cho gọn:
      const { error } = await supabase.auth.signUp({
        email: values.username, // dùng như email
        password: values.password,
      });
      if (error) throw error;

      showToast("success", "Đăng ký thành công", "Vui lòng kiểm tra email (nếu yêu cầu xác thực).");
      // Điều hướng về feed hoặc login tuỳ flow của bạn:
      router.push("/login");
    } catch (err: any) {
      showToast("error", "Đăng ký thất bại", err.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          queryParams: {
            // prompt: "consent",
            // access_type: "offline",
          },
        },
      });
      if (error) throw error;
      // Sau khi OAuth redirect, Supabase sẽ quay về redirectTo -> xử lý tiếp ở route /auth/callback
    } catch (err: any) {
      showToast("error", "Google sign-in lỗi", err.message || "Không thể đăng nhập với Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0ea5e9]/10 via-[#a78bfa]/10 to-[#22c55e]/10 flex flex-col items-center justify-center p-6">
      <BackgroundBubbles fast/>

      <Toast ref={toastRef} />

      <header className="mb-6 text-center pointer-events-none select-none">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500">
          Favi
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
          Capture the Mood
        </p>
      </header>
      
      <Card className="w-full max-w-md shadow-2 rounded-3xl overflow-hidden relative z-10">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-semibold mb-1">Tạo tài khoản</h1>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Đăng ký để bắt đầu trải nghiệm.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Tên đăng nhập / Email
              </label>
              <InputText
                id="username"
                value={values.username}
                onChange={(e) => onChange("username", e.target.value)}
                placeholder="vd: user@example.com"
                className="w-full"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon">
                <i className="pi pi-lock" aria-hidden />
              </span>
              <InputText
                id="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="●●●●●●●●"
                autoComplete="current-password"
                className="w-full"
                required
                aria-required
              />
              <button
                type="button"
                className="p-inputgroup-addon cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <i className={showPassword ? "pi pi-eye-slash" : "pi pi-eye"} />
              </button>
            </div>
            </div>

            <Button
              type="submit"
              label={loading ? "Đang đăng ký..." : "Đăng ký"}
              className="w-full"
              disabled={loading}
            />
          </form>

          <Divider align="center" className="my-6">
            <span className="text-xs uppercase tracking-wide text-surface-400">Hoặc</span>
          </Divider>

          <Button
            type="button"
            outlined
            icon="pi pi-google"
            label={googleLoading ? "Đang mở Google..." : "Đăng ký / Đăng nhập với Google"}
            className="w-full"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          />

          <p className="mt-6 text-center text-sm">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
