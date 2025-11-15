"use client";

import authAPI from "@/lib/api/authAPI";
import { profileAPI } from "@/lib/api/profileAPI";
import { LoginRequest } from "@/types";
import { useState, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/routing";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import LoginBackdrop from "@/components/LoginRegisterBackground";
import { supabase } from "@/app/supabase-client";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
      queryParams: { prompt: "select_account", access_type: "offline" },
    },
  });

  if (error) throw error;
}

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);
  const { setGuestMode } = useAuth();

  const [values, setValues] = useState<LoginRequest>({
    identifier: "",
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
    (key: keyof LoginRequest, val: LoginRequest[typeof key]) => {
      setValues((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const { refresh } = useAuth();

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);

      try {
        const id = values.identifier.trim();
        const pwd = values.password;

        if (!id || !pwd) {
          showToast("warn", "Thiếu thông tin", "Vui lòng nhập đầy đủ tài khoản và mật khẩu");
          return;
        }

        await authAPI.loginWithIdentifier(id, pwd);
        setGuestMode(false);
        showToast("success", "Đăng nhập thành công");
        refresh();

        const userInfo = authAPI.getUserInfo<{ id?: string }>();
        if (userInfo?.id) {
          try {
            await profileAPI.getById(userInfo.id);
          } catch (profileErr: any) {
            const status = profileErr?.status ?? profileErr?.response?.status;
            const errMsg = profileErr?.error ?? profileErr?.message ?? "";
            const missingProfile = status === 404 || /not\s+found/i.test(String(errMsg));
            if (missingProfile) {
              showToast(
                "info",
                "Vui lòng xác minh email",
                "Kiểm tra hộp thư để hoàn tất xác minh trước khi tiếp tục."
              );
              router.replace("/auth/verify-notion");
              return;
            }
            console.warn("Unable to verify profile after login:", profileErr);
          }
        }

        router.replace("/home");
      } catch (err: any) {
        // fetchWrapper nên trả lỗi có message; nếu không, fallback
        const msg = err?.message ?? "Unknown error";
        showToast("error", "Đăng nhập thất bại", msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, values.identifier, values.password, showToast, router]
  );


  const handleGoogle = useCallback(async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      showToast("error", "Google sign-in lỗi", err?.message ?? "Unknown error");
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, showToast]);

  const handleGuest = useCallback(() => {
    try {
      setGuestMode(true);
      router.push("/home");
    } catch {}
  }, [setGuestMode, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0ea5e9]/10 via-[#a78bfa]/10 to-[#22c55e]/10 flex flex-col items-center justify-center p-6">
      <LoginBackdrop variant="neon-stripes" />
      <Toast ref={toastRef} />

      <header className="mb-10 text-center pointer-events-none select-none relative z-10">
        <h1
          className="text-6xl md:text-7xl font-extrabold tracking-tight leading-none
               bg-clip-text text-transparent
               bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400
               drop-shadow-sm">
          Favi
        </h1>
        <p
          className="mt-3 text-xl md:text-2xl font-medium
               text-gray-700 dark:text-gray-200
               opacity-90">
          {t('Slogan')}
        </p>
      </header>

      <Card
        className="relative z-10 w-full max-w-[560px]
             backdrop-blur-2xl
             bg-white/75 dark:bg-[#0b1020]/70
             border border-white/40 dark:border-white/10
             shadow-[0_20px_80px_-20px_rgba(0,0,0,0.45)]
             rounded-3xl"
        title={
          <div className="text-center space-y-1">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back</div>
            <div className="text-sm md:text-base text-gray-500">Đăng nhập để tiếp tục</div>
          </div>
        }
      >
        <form className="mt-8 space-y-6" noValidate onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="usernameOrEmail" className="text-sm md:text-base font-medium">
              Username / Email
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon !px-4 !text-base"><i className="pi pi-user" /></span>
              <InputText
                id="usernameOrEmail"
                value={values.identifier}
                onChange={(e) => onChange("identifier", e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className="w-full !h-12 !text-base"
                required
                aria-required
              />
            </div>
            <p className="text-xs text-gray-500">Dùng email hoặc username bạn đã đăng ký.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm md:text-base font-medium">
                Mật khẩu
              </label>
              <Link href="/forgot-password" className="text-sm md:text-base text-primary hover:underline" prefetch={false}>
                Quên mật khẩu?
              </Link>
            </div>

            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon !px-4 !text-base"><i className="pi pi-lock" /></span>
              <InputText
                id="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="●●●●●●●●"
                autoComplete="current-password"
                className="w-full !h-12 !text-base"
                required
                aria-required
              />
              <button
                type="button"
                className="p-inputgroup-addon cursor-pointer !px-4 !text-base"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <i className={showPassword ? "pi pi-eye-slash" : "pi pi-eye"} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                inputId="remember"
                checked={values.remember}
                onChange={(e) => onChange("remember", Boolean(e.checked))}
              />
              <span className="text-sm md:text-base">Ghi nhớ đăng nhập</span>
            </label>
            <Link href="/register" className="text-sm md:text-base hover:underline text-primary" prefetch={false}>
              Tạo tài khoản mới
            </Link>
          </div>

          <Button
            type="submit"
            label={loading ? "Đang đăng nhập..." : "Đăng nhập"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            className="w-full !h-12 !text-base !font-semibold"
            disabled={loading}
            aria-busy={loading}
          />

          <Divider align="center">
            <span className="text-xs md:text-sm text-gray-500">hoặc</span>
          </Divider>

          <Button
            type="button"
            onClick={handleGoogle}
            label={googleLoading ? "Đang kết nối..." : "Tiếp tục với Google"}
            icon={googleLoading ? "pi pi-spin pi-spinner" : "pi pi-google"}
            className="w-full p-button-outlined !h-12 !text-base !font-semibold"
            disabled={googleLoading}
            aria-busy={googleLoading}
          />

          <Button
            type="button"
            onClick={handleGuest}
            label="Tiếp tục ở chế độ khách"
            icon="pi pi-user"
            className="w-full p-button-text !h-12 !text-base"
          />
        </form>
      </Card>
    </div>
  );
}
