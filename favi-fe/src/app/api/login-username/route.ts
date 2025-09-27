import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/supabase-server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const u = String(username).trim().toLowerCase();

    // 1) tìm id qua bảng profile
    const { data: prof, error: qErr } = await supabaseAdmin
      .from("profile")
      .select("id")
      .eq("username", u)
      .maybeSingle();

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    if (!prof) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 2) lấy email từ auth theo id
    const { data, error: aErr } = await supabaseAdmin.auth.admin.getUserById(prof.id);
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    const email = data.user.email;
    if (!email) return NextResponse.json({ error: "User has no email" }, { status: 404 });

    return NextResponse.json({ email });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}