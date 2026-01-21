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
  recruited: "Tuyển dụng",
  trained: "Đào tạo",
  dormitory: "Ký túc xá",
  visa_processing: "Xử lý visa",
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
    
    let font, fontBold;
    try {
      const [regularFontBytes, boldFontBytes] = await Promise.all([
        fetch(robotoRegularUrl).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch regular font: ${res.status}`);
          return res.arrayBuffer();
        }),
        fetch(robotoBoldUrl).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch bold font: ${res.status}`);
          return res.arrayBuffer();
        }),
      ]);
      
      font = await pdfDoc.embedFont(regularFontBytes);
      fontBold = await pdfDoc.embedFont(boldFontBytes);
    } catch (fontError) {
      console.error("Font loading error:", fontError);
      // Fallback to standard fonts
      const { StandardFonts } = await import("https://esm.sh/pdf-lib@1.17.1");
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const lineHeight = 16;
    const sectionGap = 20;

    const drawText = (text: string, x: number, yPos: number, size = 9, bold = false) => {
      const safeText = (text || "").substring(0, 100); // Limit text length
      page.drawText(safeText, {
        x,
        y: yPos,
        size,
        font: bold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
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

    // Header
    drawText("HỒ SƠ HỌC VIÊN", width / 2 - 50, y, 14, true);
    y -= lineHeight * 2;

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
    drawRow("Công ty tiếp nhận", formatBilingual(trainee.company?.name_japanese, trainee.company?.name));
    drawRow("Nghiệp đoàn", formatBilingual(trainee.union?.name_japanese, trainee.union?.name));
    drawRow("Ngành nghề", formatBilingual(trainee.job_category?.name_japanese, trainee.job_category?.name));

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

    // Timeline
    drawSection("MỐC THỜI GIAN");
    drawRow("Ngày đăng ký", formatDate(trainee.entry_date));
    drawRow("Ngày đậu PV", formatDate(trainee.interview_pass_date));
    drawRow("Nộp hồ sơ", formatDate(trainee.document_submission_date));
    drawRow("Đăng OTIT", formatDate(trainee.otit_entry_date));
    drawRow("Đăng Nyukan", formatDate(trainee.nyukan_entry_date));
    drawRow("COE", formatDate(trainee.coe_date));
    drawRow("Xuất cảnh", formatDate(trainee.departure_date));
    drawRow("Về nước", formatDate(trainee.return_date));
    drawRow("Dự kiến về", formatDate(trainee.expected_return_date));

    // Workflow Status section removed per user request

    // Interview History
    if (trainee.interview_history && trainee.interview_history.length > 0) {
      drawSection("LỊCH SỬ PHỎNG VẤN");
      for (const interview of trainee.interview_history) {
        const resultText = interview.result === "passed" ? "Đậu" : interview.result;
        drawRow(formatDate(interview.interview_date), resultText);
        if (interview.notes) {
          y -= 2;
          drawText("  " + interview.notes.substring(0, 70), margin + 20, y, 7, false);
          y -= lineHeight - 4;
        }
      }
    }

    // Reviews
    if (trainee.reviews && trainee.reviews.length > 0) {
      drawSection("ĐÁNH GIÁ");
      for (const review of trainee.reviews.slice(0, 5)) {
        if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        const header = `[${review.review_type}] ${formatDate(review.created_at)}${review.rating ? ` - Điểm: ${review.rating}/10` : ''}`;
        drawText(header, margin, y, 8, true);
        y -= lineHeight - 2;
        drawText(review.content.substring(0, 100), margin, y, 8, false);
        y -= lineHeight;
        if (review.is_blacklisted && review.blacklist_reason) {
          drawText(`⚠ Blacklist: ${review.blacklist_reason.substring(0, 60)}`, margin, y, 7, false);
          y -= lineHeight;
        }
      }
    }

    // Notes - show all content without limit
    if (trainee.notes) {
      drawSection("GHI CHÚ CHUNG");
      const noteLines = trainee.notes.match(/.{1,80}/g) || [trainee.notes];
      for (const line of noteLines) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        drawText(line, margin, y, 8, false);
        y -= lineHeight;
      }
    }

    // Footer
    y = 30;
    const now = new Date();
    const exportDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    drawText(`Xuất ngày: ${exportDate}`, margin, y, 7, false);
    drawText("Mekong ERP System", width - margin - 90, y, 7, false);

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF as download
    const filename = `hoc-vien-${trainee.trainee_code}.pdf`;

    return new Response(new Uint8Array(pdfBytes).buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
