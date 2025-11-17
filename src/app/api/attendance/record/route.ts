import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { action, embedding } = await req.json();
    if (!action || !["check_in", "check_out", "enroll"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!Array.isArray(embedding) || embedding.length !== 512) {
      return NextResponse.json({ error: "embedding (512) required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Tenant context - try user_profiles first, fallback to tenant_memberships
    let { data: profile } = await supabase
      .from("user_profiles")
      .select("tenant_id, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    let tenantId = profile?.tenant_id ?? null;
    
    // Get name from user_metadata (set during registration) or user_profiles
    const userMetadataName = user.user_metadata?.name as string | undefined;
    let firstName = profile?.first_name ?? '';
    let lastName = profile?.last_name ?? '';
    
    // If user_profiles doesn't have name but user_metadata does, use it
    if ((!firstName || !lastName) && userMetadataName) {
      const nameParts = userMetadataName.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Fallback to tenant_memberships if no profile
    if (!tenantId) {
      const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = membership?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant - please join or create a tenant first" }, { status: 400 });
    }

    // Verify attendance module is active for tenant
    const { data: mod } = await supabase
      .from("tenant_effective_modules")
      .select("status")
      .eq("tenant_id", tenantId)
      .eq("code", "attendance")
      .maybeSingle();
    let active = !!mod && ["active", "trial", "subscribed"].includes((mod as { status: string }).status);
    if (!active) {
      // Fallback to raw subscriptions table
      const { data: subs } = await supabase
        .from("tenant_module_subscriptions")
        .select("status")
        .eq("tenant_id", tenantId)
        .eq("module_code", "attendance")
        .in("status", ["active", "trial"]);
      active = Boolean(subs && subs.length > 0);
    }
    if (!active) return NextResponse.json({ error: "Attendance module not active" }, { status: 403 });

    // Resolve employee for this user
    let { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!employee) {
      // Create employee profile if missing (for testing)
      const employeeName = firstName 
        ? `${firstName} ${lastName}`.trim()
        : user.user_metadata?.name || user.email?.split('@')[0] || 'Employee';
      
      const { data: newEmp, error: createErr } = await supabase
        .from("employees")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          name: employeeName,
          email: user.email,
        })
        .select("id")
        .single();
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
      employee = newEmp;
    }

    // Threshold (L2 distance on L2-normalized embeddings). Lower is stricter.
    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.75");

    // Check if user already has an embedding
    const { data: existing } = await supabase
      .from("face_embeddings")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    // If action is enroll or no embedding exists, upsert and return (optionally record check_in)
    if (action === "enroll" || !existing) {
      // Use RPC to upsert into pgvector column
      const { error: upErr } = await supabase.rpc("upsert_face_embedding", {
        p_tenant: tenantId,
        p_user: user.id,
        p_vec: embedding,
        p_label: null,
        p_metadata: { source: action, updated_by: user.id },
      });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      if (action === "enroll") return NextResponse.json({ ok: true, enrolled: true });
      // For first-time check-in, proceed to write attendance directly
      const { error: insErr } = await supabase.from("attendance_records").insert({
        tenant_id: tenantId,
        employee_id: employee.id,
        action: "check_in",
        is_manual_entry: false,
        face_match_confidence: 1.0,
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, enrolled: true });
    }

    // Compute distance to user's own embedding first
    const { data: distRows, error: distErr } = await supabase.rpc("face_distance", {
      p_tenant: tenantId,
      p_user: user.id,
      p_q: embedding,
    });
    if (distErr) return NextResponse.json({ error: distErr.message }, { status: 500 });
    const ownDistance = Array.isArray(distRows) && distRows[0]?.distance != null ? Number(distRows[0].distance) : null;

    let accepted = ownDistance != null && ownDistance <= threshold;
    let matchDistance = ownDistance ?? null;

    // If own distance too high, run 1-NN within tenant and ensure best match is the same user
    if (!accepted) {
      const { data: matches, error: matchErr } = await supabase.rpc("match_face", {
        tenant: tenantId,
        q: embedding,
        k: 1,
      });
      if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });
      const top = Array.isArray(matches) ? matches[0] : null;
      if (top && top.user_id === user.id && Number(top.distance) <= threshold) {
        accepted = true;
        matchDistance = Number(top.distance);
      }
    }

    if (!accepted) return NextResponse.json({ error: "Face not recognized for this account" }, { status: 403 });

    // Insert attendance record
    const { error: insErr } = await supabase.from("attendance_records").insert({
      tenant_id: tenantId,
      employee_id: employee.id,
      action,
      is_manual_entry: false,
      face_match_confidence: matchDistance != null ? Math.max(0, 1 - Number(matchDistance)) : null,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, distance: matchDistance });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
