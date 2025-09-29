import { supabase } from "@/app/supabase-client";
import { resolveEmailByUsername } from "./profile";

export async function login(identifier: string, password: string) {
  let email = identifier.trim();

  // Nếu nhập username → resolve sang email
  if (!identifier.includes("@")) {
    const result = await resolveEmailByUsername(identifier);
    email = result.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function loginWithGoogle() {
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

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
