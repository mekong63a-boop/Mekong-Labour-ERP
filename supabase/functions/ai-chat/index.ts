import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống Mekong Labour ERP - hệ thống quản lý thực tập sinh lao động Nhật Bản.

Bạn có kiến thức về:
- Quản lý học viên (trainees): mã học viên, thông tin cá nhân, giai đoạn (tuyển dụng → đào tạo → xử lý visa → xuất cảnh → tại Nhật → lưu trữ)
- Đơn hàng (orders): công ty tiếp nhận, nghiệp đoàn, ngành nghề
- Đối tác: công ty Nhật, nghiệp đoàn, ngành nghề
- Giáo dục: lớp học, giáo viên, điểm danh, điểm thi
- Ký túc xá (dormitory): phòng, giường, nhận/trả phòng
- Pháp chế: hồ sơ giấy tờ, OTIT, Nyukan, COE, Visa
- Sổ tay hướng dẫn (handbook)
- Công đoàn nội bộ
- Báo cáo & thống kê

Quy tắc trả lời:
1. Trả lời bằng tiếng Việt trừ khi được hỏi bằng ngôn ngữ khác
2. Ngắn gọn, rõ ràng, thực tế
3. Nếu không biết chính xác, hãy nói rõ và gợi ý cách tìm trong hệ thống
4. Không tiết lộ thông tin nhạy cảm (PII) của học viên
5. Hướng dẫn người dùng đến đúng menu/chức năng trong hệ thống khi cần`;

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
