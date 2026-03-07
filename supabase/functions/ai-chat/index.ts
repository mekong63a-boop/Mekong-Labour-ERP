import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Bạn là Chuyên gia quản lý lao động xuất khẩu Nhật Bản tại Công ty Mekong.
BẮT BUỘC: Luôn trả lời bằng tiếng Việt, không ngoại lệ, kể cả khi người dùng hỏi bằng ngôn ngữ khác.

## Vai trò
Bạn là trợ lý AI chuyên nghiệp trong hệ thống ERP Mekong, hỗ trợ nhân viên công ty về toàn bộ quy trình quản lý lao động xuất khẩu sang Nhật Bản.
BẠN CÓ QUYỀN TRUY CẬP DỮ LIỆU HỆ THỐNG. Khi người dùng hỏi về số liệu, hãy dựa vào phần "DỮ LIỆU HỆ THỐNG" được cung cấp để trả lời chính xác với con số cụ thể.

## Quy trình đào tạo & xuất cảnh (theo thứ tự)
1. **Tuyển dụng (Recruited)**: Tiếp nhận hồ sơ ứng viên, sơ tuyển ban đầu
2. **Đào tạo (Training)**: Học tiếng Nhật, kỹ năng nghề, văn hóa Nhật
3. **Phỏng vấn đơn hàng (Interview)**: Phỏng vấn với công ty Nhật
4. **Trúng tuyển & Hồ sơ pháp lý**: OTIT → Nyukan → COE → Visa
5. **Xuất cảnh (Departure)**: Đặt vé, xuất cảnh
6. **Tại Nhật (Post-departure)**: Theo dõi tình hình làm việc
7. **Hoàn thành/Lưu trữ (Archived)**: Hoàn thành hợp đồng, bỏ trốn, về trước hạn

## Kiến thức chuyên sâu
- **Thực tập sinh kỹ năng (技能実習)**: 3-5 năm
- **Kỹ năng đặc định (特定技能)**: SSW1 (5 năm), SSW2 (không giới hạn)
- **OTIT, Nghiệp đoàn, Luật lao động Nhật**
- **Trạng thái học viên**: Đăng ký mới, Đang học, Dừng, Hủy, Bảo lưu, Đang ở Nhật, Rời công ty

## CẤU TRÚC MENU CHÍNH XÁC
1. Tổng quan (/) - KPI, biểu đồ
2. Học viên (/trainees) - Danh sách, lọc theo giai đoạn
3. Đơn hàng (/orders) - Đơn tuyển dụng
4. Đối tác (/partners) - Công ty, Nghiệp đoàn, Ngành nghề
5. Đào tạo (/education) - Lớp, giáo viên, điểm danh, điểm thi
6. KTX (/dormitory) - Ký túc xá
7. Tình trạng hồ sơ (/legal) - Hồ sơ pháp lý
8. Sau xuất cảnh (/post-departure) - Học viên tại Nhật
9. Cẩm nang (/handbook)
10. Blacklist (/violations)
11. Báo cáo (/reports) - CHỈ tra cứu theo mã học viên, KHÔNG có thống kê
12. Từ điển (/glossary)
13. Công đoàn nội bộ (/internal-union)
14. Quản trị (/admin)

