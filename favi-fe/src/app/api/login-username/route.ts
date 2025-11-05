import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/supabase-server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const u = String(username).trim().toLowerCase();

    // 1) Find id via profile table
    const { data: prof, error: qErr } = await supabaseAdmin
      .from("profile")
      .select("id")
      .eq("username", u)
      .maybeSingle();

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }
    if (!prof) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2) Get email from Auth
    const { data, error: aErr } = await supabaseAdmin.auth.admin.getUserById(
      prof.id
    );
    if (aErr) {
      console.error("Auth error:", aErr);
      return NextResponse.json({ error: aErr.message }, { status: 500 });
    }

    const email = data.user.email;
    if (!email) {
      return NextResponse.json({ error: "User has no email" }, { status: 404 });
    }

    // 3) Get role from user_roles table
    const { data: roleRow, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", prof.id)
      .maybeSingle();

    if (rErr) {
      return NextResponse.json({ error: rErr.message }, { status: 500 });
    }

    const role = roleRow?.role ?? "User"; // default

    // 4) Return result
    return NextResponse.json({ email, role });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
