import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Heartbeat cập nhật bảng public.user_sessions để System Monitor hiển thị đúng số người đang online.
 * Chạy ở mọi trang (sau đăng nhập) để không phụ thuộc việc người dùng có mở /admin hay không.
 */
export function useSessionHeartbeat(options?: { intervalMs?: number }) {
  useEffect(() => {
    const intervalMs = options?.intervalMs ?? 60_000;

    let cancelled = false;

    const updateSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // IP (public) - best-effort
      let ipAddress: string | null = null;
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = (await ipResponse.json()) as { ip?: string };
        ipAddress = ipData.ip ?? null;
      } catch {
        // ignore
      }

      const userAgent = navigator.userAgent;

      await supabase
        .from("user_sessions")
        .upsert(
          {
            user_id: user.id,
            last_seen_at: new Date().toISOString(),
            is_active: true,
            ip_address: ipAddress,
            user_agent: userAgent,
          },
          {
            onConflict: "user_id",
          }
        );
    };

    // run immediately + schedule
    void updateSession();
    const t = window.setInterval(() => void updateSession(), intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [options?.intervalMs]);
}
