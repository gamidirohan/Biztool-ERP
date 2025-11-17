"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure?: string;
}

interface ExtractedData {
  invoice_id?: string;
  supplier_name?: string;
  invoice_date?: string;
  total_amount?: number;
  items: InvoiceItem[];
}

export default function PreviewInvoicePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedImage = sessionStorage.getItem("invoiceImage");
    const storedFileName = sessionStorage.getItem("invoiceFileName");

    if (!storedImage) {
      router.push("/store");
      return;
    }

    setImageUrl(storedImage);
    setFileName(storedFileName || "invoice.jpg");

    // Auto-process on load
    processInvoice(storedImage);
  }, []);

  const processInvoice = async (base64Image: string) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch("/api/inventory/process-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process invoice");
      }

      const data = await response.json();
      setExtractedData(data.data);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process invoice");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/inventory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save inventory");
      }

      // Clear session storage
      sessionStorage.removeItem("invoiceImage");
      sessionStorage.removeItem("invoiceFileName");

      // Redirect to store page
      router.push("/store");
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save inventory");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem("invoiceImage");
    sessionStorage.removeItem("invoiceFileName");
    router.push("/store");
  };

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice Preview</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">{fileName}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Preview */}
          <Card className="border-[color:var(--border)]">
            <CardHeader>
              <CardTitle>Scanned Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Invoice preview"
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Extracted Data */}
          <Card className="border-[color:var(--border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : error ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Extraction Failed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Extracted Data
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {processing && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 animate-pulse mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Analyzing invoice with AI...
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <Button onClick={() => processInvoice(imageUrl)} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}

              {extractedData && (
                <div className="space-y-6">
                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {extractedData.invoice_id && (
                      <div>
                        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                          Invoice ID
                        </label>
                        <p className="text-sm font-semibold">{extractedData.invoice_id}</p>
                      </div>
                    )}
                    {extractedData.supplier_name && (
                      <div>
                        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                          Supplier
                        </label>
                        <p className="text-sm font-semibold">{extractedData.supplier_name}</p>
                      </div>
                    )}
                    {extractedData.invoice_date && (
                      <div>
                        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                          Date
                        </label>
                        <p className="text-sm font-semibold">{extractedData.invoice_date}</p>
                      </div>
                    )}
                    {extractedData.total_amount && (
                      <div>
                        <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                          Total Amount
                        </label>
                        <p className="text-sm font-semibold">
                          ${extractedData.total_amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Items ({extractedData.items.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {extractedData.items.map((item, index) => (
                        <div
                          key={index}
                          className="p-3 border border-[color:var(--border)] rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{item.item_name}</h4>
                            <span className="text-sm font-bold">
                              ${item.total_price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-[color:var(--muted-foreground)]">
                            <span>Qty: {item.quantity} {item.unit_of_measure || 'units'}</span>
                            <span>Unit: ${item.unit_price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleConfirm}
                      disabled={saving}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm & Add to Inventory
                        </>
                      )}
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
