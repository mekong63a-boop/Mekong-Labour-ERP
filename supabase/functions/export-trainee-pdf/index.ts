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
  facebook: string | null;
  parent_phone_1: string | null;
  parent_phone_2: string | null;
  cccd_number: string | null;
  cccd_date: string | null;
  cccd_place: string | null;
  passport_number: string | null;
  passport_date: string | null;
  permanent_address: string | null;
  current_address: string | null;
  temp_address: string | null;
  household_address: string | null;
  birthplace: string | null;
  // Personal details
  ethnicity: string | null;
  religion: string | null;
  marital_status: string | null;
  education_level: string | null;
  policy_category: string | null;
  // Physical
  height: number | null;
  weight: number | null;
  blood_group: string | null;
  vision_left: number | null;
  vision_right: number | null;
  hearing: string | null;
  hepatitis_b: string | null;
  dominant_hand: string | null;
  smoking: string | null;
  drinking: string | null;
  tattoo: boolean | null;
  tattoo_description: string | null;
  health_status: string | null;
  hobbies: string | null;
  // Timeline
  entry_date: string | null;
  registration_date: string | null;
  interview_pass_date: string | null;
  interview_count: number | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  visa_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  expected_return_date: string | null;
  expected_entry_month: string | null;
  contract_term: number | null;
  contract_end_date: string | null;
  // Status
  progression_stage: string | null;
  simple_status: string | null;
  enrollment_status: string | null;
  notes: string | null;
  // Related
  workflow: { current_stage?: string; sub_status?: string; transitioned_at?: string };
  company: { id?: string; code?: string; name?: string; name_japanese?: string };
  union: { id?: string; code?: string; name?: string; name_japanese?: string };
  job_category: { id?: string; code?: string; name?: string; name_japanese?: string };
  class: { id?: string; code?: string; name?: string };
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
    expected_entry_month?: string;
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
  education_history: Array<{
    id: string;
    school_name: string;
    level: string | null;
    major: string | null;
    start_month: number | null;
    start_year: number | null;
    end_month: number | null;
    end_year: number | null;
  }>;
  work_history: Array<{
    id: string;
    company_name: string;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    responsibilities: string | null;
  }>;
  family_members: Array<{
    id: string;
    full_name: string;
    relationship: string;
    birth_year: number | null;
    occupation: string | null;
    location: string | null;
  }>;
  japan_relatives: Array<{
    id: string;
    full_name: string;
    relationship: string | null;
    age: number | null;
    address_japan: string | null;
    residence_status: string | null;
  }>;
  dormitory_history: Array<{
    id: string;
    dormitory_name: string | null;
    room_number: string | null;
    bed_number: string | null;
    check_in_date: string;
    check_out_date: string | null;
    status: string | null;
    from_dormitory_name: string | null;
  }>;
  enrollment_history: Array<{
    id: string;
    action_type: string;
    action_date: string;
    notes: string | null;
    from_class: string | null;
    to_class: string | null;
  }>;
  trainee_notes: Array<{
    id: string;
    note_type: string;
    content: string;
    created_at: string;
  }>;
  violations: Array<{
    id: string;
    violation_type: string;
    description: string;
    violation_date: string;
    status: string;
  }>;
  workflow_history: Array<{
    id: string;
    from_stage: string | null;
    to_stage: string;
    sub_status: string | null;
    reason: string | null;
    changed_by: string | null;
    created_at: string;
    department_name: string | null;
  }>;
  audit_logs: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
  can_view_pii: boolean;
  error?: string;
}

const stageLabels: Record<string, string> = {
  registered: "Đăng ký",
  enrolled: "Nhập học",
  training: "Đào tạo",
  interview_passed: "Đậu phỏng vấn",
  document_processing: "Xử lý hồ sơ",
  ready_to_depart: "Sẵn sàng xuất cảnh",
  departed: "Đã xuất cảnh",
  post_departure: "Sau xuất cảnh",
  terminated: "Kết thúc",
  trained: "Đào tạo",
  dormitory: "Ký túc xá",
  archived: "Lưu trữ",
};

