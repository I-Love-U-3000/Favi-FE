"use client";

import { useState, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/supabase-client";

import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";

import { BackgroundBubbles } from "@/components/ui/BackgroundBubbles";

type LoginValues = {
  usernameOrEmail: string;
  password: string;
  remember: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);

  const [values, setValues] = useState<LoginValues>({
    usernameOrEmail: "",
    password: "",
    remember: true,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = useCallback(
    (
      severity: "success" | "info" | "warn" | "error",
      summary: string,
      detail?: string
    ) => {
      toastRef.current?.show({ severity, summary, detail, life: 3500 });
    },
    []
  );

  const onChange = useCallback(
    (key: keyof LoginValues, val: LoginValues[typeof key]) => {
      setValues((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);
      try {
        const { usernameOrEmail, password } = values;

        if (!usernameOrEmail.includes("@")) {
          showToast(
            "warn",
            "Email required",
            "Hiện form password đang cần email. Bạn có thể dùng nút Google hoặc nhập email."
          );
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: usernameOrEmail.trim(),
          password,
        });

        if (error) {
          showToast("error", "Đăng nhập thất bại", error.message);
          return;
        }

        showToast("success", "Đăng nhập thành công");
        router.push("/home");
      } catch (err: any) {
        showToast("error", "Đã có lỗi", err?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [loading, router, showToast, values]
  );

  const handleGoogle = useCallback(async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/home` : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        showToast("error", "Google sign-in lỗi", error.message);
      }
    } catch (err: any) {
      showToast("error", "Đã có lỗi", err?.message ?? "Unknown error");
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, showToast]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0ea5e9]/10 via-[#a78bfa]/10 to-[#22c55e]/10 flex flex-col items-center justify-center p-6">
      <BackgroundBubbles fast />
      <Toast ref={toastRef} />

      {/* Brand + slogan */}
      <header className="mb-6 text-center pointer-events-none select-none">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500">
          Favi
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
          Capture the Mood
        </p>
      </header>

      <Card
        className="relative z-10 w-full max-w-[420px] backdrop-blur-xl bg-white/70 dark:bg-[#0b1020]/70 border border-white/40 dark:border-white/10 shadow-2xl rounded-2xl"
        title={
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight">Welcome back 👋</div>
            <div className="mt-1 text-sm text-gray-500">Sign in to continue</div>
          </div>
        }
      >
        <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
          {/* Username/Email */}
          <div className="space-y-2">
            <label htmlFor="usernameOrEmail" className="text-sm font-medium">
              Username or Email
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon">
                <i className="pi pi-user" aria-hidden />
              </span>
              <InputText
                id="usernameOrEmail"
                value={values.usernameOrEmail}
                onChange={(e) => onChange("usernameOrEmail", e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className="w-full"
                required
                aria-required
              />
            </div>
          </div>

          {/* Password — dùng InputText + addon icon để toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
                prefetch={false}
              >
                Forgot password?
              </Link>
            </div>

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

          {/* Remember + Register */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="remember"
                checked={values.remember}
                onChange={(e) => onChange("remember", Boolean(e.checked))}
              />
              <label htmlFor="remember" className="text-sm">
                Remember me
              </label>
            </div>
            <Link
              href="/register"
              className="text-sm hover:underline text-primary"
              prefetch={false}
            >
              Register
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            label={loading ? "Signing in..." : "Sign in"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            className="w-full !h-11"
            disabled={loading}
            aria-busy={loading}
          />

          <Divider align="center">
            <span className="text-xs text-gray-500">or</span>
          </Divider>

          {/* Google */}
          <Button
            type="button"
            onClick={handleGoogle}
            label={googleLoading ? "Connecting..." : "Continue with Google"}
            icon={googleLoading ? "pi pi-spin pi-spinner" : "pi pi-google"}
            className="w-full p-button-outlined !h-11"
            disabled={googleLoading}
            aria-busy={googleLoading}
          />
        </form>
      </Card>
    </div>
  );
}
