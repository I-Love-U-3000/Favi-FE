"use client";

import authAPI from "@/lib/api/authAPI";
import { profileAPI } from "@/lib/api/profileAPI";
import { useState, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import LoginBackdrop from "@/components/LoginRegisterBackground";
import { supabase } from "@/app/supabase-client";
import { useTranslations } from "next-intl";
import ThemeSwitcher from "@/components/ThemeSwitcher";

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

type RegisterForm = {
  username: string;
  email: string;
  password: string;
};

const validateLocalUsername = (username: string): string | "" => {
  const s = username.trim();
  if (s.length < 3 || s.length > 32)
    return "Username phải dài từ 3–32 ký tự.";
  if (/\s/.test(s))
    return "Username không được chứa khoảng trắng.";
  if (!/^[a-zA-Z0-9_.]+$/.test(s))
    return "Username chỉ được chứa chữ, số, dấu gạch dưới hoặc chấm.";
  if (/[À-ỹ]/.test(s))
    return "Username không được chứa dấu tiếng Việt.";
  return "";
};

export default function RegisterPage() {
  const t = useTranslations("RegisterPage");
  const router = useRouter();
  const toastRef = useRef<Toast | null>(null);

  const [values, setValues] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
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
    <K extends keyof RegisterForm>(key: K, val: RegisterForm[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const handleRegister = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (loading) return;

      const emailOk = /\S+@\S+\.\S+/.test(values.email.trim());
      if (!emailOk) {
        showToast("warn", "Email không hợp lệ");
        return;
      }

      const usernameError = validateLocalUsername(values.username);
      if (usernameError) {
        showToast("warn", "Username không hợp lệ", usernameError);
        return;
      }

      if (values.password.length < 6) {
        showToast("warn", "Mật khẩu quá ngắn", "Mật khẩu phải từ 6 ký tự trở lên.");
        return;
      }

      setLoading(true);
      try {
        const check = await profileAPI.checkUsername(values.username.trim());
        if (!check.valid) {
          showToast("warn", "Username đã tồn tại", check.message);
          setLoading(false);
          return;
        }

        const payload = {
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        };

        const res = await authAPI.register(payload);

        showToast(
          "info",
          "Xác minh email",
          "Chúng tôi đã gửi thông báo cho bạn. Hãy sử dụng email để xác minh trước khi tiếp tục với ứng dụng."
        );
        router.push("/auth/verify-notion");
      } catch (err: any) {
        const code = err?.response?.data?.code;
        const msg = err?.response?.data?.message || "Đã xảy ra lỗi";

        if (code === "EMAIL_EXISTS") {
          showToast("warn", "Email đã đăng ký", msg);
        } else if (code === "PROFILE_EXISTS") {
          showToast("warn", "Hồ sơ đã tồn tại", msg);
        } else {
          showToast("error", "Đăng ký thất bại", msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, values.username, values.email, values.password, showToast, router]
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0ea5e9]/10 via-[#a78bfa]/10 to-[#22c55e]/10 flex flex-col items-center justify-center p-6">
      <LoginBackdrop variant="neon-stripes" />
      <Toast ref={toastRef} />
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      <header className="mb-10 text-center pointer-events-none select-none relative z-10">
        <h1
          className="text-6xl md:text-7xl font-extrabold tracking-tight leading-none
               bg-clip-text text-transparent
               bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400
               drop-shadow-sm">
          Favi
        </h1>
        <p className="mt-3 text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-200 opacity-90">
          {t("Slogan")}
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
            <div className="text-2xl md:text-3xl font-bold tracking-tight">Welcome</div>
            <div className="text-sm md:text-base text-gray-500">Đăng ký</div>
          </div>
        }
      >
        <form className="mt-8 space-y-6" noValidate onSubmit={handleRegister}>
          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm md:text-base font-medium">
              Username
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon !px-4 !text-base">
                <i className="pi pi-id-card" />
              </span>
              <InputText
                id="username"
                value={values.username}
                onChange={(e) => onChange("username", e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                className="w-full !h-12 !text-base"
                required
                aria-required
              />
            </div>
            <p className="text-xs text-gray-500">Tên hiển thị và đăng nhập bằng username tuỳ backend.</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm md:text-base font-medium">
              Email
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon !px-4 !text-base">
                <i className="pi pi-envelope" />
              </span>
              <InputText
                id="email"
                value={values.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full !h-12 !text-base"
                required
                aria-required
              />
            </div>
            <p className="text-xs text-gray-500">Email sẽ dùng để xác minh tài khoản và khôi phục mật khẩu.</p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm md:text-base font-medium">
              Mật khẩu
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon !px-4 !text-base">
                <i className="pi pi-lock" />
              </span>
              <InputText
                id="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="●●●●●●●●"
                autoComplete="new-password"
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

          {/* Submit */}
          <Button
            type="submit"
            label={loading ? "Đang đăng ký..." : "Đăng ký"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
            className="w-full !h-12 !text-base !font-semibold"
            disabled={loading}
            aria-busy={loading}
          />

          {/* Đã có TK? */}
          <div className="text-center text-sm md:text-base">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary hover:underline" prefetch={false}>
              Đăng nhập ngay
            </Link>
          </div>

          <Divider align="center">
            <span className="text-xs md:text-sm text-gray-500">hoặc</span>
          </Divider>

          {/* Google */}
          <Button
            type="button"
            onClick={handleGoogle}
            label={googleLoading ? "Đang kết nối..." : "Tiếp tục với Google"}
            icon={googleLoading ? "pi pi-spin pi-spinner" : "pi pi-google"}
            className="w-full p-button-outlined !h-12 !text-base !font-semibold"
            disabled={googleLoading}
            aria-busy={googleLoading}
          />
        </form>
      </Card>
    </div>
  );
}