const statusLabels: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng",
  late: "Đi trễ",
  excused: "Nghỉ có phép",
  unexcused: "Nghỉ không phép",
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

function formatBilingual(japanese: string | null | undefined, vietnamese: string | null | undefined): string {
  if (japanese && vietnamese && japanese !== vietnamese) {
    return `${japanese} (${vietnamese})`;
  }
  return japanese || vietnamese || "—";
}

function containsCJK(text: string): boolean {
  if (!text) return false;
  const cjkPattern = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/;
  return cjkPattern.test(text);
}

function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/[\u{2B00}-\u{2BFF}]/gu, '');
}

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

function getStageLabel(stage: string | null): string {
  if (!stage) return "—";
  return stageLabels[stage] || stage;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const traineeCode = url.searchParams.get("trainee_code");

    if (!traineeCode) {
      return new Response(
        JSON.stringify({ error: "trainee_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const notoSansJpRegularUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf";
    const notoSansJpBoldUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf";
    const robotoRegularUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
    const robotoBoldUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf";

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

    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const lineHeight = 16;
    const sectionGap = 20;
    const photoSize = 80;
    const contentWidth = width - 2 * margin;

    const getFont = (text: string, bold = false) => {
      return containsCJK(text || "")
        ? (bold ? fontJpBold : fontJp)
        : (bold ? fontBold : font);
    };

    const drawTextWithFont = (text: string, x: number, yPos: number, size: number, fontToUse: any, _bold: boolean) => {
      const safeText = sanitizeText(text || "");
      page.drawText(safeText, { x, y: yPos, size, font: fontToUse, color: rgb(0, 0, 0) });
    };

    const drawBilingualValue = (value: string, x: number, yPos: number, size = 9, bold = false) => {
      const safeValue = sanitizeText(value || "");
      const match = safeValue.match(/^(.*)\s\((.*)\)$/);
      if (!match) {
        drawTextWithFont(safeValue, x, yPos, size, bold ? fontJpBold : fontJp, bold);
        return;
      }
      const jpPart = (match[1] || "").trimEnd();
      const vnPart = match[2] || "";
      const jpFont = bold ? fontJpBold : fontJp;
      drawTextWithFont(jpPart, x, yPos, size, jpFont, bold);
      const jpWidth = jpFont.widthOfTextAtSize(sanitizeText(jpPart), size);
      drawTextWithFont(` (${vnPart})`, x + jpWidth, yPos, size, jpFont, bold);
    };

    const drawText = (text: string, x: number, yPos: number, size = 9, bold = false) => {
      const safeText = sanitizeText(text || "");
      const selectedFont = getFont(safeText, bold);
      page.drawText(safeText, { x, y: yPos, size, font: selectedFont, color: rgb(0, 0, 0) });
    };

    const wrapTextByWidth = (raw: string, maxWidth: number, size: number): string[] => {
      const safe = sanitizeText(raw || "");
      if (!safe) return [];
      const paragraphs = safe.split(/\n/);
      const out: string[] = [];
      for (const para of paragraphs) {
        if (!para.trim()) { out.push(""); continue; }
        const words = para.split(/\s+/).filter(Boolean);
        let line = "";
        const measure = (t: string) => getFont(t, false).widthOfTextAtSize(t, size);
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (measure(candidate) <= maxWidth) { line = candidate; continue; }
          if (line) out.push(line);
          if (measure(word) > maxWidth) {
            let chunk = "";
            for (const ch of [...word]) {
              const cc = chunk + ch;
              if (measure(cc) <= maxWidth) { chunk = cc; } else { if (chunk) out.push(chunk); chunk = ch; }
            }
            if (chunk) { out.push(chunk); chunk = ""; }
            line = "";
            continue;
          }
          line = word;
        }
        if (line) out.push(line);
      }
      return out;
    };

    const drawMultilineText = (text: string, x: number, startY: number, size = 8, indent = 0): number => {
      if (!text) return startY;
      const maxWidth = contentWidth - indent;
      const lines = wrapTextByWidth(text, maxWidth, size);
      let currentY = startY;
      for (const line of lines) {
        if (currentY < 50) { page = pdfDoc.addPage([595.28, 841.89]); currentY = height - margin; }
        drawText(line, x + indent, currentY, size, false);
        currentY -= lineHeight;
      }
      return currentY;
    };

    const checkPage = (needed = 50) => {
      if (y < needed) { page = pdfDoc.addPage([595.28, 841.89]); y = height - margin; }
    };

    const drawSection = (title: string) => {
      checkPage(100);
      y -= sectionGap;
      drawText(title, margin, y, 11, true);
      y -= 5;
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
      y -= lineHeight;
    };

    const drawRow = (label: string, value: string | null) => {
      checkPage();
      drawText(label + ":", margin, y, 9, false);
      drawText(value || "—", margin + 140, y, 9, false);
      y -= lineHeight;
    };

    const drawRowBilingual = (label: string, value: string) => {
      checkPage();
      drawText(label + ":", margin, y, 9, false);
      drawBilingualValue(value || "—", margin + 140, y, 9, false);
      y -= lineHeight;
    };

    // ---- drawTable helper ----
    const drawTable = (headers: string[], colWidths: number[], rows: string[][]) => {
      // Header row
      checkPage(60);
      let xOff = margin;
      for (let i = 0; i < headers.length; i++) {
        drawText(headers[i], xOff, y, 8, true);
        xOff += colWidths[i];
      }
      y -= lineHeight;

      // Data rows
      for (const row of rows) {
        checkPage();
        xOff = margin;
        for (let i = 0; i < row.length; i++) {
          const cellText = (row[i] || "—").substring(0, 40);
          drawText(cellText, xOff, y, 8, false);
          xOff += colWidths[i];
        }
        y -= lineHeight - 2;
      }
    };

    // ========== PHOTO ==========
    if (trainee.photo_url) {
      try {
        const photoResponse = await fetch(trainee.photo_url);
        if (photoResponse.ok) {
          const photoBytes = await photoResponse.arrayBuffer();
          const contentType = photoResponse.headers.get("content-type") || "";
          const embeddedImage = contentType.includes("png")
            ? await pdfDoc.embedPng(photoBytes)
            : await pdfDoc.embedJpg(photoBytes);
          page.drawImage(embeddedImage, { x: margin, y: y - photoSize, width: photoSize, height: photoSize });
        }
      } catch (photoError) {
        console.error("Photo embed error:", photoError);
      }
    }

    // ========== HEADER ==========
    const headerX = trainee.photo_url ? margin + photoSize + 15 : margin;
    drawText("HỒ SƠ HỌC VIÊN", headerX, y, 14, true);
    y -= lineHeight;
    drawText(trainee.full_name, headerX, y, 12, true);
    y -= lineHeight;
    drawText(`Mã: ${trainee.trainee_code}`, headerX, y, 10, false);
    if (trainee.photo_url) {
      y = height - margin - photoSize - 20;
    } else {
      y -= lineHeight * 2;
    }

    // ========== 1. THÔNG TIN CÁ NHÂN ==========
    drawSection("THÔNG TIN CÁ NHÂN");
    drawRow("Mã học viên", trainee.trainee_code);
    drawRow("Họ và tên", trainee.full_name);
    drawRow("Phiên âm", trainee.furigana);
    drawRow("Ngày sinh", formatDate(trainee.birth_date));
    drawRow("Giới tính", trainee.gender);
    drawRow("Loại hình", trainee.trainee_type);
    drawRow("Nơi sinh", trainee.birthplace);
    drawRow("Dân tộc", trainee.ethnicity);
    drawRow("Tôn giáo", trainee.religion);
    drawRow("Tình trạng hôn nhân", trainee.marital_status);
    drawRow("Trình độ học vấn", trainee.education_level);
    drawRow("Diện chính sách", trainee.policy_category);
    drawRow("Nguồn tuyển", trainee.source);

    // ========== 2. THÔNG TIN LIÊN HỆ ==========
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

    // ========== 3. ĐỊA CHỈ ==========
    drawSection("ĐỊA CHỈ");
    drawRow("Địa chỉ thường trú", trainee.permanent_address);
    drawRow("Địa chỉ hiện tại", trainee.current_address);
    
    drawRow("Địa chỉ hộ khẩu", trainee.household_address);

    // ========== 4. GIẤY TỜ ==========
    drawSection("GIẤY TỜ");
    drawRow("Số CCCD", trainee.cccd_number);
    drawRow("Ngày cấp CCCD", formatDate(trainee.cccd_date));
    drawRow("Nơi cấp CCCD", trainee.cccd_place);
    drawRow("Số hộ chiếu", trainee.passport_number);
    drawRow("Ngày cấp HC", formatDate(trainee.passport_date));

    // ========== 5. THỂ CHẤT & SỨC KHỎE ==========
    drawSection("THỂ CHẤT & SỨC KHỎE");
    drawRow("Chiều cao", trainee.height ? `${trainee.height} cm` : null);
    drawRow("Cân nặng", trainee.weight ? `${trainee.weight} kg` : null);
    drawRow("Nhóm máu", trainee.blood_group);
    drawRow("Thị lực trái", trainee.vision_left?.toString() || null);
    drawRow("Thị lực phải", trainee.vision_right?.toString() || null);
    drawRow("Thính lực", trainee.hearing);
    drawRow("Viêm gan B", trainee.hepatitis_b);
    drawRow("Tay thuận", trainee.dominant_hand);
    drawRow("Hút thuốc", trainee.smoking);
    drawRow("Uống rượu", trainee.drinking);
    drawRow("Xăm hình", trainee.tattoo ? `Có${trainee.tattoo_description ? `: ${trainee.tattoo_description}` : ''}` : "Không");
    drawRow("Tình trạng sức khỏe", trainee.health_status);
    drawRow("Sở thích", trainee.hobbies);

    // ========== 6. CÔNG TY & NGHIỆP ĐOÀN ==========
    const hasPassedInterview = trainee.progression_stage &&
      trainee.progression_stage !== "Chưa đậu" &&
      trainee.progression_stage !== "";

    if (hasPassedInterview) {
      drawSection("CÔNG TY & NGHIỆP ĐOÀN");
      drawRowBilingual("Công ty tiếp nhận", formatBilingual(trainee.company?.name_japanese, trainee.company?.name));
      drawRowBilingual("Nghiệp đoàn", formatBilingual(trainee.union?.name_japanese, trainee.union?.name));
      drawRowBilingual("Ngành nghề", formatBilingual(trainee.job_category?.name_japanese, trainee.job_category?.name));
    }

    // ========== 7. LỚP HỌC — ĐÃ LOẠI BỎ THEO YÊU CẦU ==========

    // ========== 8. QUÁ TRÌNH ĐÀO TẠO - ĐÁNH GIÁ ==========
    if (trainee.test_scores && trainee.test_scores.length > 0) {
      drawSection("ĐÁNH GIÁ");
      drawTable(
        ["Ngày", "Lớp", "Bài kiểm tra", "Đánh giá"],
        [80, 60, 180, 100],
        trainee.test_scores.slice(0, 8).map(s => [
          formatDate(s.test_date),
          s.class_name || "—",
          (s.test_name || "").substring(0, 25),
          s.evaluation || "—",
        ])
      );
      if (trainee.test_scores.length > 8) {
        drawText(`... và ${trainee.test_scores.length - 8} kết quả khác`, margin, y, 7, false);
        y -= lineHeight;
      }
    }

    // ========== 9. ĐIỂM DANH ==========
    const filteredAttendance = trainee.attendance?.filter(att =>
      att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt'
    ) || [];

    if (filteredAttendance.length > 0) {
      drawSection("ĐIỂM DANH (ĐI TRỄ / NGHỈ)");
      drawTable(
        ["Ngày", "Lớp", "Trạng thái", "Ghi chú"],
        [80, 80, 80, 180],
        filteredAttendance.slice(0, 10).map(a => [
          formatDate(a.date),
          a.class_name || "—",
          statusLabels[a.status] || a.status,
          (a.notes || "—").substring(0, 30),
        ])
      );
      if (filteredAttendance.length > 10) {
        drawText(`... và ${filteredAttendance.length - 10} buổi khác`, margin, y, 7, false);
        y -= lineHeight;
      }
    }

    // ========== 10. MỐC THỜI GIAN ==========
    drawSection("MỐC THỜI GIAN");
    drawRow("Ngày đăng ký", formatDate(trainee.registration_date || trainee.entry_date));
    drawRow("Số lần PV", trainee.interview_count?.toString() || null);
    drawRow("Ngày đậu PV", formatDate(trainee.interview_pass_date));
    drawRow("Ngày nộp hồ sơ", formatDate(trainee.document_submission_date));
    drawRow("Nộp OTIT", formatDate(trainee.otit_entry_date));
    drawRow("Nộp Nyukan", formatDate(trainee.nyukan_entry_date));
    drawRow("Có COE", formatDate(trainee.coe_date));
    drawRow("Visa", formatDate(trainee.visa_date));
    drawRow("Ngày xuất cảnh", formatDate(trainee.departure_date));
    drawRow("Dự kiến nhập cảnh", trainee.expected_entry_month);

    // ========== 11. HỌC VẤN ==========
    if (trainee.education_history && trainee.education_history.length > 0) {
      drawSection("HỌC VẤN");
      for (const edu of trainee.education_history) {
        checkPage(60);
        drawText(edu.school_name, margin, y, 9, true);
        y -= lineHeight;
        const parts: string[] = [];
        if (edu.level) parts.push(`Cấp: ${edu.level}`);
        if (edu.major) parts.push(`Ngành: ${edu.major}`);
        if (edu.start_year || edu.end_year) {
          const start = edu.start_month ? `${edu.start_month}/${edu.start_year}` : `${edu.start_year || ''}`;
          const end = edu.end_month ? `${edu.end_month}/${edu.end_year}` : `${edu.end_year || 'nay'}`;
          parts.push(`${start} - ${end}`);
        }
        if (parts.length > 0) {
          drawText(parts.join("  |  "), margin + 10, y, 8, false);
          y -= lineHeight;
        }
      }
    }

    // ========== 12. KINH NGHIỆM LÀM VIỆC ==========
    if (trainee.work_history && trainee.work_history.length > 0) {
      drawSection("KINH NGHIỆM LÀM VIỆC");
      for (const work of trainee.work_history) {
        checkPage(60);
        drawText(work.company_name, margin, y, 9, true);
        y -= lineHeight;
        const parts: string[] = [];
        if (work.position) parts.push(`Vị trí: ${work.position}`);
        if (work.start_date || work.end_date) {
          parts.push(`${formatDate(work.start_date)} - ${formatDate(work.end_date) || 'nay'}`);
        }
        if (parts.length > 0) {
          drawText(parts.join("  |  "), margin + 10, y, 8, false);
          y -= lineHeight;
        }
        if (work.responsibilities) {
          y = drawMultilineText(work.responsibilities, margin, y, 8, 10);
        }
      }
    }

    // ========== 13. THÀNH VIÊN GIA ĐÌNH ==========
    if (trainee.family_members && trainee.family_members.length > 0) {
      drawSection("THÀNH VIÊN GIA ĐÌNH");
      drawTable(
        ["Họ tên", "Quan hệ", "Năm sinh", "Nghề nghiệp", "Nơi ở"],
        [110, 70, 60, 100, 120],
        trainee.family_members.map(m => [
          m.full_name,
          m.relationship,
          m.birth_year?.toString() || "—",
          m.occupation || "—",
          m.location || "—",
        ])
      );
    }

    // ========== 14. THÂN NHÂN TẠI NHẬT ==========
    if (trainee.japan_relatives && trainee.japan_relatives.length > 0) {
      drawSection("THÂN NHÂN TẠI NHẬT");
      drawTable(
        ["Họ tên", "Quan hệ", "Tuổi", "Địa chỉ tại Nhật", "Tư cách lưu trú"],
        [100, 70, 40, 150, 100],
        trainee.japan_relatives.map(r => [
          r.full_name,
          r.relationship || "—",
          r.age?.toString() || "—",
          r.address_japan || "—",
          r.residence_status || "—",
        ])
      );
    }

    // ========== 15. LỊCH SỬ Ở KTX ==========
    if (trainee.dormitory_history && trainee.dormitory_history.length > 0) {
      drawSection("LỊCH SỬ Ở KÝ TÚC XÁ");
      drawTable(
        ["KTX", "Phòng", "Giường", "Ngày vào", "Ngày ra", "T.Thái"],
        [100, 50, 50, 80, 80, 60],
        trainee.dormitory_history.map(d => {
          const actualStatus = (d.check_out_date || trainee.departure_date) ? "Đã rời" : (d.status || "Đang ở");
          return [
            d.dormitory_name || "—",
            d.room_number || "—",
            d.bed_number || "—",
            formatDate(d.check_in_date),
            formatDate(d.check_out_date),
            actualStatus,
          ];
        })
      );
    }

    // ========== 16. LỊCH SỬ CHUYỂN LỚP ==========
    if (trainee.enrollment_history && trainee.enrollment_history.length > 0) {
      drawSection("LỊCH SỬ CHUYỂN LỚP");
      for (const enroll of trainee.enrollment_history) {
        checkPage();
        const classInfo = [enroll.from_class, enroll.to_class].filter(Boolean).join(" → ");
        drawText(`${enroll.action_type}${classInfo ? ` (${classInfo})` : ''}`, margin, y, 8, true);
        drawText(formatDate(enroll.action_date), width - margin - 60, y, 8, false);
        y -= lineHeight;
        if (enroll.notes) {
          y = drawMultilineText(enroll.notes, margin, y, 7, 10);
        }
      }
    }

    // ========== 17. LỊCH SỬ PHỎNG VẤN ==========
    if (trainee.interview_history && trainee.interview_history.length > 0) {
      drawSection("LỊCH SỬ PHỎNG VẤN");
      for (const interview of trainee.interview_history) {
        checkPage(100);
        let resultText = interview.result || "—";
        if (interview.result === "passed") resultText = "Đậu";
        else if (interview.result === "failed") resultText = "Không đậu";
        else if (interview.result === "Chờ kết quả" || interview.result === "Chờ") resultText = "Chưa đậu";
        drawText(`${formatDate(interview.interview_date)} - ${resultText}`, margin, y, 9, true);
        y -= lineHeight;

        if (interview.company_name || interview.company_name_japanese) {
          const cd = formatBilingual(interview.company_name_japanese, interview.company_name);
          const prefix = "   Công ty: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          drawBilingualValue(cd, margin + font.widthOfTextAtSize(sanitizeText(prefix), 8), y, 8, false);
          y -= lineHeight;
        }
        if (interview.union_name || interview.union_name_japanese) {
          const ud = formatBilingual(interview.union_name_japanese, interview.union_name);
          const prefix = "   Nghiệp đoàn: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          drawBilingualValue(ud, margin + font.widthOfTextAtSize(sanitizeText(prefix), 8), y, 8, false);
          y -= lineHeight;
        }
        if (interview.job_category_name || interview.job_category_name_japanese) {
          const jd = formatBilingual(interview.job_category_name_japanese, interview.job_category_name);
          const prefix = "   Ngành nghề: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          drawBilingualValue(jd, margin + font.widthOfTextAtSize(sanitizeText(prefix), 8), y, 8, false);
          y -= lineHeight;
        }
        if (interview.expected_entry_month) {
          const prefix = "   Dự kiến nhập cảnh: ";
          drawTextWithFont(prefix, margin, y, 8, font, false);
          drawTextWithFont(interview.expected_entry_month, margin + font.widthOfTextAtSize(sanitizeText(prefix), 8), y, 8, font, false);
          y -= lineHeight;
        }
        if (interview.notes) {
          y -= 2;
          y = drawMultilineText(`   Ghi chú: ${interview.notes}`, margin, y, 8, 20);
        }
        y -= 5;
      }
    }

    // ========== 18. NHẬN XÉT ==========
    if (trainee.reviews && trainee.reviews.length > 0) {
      drawSection("NHẬN XÉT");
      for (const review of trainee.reviews) {
        checkPage(80);
        const header = `[${review.review_type}] ${formatDate(review.created_at)}${review.rating ? ` - Điểm: ${review.rating}/10` : ''}`;
        drawText(header, margin, y, 8, true);
        y -= lineHeight - 2;
        y = drawMultilineText(review.content, margin, y, 8, 0);
        if (review.is_blacklisted && review.blacklist_reason) {
          y = drawMultilineText(`Blacklist: ${review.blacklist_reason}`, margin, y, 7, 0);
        }
      }
    }

    // ========== 19. GHI CHÚ NGHIỆP VỤ ==========
    if (trainee.trainee_notes && trainee.trainee_notes.length > 0) {
      drawSection("GHI CHÚ NGHIỆP VỤ");
      for (const note of trainee.trainee_notes) {
        checkPage(60);
        drawText(`[${note.note_type}] ${formatDate(note.created_at)}`, margin, y, 8, true);
        y -= lineHeight - 2;
        y = drawMultilineText(note.content, margin, y, 8, 0);
        y -= 3;
      }
    }

    // ========== 20. VI PHẠM ==========
    if (trainee.violations && trainee.violations.length > 0) {
      drawSection("VI PHẠM");
      for (const v of trainee.violations) {
        checkPage(60);
        drawText(`[${v.violation_type}] ${formatDate(v.violation_date)} - ${v.status}`, margin, y, 8, true);
        y -= lineHeight - 2;
        y = drawMultilineText(v.description, margin, y, 8, 0);
        y -= 3;
      }
    }

    // ========== 21. LỊCH SỬ GIAI ĐOẠN ==========
    if (trainee.workflow_history && trainee.workflow_history.length > 0) {
      drawSection("LỊCH SỬ GIAI ĐOẠN");
      for (const wh of trainee.workflow_history) {
        checkPage();
        const fromLabel = wh.from_stage ? getStageLabel(wh.from_stage) : "";
        const toLabel = getStageLabel(wh.to_stage);
        const transition = fromLabel ? `${fromLabel} → ${toLabel}` : toLabel;
        drawText(transition, margin, y, 8, true);
        drawText(formatDate(wh.created_at), width - margin - 60, y, 8, false);
        y -= lineHeight;
        if (wh.sub_status) {
          drawText(`   Trạng thái phụ: ${wh.sub_status}`, margin, y, 7, false);
          y -= lineHeight - 2;
        }
        if (wh.reason) {
          y = drawMultilineText(`   Lý do: ${wh.reason}`, margin, y, 7, 10);
        }
        if (wh.department_name) {
          drawText(`   Phòng ban: ${wh.department_name}`, margin, y, 7, false);
          y -= lineHeight - 2;
        }
      }
    }

    // ========== 22. NHẬT KÝ HỆ THỐNG — ĐÃ LOẠI BỎ THEO YÊU CẦU ==========

    // ========== GHI CHÚ CHUNG ==========
    if (trainee.notes) {
      drawSection("GHI CHÚ CHUNG");
      y = drawMultilineText(trainee.notes, margin, y, 8, 0);
    }

    // ========== FOOTER ==========
    y = 30;
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const exportDate = `${vnTime.getUTCDate().toString().padStart(2, "0")}/${(vnTime.getUTCMonth() + 1).toString().padStart(2, "0")}/${vnTime.getUTCFullYear()} ${vnTime.getUTCHours().toString().padStart(2, "0")}:${vnTime.getUTCMinutes().toString().padStart(2, "0")}`;
    drawText(`Xuất ngày: ${exportDate}`, margin, y, 7, false);
    drawText("Mekong ERP System", width - margin - 90, y, 7, false);

    const pdfBytes = await pdfDoc.save();
    const safeFullName = trainee.full_name.replace(/[\\/:*?"<>|]/g, '');
    const filename = `${trainee.trainee_code} - ${safeFullName}.pdf`;
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
