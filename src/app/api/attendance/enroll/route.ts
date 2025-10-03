import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facialId, payload } = body || {};
    if (!facialId) return NextResponse.json({ error: "facialId required" }, { status: 400 });

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get profile for tenant context
    const { data: profile, error: pErr } = await supabase
      .from("user_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (pErr || !profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

    // Find employee record for this user
    const { data: emp } = await supabase
      .from("employees")
      .select("id,tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();
    if (!emp) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

    // Save FACEIO reference in employees.face_embedding
    const { error: uErr } = await supabase
      .from("employees")
      .update({ face_embedding: { provider: "faceio", facialId, payload: payload ?? {} } })
      .eq("id", emp.id)
      .eq("tenant_id", profile.tenant_id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
