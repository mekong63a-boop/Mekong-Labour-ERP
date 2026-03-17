import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const IP_CACHE_KEY = "mekong_cached_ip";

async function fetchPublicIp(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) return cached;

    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const ipData = (await ipResponse.json()) as { ip?: string };
    const ip = ipData.ip ?? null;
    if (ip) sessionStorage.setItem(IP_CACHE_KEY, ip);
    return ip;
  } catch {
    return null;
  }
}

export async function upsertUserSession(userId: string) {
  const ipAddress = await fetchPublicIp();
  const userAgent = navigator.userAgent;

  await supabase
    .from("user_sessions")
    .upsert(
      {
        user_id: userId,
        last_seen_at: new Date().toISOString(),
        is_active: true,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      {
        onConflict: "user_id",
      }
    );
}

export async function markUserSessionInactive(userId: string) {
  await supabase
    .from("user_sessions")
    .update({
      is_active: false,
      last_seen_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Heartbeat cập nhật bảng public.user_sessions để System Monitor hiển thị đúng số người đang online.
 * Chạy ở mọi trang (sau đăng nhập) để không phụ thuộc việc người dùng có mở /admin hay không.
 */
export function useSessionHeartbeat(options?: { intervalMs?: number }) {
  useEffect(() => {
    const intervalMs = options?.intervalMs ?? 60_000;

    let cancelled = false;

    const updateSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      await upsertUserSession(user.id);
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
