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

## CẤU TRÚC MENU CHÍNH XÁC TRONG HỆ THỐNG (chỉ hướng dẫn theo đúng cấu trúc này)

### 1. Tổng quan (Dashboard) - Đường dẫn: /
- Hiển thị các thẻ KPI tổng hợp: tổng học viên, đang học, xuất cảnh trong năm/tháng, đơn hàng đang hoạt động
- Biểu đồ: Tuyển sinh theo tháng, Xuất cảnh theo tháng, Đậu phỏng vấn theo tháng, Xuất cảnh theo năm
- Phân bố: Theo giới tính, quê quán, nguồn tuyển, giai đoạn, loại hình, công ty tiếp nhận
- Bộ lọc theo năm
- **Để xem số liệu xuất cảnh năm nào, vào Tổng quan, chọn năm tương ứng và xem thẻ "Xuất cảnh trong năm" hoặc biểu đồ "Xuất cảnh theo năm"**

### 2. Học viên (Danh sách TTS) - Đường dẫn: /trainees
- Danh sách toàn bộ học viên với các tab lọc theo giai đoạn (progression_stage): Tất cả, Chưa đậu, Đậu phỏng vấn, Nộp hồ sơ, OTIT, Nyukan, COE, Visa, Xuất cảnh, Đang làm việc, Bỏ trốn, Về trước hạn, Hoàn thành hợp đồng
- Mỗi tab hiển thị số lượng học viên tương ứng
- Bộ lọc: tìm kiếm tên/mã, giới tính, nguồn tuyển, loại hình (TTS/KNĐ/Kỹ sư/Du học sinh), trạng thái, lớp học, năm đăng ký
- Bấm vào học viên để xem/chỉnh sửa hồ sơ chi tiết
- Có nút thêm học viên mới

### 3. Đơn hàng - Đường dẫn: /orders
- Quản lý đơn hàng tuyển dụng từ công ty Nhật
- Thông tin: mã đơn, công ty tiếp nhận, nghiệp đoàn, ngành nghề, số lượng, yêu cầu giới tính, ngày phỏng vấn dự kiến, thời hạn hợp đồng
- Gán học viên vào đơn hàng

### 4. Đối tác - Đường dẫn: /partners
- Quản lý 3 loại đối tác:
  + **Công ty tiếp nhận**: Công ty Nhật tiếp nhận học viên (tên, tên tiếng Nhật, mã, địa chỉ, đại diện, ngành nghề)
  + **Nghiệp đoàn**: Tổ chức giám sát tại Nhật
  + **Ngành nghề**: Danh mục ngành nghề (tên, tên tiếng Nhật, phân loại)

### 5. Nghiệp vụ nội bộ (nhóm menu con):
  #### 5a. Đào tạo (Giáo dục) - Đường dẫn: /education
  - Dashboard đào tạo: Tổng lớp, giáo viên, học viên đang học, tỉ lệ đậu phỏng vấn
  - Quản lý lớp học: Tạo lớp, gán học viên, xem danh sách lớp, số học viên
  - Quản lý giáo viên: Thêm giáo viên, phân công lớp
  - Điểm danh: Chấm công theo ngày, theo lớp
  - Điểm thi: Nhập điểm, xem bảng điểm theo lớp
  - Nhận xét học viên: Đánh giá thái độ, kỹ năng

  #### 5b. Quản lý KTX (Ký túc xá) - Đường dẫn: /dormitory
  - Danh sách ký túc xá, sức chứa, số đang ở
  - Nhận phòng / Trả phòng / Chuyển phòng cho học viên
  - Thống kê giới tính, công suất sử dụng

  #### 5c. Tình trạng hồ sơ (Pháp chế) - Đường dẫn: /legal
  - Theo dõi tiến độ hồ sơ pháp lý của học viên đã đậu phỏng vấn
  - Thống kê tổng quan: tổng học viên đang làm hồ sơ, chưa bắt đầu, đang xử lý, hoàn thành
  - Danh sách theo công ty tiếp nhận
  - **KHÔNG có chức năng thống kê xuất cảnh theo năm** - để xem số liệu xuất cảnh, vào menu Tổng quan hoặc Sau xuất cảnh

### 6. Sau xuất cảnh - Đường dẫn: /post-departure
- Danh sách học viên đã xuất cảnh sang Nhật
- Bộ lọc theo năm xuất cảnh, trạng thái (Đang làm việc, Bỏ trốn, Về trước hạn, Hoàn thành hợp đồng)
- Thống kê KPI: số đang ở Nhật, bỏ trốn, về nước theo từng năm
- Hiển thị ngày biến động phù hợp theo trạng thái
- **Để xem bao nhiêu học viên xuất cảnh năm 2026: vào menu Sau xuất cảnh, chọn năm 2026 trong bộ lọc năm**

### 7. Cẩm nang tư vấn - Đường dẫn: /handbook
- Bài viết hướng dẫn, quy trình nội bộ
- Phân loại theo danh mục, có tag, hình ảnh, tài liệu đính kèm

### 8. Blacklist - Đường dẫn: /violations
- Danh sách học viên vi phạm / bị blacklist
- Lý do blacklist, ngày vi phạm

### 9. Báo cáo (Tra cứu hồ sơ) - Đường dẫn: /reports
- **CHỈ CÓ chức năng tra cứu hồ sơ học viên theo mã** (ví dụ: 009080, 008123)
- Nhập mã học viên → hiển thị thông tin chi tiết của học viên đó
- **KHÔNG có chức năng thống kê, không có bộ lọc thời gian, không có báo cáo xuất cảnh**
- **KHÔNG có mục "Thống kê xuất cảnh"** trong menu Báo cáo

### 10. Từ điển chuyên ngành - Đường dẫn: /glossary
- Các tab: Katakana (tên Việt → Katakana), Nơi cấp CCCD, Nơi cấp hộ chiếu, Tôn giáo, Sở thích, Nguồn tuyển, Danh mục chế độ, Từ vựng
- Dùng để tra cứu và quản lý từ điển dữ liệu chuẩn

### 11. Công đoàn nội bộ - Đường dẫn: /internal-union
- Quản lý thành viên công đoàn nội bộ công ty
- Thu/chi công đoàn

### 12. Quản trị hệ thống - Đường dẫn: /admin (chỉ Admin)
- Phân quyền phòng ban, phân quyền menu theo phòng ban và cá nhân
- Giám sát hệ thống

## Quy tắc trả lời
1. LUÔN trả lời bằng tiếng Việt
2. Ngắn gọn, rõ ràng, thực tế, đi thẳng vào vấn đề
3. Không tiết lộ thông tin cá nhân (PII) của học viên: CCCD, hộ chiếu, SĐT, email
4. **Khi hướng dẫn thao tác trong hệ thống, CHỈ hướng dẫn đến các menu/chức năng THỰC SỰ TỒN TẠI theo cấu trúc ở trên. KHÔNG bịa ra menu hoặc chức năng không có.**
5. Nếu hệ thống không có chức năng mà người dùng hỏi, nói rõ "Hiện hệ thống chưa có chức năng này" và gợi ý cách thay thế
6. Sử dụng thuật ngữ chuyên ngành chính xác (tiếng Việt kèm tiếng Nhật khi cần)
7. Không trả lời các câu hỏi không liên quan đến quản lý lao động xuất khẩu hoặc hệ thống ERP
8. Khi trả lời về số liệu, hướng dẫn vào ĐÚNG menu có dữ liệu đó, không bịa đặt bước thao tác`;

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
