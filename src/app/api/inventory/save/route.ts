import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure?: string;
}

interface InvoiceData {
  invoice_id?: string;
  supplier_name?: string;
  invoice_date?: string;
  total_amount?: number;
  items: InvoiceItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: InvoiceData = await request.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "No items to save" },
        { status: 400 }
      );
    }

    const supabase = await createClient(cookies());

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get tenant ID
    let tenantId: string | null = null;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    tenantId = profile?.tenant_id ?? null;

    if (!tenantId) {
      const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = membership?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 }
      );
    }

    // Prepare inventory items for insertion
    const inventoryItems = data.items.map((item) => ({
      tenant_id: tenantId,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure || "units",
      unit_cost: item.unit_price,
      selling_price: item.unit_price * 1.2, // Add 20% markup as default
      supplier: data.supplier_name || null,
      is_active: true,
      created_by: user.id,
    }));

    // Insert inventory items (upsert to handle duplicates)
    const { data: insertedItems, error: insertError } = await supabase
      .from("inventory")
      .upsert(inventoryItems, {
        onConflict: "tenant_id,item_name",
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error("Inventory insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save inventory", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedItems?.length || 0} items to inventory`,
      items: insertedItems,
    });
  } catch (error) {
    console.error("Save inventory error:", error);
    return NextResponse.json(
      {
        error: "Failed to save inventory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
