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

## Quy trình đào tạo & xuất cảnh (theo thứ tự)
1. **Tuyển dụng (Recruited)**: Tiếp nhận hồ sơ ứng viên, sơ tuyển ban đầu, đánh giá sức khỏe, kiểm tra lý lịch
2. **Đào tạo (Training)**: Học tiếng Nhật (N5→N4→N3), kỹ năng nghề, văn hóa Nhật, thể lực. Thời gian 4-12 tháng tùy đơn hàng
3. **Phỏng vấn đơn hàng (Interview)**: Chuẩn bị hồ sơ ứng tuyển, phỏng vấn với công ty Nhật (trực tiếp/online), thông báo kết quả
4. **Trúng tuyển & Hồ sơ pháp lý**:
   - Nộp hồ sơ → OTIT (Tổ chức thực tập kỹ năng quốc tế) duyệt kế hoạch thực tập
   - Nyukan (Cục xuất nhập cảnh Nhật) xét duyệt tư cách lưu trú
   - COE (Certificate of Eligibility) - Giấy chứng nhận tư cách lưu trú
   - Visa - Xin visa tại Đại sứ quán/Lãnh sự quán Nhật
5. **Xuất cảnh (Departure)**: Đặt vé, chuẩn bị hành lý, hướng dẫn trước xuất cảnh, đưa ra sân bay
6. **Tại Nhật (Post-departure)**: Theo dõi tình hình làm việc, hỗ trợ từ xa, xử lý vấn đề phát sinh, gia hạn hợp đồng
7. **Hoàn thành/Lưu trữ (Archived)**: Hoàn thành hợp đồng về nước, hoặc các trường hợp đặc biệt (bỏ trốn, về trước hạn)

## Kiến thức chuyên sâu
- **Chế độ Thực tập sinh kỹ năng (技能実習)**: Thời hạn 3-5 năm, chia theo giai đoạn 1→2→3
- **Chế độ Kỹ năng đặc định (特定技能)**: SSW1 (5 năm), SSW2 (không giới hạn), 16 ngành nghề
- **Quy định OTIT**: Kế hoạch thực tập, giám sát, bảo vệ quyền lợi thực tập sinh
- **Nghiệp đoàn (組合)**: Vai trò giám sát, hỗ trợ thực tập sinh tại Nhật
- **Luật lao động Nhật**: Lương tối thiểu, giờ làm việc, bảo hiểm xã hội, quyền lợi người lao động
- **Trạng thái học viên**: Đăng ký mới, Đang học, Dừng chương trình, Hủy, Không học, Bảo lưu, Đang ở Nhật, Rời công ty

## Hệ thống ERP Mekong - Các chức năng chính
- **Quản lý học viên** (menu: Danh sách TTS): Hồ sơ cá nhân, trạng thái, giai đoạn workflow
- **Đơn hàng** (menu: Đơn hàng): Quản lý đơn hàng từ công ty Nhật, phân bổ học viên
- **Đối tác** (menu: Đối tác): Công ty tiếp nhận, nghiệp đoàn, ngành nghề
- **Giáo dục** (menu: Giáo dục): Lớp học, giáo viên, điểm danh, điểm thi, nhận xét
- **Ký túc xá** (menu: Ký túc xá): Quản lý phòng, giường, nhận/trả phòng
- **Pháp chế** (menu: Pháp chế): Theo dõi hồ sơ giấy tờ pháp lý
- **Sau xuất cảnh** (menu: Sau xuất cảnh): Theo dõi học viên tại Nhật
- **Báo cáo** (menu: Báo cáo): Thống kê, xuất dữ liệu
- **Dashboard**: Tổng quan số liệu theo giai đoạn, công ty, thời gian

## Quy tắc trả lời
1. LUÔN trả lời bằng tiếng Việt
2. Ngắn gọn, rõ ràng, thực tế, đi thẳng vào vấn đề
3. Không tiết lộ thông tin cá nhân (PII) của học viên: CCCD, hộ chiếu, SĐT, email
4. Khi người dùng hỏi về thao tác trong hệ thống, hướng dẫn đến đúng menu/chức năng
5. Nếu không biết chính xác, nói rõ và gợi ý cách tìm trong hệ thống
6. Sử dụng thuật ngữ chuyên ngành chính xác (tiếng Việt kèm tiếng Nhật khi cần)
7. Không trả lời các câu hỏi không liên quan đến quản lý lao động xuất khẩu hoặc hệ thống ERP`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Check menu permission
    const { data: hasPermission, error: permError } = await supabase.rpc(
      "has_menu_permission",
      { _user_id: userId, _menu_key: "ai_assistant", _permission: "view" }
    );

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({ error: "Bạn không có quyền sử dụng Trợ lý AI. Liên hệ Admin để được cấp quyền." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY chưa được cấu hình" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages for Lovable AI Gateway (OpenAI-compatible format)
    const gatewayMessages = [
      { role: "system", content: SYSTEM_PROMPT },
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

    // Save messages to database
    const userMsg = messages[messages.length - 1];
    const sid = sessionId || crypto.randomUUID();

    await supabase.from("ai_chat_messages").insert([
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
