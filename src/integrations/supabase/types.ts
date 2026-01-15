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
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          status: string
          trainee_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          status?: string
          trainee_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          trainee_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string
          created_at: string
          id: string
          role: string | null
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          role?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          role?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          code: string
          created_at: string
          expected_end_date: string | null
          id: string
          level: string | null
          max_students: number | null
          name: string
          schedule: string | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          level?: string | null
          max_students?: number | null
          name: string
          schedule?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          level?: string | null
          max_students?: number | null
          name?: string
          schedule?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          code: string
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          name_japanese: string | null
          notes: string | null
          phone: string | null
          position: string | null
          representative: string | null
          status: string | null
          updated_at: string
          work_address: string | null
        }
        Insert: {
          address?: string | null
          code: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          name_japanese?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          representative?: string | null
          status?: string | null
          updated_at?: string
          work_address?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          name_japanese?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          representative?: string | null
          status?: string | null
          updated_at?: string
          work_address?: string | null
        }
        Relationships: []
      }
      education_history: {
        Row: {
          created_at: string
          end_year: number | null
          id: string
          level: string | null
          major: string | null
          school_name: string
          start_year: number | null
          trainee_id: string
        }
        Insert: {
          created_at?: string
          end_year?: number | null
          id?: string
          level?: string | null
          major?: string | null
          school_name: string
          start_year?: number | null
          trainee_id: string
        }
        Update: {
          created_at?: string
          end_year?: number | null
          id?: string
          level?: string | null
          major?: string | null
          school_name?: string
          start_year?: number | null
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_history_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          birth_year: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          income: string | null
          location: string | null
          occupation: string | null
          relationship: string
          trainee_id: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          income?: string | null
          location?: string | null
          occupation?: string | null
          relationship: string
          trainee_id: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          income?: string | null
          location?: string | null
          occupation?: string | null
          relationship?: string
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_history: {
        Row: {
          company_id: string | null
          created_at: string
          expected_entry_month: string | null
          id: string
          interview_date: string | null
          job_category_id: string | null
          notes: string | null
          result: string | null
          trainee_id: string
          union_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          expected_entry_month?: string | null
          id?: string
          interview_date?: string | null
          job_category_id?: string | null
          notes?: string | null
          result?: string | null
          trainee_id: string
          union_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          expected_entry_month?: string | null
          id?: string
          interview_date?: string | null
          job_category_id?: string | null
          notes?: string | null
          result?: string | null
          trainee_id?: string
          union_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_job_category_id_fkey"
            columns: ["job_category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      japan_relatives: {
        Row: {
          address_japan: string | null
          age: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          relationship: string | null
          residence_status: string | null
          trainee_id: string
        }
        Insert: {
          address_japan?: string | null
          age?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          relationship?: string | null
          residence_status?: string | null
          trainee_id: string
        }
        Update: {
          address_japan?: string | null
          age?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          relationship?: string | null
          residence_status?: string | null
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "japan_relatives_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          name_japanese: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_japanese?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_japanese?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      katakana_names: {
        Row: {
          created_at: string
          id: string
          katakana: string
          updated_at: string
          vietnamese_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          katakana: string
          updated_at?: string
          vietnamese_name: string
        }
        Update: {
          created_at?: string
          id?: string
          katakana?: string
          updated_at?: string
          vietnamese_name?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          code: string
          company_id: string | null
          contract_term: number | null
          created_at: string
          expected_interview_date: string | null
          gender_requirement: string | null
          id: string
          image_url: string | null
          job_category_id: string | null
          notes: string | null
          quantity: number | null
          status: string | null
          union_id: string | null
          updated_at: string
          work_address: string | null
        }
        Insert: {
          code: string
          company_id?: string | null
          contract_term?: number | null
          created_at?: string
          expected_interview_date?: string | null
          gender_requirement?: string | null
          id?: string
          image_url?: string | null
          job_category_id?: string | null
          notes?: string | null
          quantity?: number | null
          status?: string | null
          union_id?: string | null
          updated_at?: string
          work_address?: string | null
        }
        Update: {
          code?: string
          company_id?: string | null
          contract_term?: number | null
          created_at?: string
          expected_interview_date?: string | null
          gender_requirement?: string | null
          id?: string
          image_url?: string | null
          job_category_id?: string | null
          notes?: string | null
          quantity?: number | null
          status?: string | null
          union_id?: string | null
          updated_at?: string
          work_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_job_category_id_fkey"
            columns: ["job_category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          code: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          specialty: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trainees: {
        Row: {
          absconded_date: string | null
          birth_date: string | null
          birthplace: string | null
          blood_group: string | null
          cccd_date: string | null
          cccd_number: string | null
          cccd_place: string | null
          class_id: string | null
          coe_date: string | null
          contract_end_date: string | null
          contract_term: number | null
          created_at: string | null
          current_address: string | null
          current_situation: string | null
          departure_date: string | null
          document_submission_date: string | null
          dominant_hand: string | null
          drinking: string | null
          early_return_date: string | null
          early_return_reason: string | null
          education_level: string | null
          email: string | null
          enrollment_status: string | null
          entry_date: string | null
          ethnicity: string | null
          expected_entry_month: string | null
          expected_return_date: string | null
          facebook: string | null
          full_name: string
          furigana: string | null
          gender: string | null
          health_status: string | null
          height: number | null
          hobbies: string | null
          household_address: string | null
          id: string
          interview_count: number | null
          interview_pass_date: string | null
          job_category_id: string | null
          marital_status: string | null
          notes: string | null
          nyukan_entry_date: string | null
          otit_entry_date: string | null
          parent_phone_1: string | null
          parent_phone_2: string | null
          passport_date: string | null
          passport_number: string | null
          permanent_address: string | null
          phone: string | null
          photo_url: string | null
          progression_stage:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          receiving_company_id: string | null
          registration_date: string | null
          return_date: string | null
          simple_status: Database["public"]["Enums"]["simple_status"] | null
          smoking: string | null
          source: string | null
          tattoo: boolean | null
          temp_address: string | null
          trainee_code: string
          trainee_type: Database["public"]["Enums"]["trainee_type"] | null
          union_id: string | null
          updated_at: string | null
          visa_date: string | null
          vision_left: number | null
          vision_right: number | null
          weight: number | null
          zalo: string | null
        }
        Insert: {
          absconded_date?: string | null
          birth_date?: string | null
          birthplace?: string | null
          blood_group?: string | null
          cccd_date?: string | null
          cccd_number?: string | null
          cccd_place?: string | null
          class_id?: string | null
          coe_date?: string | null
          contract_end_date?: string | null
          contract_term?: number | null
          created_at?: string | null
          current_address?: string | null
          current_situation?: string | null
          departure_date?: string | null
          document_submission_date?: string | null
          dominant_hand?: string | null
          drinking?: string | null
          early_return_date?: string | null
          early_return_reason?: string | null
          education_level?: string | null
          email?: string | null
          enrollment_status?: string | null
          entry_date?: string | null
          ethnicity?: string | null
          expected_entry_month?: string | null
          expected_return_date?: string | null
          facebook?: string | null
          full_name: string
          furigana?: string | null
          gender?: string | null
          health_status?: string | null
          height?: number | null
          hobbies?: string | null
          household_address?: string | null
          id?: string
          interview_count?: number | null
          interview_pass_date?: string | null
          job_category_id?: string | null
          marital_status?: string | null
          notes?: string | null
          nyukan_entry_date?: string | null
          otit_entry_date?: string | null
          parent_phone_1?: string | null
          parent_phone_2?: string | null
          passport_date?: string | null
          passport_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          photo_url?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          receiving_company_id?: string | null
          registration_date?: string | null
          return_date?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          smoking?: string | null
          source?: string | null
          tattoo?: boolean | null
          temp_address?: string | null
          trainee_code: string
          trainee_type?: Database["public"]["Enums"]["trainee_type"] | null
          union_id?: string | null
          updated_at?: string | null
          visa_date?: string | null
          vision_left?: number | null
          vision_right?: number | null
          weight?: number | null
          zalo?: string | null
        }
        Update: {
          absconded_date?: string | null
          birth_date?: string | null
          birthplace?: string | null
          blood_group?: string | null
          cccd_date?: string | null
          cccd_number?: string | null
          cccd_place?: string | null
          class_id?: string | null
          coe_date?: string | null
          contract_end_date?: string | null
          contract_term?: number | null
          created_at?: string | null
          current_address?: string | null
          current_situation?: string | null
          departure_date?: string | null
          document_submission_date?: string | null
          dominant_hand?: string | null
          drinking?: string | null
          early_return_date?: string | null
          early_return_reason?: string | null
          education_level?: string | null
          email?: string | null
          enrollment_status?: string | null
          entry_date?: string | null
          ethnicity?: string | null
          expected_entry_month?: string | null
          expected_return_date?: string | null
          facebook?: string | null
          full_name?: string
          furigana?: string | null
          gender?: string | null
          health_status?: string | null
          height?: number | null
          hobbies?: string | null
          household_address?: string | null
          id?: string
          interview_count?: number | null
          interview_pass_date?: string | null
          job_category_id?: string | null
          marital_status?: string | null
          notes?: string | null
          nyukan_entry_date?: string | null
          otit_entry_date?: string | null
          parent_phone_1?: string | null
          parent_phone_2?: string | null
          passport_date?: string | null
          passport_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          photo_url?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          receiving_company_id?: string | null
          registration_date?: string | null
          return_date?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          smoking?: string | null
          source?: string | null
          tattoo?: boolean | null
          temp_address?: string | null
          trainee_code?: string
          trainee_type?: Database["public"]["Enums"]["trainee_type"] | null
          union_id?: string | null
          updated_at?: string | null
          visa_date?: string | null
          vision_left?: number | null
          vision_right?: number | null
          weight?: number | null
          zalo?: string | null
        }
        Relationships: []
      }
      union_members: {
        Row: {
          birth_date: string | null
          created_at: string
          end_date: string | null
          full_name: string
          hometown: string | null
          id: string
          join_date: string
          member_code: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          end_date?: string | null
          full_name: string
          hometown?: string | null
          id?: string
          join_date?: string
          member_code: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          end_date?: string | null
          full_name?: string
          hometown?: string | null
          id?: string
          join_date?: string
          member_code?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      union_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          member_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          member_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          member_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "union_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "union_members"
            referencedColumns: ["id"]
          },
        ]
      }
      unions: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          name_japanese: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          name_japanese?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          name_japanese?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          category: string | null
          created_at: string
          id: string
          japanese: string
          updated_at: string
          vietnamese: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          japanese: string
          updated_at?: string
          vietnamese: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          japanese?: string
          updated_at?: string
          vietnamese?: string
        }
        Relationships: []
      }
      work_history: {
        Row: {
          company_name: string
          created_at: string
          end_date: string | null
          id: string
          position: string | null
          start_date: string | null
          trainee_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          end_date?: string | null
          id?: string
          position?: string | null
          start_date?: string | null
          trainee_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          end_date?: string | null
          id?: string
          position?: string | null
          start_date?: string | null
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_history_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_first_admin: { Args: { _user_id: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "teacher"
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
      app_role: ["admin", "manager", "staff", "teacher"],
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
