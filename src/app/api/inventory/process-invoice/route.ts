import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure?: string;
}

interface ExtractedInvoiceData {
  invoice_id?: string;
  supplier_name?: string;
  invoice_date?: string;
  total_amount?: number;
  items: InvoiceItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Check if it's a PDF or image
    const isPDF = image.startsWith('data:application/pdf');
    
    // Remove data URL prefix
    let base64Data: string;
    let mimeType: string;
    
    if (isPDF) {
      base64Data = image.replace(/^data:application\/pdf;base64,/, "");
      mimeType = "application/pdf";
    } else {
      base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      mimeType = "image/jpeg";
    }

    // Prepare prompt for invoice extraction
    const prompt = `Analyze this invoice ${isPDF ? 'PDF' : 'image'} and extract the following information in JSON format:
    
- invoice_id: The invoice or bill number (string)
- supplier_name: The name of the supplier/vendor/seller (string)
- invoice_date: The date of the invoice in YYYY-MM-DD format if available (string)
- total_amount: The total amount/grand total of the invoice (number)
- items: An array of items with:
  - item_name: Name or description of the item (string)
  - quantity: Quantity purchased (number)
  - unit_price: Price per unit (number)
  - total_price: Total price for this item (number)
  - unit_of_measure: Unit of measure like "kg", "pcs", "liters" etc (string, optional)

Extract all items listed in the invoice. If any field is not found, use null for strings and 0 for numbers.
Return ONLY valid JSON, no markdown formatting or additional text.`;

    // Prepare contents for Gemini
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ];

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const text = response.text || "";

    // Parse JSON response
    let extractedData: ExtractedInvoiceData;
    try {
      const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse invoice data", details: text },
        { status: 500 }
      );
    }

    // Validate and clean data
    if (!extractedData.items || !Array.isArray(extractedData.items)) {
      extractedData.items = [];
    }

    // Ensure items have required fields
    extractedData.items = extractedData.items.map((item) => ({
      item_name: item.item_name || "Unknown Item",
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
      unit_of_measure: item.unit_of_measure || "units",
    }));

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("Invoice processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
