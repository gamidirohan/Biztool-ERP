"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Camera, Upload, Search, AlertCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  item_name: string;
  item_code?: string;
  category?: string;
  quantity: number;
  unit_of_measure?: string;
  unit_cost?: number;
  selling_price?: number;
  supplier?: string;
  expiry_date?: string;
  is_active: boolean;
}

export default function StoreInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to view inventory");
        return;
      }

      // Get tenant and role
      let tenantId: string | null = null;
      let role: string | null = null;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .maybeSingle();

      tenantId = profile?.tenant_id ?? null;
      role = profile?.role ?? null;

      if (!tenantId || !role) {
        const { data: membership } = await supabase
          .from("tenant_memberships")
          .select("tenant_id, role")
          .eq("user_id", user.id)
          .maybeSingle();
        tenantId = membership?.tenant_id ?? null;
        role = membership?.role ?? null;
      }

      if (!tenantId) {
        setError("No organization found. Please join an organization first.");
        return;
      }

      setUserRole(role);

      // Fetch inventory items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("item_name", { ascending: true });

      if (inventoryError) throw inventoryError;

      setItems(inventoryData || []);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = () => {
    router.push("/store/scan-invoice");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store file in session storage and redirect to preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        sessionStorage.setItem("invoiceImage", base64);
        sessionStorage.setItem("invoiceFileName", file.name);
        router.push("/store/preview-invoice");
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = userRole === "owner" || userRole === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-sm text-[color:var(--muted-foreground)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" style={{ color: 'var(--primary)' }} />
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Inventory</h1>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              {/* Mobile: Camera button */}
              <Button
                onClick={handleCameraCapture}
                className="sm:hidden flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Invoice
              </Button>

              {/* Desktop: Upload button */}
              <label className="hidden sm:block cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Invoice
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search items by name, category, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)]"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-[color:var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[color:var(--muted-foreground)]">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[color:var(--muted-foreground)]">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(items.map(i => i.category).filter(Boolean)).size}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[color:var(--muted-foreground)]">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {items.filter(i => i.quantity < 10).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[color:var(--muted-foreground)]">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {items.filter(i => i.quantity === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <Card className="border-[color:var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {searchTerm ? "No items found matching your search" : "No inventory items yet"}
                </p>
                {isAdmin && !searchTerm && (
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-2">
                    Upload an invoice to add items automatically
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)]/20 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.item_name}</h3>
                        {item.item_code && (
                          <span className="text-xs px-2 py-0.5 bg-[color:var(--muted)] rounded">
                            {item.item_code}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[color:var(--muted-foreground)]">
                        {item.category && <span>Category: {item.category}</span>}
                        {item.supplier && <span>Supplier: {item.supplier}</span>}
                        {item.unit_cost && (
                          <span>Cost: ${item.unit_cost.toFixed(2)}</span>
                        )}
                        {item.selling_price && (
                          <span>Price: ${item.selling_price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          item.quantity === 0 ? 'text-red-600 dark:text-red-400' :
                          item.quantity < 10 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {item.quantity}
                        </div>
                        <div className="text-xs text-[color:var(--muted-foreground)]">
                          {item.unit_of_measure || 'units'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}