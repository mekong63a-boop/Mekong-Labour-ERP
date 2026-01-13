import { Tables } from "@/integrations/supabase/types";

export type Trainee = Tables<"trainees">;

export type UserRole = "consultant" | "sales" | "legal" | "manager" | "admin";

// Hardcoded role for UI visibility - replace with auth later
export const CURRENT_ROLE: UserRole = "admin";
