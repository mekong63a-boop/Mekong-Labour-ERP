import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CCCDData {
  full_name?: string;
  birth_date?: string;
  gender?: string;
  cccd_number?: string;
  cccd_date?: string;
  cccd_place?: string;
  permanent_address?: string;
  ethnicity?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Validate JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { error: authError } = await supabase.auth.getUser(token);
  if (authError) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { image, side } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Cần có ảnh CCCD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Vision API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();

    if (visionData.error) {
      console.error("Vision API error:", visionData.error);
      return new Response(
        JSON.stringify({ error: visionData.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
    console.log("Extracted text:", fullText);

    // Parse CCCD data from text
    const extracted = parseVietnamCCCD(fullText, side);

    return new Response(
      JSON.stringify({ extracted, rawText: fullText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseVietnamCCCD(text: string, side: "front" | "back"): CCCDData {
  const result: CCCDData = {};
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (side === "front") {
    // Extract ID number (12 digits)
    const idMatch = text.match(/\b(\d{12})\b/);
    if (idMatch) {
      result.cccd_number = idMatch[1];
    }

    // Extract full name (usually after "Họ và tên" or similar)
    const namePatterns = [
      /Họ và tên[:\s]*([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s]+)/i,
      /Full name[:\s]*([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s]+)/i,
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.full_name = match[1].trim().toUpperCase();
        break;
      }
    }

    // If no pattern matched, look for all-caps name in lines
    if (!result.full_name) {
      for (const line of lines) {
        // Vietnamese full name pattern (all caps, 2-4 words)
        if (/^[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s]{5,50}$/.test(line)) {
          const words = line.split(/\s+/);
          if (words.length >= 2 && words.length <= 5) {
            result.full_name = line;
            break;
          }
        }
      }
    }

    // Extract birth date (DD/MM/YYYY or DD-MM-YYYY)
    const dateMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (dateMatch) {
      // Convert to YYYY-MM-DD format
      result.birth_date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }

    // Extract gender
    if (/\bNam\b/i.test(text)) {
      result.gender = "Nam";
    } else if (/\bNữ\b/i.test(text)) {
      result.gender = "Nữ";
    }

    // Extract ethnicity
    const ethnicityMatch = text.match(/Dân tộc[:\s]*([^\n,]+)/i);
    if (ethnicityMatch) {
      result.ethnicity = ethnicityMatch[1].trim();
    }
  } else if (side === "back") {
    // Extract permanent address
    const addressPatterns = [
      /Nơi thường trú[:\s]*([^\n]+(?:\n[^\n]+)?)/i,
      /Thường trú[:\s]*([^\n]+(?:\n[^\n]+)?)/i,
      /Place of residence[:\s]*([^\n]+(?:\n[^\n]+)?)/i,
    ];
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.permanent_address = match[1].replace(/\n/g, ", ").trim();
        break;
      }
    }

    // Extract issue date
    const issueDatePatterns = [
      /Ngày[,\s]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    ];
    for (const pattern of issueDatePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.cccd_date = `${match[3]}-${match[2]}-${match[1]}`;
        break;
      }
    }

    // Extract issue place
    const placePatterns = [
      /CỤC TRƯỞNG CỤC CẢNH SÁT/i,
      /CỤC CẢNH SÁT/i,
      /GIÁM ĐỐC CÔNG AN/i,
    ];
    for (const pattern of placePatterns) {
      if (pattern.test(text)) {
        result.cccd_place = "Cục Cảnh sát QLHC về TTXH";
        break;
      }
    }
  }

  return result;
}
