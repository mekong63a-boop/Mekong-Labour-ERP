import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Teacher = Tables<"teachers">;
export type Class = Tables<"classes">;
export type Attendance = Tables<"attendance">;

/**
 * DEPRECATED: Education realtime đã được tắt để tối ưu hiệu suất.
 * Chỉ attendance còn realtime (qua useSystemRealtime trong MainLayout).
 * Các bảng classes, teachers, test_scores sử dụng manual refresh.
 */
export function useEducationRealtime() {
  // Realtime cho education tables đã được tắt để tối ưu hiệu suất
  // Sử dụng useManualRefresh().refreshEducation() để refresh thủ công
  console.log('[Realtime] Education realtime disabled - attendance still works via system hook');
}

// Teachers hooks
export function useTeachers() {
  useEducationRealtime();
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Teacher[];
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacher: TablesInsert<"teachers">) => {
      const { data, error } = await supabase
        .from("teachers")
        .insert(teacher)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["education-stats"] });
    },
  });
}

// Classes hooks
export function useClasses() {
  useEducationRealtime();
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      // Get classes with teachers
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          *,
          class_teachers(
            teacher:teachers(full_name)
          )
        `)
        .order("created_at", { ascending: false });
      if (classesError) throw classesError;
      
      // SYSTEM RULE: Sĩ số lớp học tính từ DB view class_student_counts
      const { data: countsData, error: countsError } = await supabase
        .from("class_student_counts")
        .select("class_id, current_students");
      if (countsError) throw countsError;
      
      const studentCounts: Record<string, number> = {};
      countsData?.forEach(c => {
        if (c.class_id) {
          studentCounts[c.class_id] = c.current_students || 0;
        }
      });
      
      // Merge counts and teacher names into classes
      const classesWithCounts = classesData.map(c => {
        const teacherNames = (c.class_teachers as any[])
          ?.map(ct => ct.teacher?.full_name)
          .filter(Boolean)
          .join(", ") || "";
        return {
          ...c,
          current_students: studentCounts[c.id] || 0,
          teacher_names: teacherNames,
        };
      });
      
      return classesWithCounts as (Class & { current_students: number; teacher_names: string })[];
    },
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Class;
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classData: TablesInsert<"classes">) => {
      const { data, error } = await supabase
        .from("classes")
        .insert(classData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["education-stats"] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"classes"> }) => {
      const { data, error } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", data.id] });
      queryClient.invalidateQueries({ queryKey: ["education-stats"] });
    },
  });
}

// Attendance hooks
export function useAttendance(classId: string, month: string) {
  return useQuery({
    queryKey: ["attendance", classId, month],
    queryFn: async () => {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", classId)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!classId && !!month,
  });
}

export function useUpsertAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendance: TablesInsert<"attendance">) => {
      const { data, error } = await supabase
        .from("attendance")
        .upsert(attendance, { onConflict: "trainee_id,class_id,date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ trainee_id, class_id, date }: { trainee_id: string; class_id: string; date: string }) => {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("trainee_id", trainee_id)
        .eq("class_id", class_id)
        .eq("date", date);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

// Class students (trainees in a class)
export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, class_id")
        .eq("class_id", classId)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

// Dashboard stats
// SYSTEM RULE: Logic tính toán nằm ở Supabase view education_stats
interface EducationStatsRow {
  total_teachers: number;
  active_teachers: number;
  total_classes: number;
  active_classes: number;
}

export function useEducationStats() {
  return useQuery({
    queryKey: ["education-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_stats")
        .select("*")
        .single();

      if (error) throw error;

      return {
        totalTeachers: data?.total_teachers || 0,
        activeTeachers: data?.active_teachers || 0,
        totalClasses: data?.total_classes || 0,
        activeClasses: data?.active_classes || 0,
      };
    },
  });
}

// Delete class
export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["education-stats"] });
    },
  });
}

// Available trainees (not in any class AND eligible for assignment)
// BUSINESS RULE: Chỉ học viên có simple_status = "Đang học"

export function useAvailableTrainees() {
  return useQuery({
    queryKey: ["available-trainees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, class_id, simple_status")
        .is("class_id", null)
        .eq("simple_status", "Đang học") // Chỉ học viên đang học
        .is("departure_date", null) // Loại bỏ học viên đã xuất cảnh
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });
}

// Assign trainees to class
export function useAssignTraineesToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, traineeIds }: { classId: string; traineeIds: string[] }) => {
      const { error } = await supabase
        .from("trainees")
        .update({ class_id: classId })
        .in("id", traineeIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      queryClient.invalidateQueries({ queryKey: ["available-trainees"] });
    },
  });
}

// Remove trainee from class
export function useRemoveTraineeFromClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (traineeId: string) => {
      const { error } = await supabase
        .from("trainees")
        .update({ class_id: null })
        .eq("id", traineeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      queryClient.invalidateQueries({ queryKey: ["available-trainees"] });
    },
  });
}

// Class teachers hooks
export function useClassTeachers(classId: string) {
  return useQuery({
    queryKey: ["class-teachers", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_teachers")
        .select(`
          id,
          role,
          teacher:teachers(id, code, full_name, specialty)
        `)
        .eq("class_id", classId);
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useAssignTeacherToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, teacherId, role }: { classId: string; teacherId: string; role?: string }) => {
      const { error } = await supabase
        .from("class_teachers")
        .insert({ class_id: classId, teacher_id: teacherId, role: role || 'primary' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
    },
  });
}

export function useRemoveTeacherFromClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classTeacherId: string) => {
      const { error } = await supabase
        .from("class_teachers")
        .delete()
        .eq("id", classTeacherId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
    },
  });
}

// Test Scores hooks
export function useTestScores(classId: string, testName?: string) {
  return useQuery({
    queryKey: ["test-scores", classId, testName],
    queryFn: async () => {
      let query = supabase
        .from("test_scores")
        .select(`
          *,
          trainee:trainees(id, trainee_code, full_name)
        `)
        .eq("class_id", classId)
        .order("test_date", { ascending: false });
      
      if (testName) {
        query = query.eq("test_name", testName);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

export function useTestNames(classId: string) {
  return useQuery({
    queryKey: ["test-names", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_scores")
        .select("test_name, test_date, max_score")
        .eq("class_id", classId)
        .order("test_date", { ascending: false });
      
      if (error) throw error;
      
      // Get unique test names
      const uniqueTests = data.reduce((acc: any[], curr) => {
        if (!acc.find(t => t.test_name === curr.test_name)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      
      return uniqueTests;
    },
    enabled: !!classId,
  });
}

export function useUpsertTestScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (score: {
      class_id: string;
      trainee_id: string;
      test_name: string;
      test_date: string;
      max_score: number;
      score: number | null;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("test_scores")
        .upsert(score, { onConflict: "class_id,trainee_id,test_name" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-scores"] });
      queryClient.invalidateQueries({ queryKey: ["test-names"] });
    },
  });
}

export function useBulkUpsertTestScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scores: {
      class_id: string;
      trainee_id: string;
      test_name: string;
      test_date: string;
      max_score: number;
      score: number | null;
      notes?: string;
      evaluation?: string | null;
    }[]) => {
      // Process scores one by one with upsert to handle conflicts properly
      const results = [];
      for (const score of scores) {
        // First check if record exists
        const { data: existing } = await supabase
          .from("test_scores")
          .select("id")
          .eq("class_id", score.class_id)
          .eq("trainee_id", score.trainee_id)
          .eq("test_name", score.test_name)
          .maybeSingle();
        
        if (existing) {
          // Update existing record
          const { data, error } = await supabase
            .from("test_scores")
            .update({
              score: score.score,
              max_score: score.max_score,
              test_date: score.test_date,
              notes: score.notes,
              evaluation: score.evaluation,
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (error) throw error;
          results.push(data);
        } else {
          // Insert new record
          const { data, error } = await supabase
            .from("test_scores")
            .insert(score)
            .select()
            .single();
          if (error) throw error;
          results.push(data);
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-scores"] });
      queryClient.invalidateQueries({ queryKey: ["test-names"] });
    },
  });
}

// Trainee Reviews hooks
export function useTraineeReviews(traineeId?: string, classId?: string) {
  return useQuery({
    queryKey: ["trainee-reviews", traineeId, classId],
    queryFn: async () => {
      let query = supabase
        .from("trainee_reviews")
        .select(`
          *,
          trainee:trainees(id, trainee_code, full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (traineeId) {
        query = query.eq("trainee_id", traineeId);
      }
      if (classId) {
        query = query.eq("class_id", classId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!traineeId || !!classId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      trainee_id: string;
      class_id?: string;
      review_type: string;
      rating?: number;
      content: string;
      is_blacklisted?: boolean;
      blacklist_reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("trainee_reviews")
        .insert(review)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee-reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from("trainee_reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee-reviews"] });
    },
  });
}
