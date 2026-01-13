export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      trainees: {
        Row: {
          birth_date: string | null
          created_at: string | null
          departure_date: string | null
          expected_entry_month: string | null
          facebook: string | null
          full_name: string
          furigana: string | null
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          progression_stage:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          return_date: string | null
          simple_status: Database["public"]["Enums"]["simple_status"] | null
          trainee_code: string
          trainee_type: Database["public"]["Enums"]["trainee_type"] | null
          updated_at: string | null
          zalo: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          departure_date?: string | null
          expected_entry_month?: string | null
          facebook?: string | null
          full_name: string
          furigana?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          return_date?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          trainee_code: string
          trainee_type?: Database["public"]["Enums"]["trainee_type"] | null
          updated_at?: string | null
          zalo?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          departure_date?: string | null
          expected_entry_month?: string | null
          facebook?: string | null
          full_name?: string
          furigana?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          return_date?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          trainee_code?: string
          trainee_type?: Database["public"]["Enums"]["trainee_type"] | null
          updated_at?: string | null
          zalo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      department_type:
        | "recruitment"
        | "training"
        | "legal"
        | "dormitory"
        | "post_departure"
        | "admin"
      employment_status: "probation" | "active" | "suspended" | "left"
      gender: "Male" | "Female" | "Other"
      processing_stage: "OTIT" | "Nyukan" | "COE" | "Visa"
      progression_stage:
        | "Chưa đậu"
        | "Đậu phỏng vấn"
        | "Nộp hồ sơ"
        | "OTIT"
        | "Nyukan"
        | "COE"
        | "Visa"
        | "Xuất cảnh"
        | "Đang làm việc"
        | "Hoàn thành hợp đồng"
        | "Bỏ trốn"
        | "Về trước hạn"
      simple_status:
        | "Đăng ký mới"
        | "Đang học"
        | "Bảo lưu"
        | "Dừng chương trình"
        | "Không học"
        | "Hủy"
        | "Đang ở Nhật"
        | "Rời công ty"
      trainee_status:
        | "New"
        | "Interview_Passed"
        | "Training"
        | "Waiting_Flight"
        | "Departed"
        | "Finished"
        | "Blacklist"
        | "Absconded"
        | "Early_Return"
        | "Completed"
      trainee_type:
        | "Thực tập sinh"
        | "Kỹ năng đặc định"
        | "Kỹ sư"
        | "Du học sinh"
        | "Thực tập sinh số 3"
      user_account_status: "pending" | "active" | "suspended" | "deleted"
      user_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      department_type: [
        "recruitment",
        "training",
        "legal",
        "dormitory",
        "post_departure",
        "admin",
      ],
      employment_status: ["probation", "active", "suspended", "left"],
      gender: ["Male", "Female", "Other"],
      processing_stage: ["OTIT", "Nyukan", "COE", "Visa"],
      progression_stage: [
        "Chưa đậu",
        "Đậu phỏng vấn",
        "Nộp hồ sơ",
        "OTIT",
        "Nyukan",
        "COE",
        "Visa",
        "Xuất cảnh",
        "Đang làm việc",
        "Hoàn thành hợp đồng",
        "Bỏ trốn",
        "Về trước hạn",
      ],
      simple_status: [
        "Đăng ký mới",
        "Đang học",
        "Bảo lưu",
        "Dừng chương trình",
        "Không học",
        "Hủy",
        "Đang ở Nhật",
        "Rời công ty",
      ],
      trainee_status: [
        "New",
        "Interview_Passed",
        "Training",
        "Waiting_Flight",
        "Departed",
        "Finished",
        "Blacklist",
        "Absconded",
        "Early_Return",
        "Completed",
      ],
      trainee_type: [
        "Thực tập sinh",
        "Kỹ năng đặc định",
        "Kỹ sư",
        "Du học sinh",
        "Thực tập sinh số 3",
      ],
      user_account_status: ["pending", "active", "suspended", "deleted"],
      user_role: ["admin", "staff"],
    },
  },
} as const
