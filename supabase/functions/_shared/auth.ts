import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Shared authentication utility for Edge Functions.
 * Validates JWT tokens and returns the authenticated user.
 */
export async function requireAuth(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized: Invalid or expired token");
  }

  return { user, supabase };
}

/**
 * CORS helper for Edge Functions.
 * Validates origin against allowed domains.
 */
const ALLOWED_ORIGINS = [
  "https://erpmekong.lovable.app",
  "https://id-preview--9f3f1469-8172-4000-a36b-0ee267d0ded9.lovable.app",
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(
    (o) =>
      origin === o ||
      origin.endsWith(".lovable.app") ||
      origin.endsWith(".lovableproject.com")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
