"use client";

import authAPI from "@/lib/api/authAPI";
import { useState, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { AuthBackground } from "@/components/AuthBackground";
import { supabase } from "@/app/supabase-client";
import { useTranslations } from "next-intl";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const validateLocalUsername = (
  username: string,
  t: (key: string) => string
): string | "" => {
  const s = username.trim();
  if (s.length < 3 || s.length > 32) return t("UsernameLength");
  if (/\s/.test(s)) return t("UsernameNoSpaces");
  if (!/^[a-zA-Z0-9_.]+$/.test(s)) return t("UsernameInvalidChars");
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
        showToast("warn", t("InvalidEmail"));
        return;
      }

      const usernameError = validateLocalUsername(values.username, t);
      if (usernameError) {
        showToast("warn", t("InvalidUsername"), usernameError);
        return;
      }

      if (values.password.length < 6) {
        showToast("warn", t("ShortPassword"), t("ShortPasswordDetail"));
        return;
      }

      setLoading(true);
      try {
        const payload = {
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        };

        await authAPI.register(payload);

        showToast("info", t("EmailVerification"), t("EmailVerificationDetail"));
        router.push("/auth/verify-notion");
      } catch (err: any) {
        const code = err?.response?.data?.code ?? err?.code ?? err?.status;
        const msg = err?.response?.data?.message ?? err?.error ?? err?.message ?? t("UnknownError");

        if (code === "USERNAME_EXISTS") {
          showToast("warn", t("UsernameExists"), msg);
        } else if (code === "EMAIL_EXISTS") {
          showToast("warn", t("EmailExists"), msg);
        } else if (code === "REGISTRATION_FAILED") {
          showToast("error", t("RegisterFailed"), msg);
        } else {
          showToast("error", t("RegisterFailed"), msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, values.username, values.email, values.password, showToast, router, t]
  );

  const handleGoogle = useCallback(async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      showToast("error", t("GoogleSignInError"), err?.message ?? t("UnknownError"));
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, showToast, t]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-500"
      style={{
        color: "var(--text)",
        background: "radial-gradient(circle at 20% 20%, var(--bg-secondary) 0%, var(--bg) 55%)",
      }}
    >
      <AuthBackground/>
      <Toast ref={toastRef} />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <header className="mb-10 text-center select-none relative z-10">
        <h1
          className="text-6xl md:text-7xl font-extrabold tracking-tight leading-none"
          style={{
            background: "linear-gradient(to right, var(--primary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Favi
        </h1>
        <p
          className="mt-3 text-xl md:text-2xl font-medium opacity-90"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("Slogan")}
        </p>
      </header>

      <Card
        className="relative z-10 w-full max-w-[560px] rounded-3xl shadow-lg"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border)",
          color: "var(--text)",
          borderWidth: "1px",
        }}
        title={
          <div className="text-center space-y-1">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">
              {t("Welcome")}
            </div>
            <div className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
              {t("Register")}
            </div>
          </div>
        }
      >
        <form className="mt-8 space-y-6" noValidate onSubmit={handleRegister}>
          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm md:text-base font-medium">
              {t("Username")}
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
                className="w-full !h-12 !text-base"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm md:text-base font-medium">
              {t("Email")}
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
                className="w-full !h-12 !text-base"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm md:text-base font-medium">
              {t("Password")}
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
                placeholder="�-?�-?�-?�-?�-?�-?�-?�-?"
                className="w-full !h-12 !text-base"
                required
              />
              <button
                type="button"
                className="p-inputgroup-addon cursor-pointer !px-4 !text-base"
                onClick={() => setShowPassword((v) => !v)}
              >
                <i className={showPassword ? "pi pi-eye-slash" : "pi pi-eye"} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            label={loading ? t("IsRegistering") : t("Register")}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
            className="w-full !h-12 !text-base !font-semibold"
            disabled={loading}
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />

          <div className="text-center text-sm md:text-base">
            {t("AlreadyHasAccount")}?{" "}
            <Link href="/login" className="hover:underline" style={{ color: "var(--primary)" }}>
              {t("Login")}
            </Link>
          </div>

          <Divider align="center">
            <span className="text-xs md:text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("Or")}
            </span>
          </Divider>

          <Button
            type="button"
            onClick={handleGoogle}
            label={googleLoading ? t("IsConnecting") : t("ContinueWithGoogle")}
            icon={googleLoading ? "pi pi-spin pi-spinner" : "pi pi-google"}
            className="w-full p-button-outlined !h-12 !text-base !font-semibold"
            disabled={googleLoading}
            style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
          />
        </form>
      </Card>
    </div>
  );
}
