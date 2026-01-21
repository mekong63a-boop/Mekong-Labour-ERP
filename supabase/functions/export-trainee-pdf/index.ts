import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://bcltzwpnhfpbfiuhfkxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHR6d3BuaGZwYmZpdWhma3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTU0NDQsImV4cCI6MjA4Mzg3MTQ0NH0.ktTKQxMCXGhXaaa5OkfDrx9I0-YPESh8Z4kHNBQkCJ4";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string;
  class_name: string | null;
}

interface TestScoreRecord {
  id: string;
  test_name: string;
  test_date: string;
  score: number | null;
  max_score: number;
  notes: string | null;
  evaluation: string | null;
  class_id: string;
  class_name: string | null;
}

interface TraineeProfile {
  id: string;
  trainee_code: string;
  full_name: string;
  furigana: string | null;
  birth_date: string | null;
  gender: string | null;
  trainee_type: string | null;
  source: string | null;
  photo_url: string | null;
  phone: string | null;
  zalo: string | null;
  email: string | null;
  parent_phone_1: string | null;
  parent_phone_2: string | null;
  cccd_number: string | null;
  cccd_date: string | null;
  passport_number: string | null;
  passport_date: string | null;
  permanent_address: string | null;
  current_address: string | null;
  birthplace: string | null;
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  visa_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  expected_return_date: string | null;
  progression_stage: string | null;
  simple_status: string | null;
  enrollment_status: string | null;
  notes: string | null;
  workflow: {
    current_stage?: string;
    sub_status?: string;
    transitioned_at?: string;
  };
  company: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  union: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  job_category: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  class: {
    id?: string;
    code?: string;
    name?: string;
  };
  interview_history: Array<{
    interview_date: string;
    result: string;
    notes: string | null;
    company_id: string;
    company_name?: string;
    company_name_japanese?: string;
    union_name?: string;
    union_name_japanese?: string;
    job_category_name?: string;
    job_category_name_japanese?: string;
  }>;
  reviews: Array<{
    id: string;
    review_type: string;
    content: string;
    rating: number | null;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
    created_at: string;
  }>;
  attendance: AttendanceRecord[];
  test_scores: TestScoreRecord[];
  can_view_pii: boolean;
  error?: string;
}

const stageLabels: Record<string, string> = {
  trained: "Đào tạo",
  dormitory: "Ký túc xá",
  ready_to_depart: "Sẵn sàng xuất cảnh",
  departed: "Đã xuất cảnh",
  post_departure: "Sau xuất cảnh",
  archived: "Lưu trữ",
};

const statusLabels: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng",
  late: "Đi trễ",
  excused: "Nghỉ phép",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Format bilingual: Japanese (Vietnamese) or just one if same
function formatBilingual(japanese: string | null | undefined, vietnamese: string | null | undefined): string {
  if (japanese && vietnamese && japanese !== vietnamese) {
    return `${japanese} (${vietnamese})`;
  }
  return japanese || vietnamese || "—";
}

// Detect if text contains CJK (Japanese/Chinese/Korean) characters
function containsCJK(text: string): boolean {
  if (!text) return false;
  // CJK Unified Ideographs, Hiragana, Katakana, CJK Symbols
  const cjkPattern = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/;
  return cjkPattern.test(text);
}

// Simple character-based text wrapping - optimized for CPU efficiency
// Uses approximate character limits instead of expensive pixel calculations
function wrapTextSimple(text: string, maxChars: number): string[] {
  if (!text) return [];
  
  const paragraphs = text.split(/\n/);
  const allLines: string[] = [];
  
  for (const para of paragraphs) {
    if (!para.trim()) {
      allLines.push("");
      continue;
    }
    
    const words = para.split(/\s+/).filter(w => w);
    let currentLine = "";
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) allLines.push(currentLine);
        
        // Handle long words
        if (word.length > maxChars) {
          let remaining = word;
          while (remaining.length > maxChars) {
            allLines.push(remaining.substring(0, maxChars));
            remaining = remaining.substring(maxChars);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) allLines.push(currentLine);
  }
  
  return allLines;
}

