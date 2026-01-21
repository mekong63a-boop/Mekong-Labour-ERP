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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return dateStr;
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
    
    // Fetch and embed Roboto font (supports Vietnamese)
    const robotoRegularUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf";
    const robotoBoldUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf";
    
    const [regularFontBytes, boldFontBytes] = await Promise.all([
      fetch(robotoRegularUrl).then(res => res.arrayBuffer()),
      fetch(robotoBoldUrl).then(res => res.arrayBuffer()),
    ]);
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const fontBold = await pdfDoc.embedFont(boldFontBytes);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const lineHeight = 18;
    const sectionGap = 25;

    const drawText = (text: string, x: number, yPos: number, size = 10, bold = false) => {
      page.drawText(text || "", {
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
      drawText(title, margin, y, 12, true);
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
      drawText(value || "—", margin + 150, y, 9, false);
      y -= lineHeight;
    };

    // Header
    drawText("HỒ SƠ HỌC VIÊN", width / 2 - 60, y, 16, true);
    y -= 10;
    drawText("TRAINEE PROFILE", width / 2 - 50, y, 12, false);
    y -= lineHeight * 2;

    // Basic Info
    drawSection("THÔNG TIN CƠ BẢN");
    drawRow("Mã học viên", trainee.trainee_code);
    drawRow("Họ và tên", trainee.full_name);
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
    if (!trainee.can_view_pii) {
      y -= 5;
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

    // Company & Union - show Japanese name (bilingual if Vietnamese exists)
    drawSection("CÔNG TY & NGHIỆP ĐOÀN");
    
    // Company: show Japanese name, add Vietnamese in parentheses if exists
    let companyDisplay = trainee.company?.name_japanese || null;
    if (companyDisplay && trainee.company?.name && trainee.company.name !== companyDisplay) {
      companyDisplay = `${trainee.company.name_japanese} (${trainee.company.name})`;
    } else if (!companyDisplay) {
      companyDisplay = trainee.company?.name || null;
    }
    drawRow("Công ty tiếp nhận", companyDisplay);
    
    // Union: show Japanese name, add Vietnamese in parentheses if exists
    let unionDisplay = trainee.union?.name_japanese || null;
    if (unionDisplay && trainee.union?.name && trainee.union.name !== unionDisplay) {
      unionDisplay = `${trainee.union.name_japanese} (${trainee.union.name})`;
    } else if (!unionDisplay) {
      unionDisplay = trainee.union?.name || null;
    }
    drawRow("Nghiệp đoàn", unionDisplay);
    
    // Job category: show Japanese name, add Vietnamese in parentheses if exists
    let jobDisplay = trainee.job_category?.name_japanese || null;
    if (jobDisplay && trainee.job_category?.name && trainee.job_category.name !== jobDisplay) {
      jobDisplay = `${trainee.job_category.name_japanese} (${trainee.job_category.name})`;
    } else if (!jobDisplay) {
      jobDisplay = trainee.job_category?.name || null;
    }
    drawRow("Ngành nghề", jobDisplay);

    // Class
    if (trainee.class?.id) {
      drawSection("LỚP HỌC");
      drawRow("Mã lớp", trainee.class.code || null);
      drawRow("Tên lớp", trainee.class.name || null);
      drawRow("Tình trạng học", trainee.enrollment_status);
    }

    // Timeline
    drawSection("MỐC THỜI GIAN");
    drawRow("Ngày đăng ký", formatDate(trainee.entry_date));
    drawRow("Ngày đậu PV", formatDate(trainee.interview_pass_date));
    drawRow("Nộp hồ sơ", formatDate(trainee.document_submission_date));
    drawRow("Đăng OTIT", formatDate(trainee.otit_entry_date));
    drawRow("Đăng Nyukan", formatDate(trainee.nyukan_entry_date));
    drawRow("COE", formatDate(trainee.coe_date));
    drawRow("Visa", formatDate(trainee.visa_date));
    drawRow("Xuất cảnh", formatDate(trainee.departure_date));
    drawRow("Về nước", formatDate(trainee.return_date));
    drawRow("Dự kiến về", formatDate(trainee.expected_return_date));

    // Workflow Status
    if (trainee.workflow) {
      drawSection("TRẠNG THÁI QUY TRÌNH");
      const stageLabel = stageLabels[trainee.workflow.current_stage || ""] || trainee.workflow.current_stage || "—";
      drawRow("Giai đoạn hiện tại", stageLabel);
      drawRow("Trạng thái phụ", trainee.workflow.sub_status || null);
      drawRow("Ngày chuyển", formatDate(trainee.workflow.transitioned_at || null));
    }

    // Interview History
    if (trainee.interview_history && trainee.interview_history.length > 0) {
      drawSection("LỊCH SỬ PHỎNG VẤN");
      for (const interview of trainee.interview_history) {
        const resultText = interview.result === "passed" ? "Đậu" : interview.result;
        drawRow(formatDate(interview.interview_date), resultText);
        if (interview.notes) {
          y -= 3;
          drawText("  " + interview.notes.substring(0, 80), margin + 20, y, 8, false);
          y -= lineHeight - 5;
        }
      }
    }

    // Notes
    if (trainee.notes) {
      drawSection("GHI CHÚ CHUNG");
      const noteLines = trainee.notes.match(/.{1,80}/g) || [trainee.notes];
      for (const line of noteLines.slice(0, 5)) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
        drawText(line, margin, y, 9, false);
        y -= lineHeight;
      }
    }

    // Footer
    y = 30;
    const now = new Date();
    const exportDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    drawText(`Xuất ngày: ${exportDate}`, margin, y, 8, false);
    drawText("Mekong ERP System", width - margin - 100, y, 8, false);

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
