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
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
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
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      cccd_places: {
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
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
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
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_public"
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
          industry: string | null
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
          industry?: string | null
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
          industry?: string | null
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
      department_members: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          department: string
          id: string
          role_in_department: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          department: string
          id?: string
          role_in_department: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          department?: string
          id?: string
          role_in_department?: string
          user_id?: string
        }
        Relationships: []
      }
      department_menu_permissions: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          can_create: boolean | null
          can_delete: boolean | null
          can_export: boolean | null
          can_update: boolean | null
          can_view: boolean | null
          department: string
          id: string
          menu_key: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          department: string
          id?: string
          menu_key: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          department?: string
          id?: string
          menu_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_menu_permissions_menu_key_fkey"
            columns: ["menu_key"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["key"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          name_japanese: string | null
          order_index: number | null
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          name_japanese?: string | null
          order_index?: number | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          name_japanese?: string | null
          order_index?: number | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      dormitories: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dormitory_residents: {
        Row: {
          bed_number: string | null
          check_in_date: string
          check_out_date: string | null
          created_at: string
          dormitory_id: string
          from_dormitory_id: string | null
          id: string
          notes: string | null
          room_number: string | null
          status: string | null
          trainee_id: string
          transfer_reason: string | null
          updated_at: string
        }
        Insert: {
          bed_number?: string | null
          check_in_date?: string
          check_out_date?: string | null
          created_at?: string
          dormitory_id: string
          from_dormitory_id?: string | null
          id?: string
          notes?: string | null
          room_number?: string | null
          status?: string | null
          trainee_id: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Update: {
          bed_number?: string | null
          check_in_date?: string
          check_out_date?: string | null
          created_at?: string
          dormitory_id?: string
          from_dormitory_id?: string | null
          id?: string
          notes?: string | null
          room_number?: string | null
          status?: string | null
          trainee_id?: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dormitory_residents_dormitory_id_fkey"
            columns: ["dormitory_id"]
            isOneToOne: false
            referencedRelation: "dormitories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dormitory_residents_dormitory_id_fkey"
            columns: ["dormitory_id"]
            isOneToOne: false
            referencedRelation: "dormitories_with_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dormitory_residents_from_dormitory_id_fkey"
            columns: ["from_dormitory_id"]
            isOneToOne: false
            referencedRelation: "dormitories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dormitory_residents_from_dormitory_id_fkey"
            columns: ["from_dormitory_id"]
            isOneToOne: false
            referencedRelation: "dormitories_with_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dormitory_residents_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      education_history: {
        Row: {
          created_at: string
          end_month: number | null
          end_year: number | null
          id: string
          level: string | null
          major: string | null
          school_name: string
          start_month: number | null
          start_year: number | null
          trainee_id: string
        }
        Insert: {
          created_at?: string
          end_month?: number | null
          end_year?: number | null
          id?: string
          level?: string | null
          major?: string | null
          school_name: string
          start_month?: number | null
          start_year?: number | null
          trainee_id: string
        }
        Update: {
          created_at?: string
          end_month?: number | null
          end_year?: number | null
          id?: string
          level?: string | null
          major?: string | null
          school_name?: string
          start_month?: number | null
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
      enrollment_history: {
        Row: {
          action_date: string
          action_type: string
          class_id: string | null
          created_at: string
          created_by: string | null
          from_class_id: string | null
          id: string
          notes: string | null
          to_class_id: string | null
          trainee_id: string
        }
        Insert: {
          action_date?: string
          action_type: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          from_class_id?: string | null
          id?: string
          notes?: string | null
          to_class_id?: string | null
          trainee_id: string
        }
        Update: {
          action_date?: string
          action_type?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          from_class_id?: string | null
          id?: string
          notes?: string | null
          to_class_id?: string | null
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "enrollment_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_history_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "enrollment_history_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_history_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "enrollment_history_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_history_trainee_id_fkey"
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
          living_together: boolean | null
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
          living_together?: boolean | null
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
          living_together?: boolean | null
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
      handbook_entries: {
        Row: {
          category: string | null
          content: string | null
          cost_info: string | null
          created_at: string
          created_by: string | null
          document_urls: string[] | null
          id: string
          image_urls: string[] | null
          is_published: boolean | null
          order_index: number | null
          support_policy: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          cost_info?: string | null
          created_at?: string
          created_by?: string | null
          document_urls?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          order_index?: number | null
          support_policy?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          cost_info?: string | null
          created_at?: string
          created_by?: string | null
          document_urls?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_published?: boolean | null
          order_index?: number | null
          support_policy?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hobbies: {
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
            foreignKeyName: "fk_interview_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interview_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interview_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_interview_job_category"
            columns: ["job_category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interview_union"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
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
      login_attempts: {
        Row: {
          attempt_time: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      menus: {
        Row: {
          created_at: string | null
          icon: string | null
          key: string
          label: string
          order_index: number | null
          parent_key: string | null
          path: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          key: string
          label: string
          order_index?: number | null
          parent_key?: string | null
          path: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          key?: string
          label?: string
          order_index?: number | null
          parent_key?: string | null
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_parent_key_fkey"
            columns: ["parent_key"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["key"]
          },
        ]
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
            foreignKeyName: "fk_orders_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_orders_job_category"
            columns: ["job_category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_union"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
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
      passport_places: {
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
      pending_registrations: {
        Row: {
          full_name: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          read_by: string | null
          registered_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          registered_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          registered_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_categories: {
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
      religions: {
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
          class_end_date: string | null
          class_start_date: string | null
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
          class_end_date?: string | null
          class_start_date?: string | null
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
          class_end_date?: string | null
          class_start_date?: string | null
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
      test_scores: {
        Row: {
          class_id: string
          created_at: string
          evaluation: string | null
          id: string
          max_score: number
          notes: string | null
          score: number | null
          test_date: string
          test_name: string
          trainee_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          evaluation?: string | null
          id?: string
          max_score?: number
          notes?: string | null
          score?: number | null
          test_date?: string
          test_name: string
          trainee_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          evaluation?: string | null
          id?: string
          max_score?: number
          notes?: string | null
          score?: number | null
          test_date?: string
          test_name?: string
          trainee_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "test_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_scores_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      trainee_reviews: {
        Row: {
          blacklist_reason: string | null
          class_id: string | null
          content: string
          created_at: string
          id: string
          is_blacklisted: boolean
          rating: number | null
          review_type: string
          reviewed_by: string | null
          trainee_id: string
          updated_at: string
        }
        Insert: {
          blacklist_reason?: string | null
          class_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          rating?: number | null
          review_type?: string
          reviewed_by?: string | null
          trainee_id: string
          updated_at?: string
        }
        Update: {
          blacklist_reason?: string | null
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          rating?: number | null
          review_type?: string
          reviewed_by?: string | null
          trainee_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainee_reviews_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "trainee_reviews_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainee_reviews_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      trainees: {
        Row: {
          absconded_date: string | null
          birth_date: string | null
          birthplace: string | null
          blood_group: string | null
          cancel_date: string | null
          cccd_date: string | null
          cccd_number: string | null
          cccd_place: string | null
          class_attitude: string | null
          class_id: string | null
          coe_date: string | null
          contract_end_date: string | null
          contract_term: number | null
          created_at: string | null
          current_address: string | null
          current_situation: string | null
          departure_date: string | null
          discipline: string | null
          dkhd_code: string | null
          dkhd_date: string | null
          dkhd_number: string | null
          document_status: string | null
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
          gender_identity: string | null
          glasses: string | null
          greeting_attitude: string | null
          guarantor_name_jp: string | null
          guarantor_name_vn: string | null
          guarantor_phone: string | null
          health_status: string | null
          hearing: string | null
          height: number | null
          hepatitis_b: string | null
          high_school_name: string | null
          high_school_period: string | null
          hobbies: string | null
          household_address: string | null
          id: string
          interview_count: number | null
          interview_pass_date: string | null
          is_locked: boolean | null
          japanese_certificate: string | null
          job_category_id: string | null
          jp_certificate_period: string | null
          jp_certificate_school: string | null
          jp_course_1: string | null
          jp_course_2: string | null
          jp_school_1: string | null
          jp_school_2: string | null
          legal_address_jp: string | null
          legal_address_vn: string | null
          line_qr_url: string | null
          locked_at: string | null
          marital_status: string | null
          notes: string | null
          nyukan_entry_date: string | null
          otit_entry_date: string | null
          pants_size: string | null
          parent_phone_1: string | null
          parent_phone_1_relation: string | null
          parent_phone_2: string | null
          parent_phone_2_relation: string | null
          parent_phone_3: string | null
          parent_phone_3_relation: string | null
          passport_date: string | null
          passport_number: string | null
          passport_place: string | null
          permanent_address: string | null
          permanent_address_new: string | null
          personality: string | null
          phone: string | null
          photo_url: string | null
          policy_category: string | null
          prior_residence_status: string | null
          progression_stage:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          ptl_date: string | null
          ptl_number: string | null
          receiving_company_id: string | null
          recommending_company_name: string | null
          recommending_position: string | null
          recommending_representative: string | null
          registration_date: string | null
          religion: string | null
          reserve_date: string | null
          return_date: string | null
          rirekisho_remarks: string | null
          settlement_date: string | null
          shirt_size: string | null
          shoe_size: string | null
          simple_status: Database["public"]["Enums"]["simple_status"] | null
          smoking: string | null
          source: string | null
          ssw_certificate: string | null
          stop_date: string | null
          tattoo: boolean | null
          tattoo_description: string | null
          temp_address: string | null
          tidiness: string | null
          tpc_code: string | null
          tpc_cv_number: string | null
          tpc_issue_date: string | null
          tpc_request_date: string | null
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
          cancel_date?: string | null
          cccd_date?: string | null
          cccd_number?: string | null
          cccd_place?: string | null
          class_attitude?: string | null
          class_id?: string | null
          coe_date?: string | null
          contract_end_date?: string | null
          contract_term?: number | null
          created_at?: string | null
          current_address?: string | null
          current_situation?: string | null
          departure_date?: string | null
          discipline?: string | null
          dkhd_code?: string | null
          dkhd_date?: string | null
          dkhd_number?: string | null
          document_status?: string | null
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
          gender_identity?: string | null
          glasses?: string | null
          greeting_attitude?: string | null
          guarantor_name_jp?: string | null
          guarantor_name_vn?: string | null
          guarantor_phone?: string | null
          health_status?: string | null
          hearing?: string | null
          height?: number | null
          hepatitis_b?: string | null
          high_school_name?: string | null
          high_school_period?: string | null
          hobbies?: string | null
          household_address?: string | null
          id?: string
          interview_count?: number | null
          interview_pass_date?: string | null
          is_locked?: boolean | null
          japanese_certificate?: string | null
          job_category_id?: string | null
          jp_certificate_period?: string | null
          jp_certificate_school?: string | null
          jp_course_1?: string | null
          jp_course_2?: string | null
          jp_school_1?: string | null
          jp_school_2?: string | null
          legal_address_jp?: string | null
          legal_address_vn?: string | null
          line_qr_url?: string | null
          locked_at?: string | null
          marital_status?: string | null
          notes?: string | null
          nyukan_entry_date?: string | null
          otit_entry_date?: string | null
          pants_size?: string | null
          parent_phone_1?: string | null
          parent_phone_1_relation?: string | null
          parent_phone_2?: string | null
          parent_phone_2_relation?: string | null
          parent_phone_3?: string | null
          parent_phone_3_relation?: string | null
          passport_date?: string | null
          passport_number?: string | null
          passport_place?: string | null
          permanent_address?: string | null
          permanent_address_new?: string | null
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          policy_category?: string | null
          prior_residence_status?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          ptl_date?: string | null
          ptl_number?: string | null
          receiving_company_id?: string | null
          recommending_company_name?: string | null
          recommending_position?: string | null
          recommending_representative?: string | null
          registration_date?: string | null
          religion?: string | null
          reserve_date?: string | null
          return_date?: string | null
          rirekisho_remarks?: string | null
          settlement_date?: string | null
          shirt_size?: string | null
          shoe_size?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          smoking?: string | null
          source?: string | null
          ssw_certificate?: string | null
          stop_date?: string | null
          tattoo?: boolean | null
          tattoo_description?: string | null
          temp_address?: string | null
          tidiness?: string | null
          tpc_code?: string | null
          tpc_cv_number?: string | null
          tpc_issue_date?: string | null
          tpc_request_date?: string | null
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
          cancel_date?: string | null
          cccd_date?: string | null
          cccd_number?: string | null
          cccd_place?: string | null
          class_attitude?: string | null
          class_id?: string | null
          coe_date?: string | null
          contract_end_date?: string | null
          contract_term?: number | null
          created_at?: string | null
          current_address?: string | null
          current_situation?: string | null
          departure_date?: string | null
          discipline?: string | null
          dkhd_code?: string | null
          dkhd_date?: string | null
          dkhd_number?: string | null
          document_status?: string | null
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
          gender_identity?: string | null
          glasses?: string | null
          greeting_attitude?: string | null
          guarantor_name_jp?: string | null
          guarantor_name_vn?: string | null
          guarantor_phone?: string | null
          health_status?: string | null
          hearing?: string | null
          height?: number | null
          hepatitis_b?: string | null
          high_school_name?: string | null
          high_school_period?: string | null
          hobbies?: string | null
          household_address?: string | null
          id?: string
          interview_count?: number | null
          interview_pass_date?: string | null
          is_locked?: boolean | null
          japanese_certificate?: string | null
          job_category_id?: string | null
          jp_certificate_period?: string | null
          jp_certificate_school?: string | null
          jp_course_1?: string | null
          jp_course_2?: string | null
          jp_school_1?: string | null
          jp_school_2?: string | null
          legal_address_jp?: string | null
          legal_address_vn?: string | null
          line_qr_url?: string | null
          locked_at?: string | null
          marital_status?: string | null
          notes?: string | null
          nyukan_entry_date?: string | null
          otit_entry_date?: string | null
          pants_size?: string | null
          parent_phone_1?: string | null
          parent_phone_1_relation?: string | null
          parent_phone_2?: string | null
          parent_phone_2_relation?: string | null
          parent_phone_3?: string | null
          parent_phone_3_relation?: string | null
          passport_date?: string | null
          passport_number?: string | null
          passport_place?: string | null
          permanent_address?: string | null
          permanent_address_new?: string | null
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          policy_category?: string | null
          prior_residence_status?: string | null
          progression_stage?:
            | Database["public"]["Enums"]["progression_stage"]
            | null
          ptl_date?: string | null
          ptl_number?: string | null
          receiving_company_id?: string | null
          recommending_company_name?: string | null
          recommending_position?: string | null
          recommending_representative?: string | null
          registration_date?: string | null
          religion?: string | null
          reserve_date?: string | null
          return_date?: string | null
          rirekisho_remarks?: string | null
          settlement_date?: string | null
          shirt_size?: string | null
          shoe_size?: string | null
          simple_status?: Database["public"]["Enums"]["simple_status"] | null
          smoking?: string | null
          source?: string | null
          ssw_certificate?: string | null
          stop_date?: string | null
          tattoo?: boolean | null
          tattoo_description?: string | null
          temp_address?: string | null
          tidiness?: string | null
          tpc_code?: string | null
          tpc_cv_number?: string | null
          tpc_issue_date?: string | null
          tpc_request_date?: string | null
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
        Relationships: [
          {
            foreignKeyName: "fk_trainees_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_student_counts"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "fk_trainees_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["receiving_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["receiving_company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["receiving_company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_trainees_job_category"
            columns: ["job_category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_union"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
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
      user_access_versions: {
        Row: {
          updated_at: string
          user_id: string
        }
        Insert: {
          updated_at?: string
          user_id: string
        }
        Update: {
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_menu_permissions: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          can_create: boolean | null
          can_delete: boolean | null
          can_export: boolean | null
          can_update: boolean | null
          can_view: boolean | null
          id: string
          menu_key: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          id?: string
          menu_key: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_update?: boolean | null
          can_view?: boolean | null
          id?: string
          menu_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_menu_permissions_menu_key_fkey"
            columns: ["menu_key"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["key"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string
          department: string | null
          id: string
          is_primary_admin: boolean | null
          is_senior_staff: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_primary_admin?: boolean | null
          is_senior_staff?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_primary_admin?: boolean | null
          is_senior_staff?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen_at?: string
          user_agent?: string | null
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
          income: string | null
          position: string | null
          start_date: string | null
          trainee_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          end_date?: string | null
          id?: string
          income?: string | null
          position?: string | null
          start_date?: string | null
          trainee_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          end_date?: string | null
          id?: string
          income?: string | null
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
      class_student_counts: {
        Row: {
          class_id: string | null
          current_students: number | null
        }
        Relationships: []
      }
      companies_public: {
        Row: {
          code: string | null
          country: string | null
          created_at: string | null
          id: string | null
          name: string | null
          name_japanese: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          name_japanese?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          name_japanese?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_available_years: {
        Row: {
          year: number | null
        }
        Relationships: []
      }
      dashboard_departed_by_departure_year: {
        Row: {
          female_count: number | null
          male_count: number | null
          total: number | null
          year: number | null
        }
        Relationships: []
      }
      dashboard_education_total: {
        Row: {
          total_studying: number | null
        }
        Relationships: []
      }
      dashboard_monthly_combined: {
        Row: {
          departure: number | null
          month_date: string | null
          month_label: string | null
          recruitment: number | null
        }
        Relationships: []
      }
      dashboard_monthly_passed: {
        Row: {
          month_date: string | null
          month_label: string | null
          passed_count: number | null
        }
        Relationships: []
      }
      dashboard_trainee_by_birthplace: {
        Row: {
          birthplace: string | null
          count: number | null
        }
        Relationships: []
      }
      dashboard_trainee_by_company: {
        Row: {
          company_id: string | null
          company_name: string | null
          count: number | null
          year: number | null
        }
        Relationships: []
      }
      dashboard_trainee_by_gender: {
        Row: {
          count: number | null
          gender: string | null
        }
        Relationships: []
      }
      dashboard_trainee_by_source: {
        Row: {
          count: number | null
          source: string | null
        }
        Relationships: []
      }
      dashboard_trainee_by_type: {
        Row: {
          count: number | null
          trainee_type: string | null
        }
        Relationships: []
      }
      dashboard_trainee_departures_monthly: {
        Row: {
          departures: number | null
          month_date: string | null
          month_label: string | null
        }
        Relationships: []
      }
      dashboard_trainee_kpis: {
        Row: {
          active_orders: number | null
          departed_female: number | null
          departed_male: number | null
          departed_this_month: number | null
          departed_this_year: number | null
          registered_this_month: number | null
          registered_this_year: number | null
          stage_archived: number | null
          stage_departed: number | null
          stage_in_japan: number | null
          stage_post_departure: number | null
          stage_ready_to_depart: number | null
          stage_recruited: number | null
          stage_visa_processing: number | null
          status_studying: number | null
          studying_female: number | null
          studying_male: number | null
          total_female: number | null
          total_male: number | null
          total_trainees: number | null
          type_engineer: number | null
          type_knd: number | null
          type_student: number | null
          type_tts: number | null
          type_tts3: number | null
        }
        Relationships: []
      }
      dashboard_trainee_monthly: {
        Row: {
          month_date: string | null
          month_label: string | null
          registrations: number | null
        }
        Relationships: []
      }
      dashboard_trainee_passed_monthly: {
        Row: {
          month_date: string | null
          month_label: string | null
          passed_count: number | null
        }
        Relationships: []
      }
      dormitories_with_occupancy: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string | null
          current_occupancy: number | null
          id: string | null
          name: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          current_occupancy?: never
          id?: string | null
          name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          current_occupancy?: never
          id?: string | null
          name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dormitory_gender_stats: {
        Row: {
          female_count: number | null
          male_count: number | null
          total_residents: number | null
        }
        Relationships: []
      }
      education_interview_stats: {
        Row: {
          not_passed_female: number | null
          not_passed_male: number | null
          not_passed_total: number | null
          passed_female: number | null
          passed_male: number | null
          passed_total: number | null
        }
        Relationships: []
      }
      education_stats: {
        Row: {
          active_classes: number | null
          active_teachers: number | null
          total_classes: number | null
          total_teachers: number | null
        }
        Relationships: []
      }
      legal_company_stats: {
        Row: {
          address: string | null
          code: string | null
          company_id: string | null
          docs_completed: number | null
          docs_in_progress: number | null
          docs_not_started: number | null
          interview_pass_date: string | null
          job_category_name: string | null
          name: string | null
          name_japanese: string | null
          total_passed: number | null
          union_name: string | null
          work_address: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trainees_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_trainee_by_company"
            referencedColumns: ["company_id"]
          },
        ]
      }
      legal_summary_stats: {
        Row: {
          docs_completed: number | null
          docs_in_progress: number | null
          docs_not_started: number | null
          total_all: number | null
          total_companies: number | null
          total_departed: number | null
          total_paperwork: number | null
        }
        Relationships: []
      }
      legal_trainee_type_stats: {
        Row: {
          count: number | null
          female_count: number | null
          male_count: number | null
          trainee_type: Database["public"]["Enums"]["trainee_type"] | null
        }
        Relationships: []
      }
      order_stats: {
        Row: {
          cancelled: number | null
          completed: number | null
          form_complete: number | null
          interviewed: number | null
          recruiting: number | null
          total: number | null
        }
        Relationships: []
      }
      post_departure_by_type: {
        Row: {
          count: number | null
          departure_year: string | null
          trainee_type: Database["public"]["Enums"]["trainee_type"] | null
        }
        Relationships: []
      }
      post_departure_by_type_summary: {
        Row: {
          count: number | null
          trainee_type: Database["public"]["Enums"]["trainee_type"] | null
        }
        Relationships: []
      }
      post_departure_stats_by_year: {
        Row: {
          absconded: number | null
          completed: number | null
          early_return: number | null
          total: number | null
          working: number | null
          year: string | null
        }
        Relationships: []
      }
      post_departure_summary: {
        Row: {
          absconded: number | null
          completed: number | null
          early_return: number | null
          total: number | null
          working: number | null
        }
        Relationships: []
      }
      teachers_public: {
        Row: {
          class_end_date: string | null
          class_start_date: string | null
          code: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          class_end_date?: string | null
          class_start_date?: string | null
          code?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          class_end_date?: string | null
          class_start_date?: string | null
          code?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trainee_stage_counts: {
        Row: {
          count: number | null
          progression_stage:
            | Database["public"]["Enums"]["progression_stage"]
            | null
        }
        Relationships: []
      }
      union_stats: {
        Row: {
          active_members: number | null
          balance: number | null
          total_expense: number | null
          total_income: number | null
          total_members: number | null
        }
        Relationships: []
      }
      v_trainee_interview_count: {
        Row: {
          interview_count: number | null
          trainee_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_history_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      v_trainees_registered_monthly: {
        Row: {
          month: number | null
          total_registered: number | null
          year: number | null
          year_month: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_first_admin: { Args: { _user_id: string }; Returns: boolean }
      assign_manager: {
        Args: {
          _caller_id: string
          _department: string
          _target_user_id: string
        }
        Returns: boolean
      }
      assign_sub_admin: {
        Args: { _caller_id: string; _target_user_id: string }
        Returns: boolean
      }
      can_delete: { Args: { _menu_key: string }; Returns: boolean }
      can_insert: { Args: { _menu_key: string }; Returns: boolean }
      can_manage_department: {
        Args: { _department: string; _user_id: string }
        Returns: boolean
      }
      can_staff_edit: {
        Args: {
          _record_created_at: string
          _record_id: string
          _table_name: string
          _user_id: string
        }
        Returns: boolean
      }
      can_update: { Args: { _menu_key: string }; Returns: boolean }
      can_view: { Args: { _menu_key: string }; Returns: boolean }
      can_view_sensitive_data: { Args: { _user_id: string }; Returns: boolean }
      can_view_trainee_pii: { Args: never; Returns: boolean }
      check_login_rate_limit: {
        Args: { _identifier: string; _ip_address?: string }
        Returns: Json
      }
      count_sub_admins: { Args: never; Returns: number }
      current_user_is_senior: { Args: never; Returns: boolean }
      export_trainees_report: {
        Args: { filters?: Json; selected_columns: Json }
        Returns: Json
      }
      finalize_interview_draft: {
        Args: {
          p_company_id?: string
          p_expected_entry_month?: string
          p_interview_date: string
          p_job_category_id?: string
          p_result?: string
          p_trainee_id: string
          p_union_id?: string
        }
        Returns: string
      }
      get_confirmed_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_department_counts: {
        Args: never
        Returns: {
          department: string
          manager_count: number
          staff_count: number
          total_count: number
        }[]
      }
      get_department_members: {
        Args: { _department: string }
        Returns: {
          assigned_at: string
          email: string
          full_name: string
          id: string
          role_in_department: string
          user_id: string
        }[]
      }
      get_department_menu_permissions: {
        Args: { _department: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_update: boolean
          can_view: boolean
          department: string
          id: string
          menu_key: string
        }[]
      }
      get_effective_menu_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_update: boolean
          can_view: boolean
          menu_key: string
        }[]
      }
      get_pending_registration_count: { Args: never; Returns: number }
      get_pending_users: {
        Args: never
        Returns: {
          created_at: string
          email_confirmed_at: string
          full_name: string
          user_email: string
          user_id: string
        }[]
      }
      get_trainee_full_profile: {
        Args: { p_trainee_code: string }
        Returns: Json
      }
      get_user_department: { Args: { _user_id: string }; Returns: string }
      get_user_effective_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_update: boolean
          can_view: boolean
          menu_key: string
          source: string
        }[]
      }
      get_user_menu_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_update: boolean
          can_view: boolean
          menu_key: string
        }[]
      }
      get_user_merged_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_update: boolean
          can_view: boolean
          menu_key: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_admin: { Args: never; Returns: boolean }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_menu_permission: {
        Args: { _menu_key: string; _permission?: string; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_check: { Args: { _user_id: string }; Returns: boolean }
      is_authenticated: { Args: never; Returns: boolean }
      is_manager_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_primary_admin: { Args: { _user_id: string }; Returns: boolean }
      is_primary_admin_check: { Args: { _user_id: string }; Returns: boolean }
      is_regular_staff: { Args: never; Returns: boolean }
      is_senior_staff: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_teacher_or_higher: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _description: string
          _new_data: Json
          _old_data: Json
          _record_id: string
          _table_name: string
        }
        Returns: string
      }
      mask_audit_sensitive_fields: { Args: { data: Json }; Returns: Json }
      mask_cccd: { Args: { cccd_value: string }; Returns: string }
      mask_email: { Args: { email_value: string }; Returns: string }
      mask_passport: { Args: { passport_value: string }; Returns: string }
      mask_phone: { Args: { phone_value: string }; Returns: string }
      record_login_attempt: {
        Args: { _identifier: string; _ip_address?: string; _success: boolean }
        Returns: undefined
      }
      rpc_auto_checkout_dormitory: {
        Args: { p_trainee_id: string }
        Returns: undefined
      }
      rpc_auto_create_dormitory_pending: {
        Args: { p_trainee_id: string }
        Returns: undefined
      }
      save_department_menu_permissions: {
        Args: { _assigned_by: string; _department: string; _permissions: Json }
        Returns: undefined
      }
      touch_user_access_version: {
        Args: { _user_id: string }
        Returns: undefined
      }
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
        | "collaborator"
      employment_status: "probation" | "active" | "suspended" | "left"
      gender: "Male" | "Female" | "Other"
      processing_stage: "OTIT" | "Nyukan" | "COE" | "Visa"
      progression_stage:
        | "ChuaDau"
        | "DauPV"
        | "NopHS"
        | "OTIT"
        | "Nyukan"
        | "COE"
        | "Visa"
        | "DaXuatCanh"
        | "DangLamViec"
        | "HoanThanhHD"
        | "BoTron"
        | "VeNuocSom"
        | "DaoTao"
      simple_status:
        | "DangKyMoi"
        | "DangHoc"
        | "BaoLuu"
        | "DungChuongTrinh"
        | "KhongHoc"
        | "Huy"
        | "DangONhat"
        | "RoiCongTy"
        | "Đã đậu"
        | "DaDau"
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
      trainee_type: "TTS" | "KyNang" | "KySu" | "DuHoc" | "TTS3"
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
        "collaborator",
      ],
      employment_status: ["probation", "active", "suspended", "left"],
      gender: ["Male", "Female", "Other"],
      processing_stage: ["OTIT", "Nyukan", "COE", "Visa"],
      progression_stage: [
        "ChuaDau",
        "DauPV",
        "NopHS",
        "OTIT",
        "Nyukan",
        "COE",
        "Visa",
        "DaXuatCanh",
        "DangLamViec",
        "HoanThanhHD",
        "BoTron",
        "VeNuocSom",
        "DaoTao",
      ],
      simple_status: [
        "DangKyMoi",
        "DangHoc",
        "BaoLuu",
        "DungChuongTrinh",
        "KhongHoc",
        "Huy",
        "DangONhat",
        "RoiCongTy",
        "Đã đậu",
        "DaDau",
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
      trainee_type: ["TTS", "KyNang", "KySu", "DuHoc", "TTS3"],
      user_account_status: ["pending", "active", "suspended", "deleted"],
      user_role: ["admin", "staff"],
    },
  },
} as const