// Remove special characters that can't be encoded (emojis, special symbols)
function sanitizeText(text: string): string {
  if (!text) return "";
  // Remove ALL problematic Unicode outside Latin/Vietnamese/CJK
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // All emoji blocks
    .replace(/[\u{2600}-\u{27BF}]/gu, '')    // Misc symbols & dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // Variation selectors
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')  // Tags block
    .replace(/[\u{2300}-\u{23FF}]/gu, '')    // Misc technical symbols
    .replace(/[\u{2B00}-\u{2BFF}]/gu, '');   // Misc symbols & arrows
}

// Fetch with timeout to prevent CPU hangs
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.arrayBuffer();
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get trainee_code from query params
    const url = new URL(req.url);
    const traineeCode = url.searchParams.get("trainee_code");

    if (!traineeCode) {
      return new Response(
        JSON.stringify({ error: "trainee_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Call RPC to get trainee profile (this handles permission checks internally)
    const { data: profile, error: rpcError } = await supabase.rpc("get_trainee_full_profile", {
      p_trainee_code: traineeCode,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trainee = profile as TraineeProfile;

    if (trainee.error) {
      return new Response(
        JSON.stringify({ error: trainee.error }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom font embedding
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch Roboto for Vietnamese support (more reliable CDN)
    const robotoRegularUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
    const robotoBoldUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf";
    
    // Noto Sans JP for Japanese + Vietnamese support (weight 400 = Regular, 700 = Bold)
    const notoSansJpRegularUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf";
    const notoSansJpBoldUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf";
    
    // Load all fonts with timeout - NO FALLBACK to StandardFonts (they cannot encode Unicode)
    const [regularFontBytes, boldFontBytes, jpRegularBytes, jpBoldBytes] = await Promise.all([
      fetchWithTimeout(robotoRegularUrl),
      fetchWithTimeout(robotoBoldUrl),
      fetchWithTimeout(notoSansJpRegularUrl),
      fetchWithTimeout(notoSansJpBoldUrl),
    ]);
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const fontBold = await pdfDoc.embedFont(boldFontBytes);
    const fontJp = await pdfDoc.embedFont(jpRegularBytes);
    const fontJpBold = await pdfDoc.embedFont(jpBoldBytes);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const lineHeight = 16;
    const sectionGap = 20;
    const photoSize = 80;

    // Content width for A4 (595.28 - 2*50 margin = 495.28)
    const contentWidth = width - 2 * margin;
    
    // Get appropriate font based on text content - ALWAYS embedded, NEVER StandardFonts
    const getFont = (text: string, bold = false) => {
      const useJpFont = containsCJK(text || "");
      return useJpFont 
        ? (bold ? fontJpBold : fontJp) 
        : (bold ? fontBold : font);
    };

    // Draw text with a specific font (no auto font selection)
    const drawTextWithFont = (
      text: string,
      x: number,
      yPos: number,
      size: number,
      fontToUse: any,
      _bold: boolean
    ) => {
      const safeText = sanitizeText(text || "");
      page.drawText(safeText, {
        x,
        y: yPos,
        size,
        font: fontToUse,
        color: rgb(0, 0, 0),
      });
    };

    // Draw bilingual string "JP (VN)" with mixed fonts to avoid VN squares
    const drawBilingualValue = (value: string, x: number, yPos: number, size = 9, bold = false) => {
      const safeValue = sanitizeText(value || "");
      const match = safeValue.match(/^(.*)\s\((.*)\)$/);
      if (!match) {
        drawText(safeValue, x, yPos, size, bold);
        return;
      }

      const jpPart = (match[1] || "").trimEnd();
      const vnPart = match[2] || "";

      const jpFont = containsCJK(jpPart) ? (bold ? fontJpBold : fontJp) : (bold ? fontBold : font);
      const vnFont = bold ? fontBold : font;

      drawTextWithFont(jpPart, x, yPos, size, jpFont, bold);
      const jpWidth = jpFont.widthOfTextAtSize(sanitizeText(jpPart), size);
      drawTextWithFont(` (${vnPart})`, x + jpWidth, yPos, size, vnFont, bold);
    };

    // Draw text with automatic font selection based on CJK content
    // CRITICAL: Always use embedded fonts (Roboto or NotoSansJP) - NEVER StandardFonts
    const drawText = (text: string, x: number, yPos: number, size = 9, bold = false) => {
      // Sanitize text to remove problematic characters (emojis, special symbols)
      const safeText = sanitizeText(text || "");
      const selectedFont = getFont(safeText, bold);
      
      page.drawText(safeText, {
        x,
        y: yPos,
        size,
        font: selectedFont, // REQUIRED - prevents WinAnsi fallback
        color: rgb(0, 0, 0),
      });
    };
    
    // Draw multiline text with character-based word wrap and automatic page breaks
    // Returns the new Y position after drawing all lines
    // Max ~70 chars per line for A4 at font size 8-9
    const drawMultilineText = (text: string, x: number, startY: number, size = 8, indent = 0): number => {
      if (!text) return startY;
      
      // Sanitize text first
      const safeText = sanitizeText(text);
      // Approximate chars per line: 70 for full width, reduce for indent
      const maxChars = Math.floor((contentWidth - indent) / 7);
      const lines = wrapTextSimple(safeText, maxChars);
      let currentY = startY;
      
      for (const line of lines) {
        if (currentY < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          currentY = height - margin;
        }
        drawText(line, x, currentY, size, false);
        currentY -= lineHeight;
      }
      return currentY;
    };

    const drawSection = (title: string) => {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      y -= sectionGap;
      drawText(title, margin, y, 11, true);
      y -= 5;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= lineHeight;
    };

    const drawRow = (label: string, value: string | null) => {
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      drawText(label + ":", margin, y, 9, false);
      drawText(value || "—", margin + 140, y, 9, false);
      y -= lineHeight;
    };

    const drawRowBilingual = (label: string, value: string) => {
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      drawText(label + ":", margin, y, 9, false);
      drawBilingualValue(value || "—", margin + 140, y, 9, false);
      y -= lineHeight;
    };

    // Draw photo if available (top-left corner)
    if (trainee.photo_url) {
      try {
        const photoResponse = await fetch(trainee.photo_url);
        if (photoResponse.ok) {
          const photoBytes = await photoResponse.arrayBuffer();
          const contentType = photoResponse.headers.get("content-type") || "";
          let embeddedImage;
          
          if (contentType.includes("png")) {
            embeddedImage = await pdfDoc.embedPng(photoBytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(photoBytes);
          }
          
          page.drawImage(embeddedImage, {
            x: margin,
            y: y - photoSize,
            width: photoSize,
            height: photoSize,
          });
        }
      } catch (photoError) {
        console.error("Photo embed error:", photoError);
      }
    }

    // Header with photo offset
    const headerX = trainee.photo_url ? margin + photoSize + 15 : margin;
    drawText("HỒ SƠ HỌC VIÊN", headerX, y, 14, true);
    y -= lineHeight;
    drawText(trainee.full_name, headerX, y, 12, true);
    y -= lineHeight;
    drawText(`Mã: ${trainee.trainee_code}`, headerX, y, 10, false);
    
    // Move y below photo area if photo exists
    if (trainee.photo_url) {
      y = height - margin - photoSize - 20;
    } else {
      y -= lineHeight * 2;
    }

    // Basic Info
    drawSection("THÔNG TIN CƠ BẢN");
    drawRow("Mã học viên", trainee.trainee_code);
    drawRow("Họ và tên", trainee.full_name);
    drawRow("Phiên âm", trainee.furigana);
    drawRow("Ngày sinh", formatDate(trainee.birth_date));
    drawRow("Giới tính", trainee.gender);
    drawRow("Loại hình", trainee.trainee_type);
    drawRow("Nguồn tuyển", trainee.source);
    drawRow("Nơi sinh", trainee.birthplace);

    // Contact Info
    drawSection("THÔNG TIN LIÊN HỆ");
    drawRow("Số điện thoại", trainee.phone);
    drawRow("Zalo", trainee.zalo);
    drawRow("Email", trainee.email);
    drawRow("SĐT phụ huynh 1", trainee.parent_phone_1);
    drawRow("SĐT phụ huynh 2", trainee.parent_phone_2);
    if (!trainee.can_view_pii) {
      y -= 3;
      drawText("* Thông tin nhạy cảm đã được ẩn do quyền truy cập", margin, y, 8, false);
      y -= lineHeight;
    }

    // Address
    drawSection("ĐỊA CHỈ");
    drawRow("Địa chỉ thường trú", trainee.permanent_address);
    drawRow("Địa chỉ hiện tại", trainee.current_address);

    // Documents
    drawSection("GIẤY TỜ");
    drawRow("Số CCCD", trainee.cccd_number);
    drawRow("Ngày cấp CCCD", formatDate(trainee.cccd_date));
    drawRow("Số hộ chiếu", trainee.passport_number);
    drawRow("Ngày cấp HC", formatDate(trainee.passport_date));

    // Company & Union - Bilingual display
    drawSection("CÔNG TY & NGHIỆP ĐOÀN");
    drawRowBilingual("Công ty tiếp nhận", formatBilingual(trainee.company?.name_japanese, trainee.company?.name));
    drawRowBilingual("Nghiệp đoàn", formatBilingual(trainee.union?.name_japanese, trainee.union?.name));
    drawRowBilingual("Ngành nghề", formatBilingual(trainee.job_category?.name_japanese, trainee.job_category?.name));

    // Class
    if (trainee.class?.id) {
      drawSection("LỚP HỌC");
      drawRow("Tên lớp", trainee.class.name || null);
      drawRow("Tình trạng học", trainee.enrollment_status);
    }

    // Training History - Test Scores (only show evaluation, not scores)
    if (trainee.test_scores && trainee.test_scores.length > 0) {
      drawSection("ĐÁNH GIÁ");
      
      // Table header
      drawText("Ngày", margin, y, 8, true);
      drawText("Lớp", margin + 80, y, 8, true);
      drawText("Bài kiểm tra", margin + 140, y, 8, true);
      drawText("Đánh giá", margin + 320, y, 8, true);
      y -= lineHeight;

      for (const score of trainee.test_scores.slice(0, 8)) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        drawText(formatDate(score.test_date), margin, y, 8, false);
        drawText(score.class_name || "—", margin + 80, y, 8, false);
        drawText((score.test_name || "").substring(0, 25), margin + 140, y, 8, false);
        // Only show evaluation, not scores
        const evalText = score.evaluation || "—";
        drawText(evalText, margin + 320, y, 8, false);
        y -= lineHeight - 2;
      }
      
      if (trainee.test_scores.length > 8) {
        drawText(`... và ${trainee.test_scores.length - 8} kết quả khác`, margin, y, 7, false);
        y -= lineHeight;
      }
    }

    // Training History - Attendance (only late/absent)
    const filteredAttendance = trainee.attendance?.filter(att => 
      att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt'
    ) || [];
    
    if (filteredAttendance.length > 0) {
      drawSection("ĐIỂM DANH (ĐI TRỄ / NGHỈ)");
      
      // Table header
      drawText("Ngày", margin, y, 8, true);
      drawText("Lớp", margin + 80, y, 8, true);
      drawText("Trạng thái", margin + 160, y, 8, true);
      drawText("Ghi chú", margin + 240, y, 8, true);
      y -= lineHeight;

      for (const att of filteredAttendance.slice(0, 10)) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        drawText(formatDate(att.date), margin, y, 8, false);
        drawText(att.class_name || "—", margin + 80, y, 8, false);
        drawText(statusLabels[att.status] || att.status, margin + 160, y, 8, false);
        drawText((att.notes || "—").substring(0, 30), margin + 240, y, 8, false);
        y -= lineHeight - 2;
      }
      
      if (filteredAttendance.length > 10) {
        drawText(`... và ${filteredAttendance.length - 10} buổi khác`, margin, y, 7, false);
        y -= lineHeight;
      }
    }

    // Timeline - Chỉ các mục được phép theo SYSTEM RULE
    drawSection("MỐC THỜI GIAN");
    drawRow("Ngày đăng ký", formatDate(trainee.entry_date));
    drawRow("Ngày đậu PV", formatDate(trainee.interview_pass_date));
    drawRow("Ngày nộp hồ sơ", formatDate(trainee.document_submission_date));
    drawRow("Nộp OTIT", formatDate(trainee.otit_entry_date));
    drawRow("Nộp Nyukan", formatDate(trainee.nyukan_entry_date));
    drawRow("Có COE", formatDate(trainee.coe_date));
    drawRow("Ngày xuất cảnh", formatDate(trainee.departure_date));

    // Workflow Status section removed per user request

    // Interview History - FULL CONTENT with company/union/job info
    if (trainee.interview_history && trainee.interview_history.length > 0) {
      drawSection("LỊCH SỬ PHỎNG VẤN");
      for (const interview of trainee.interview_history) {
        if (y < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        
        // Interview date and result (Đậu/Không đậu)
        const resultText = interview.result === "passed" ? "Đậu" : 
                           interview.result === "failed" ? "Không đậu" : 
                           interview.result || "—";
        drawText(`${formatDate(interview.interview_date)} - ${resultText}`, margin, y, 9, true);
        y -= lineHeight;
        
        // Company (bilingual: Japanese + Vietnamese)
        if (interview.company_name || interview.company_name_japanese) {
          const companyDisplay = formatBilingual(interview.company_name_japanese, interview.company_name);
          const prefix = "   Công ty: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          const prefixWidth = font.widthOfTextAtSize(sanitizeText(prefix), 8);
          drawBilingualValue(companyDisplay, margin + prefixWidth, y, 8, false);
          y -= lineHeight;
        }
        
        // Union (bilingual)
        if (interview.union_name || interview.union_name_japanese) {
          const unionDisplay = formatBilingual(interview.union_name_japanese, interview.union_name);
          const prefix = "   Nghiệp đoàn: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          const prefixWidth = font.widthOfTextAtSize(sanitizeText(prefix), 8);
          drawBilingualValue(unionDisplay, margin + prefixWidth, y, 8, false);
          y -= lineHeight;
        }
        
        // Job category (bilingual)
        if (interview.job_category_name || interview.job_category_name_japanese) {
          const jobDisplay = formatBilingual(interview.job_category_name_japanese, interview.job_category_name);
          const prefix = "   Ngành nghề: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          const prefixWidth = font.widthOfTextAtSize(sanitizeText(prefix), 8);
          drawBilingualValue(jobDisplay, margin + prefixWidth, y, 8, false);
          y -= lineHeight;
        }

        // Expected entry month
        // Must match TraineeProfileView: "Dự kiến nhập cảnh"
        if ((interview as any).expected_entry_month) {
          drawTextWithFont("   Dự kiến nhập cảnh: ", margin, y, 8, font, false);
          const prefix = "   Dự kiến nhập cảnh: ";
          const prefixWidth = font.widthOfTextAtSize(sanitizeText(prefix), 8);
          drawTextWithFont((interview as any).expected_entry_month, margin + prefixWidth, y, 8, font, false);
          y -= lineHeight;
        }
        
        // Notes - full content with word wrap
        if (interview.notes) {
          y -= 2;
          y = drawMultilineText(`   Ghi chú: ${interview.notes}`, margin, y, 8, 20);
        }
        
        y -= 5; // Gap between interviews
      }
    }

    // Reviews - FULL CONTENT (no truncation)
    if (trainee.reviews && trainee.reviews.length > 0) {
      drawSection("NHẬN XÉT");
      for (const review of trainee.reviews) {
        if (y < 80) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        const header = `[${review.review_type}] ${formatDate(review.created_at)}${review.rating ? ` - Điểm: ${review.rating}/10` : ''}`;
        drawText(header, margin, y, 8, true);
        y -= lineHeight - 2;
        // Full content with word wrap and page breaks
        y = drawMultilineText(review.content, margin, y, 8, 0);
        if (review.is_blacklisted && review.blacklist_reason) {
          y = drawMultilineText(`⚠ Blacklist: ${review.blacklist_reason}`, margin, y, 7, 0);
        }
      }
    }

    // Notes - FULL CONTENT with proper word wrap
    if (trainee.notes) {
      drawSection("GHI CHÚ CHUNG");
      // Use word wrap function for proper line breaks - full width
      y = drawMultilineText(trainee.notes, margin, y, 8, 0);
    }

    // Footer
    y = 30;
    const now = new Date();
    const exportDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    drawText(`Xuất ngày: ${exportDate}`, margin, y, 7, false);
    drawText("Mekong ERP System", width - margin - 90, y, 7, false);

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Filename format: <MA_HOC_VIEN> - <HO_VA_TEN>.pdf
    // Remove special characters from filename but keep Vietnamese diacritics
    const safeFullName = trainee.full_name.replace(/[\\/:*?"<>|]/g, '');
    const filename = `${trainee.trainee_code} - ${safeFullName}.pdf`;
    
    // Encode filename for Content-Disposition header (RFC 5987)
    const encodedFilename = encodeURIComponent(filename);

    return new Response(new Uint8Array(pdfBytes).buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF: " + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
