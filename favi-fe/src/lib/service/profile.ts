import { supabase } from "@/app/supabase-client";
import { ProfileUpdateInput } from "@/types";

export async function getMyProfile() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    let { data: profile, error } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // fallback: nếu vì lý do nào đó chưa có profile, tự insert
    if (!profile && !error) {
        const { data, error: insertErr } = await supabase
            .from("profile")
            .insert({ id: user.id })
            .select()
            .maybeSingle();
        if (insertErr) throw insertErr;
        profile = data;
    }

    return profile;
}

export async function resolveEmailByUsername(username: string) {
    const r = await fetch("/api/login-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });

    if (!r.ok) {
        const { error } = await r.json().catch(() => ({ error: "Resolve failed" }));
        throw new Error(error || "Resolve failed");
    }

    return (await r.json()) as { email: string };
}

export async function updateMyProfile(payload: ProfileUpdateInput) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profile")
    .update(payload)
    .eq("id", user.id);

  if (error) throw error;
}