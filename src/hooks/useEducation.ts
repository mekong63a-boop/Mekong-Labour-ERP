import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Teacher = Tables<"teachers">;
export type Class = Tables<"classes">;
export type Attendance = Tables<"attendance">;

// Teachers hooks
export function useTeachers() {
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
    },
  });
}

// Classes hooks
export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Class[];
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
export function useEducationStats() {
  return useQuery({
    queryKey: ["education-stats"],
    queryFn: async () => {
      const [teachersRes, classesRes] = await Promise.all([
        supabase.from("teachers").select("id, status", { count: "exact" }),
        supabase.from("classes").select("id, status", { count: "exact" }),
      ]);

      const activeTeachers = teachersRes.data?.filter(t => t.status === "Đang làm việc").length || 0;
      const activeClasses = classesRes.data?.filter(c => c.status === "Đang hoạt động").length || 0;

      return {
        totalTeachers: teachersRes.count || 0,
        activeTeachers,
        totalClasses: classesRes.count || 0,
        activeClasses,
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
    },
  });
}

// Available trainees (not in any class)
export function useAvailableTrainees() {
  return useQuery({
    queryKey: ["available-trainees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, class_id")
        .is("class_id", null)
        .order("full_name");
      if (error) throw error;
      return data;
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