## Quy tắc trả lời
1. LUÔN trả lời bằng tiếng Việt
2. Khi có DỮ LIỆU HỆ THỐNG, trả lời với số liệu cụ thể từ dữ liệu đó
3. **TUYỆT ĐỐI KHÔNG bịa tên, mã học viên, hoặc số liệu.** Nếu dữ liệu trả về total=0 hoặc list rỗng, hãy nói rõ "Không có dữ liệu" hoặc "Chưa có học viên nào"
4. **CHỈ liệt kê tên/mã học viên nếu chúng CÓ TRONG dữ liệu hệ thống được cung cấp.** Không tự nghĩ ra tên
5. Không tiết lộ PII: CCCD, hộ chiếu, SĐT, email
6. CHỈ hướng dẫn menu/chức năng THỰC SỰ TỒN TẠI
7. Ngắn gọn, rõ ràng, đi thẳng vào vấn đề`;

// ============================================================
// Data query engine - phân tích câu hỏi và truy vấn DB
// ============================================================

interface QueryResult {
  label: string;
  data: unknown;
}

function extractYearMonth(text: string): { year?: number; month?: number } {
  const result: { year?: number; month?: number } = {};
  
  // Extract year: "năm 2026", "2026", "năm nay" etc.
  const yearMatch = text.match(/(?:năm\s+)?(\d{4})/);
  if (yearMatch) result.year = parseInt(yearMatch[1]);
  
  // Extract month: "tháng 2", "tháng 12", "t2", "T12"
  const monthMatch = text.match(/tháng\s+(\d{1,2})/i);
  if (monthMatch) result.month = parseInt(monthMatch[1]);
  
  return result;
}

type SupabaseClient = ReturnType<typeof createClient>;

async function querySystemData(userMessage: string, supabase: SupabaseClient): Promise<QueryResult[]> {
  const msg = userMessage.toLowerCase();
  const results: QueryResult[] = [];
  const { year, month } = extractYearMonth(msg);

  // Keywords detection
  const isAboutDeparture = /xuất cảnh|departure|đi nhật|sang nhật|bay/.test(msg);
  const isAboutRegistration = /đăng ký|tuyển|tuyển dụng|tuyển sinh|đăng kí|nhập học|registration/.test(msg);
  const isAboutInterview = /phỏng vấn|đậu|trúng tuyển|interview|pass/.test(msg);
  const isAboutTrainee = /học viên|thực tập sinh|tts|trainee|bao nhiêu|tổng|số lượng/.test(msg);
  const isAboutAbscond = /bỏ trốn|trốn|abscon/.test(msg);
  const isAboutReturn = /về nước|về trước|hoàn thành|return|early/.test(msg);
  const isAboutClass = /lớp|class|đào tạo|training|giáo viên|teacher/.test(msg);
  const isAboutDormitory = /ktx|ký túc|dormitory|phòng/.test(msg);
  const isAboutOrder = /đơn hàng|order|đơn tuyển/.test(msg);
  const isAboutCompany = /công ty|company|đối tác|partner/.test(msg);
  const isAboutStage = /giai đoạn|stage|trạng thái|tình trạng/.test(msg);

  try {
    // 1. Departure queries
    if (isAboutDeparture) {
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, departure_date, progression_stage', { count: 'exact' })
          .gte('departure_date', startDate)
          .lt('departure_date', endDate)
          .limit(50);
        results.push({ label: `Học viên xuất cảnh tháng ${month}/${year}`, data: { total: count, list: data } });
      } else if (year) {
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, departure_date, progression_stage', { count: 'exact' })
          .gte('departure_date', `${year}-01-01`)
          .lt('departure_date', `${year + 1}-01-01`)
          .limit(50);
        results.push({ label: `Học viên xuất cảnh năm ${year}`, data: { total: count, list: data } });
      } else {
        const { count } = await supabase
          .from('trainees')
          .select('*', { count: 'exact', head: true })
          .not('departure_date', 'is', null);
        results.push({ label: 'Tổng học viên đã xuất cảnh', data: { total: count } });
      }
    }

    // 2. Registration queries - SSOT: dùng registration_date (khớp view dashboard_monthly_combined)
    if (isAboutRegistration) {
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, registration_date', { count: 'exact' })
          .not('registration_date', 'is', null)
          .gte('registration_date', startDate)
          .lt('registration_date', endDate)
          .limit(50);
        results.push({ label: `Học viên đăng ký tháng ${month}/${year}`, data: { total: count ?? 0, list: data ?? [] } });
      } else if (year) {
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, registration_date', { count: 'exact' })
          .not('registration_date', 'is', null)
          .gte('registration_date', `${year}-01-01`)
          .lt('registration_date', `${year + 1}-01-01`)
          .limit(50);
        results.push({ label: `Học viên đăng ký năm ${year}`, data: { total: count ?? 0, list: data ?? [] } });
      }
    }

    // 3. Interview pass queries
    if (isAboutInterview) {
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, interview_pass_date', { count: 'exact' })
          .gte('interview_pass_date', startDate)
          .lt('interview_pass_date', endDate)
          .limit(50);
        results.push({ label: `Học viên đậu phỏng vấn tháng ${month}/${year}`, data: { total: count, list: data } });
      } else if (year) {
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, interview_pass_date', { count: 'exact' })
          .gte('interview_pass_date', `${year}-01-01`)
          .lt('interview_pass_date', `${year + 1}-01-01`)
          .limit(50);
        results.push({ label: `Học viên đậu phỏng vấn năm ${year}`, data: { total: count, list: data } });
      }
    }

    // 4. Abscond queries
    if (isAboutAbscond) {
      if (year) {
        const { data, count } = await supabase
          .from('trainees')
          .select('full_name, trainee_code, absconded_date', { count: 'exact' })
          .gte('absconded_date', `${year}-01-01`)
          .lt('absconded_date', `${year + 1}-01-01`)
          .limit(50);
        results.push({ label: `Học viên bỏ trốn năm ${year}`, data: { total: count, list: data } });
      } else {
        const { count } = await supabase
          .from('trainees')
          .select('*', { count: 'exact', head: true })
          .eq('progression_stage', 'Bỏ trốn');
        results.push({ label: 'Tổng học viên bỏ trốn', data: { total: count } });
      }
    }

    // 5. Return queries
    if (isAboutReturn) {
      if (year) {
        const { count: earlyCount } = await supabase
          .from('trainees')
          .select('*', { count: 'exact', head: true })
          .gte('early_return_date', `${year}-01-01`)
          .lt('early_return_date', `${year + 1}-01-01`);
        const { count: completedCount } = await supabase
          .from('trainees')
          .select('*', { count: 'exact', head: true })
          .gte('return_date', `${year}-01-01`)
          .lt('return_date', `${year + 1}-01-01`);
        results.push({ label: `Về nước năm ${year}`, data: { early_return: earlyCount, completed: completedCount } });
      }
    }

    // 6. Stage counts (general trainee questions)
    if (isAboutStage || (isAboutTrainee && !isAboutDeparture && !isAboutRegistration && !isAboutInterview && !isAboutAbscond && !isAboutReturn)) {
      const { data } = await supabase.from('trainee_stage_counts').select('*');
      results.push({ label: 'Số lượng học viên theo giai đoạn', data });
    }

    // 7. Class info
    if (isAboutClass) {
      const { data: classes, count } = await supabase
        .from('classes')
        .select('name, code, status, level, start_date', { count: 'exact' })
        .eq('status', 'active')
        .limit(20);
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      results.push({ label: 'Thông tin đào tạo', data: { active_classes: count, active_teachers: teacherCount, classes } });
    }

    // 8. Dormitory info
    if (isAboutDormitory) {
      const { data } = await supabase.from('dormitories_with_occupancy').select('*');
      results.push({ label: 'Thông tin KTX', data });
    }

    // 9. Order info
    if (isAboutOrder) {
      if (year) {
        const { data, count } = await supabase
          .from('orders')
          .select('code, status, quantity, expected_interview_date', { count: 'exact' })
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year + 1}-01-01`)
          .limit(20);
        results.push({ label: `Đơn hàng năm ${year}`, data: { total: count, list: data } });
      } else {
        const { count: activeCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        const { count: totalCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        results.push({ label: 'Đơn hàng', data: { total: totalCount, active: activeCount } });
      }
    }

    // 10. Company/Partner info
    if (isAboutCompany) {
      const { count: companyCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      const { count: unionCount } = await supabase
        .from('unions')
        .select('*', { count: 'exact', head: true });
      results.push({ label: 'Đối tác', data: { companies: companyCount, unions: unionCount } });
    }

  } catch (err) {
    console.error('Query error:', err);
  }

  return results;
}

// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client for user validation
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for data queries (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    const { data: hasPermission, error: permError } = await authClient.rpc(
      "has_menu_permission",
      { _user_id: userId, _menu_key: "ai_assistant", _permission: "view" }
    );

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({ error: "Bạn không có quyền sử dụng Trợ lý AI. Liên hệ Admin để được cấp quyền." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY chưa được cấu hình" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query system data based on the latest user message
    const latestUserMsg = messages[messages.length - 1]?.content || "";
    const queryResults = await querySystemData(latestUserMsg, serviceClient);

    let dataContext = "";
    if (queryResults.length > 0) {
      dataContext = "\n\n## DỮ LIỆU HỆ THỐNG (kết quả truy vấn thực tế từ database)\n";
      for (const r of queryResults) {
        dataContext += `\n### ${r.label}\n\`\`\`json\n${JSON.stringify(r.data, null, 2)}\n\`\`\`\n`;
      }
      dataContext += "\nHãy dùng dữ liệu trên để trả lời câu hỏi. Nêu con số cụ thể, liệt kê tên nếu có. Không bịa số liệu.";
    }

    const gatewayMessages = [
      { role: "system", content: SYSTEM_PROMPT + dataContext },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: gatewayMessages,
      }),
    });

    if (!gatewayRes.ok) {
      const errorText = await gatewayRes.text();
      console.error("Lovable AI Gateway error:", gatewayRes.status, errorText);

      if (gatewayRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI đang quá tải. Vui lòng thử lại sau vài giây." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (gatewayRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Hết quota AI. Vui lòng liên hệ admin để nạp thêm credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Lỗi AI Gateway: ${gatewayRes.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gatewayData = await gatewayRes.json();
    const reply =
      gatewayData?.choices?.[0]?.message?.content ||
      "Xin lỗi, tôi không thể trả lời lúc này.";

    const userMsg = messages[messages.length - 1];
    const sid = sessionId || crypto.randomUUID();

    await authClient.from("ai_chat_messages").insert([
      { user_id: userId, role: "user", content: userMsg.content, session_id: sid },
      { user_id: userId, role: "assistant", content: reply, session_id: sid },
    ]);

    return new Response(
      JSON.stringify({ reply, sessionId: sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI Chat error:", err);
    return new Response(
      JSON.stringify({ error: "Lỗi hệ thống. Vui lòng thử lại." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
