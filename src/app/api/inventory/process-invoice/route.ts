import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

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

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Check if it's a PDF or image
    const isPDF = image.startsWith('data:application/pdf');
    
    // Remove data URL prefix
    let base64Data: string;
    
    if (isPDF) {
      base64Data = image.replace(/^data:application\/pdf;base64,/, "");
    } else {
      base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    }

    // Prepare prompt for invoice extraction
    const prompt = `Analyze this invoice ${isPDF ? 'document' : 'image'} and extract the following information in JSON format:
    
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

    let extractedText = "";

    if (isPDF) {
      // Handle PDF using pdfjs-dist legacy build for Node.js
      try {
        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        
        // Use the legacy build of pdfjs-dist for Node.js
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        
        // Extract text from PDF
        const data = new Uint8Array(pdfBuffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        extractedText = text;
      } catch (pdfError) {
        console.error("PDF processing error:", pdfError);
        return NextResponse.json(
          { error: "Failed to process PDF", details: pdfError instanceof Error ? pdfError.message : "Unknown error" },
          { status: 500 }
        );
      }

      // Use Groq to analyze the extracted text
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nExtracted text from invoice:\n${extractedText}`,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      const text = chatCompletion.choices[0]?.message?.content || "";

      // Parse JSON response
      let extractedData: ExtractedInvoiceData;
      try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse Groq response:", text);
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
    } else {
      // Handle image using Groq vision
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      const text = chatCompletion.choices[0]?.message?.content || "";

      // Parse JSON response
      let extractedData: ExtractedInvoiceData;
      try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse Groq response:", text);
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
    }
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
